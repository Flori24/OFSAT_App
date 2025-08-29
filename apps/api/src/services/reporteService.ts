/**
 * Service for generating reports and analytics
 * Handles complex queries with performance optimizations
 */

import { prisma } from '../lib/prisma';
import { auditService, AuditContext } from './auditService';

export interface TecnicoReportFilters {
  desde?: string;
  hasta?: string;
  estado?: 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA';
}

export interface TecnicoReportResult {
  tecnicoId: string;
  tecnico: {
    displayName: string;
    email?: string;
  };
  total: number;
  totMinutos: number;
  totImporteMateriales: number;
  avgDuracion: number;
  estadisticas: {
    pendientes: number;
    enCurso: number;
    finalizadas: number;
    canceladas: number;
  };
}

export interface TicketReportResult {
  numeroTicket: string;
  ticket: {
    razonSocial: string;
    tipoTicket: string;
    estadoTicket: string;
    fechaCreacion: string;
    fechaCierre?: string;
  };
  nIntervenciones: number;
  tiempoTotal: number; // en minutos
  materialesTotal: {
    cantidad: number;
    importeTotal: number;
  };
  costes: {
    estimado: number;
    real: number; // suma de materiales + tiempo estimado
    diferencia: number;
  };
  intervenciones: {
    id: string;
    tipoAccion: string;
    estadoTarea: string;
    duracionMinutos: number | null;
    costeEstimado: number | null;
    importeMateriales: number;
    tecnico: string;
    fechas: {
      programada?: string;
      inicio?: string;
      fin?: string;
    };
  }[];
}

export class ReporteService {
  /**
   * Generate technician performance report with aggregated statistics
   */
  async getReportePorTecnico(
    filters: TecnicoReportFilters,
    userId: string,
    userRoles: string[],
    auditContext: AuditContext
  ): Promise<TecnicoReportResult[]> {
    // Log report access for audit
    await auditService.logSecurityEvent('REPORT_ACCESS', {
      reportType: 'TECNICO_PERFORMANCE',
      filters,
      requestedBy: userId,
    }, auditContext);

    // Build date filters
    const whereConditions: any = {};
    if (filters.desde) {
      whereConditions.fechaHoraInicio = { 
        gte: new Date(filters.desde) 
      };
    }
    if (filters.hasta) {
      whereConditions.fechaHoraInicio = {
        ...whereConditions.fechaHoraInicio,
        lte: new Date(filters.hasta)
      };
    }
    if (filters.estado) {
      whereConditions.estadoTarea = filters.estado;
    }

    // Permission check - technicians can only see their own data
    if (userRoles.includes('TECNICO') && !userRoles.includes('ADMIN')) {
      whereConditions.tecnicoAsignadoId = userId;
    }

    try {
      // Execute optimized aggregation query
      const result = await prisma.intervencion.groupBy({
        by: ['tecnicoAsignadoId'],
        where: whereConditions,
        _count: {
          id: true,
        },
        _sum: {
          duracionMinutos: true,
          costeEstimado: true,
        },
        _avg: {
          duracionMinutos: true,
        },
      });

      // Get detailed statistics for each technician
      const reportData = await Promise.all(
        result.map(async (group) => {
          const tecnicoId = group.tecnicoAsignadoId;
          
          // Get technician details
          const tecnico = await prisma.user.findUnique({
            where: { id: tecnicoId },
            select: {
              displayName: true,
              email: true,
            },
          });

          // Get material totals for this technician
          const materialStats = await prisma.intervencionMaterial.aggregate({
            where: {
              intervencion: {
                tecnicoAsignadoId: tecnicoId,
                ...whereConditions,
              },
            },
            _sum: {
              importeTotal: true,
            },
          });

          // Get status breakdown
          const statusStats = await prisma.intervencion.groupBy({
            by: ['estadoTarea'],
            where: {
              tecnicoAsignadoId: tecnicoId,
              ...whereConditions,
            },
            _count: {
              id: true,
            },
          });

          const estadisticas = {
            pendientes: 0,
            enCurso: 0,
            finalizadas: 0,
            canceladas: 0,
          };

          statusStats.forEach(stat => {
            switch (stat.estadoTarea) {
              case 'PENDIENTE':
                estadisticas.pendientes = stat._count.id;
                break;
              case 'EN_CURSO':
                estadisticas.enCurso = stat._count.id;
                break;
              case 'FINALIZADA':
                estadisticas.finalizadas = stat._count.id;
                break;
              case 'CANCELADA':
                estadisticas.canceladas = stat._count.id;
                break;
            }
          });

          return {
            tecnicoId,
            tecnico: tecnico 
              ? { displayName: tecnico.displayName, email: tecnico.email || undefined }
              : { displayName: 'Usuario no encontrado', email: undefined },
            total: group._count.id,
            totMinutos: Number(group._sum.duracionMinutos) || 0,
            totImporteMateriales: Number(materialStats._sum.importeTotal) || 0,
            avgDuracion: Math.round(Number(group._avg.duracionMinutos) || 0),
            estadisticas,
          };
        })
      );

      // Sort by total interventions descending
      return reportData.sort((a, b) => b.total - a.total);
      
    } catch (error) {
      console.error('Error generating technician report:', error);
      throw new Error('Error al generar reporte de técnicos');
    }
  }

  /**
   * Generate comprehensive ticket report with intervention details
   */
  async getReportePorTicket(
    numeroTicket: string,
    userId: string,
    userRoles: string[],
    auditContext: AuditContext
  ): Promise<TicketReportResult> {
    // Log report access
    await auditService.logSecurityEvent('REPORT_ACCESS', {
      reportType: 'TICKET_SUMMARY',
      numeroTicket,
      requestedBy: userId,
    }, auditContext);

    try {
      // Get ticket details with interventions
      const ticket = await prisma.ticket.findUnique({
        where: { numeroTicket },
        include: {
          intervenciones: {
            include: {
              tecnico: {
                select: {
                  displayName: true,
                },
              },
              materiales: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      // Permission check for technicians
      if (userRoles.includes('TECNICO') && !userRoles.includes('ADMIN')) {
        const hasAccess = ticket.technicianId === userId || 
                         ticket.intervenciones.some(i => i.tecnicoAsignadoId === userId);
        
        if (!hasAccess) {
          throw new Error('Sin permisos para acceder a este ticket');
        }
      }

      // Calculate aggregated statistics
      let tiempoTotal = 0;
      let costeEstimadoTotal = 0;
      let importeMaterialesTotal = 0;
      let cantidadMaterialesTotal = 0;

      const intervencionesDetalle = ticket.intervenciones.map(intervencion => {
        const duracion = intervencion.duracionMinutos || 0;
        const costeEstimado = Number(intervencion.costeEstimado) || 0;
        const importeMateriales = intervencion.materiales.reduce(
          (sum, mat) => sum + Number(mat.importeTotal), 0
        );

        tiempoTotal += duracion;
        costeEstimadoTotal += costeEstimado;
        importeMaterialesTotal += importeMateriales;
        cantidadMaterialesTotal += intervencion.materiales.length;

        return {
          id: intervencion.id,
          tipoAccion: intervencion.tipoAccion,
          estadoTarea: intervencion.estadoTarea,
          duracionMinutos: intervencion.duracionMinutos,
          costeEstimado: costeEstimado,
          importeMateriales,
          tecnico: intervencion.tecnico.displayName,
          fechas: {
            programada: intervencion.fechaHoraProgramada?.toISOString(),
            inicio: intervencion.fechaHoraInicio?.toISOString(),
            fin: intervencion.fechaHoraFin?.toISOString(),
          },
        };
      });

      // Calculate real cost (materials + estimated labor)
      const costeReal = importeMaterialesTotal + costeEstimadoTotal;
      const diferenciaCosto = costeReal - costeEstimadoTotal;

      return {
        numeroTicket: ticket.numeroTicket,
        ticket: {
          razonSocial: ticket.razonSocial,
          tipoTicket: ticket.tipoTicket,
          estadoTicket: ticket.estadoTicket,
          fechaCreacion: ticket.fechaCreacion.toISOString(),
          fechaCierre: ticket.fechaCierre?.toISOString(),
        },
        nIntervenciones: ticket.intervenciones.length,
        tiempoTotal,
        materialesTotal: {
          cantidad: cantidadMaterialesTotal,
          importeTotal: importeMaterialesTotal,
        },
        costes: {
          estimado: costeEstimadoTotal,
          real: costeReal,
          diferencia: diferenciaCosto,
        },
        intervenciones: intervencionesDetalle,
      };

    } catch (error) {
      console.error('Error generating ticket report:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al generar reporte de ticket');
    }
  }

  /**
   * Get dashboard statistics (bonus feature)
   */
  async getDashboardStats(
    userId: string,
    userRoles: string[],
    auditContext: AuditContext
  ) {
    await auditService.logSecurityEvent('REPORT_ACCESS', {
      reportType: 'DASHBOARD_STATS',
      requestedBy: userId,
    }, auditContext);

    try {
      const whereCondition = userRoles.includes('ADMIN') ? {} : { 
        OR: [
          { tecnicoAsignadoId: userId },
          { ticket: { technicianId: userId } }
        ]
      };

      const [
        totalIntervenciones,
        pendientes,
        enCurso,
        finalizadas,
        tiempoTotal,
        costoTotal
      ] = await Promise.all([
        prisma.intervencion.count({ where: whereCondition }),
        prisma.intervencion.count({ 
          where: { ...whereCondition, estadoTarea: 'PENDIENTE' }
        }),
        prisma.intervencion.count({ 
          where: { ...whereCondition, estadoTarea: 'EN_CURSO' }
        }),
        prisma.intervencion.count({ 
          where: { ...whereCondition, estadoTarea: 'FINALIZADA' }
        }),
        prisma.intervencion.aggregate({
          where: whereCondition,
          _sum: { duracionMinutos: true }
        }),
        prisma.intervencionMaterial.aggregate({
          where: { intervencion: whereCondition },
          _sum: { importeTotal: true }
        })
      ]);

      return {
        intervenciones: {
          total: totalIntervenciones,
          pendientes,
          enCurso,
          finalizadas,
          porcentajeCompletado: totalIntervenciones > 0 
            ? Math.round((finalizadas / totalIntervenciones) * 100)
            : 0,
        },
        tiempo: {
          totalMinutos: Number(tiempoTotal._sum.duracionMinutos) || 0,
          totalHoras: Math.round((Number(tiempoTotal._sum.duracionMinutos) || 0) / 60 * 10) / 10,
        },
        costos: {
          totalMateriales: Number(costoTotal._sum.importeTotal) || 0,
        }
      };

    } catch (error) {
      console.error('Error generating dashboard stats:', error);
      throw new Error('Error al generar estadísticas del dashboard');
    }
  }
}

export const reporteService = new ReporteService();