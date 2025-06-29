import { prisma } from "./prisma.js";

export interface AuditLogData {
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "VIEW"
    | "DOWNLOAD"
    | "EXPORT"
    | "UPLOAD"
    | "APPROVE"
    | "REJECT"
    | "ARCHIVE"
    | "RESTORE"
    | "SHARE"
    | "UNSHARE"
    | "DUPLICATE"
    | "GENERATE";
  entity:
    | "USER"
    | "CLIENT"
    | "CASE"
    | "DOCUMENT"
    | "APPOINTMENT"
    | "ACTIVITY"
    | "NOTIFICATION"
    | "REPORT"
    | "TEMPLATE"
    | "SYSTEM";
  entityId?: string;
  entityName?: string;
  userId: string;
  userEmail: string;
  userName: string;
  description?: string;
  oldData?: any;
  newData?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Registra um log de auditoria
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          entityName: data.entityName,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          description: data.description,
          oldData: data.oldData,
          newData: data.newData,
          metadata: data.metadata,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error("Erro ao registrar log de auditoria:", error);
      // Não falha a operação principal se o log falhar
    }
  }

  /**
   * Registra um log de criação
   */
  static async logCreate(
    entity: AuditLogData["entity"],
    entityId: string,
    entityName: string,
    user: { id: string; email: string; name: string },
    newData?: any,
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "CREATE",
      entity,
      entityId,
      entityName,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Criou ${entity.toLowerCase()}: ${entityName}`,
      newData,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de atualização
   */
  static async logUpdate(
    entity: AuditLogData["entity"],
    entityId: string,
    entityName: string,
    user: { id: string; email: string; name: string },
    oldData?: any,
    newData?: any,
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "UPDATE",
      entity,
      entityId,
      entityName,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Atualizou ${entity.toLowerCase()}: ${entityName}`,
      oldData,
      newData,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de exclusão
   */
  static async logDelete(
    entity: AuditLogData["entity"],
    entityId: string,
    entityName: string,
    user: { id: string; email: string; name: string },
    oldData?: any,
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "DELETE",
      entity,
      entityId,
      entityName,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Excluiu ${entity.toLowerCase()}: ${entityName}`,
      oldData,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de login
   */
  static async logLogin(
    user: { id: string; email: string; name: string },
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      entityName: user.name,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Usuário fez login`,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de logout
   */
  static async logLogout(
    user: { id: string; email: string; name: string },
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "LOGOUT",
      entity: "USER",
      entityId: user.id,
      entityName: user.name,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Usuário fez logout`,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de visualização
   */
  static async logView(
    entity: AuditLogData["entity"],
    entityId: string,
    entityName: string,
    user: { id: string; email: string; name: string },
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "VIEW",
      entity,
      entityId,
      entityName,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Visualizou ${entity.toLowerCase()}: ${entityName}`,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de download
   */
  static async logDownload(
    entity: AuditLogData["entity"],
    entityId: string,
    entityName: string,
    user: { id: string; email: string; name: string },
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "DOWNLOAD",
      entity,
      entityId,
      entityName,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Baixou ${entity.toLowerCase()}: ${entityName}`,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de export
   */
  static async logExport(
    entity: AuditLogData["entity"],
    user: { id: string; email: string; name: string },
    description: string,
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "EXPORT",
      entity,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de duplicação
   */
  static async logDuplicate(
    entity: AuditLogData["entity"],
    originalId: string,
    originalName: string,
    newId: string,
    newName: string,
    user: { id: string; email: string; name: string },
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "DUPLICATE",
      entity,
      entityId: newId,
      entityName: newName,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Duplicou ${entity.toLowerCase()}: ${originalName} → ${newName}`,
      metadata: {
        ...metadata,
        originalId,
        originalName,
      },
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }

  /**
   * Registra um log de geração
   */
  static async logGenerate(
    entity: AuditLogData["entity"],
    sourceId: string,
    sourceName: string,
    targetId: string,
    targetName: string,
    user: { id: string; email: string; name: string },
    metadata?: any,
    request?: { ip?: string; headers?: any }
  ): Promise<void> {
    await this.log({
      action: "GENERATE",
      entity,
      entityId: targetId,
      entityName: targetName,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      description: `Gerou ${entity.toLowerCase()}: ${targetName} a partir de ${sourceName}`,
      metadata: {
        ...metadata,
        sourceId,
        sourceName,
      },
      ipAddress: request?.ip,
      userAgent: request?.headers?.["user-agent"],
    });
  }
}

export default AuditService;
