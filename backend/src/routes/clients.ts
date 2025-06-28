import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../plugins/auth";
import { prisma } from "../lib/prisma";

// Schemas de validação
const createClientSchema = z.object({
  // Dados do usuário
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),

  // Dados do perfil do cliente
  type: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cnpj: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),

  // Dados profissionais
  company: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().optional(),
  workStart: z.string().optional(),
  workEnd: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

const clientsFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "COMPANY"]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export async function clientsRoutes(fastify: FastifyInstance) {
  // GET /api/clients - Listar clientes com filtros
  fastify.get(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { search, type, city, state, page, limit } =
          clientsFilterSchema.parse(request.query);

        const skip = (page - 1) * limit;

        // Construir filtros dinâmicos
        const where: any = {
          user: {
            role: "CLIENT",
            isActive: true,
          },
        };

        if (search) {
          where.OR = [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { cpf: { contains: search } },
            { cnpj: { contains: search } },
            { phone: { contains: search } },
          ];
        }

        if (type) {
          where.type = type;
        }

        if (city) {
          where.city = { contains: city, mode: "insensitive" };
        }

        if (state) {
          where.state = { contains: state, mode: "insensitive" };
        }

        // Buscar clientes com paginação
        const [clients, total] = await Promise.all([
          prisma.clientProfile.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  isActive: true,
                  createdAt: true,
                },
              },
              cases: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  type: true,
                  value: true,
                  startDate: true,
                },
                orderBy: { createdAt: "desc" },
                take: 3, // Últimos 3 casos
              },
              _count: {
                select: {
                  cases: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.clientProfile.count({ where }),
        ]);

        return {
          clients: clients.map((client) => ({
            id: client.id,
            userId: client.userId,
            name: client.user.name,
            email: client.user.email,
            avatar: client.user.avatar,
            type: client.type,
            cpf: client.cpf,
            rg: client.rg,
            cnpj: client.cnpj,
            birthDate: client.birthDate,
            phone: client.phone,
            address: client.address,
            city: client.city,
            state: client.state,
            zipCode: client.zipCode,
            company: client.company,
            position: client.position,
            salary: client.salary,
            workStart: client.workStart,
            workEnd: client.workEnd,
            isActive: client.user.isActive,
            createdAt: client.user.createdAt,
            updatedAt: client.updatedAt,
            casesCount: client._count.cases,
            recentCases: client.cases,
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
          message: "Não foi possível buscar os clientes",
        });
      }
    }
  );

  // GET /api/clients/:id - Buscar cliente por ID
  fastify.get(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const client = await prisma.clientProfile.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                isActive: true,
                createdAt: true,
              },
            },
            cases: {
              include: {
                lawyer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                assistant: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                _count: {
                  select: {
                    documents: true,
                    appointments: true,
                    activities: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!client) {
          return reply.status(404).send({
            error: "Cliente não encontrado",
            message: "O cliente solicitado não existe",
          });
        }

        return {
          id: client.id,
          userId: client.userId,
          name: client.user.name,
          email: client.user.email,
          avatar: client.user.avatar,
          type: client.type,
          cpf: client.cpf,
          rg: client.rg,
          cnpj: client.cnpj,
          birthDate: client.birthDate,
          phone: client.phone,
          address: client.address,
          city: client.city,
          state: client.state,
          zipCode: client.zipCode,
          company: client.company,
          position: client.position,
          salary: client.salary,
          workStart: client.workStart,
          workEnd: client.workEnd,
          isActive: client.user.isActive,
          createdAt: client.user.createdAt,
          updatedAt: client.updatedAt,
          cases: client.cases.map((caseItem) => ({
            id: caseItem.id,
            number: caseItem.number,
            title: caseItem.title,
            description: caseItem.description,
            type: caseItem.type,
            status: caseItem.status,
            value: caseItem.value,
            startDate: caseItem.startDate,
            endDate: caseItem.endDate,
            createdAt: caseItem.createdAt,
            lawyer: caseItem.lawyer,
            assistant: caseItem.assistant,
            counts: caseItem._count,
          })),
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível buscar o cliente",
        });
      }
    }
  );

  // POST /api/clients - Criar novo cliente
  fastify.post(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const data = createClientSchema.parse(request.body);

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          return reply.status(400).send({
            error: "Email já cadastrado",
            message: "Este email já está sendo usado por outro usuário",
          });
        }

        // Verificar CPF/CNPJ únicos se fornecidos
        if (data.cpf) {
          const existingCpf = await prisma.clientProfile.findUnique({
            where: { cpf: data.cpf },
          });
          if (existingCpf) {
            return reply.status(400).send({
              error: "CPF já cadastrado",
              message: "Este CPF já está sendo usado por outro cliente",
            });
          }
        }

        if (data.cnpj) {
          const existingCnpj = await prisma.clientProfile.findUnique({
            where: { cnpj: data.cnpj },
          });
          if (existingCnpj) {
            return reply.status(400).send({
              error: "CNPJ já cadastrado",
              message: "Este CNPJ já está sendo usado por outro cliente",
            });
          }
        }

        // Criar usuário e perfil em transação
        const result = await prisma.$transaction(async (tx) => {
          // Criar usuário
          const user = await tx.user.create({
            data: {
              name: data.name,
              email: data.email,
              role: "CLIENT",
            },
          });

          // Criar perfil do cliente
          const clientProfile = await tx.clientProfile.create({
            data: {
              userId: user.id,
              type: data.type,
              cpf: data.cpf,
              rg: data.rg,
              cnpj: data.cnpj,
              birthDate: data.birthDate ? new Date(data.birthDate) : null,
              phone: data.phone,
              address: data.address,
              city: data.city,
              state: data.state,
              zipCode: data.zipCode,
              company: data.company,
              position: data.position,
              salary: data.salary,
              workStart: data.workStart ? new Date(data.workStart) : null,
              workEnd: data.workEnd ? new Date(data.workEnd) : null,
            },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Cliente criado",
              description: `Cliente ${user.name} foi criado no sistema`,
              userId: request.user.id,
              metadata: {
                clientId: clientProfile.id,
                clientName: user.name,
              },
            },
          });

          return { user, clientProfile };
        });

        return reply.status(201).send({
          message: "Cliente criado com sucesso",
          client: {
            id: result.clientProfile.id,
            userId: result.user.id,
            name: result.user.name,
            email: result.user.email,
            type: result.clientProfile.type,
            createdAt: result.user.createdAt,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível criar o cliente",
        });
      }
    }
  );

  // PUT /api/clients/:id - Atualizar cliente
  fastify.put(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateClientSchema.parse(request.body);

        // Verificar se cliente existe
        const existingClient = await prisma.clientProfile.findUnique({
          where: { id },
          include: { user: true },
        });

        if (!existingClient) {
          return reply.status(404).send({
            error: "Cliente não encontrado",
            message: "O cliente solicitado não existe",
          });
        }

        // Verificar email único (se está sendo alterado)
        if (data.email && data.email !== existingClient.user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
          });
          if (existingUser) {
            return reply.status(400).send({
              error: "Email já cadastrado",
              message: "Este email já está sendo usado por outro usuário",
            });
          }
        }

        // Verificar CPF único (se está sendo alterado)
        if (data.cpf && data.cpf !== existingClient.cpf) {
          const existingCpf = await prisma.clientProfile.findUnique({
            where: { cpf: data.cpf },
          });
          if (existingCpf) {
            return reply.status(400).send({
              error: "CPF já cadastrado",
              message: "Este CPF já está sendo usado por outro cliente",
            });
          }
        }

        // Verificar CNPJ único (se está sendo alterado)
        if (data.cnpj && data.cnpj !== existingClient.cnpj) {
          const existingCnpj = await prisma.clientProfile.findUnique({
            where: { cnpj: data.cnpj },
          });
          if (existingCnpj) {
            return reply.status(400).send({
              error: "CNPJ já cadastrado",
              message: "Este CNPJ já está sendo usado por outro cliente",
            });
          }
        }

        // Atualizar usuário e perfil em transação
        const result = await prisma.$transaction(async (tx) => {
          // Atualizar dados do usuário se necessário
          const userUpdateData: any = {};
          if (data.name) userUpdateData.name = data.name;
          if (data.email) userUpdateData.email = data.email;

          let user = existingClient.user;
          if (Object.keys(userUpdateData).length > 0) {
            user = await tx.user.update({
              where: { id: existingClient.userId },
              data: userUpdateData,
            });
          }

          // Atualizar perfil do cliente
          const profileUpdateData: any = {};
          if (data.type !== undefined) profileUpdateData.type = data.type;
          if (data.cpf !== undefined) profileUpdateData.cpf = data.cpf;
          if (data.rg !== undefined) profileUpdateData.rg = data.rg;
          if (data.cnpj !== undefined) profileUpdateData.cnpj = data.cnpj;
          if (data.birthDate !== undefined)
            profileUpdateData.birthDate = data.birthDate
              ? new Date(data.birthDate)
              : null;
          if (data.phone !== undefined) profileUpdateData.phone = data.phone;
          if (data.address !== undefined)
            profileUpdateData.address = data.address;
          if (data.city !== undefined) profileUpdateData.city = data.city;
          if (data.state !== undefined) profileUpdateData.state = data.state;
          if (data.zipCode !== undefined)
            profileUpdateData.zipCode = data.zipCode;
          if (data.company !== undefined)
            profileUpdateData.company = data.company;
          if (data.position !== undefined)
            profileUpdateData.position = data.position;
          if (data.salary !== undefined) profileUpdateData.salary = data.salary;
          if (data.workStart !== undefined)
            profileUpdateData.workStart = data.workStart
              ? new Date(data.workStart)
              : null;
          if (data.workEnd !== undefined)
            profileUpdateData.workEnd = data.workEnd
              ? new Date(data.workEnd)
              : null;

          let clientProfile = existingClient;
          if (Object.keys(profileUpdateData).length > 0) {
            clientProfile = await tx.clientProfile.update({
              where: { id },
              data: profileUpdateData,
            });
          }

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Cliente atualizado",
              description: `Cliente ${user.name} foi atualizado`,
              userId: request.user.id,
              metadata: {
                clientId: id,
                clientName: user.name,
                updatedFields: Object.keys({
                  ...userUpdateData,
                  ...profileUpdateData,
                }),
              },
            },
          });

          return { user, clientProfile };
        });

        return {
          message: "Cliente atualizado com sucesso",
          client: {
            id: result.clientProfile.id,
            userId: result.user.id,
            name: result.user.name,
            email: result.user.email,
            type: result.clientProfile.type,
            updatedAt: result.clientProfile.updatedAt,
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível atualizar o cliente",
        });
      }
    }
  );

  // DELETE /api/clients/:id - Desativar cliente (soft delete)
  fastify.delete(
    "/:id",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Verificar se cliente existe
        const existingClient = await prisma.clientProfile.findUnique({
          where: { id },
          include: {
            user: true,
            cases: {
              where: { status: { in: ["DRAFT", "ACTIVE"] } },
            },
          },
        });

        if (!existingClient) {
          return reply.status(404).send({
            error: "Cliente não encontrado",
            message: "O cliente solicitado não existe",
          });
        }

        // Verificar se cliente tem casos ativos
        if (existingClient.cases.length > 0) {
          return reply.status(400).send({
            error: "Cliente possui casos ativos",
            message:
              "Não é possível desativar um cliente que possui casos em andamento",
          });
        }

        // Desativar usuário (soft delete)
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: existingClient.userId },
            data: { isActive: false },
          });

          // Registrar atividade
          await tx.activity.create({
            data: {
              type: "OTHER",
              title: "Cliente desativado",
              description: `Cliente ${existingClient.user.name} foi desativado`,
              userId: request.user.id,
              metadata: {
                clientId: id,
                clientName: existingClient.user.name,
              },
            },
          });
        });

        return {
          message: "Cliente desativado com sucesso",
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          message: "Não foi possível desativar o cliente",
        });
      }
    }
  );

  // GET /api/clients/:id/history - Histórico de alterações do cliente
  fastify.get(
    "/:id/history",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { page = 1, limit = 20 } = request.query as any;

        const skip = (page - 1) * limit;

        // Buscar atividades relacionadas ao cliente
        const activities = await prisma.activity.findMany({
          where: {
            OR: [
              { metadata: { path: ["clientId"], equals: id } },
              { case: { clientId: id } },
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            case: {
              select: {
                id: true,
                title: true,
                number: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        });

        const total = await prisma.activity.count({
          where: {
            OR: [
              { metadata: { path: ["clientId"], equals: id } },
              { case: { clientId: id } },
            ],
          },
        });

        return {
          activities,
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
          message: "Não foi possível buscar o histórico do cliente",
        });
      }
    }
  );
}
