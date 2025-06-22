import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

export const activityRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Listar atividades
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Activities"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = await request.getCurrentUser();
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const activities = await prisma.activity.findMany({
        where: { userId: user.id },
        include: {
          case: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      reply.send({ activities });
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
