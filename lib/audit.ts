import prisma from "./db";
import { AuditAction } from "@prisma/client";

interface AuditLogParams {
  userId?: string;
  userName?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        entityName: params.entityName,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Erro ao criar log de auditoria:", error);
  }
}

export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    CREATE: "Criou",
    UPDATE: "Atualizou",
    DELETE: "Excluiu",
    SIGN: "Assinou",
    REFUSE: "Recusou",
    SEND: "Enviou",
    CANCEL: "Cancelou",
    LOGIN: "Login",
    LOGOUT: "Logout",
  };
  return labels[action] || action;
}

export function getEntityLabel(entity: string): string {
  const labels: Record<string, string> = {
    document: "Documento",
    signer: "Assinante",
    template: "Template",
    folder: "Pasta",
    prefecture: "Prefeitura",
    company: "Empresa",
    bid: "Edital",
    user: "Usuário",
    session: "Sessão",
  };
  return labels[entity] || entity;
}
