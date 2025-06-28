import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export async function profileRoutes(fastify: FastifyInstance) {
  // Middleware para autenticação
  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Obter dados do perfil
  fastify.get("/profile", async (request, reply) => {
    try {
      const userId = (request.user as any).id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          bio: true,
          role: true,
          avatar: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      return reply.send(user);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      return reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  // Atualizar dados do perfil
  fastify.put("/profile", async (request, reply) => {
    try {
      const userId = (request.user as any).id;
      const { name, phone, address, bio } = request.body as {
        name: string;
        phone?: string;
        address?: string;
        bio?: string;
      };

      // Validações básicas
      if (!name || name.trim().length < 2) {
        return reply
          .status(400)
          .send({ error: "Nome deve ter pelo menos 2 caracteres" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name.trim(),
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          bio: bio?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          bio: true,
          role: true,
          avatar: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      return reply.send(updatedUser);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  // Alterar senha
  fastify.post("/profile/change-password", async (request, reply) => {
    try {
      const userId = (request.user as any).id;
      const { currentPassword, newPassword } = request.body as {
        currentPassword: string;
        newPassword: string;
      };

      // Validações
      if (!currentPassword || !newPassword) {
        return reply
          .status(400)
          .send({ error: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 8) {
        return reply
          .status(400)
          .send({ error: "Nova senha deve ter pelo menos 8 caracteres" });
      }

      // Verificar se a senha atual está correta
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user || !user.password) {
        return reply
          .status(404)
          .send({ error: "Usuário não encontrado ou senha não definida" });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return reply.status(400).send({ error: "Senha atual incorreta" });
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha no banco
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      return reply.send({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      return reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  // Upload de avatar (placeholder - implementação futura)
  fastify.post("/profile/avatar", async (request, reply) => {
    try {
      // TODO: Implementar upload de arquivo para avatar
      // Por enquanto, retorna sucesso mockado
      return reply.send({
        message: "Upload de avatar será implementado em versão futura",
        avatar: "/default-avatar.png",
      });
    } catch (error) {
      console.error("Erro ao fazer upload de avatar:", error);
      return reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  // Obter atividades recentes do usuário
  fastify.get("/profile/activities", async (request, reply) => {
    try {
      const userId = (request.user as any).id;
      const query = request.query as { limit?: string };
      const limit = parseInt(query.limit || "10");

      // TODO: Implementar sistema de auditoria/logs
      // Por enquanto, retorna dados mockados
      const activities = [
        {
          id: "1",
          type: "login",
          description: "Login realizado",
          timestamp: new Date(),
          metadata: { ip: request.ip },
        },
        {
          id: "2",
          type: "case_updated",
          description: "Caso atualizado",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // ontem
          metadata: { caseId: "case-123" },
        },
        {
          id: "3",
          type: "document_uploaded",
          description: "Documento enviado",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
          metadata: { documentName: "contrato.pdf" },
        },
      ].slice(0, limit);

      return reply.send(activities);
    } catch (error) {
      console.error("Erro ao buscar atividades:", error);
      return reply.status(500).send({ error: "Erro interno do servidor" });
    }
  });
}
