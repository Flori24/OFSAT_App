/**
 * Routes for reporting and analytics endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { reporteService } from '../services/reporteService';
import { auditService } from '../services/auditService';
import { requireAuth } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiting';
import {
  TecnicoReportFiltersSchema,
  TicketNumberParamSchema,
  validateDateRange
} from '../schemas/reporte';
import { z } from 'zod';

const router = Router();

// Middleware for role-based access
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes para acceder a reportes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

// Async error handler
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /reportes/intervenciones/por-tecnico - Performance report by technician
router.get('/intervenciones/por-tecnico',
  generalRateLimit,
  requireAuth,
  requireRole(['ADMIN', 'GESTOR', 'TECNICO']),
  asyncHandler(async (req: Request, res: Response) => {
    const filters = TecnicoReportFiltersSchema.parse(req.query);
    const auditContext = auditService.getContextFromRequest(req);
    
    // Additional date range validation
    validateDateRange(filters.desde, filters.hasta);
    
    const report = await reporteService.getReportePorTecnico(
      filters,
      req.user!.id,
      req.user!.roles,
      auditContext
    );
    
    res.json({
      success: true,
      data: report,
      metadata: {
        filters,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user!.displayName,
        totalTechnicians: report.length,
        totalInterventions: report.reduce((sum, r) => sum + r.total, 0),
        totalMinutes: report.reduce((sum, r) => sum + r.totMinutos, 0),
        totalMaterialCost: report.reduce((sum, r) => sum + r.totImporteMateriales, 0)
      }
    });
  })
);

// GET /reportes/intervenciones/por-ticket/:numero - Ticket summary report
router.get('/intervenciones/por-ticket/:numero',
  generalRateLimit,
  requireAuth,
  requireRole(['ADMIN', 'GESTOR', 'TECNICO']),
  asyncHandler(async (req: Request, res: Response) => {
    const { numero } = TicketNumberParamSchema.parse(req.params);
    const auditContext = auditService.getContextFromRequest(req);
    
    const report = await reporteService.getReportePorTicket(
      numero,
      req.user!.id,
      req.user!.roles,
      auditContext
    );
    
    res.json({
      success: true,
      data: report,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: req.user!.displayName,
        ticketStatus: report.ticket.estadoTicket,
        efficiency: {
          avgMinutesPerIntervention: report.nIntervenciones > 0 
            ? Math.round(report.tiempoTotal / report.nIntervenciones) 
            : 0,
          costEfficiency: report.costes.estimado > 0 
            ? Math.round((report.costes.real / report.costes.estimado) * 100)
            : 0,
          completionRate: report.intervenciones.filter(i => i.estadoTarea === 'FINALIZADA').length / Math.max(report.nIntervenciones, 1) * 100
        }
      }
    });
  })
);

// GET /reportes/dashboard - Dashboard statistics (bonus feature)
router.get('/dashboard',
  generalRateLimit,
  requireAuth,
  requireRole(['ADMIN', 'GESTOR', 'TECNICO']),
  asyncHandler(async (req: Request, res: Response) => {
    const auditContext = auditService.getContextFromRequest(req);
    
    const stats = await reporteService.getDashboardStats(
      req.user!.id,
      req.user!.roles,
      auditContext
    );
    
    res.json({
      success: true,
      data: stats,
      metadata: {
        generatedAt: new Date().toISOString(),
        scope: req.user!.roles.includes('ADMIN') ? 'global' : 'personal'
      }
    });
  })
);

// Error handling middleware
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error in reports:', error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Parámetros de reporte inválidos',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }
  
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: 'REPORT_ERROR'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Error interno al generar reporte',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

export default router;