import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { prisma } from "../lib/prisma";

export const dashboardRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Helper para verificar autorização usando JWT diretamente
  const requireAuth = async (request: any, reply: any) => {
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
      request.currentUser = {
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
  // Endpoint para estatísticas gerais
  fastify.get(
    "/stats",
    {
      preHandler: requireAuth,
      schema: {
        response: {
          200: Type.Object({
            data: Type.Object({
              totalClients: Type.Number(),
              activeCases: Type.Number(),
              totalDocuments: Type.Number(),
              upcomingHearings: Type.Number(),
              casesStatusCount: Type.Object({
                DRAFT: Type.Number(),
                ACTIVE: Type.Number(),
                SUSPENDED: Type.Number(),
                CLOSED: Type.Number(),
                ARCHIVED: Type.Number(),
              }),
              recentActivity: Type.Array(
                Type.Object({
                  id: Type.String(),
                  type: Type.String(),
                  description: Type.String(),
                  date: Type.String(),
                  entityId: Type.String(),
                  entityType: Type.String(),
                })
              ),
            }),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id; // Buscar estatísticas
      const [totalClients, casesStatusCount, totalDocuments, upcomingHearings] =
        await Promise.all([
          // Total de clientes
          prisma.clientProfile.count({
            where: {
              cases: {
                some: {
                  lawyerId: userId,
                },
              },
            },
          }),

          // Casos por status
          prisma.case.groupBy({
            by: ["status"],
            where: {
              lawyerId: userId,
            },
            _count: {
              status: true,
            },
          }),

          // Total de documentos (quando implementarmos)
          Promise.resolve(0), // Placeholder por enquanto

          // Audiências nos próximos 7 dias (quando implementarmos)
          Promise.resolve(0), // Placeholder por enquanto
        ]);

      // Casos ativos
      const activeCases =
        casesStatusCount.find((c) => c.status === "ACTIVE")?._count.status || 0; // Transformar dados de casos por status
      const casesStatusCountFormatted = {
        DRAFT: 0,
        ACTIVE: 0,
        SUSPENDED: 0,
        CLOSED: 0,
        ARCHIVED: 0,
      };

      casesStatusCount.forEach((item) => {
        casesStatusCountFormatted[item.status] = item._count.status;
      }); // Atividade recente (últimos casos criados/atualizados)
      const recentCases = await prisma.case.findMany({
        where: {
          lawyerId: userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }); // Buscar os nomes dos clientes
      const clientIds = recentCases.map((c) => c.clientId);
      const clients = await prisma.clientProfile.findMany({
        where: {
          id: { in: clientIds },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      const clientMap = new Map(clients.map((c) => [c.id, c.user.name]));

      const recentActivity = recentCases.map((caseItem) => ({
        id: caseItem.id,
        type: "case_update",
        description: `Caso "${caseItem.title}" do cliente ${
          clientMap.get(caseItem.clientId) || "N/A"
        }`,
        date: caseItem.updatedAt.toISOString(),
        entityId: caseItem.id,
        entityType: "case",
      }));

      return {
        data: {
          totalClients,
          activeCases,
          totalDocuments,
          upcomingHearings,
          casesStatusCount: casesStatusCountFormatted,
          recentActivity,
        },
      };
    }
  ); // Endpoint para gráfico de casos por status
  fastify.get(
    "/charts/cases-by-status",
    {
      preHandler: requireAuth,
      schema: {
        response: {
          200: Type.Object({
            data: Type.Array(
              Type.Object({
                status: Type.String(),
                count: Type.Number(),
                label: Type.String(),
                color: Type.String(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id;

      const casesStatusCount = await prisma.case.groupBy({
        by: ["status"],
        where: {
          lawyerId: userId,
        },
        _count: {
          status: true,
        },
      });
      const statusLabels = {
        DRAFT: "Rascunho",
        ACTIVE: "Ativo",
        SUSPENDED: "Suspenso",
        CLOSED: "Fechado",
        ARCHIVED: "Arquivado",
      };

      const statusColors = {
        DRAFT: "#9ca3af", // gray-400
        ACTIVE: "#10b981", // green-500
        SUSPENDED: "#f59e0b", // amber-500
        CLOSED: "#3b82f6", // blue-500
        ARCHIVED: "#6b7280", // gray-500
      };

      const data = casesStatusCount.map((item) => ({
        status: item.status,
        count: item._count.status,
        label: statusLabels[item.status] || item.status,
        color: statusColors[item.status] || "#6b7280",
      }));

      return { data };
    }
  ); // Endpoint para gráfico de casos por tempo (últimos 6 meses)
  fastify.get(
    "/cases-timeline",
    {
      preHandler: requireAuth,
      schema: {
        querystring: Type.Object({
          period: Type.Optional(
            Type.Union([
              Type.Literal("week"),
              Type.Literal("month"),
              Type.Literal("quarter"),
              Type.Literal("year"),
            ])
          ),
        }),
        response: {
          200: Type.Object({
            data: Type.Array(
              Type.Object({
                period: Type.String(),
                total: Type.Number(),
                active: Type.Number(),
                closed: Type.Number(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id;
      const { period = "month" } = request.query as any;

      // Calcular período baseado na query
      const now = new Date();
      let startDate: Date;
      let groupByFormat: string;

      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 semanas
          groupByFormat = 'YYYY-"W"WW';
          break;
        case "quarter":
          startDate = new Date(now.getFullYear() - 2, 0, 1); // 2 anos
          groupByFormat = "YYYY-Q";
          break;
        case "year":
          startDate = new Date(now.getFullYear() - 5, 0, 1); // 5 anos
          groupByFormat = "YYYY";
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 meses
          groupByFormat = "YYYY-MM";
      }

      try {
        // Query SQL para agrupar casos por período
        const casesTimeline = (await prisma.$queryRaw`
          SELECT 
            TO_CHAR(created_at, ${groupByFormat}) as period,
            COUNT(*)::int as total,
            COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int as active,
            COUNT(CASE WHEN status = 'CLOSED' THEN 1 END)::int as closed
          FROM cases 
          WHERE lawyer_id = ${userId}
            AND created_at >= ${startDate}
          GROUP BY TO_CHAR(created_at, ${groupByFormat})
          ORDER BY period DESC
          LIMIT 12
        `) as Array<{
          period: string;
          total: number;
          active: number;
          closed: number;
        }>;

        return {
          data: casesTimeline,
        };
      } catch (error) {
        console.error("[Dashboard] Erro ao buscar timeline de casos:", error);
        return { data: [] };
      }
    }
  ); // Endpoint para top clientes por casos
  fastify.get(
    "/top-clients",
    {
      preHandler: requireAuth,
      schema: {
        querystring: Type.Object({
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20 })),
        }),
        response: {
          200: Type.Object({
            data: Type.Array(
              Type.Object({
                clientId: Type.String(),
                clientName: Type.String(),
                clientEmail: Type.String(),
                totalCases: Type.Number(),
                activeCases: Type.Number(),
                closedCases: Type.Number(),
                lastCaseDate: Type.String(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id;
      const { limit = 10 } = request.query as any;

      try {
        const topClients = (await prisma.$queryRaw`
          SELECT 
            cp.id as client_id,
            u.name as client_name,
            u.email as client_email,
            COUNT(c.id)::int as total_cases,
            COUNT(CASE WHEN c.status = 'ACTIVE' THEN 1 END)::int as active_cases,
            COUNT(CASE WHEN c.status = 'CLOSED' THEN 1 END)::int as closed_cases,
            MAX(c.created_at) as last_case_date
          FROM client_profiles cp
          INNER JOIN users u ON cp.user_id = u.id
          INNER JOIN cases c ON cp.id = c.client_id
          WHERE c.lawyer_id = ${userId}
          GROUP BY cp.id, u.name, u.email
          ORDER BY total_cases DESC, last_case_date DESC
          LIMIT ${limit}
        `) as Array<{
          client_id: string;
          client_name: string;
          client_email: string;
          total_cases: number;
          active_cases: number;
          closed_cases: number;
          last_case_date: Date;
        }>;

        return {
          data: topClients.map((client) => ({
            clientId: client.client_id,
            clientName: client.client_name,
            clientEmail: client.client_email,
            totalCases: client.total_cases,
            activeCases: client.active_cases,
            closedCases: client.closed_cases,
            lastCaseDate: client.last_case_date.toISOString(),
          })),
        };
      } catch (error) {
        console.error("[Dashboard] Erro ao buscar top clientes:", error);
        return { data: [] };
      }
    }
  ); // Endpoint para prazos próximos do vencimento
  fastify.get(
    "/upcoming-deadlines",
    {
      preHandler: requireAuth,
      schema: {
        querystring: Type.Object({
          days: Type.Optional(Type.Number({ minimum: 1, maximum: 365 })),
        }),
        response: {
          200: Type.Object({
            data: Type.Array(
              Type.Object({
                id: Type.String(),
                title: Type.String(),
                description: Type.String(),
                dueDate: Type.String(),
                daysUntilDue: Type.Number(),
                priority: Type.String(),
                type: Type.String(),
                caseId: Type.String(),
                caseTitle: Type.String(),
                clientName: Type.String(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id;
      const { days = 30 } = request.query as any;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      try {
        // Buscar compromissos próximos
        const upcomingAppointments = await prisma.appointment.findMany({
          where: {
            lawyerId: userId,
            startDate: {
              gte: new Date(),
              lte: futureDate,
            },
          },
          include: {
            case: {
              include: {
                client: {
                  include: {
                    user: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            startDate: "asc",
          },
          take: 20,
        });

        // Buscar atividades próximas
        const upcomingActivities = await prisma.activity.findMany({
          where: {
            userId: userId,
            dueDate: {
              gte: new Date(),
              lte: futureDate,
            },
          },
          include: {
            case: {
              include: {
                client: {
                  include: {
                    user: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 20,
        });

        const deadlines = [
          ...upcomingAppointments.map((apt) => {
            const daysUntil = Math.ceil(
              (apt.startDate.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return {
              id: apt.id,
              title: apt.title,
              description: apt.description || "",
              dueDate: apt.startDate.toISOString(),
              daysUntilDue: daysUntil,
              priority: "MEDIUM",
              type: "APPOINTMENT",
              caseId: apt.caseId || "",
              caseTitle: apt.case?.title || "",
              clientName: apt.case?.client?.user?.name || "",
            };
          }),
          ...upcomingActivities.map((act) => {
            const daysUntil = Math.ceil(
              (act.dueDate!.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return {
              id: act.id,
              title: act.title,
              description: act.description || "",
              dueDate: act.dueDate!.toISOString(),
              daysUntilDue: daysUntil,
              priority: act.priority,
              type: "ACTIVITY",
              caseId: act.caseId || "",
              caseTitle: act.case?.title || "",
              clientName: act.case?.client?.user?.name || "",
            };
          }),
        ].sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

        return {
          data: deadlines.slice(0, 20),
        };
      } catch (error) {
        console.error("[Dashboard] Erro ao buscar prazos próximos:", error);
        return { data: [] };
      }
    }
  ); // Endpoint para atividades recentes melhoradas
  fastify.get(
    "/recent-activities",
    {
      preHandler: requireAuth,
      schema: {
        querystring: Type.Object({
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50 })),
          includeAudit: Type.Optional(Type.Boolean()),
        }),
        response: {
          200: Type.Object({
            data: Type.Array(
              Type.Object({
                id: Type.String(),
                type: Type.String(),
                action: Type.String(),
                title: Type.String(),
                description: Type.String(),
                entityType: Type.String(),
                entityId: Type.String(),
                entityName: Type.String(),
                userId: Type.String(),
                userName: Type.String(),
                createdAt: Type.String(),
                metadata: Type.Optional(Type.Any()),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id;
      const { limit = 10, includeAudit = true } = request.query as any;

      try {
        const activities = [];

        // Incluir logs de auditoria se solicitado
        if (includeAudit) {
          const auditLogs = await prisma.auditLog.findMany({
            where: {
              userId: userId,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: Math.ceil(limit * 0.7), // 70% dos resultados
          });

          activities.push(
            ...auditLogs.map((log) => ({
              id: log.id,
              type: "AUDIT",
              action: log.action,
              title: log.entityName || `${log.entity} ${log.action}`,
              description: log.description || `${log.action} em ${log.entity}`,
              entityType: log.entity,
              entityId: log.entityId || "",
              entityName: log.entityName || "",
              userId: log.userId,
              userName: log.userName,
              createdAt: log.createdAt.toISOString(),
              metadata: log.metadata,
            }))
          );
        }

        // Incluir atividades do sistema
        const systemActivities = await prisma.activity.findMany({
          where: {
            userId: userId,
          },
          include: {
            case: {
              include: {
                client: {
                  include: {
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: Math.ceil(limit * 0.3), // 30% dos resultados
        });

        activities.push(
          ...systemActivities.map((act) => ({
            id: act.id,
            type: "ACTIVITY",
            action: "CREATE",
            title: act.title,
            description: act.description || "",
            entityType: "ACTIVITY",
            entityId: act.id,
            entityName: act.title,
            userId: act.userId,
            userName: act.case?.client?.user?.name || "Sistema",
            createdAt: act.createdAt.toISOString(),
            metadata: {
              caseId: act.caseId,
              caseTitle: act.case?.title,
              priority: act.priority,
              status: act.status,
            },
          }))
        );

        // Ordenar por data e limitar
        const sortedActivities = activities
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, limit);

        return {
          data: sortedActivities,
        };
      } catch (error) {
        console.error("[Dashboard] Erro ao buscar atividades recentes:", error);
        return { data: [] };
      }
    }
  ); // Endpoint para estatísticas de auditoria
  fastify.get(
    "/audit-stats",
    {
      preHandler: requireAuth,
      schema: {
        querystring: Type.Object({
          period: Type.Optional(
            Type.Union([
              Type.Literal("today"),
              Type.Literal("week"),
              Type.Literal("month"),
            ])
          ),
        }),
        response: {
          200: Type.Object({
            data: Type.Object({
              totalActions: Type.Number(),
              loginCount: Type.Number(),
              createCount: Type.Number(),
              updateCount: Type.Number(),
              deleteCount: Type.Number(),
              actionsByDay: Type.Array(
                Type.Object({
                  date: Type.String(),
                  count: Type.Number(),
                })
              ),
              topActions: Type.Array(
                Type.Object({
                  action: Type.String(),
                  count: Type.Number(),
                })
              ),
            }),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id;
      const { period = "week" } = request.query as any;

      // Calcular data de início
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default: // week
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      try {
        const [totalActions, actionCounts, actionsByDay, topActions] =
          await Promise.all([
            // Total de ações
            prisma.auditLog.count({
              where: {
                userId: userId,
                createdAt: { gte: startDate },
              },
            }),

            // Contagem por tipo de ação
            prisma.auditLog.groupBy({
              by: ["action"],
              where: {
                userId: userId,
                createdAt: { gte: startDate },
              },
              _count: { action: true },
            }),

            // Ações por dia
            prisma.$queryRaw`
            SELECT 
              DATE(created_at) as date,
              COUNT(*)::int as count
            FROM audit_logs 
            WHERE user_id = ${userId}
              AND created_at >= ${startDate}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
          ` as Array<{ date: string; count: number }>,

            // Top ações
            prisma.auditLog.groupBy({
              by: ["action"],
              where: {
                userId: userId,
                createdAt: { gte: startDate },
              },
              _count: { action: true },
              orderBy: { _count: { action: "desc" } },
              take: 5,
            }),
          ]);

        const actionCountsMap = new Map(
          actionCounts.map((a) => [a.action, a._count.action])
        );

        return {
          data: {
            totalActions,
            loginCount: actionCountsMap.get("LOGIN") || 0,
            createCount: actionCountsMap.get("CREATE") || 0,
            updateCount: actionCountsMap.get("UPDATE") || 0,
            deleteCount: actionCountsMap.get("DELETE") || 0,
            actionsByDay: actionsByDay.map((item) => ({
              date: item.date,
              count: item.count,
            })),
            topActions: topActions.map((item) => ({
              action: item.action,
              count: item._count.action,
            })),
          },
        };
      } catch (error) {
        console.error(
          "[Dashboard] Erro ao buscar estatísticas de auditoria:",
          error
        );
        return {
          data: {
            totalActions: 0,
            loginCount: 0,
            createCount: 0,
            updateCount: 0,
            deleteCount: 0,
            actionsByDay: [],
            topActions: [],
          },
        };
      }
    }
  );
};
