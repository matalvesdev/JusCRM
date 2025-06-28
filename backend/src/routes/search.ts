import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../plugins/auth";

// Schema para busca
const searchSchema = z.object({
  query: z.string().min(1, "Query é obrigatória"),
  type: z
    .enum(["ALL", "CLIENTS", "CASES", "DOCUMENTS", "APPOINTMENTS"])
    .default("ALL"),
  limit: z.coerce.number().default(10),
  page: z.coerce.number().default(1),
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
            query: { type: "string", minLength: 1 },
            type: {
              type: "string",
              enum: ["ALL", "CLIENTS", "CASES", "DOCUMENTS", "APPOINTMENTS"],
              default: "ALL",
            },
            limit: { type: "number", default: 10 },
            page: { type: "number", default: 1 },
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
        const results: any = {
          clients: [],
          cases: [],
          documents: [],
          appointments: [],
        };

        // Buscar clientes
        if (type === "ALL" || type === "CLIENTS") {
          results.clients = await prisma.user.findMany({
            where: {
              role: "CLIENT",
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                {
                  clientProfile: {
                    OR: [
                      { cpf: { contains: query, mode: "insensitive" } },
                      { cnpj: { contains: query, mode: "insensitive" } },
                      { phone: { contains: query, mode: "insensitive" } },
                      { company: { contains: query, mode: "insensitive" } },
                    ],
                  },
                },
              ],
            },
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
          });
        }

        // Buscar casos
        if (type === "ALL" || type === "CASES") {
          results.cases = await prisma.case.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { number: { contains: query, mode: "insensitive" } },
              ],
            },
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
          });
        }

        // Buscar documentos
        if (type === "ALL" || type === "DOCUMENTS") {
          results.documents = await prisma.document.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { fileName: { contains: query, mode: "insensitive" } },
              ],
            },
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
          });
        }

        // Buscar compromissos
        if (type === "ALL" || type === "APPOINTMENTS") {
          results.appointments = await prisma.appointment.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { location: { contains: query, mode: "insensitive" } },
              ],
            },
            include: {
              case: {
                select: {
                  id: true,
                  title: true,
                  number: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            take: limit,
            skip: offset,
          });
        }

        // Calcular totais
        const total =
          results.clients.length +
          results.cases.length +
          results.documents.length +
          results.appointments.length;

        const executionTime = Date.now() - startTime;

        return reply.send({
          results,
          meta: {
            total,
            query,
            type,
            executionTime,
            page,
            limit,
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
        query: z.string().min(1),
        limit: z.coerce.number().default(5),
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

      try {
        const suggestions = [];

        // Sugestões de clientes
        const clientSuggestions = await prisma.user.findMany({
          where: {
            role: "CLIENT",
            name: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          take: Math.ceil(limit / 4),
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
              { title: { contains: query, mode: "insensitive" } },
              { number: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            number: true,
          },
          take: Math.ceil(limit / 4),
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
            title: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            title: true,
            fileName: true,
          },
          take: Math.ceil(limit / 4),
        });

        suggestions.push(
          ...documentSuggestions.map((doc) => ({
            id: doc.id,
            text: doc.title,
            type: "document",
            subtitle: doc.fileName,
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
