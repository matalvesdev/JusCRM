import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../plugins/auth";

// Tipos para relatórios
interface ReportGenerationRequest {
  type: string;
  title: string;
  description?: string;
  format: string;
  parameters?: Record<string, any>;
  startDate?: string;
  endDate?: string;
}

// Schemas de validação
const generateReportSchema = z.object({
  type: z.enum([
    "CASES_BY_PERIOD",
    "CASES_BY_STATUS",
    "CASES_BY_CLIENT",
    "CLIENT_ACTIVITY",
    "PRODUCTIVITY",
    "FINANCIAL",
    "CUSTOM",
  ]),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(100),
  description: z.string().max(500).optional(),
  format: z.enum(["PDF", "EXCEL", "CSV", "JSON"]).default("PDF"),
  parameters: z.record(z.any()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const listReportsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  type: z
    .enum([
      "ALL",
      "CASES_BY_PERIOD",
      "CASES_BY_STATUS",
      "CASES_BY_CLIENT",
      "CLIENT_ACTIVITY",
      "PRODUCTIVITY",
      "FINANCIAL",
      "CUSTOM",
    ])
    .default("ALL"),
  status: z
    .enum(["ALL", "PENDING", "GENERATING", "COMPLETED", "FAILED"])
    .default("ALL"),
});

export async function reportRoutes(app: FastifyInstance) {
  // Aplicar autenticação em todas as rotas
  app.addHook("preHandler", requireAuth);

  // GET /api/reports - Listar relatórios
  app.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
            type: {
              type: "string",
              enum: [
                "ALL",
                "CASES_BY_PERIOD",
                "CASES_BY_STATUS",
                "CASES_BY_CLIENT",
                "CLIENT_ACTIVITY",
                "PRODUCTIVITY",
                "FINANCIAL",
                "CUSTOM",
              ],
              default: "ALL",
            },
            status: {
              type: "string",
              enum: ["ALL", "PENDING", "GENERATING", "COMPLETED", "FAILED"],
              default: "ALL",
            },
          },
        },
        tags: ["Reports"],
        summary: "Listar relatórios",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const validationResult = listReportsSchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: {
            message: "Parâmetros inválidos",
            details: validationResult.error.issues,
          },
        });
      }

      const { page, limit, type, status } = validationResult.data;
      const userId = (request.user as any).id;
      const userRole = (request.user as any).role;
      const offset = (page - 1) * limit;

      try {
        // Construir filtros
        const where: any = {};

        // Apenas admins e advogados podem ver todos os relatórios
        if (userRole !== "ADMIN" && userRole !== "LAWYER") {
          where.generatedById = userId;
        }

        if (type !== "ALL") {
          where.type = type;
        }

        if (status !== "ALL") {
          where.status = status;
        }

        // Buscar relatórios e contagem
        const [reports, totalCount] = await Promise.all([
          prisma.report.findMany({
            where,
            include: {
              generatedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
          }),
          prisma.report.count({ where }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return reply.send({
          reports,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor",
            code: "REPORTS_LIST_ERROR",
          },
        });
      }
    }
  );

  // POST /api/reports - Gerar novo relatório
  app.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["type", "title", "format"],
          properties: {
            type: {
              type: "string",
              enum: [
                "CASES_BY_PERIOD",
                "CASES_BY_STATUS",
                "CASES_BY_CLIENT",
                "CLIENT_ACTIVITY",
                "PRODUCTIVITY",
                "FINANCIAL",
                "CUSTOM",
              ],
            },
            title: { type: "string", minLength: 3, maxLength: 100 },
            description: { type: "string", maxLength: 500 },
            format: {
              type: "string",
              enum: ["PDF", "EXCEL", "CSV", "JSON"],
              default: "PDF",
            },
            parameters: { type: "object" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
          },
        },
        tags: ["Reports"],
        summary: "Gerar novo relatório",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const validationResult = generateReportSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: {
            message: "Dados inválidos",
            details: validationResult.error.issues,
          },
        });
      }

      const {
        type,
        title,
        description,
        format,
        parameters,
        startDate,
        endDate,
      } = validationResult.data;
      const userId = (request.user as any).id;

      try {
        // Validar datas se fornecidas
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          return reply.status(400).send({
            error: {
              message: "Data inicial deve ser anterior à data final",
              code: "INVALID_DATE_RANGE",
            },
          });
        }

        // Criar registro do relatório
        const report = await prisma.report.create({
          data: {
            type: type as any,
            title,
            description,
            format: format as any,
            parameters: parameters || {},
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            generatedById: userId,
            status: "PENDING",
          },
          include: {
            generatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // TODO: Aqui seria iniciado o processo de geração do relatório em background
        // Por enquanto, vamos simular que o relatório foi criado com sucesso

        return reply.status(201).send({
          message: "Relatório criado com sucesso. A geração foi iniciada.",
          report,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor ao criar relatório",
            code: "REPORT_CREATION_ERROR",
          },
        });
      }
    }
  );

  // GET /api/reports/:id - Obter detalhes de um relatório
  app.get(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        tags: ["Reports"],
        summary: "Obter detalhes de um relatório",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as any).id;
      const userRole = (request.user as any).role;

      try {
        const report = await prisma.report.findUnique({
          where: { id },
          include: {
            generatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!report) {
          return reply.status(404).send({
            error: {
              message: "Relatório não encontrado",
              code: "REPORT_NOT_FOUND",
            },
          });
        }

        // Verificar permissão de acesso
        if (
          userRole !== "ADMIN" &&
          userRole !== "LAWYER" &&
          report.generatedById !== userId
        ) {
          return reply.status(403).send({
            error: {
              message: "Acesso negado a este relatório",
              code: "ACCESS_DENIED",
            },
          });
        }

        return reply.send({ report });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor",
            code: "REPORT_FETCH_ERROR",
          },
        });
      }
    }
  );

  // GET /api/reports/:id/download - Download do arquivo do relatório
  app.get(
    "/:id/download",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        tags: ["Reports"],
        summary: "Download do arquivo do relatório",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as any).id;
      const userRole = (request.user as any).role;

      try {
        const report = await prisma.report.findUnique({
          where: { id },
        });

        if (!report) {
          return reply.status(404).send({
            error: {
              message: "Relatório não encontrado",
              code: "REPORT_NOT_FOUND",
            },
          });
        }

        // Verificar permissão de acesso
        if (
          userRole !== "ADMIN" &&
          userRole !== "LAWYER" &&
          report.generatedById !== userId
        ) {
          return reply.status(403).send({
            error: {
              message: "Acesso negado a este relatório",
              code: "ACCESS_DENIED",
            },
          });
        }

        if (report.status !== "COMPLETED" || !report.fileUrl) {
          return reply.status(400).send({
            error: {
              message: "Relatório ainda não está pronto para download",
              code: "REPORT_NOT_READY",
            },
          });
        }

        // Verificar se o arquivo não expirou
        if (report.expiresAt && new Date() > report.expiresAt) {
          return reply.status(410).send({
            error: {
              message: "Arquivo do relatório expirou",
              code: "REPORT_EXPIRED",
            },
          });
        }

        // Incrementar contador de downloads
        await prisma.report.update({
          where: { id },
          data: {
            downloadCount: {
              increment: 1,
            },
          },
        });

        // TODO: Implementar download real do arquivo
        // Por enquanto, retornar URL para download
        return reply.send({
          downloadUrl: report.fileUrl,
          fileName: report.fileName,
          fileSize: report.fileSize,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor",
            code: "REPORT_DOWNLOAD_ERROR",
          },
        });
      }
    }
  );

  // DELETE /api/reports/:id - Deletar relatório
  app.delete(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        tags: ["Reports"],
        summary: "Deletar relatório",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as any).id;
      const userRole = (request.user as any).role;

      try {
        const report = await prisma.report.findUnique({
          where: { id },
        });

        if (!report) {
          return reply.status(404).send({
            error: {
              message: "Relatório não encontrado",
              code: "REPORT_NOT_FOUND",
            },
          });
        }

        // Verificar permissão de exclusão
        if (userRole !== "ADMIN" && report.generatedById !== userId) {
          return reply.status(403).send({
            error: {
              message: "Acesso negado para deletar este relatório",
              code: "DELETE_ACCESS_DENIED",
            },
          });
        }

        // TODO: Deletar arquivo físico se existir

        await prisma.report.delete({
          where: { id },
        });

        return reply.send({
          message: "Relatório deletado com sucesso",
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor",
            code: "REPORT_DELETE_ERROR",
          },
        });
      }
    }
  );

  // GET /api/reports/stats - Estatísticas dos relatórios
  app.get(
    "/stats",
    {
      schema: {
        tags: ["Reports"],
        summary: "Estatísticas dos relatórios",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const userRole = (request.user as any).role;

      try {
        const where: any = {};

        // Filtrar por usuário se não for admin/lawyer
        if (userRole !== "ADMIN" && userRole !== "LAWYER") {
          where.generatedById = userId;
        }

        const [
          totalReports,
          completedReports,
          pendingReports,
          failedReports,
          reportsByType,
        ] = await Promise.all([
          prisma.report.count({ where }),
          prisma.report.count({ where: { ...where, status: "COMPLETED" } }),
          prisma.report.count({ where: { ...where, status: "PENDING" } }),
          prisma.report.count({ where: { ...where, status: "FAILED" } }),
          prisma.report.groupBy({
            by: ["type"],
            where,
            _count: true,
          }),
        ]);

        return reply.send({
          total: totalReports,
          byStatus: {
            completed: completedReports,
            pending: pendingReports,
            failed: failedReports,
          },
          byType: reportsByType.map((item) => ({
            type: item.type,
            count: item._count,
          })),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: {
            message: "Erro interno do servidor",
            code: "STATS_ERROR",
          },
        });
      }
    }
  );
}
