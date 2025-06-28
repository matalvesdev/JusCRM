import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../plugins/auth";

// Schema para criar notificação
const createNotificationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória"),
  type: z.enum([
    "CASE_DEADLINE",
    "APPOINTMENT_REMINDER",
    "DOCUMENT_UPLOADED",
    "CASE_UPDATE",
    "PAYMENT_DUE",
    "SYSTEM_ANNOUNCEMENT",
    "NEW_MESSAGE",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  actionUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  caseId: z.string().optional(),
  documentId: z.string().optional(),
  appointmentId: z.string().optional(),
});

// Schema para filtros
const getNotificationsSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  isRead: z.coerce.boolean().optional(),
  type: z
    .enum([
      "CASE_DEADLINE",
      "APPOINTMENT_REMINDER",
      "DOCUMENT_UPLOADED",
      "CASE_UPDATE",
      "PAYMENT_DUE",
      "SYSTEM_ANNOUNCEMENT",
      "NEW_MESSAGE",
    ])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export async function notificationsRoutes(app: FastifyInstance) {
  // Registrar hooks de autenticação
  app.addHook("preHandler", requireAuth);

  // GET /api/notifications - Listar notificações do usuário
  app.get("/", async (request, reply) => {
    try {
      const query = getNotificationsSchema.parse(request.query);
      const { page, limit, isRead, type, priority } = query;
      const userId = (request.user as any).id;

      const skip = (page - 1) * limit;

      const where: any = {
        userId,
      };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      if (priority) {
        where.priority = priority;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            case: {
              select: {
                id: true,
                title: true,
                number: true,
              },
            },
            document: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            appointment: {
              select: {
                id: true,
                title: true,
                startDate: true,
                type: true,
              },
            },
          },
        }),
        prisma.notification.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return reply.status(500).send({
        error: "Erro interno do servidor",
      });
    }
  });

  // GET /api/notifications/unread-count - Contar notificações não lidas
  app.get("/unread-count", async (request, reply) => {
    try {
      const userId = (request.user as any).id;

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return reply.send({ count: unreadCount });
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      return reply.status(500).send({
        error: "Erro interno do servidor",
      });
    }
  });

  // POST /api/notifications - Criar nova notificação (admin/sistema)
  app.post("/", async (request, reply) => {
    try {
      const data = createNotificationSchema.parse(request.body);

      const notification = await prisma.notification.create({
        data: {
          ...data,
          userId: (request.user as any).id,
        },
        include: {
          case: {
            select: {
              id: true,
              title: true,
              number: true,
            },
          },
          document: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          appointment: {
            select: {
              id: true,
              title: true,
              startDate: true,
              type: true,
            },
          },
        },
      });

      return reply.status(201).send(notification);
    } catch (error: any) {
      console.error("Erro ao criar notificação:", error);

      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: "Erro interno do servidor",
      });
    }
  });

  // PUT /api/notifications/:id/read - Marcar notificação como lida
  app.put("/:id/read", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request.user as any).id;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return reply.status(404).send({
          error: "Notificação não encontrada",
        });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
        include: {
          case: {
            select: {
              id: true,
              title: true,
              number: true,
            },
          },
          document: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          appointment: {
            select: {
              id: true,
              title: true,
              startDate: true,
              type: true,
            },
          },
        },
      });

      return reply.send(updatedNotification);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return reply.status(500).send({
        error: "Erro interno do servidor",
      });
    }
  });

  // PUT /api/notifications/mark-all-read - Marcar todas como lidas
  app.put("/mark-all-read", async (request, reply) => {
    try {
      const userId = (request.user as any).id;

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return reply.send({
        message: "Todas as notificações foram marcadas como lidas",
      });
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      return reply.status(500).send({
        error: "Erro interno do servidor",
      });
    }
  });

  // DELETE /api/notifications/:id - Deletar notificação
  app.delete("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request.user as any).id;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return reply.status(404).send({
          error: "Notificação não encontrada",
        });
      }

      await prisma.notification.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      return reply.status(500).send({
        error: "Erro interno do servidor",
      });
    }
  });
}
