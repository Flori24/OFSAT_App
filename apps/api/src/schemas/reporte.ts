/**
 * Validation schemas for reporting endpoints
 */

import { z } from 'zod';

// Technician report filters schema
export const TecnicoReportFiltersSchema = z.object({
  desde: z.string().optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Formato de fecha inválido para "desde"'
    }),
  hasta: z.string().optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Formato de fecha inválido para "hasta"'
    }),
  estado: z.enum(['PENDIENTE', 'EN_CURSO', 'FINALIZADA', 'CANCELADA']).optional()
}).refine((data) => {
  if (data.desde && data.hasta) {
    const desde = new Date(data.desde);
    const hasta = new Date(data.hasta);
    return desde <= hasta;
  }
  return true;
}, {
  message: 'La fecha "desde" debe ser anterior a la fecha "hasta"',
  path: ['hasta']
});

// Ticket number parameter schema
export const TicketNumberParamSchema = z.object({
  numero: z.string()
    .min(1, 'El número de ticket es requerido')
    .regex(/^T\d{6}-\d{4}$/, 'Formato de ticket inválido. Debe ser T202XXX-XXXX')
});

// Date range validation helper
export const validateDateRange = (desde?: string, hasta?: string) => {
  if (!desde && !hasta) return true;
  
  if (desde && hasta) {
    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);
    const diffDays = (fechaHasta.getTime() - fechaDesde.getTime()) / (1000 * 60 * 60 * 24);
    
    // Limit to 1 year for performance
    if (diffDays > 365) {
      throw new Error('El rango de fechas no puede ser mayor a 1 año');
    }
    
    return fechaDesde <= fechaHasta;
  }
  
  return true;
};

// Export types
export type TecnicoReportFiltersInput = z.infer<typeof TecnicoReportFiltersSchema>;
export type TicketNumberParamInput = z.infer<typeof TicketNumberParamSchema>;