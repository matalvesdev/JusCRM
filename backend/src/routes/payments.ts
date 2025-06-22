import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

export const paymentRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Listar pagamentos
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Payments"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = await request.getCurrentUser();
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const payments = await prisma.payment.findMany({
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

      reply.send({ payments });
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
