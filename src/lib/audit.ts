import { prisma } from '@/lib/prisma';

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Log audit errors but don't fail the main operation
    console.error('Failed to create audit log:', error);
  }
}

// Helper functions for common audit actions
export const auditActions = {
  // Invoice actions
  invoiceApproved: (userId: string, invoiceId: string, details?: Record<string, unknown>) =>
    createAuditLog({
      userId,
      action: 'invoice_approved',
      entityType: 'invoice',
      entityId: invoiceId,
      details,
    }),

  invoiceRejected: (userId: string, invoiceId: string, details?: Record<string, unknown>) =>
    createAuditLog({
      userId,
      action: 'invoice_rejected',
      entityType: 'invoice',
      entityId: invoiceId,
      details,
    }),

  invoiceCommented: (userId: string, invoiceId: string, comment: string) =>
    createAuditLog({
      userId,
      action: 'invoice_commented',
      entityType: 'invoice',
      entityId: invoiceId,
      details: { comment },
    }),

  // Email actions
  emailSent: (userId: string, invoiceId: string, recipient: string, templateId?: string, ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      action: 'email_sent',
      entityType: 'invoice',
      entityId: invoiceId,
      details: { recipient, templateId },
      ipAddress,
      userAgent,
    }),

  // Upload actions
  uploadCreated: (userId: string, uploadId: string, filename: string, invoiceCount: number) =>
    createAuditLog({
      userId,
      action: 'upload_created',
      entityType: 'upload',
      entityId: uploadId,
      details: { filename, invoiceCount },
    }),

  // Bulk actions
  bulkApproved: (userId: string, uploadId: string, invoiceIds: string[], ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      action: 'bulk_approved',
      entityType: 'upload',
      entityId: uploadId,
      details: { invoiceIds, count: invoiceIds.length },
      ipAddress,
      userAgent,
    }),

  bulkRejected: (userId: string, uploadId: string, invoiceIds: string[], ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      action: 'bulk_rejected',
      entityType: 'upload',
      entityId: uploadId,
      details: { invoiceIds, count: invoiceIds.length },
      ipAddress,
      userAgent,
    }),
};