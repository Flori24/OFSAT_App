import { z } from 'zod';

// Enums para validación
export const TipoAccionSchema = z.enum([
  'Diagnostico', 'Reparacion', 'Sustitucion', 
  'Configuracion', 'Llamada', 'Revision'
]);

export const EstadoTareaSchema = z.enum([
  'Pendiente', 'EnCurso', 'Finalizada', 'Cancelada'
]);

export const ResultadoTareaSchema = z.enum([
  'Resuelto', 'NoResuelto', 'PendientePiezas', 'Escalado'
]);

export const UbicacionTareaSchema = z.enum([
  'Remota', 'Cliente', 'Taller'
]);

// Schema base para intervención
const BaseIntervencionSchema = z.object({
  fechaHoraProgramada: z.string().datetime().optional().nullable(),
  fechaHoraInicio: z.string().datetime().optional().nullable(),
  fechaHoraFin: z.string().datetime().optional().nullable(),
  tecnicoAsignadoId: z.string().min(1),
  tipoAccion: TipoAccionSchema,
  descripcion: z.string().optional(),
  estadoTarea: EstadoTareaSchema,
  costeEstimado: z.number().positive().optional().nullable(),
  resultado: ResultadoTareaSchema.optional().nullable(),
  firmaClienteUrl: z.string().url().optional().nullable(),
  ubicacion: UbicacionTareaSchema.optional().nullable()
});

// Función de validación común
const validateIntervencionData = (data: any) => {
  const errors: string[] = [];
  
  // Si fechaHoraFin existe, debe existir fechaHoraInicio
  if (data.fechaHoraFin && !data.fechaHoraInicio) {
    errors.push("fechaHoraFin requiere fechaHoraInicio");
  }
  
  // fechaHoraFin debe ser >= fechaHoraInicio
  if (data.fechaHoraFin && data.fechaHoraInicio) {
    const inicio = new Date(data.fechaHoraInicio);
    const fin = new Date(data.fechaHoraFin);
    if (fin < inicio) {
      errors.push("fechaHoraFin debe ser mayor o igual a fechaHoraInicio");
    }
  }
  
  // Si estado es "Finalizada", exigir fechaHoraInicio y fechaHoraFin
  if (data.estadoTarea === 'Finalizada') {
    if (!data.fechaHoraInicio || !data.fechaHoraFin) {
      errors.push("Estado Finalizada requiere fechaHoraInicio y fechaHoraFin");
    }
  }
  
  return errors.length === 0 ? true : errors.join(", ");
};

// Schema para crear intervención
export const CreateIntervencionSchema = BaseIntervencionSchema.refine(
  (data) => validateIntervencionData(data) === true,
  (data) => ({
    message: validateIntervencionData(data) as string,
    path: ['validation']
  })
);

// Schema para actualizar intervención
export const UpdateIntervencionSchema = BaseIntervencionSchema.partial().refine(
  (data) => validateIntervencionData(data) === true,
  (data) => ({
    message: validateIntervencionData(data) as string,
    path: ['validation']
  })
);

// Schema para materiales
export const CreateMaterialSchema = z.object({
  codigoArticulo: z.string().min(1),
  unidadesUtilizadas: z.number().positive(),
  precio: z.number().positive(),
  descuento: z.number().min(0).max(100).default(0)
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();

export const CreateMaterialesSchema = z.array(CreateMaterialSchema);

// Schema para filtros
export const IntervencionFiltersSchema = z.object({
  estadoTarea: EstadoTareaSchema.optional(),
  tecnicoAsignadoId: z.string().optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

// Tipos derivados
export type CreateIntervencionDto = z.infer<typeof CreateIntervencionSchema>;
export type UpdateIntervencionDto = z.infer<typeof UpdateIntervencionSchema>;
export type CreateMaterialDto = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialDto = z.infer<typeof UpdateMaterialSchema>;
export type IntervencionFilters = z.infer<typeof IntervencionFiltersSchema>;

// Interfaces para respuestas
export interface IntervencionResponse {
  id: string;
  numeroTicket: string;
  fechaHoraProgramada: string | null;
  fechaHoraInicio: string | null;
  fechaHoraFin: string | null;
  tecnicoAsignadoId: string;
  tipoAccion: string;
  descripcion: string | null;
  estadoTarea: string;
  duracionMinutos: number | null;
  costeEstimado: number | null;
  resultado: string | null;
  firmaClienteUrl: string | null;
  ubicacion: string | null;
  adjuntosJson: any;
  materiales: MaterialResponse[];
  tecnico: {
    id: string;
    displayName: string;
  };
  totales: {
    importeTotal: number;
    cantidadMateriales: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MaterialResponse {
  id: string;
  codigoArticulo: string;
  unidadesUtilizadas: number;
  precio: number;
  descuento: number;
  importeTotal: number;
  createdAt: string;
  updatedAt: string;
}