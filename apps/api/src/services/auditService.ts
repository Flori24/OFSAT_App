import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'INTERVENCION' | 'INTERVENCION_MATERIAL';
  entityId: string;
  before?: any;
  after?: any;
  timestamp: Date;
  metadata?: any;
}

export class AuditService {
  
  // Log audit entry
  async logAction(entry: Omit<AuditLogEntry, 'timestamp'>) {
    try {
      // In a real application, you might want to store this in a separate audit table
      // For now, we'll log to console and potentially store in a JSON field
      
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date()
      };

      console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));

      // You could also store this in a database table like:
      // await prisma.auditLog.create({ data: auditEntry });
      
      return auditEntry;
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  }

  // Log intervention creation
  async logIntervencionCreate(userId: string, intervencion: any) {
    return this.logAction({
      userId,
      action: 'CREATE',
      entity: 'INTERVENCION',
      entityId: intervencion.id,
      after: this.sanitizeForAudit(intervencion)
    });
  }

  // Log intervention update
  async logIntervencionUpdate(userId: string, intervencionId: string, before: any, after: any) {
    return this.logAction({
      userId,
      action: 'UPDATE',
      entity: 'INTERVENCION',
      entityId: intervencionId,
      before: this.sanitizeForAudit(before),
      after: this.sanitizeForAudit(after)
    });
  }

  // Log intervention deletion
  async logIntervencionDelete(userId: string, intervencion: any) {
    return this.logAction({
      userId,
      action: 'DELETE',
      entity: 'INTERVENCION',
      entityId: intervencion.id,
      before: this.sanitizeForAudit(intervencion)
    });
  }

  // Log material operations
  async logMaterialCreate(userId: string, intervencionId: string, material: any) {
    return this.logAction({
      userId,
      action: 'CREATE',
      entity: 'INTERVENCION_MATERIAL',
      entityId: material.id,
      after: this.sanitizeForAudit(material),
      metadata: { intervencionId }
    });
  }

  async logMaterialUpdate(userId: string, intervencionId: string, materialId: string, before: any, after: any) {
    return this.logAction({
      userId,
      action: 'UPDATE',
      entity: 'INTERVENCION_MATERIAL',
      entityId: materialId,
      before: this.sanitizeForAudit(before),
      after: this.sanitizeForAudit(after),
      metadata: { intervencionId }
    });
  }

  async logMaterialDelete(userId: string, intervencionId: string, material: any) {
    return this.logAction({
      userId,
      action: 'DELETE',
      entity: 'INTERVENCION_MATERIAL',
      entityId: material.id,
      before: this.sanitizeForAudit(material),
      metadata: { intervencionId }
    });
  }

  // Remove sensitive data from audit logs
  private sanitizeForAudit(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    
    // Remove sensitive fields
    delete sanitized.passwordHash;
    delete sanitized.firmaClienteUrl; // Keep URL out of logs for security
    
    // Convert dates to ISO strings for consistent logging
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] instanceof Date) {
        sanitized[key] = sanitized[key].toISOString();
      }
    });

    return sanitized;
  }

  // Get audit history for an entity
  async getAuditHistory(entity: 'INTERVENCION' | 'INTERVENCION_MATERIAL', entityId: string) {
    // In a real implementation, you would query the audit table
    // For now, return a placeholder
    return {
      entity,
      entityId,
      history: [
        // This would be actual audit entries from the database
      ]
    };
  }
}

export const auditService = new AuditService();