import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../plugins/auth";
import { prisma } from "../lib/prisma";
import * as path from "path";
import * as fs from "fs/promises";

// Schemas de validação
const uploadDocumentSchema = z.object({
  name: z.string().min(1, "Nome do documento é obrigatório"),
  type: z.enum([
    "CONTRACT",
    "PROCURATION",
    "EVIDENCE",
    "PETITION",
    "DECISION",
    "PROTOCOL",
    "OTHER",
  ]),
  caseId: z.string().optional(),
});

const documentsFilterSchema = z.object({
  search: z.string().optional(),
  type: z
    .enum([
      "CONTRACT",
      "PROCURATION",
      "EVIDENCE",
      "PETITION",
      "DECISION",
      "PROTOCOL",
      "OTHER",
    ])
    .optional(),
  caseId: z.string().optional(),
  uploadedById: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Configurar pasta de uploads
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "documents");

// Garantir que a pasta de uploads existe
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function documentsRoutes(fastify: FastifyInstance) {
  // Garantir pasta de uploads na inicialização
  await ensureUploadDir();

  // GET /api/documents - Listar documentos com filtros
  fastify.get(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { search, type, caseId, uploadedById, page, limit } =
          documentsFilterSchema.parse(request.query);

        const skip = (page - 1) * limit;

        // Construir filtros dinâmicos
        const where: any = {};

        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { filename: { contains: search, mode: "insensitive" } },
          ];
        }

        if (type) {
          where.type = type;
        }

        if (caseId) {
          where.caseId = caseId;
        }

        if (uploadedById) {
          where.uploadedById = uploadedById;
        }

        // Buscar documentos com paginação
        const [documents, total] = await Promise.all([
          prisma.document.findMany({
            where,
            include: {
              case: {
                select: {
                  id: true,
                  title: true,
                  number: true,
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
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.document.count({ where }),
        ]);

        return {
          documents: documents.map((doc) => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            filename: doc.filename,
            size: doc.size,
            mimeType: doc.mimeType,
            url: doc.url,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            case: doc.case
              ? {
                  id: doc.case.id,
                  title: doc.case.title,
                  number: doc.case.number,
                  client: {
                    id: doc.case.client.id,
                    name: doc.case.client.user.name,
                    email: doc.case.client.user.email,
                  },
                }
              : null,
            uploadedBy: doc.uploadedBy,
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
          message: "Não foi possível buscar os documentos",
        });
      }
    }
  );

  // GET /api/documents/:id - Buscar documento por ID
  fastify.get(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const document = await prisma.document.findUnique({
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
                      },
                    },
                  },
                },
                lawyer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        });

        if (!document) {
          return reply.status(404).send({
            error: "Documento não encontrado",
            message: "O documento solicitado não existe",
          });
        }

        return {
          id: document.id,
          name: document.name,
          type: document.type,
          filename: document.filename,
          size: document.size,
          mimeType: document.mimeType,
          url: document.url,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          case: document.case,
          uploadedBy: document.uploadedBy,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar o documento",
        });
      }
    }
  );

  // POST /api/documents/upload - Upload de documento
  fastify.post(
    "/upload",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: "Arquivo obrigatório",
            message: "Nenhum arquivo foi enviado",
          });
        }

        // Validar tipo de arquivo
        const allowedMimeTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
          "image/gif",
          "text/plain",
        ];

        if (!allowedMimeTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            error: "Tipo de arquivo não permitido",
            message:
              "Apenas arquivos PDF, DOC, DOCX, JPG, PNG, GIF e TXT são permitidos",
          });
        }

        // Validar tamanho do arquivo (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        const buffer = await data.toBuffer();

        if (buffer.length > maxSize) {
          return reply.status(400).send({
            error: "Arquivo muito grande",
            message: "O arquivo deve ter no máximo 10MB",
          });
        }

        // Gerar nome único para o arquivo
        const fileExtension = path.extname(data.filename);
        const uniqueFilename = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}${fileExtension}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);

        // Salvar arquivo no disco
        await fs.writeFile(filePath, buffer);

        // Obter dados do formulário
        const fields = data.fields as any;
        const documentData = {
          name: fields.name?.value || data.filename,
          type: fields.type?.value || "OTHER",
          caseId: fields.caseId?.value,
        };

        const validatedData = uploadDocumentSchema.parse(documentData);

        // Verificar se caso existe (se fornecido)
        if (validatedData.caseId) {
          const caseExists = await prisma.case.findUnique({
            where: { id: validatedData.caseId },
          });
          if (!caseExists) {
            // Remover arquivo se caso não existe
            await fs.unlink(filePath);
            return reply.status(404).send({
              error: "Caso não encontrado",
              message: "O caso especificado não existe",
            });
          }
        }

        // Criar registro no banco de dados
        const result = await prisma.$transaction(async (tx) => {
          // Criar documento
          const document = await tx.document.create({
            data: {
              name: validatedData.name,
              type: validatedData.type,
              filename: uniqueFilename,
              size: buffer.length,
              mimeType: data.mimetype,
              url: `/api/documents/${uniqueFilename}/download`, // URL para download
              caseId: validatedData.caseId,
              uploadedById: request.user.id,
            },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "DOCUMENT_UPLOADED",
              title: "Documento enviado",
              description: `Documento "${validatedData.name}" foi enviado`,
              userId: request.user.id,
              caseId: validatedData.caseId,
              metadata: {
                documentId: document.id,
                documentName: validatedData.name,
                fileSize: buffer.length,
                mimeType: data.mimetype,
              },
            },
          });

          return document;
        });

        return reply.status(201).send({
          message: "Documento enviado com sucesso",
          document: {
            id: result.id,
            name: result.name,
            type: result.type,
            size: result.size,
            mimeType: result.mimeType,
            createdAt: result.createdAt,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível fazer upload do documento",
        });
      }
    }
  );

  // GET /api/documents/:filename/download - Download de documento
  fastify.get(
    "/:filename/download",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { filename } = request.params as { filename: string };

        // Verificar se documento existe no banco
        const document = await prisma.document.findFirst({
          where: { filename },
        });

        if (!document) {
          return reply.status(404).send({
            error: "Documento não encontrado",
            message: "O documento solicitado não existe",
          });
        }

        const filePath = path.join(UPLOAD_DIR, filename);

        // Verificar se arquivo existe no disco
        try {
          await fs.access(filePath);
        } catch {
          return reply.status(404).send({
            error: "Arquivo não encontrado",
            message: "O arquivo físico não foi encontrado",
          });
        } // Enviar arquivo
        reply.header(
          "Content-Disposition",
          `attachment; filename="${document.name}"`
        );
        reply.type(document.mimeType);

        return reply.sendFile(filename, UPLOAD_DIR);

        return stream;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível fazer download do documento",
        });
      }
    }
  );

  // PUT /api/documents/:id - Atualizar documento
  fastify.put(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { name, type, caseId } = request.body as any;

        // Verificar se documento existe
        const existingDocument = await prisma.document.findUnique({
          where: { id },
        });

        if (!existingDocument) {
          return reply.status(404).send({
            error: "Documento não encontrado",
            message: "O documento solicitado não existe",
          });
        }

        // Verificar se caso existe (se fornecido)
        if (caseId) {
          const caseExists = await prisma.case.findUnique({
            where: { id: caseId },
          });
          if (!caseExists) {
            return reply.status(404).send({
              error: "Caso não encontrado",
              message: "O caso especificado não existe",
            });
          }
        }

        // Atualizar documento
        const result = await prisma.$transaction(async (tx) => {
          const updatedDocument = await tx.document.update({
            where: { id },
            data: {
              name: name || existingDocument.name,
              type: type || existingDocument.type,
              caseId: caseId !== undefined ? caseId : existingDocument.caseId,
            },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Documento atualizado",
              description: `Documento "${updatedDocument.name}" foi atualizado`,
              userId: request.user.id,
              caseId: updatedDocument.caseId,
              metadata: {
                documentId: id,
                documentName: updatedDocument.name,
              },
            },
          });

          return updatedDocument;
        });

        return {
          message: "Documento atualizado com sucesso",
          document: {
            id: result.id,
            name: result.name,
            type: result.type,
            updatedAt: result.updatedAt,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível atualizar o documento",
        });
      }
    }
  );

  // DELETE /api/documents/:id - Excluir documento
  fastify.delete(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Verificar se documento existe
        const existingDocument = await prisma.document.findUnique({
          where: { id },
        });

        if (!existingDocument) {
          return reply.status(404).send({
            error: "Documento não encontrado",
            message: "O documento solicitado não existe",
          });
        }

        // Verificar permissão (só quem enviou ou admin pode excluir)
        if (
          existingDocument.uploadedById !== request.user.id &&
          request.user.role !== "ADMIN"
        ) {
          return reply.status(403).send({
            error: "Acesso negado",
            message: "Você não tem permissão para excluir este documento",
          });
        }

        // Excluir documento
        await prisma.$transaction(async (tx) => {
          // Remover do banco
          await tx.document.delete({
            where: { id },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Documento excluído",
              description: `Documento "${existingDocument.name}" foi excluído`,
              userId: request.user.id,
              caseId: existingDocument.caseId,
              metadata: {
                documentId: id,
                documentName: existingDocument.name,
              },
            },
          });
        });

        // Remover arquivo físico
        const filePath = path.join(UPLOAD_DIR, existingDocument.filename);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          fastify.log.warn(`Erro ao remover arquivo físico: ${error}`);
        }

        return {
          message: "Documento excluído com sucesso",
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível excluir o documento",
        });
      }
    }
  );

  // GET /api/documents/case/:caseId - Documentos de um caso específico
  fastify.get(
    "/case/:caseId",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { caseId } = request.params as { caseId: string };

        const documents = await prisma.document.findMany({
          where: { caseId },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          documents: documents.map((doc) => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            filename: doc.filename,
            size: doc.size,
            mimeType: doc.mimeType,
            url: doc.url,
            createdAt: doc.createdAt,
            uploadedBy: doc.uploadedBy,
          })),
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar os documentos do caso",
        });
      }
    }
  );
}
