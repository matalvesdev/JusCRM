import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../plugins/auth";
import { prisma } from "../lib/prisma";

// Schemas de validação
const createAppointmentSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  type: z.enum(["HEARING", "MEETING", "DEADLINE", "CALL"]),
  startDate: z.string(),
  endDate: z.string(),
  caseId: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  meetingId: z.string().optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

const appointmentsFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["HEARING", "MEETING", "DEADLINE", "CALL"]).optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"])
    .optional(),
  caseId: z.string().optional(),
  lawyerId: z.string().optional(),
  startDate: z.string().optional(), // Filtro por data inicial
  endDate: z.string().optional(), // Filtro por data final
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export async function appointmentsRoutes(fastify: FastifyInstance) {
  // GET /api/appointments - Listar compromissos com filtros
  fastify.get(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const {
          search,
          type,
          status,
          caseId,
          lawyerId,
          startDate,
          endDate,
          page,
          limit,
        } = appointmentsFilterSchema.parse(request.query);

        const skip = (page - 1) * limit;

        // Construir filtros dinâmicos
        const where: any = {};

        if (search) {
          where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { case: { title: { contains: search, mode: "insensitive" } } },
            {
              case: {
                client: {
                  user: { name: { contains: search, mode: "insensitive" } },
                },
              },
            },
          ];
        }

        if (type) {
          where.type = type;
        }

        if (status) {
          where.status = status;
        }

        if (caseId) {
          where.caseId = caseId;
        }

        if (lawyerId) {
          where.lawyerId = lawyerId;
        }

        // Filtros por data
        if (startDate || endDate) {
          where.startDate = {};
          if (startDate) {
            where.startDate.gte = new Date(startDate);
          }
          if (endDate) {
            where.startDate.lte = new Date(endDate);
          }
        }

        // Buscar compromissos com paginação
        const [appointments, total] = await Promise.all([
          prisma.appointment.findMany({
            where,
            include: {
              case: {
                include: {
                  client: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          avatar: true,
                        },
                      },
                    },
                  },
                },
              },
              lawyer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
            orderBy: { startDate: "asc" },
            skip,
            take: limit,
          }),
          prisma.appointment.count({ where }),
        ]);

        return {
          appointments: appointments.map((appointment) => ({
            id: appointment.id,
            title: appointment.title,
            description: appointment.description,
            type: appointment.type,
            status: appointment.status,
            startDate: appointment.startDate,
            endDate: appointment.endDate,
            meetingUrl: appointment.meetingUrl,
            meetingId: appointment.meetingId,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
            case: appointment.case
              ? {
                  id: appointment.case.id,
                  title: appointment.case.title,
                  number: appointment.case.number,
                  client: {
                    id: appointment.case.client.id,
                    name: appointment.case.client.user.name,
                    email: appointment.case.client.user.email,
                    avatar: appointment.case.client.user.avatar,
                  },
                }
              : null,
            lawyer: appointment.lawyer,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar os compromissos",
        });
      }
    }
  );

  // GET /api/appointments/:id - Buscar compromisso por ID
  fastify.get(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const appointment = await prisma.appointment.findUnique({
          where: { id },
          include: {
            case: {
              include: {
                client: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        });

        if (!appointment) {
          return reply.status(404).send({
            error: "Compromisso não encontrado",
            message: "O compromisso solicitado não existe",
          });
        }

        return {
          id: appointment.id,
          title: appointment.title,
          description: appointment.description,
          type: appointment.type,
          status: appointment.status,
          startDate: appointment.startDate,
          endDate: appointment.endDate,
          meetingUrl: appointment.meetingUrl,
          meetingId: appointment.meetingId,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          case: appointment.case,
          lawyer: appointment.lawyer,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar o compromisso",
        });
      }
    }
  );

  // POST /api/appointments - Criar novo compromisso
  fastify.post(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const data = createAppointmentSchema.parse(request.body);

        // Validar datas
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (startDate >= endDate) {
          return reply.status(400).send({
            error: "Datas inválidas",
            message: "A data de início deve ser anterior à data de término",
          });
        }

        if (startDate < new Date()) {
          return reply.status(400).send({
            error: "Data inválida",
            message: "A data de início não pode ser no passado",
          });
        }

        // Verificar se caso existe (se fornecido)
        if (data.caseId) {
          const caseExists = await prisma.case.findUnique({
            where: { id: data.caseId },
            include: { client: { include: { user: true } } },
          });
          if (!caseExists) {
            return reply.status(404).send({
              error: "Caso não encontrado",
              message: "O caso especificado não existe",
            });
          }
        }

        // Verificar conflitos de horário
        const conflictingAppointments = await prisma.appointment.findMany({
          where: {
            lawyerId: request.user.id,
            status: { in: ["SCHEDULED", "CONFIRMED"] },
            OR: [
              {
                AND: [
                  { startDate: { lte: startDate } },
                  { endDate: { gt: startDate } },
                ],
              },
              {
                AND: [
                  { startDate: { lt: endDate } },
                  { endDate: { gte: endDate } },
                ],
              },
              {
                AND: [
                  { startDate: { gte: startDate } },
                  { endDate: { lte: endDate } },
                ],
              },
            ],
          },
        });

        if (conflictingAppointments.length > 0) {
          return reply.status(400).send({
            error: "Conflito de horário",
            message: "Já existe um compromisso agendado neste horário",
            conflicts: conflictingAppointments.map((apt) => ({
              id: apt.id,
              title: apt.title,
              startDate: apt.startDate,
              endDate: apt.endDate,
            })),
          });
        }

        // Criar compromisso em transação
        const result = await prisma.$transaction(async (tx) => {
          // Criar compromisso
          const appointment = await tx.appointment.create({
            data: {
              title: data.title,
              description: data.description,
              type: data.type,
              startDate,
              endDate,
              caseId: data.caseId,
              lawyerId: request.user.id,
              meetingUrl: data.meetingUrl,
              meetingId: data.meetingId,
              status: "SCHEDULED",
            },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "APPOINTMENT_SCHEDULED",
              title: "Compromisso agendado",
              description: `Compromisso "${data.title}" foi agendado`,
              userId: request.user.id,
              caseId: data.caseId,
              metadata: {
                appointmentId: appointment.id,
                appointmentTitle: data.title,
                appointmentType: data.type,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              },
            },
          });

          return appointment;
        });

        return reply.status(201).send({
          message: "Compromisso criado com sucesso",
          appointment: {
            id: result.id,
            title: result.title,
            type: result.type,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível criar o compromisso",
        });
      }
    }
  );

  // PUT /api/appointments/:id - Atualizar compromisso
  fastify.put(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateAppointmentSchema.parse(request.body);

        // Verificar se compromisso existe
        const existingAppointment = await prisma.appointment.findUnique({
          where: { id },
        });

        if (!existingAppointment) {
          return reply.status(404).send({
            error: "Compromisso não encontrado",
            message: "O compromisso solicitado não existe",
          });
        }

        // Verificar permissão (só o advogado responsável pode editar)
        if (
          existingAppointment.lawyerId !== request.user.id &&
          request.user.role !== "ADMIN"
        ) {
          return reply.status(403).send({
            error: "Acesso negado",
            message: "Você não tem permissão para editar este compromisso",
          });
        }

        // Validar datas se foram fornecidas
        let startDate = existingAppointment.startDate;
        let endDate = existingAppointment.endDate;

        if (data.startDate) {
          startDate = new Date(data.startDate);
        }

        if (data.endDate) {
          endDate = new Date(data.endDate);
        }

        if (startDate >= endDate) {
          return reply.status(400).send({
            error: "Datas inválidas",
            message: "A data de início deve ser anterior à data de término",
          });
        }

        // Verificar se caso existe (se está sendo alterado)
        if (data.caseId && data.caseId !== existingAppointment.caseId) {
          const caseExists = await prisma.case.findUnique({
            where: { id: data.caseId },
          });
          if (!caseExists) {
            return reply.status(404).send({
              error: "Caso não encontrado",
              message: "O caso especificado não existe",
            });
          }
        }

        // Verificar conflitos de horário (apenas se as datas estão sendo alteradas)
        if (data.startDate || data.endDate) {
          const conflictingAppointments = await prisma.appointment.findMany({
            where: {
              lawyerId: request.user.id,
              id: { not: id }, // Excluir o próprio compromisso
              status: { in: ["SCHEDULED", "CONFIRMED"] },
              OR: [
                {
                  AND: [
                    { startDate: { lte: startDate } },
                    { endDate: { gt: startDate } },
                  ],
                },
                {
                  AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gte: endDate } },
                  ],
                },
                {
                  AND: [
                    { startDate: { gte: startDate } },
                    { endDate: { lte: endDate } },
                  ],
                },
              ],
            },
          });

          if (conflictingAppointments.length > 0) {
            return reply.status(400).send({
              error: "Conflito de horário",
              message: "Já existe um compromisso agendado neste horário",
              conflicts: conflictingAppointments.map((apt) => ({
                id: apt.id,
                title: apt.title,
                startDate: apt.startDate,
                endDate: apt.endDate,
              })),
            });
          }
        }

        // Atualizar compromisso em transação
        const result = await prisma.$transaction(async (tx) => {
          // Preparar dados de atualização
          const updateData: any = {};
          if (data.title !== undefined) updateData.title = data.title;
          if (data.description !== undefined)
            updateData.description = data.description;
          if (data.type !== undefined) updateData.type = data.type;
          if (data.startDate !== undefined) updateData.startDate = startDate;
          if (data.endDate !== undefined) updateData.endDate = endDate;
          if (data.caseId !== undefined) updateData.caseId = data.caseId;
          if (data.meetingUrl !== undefined)
            updateData.meetingUrl = data.meetingUrl;
          if (data.meetingId !== undefined)
            updateData.meetingId = data.meetingId;

          // Atualizar compromisso
          const updatedAppointment = await tx.appointment.update({
            where: { id },
            data: updateData,
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Compromisso atualizado",
              description: `Compromisso "${updatedAppointment.title}" foi atualizado`,
              userId: request.user.id,
              caseId: updatedAppointment.caseId,
              metadata: {
                appointmentId: id,
                appointmentTitle: updatedAppointment.title,
                updatedFields: Object.keys(updateData),
              },
            },
          });

          return updatedAppointment;
        });

        return {
          message: "Compromisso atualizado com sucesso",
          appointment: {
            id: result.id,
            title: result.title,
            type: result.type,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            updatedAt: result.updatedAt,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível atualizar o compromisso",
        });
      }
    }
  );

  // PATCH /api/appointments/:id/status - Atualizar status do compromisso
  fastify.patch(
    "/:id/status",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };

        if (
          ![
            "SCHEDULED",
            "CONFIRMED",
            "COMPLETED",
            "CANCELLED",
            "RESCHEDULED",
          ].includes(status)
        ) {
          return reply.status(400).send({
            error: "Status inválido",
            message: "O status fornecido não é válido",
          });
        }

        // Verificar se compromisso existe
        const existingAppointment = await prisma.appointment.findUnique({
          where: { id },
        });

        if (!existingAppointment) {
          return reply.status(404).send({
            error: "Compromisso não encontrado",
            message: "O compromisso solicitado não existe",
          });
        }

        // Verificar permissão
        if (
          existingAppointment.lawyerId !== request.user.id &&
          request.user.role !== "ADMIN"
        ) {
          return reply.status(403).send({
            error: "Acesso negado",
            message: "Você não tem permissão para alterar este compromisso",
          });
        }

        // Atualizar status em transação
        const result = await prisma.$transaction(async (tx) => {
          const updatedAppointment = await tx.appointment.update({
            where: { id },
            data: { status: status as any },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Status do compromisso alterado",
              description: `Status do compromisso "${updatedAppointment.title}" alterado para ${status}`,
              userId: request.user.id,
              caseId: updatedAppointment.caseId,
              metadata: {
                appointmentId: id,
                appointmentTitle: updatedAppointment.title,
                oldStatus: existingAppointment.status,
                newStatus: status,
              },
            },
          });

          return updatedAppointment;
        });

        return {
          message: "Status do compromisso atualizado com sucesso",
          appointment: {
            id: result.id,
            status: result.status,
            updatedAt: result.updatedAt,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível atualizar o status do compromisso",
        });
      }
    }
  );

  // DELETE /api/appointments/:id - Cancelar compromisso
  fastify.delete(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Verificar se compromisso existe
        const existingAppointment = await prisma.appointment.findUnique({
          where: { id },
        });

        if (!existingAppointment) {
          return reply.status(404).send({
            error: "Compromisso não encontrado",
            message: "O compromisso solicitado não existe",
          });
        }

        // Verificar permissão
        if (
          existingAppointment.lawyerId !== request.user.id &&
          request.user.role !== "ADMIN"
        ) {
          return reply.status(403).send({
            error: "Acesso negado",
            message: "Você não tem permissão para cancelar este compromisso",
          });
        }

        // Cancelar compromisso (soft delete)
        await prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: { id },
            data: { status: "CANCELLED" },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Compromisso cancelado",
              description: `Compromisso "${existingAppointment.title}" foi cancelado`,
              userId: request.user.id,
              caseId: existingAppointment.caseId,
              metadata: {
                appointmentId: id,
                appointmentTitle: existingAppointment.title,
              },
            },
          });
        });

        return {
          message: "Compromisso cancelado com sucesso",
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível cancelar o compromisso",
        });
      }
    }
  );

  // GET /api/appointments/calendar/:year/:month - Visualização de calendário
  fastify.get(
    "/calendar/:year/:month",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { year, month } = request.params as {
          year: string;
          month: string;
        };

        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(
          parseInt(year),
          parseInt(month),
          0,
          23,
          59,
          59
        );

        const appointments = await prisma.appointment.findMany({
          where: {
            lawyerId: request.user.id,
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            case: {
              include: {
                client: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { startDate: "asc" },
        });

        return {
          year: parseInt(year),
          month: parseInt(month),
          appointments: appointments.map((appointment) => ({
            id: appointment.id,
            title: appointment.title,
            type: appointment.type,
            status: appointment.status,
            startDate: appointment.startDate,
            endDate: appointment.endDate,
            case: appointment.case
              ? {
                  id: appointment.case.id,
                  title: appointment.case.title,
                  client: {
                    id: appointment.case.client.id,
                    name: appointment.case.client.user.name,
                  },
                }
              : null,
          })),
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar o calendário",
        });
      }
    }
  );

  // GET /api/appointments/upcoming - Próximos compromissos
  fastify.get(
    "/upcoming",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { days = 7 } = request.query as { days?: number };

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const appointments = await prisma.appointment.findMany({
          where: {
            lawyerId: request.user.id,
            status: { in: ["SCHEDULED", "CONFIRMED"] },
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            case: {
              include: {
                client: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { startDate: "asc" },
          take: 10,
        });

        return {
          appointments: appointments.map((appointment) => ({
            id: appointment.id,
            title: appointment.title,
            type: appointment.type,
            status: appointment.status,
            startDate: appointment.startDate,
            endDate: appointment.endDate,
            case: appointment.case
              ? {
                  id: appointment.case.id,
                  title: appointment.case.title,
                  client: {
                    id: appointment.case.client.id,
                    name: appointment.case.client.user.name,
                  },
                }
              : null,
          })),
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar os próximos compromissos",
        });
      }
    }
  );
}
