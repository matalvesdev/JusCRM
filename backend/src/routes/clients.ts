import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

// Schemas de validação
const CreateClientSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  email: Type.String({ format: "email" }),
  phone: Type.Optional(Type.String()),
  cpf: Type.Optional(Type.String()),
  cnpj: Type.Optional(Type.String()),
  type: Type.Optional(
    Type.Union([Type.Literal("INDIVIDUAL"), Type.Literal("COMPANY")], {
      default: "INDIVIDUAL",
    })
  ),
  address: Type.Optional(Type.String()),
});

export const clientRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Listar clientes
  fastify.get(
    "/",
    {
      schema: {
        querystring: Type.Object({
          page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
          limit: Type.Optional(
            Type.Number({ minimum: 1, maximum: 100, default: 20 })
          ),
          search: Type.Optional(Type.String()),
        }),
        response: {
          200: Type.Object({
            data: Type.Object({
              clients: Type.Array(
                Type.Object({
                  id: Type.String(),
                  name: Type.String(),
                  email: Type.String(),
                  phone: Type.Union([Type.String(), Type.Null()]),
                  cpf: Type.Union([Type.String(), Type.Null()]),
                  cnpj: Type.Union([Type.String(), Type.Null()]),
                  type: Type.String(),
                  createdAt: Type.String(),
                  casesCount: Type.Number(),
                })
              ),
              pagination: Type.Object({
                page: Type.Number(),
                limit: Type.Number(),
                total: Type.Number(),
                totalPages: Type.Number(),
              }),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          page = 1,
          limit = 20,
          search,
        } = request.query as {
          page?: number;
          limit?: number;
          search?: string;
        };

        const skip = (page - 1) * limit;

        const searchWhere = search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
                {
                  clientProfile: {
                    OR: [
                      {
                        cpf: { contains: search, mode: "insensitive" as const },
                      },
                      {
                        cnpj: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    ],
                  },
                },
              ],
            }
          : {};

        const where = {
          role: "CLIENT" as const,
          ...searchWhere,
        };

        const [clients, total] = await Promise.all([
          prisma.user.findMany({
            where,
            skip,
            take: limit,
            include: {
              clientProfile: {
                include: {
                  cases: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.user.count({ where }),
        ]);

        return reply.send({
          data: {
            clients: clients.map((client) => ({
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.clientProfile?.phone || null,
              cpf: client.clientProfile?.cpf || null,
              cnpj: client.clientProfile?.cnpj || null,
              type: client.clientProfile?.type || "INDIVIDUAL",
              createdAt: client.createdAt.toISOString(),
              casesCount: client.clientProfile?.cases?.length || 0,
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor",
            code: "INTERNAL_ERROR",
          },
        });
      }
    }
  );

  // Criar cliente
  fastify.post(
    "/",
    {
      schema: {
        body: CreateClientSchema,
        response: {
          201: Type.Object({
            data: Type.Object({
              client: Type.Object({
                id: Type.String(),
                name: Type.String(),
                email: Type.String(),
                phone: Type.Union([Type.String(), Type.Null()]),
                cpf: Type.Union([Type.String(), Type.Null()]),
                cnpj: Type.Union([Type.String(), Type.Null()]),
                type: Type.String(),
                createdAt: Type.String(),
              }),
            }),
          }),
          400: Type.Object({
            error: Type.Object({
              message: Type.String(),
              code: Type.String(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const data = request.body as typeof CreateClientSchema.static;

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          return reply.status(400).send({
            error: {
              message: "Email já está em uso",
              code: "EMAIL_ALREADY_EXISTS",
            },
          });
        }

        // Criar usuário e perfil de cliente
        const client = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            role: "CLIENT",
            clientProfile: {
              create: {
                type: data.type || "INDIVIDUAL",
                phone: data.phone,
                cpf: data.cpf,
                cnpj: data.cnpj,
                address: data.address,
              },
            },
          },
          include: {
            clientProfile: true,
          },
        });

        return reply.status(201).send({
          data: {
            client: {
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.clientProfile?.phone || null,
              cpf: client.clientProfile?.cpf || null,
              cnpj: client.clientProfile?.cnpj || null,
              type: client.clientProfile?.type || "INDIVIDUAL",
              createdAt: client.createdAt.toISOString(),
            },
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor",
            code: "INTERNAL_ERROR",
          },
        });
      }
    }
  );
};
