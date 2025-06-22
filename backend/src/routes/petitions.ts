import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

export const petitionRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Listar petições
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Petitions"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = await request.getCurrentUser();
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const petitions = await prisma.petition.findMany({
        include: {
          case: {
            select: {
              id: true,
              title: true,
              client: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      reply.send({ petitions });
    }
  );
};

declare module "fastify" {
  interface FastifyRequest {
    getCurrentUser(): Promise<{
      id: string;
      email: string;
      role: string;
    } | null>;
  }
}
