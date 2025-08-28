import { PrismaClient, Prisma } from '@prisma/client';
import { 
  CreateIntervencionDto, 
  UpdateIntervencionDto, 
  CreateMaterialDto, 
  UpdateMaterialDto, 
  IntervencionFilters, 
  IntervencionResponse,
  MaterialResponse 
} from '../schemas/intervencion';
import { auditService } from './auditService';

const prisma = new PrismaClient();

export class IntervencionService {
  
  // Calcular duración en minutos
  private calculateDuration(inicio: Date | null, fin: Date | null): number | null {
    if (!inicio || !fin) return null;
    return Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60));
  }

  // Calcular importe total de material
  private calculateMaterialTotal(unidades: number, precio: number, descuento: number): number {
    return Number((unidades * precio * (1 - descuento / 100)).toFixed(2));
  }

  // Verificar si el ticket está cerrado
  private async verifyTicketNotClosed(numeroTicket: string): Promise<void> {
    const ticket = await prisma.ticket.findUnique({
      where: { numeroTicket },
      select: { fechaCierre: true }
    });

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (ticket.fechaCierre) {
      const error = new Error('No se pueden crear intervenciones en tickets cerrados');
      (error as any).statusCode = 409;
      throw error;
    }
  }

  // Verificar permisos del usuario
  private async verifyUserPermissions(
    userId: string, 
    userRoles: string[], 
    action: 'read' | 'write' | 'delete',
    intervencionId?: string,
    tecnicoAsignadoId?: string
  ): Promise<void> {
    // Admin puede hacer todo
    if (userRoles.includes('ADMIN')) return;

    // Para técnicos
    if (userRoles.includes('TECNICO')) {
      if (action === 'read') {
        // Pueden leer intervenciones asignadas a ellos o de tickets que les pertenecen
        return; // Se validará en la consulta
      }

      if (intervencionId) {
        const intervencion = await prisma.intervencion.findUnique({
          where: { id: intervencionId },
          select: { 
            tecnicoAsignadoId: true, 
            estadoTarea: true,
            ticket: {
              select: { technicianId: true }
            }
          }
        });

        if (!intervencion) {
          throw new Error('Intervención no encontrada');
        }

        const isAssignedTechnician = intervencion.tecnicoAsignadoId === userId;
        const isTicketTechnician = intervencion.ticket.technicianId === userId;

        if (!isAssignedTechnician && !isTicketTechnician) {
          const error = new Error('Sin permisos para acceder a esta intervención');
          (error as any).statusCode = 403;
          throw error;
        }

        // No pueden borrar si está finalizada
        if (action === 'delete' && intervencion.estadoTarea === 'FINALIZADA') {
          const error = new Error('No se puede borrar una intervención finalizada');
          (error as any).statusCode = 403;
          throw error;
        }
      } else if (tecnicoAsignadoId && tecnicoAsignadoId !== userId) {
        // Solo pueden crear intervenciones asignadas a ellos mismos
        const error = new Error('Solo puedes crear intervenciones asignadas a ti');
        (error as any).statusCode = 403;
        throw error;
      }

      return;
    }

    // Sin permisos
    const error = new Error('Sin permisos suficientes');
    (error as any).statusCode = 403;
    throw error;
  }

  // Formatear respuesta de intervención
  private formatIntervencionResponse(intervencion: any): IntervencionResponse {
    const importeTotal = intervencion.materiales?.reduce(
      (sum: number, mat: any) => sum + Number(mat.importeTotal), 0
    ) || 0;

    return {
      id: intervencion.id,
      numeroTicket: intervencion.numeroTicket,
      fechaHoraProgramada: intervencion.fechaHoraProgramada?.toISOString() || null,
      fechaHoraInicio: intervencion.fechaHoraInicio?.toISOString() || null,
      fechaHoraFin: intervencion.fechaHoraFin?.toISOString() || null,
      tecnicoAsignadoId: intervencion.tecnicoAsignadoId,
      tipoAccion: intervencion.tipoAccion,
      descripcion: intervencion.descripcion,
      estadoTarea: intervencion.estadoTarea,
      duracionMinutos: intervencion.duracionMinutos,
      costeEstimado: intervencion.costeEstimado ? Number(intervencion.costeEstimado) : null,
      resultado: intervencion.resultado,
      firmaClienteUrl: intervencion.firmaClienteUrl,
      ubicacion: intervencion.ubicacion,
      adjuntosJson: intervencion.adjuntosJson,
      materiales: intervencion.materiales?.map(this.formatMaterialResponse) || [],
      tecnico: {
        id: intervencion.tecnico.id,
        displayName: intervencion.tecnico.displayName
      },
      totales: {
        importeTotal,
        cantidadMateriales: intervencion.materiales?.length || 0
      },
      createdAt: intervencion.createdAt.toISOString(),
      updatedAt: intervencion.updatedAt.toISOString()
    };
  }

  private formatMaterialResponse(material: any): MaterialResponse {
    return {
      id: material.id,
      codigoArticulo: material.codigoArticulo,
      unidadesUtilizadas: Number(material.unidadesUtilizadas),
      precio: Number(material.precio),
      descuento: Number(material.descuento),
      importeTotal: Number(material.importeTotal),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString()
    };
  }

  // Listar intervenciones de un ticket
  async listByTicket(
    numeroTicket: string,
    filters: IntervencionFilters,
    userId: string,
    userRoles: string[]
  ) {
    await this.verifyUserPermissions(userId, userRoles, 'read');

    const where: Prisma.IntervencionWhereInput = {
      numeroTicket,
      ...(filters.estadoTarea && { estadoTarea: filters.estadoTarea as any }),
      ...(filters.tecnicoAsignadoId && { tecnicoAsignadoId: filters.tecnicoAsignadoId }),
      ...(filters.fechaDesde && { 
        fechaHoraInicio: { gte: new Date(filters.fechaDesde) } 
      }),
      ...(filters.fechaHasta && { 
        fechaHoraInicio: { lte: new Date(filters.fechaHasta) } 
      })
    };

    // Si es técnico, solo sus intervenciones
    if (!userRoles.includes('ADMIN')) {
      where.OR = [
        { tecnicoAsignadoId: userId },
        { ticket: { technicianId: userId } }
      ];
    }

    const [intervenciones, total] = await Promise.all([
      prisma.intervencion.findMany({
        where,
        include: {
          tecnico: { select: { id: true, displayName: true } },
          materiales: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.intervencion.count({ where })
    ]);

    return {
      data: intervenciones.map(this.formatIntervencionResponse.bind(this)),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize)
      }
    };
  }

  // Obtener intervención por ID
  async getById(id: string, userId: string, userRoles: string[]) {
    await this.verifyUserPermissions(userId, userRoles, 'read', id);

    const where: Prisma.IntervencionWhereInput = { id };

    // Si es técnico, solo sus intervenciones
    if (!userRoles.includes('ADMIN')) {
      where.OR = [
        { tecnicoAsignadoId: userId },
        { ticket: { technicianId: userId } }
      ];
    }

    const intervencion = await prisma.intervencion.findFirst({
      where,
      include: {
        tecnico: { select: { id: true, displayName: true } },
        materiales: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!intervencion) {
      const error = new Error('Intervención no encontrada');
      (error as any).statusCode = 404;
      throw error;
    }

    return this.formatIntervencionResponse(intervencion);
  }

  // Crear intervención
  async create(
    numeroTicket: string,
    data: CreateIntervencionDto,
    userId: string,
    userRoles: string[]
  ) {
    await this.verifyTicketNotClosed(numeroTicket);
    await this.verifyUserPermissions(userId, userRoles, 'write', undefined, data.tecnicoAsignadoId);

    const fechaInicio = data.fechaHoraInicio ? new Date(data.fechaHoraInicio) : null;
    const fechaFin = data.fechaHoraFin ? new Date(data.fechaHoraFin) : null;
    const duracionMinutos = this.calculateDuration(fechaInicio, fechaFin);

    const intervencion = await prisma.intervencion.create({
      data: {
        numeroTicket,
        fechaHoraProgramada: data.fechaHoraProgramada ? new Date(data.fechaHoraProgramada) : null,
        fechaHoraInicio: fechaInicio,
        fechaHoraFin: fechaFin,
        tecnicoAsignadoId: data.tecnicoAsignadoId,
        tipoAccion: data.tipoAccion as any,
        descripcion: data.descripcion,
        estadoTarea: data.estadoTarea as any,
        duracionMinutos,
        costeEstimado: data.costeEstimado,
        resultado: data.resultado as any,
        firmaClienteUrl: data.firmaClienteUrl,
        ubicacion: data.ubicacion as any
      },
      include: {
        tecnico: { select: { id: true, displayName: true } },
        materiales: true
      }
    });

    // Registrar auditoría
    await auditService.logIntervencionCreate(userId, intervencion);
    
    return this.formatIntervencionResponse(intervencion);
  }

  // Actualizar intervención
  async update(
    id: string,
    data: UpdateIntervencionDto,
    userId: string,
    userRoles: string[]
  ) {
    await this.verifyUserPermissions(userId, userRoles, 'write', id);

    // Obtener estado anterior para auditoría
    const before = await prisma.intervencion.findUnique({
      where: { id },
      include: {
        tecnico: { select: { id: true, displayName: true } },
        materiales: true
      }
    });

    const updateData: any = { ...data };
    
    if (data.fechaHoraProgramada !== undefined) {
      updateData.fechaHoraProgramada = data.fechaHoraProgramada ? new Date(data.fechaHoraProgramada) : null;
    }
    
    if (data.fechaHoraInicio !== undefined) {
      updateData.fechaHoraInicio = data.fechaHoraInicio ? new Date(data.fechaHoraInicio) : null;
    }
    
    if (data.fechaHoraFin !== undefined) {
      updateData.fechaHoraFin = data.fechaHoraFin ? new Date(data.fechaHoraFin) : null;
    }

    // Recalcular duración si se actualizan las fechas
    if (updateData.fechaHoraInicio !== undefined || updateData.fechaHoraFin !== undefined) {
      const current = await prisma.intervencion.findUnique({
        where: { id },
        select: { fechaHoraInicio: true, fechaHoraFin: true }
      });

      const fechaInicio = updateData.fechaHoraInicio ?? current?.fechaHoraInicio;
      const fechaFin = updateData.fechaHoraFin ?? current?.fechaHoraFin;
      updateData.duracionMinutos = this.calculateDuration(fechaInicio, fechaFin);
    }

    const intervencion = await prisma.intervencion.update({
      where: { id },
      data: updateData,
      include: {
        tecnico: { select: { id: true, displayName: true } },
        materiales: true
      }
    });

    // Registrar auditoría
    await auditService.logIntervencionUpdate(userId, id, before, intervencion);

    return this.formatIntervencionResponse(intervencion);
  }

  // Eliminar intervención
  async delete(id: string, userId: string, userRoles: string[]) {
    await this.verifyUserPermissions(userId, userRoles, 'delete', id);

    // Obtener datos para auditoría antes de eliminar
    const intervencion = await prisma.intervencion.findUnique({
      where: { id },
      include: {
        tecnico: { select: { id: true, displayName: true } },
        materiales: true
      }
    });

    await prisma.intervencion.delete({
      where: { id }
    });

    // Registrar auditoría
    if (intervencion) {
      await auditService.logIntervencionDelete(userId, intervencion);
    }

    return { success: true };
  }

  // Agregar materiales
  async addMateriales(
    intervencionId: string,
    materiales: CreateMaterialDto[],
    userId: string,
    userRoles: string[]
  ) {
    await this.verifyUserPermissions(userId, userRoles, 'write', intervencionId);

    return prisma.$transaction(async (tx) => {
      const materialesData = materiales.map(material => ({
        intervencionId,
        codigoArticulo: material.codigoArticulo,
        unidadesUtilizadas: material.unidadesUtilizadas,
        precio: material.precio,
        descuento: material.descuento,
        importeTotal: this.calculateMaterialTotal(
          material.unidadesUtilizadas,
          material.precio,
          material.descuento
        )
      }));

      const created = await tx.intervencionMaterial.createMany({
        data: materialesData
      });

      const intervencion = await tx.intervencion.findUnique({
        where: { id: intervencionId },
        include: {
          tecnico: { select: { id: true, displayName: true } },
          materiales: true
        }
      });

      return this.formatIntervencionResponse(intervencion!);
    });
  }

  // Actualizar material
  async updateMaterial(
    intervencionId: string,
    materialId: string,
    data: UpdateMaterialDto,
    userId: string,
    userRoles: string[]
  ) {
    await this.verifyUserPermissions(userId, userRoles, 'write', intervencionId);

    return prisma.$transaction(async (tx) => {
      const current = await tx.intervencionMaterial.findFirst({
        where: { id: materialId, intervencionId }
      });

      if (!current) {
        const error = new Error('Material no encontrado');
        (error as any).statusCode = 404;
        throw error;
      }

      const updateData: any = { ...data };
      
      // Recalcular importe si cambian los valores
      if (data.unidadesUtilizadas || data.precio || data.descuento !== undefined) {
        const unidades = data.unidadesUtilizadas ?? Number(current.unidadesUtilizadas);
        const precio = data.precio ?? Number(current.precio);
        const descuento = data.descuento ?? Number(current.descuento);
        updateData.importeTotal = this.calculateMaterialTotal(unidades, precio, descuento);
      }

      await tx.intervencionMaterial.update({
        where: { id: materialId },
        data: updateData
      });

      const intervencion = await tx.intervencion.findUnique({
        where: { id: intervencionId },
        include: {
          tecnico: { select: { id: true, displayName: true } },
          materiales: true
        }
      });

      return this.formatIntervencionResponse(intervencion!);
    });
  }

  // Eliminar material
  async deleteMaterial(
    intervencionId: string,
    materialId: string,
    userId: string,
    userRoles: string[]
  ) {
    await this.verifyUserPermissions(userId, userRoles, 'write', intervencionId);

    return prisma.$transaction(async (tx) => {
      const exists = await tx.intervencionMaterial.findFirst({
        where: { id: materialId, intervencionId }
      });

      if (!exists) {
        const error = new Error('Material no encontrado');
        (error as any).statusCode = 404;
        throw error;
      }

      await tx.intervencionMaterial.delete({
        where: { id: materialId }
      });

      const intervencion = await tx.intervencion.findUnique({
        where: { id: intervencionId },
        include: {
          tecnico: { select: { id: true, displayName: true } },
          materiales: true
        }
      });

      return this.formatIntervencionResponse(intervencion!);
    });
  }

  // Actualizar adjuntos JSON
  async updateAdjuntos(
    id: string,
    adjuntosJson: any,
    userId: string,
    userRoles: string[]
  ) {
    await this.verifyUserPermissions(userId, userRoles, 'write', id);

    const intervencion = await prisma.intervencion.update({
      where: { id },
      data: { adjuntosJson },
      include: {
        tecnico: { select: { id: true, displayName: true } },
        materiales: true
      }
    });

    return this.formatIntervencionResponse(intervencion);
  }
}

export const intervencionService = new IntervencionService();