import type { AdminUser } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'purge'
  | 'publish'
  | 'unpublish'
  | 'security';

/** Records who changed what in the panel's change log. */
export function logAudit(
  user: Pick<AdminUser, 'id' | 'login'>,
  action: AuditAction,
  entity: string,
  summary: string,
  entityId?: string
) {
  return prisma.auditLog.create({
    data: {
      userId: user.id,
      userLogin: user.login,
      action,
      entity,
      entityId,
      summary: summary.slice(0, 500),
    },
  });
}

export const LOG_RETENTION_DAYS = 90;

/** Drops sign-in and security records older than LOG_RETENTION_DAYS. */
export function purgeOldLogs() {
  const cutoff = new Date(
    Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  return Promise.all([
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.securityEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);
}
