import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    getCurrentUser(): Promise<{
      id: string;
      email: string;
      role: string;
    } | null>;
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export const authPlugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Decorator para obter usuário atual
  fastify.decorateRequest(
    "getCurrentUser",
    async function (this: FastifyRequest) {
      try {
        const token = this.headers.authorization?.replace("Bearer ", "");
        if (!token) return null;

        const decoded = await fastify.jwt.verify<{
          userId: string;
          role: string;
        }>(token);

        return {
          id: decoded.userId,
          email: "", // Você pode buscar no banco se necessário
          role: decoded.role,
        };
      } catch {
        return null;
      }
    }
  );

  // Decorator para autenticação
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.headers.authorization?.replace("Bearer ", "");
        if (!token) {
          return reply.status(401).send({
            error: {
              message: "Token de acesso requerido",
              code: "UNAUTHORIZED",
            },
          });
        }

        const decoded = await fastify.jwt.verify<{
          userId: string;
          role: string;
        }>(token);

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
    }
  );
};

// Middleware de autenticação para ser usado nas rotas
export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return reply.status(401).send({
        error: {
          message: "Token de acesso requerido",
          code: "UNAUTHORIZED",
        },
      });
    }

    const decoded = await request.server.jwt.verify<{
      userId: string;
      role: string;
    }>(token);

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
};
