import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../plugins/auth";
import { prisma } from "../lib/prisma";

// Schemas de validação
const createCaseSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  type: z.enum([
    "RESCISAO_INDIRETA",
    "HORAS_EXTRAS",
    "ADICIONAL_INSALUBRIDADE",
    "ADICIONAL_PERICULOSIDADE",
    "ASSEDIO_MORAL",
    "ACIDENTE_TRABALHO",
    "EQUIPARACAO_SALARIAL",
    "DEMISSAO_SEM_JUSTA_CAUSA",
    "FGTS",
    "SEGURO_DESEMPREGO",
    "OTHER",
  ]),
  clientId: z.string(),
  assistantId: z.string().optional(),
  value: z.number().min(0).optional(),
  number: z.string().optional(), // Número do processo judicial
});

const updateCaseSchema = createCaseSchema.partial();

const casesFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"])
    .optional(),
  type: z
    .enum([
      "RESCISAO_INDIRETA",
      "HORAS_EXTRAS",
      "ADICIONAL_INSALUBRIDADE",
      "ADICIONAL_PERICULOSIDADE",
      "ASSEDIO_MORAL",
      "ACIDENTE_TRABALHO",
      "EQUIPARACAO_SALARIAL",
      "DEMISSAO_SEM_JUSTA_CAUSA",
      "FGTS",
      "SEGURO_DESEMPREGO",
      "OTHER",
    ])
    .optional(),
  clientId: z.string().optional(),
  lawyerId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export async function casesRoutes(fastify: FastifyInstance) {
  // GET /api/cases - Listar casos com filtros
  fastify.get(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { search, status, type, clientId, lawyerId, page, limit } =
          casesFilterSchema.parse(request.query);

        const skip = (page - 1) * limit;

        // Construir filtros dinâmicos
        const where: any = {};

        if (search) {
          where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { number: { contains: search } },
            {
              client: {
                user: { name: { contains: search, mode: "insensitive" } },
              },
            },
            {
              client: {
                user: { email: { contains: search, mode: "insensitive" } },
              },
            },
          ];
        }

        if (status) {
          where.status = status;
        }

        if (type) {
          where.type = type;
        }

        if (clientId) {
          where.clientId = clientId;
        }

        if (lawyerId) {
          where.lawyerId = lawyerId;
        }

        // Buscar casos com paginação
        const [cases, total] = await Promise.all([
          prisma.case.findMany({
            where,
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                },
              },
              lawyer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              assistant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  documents: true,
                  appointments: true,
                  activities: true,
                  petitions: true,
                  payments: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.case.count({ where }),
        ]);

        return {
          cases: cases.map((caseItem) => ({
            id: caseItem.id,
            number: caseItem.number,
            title: caseItem.title,
            description: caseItem.description,
            type: caseItem.type,
            status: caseItem.status,
            value: caseItem.value,
            startDate: caseItem.startDate,
            endDate: caseItem.endDate,
            createdAt: caseItem.createdAt,
            updatedAt: caseItem.updatedAt,
            client: {
              id: caseItem.client.id,
              name: caseItem.client.user.name,
              email: caseItem.client.user.email,
              avatar: caseItem.client.user.avatar,
            },
            lawyer: caseItem.lawyer,
            assistant: caseItem.assistant,
            counts: caseItem._count,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar os casos",
        });
      }
    }
  );

  // GET /api/cases/:id - Buscar caso por ID
  fastify.get(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const caseItem = await prisma.case.findUnique({
          where: { id },
          include: {
            client: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            assistant: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            documents: {
              include: {
                uploadedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
            appointments: {
              include: {
                lawyer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { startDate: "asc" },
            },
            activities: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10, // Últimas 10 atividades
            },
            petitions: {
              orderBy: { createdAt: "desc" },
            },
            payments: {
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!caseItem) {
          return reply.status(404).send({
            error: "Caso não encontrado",
            message: "O caso solicitado não existe",
          });
        }

        return {
          id: caseItem.id,
          number: caseItem.number,
          title: caseItem.title,
          description: caseItem.description,
          type: caseItem.type,
          status: caseItem.status,
          value: caseItem.value,
          startDate: caseItem.startDate,
          endDate: caseItem.endDate,
          createdAt: caseItem.createdAt,
          updatedAt: caseItem.updatedAt,
          client: {
            id: caseItem.client.id,
            name: caseItem.client.user.name,
            email: caseItem.client.user.email,
            avatar: caseItem.client.user.avatar,
            type: caseItem.client.type,
            phone: caseItem.client.phone,
            cpf: caseItem.client.cpf,
            cnpj: caseItem.client.cnpj,
          },
          lawyer: caseItem.lawyer,
          assistant: caseItem.assistant,
          documents: caseItem.documents,
          appointments: caseItem.appointments,
          activities: caseItem.activities,
          petitions: caseItem.petitions,
          payments: caseItem.payments,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar o caso",
        });
      }
    }
  );

  // POST /api/cases - Criar novo caso
  fastify.post(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const data = createCaseSchema.parse(request.body);

        // Verificar se cliente existe
        const client = await prisma.clientProfile.findUnique({
          where: { id: data.clientId },
          include: { user: true },
        });

        if (!client) {
          return reply.status(404).send({
            error: "Cliente não encontrado",
            message: "O cliente especificado não existe",
          });
        }

        // Verificar se assistente existe (se fornecido)
        if (data.assistantId) {
          const assistant = await prisma.user.findUnique({
            where: { id: data.assistantId, role: "ASSISTANT" },
          });
          if (!assistant) {
            return reply.status(404).send({
              error: "Assistente não encontrado",
              message: "O assistente especificado não existe",
            });
          }
        }

        // Verificar se número do processo já existe (se fornecido)
        if (data.number) {
          const existingCase = await prisma.case.findUnique({
            where: { number: data.number },
          });
          if (existingCase) {
            return reply.status(400).send({
              error: "Número de processo já existe",
              message:
                "Este número de processo já está sendo usado por outro caso",
            });
          }
        }

        // Criar caso em transação
        const result = await prisma.$transaction(async (tx) => {
          // Criar caso
          const newCase = await tx.case.create({
            data: {
              title: data.title,
              description: data.description,
              type: data.type,
              clientId: data.clientId,
              lawyerId: request.user.id,
              assistantId: data.assistantId,
              value: data.value,
              number: data.number,
              status: "DRAFT",
            },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "CASE_CREATED",
              title: "Caso criado",
              description: `Caso "${data.title}" foi criado`,
              userId: request.user.id,
              caseId: newCase.id,
              metadata: {
                caseId: newCase.id,
                caseTitle: data.title,
                clientName: client.user.name,
              },
            },
          });

          return newCase;
        });

        return reply.status(201).send({
          message: "Caso criado com sucesso",
          case: {
            id: result.id,
            title: result.title,
            type: result.type,
            status: result.status,
            clientId: result.clientId,
            lawyerId: result.lawyerId,
            createdAt: result.createdAt,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível criar o caso",
        });
      }
    }
  );

  // PUT /api/cases/:id - Atualizar caso
  fastify.put(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateCaseSchema.parse(request.body);

        // Verificar se caso existe
        const existingCase = await prisma.case.findUnique({
          where: { id },
          include: { client: { include: { user: true } } },
        });

        if (!existingCase) {
          return reply.status(404).send({
            error: "Caso não encontrado",
            message: "O caso solicitado não existe",
          });
        }

        // Verificar se cliente existe (se está sendo alterado)
        if (data.clientId && data.clientId !== existingCase.clientId) {
          const client = await prisma.clientProfile.findUnique({
            where: { id: data.clientId },
          });
          if (!client) {
            return reply.status(404).send({
              error: "Cliente não encontrado",
              message: "O cliente especificado não existe",
            });
          }
        }

        // Verificar se assistente existe (se está sendo alterado)
        if (data.assistantId && data.assistantId !== existingCase.assistantId) {
          const assistant = await prisma.user.findUnique({
            where: { id: data.assistantId, role: "ASSISTANT" },
          });
          if (!assistant) {
            return reply.status(404).send({
              error: "Assistente não encontrado",
              message: "O assistente especificado não existe",
            });
          }
        }

        // Verificar se número do processo já existe (se está sendo alterado)
        if (data.number && data.number !== existingCase.number) {
          const existingNumber = await prisma.case.findUnique({
            where: { number: data.number },
          });
          if (existingNumber) {
            return reply.status(400).send({
              error: "Número de processo já existe",
              message:
                "Este número de processo já está sendo usado por outro caso",
            });
          }
        }

        // Atualizar caso em transação
        const result = await prisma.$transaction(async (tx) => {
          // Preparar dados de atualização
          const updateData: any = {};
          if (data.title !== undefined) updateData.title = data.title;
          if (data.description !== undefined)
            updateData.description = data.description;
          if (data.type !== undefined) updateData.type = data.type;
          if (data.clientId !== undefined) updateData.clientId = data.clientId;
          if (data.assistantId !== undefined)
            updateData.assistantId = data.assistantId;
          if (data.value !== undefined) updateData.value = data.value;
          if (data.number !== undefined) updateData.number = data.number;

          // Atualizar caso
          const updatedCase = await tx.case.update({
            where: { id },
            data: updateData,
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "CASE_UPDATED",
              title: "Caso atualizado",
              description: `Caso "${updatedCase.title}" foi atualizado`,
              userId: request.user.id,
              caseId: id,
              metadata: {
                caseId: id,
                caseTitle: updatedCase.title,
                updatedFields: Object.keys(updateData),
              },
            },
          });

          return updatedCase;
        });

        return {
          message: "Caso atualizado com sucesso",
          case: {
            id: result.id,
            title: result.title,
            type: result.type,
            status: result.status,
            updatedAt: result.updatedAt,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível atualizar o caso",
        });
      }
    }
  );

  // PATCH /api/cases/:id/status - Atualizar status do caso
  fastify.patch(
    "/:id/status",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };

        if (
          !["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"].includes(
            status
          )
        ) {
          return reply.status(400).send({
            error: "Status inválido",
            message: "O status fornecido não é válido",
          });
        }

        // Verificar se caso existe
        const existingCase = await prisma.case.findUnique({
          where: { id },
        });

        if (!existingCase) {
          return reply.status(404).send({
            error: "Caso não encontrado",
            message: "O caso solicitado não existe",
          });
        }

        // Atualizar status em transação
        const result = await prisma.$transaction(async (tx) => {
          // Atualizar status do caso
          const updatedCase = await tx.case.update({
            where: { id },
            data: {
              status: status as any,
              endDate: status === "CLOSED" ? new Date() : existingCase.endDate,
            },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "CASE_UPDATED",
              title: "Status do caso alterado",
              description: `Status do caso "${updatedCase.title}" alterado para ${status}`,
              userId: request.user.id,
              caseId: id,
              metadata: {
                caseId: id,
                caseTitle: updatedCase.title,
                oldStatus: existingCase.status,
                newStatus: status,
              },
            },
          });

          return updatedCase;
        });

        return {
          message: "Status do caso atualizado com sucesso",
          case: {
            id: result.id,
            status: result.status,
            endDate: result.endDate,
            updatedAt: result.updatedAt,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível atualizar o status do caso",
        });
      }
    }
  );

  // DELETE /api/cases/:id - Arquivar caso (soft delete)
  fastify.delete(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Verificar se caso existe
        const existingCase = await prisma.case.findUnique({
          where: { id },
        });

        if (!existingCase) {
          return reply.status(404).send({
            error: "Caso não encontrado",
            message: "O caso solicitado não existe",
          });
        }

        // Verificar se caso pode ser arquivado
        if (existingCase.status === "ACTIVE") {
          return reply.status(400).send({
            error: "Caso ativo",
            message:
              "Não é possível arquivar um caso ativo. Altere o status primeiro.",
          });
        }

        // Arquivar caso
        await prisma.$transaction(async (tx) => {
          await tx.case.update({
            where: { id },
            data: { status: "ARCHIVED" },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Caso arquivado",
              description: `Caso "${existingCase.title}" foi arquivado`,
              userId: request.user.id,
              caseId: id,
              metadata: {
                caseId: id,
                caseTitle: existingCase.title,
              },
            },
          });
        });

        return {
          message: "Caso arquivado com sucesso",
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível arquivar o caso",
        });
      }
    }
  );

  // GET /api/cases/:id/timeline - Timeline do caso
  fastify.get(
    "/:id/timeline",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { page = 1, limit = 20 } = request.query as any;

        const skip = (page - 1) * limit;

        // Buscar atividades do caso
        const activities = await prisma.activity.findMany({
          where: { caseId: id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        });

        const total = await prisma.activity.count({
          where: { caseId: id },
        });

        return {
          activities,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar a timeline do caso",
        });
      }
    }
  );
}
