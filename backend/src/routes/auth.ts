import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

// Schemas de validação
const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
});

const RegisterSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
  role: Type.Optional(
    Type.Union(
      [
        Type.Literal("ADMIN"),
        Type.Literal("LAWYER"),
        Type.Literal("ASSISTANT"),
      ],
      { default: "ASSISTANT" }
    )
  ),
});

export const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Login
  fastify.post(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: Type.Object({
            data: Type.Object({
              user: Type.Object({
                id: Type.String(),
                name: Type.String(),
                email: Type.String(),
                role: Type.String(),
              }),
              accessToken: Type.String(),
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
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        // Buscar usuário
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return reply.status(400).send({
            error: {
              message: "Credenciais inválidas",
              code: "INVALID_CREDENTIALS",
            },
          });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return reply.status(400).send({
            error: {
              message: "Credenciais inválidas",
              code: "INVALID_CREDENTIALS",
            },
          });
        }

        // Gerar token
        const accessToken = fastify.jwt.sign(
          { userId: user.id, role: user.role },
          { expiresIn: "24h" }
        );

        return reply.send({
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
            accessToken,
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

  // Register
  fastify.post(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          201: Type.Object({
            data: Type.Object({
              user: Type.Object({
                id: Type.String(),
                name: Type.String(),
                email: Type.String(),
                role: Type.String(),
              }),
              accessToken: Type.String(),
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
        const {
          name,
          email,
          password,
          role = "ASSISTANT",
        } = request.body as {
          name: string;
          email: string;
          password: string;
          role?: "ADMIN" | "LAWYER" | "ASSISTANT";
        };

        // Verificar se usuário já existe
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return reply.status(400).send({
            error: {
              message: "Usuário já existe com este email",
              code: "USER_ALREADY_EXISTS",
            },
          });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role,
          },
        });

        // Gerar token
        const accessToken = fastify.jwt.sign(
          { userId: user.id, role: user.role },
          { expiresIn: "24h" }
        );

        return reply.status(201).send({
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
            accessToken,
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
  // Get current user
  fastify.get(
    "/me",
    {
      preHandler: async (request, reply) => {
        // Usar o middleware de autenticação
        const token = request.headers.authorization?.replace("Bearer ", "");
        if (!token) {
          return reply.status(401).send({
            error: {
              message: "Token de acesso requerido",
              code: "UNAUTHORIZED",
            },
          });
        }

        try {
          const decoded = (await fastify.jwt.verify(token)) as {
            userId: string;
            role: string;
          };

          // Adicionar informações do usuário ao request
          (request as any).user = {
            id: decoded.userId,
            role: decoded.role,
          };
        } catch (error) {
          return reply.status(401).send({
            error: {
              message: "Token inválido",
              code: "INVALID_TOKEN",
            },
          });
        }
      },
      schema: {
        response: {
          200: Type.Object({
            data: Type.Object({
              id: Type.String(),
              name: Type.String(),
              email: Type.String(),
              role: Type.String(),
            }),
          }),
          401: Type.Object({
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
        const userId = (request as any).user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!user) {
          return reply.status(401).send({
            error: {
              message: "Usuário não encontrado",
              code: "USER_NOT_FOUND",
            },
          });
        }

        return reply.send({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
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
