import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// Plugin das rotas de audit
const auditRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware de autenticação
  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Token inválido" });
    }
  });

  // GET /api/audit - Listar logs de auditoria
  fastify.get("/", async (request, reply) => {
    try {
      const {
        page = "1",
        limit = "50",
        userId,
        entity,
        action,
        entityId,
        startDate,
        endDate,
        search,
      } = request.query as any;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Construir filtros
      const where: any = {};

      if (userId) {
        where.userId = userId;
      }

      if (entity) {
        where.entity = entity;
      }

      if (action) {
        where.action = action;
      }

      if (entityId) {
        where.entityId = entityId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      if (search) {
        where.OR = [
          { userEmail: { contains: search, mode: "insensitive" } },
          { userName: { contains: search, mode: "insensitive" } },
          { entityName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
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
        }),
        prisma.auditLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return {
        logs: logs.map((log) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        })),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      };
    } catch (error) {
      fastify.log.error("Erro ao buscar logs de auditoria:", error);
      reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  // GET /api/audit/stats - Estatísticas de auditoria
  fastify.get("/stats", async (request, reply) => {
    try {
      const { period = "month", entity } = request.query as any;

      // Calcular data de início baseada no período
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
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const where: any = {
        createdAt: {
          gte: startDate,
        },
      };

      if (entity) {
        where.entity = entity;
      }

      // Total de logs
      const totalLogs = await prisma.auditLog.count({ where });

      // Estatísticas por ação
      const actionStats = await prisma.auditLog.groupBy({
        by: ["action"],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: "desc",
          },
        },
      });

      // Estatísticas por entidade
      const entityStats = await prisma.auditLog.groupBy({
        by: ["entity"],
        where,
        _count: {
          entity: true,
        },
        orderBy: {
          _count: {
            entity: "desc",
          },
        },
      });

      // Estatísticas por usuário
      const userStats = await prisma.auditLog.groupBy({
        by: ["userId", "userName", "userEmail"],
        where,
        _count: {
          userId: true,
        },
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 10,
      });

      return {
        totalLogs,
        actionStats: actionStats.map((stat) => ({
          action: stat.action,
          count: stat._count.action,
        })),
        entityStats: entityStats.map((stat) => ({
          entity: stat.entity,
          count: stat._count.entity,
        })),
        userStats: userStats.map((stat) => ({
          userId: stat.userId,
          userName: stat.userName,
          userEmail: stat.userEmail,
          count: stat._count.userId,
        })),
      };
    } catch (error) {
      fastify.log.error("Erro ao buscar estatísticas de auditoria:", error);
      reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  // GET /api/audit/:id - Buscar log específico
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const log = await prisma.auditLog.findUnique({
        where: { id },
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
      });

      if (!log) {
        return reply
          .status(404)
          .send({ error: "Log de auditoria não encontrado" });
      }

      return {
        ...log,
        createdAt: log.createdAt.toISOString(),
      };
    } catch (error) {
      fastify.log.error("Erro ao buscar log de auditoria:", error);
      reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });
};

export default auditRoutes;
