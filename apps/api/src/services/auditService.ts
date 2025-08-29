/**
 * Enhanced audit service with comprehensive logging capabilities
 */

import { prisma } from '../lib/prisma';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export interface AuditContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Extract audit context from Express request
   */
  getContextFromRequest(req: Request): AuditContext {
    return {
      userId: req.user?.id,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };
  }

  /**
   * Log intervention changes
   */
  async logIntervencionChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    intervencionId: string,
    context: AuditContext,
    before?: any,
    after?: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          entity: 'Intervencion',
          entityId: intervencionId,
          action,
          before: before ? JSON.parse(JSON.stringify(this.sanitizeForAudit(before))) : null,
          after: after ? JSON.parse(JSON.stringify(this.sanitizeForAudit(after))) : null,
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log intervention audit:', error);
    }
  }

  /**
   * Log material changes
   */
  async logMaterialChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    materialId: string,
    intervencionId: string,
    context: AuditContext,
    before?: any,
    after?: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          entity: 'IntervencionMaterial',
          entityId: materialId,
          action,
          before: before ? JSON.parse(JSON.stringify(this.sanitizeForAudit(before))) : null,
          after: after ? JSON.parse(JSON.stringify(this.sanitizeForAudit(after))) : null,
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });

      // Also log the parent intervention was modified
      await this.logIntervencionChange(
        'UPDATE',
        intervencionId,
        context,
        null,
        { reason: `Material ${action.toLowerCase()}: ${materialId}` }
      );
    } catch (error) {
      console.error('Failed to log material audit:', error);
    }
  }

  /**
   * Log file upload events
   */
  async logFileUpload(
    entityType: 'Intervencion' | 'IntervencionMaterial',
    entityId: string,
    fileType: 'adjunto' | 'firma',
    fileName: string,
    fileSize: number,
    context: AuditContext
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          entity: `${entityType}File`,
          entityId,
          action: 'CREATE',
          before: Prisma.JsonNull,
          after: {
            fileType,
            fileName,
            fileSize,
            uploadedAt: new Date(),
          },
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log file upload audit:', error);
    }
  }

  /**
   * Log security events (rejected files, rate limiting, etc.)
   */
  async logSecurityEvent(
    eventType: 'FILE_REJECTED' | 'RATE_LIMITED' | 'VIRUS_DETECTED' | 'UNAUTHORIZED_ACCESS' | 'REPORT_ACCESS',
    details: any,
    context: AuditContext
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          entity: 'Security',
          entityId: `${eventType}-${Date.now()}`,
          action: eventType,
          before: Prisma.JsonNull,
          after: details,
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get comprehensive audit trail
   */
  async getAuditTrail(entity?: string, entityId?: string, limit: number = 100) {
    const where: any = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(fromDate?: Date, toDate?: Date) {
    const where: any = {};
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const stats = await prisma.auditLog.groupBy({
      by: ['entity', 'action'],
      where,
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      const key = `${stat.entity}.${stat.action}`;
      acc[key] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Remove sensitive data from audit logs
   */
  private sanitizeForAudit(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    
    // Remove sensitive fields
    delete sanitized.passwordHash;
    
    // Convert dates to ISO strings for consistent logging
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] instanceof Date) {
        sanitized[key] = sanitized[key].toISOString();
      }
      // Convert Prisma Decimal to number for JSON serialization
      if (sanitized[key] && typeof sanitized[key].toString === 'function' && 
          sanitized[key].constructor.name === 'Decimal') {
        sanitized[key] = parseFloat(sanitized[key].toString());
      }
    });

    return sanitized;
  }

  /**
   * Clean old audit logs (for GDPR compliance)
   */
  async cleanOldAuditLogs(olderThanDays: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned ${result.count} audit log entries older than ${olderThanDays} days`);
    return result.count;
  }
}

export const auditService = new AuditService();