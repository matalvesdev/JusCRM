import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

// Helper para verificar autorização
const requireAuth = async (request: any, reply: any) => {
  const user = await request.getCurrentUser();
  if (!user) {
    return reply.status(401).send({
      error: {
        statusCode: 401,
        message: "Token de acesso requerido",
      },
    });
  }
  request.currentUser = user;
};

const requireRole = (roles: string[]) => async (request: any, reply: any) => {
  await requireAuth(request, reply);
  if (!roles.includes(request.currentUser.role)) {
    return reply.status(403).send({
      error: {
        statusCode: 403,
        message: "Acesso negado",
      },
    });
  }
};

// Schemas
const createCaseSchema = Type.Object({
  title: Type.String({ minLength: 2 }),
  description: Type.Optional(Type.String()),
  type: Type.Union([
    Type.Literal("RESCISAO_INDIRETA"),
    Type.Literal("HORAS_EXTRAS"),
    Type.Literal("ADICIONAL_INSALUBRIDADE"),
    Type.Literal("ADICIONAL_PERICULOSIDADE"),
    Type.Literal("ASSEDIO_MORAL"),
    Type.Literal("ACIDENTE_TRABALHO"),
    Type.Literal("EQUIPARACAO_SALARIAL"),
    Type.Literal("DEMISSAO_SEM_JUSTA_CAUSA"),
    Type.Literal("FGTS"),
    Type.Literal("SEGURO_DESEMPREGO"),
    Type.Literal("OTHER"),
  ]),
  clientId: Type.String(),
  value: Type.Optional(Type.Number({ minimum: 0 })),
});

export const caseRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Criar caso
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Cases"],
        security: [{ bearerAuth: [] }],
        body: createCaseSchema,
      },
      preHandler: requireRole(["ADMIN", "LAWYER", "ASSISTANT"]),
    },
    async (request, reply) => {
      const body = request.body as {
        title: string;
        description?: string;
        type: string;
        clientId: string;
        value?: number;
      };

      // Verificar se cliente existe
      const client = await prisma.clientProfile.findUnique({
        where: { id: body.clientId },
      });

      if (!client) {
        return reply.status(404).send({
          error: {
            statusCode: 404,
            message: "Cliente não encontrado",
          },
        });
      }

      const case_ = await prisma.case.create({
        data: {
          title: body.title,
          description: body.description,
          type: body.type as any,
          clientId: body.clientId,
          lawyerId: request.currentUser.id,
          value: body.value,
          status: "DRAFT",
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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
      });

      reply.status(201).send({
        case: {
          id: case_.id,
          title: case_.title,
          description: case_.description,
          type: case_.type,
          status: case_.status,
          value: case_.value?.toString(),
          client: {
            id: case_.client.id,
            user: case_.client.user,
          },
          lawyer: case_.lawyer,
          startDate: case_.startDate.toISOString(),
          createdAt: case_.createdAt.toISOString(),
        },
      });
    }
  );

  // Listar casos
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Cases"],
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
          page: Type.Optional(Type.Number({ minimum: 1 })),
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
          status: Type.Optional(Type.String()),
          search: Type.Optional(Type.String()),
        }),
      },
      preHandler: requireRole(["ADMIN", "LAWYER", "ASSISTANT"]),
    },
    async (request, reply) => {
      const query = request.query as {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
      };

      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
          {
            client: {
              user: { name: { contains: query.search, mode: "insensitive" } },
            },
          },
        ];
      }

      const [cases, total] = await Promise.all([
        prisma.case.findMany({
          where,
          skip,
          take: limit,
          include: {
            client: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
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
          orderBy: { createdAt: "desc" },
        }),
        prisma.case.count({ where }),
      ]);

      reply.send({
        cases: cases.map((case_) => ({
          id: case_.id,
          title: case_.title,
          type: case_.type,
          status: case_.status,
          value: case_.value?.toString(),
          client: {
            id: case_.client.id,
            user: case_.client.user,
          },
          lawyer: case_.lawyer,
          startDate: case_.startDate.toISOString(),
          createdAt: case_.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }
  );

  // Obter caso por ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Cases"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String(),
        }),
      },
      preHandler: requireRole(["ADMIN", "LAWYER", "ASSISTANT"]),
    },
    async (request, reply) => {
      const params = request.params as { id: string };

      const case_ = await prisma.case.findUnique({
        where: { id: params.id },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          lawyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          documents: {
            select: {
              id: true,
              name: true,
              type: true,
              createdAt: true,
            },
          },
          appointments: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              startDate: true,
            },
          },
        },
      });

      if (!case_) {
        return reply.status(404).send({
          error: {
            statusCode: 404,
            message: "Caso não encontrado",
          },
        });
      }

      reply.send({
        case: {
          id: case_.id,
          title: case_.title,
          description: case_.description,
          type: case_.type,
          status: case_.status,
          value: case_.value?.toString(),
          client: {
            id: case_.client.id,
            user: case_.client.user,
          },
          lawyer: case_.lawyer,
          documents: case_.documents.map((doc) => ({
            ...doc,
            createdAt: doc.createdAt.toISOString(),
          })),
          appointments: case_.appointments.map((apt) => ({
            ...apt,
            startDate: apt.startDate.toISOString(),
          })),
          startDate: case_.startDate.toISOString(),
          endDate: case_.endDate?.toISOString(),
          createdAt: case_.createdAt.toISOString(),
          updatedAt: case_.updatedAt.toISOString(),
        },
      });
    }
  );
};

declare module "fastify" {
  interface FastifyRequest {
    currentUser: {
      id: string;
      email: string;
      role: string;
    };
  }
}
