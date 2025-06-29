import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../plugins/auth";

// Tipos para o resultado da busca
interface SearchResults {
  clients: any[];
  cases: any[];
  documents: any[];
  appointments: any[];
}

interface SearchMeta {
  total: number;
  query: string;
  type: string;
  executionTime: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Schema para busca com validações mais rigorosas
const searchSchema = z.object({
  query: z
    .string()
    .min(2, "Query deve ter pelo menos 2 caracteres")
    .max(100, "Query muito longa"),
  type: z
    .enum(["ALL", "CLIENTS", "CASES", "DOCUMENTS", "APPOINTMENTS"])
    .default("ALL"),
  limit: z.coerce.number().min(1).max(50).default(10), // Limita para evitar sobrecarga
  page: z.coerce.number().min(1).default(1),
});

export async function searchRoutes(app: FastifyInstance) {
  // Registrar hooks de autenticação
  app.addHook("preHandler", requireAuth);

  // GET /api/search - Busca global unificada
  app.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            query: { type: "string", minLength: 2, maxLength: 100 },
            type: {
              type: "string",
              enum: ["ALL", "CLIENTS", "CASES", "DOCUMENTS", "APPOINTMENTS"],
              default: "ALL",
            },
            limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
            page: { type: "number", minimum: 1, default: 1 },
          },
          required: ["query"],
        },
        tags: ["Search"],
        summary: "Busca global unificada",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              results: {
                type: "object",
                properties: {
                  clients: { type: "array" },
                  cases: { type: "array" },
                  documents: { type: "array" },
                  appointments: { type: "array" },
                },
              },
              meta: {
                type: "object",
                properties: {
                  total: { type: "number" },
                  query: { type: "string" },
                  type: { type: "string" },
                  executionTime: { type: "number" },
                  page: { type: "number" },
                  limit: { type: "number" },
                  totalPages: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const startTime = Date.now();

      // Validar query parameters usando Zod
      const validationResult = searchSchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: {
            message: "Parâmetros inválidos",
            details: validationResult.error.issues,
          },
        });
      }

      const { query, type, limit, page } = validationResult.data;
      const userId = (request.user as any).id;
      const offset = (page - 1) * limit;

      try {
        const results: SearchResults = {
          clients: [],
          cases: [],
          documents: [],
          appointments: [],
        };

        // Função auxiliar para sanitizar a query
        const sanitizedQuery = query.trim().toLowerCase();

        // Contadores para paginação correta
        let totalClients = 0;
        let totalCases = 0;
        let totalDocuments = 0;
        let totalAppointments = 0;

        // Buscar clientes (com contagem total)
        if (type === "ALL" || type === "CLIENTS") {
          const clientSearchConditions = {
            role: "CLIENT" as const,
            isActive: true, // Apenas clientes ativos
            OR: [
              {
                name: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                clientProfile: {
                  OR: [
                    {
                      cpf: {
                        contains: sanitizedQuery,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      cnpj: {
                        contains: sanitizedQuery,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      phone: {
                        contains: sanitizedQuery,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      company: {
                        contains: sanitizedQuery,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            ],
          };

          // Buscar resultados e contagem em paralelo
          const [clientResults, clientCount] = await Promise.all([
            prisma.user.findMany({
              where: clientSearchConditions,
              include: {
                clientProfile: true,
                _count: {
                  select: {
                    assignedCases: true,
                  },
                },
              },
              take: limit,
              skip: offset,
              orderBy: { name: "asc" },
            }),
            prisma.user.count({ where: clientSearchConditions }),
          ]);

          results.clients = clientResults;
          totalClients = clientCount;
        }

        // Buscar casos (com contagem total)
        if (type === "ALL" || type === "CASES") {
          const caseSearchConditions = {
            OR: [
              {
                title: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                number: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
            ],
          };

          const [caseResults, caseCount] = await Promise.all([
            prisma.case.findMany({
              where: caseSearchConditions,
              include: {
                client: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                lawyer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                _count: {
                  select: {
                    documents: true,
                    appointments: true,
                  },
                },
              },
              take: limit,
              skip: offset,
              orderBy: { updatedAt: "desc" },
            }),
            prisma.case.count({ where: caseSearchConditions }),
          ]);

          results.cases = caseResults;
          totalCases = caseCount;
        }

        // Buscar documentos (com contagem total)
        if (type === "ALL" || type === "DOCUMENTS") {
          const documentSearchConditions = {
            OR: [
              {
                name: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                filename: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
            ],
          };

          const [documentResults, documentCount] = await Promise.all([
            prisma.document.findMany({
              where: documentSearchConditions,
              include: {
                case: {
                  select: {
                    id: true,
                    title: true,
                    number: true,
                  },
                },
                uploadedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              take: limit,
              skip: offset,
              orderBy: { createdAt: "desc" },
            }),
            prisma.document.count({ where: documentSearchConditions }),
          ]);

          results.documents = documentResults;
          totalDocuments = documentCount;
        }

        // Buscar compromissos (com contagem total)
        if (type === "ALL" || type === "APPOINTMENTS") {
          const appointmentSearchConditions = {
            OR: [
              {
                title: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: sanitizedQuery,
                  mode: "insensitive" as const,
                },
              },
            ],
          };

          const [appointmentResults, appointmentCount] = await Promise.all([
            prisma.appointment.findMany({
              where: appointmentSearchConditions,
              include: {
                case: {
                  select: {
                    id: true,
                    title: true,
                    number: true,
                  },
                },
                lawyer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              take: limit,
              skip: offset,
              orderBy: { startDate: "desc" },
            }),
            prisma.appointment.count({ where: appointmentSearchConditions }),
          ]);

          results.appointments = appointmentResults;
          totalAppointments = appointmentCount;
        }

        // Calcular totais corretos
        const grandTotal =
          totalClients + totalCases + totalDocuments + totalAppointments;
        const currentPageTotal =
          results.clients.length +
          results.cases.length +
          results.documents.length +
          results.appointments.length;
        const totalPages = Math.ceil(grandTotal / limit);

        const executionTime = Date.now() - startTime;

        const meta: SearchMeta = {
          total: grandTotal,
          query,
          type,
          executionTime,
          page,
          limit,
          totalPages,
        };

        return reply.send({
          results,
          meta,
          counts: {
            clients: totalClients,
            cases: totalCases,
            documents: totalDocuments,
            appointments: totalAppointments,
            currentPage: currentPageTotal,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor ao realizar busca",
            code: "SEARCH_ERROR",
          },
        });
      }
    }
  );

  // GET /api/search/suggestions - Sugestões de busca
  app.get(
    "/suggestions",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            query: { type: "string", minLength: 1 },
            limit: { type: "number", default: 5 },
          },
          required: ["query"],
        },
        tags: ["Search"],
        summary: "Sugestões de busca",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    type: { type: "string" },
                    subtitle: { type: "string" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Validar query parameters
      const suggestionsSchema = z.object({
        query: z
          .string()
          .min(2, "Query deve ter pelo menos 2 caracteres")
          .max(100),
        limit: z.coerce.number().min(1).max(20).default(5), // Limita sugestões
      });

      const validationResult = suggestionsSchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: {
            message: "Parâmetros inválidos",
            details: validationResult.error.issues,
          },
        });
      }

      const { query, limit } = validationResult.data;
      const sanitizedQuery = query.trim().toLowerCase();

      try {
        const suggestions: Array<{
          id: string;
          text: string;
          type: string;
          subtitle: string;
          url: string;
        }> = [];

        // Sugestões de clientes
        const clientSuggestions = await prisma.user.findMany({
          where: {
            role: "CLIENT",
            isActive: true,
            name: { contains: sanitizedQuery, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          take: Math.ceil(limit / 4),
          orderBy: { name: "asc" },
        });

        suggestions.push(
          ...clientSuggestions.map((client) => ({
            id: client.id,
            text: client.name,
            type: "client",
            subtitle: client.email,
            url: `/app/clients/${client.id}`,
          }))
        );

        // Sugestões de casos
        const caseSuggestions = await prisma.case.findMany({
          where: {
            OR: [
              { title: { contains: sanitizedQuery, mode: "insensitive" } },
              { number: { contains: sanitizedQuery, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            number: true,
          },
          take: Math.ceil(limit / 4),
          orderBy: { updatedAt: "desc" },
        });

        suggestions.push(
          ...caseSuggestions.map((case_) => ({
            id: case_.id,
            text: case_.title,
            type: "case",
            subtitle: case_.number || "",
            url: `/app/cases/${case_.id}`,
          }))
        );

        // Sugestões de documentos
        const documentSuggestions = await prisma.document.findMany({
          where: {
            OR: [
              { name: { contains: sanitizedQuery, mode: "insensitive" } },
              { filename: { contains: sanitizedQuery, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            filename: true,
          },
          take: Math.ceil(limit / 4),
          orderBy: { createdAt: "desc" },
        });

        suggestions.push(
          ...documentSuggestions.map((doc) => ({
            id: doc.id,
            text: doc.name,
            type: "document",
            subtitle: doc.filename,
            url: `/app/documents/${doc.id}`,
          }))
        );

        return reply.send({
          suggestions: suggestions.slice(0, limit),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro ao buscar sugestões",
            code: "SUGGESTIONS_ERROR",
          },
        });
      }
    }
  );
}
