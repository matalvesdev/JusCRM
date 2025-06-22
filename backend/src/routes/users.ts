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
const updateProfileSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2 })),
  avatar: Type.Optional(Type.String()),
});

const createLawyerProfileSchema = Type.Object({
  oabNumber: Type.String(),
  oabState: Type.String(),
  specialties: Type.Array(Type.String()),
  biography: Type.Optional(Type.String()),
  experience: Type.Optional(Type.Number()),
  phone: Type.Optional(Type.String()),
  address: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  zipCode: Type.Optional(Type.String()),
});

export const userRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Obter perfil do usuário atual
  fastify.get(
    "/profile",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Object({
            user: Type.Object({
              id: Type.String(),
              name: Type.String(),
              email: Type.String(),
              role: Type.String(),
              avatar: Type.Optional(Type.String()),
              isActive: Type.Boolean(),
              createdAt: Type.String(),
              profile: Type.Optional(
                Type.Object({
                  oabNumber: Type.Optional(Type.String()),
                  oabState: Type.Optional(Type.String()),
                  specialties: Type.Optional(Type.Array(Type.String())),
                  biography: Type.Optional(Type.String()),
                })
              ),
            }),
          }),
        },
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.currentUser.id },
        include: {
          profile: true,
          clientProfile: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: {
            statusCode: 404,
            message: "Usuário não encontrado",
          },
        });
      }

      reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          profile: user.profile
            ? {
                oabNumber: user.profile.oabNumber,
                oabState: user.profile.oabState,
                specialties: user.profile.specialties,
                biography: user.profile.biography,
              }
            : null,
        },
      });
    }
  );

  // Atualizar perfil do usuário atual
  fastify.put(
    "/profile",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        body: updateProfileSchema,
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const body = request.body as {
        name?: string;
        avatar?: string;
      };

      const updatedUser = await prisma.user.update({
        where: { id: request.currentUser.id },
        data: body,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
      });

      reply.send({
        user: {
          ...updatedUser,
          createdAt: updatedUser.createdAt.toISOString(),
        },
      });
    }
  );

  // Criar perfil de advogado
  fastify.post(
    "/lawyer-profile",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        body: createLawyerProfileSchema,
      },
      preHandler: requireRole(["ADMIN", "LAWYER"]),
    },
    async (request, reply) => {
      const body = request.body as {
        oabNumber: string;
        oabState: string;
        specialties: string[];
        biography?: string;
        experience?: number;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
      };

      // Verificar se já existe perfil de advogado
      const existingProfile = await prisma.lawyerProfile.findUnique({
        where: { userId: request.currentUser.id },
      });

      if (existingProfile) {
        return reply.status(400).send({
          error: {
            statusCode: 400,
            message: "Perfil de advogado já existe",
          },
        });
      }

      // Verificar se OAB já está em uso
      const existingOab = await prisma.lawyerProfile.findUnique({
        where: { oabNumber: body.oabNumber },
      });

      if (existingOab) {
        return reply.status(400).send({
          error: {
            statusCode: 400,
            message: "Número da OAB já está em uso",
          },
        });
      }

      const profile = await prisma.lawyerProfile.create({
        data: {
          userId: request.currentUser.id,
          ...body,
        },
      });

      reply.status(201).send({ profile });
    }
  );

  // Listar usuários (apenas admin)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
          page: Type.Optional(Type.Number({ minimum: 1 })),
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
          role: Type.Optional(Type.String()),
          search: Type.Optional(Type.String()),
        }),
      },
      preHandler: requireRole(["ADMIN"]),
    },
    async (request, reply) => {
      const query = request.query as {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
      };

      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.role) {
        where.role = query.role;
      }

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      reply.send({
        users: users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
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

  // Obter usuário por ID (apenas admin)
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String(),
        }),
      },
      preHandler: requireRole(["ADMIN"]),
    },
    async (request, reply) => {
      const params = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
          profile: true,
          clientProfile: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: {
            statusCode: 404,
            message: "Usuário não encontrado",
          },
        });
      }

      reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          profile: user.profile,
          clientProfile: user.clientProfile,
        },
      });
    }
  );

  // Atualizar usuário (apenas admin)
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String(),
        }),
        body: Type.Object({
          name: Type.Optional(Type.String({ minLength: 2 })),
          role: Type.Optional(
            Type.Union([
              Type.Literal("ADMIN"),
              Type.Literal("LAWYER"),
              Type.Literal("ASSISTANT"),
              Type.Literal("CLIENT"),
            ])
          ),
          isActive: Type.Optional(Type.Boolean()),
        }),
      },
      preHandler: requireRole(["ADMIN"]),
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as {
        name?: string;
        role?: "ADMIN" | "LAWYER" | "ASSISTANT" | "CLIENT";
        isActive?: boolean;
      };

      const user = await prisma.user.update({
        where: { id: params.id },
        data: body,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          updatedAt: true,
        },
      });

      reply.send({
        user: {
          ...user,
          updatedAt: user.updatedAt.toISOString(),
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
