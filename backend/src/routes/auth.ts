import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { sendPasswordResetEmail, sendEmailVerification } from "../lib/email";

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

// Schema para solicitação de reset de senha
const ForgotPasswordSchema = Type.Object({
  email: Type.String({ format: "email" }),
});

// Schema para reset de senha
const ResetPasswordSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 6 }),
});

// Schema para verificação de email
const VerifyEmailSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
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

        // Gerar token de verificação de email
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");

        // Criar usuário
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role,
            emailVerificationToken,
          },
        });

        // Enviar email de verificação (em desenvolvimento, apenas log)
        if (process.env.NODE_ENV === "development") {
          console.log(
            `📧 Token de verificação para ${email}: ${emailVerificationToken}`
          );
          console.log(
            `🔗 Link: http://localhost:5173/verify-email?token=${emailVerificationToken}`
          );
        } else {
          // Em produção, enviar email real
          await sendEmailVerification(email, name, emailVerificationToken);
        }

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

  // Solicitar recuperação de senha
  fastify.post(
    "/forgot-password",
    {
      schema: {
        tags: ["auth"],
        summary: "Solicitar recuperação de senha",
        body: ForgotPasswordSchema,
        response: {
          200: Type.Object({
            message: Type.String(),
          }),
          404: Type.Object({
            error: Type.Object({
              message: Type.String(),
              code: Type.String(),
            }),
          }),
          500: Type.Object({
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
        const { email } = request.body as { email: string };

        // Buscar usuário pelo email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return reply.status(404).send({
            error: {
              message: "Usuário não encontrado",
              code: "USER_NOT_FOUND",
            },
          });
        }

        // Gerar token de reset
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

        // Salvar token no banco
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExpiry,
          },
        });

        // Enviar email (em desenvolvimento, apenas log o token)
        if (process.env.NODE_ENV === "development") {
          console.log(`🔑 Token de reset para ${email}: ${resetToken}`);
          console.log(
            `🔗 Link: http://localhost:5173/reset-password?token=${resetToken}`
          );
        } else {
          // Em produção, enviar email real
          await sendPasswordResetEmail(email, user.name, resetToken);
        }

        return reply.send({
          message: "Email de recuperação enviado com sucesso",
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

  // Reset de senha
  fastify.post(
    "/reset-password",
    {
      schema: {
        tags: ["auth"],
        summary: "Redefinir senha",
        body: ResetPasswordSchema,
        response: {
          200: Type.Object({
            message: Type.String(),
          }),
          400: Type.Object({
            error: Type.Object({
              message: Type.String(),
              code: Type.String(),
            }),
          }),
          500: Type.Object({
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
        const { token, password } = request.body as {
          token: string;
          password: string;
        };

        // Buscar usuário pelo token
        const user = await prisma.user.findFirst({
          where: {
            resetToken: token,
            resetTokenExpiry: {
              gte: new Date(),
            },
          },
        });

        if (!user) {
          return reply.status(400).send({
            error: {
              message: "Token inválido ou expirado",
              code: "INVALID_TOKEN",
            },
          });
        }

        // Hash da nova senha
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Atualizar senha e limpar token
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
            lastLogin: new Date(),
          },
        });

        return reply.send({
          message: "Senha redefinida com sucesso",
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

  // Verificar email
  fastify.post(
    "/verify-email",
    {
      schema: {
        tags: ["auth"],
        summary: "Verificar email",
        body: VerifyEmailSchema,
        response: {
          200: Type.Object({
            message: Type.String(),
          }),
          400: Type.Object({
            error: Type.Object({
              message: Type.String(),
              code: Type.String(),
            }),
          }),
          500: Type.Object({
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
        const { token } = request.body as { token: string };

        // Buscar usuário pelo token de verificação
        const user = await prisma.user.findFirst({
          where: {
            emailVerificationToken: token,
          },
        });

        if (!user) {
          return reply.status(400).send({
            error: {
              message: "Token de verificação inválido",
              code: "INVALID_VERIFICATION_TOKEN",
            },
          });
        }

        // Verificar email
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            emailVerificationToken: null,
          },
        });

        return reply.send({
          message: "Email verificado com sucesso",
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

  // Reenviar email de verificação
  fastify.post(
    "/resend-verification",
    {
      schema: {
        tags: ["auth"],
        summary: "Reenviar email de verificação",
        body: ForgotPasswordSchema,
        response: {
          200: Type.Object({
            message: Type.String(),
          }),
          404: Type.Object({
            error: Type.Object({
              message: Type.String(),
              code: Type.String(),
            }),
          }),
          500: Type.Object({
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
        const { email } = request.body as { email: string };

        // Buscar usuário pelo email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return reply.status(404).send({
            error: {
              message: "Usuário não encontrado",
              code: "USER_NOT_FOUND",
            },
          });
        }

        if (user.emailVerified) {
          return reply.status(400).send({
            error: {
              message: "Email já verificado",
              code: "EMAIL_ALREADY_VERIFIED",
            },
          });
        }

        // Gerar novo token de verificação
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Salvar token no banco
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: verificationToken,
          },
        });

        // Enviar email (em desenvolvimento, apenas log o token)
        if (process.env.NODE_ENV === "development") {
          console.log(
            `📧 Token de verificação para ${email}: ${verificationToken}`
          );
          console.log(
            `🔗 Link: http://localhost:5173/verify-email?token=${verificationToken}`
          );
        } else {
          // Em produção, enviar email real
          await sendEmailVerification(email, user.name, verificationToken);
        }

        return reply.send({
          message: "Email de verificação reenviado com sucesso",
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
