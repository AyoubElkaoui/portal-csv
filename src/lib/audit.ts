import { prisma } from '@/lib/prisma';

export interface AuditLogData {
  userId?: string;
  uploadId?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        uploadId: data.uploadId,
        action: data.action,
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
  // Upload actions
  uploadCreated: (userId: string, uploadId: string, filename: string, ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      uploadId,
      action: 'upload_created',
      details: { filename },
      ipAddress,
      userAgent,
    }),

  uploadReviewed: (userId: string, uploadId: string, comments?: string, ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      uploadId,
      action: 'upload_reviewed',
      details: { comments },
      ipAddress,
      userAgent,
    }),

  uploadDownloaded: (userId: string, uploadId: string, ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      uploadId,
      action: 'upload_downloaded',
      ipAddress,
      userAgent,
    }),

  uploadDeleted: (userId: string, uploadId: string, filename: string, ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      uploadId,
      action: 'upload_deleted',
      details: { filename },
      ipAddress,
      userAgent,
    }),

  // Email actions
  emailSent: (userId: string, uploadId: string, recipient: string, ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      uploadId,
      action: 'email_sent',
      details: { recipient },
      ipAddress,
      userAgent,
    }),
};