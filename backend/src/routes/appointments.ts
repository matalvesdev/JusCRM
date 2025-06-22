import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

export const appointmentRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Listar agendamentos
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Appointments"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = await request.getCurrentUser();
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const appointments = await prisma.appointment.findMany({
        where: { lawyerId: user.id },
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
        orderBy: { startDate: "asc" },
      });

      reply.send({ appointments });
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
