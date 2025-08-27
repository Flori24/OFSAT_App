import { z } from 'zod';
import { TipoTicket, EstadoTicket, OrigenTicket, UrgenciaTicket } from '@prisma/client';

export const ticketCreateSchema = z.object({
  usuarioCreacion: z.string().min(1, 'Usuario creación es requerido'),
  tipoTicket: z.nativeEnum(TipoTicket),
  categoria: z.string().optional(),
  subCategoria: z.string().optional(),
  subCategoria2: z.string().optional(),
  codigoCliente: z.string().min(1, 'Código de cliente es requerido'),
  razonSocial: z.string().min(1, 'Razón social es requerida'),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  contratoId: z.string().optional(),
  numeroSerie: z.string().optional(),
  estadoTicket: z.nativeEnum(EstadoTicket).default(EstadoTicket.ABIERTO),
  origen: z.nativeEnum(OrigenTicket),
  urgencia: z.nativeEnum(UrgenciaTicket).default(UrgenciaTicket.NORMAL),
  detalle: z.string().optional(),
  fechaUltimaActualizacion: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  fechaCierre: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  technicianId: z.string().optional(),
}).transform((data) => ({
  ...data,
  email: data.email === '' ? undefined : data.email,
}));

export const ticketUpdateSchema = z.object({
  usuarioCreacion: z.string().min(1).optional(),
  tipoTicket: z.nativeEnum(TipoTicket).optional(),
  categoria: z.string().optional(),
  subCategoria: z.string().optional(),
  subCategoria2: z.string().optional(),
  codigoCliente: z.string().min(1).optional(),
  razonSocial: z.string().min(1).optional(),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  contratoId: z.string().optional(),
  numeroSerie: z.string().optional(),
  estadoTicket: z.nativeEnum(EstadoTicket).optional(),
  origen: z.nativeEnum(OrigenTicket).optional(),
  urgencia: z.nativeEnum(UrgenciaTicket).optional(),
  detalle: z.string().optional(),
  fechaUltimaActualizacion: z.string().datetime().optional().transform((val) => val ? new Date(val) : new Date()),
  fechaCierre: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  technicianId: z.string().optional(),
}).transform((data) => ({
  ...data,
  email: data.email === '' ? undefined : data.email,
  fechaUltimaActualizacion: new Date(),
}));

export const ticketQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  pageSize: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 100) : 20),
  codigoCliente: z.string().optional(),
  technicianId: z.string().optional(),
  estadoTicket: z.nativeEnum(EstadoTicket).optional(),
  urgencia: z.nativeEnum(UrgenciaTicket).optional(),
  fechaDesde: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  fechaHasta: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  q: z.string().optional(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
export type TicketQueryParams = z.infer<typeof ticketQuerySchema>;