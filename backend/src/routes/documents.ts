import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

export const documentRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Listar documentos
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Documents"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = await request.getCurrentUser();
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const documents = await prisma.document.findMany({
        where: { uploadedById: user.id },
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          mimeType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      reply.send({ documents });
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
