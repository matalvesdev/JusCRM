import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../plugins/auth";
import { AuditService } from "../lib/audit";

// Schemas de validação
const createTemplateSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    "PETITION",
    "CONTRACT",
    "LETTER",
    "PROCURATION",
    "MOTION",
    "APPEAL",
    "AGREEMENT",
    "EMAIL",
    "NOTIFICATION",
    "OTHER",
  ]),
  category: z
    .enum([
      "LABOR_LAW",
      "CIVIL_LAW",
      "CORPORATE_LAW",
      "FAMILY_LAW",
      "CRIMINAL_LAW",
      "ADMINISTRATIVE",
      "GENERAL",
    ])
    .default("GENERAL"),
  content: z.string().min(1, "Conteúdo não pode estar vazio"),
  variables: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "date", "number", "boolean", "select"]),
        required: z.boolean().default(false),
        defaultValue: z.string().optional(),
        options: z.array(z.string()).optional(),
      })
    )
    .optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

const listTemplatesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  type: z
    .enum([
      "ALL",
      "PETITION",
      "CONTRACT",
      "LETTER",
      "PROCURATION",
      "MOTION",
      "APPEAL",
      "AGREEMENT",
      "EMAIL",
      "NOTIFICATION",
      "OTHER",
    ])
    .default("ALL"),
  category: z
    .enum([
      "ALL",
      "LABOR_LAW",
      "CIVIL_LAW",
      "CORPORATE_LAW",
      "FAMILY_LAW",
      "CRIMINAL_LAW",
      "ADMINISTRATIVE",
      "GENERAL",
    ])
    .default("ALL"),
  search: z.string().optional(),
  isPublic: z.enum(["ALL", "true", "false"]).default("ALL"),
  createdBy: z.string().optional(),
});

const generateDocumentSchema = z.object({
  variables: z.record(z.any()),
  documentName: z.string().min(1, "Nome do documento é obrigatório").optional(),
  caseId: z.string().cuid().optional(),
});

export async function templateRoutes(app: FastifyInstance) {
  // Middleware de autenticação para todas as rotas
  app.addHook("preHandler", requireAuth);

  // Listar templates
  app.get("/", async (request, reply) => {
    try {
      const { page, limit, type, category, search, isPublic, createdBy } =
        listTemplatesSchema.parse(request.query);

      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        isActive: true,
      };

      if (type !== "ALL") {
        where.type = type;
      }

      if (category !== "ALL") {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { has: search } },
        ];
      }

      if (isPublic !== "ALL") {
        where.isPublic = isPublic === "true";
      }

      if (createdBy) {
        where.createdById = createdBy;
      }

      // Se não for admin, só pode ver templates públicos ou próprios
      if ((request.user as any).role !== "ADMIN") {
        where.OR = [
          { isPublic: true },
          { createdById: (request.user as any).id },
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.template.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.template.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Erro ao listar templates:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });

  // Buscar template por ID
  app.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const template = await prisma.template.findFirst({
        where: {
          id,
          isActive: true,
          OR:
            (request.user as any).role === "ADMIN"
              ? undefined
              : [{ isPublic: true }, { createdById: (request.user as any).id }],
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!template) {
        return reply.status(404).send({
          message: "Template não encontrado",
        });
      }

      return reply.send(template);
    } catch (error) {
      console.error("Erro ao buscar template:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });

  // Criar template
  app.post("/", async (request, reply) => {
    try {
      const data = createTemplateSchema.parse(request.body);

      const template = await prisma.template.create({
        data: {
          ...data,
          variables: data.variables || [],
          tags: data.tags || [],
          createdById: (request.user as any).id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log de auditoria
      await AuditService.logCreate(
        "TEMPLATE",
        template.id,
        template.name,
        template.createdBy,
        template,
        { type: template.type, category: template.category },
        { ip: request.ip, headers: request.headers }
      );

      return reply.status(201).send({
        message: "Template criado com sucesso",
        template,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Dados inválidos",
          errors: error.errors,
        });
      }

      console.error("Erro ao criar template:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });

  // Atualizar template
  app.put("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateTemplateSchema.parse(request.body);

      // Verificar se o template existe e se o usuário tem permissão
      const existingTemplate = await prisma.template.findFirst({
        where: {
          id,
          isActive: true,
          OR:
            (request.user as any).role === "ADMIN"
              ? undefined
              : [{ createdById: (request.user as any).id }],
        },
      });

      if (!existingTemplate) {
        return reply.status(404).send({
          message: "Template não encontrado",
        });
      }

      const template = await prisma.template.update({
        where: { id },
        data: {
          ...data,
          version: existingTemplate.version + 1,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log de auditoria
      const currentUser = request.user as any;
      await AuditService.logUpdate(
        "TEMPLATE",
        template.id,
        template.name,
        {
          id: currentUser.id,
          email: currentUser.email || "",
          name: currentUser.name || "",
        },
        existingTemplate,
        template,
        { version: template.version },
        { ip: request.ip, headers: request.headers }
      );

      return reply.send({
        message: "Template atualizado com sucesso",
        template,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Dados inválidos",
          errors: error.errors,
        });
      }

      console.error("Erro ao atualizar template:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });

  // Excluir template (soft delete)
  app.delete("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Verificar se o template existe e se o usuário tem permissão
      const existingTemplate = await prisma.template.findFirst({
        where: {
          id,
          isActive: true,
          OR:
            (request.user as any).role === "ADMIN"
              ? undefined
              : [{ createdById: (request.user as any).id }],
        },
      });

      if (!existingTemplate) {
        return reply.status(404).send({
          message: "Template não encontrado",
        });
      }

      await prisma.template.update({
        where: { id },
        data: { isActive: false },
      });

      // Log de auditoria
      const currentUser = request.user as any;
      await AuditService.logDelete(
        "TEMPLATE",
        existingTemplate.id,
        existingTemplate.name,
        {
          id: currentUser.id,
          email: currentUser.email || "",
          name: currentUser.name || "",
        },
        existingTemplate,
        { deletionType: "soft" },
        { ip: request.ip, headers: request.headers }
      );

      return reply.send({
        message: "Template excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir template:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });

  // Duplicar template
  app.post("/:id/duplicate", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { name } = request.body as { name: string };

      if (!name || name.trim().length === 0) {
        return reply.status(400).send({
          message: "Nome é obrigatório para duplicar template",
        });
      } // Buscar template original
      const originalTemplate = await prisma.template.findFirst({
        where: {
          id,
          isActive: true,
          OR:
            (request.user as any).role === "ADMIN"
              ? undefined
              : [{ isPublic: true }, { createdById: (request.user as any).id }],
        },
      });

      if (!originalTemplate) {
        return reply.status(404).send({
          message: "Template não encontrado",
        });
      }

      // Criar cópia
      const duplicatedTemplate = await prisma.template.create({
        data: {
          name: name.trim(),
          description: originalTemplate.description,
          type: originalTemplate.type,
          category: originalTemplate.category,
          content: originalTemplate.content,
          variables: originalTemplate.variables as any,
          tags: originalTemplate.tags,
          isPublic: false, // Cópias sempre começam como privadas
          createdById: (request.user as any).id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log de auditoria para duplicação
      await AuditService.logDuplicate(
        "TEMPLATE",
        originalTemplate.id,
        originalTemplate.name,
        duplicatedTemplate.id,
        duplicatedTemplate.name,
        duplicatedTemplate.createdBy,
        {
          originalType: originalTemplate.type,
          originalCategory: originalTemplate.category,
        },
        { ip: request.ip, headers: request.headers }
      );

      return reply.status(201).send({
        message: "Template duplicado com sucesso",
        template: duplicatedTemplate,
      });
    } catch (error) {
      console.error("Erro ao duplicar template:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });

  // Gerar documento a partir de template
  app.post("/:id/generate", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = generateDocumentSchema.parse(request.body);

      // Buscar template
      const template = await prisma.template.findFirst({
        where: {
          id: id,
          isActive: true,
          OR:
            (request.user as any).role === "ADMIN"
              ? undefined
              : [{ isPublic: true }, { createdById: (request.user as any).id }],
        },
      });

      if (!template) {
        return reply.status(404).send({
          message: "Template não encontrado",
        });
      }

      // Simular geração de documento (aqui você implementaria a lógica real)
      let content = template.content;

      // Substituir variáveis no conteúdo
      Object.entries(data.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        content = content.replace(regex, String(value));
      });

      // Incrementar contador de uso
      await prisma.template.update({
        where: { id: template.id },
        data: { usageCount: template.usageCount + 1 },
      });

      // Gerar dados do documento
      const documentId = `doc_${Date.now()}`;
      const documentName =
        data.documentName ||
        `${template.name} - ${new Date().toLocaleDateString()}`;

      // Log de auditoria para geração
      const currentUser = request.user as any;
      await AuditService.logGenerate(
        "DOCUMENT",
        template.id,
        template.name,
        documentId,
        documentName,
        {
          id: currentUser.id,
          email: currentUser.email || "",
          name: currentUser.name || "",
        },
        {
          templateType: template.type,
          templateCategory: template.category,
          variablesUsed: Object.keys(data.variables).length,
          templateUsageCount: template.usageCount + 1,
        },
        { ip: request.ip, headers: request.headers }
      );

      // Aqui você salvaria o documento na base de dados se necessário
      // Por enquanto, apenas retornamos o conteúdo gerado

      return reply.send({
        message: "Documento gerado com sucesso",
        document: {
          id: documentId,
          name: documentName,
          content,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Dados inválidos",
          errors: error.errors,
        });
      }

      console.error("Erro ao gerar documento:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });

  // Obter estatísticas dos templates
  app.get("/stats", async (request, reply) => {
    try {
      const [
        totalTemplates,
        publicTemplates,
        privateTemplates,
        templatesByType,
        templatesByCategory,
        topUsedTemplates,
      ] = await Promise.all([
        prisma.template.count({
          where: { isActive: true },
        }),
        prisma.template.count({
          where: { isActive: true, isPublic: true },
        }),
        prisma.template.count({
          where: { isActive: true, isPublic: false },
        }),
        prisma.template.groupBy({
          by: ["type"],
          where: { isActive: true },
          _count: { type: true },
        }),
        prisma.template.groupBy({
          by: ["category"],
          where: { isActive: true },
          _count: { category: true },
        }),
        prisma.template.findMany({
          where: { isActive: true },
          orderBy: { usageCount: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            usageCount: true,
            type: true,
            category: true,
          },
        }),
      ]);

      return reply.send({
        total: totalTemplates,
        public: publicTemplates,
        private: privateTemplates,
        byType: templatesByType.map((item) => ({
          type: item.type,
          count: item._count.type,
        })),
        byCategory: templatesByCategory.map((item) => ({
          category: item.category,
          count: item._count.category,
        })),
        topUsed: topUsedTemplates,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return reply.status(500).send({
        message: "Erro interno do servidor",
      });
    }
  });
}
