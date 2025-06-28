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
  ); // Endpoint para próximos compromissos/prazos
  fastify.get(
    "/upcoming-deadlines",
    {
      preHandler: requireAuth,
      schema: {
        querystring: Type.Object({
          days: Type.Optional(
            Type.Number({ minimum: 1, maximum: 30, default: 7 })
          ),
        }),
        response: {
          200: Type.Object({
            data: Type.Array(
              Type.Object({
                id: Type.String(),
                title: Type.String(),
                date: Type.String(),
                type: Type.String(),
                caseId: Type.String(),
                caseTitle: Type.String(),
                clientName: Type.String(),
                priority: Type.String(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.currentUser.id;
      // @ts-ignore - query é tipada pelo schema
      const { days = 7 } = request.query;

      // Por enquanto vamos retornar dados mock
      // Quando implementarmos o sistema de agenda, substituiremos por dados reais
      const mockDeadlines = [
        {
          id: "1",
          title: "Audiência de Conciliação",
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: "hearing",
          caseId: "case1",
          caseTitle: "Processo Trabalhista - Horas Extras",
          clientName: "João Silva",
          priority: "high",
        },
        {
          id: "2",
          title: "Entrega de Documentos",
          date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          type: "document_deadline",
          caseId: "case2",
          caseTitle: "Rescisão Indireta",
          clientName: "Maria Santos",
          priority: "medium",
        },
      ];

      return { data: mockDeadlines };
    }
  );
};
