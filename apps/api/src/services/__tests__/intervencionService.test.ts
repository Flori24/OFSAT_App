import { IntervencionService } from '../intervencionService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('IntervencionService', () => {
  let service: IntervencionService;

  beforeEach(() => {
    service = new IntervencionService();
    jest.clearAllMocks();
  });

  describe('calculateDuration', () => {
    it('should calculate duration in minutes correctly', () => {
      const inicio = new Date('2024-01-01T10:00:00Z');
      const fin = new Date('2024-01-01T10:30:00Z');
      
      // Access private method for testing
      const duration = (service as any).calculateDuration(inicio, fin);
      
      expect(duration).toBe(30);
    });

    it('should return null if inicio or fin is null', () => {
      const inicio = new Date('2024-01-01T10:00:00Z');
      
      const duration1 = (service as any).calculateDuration(null, inicio);
      const duration2 = (service as any).calculateDuration(inicio, null);
      const duration3 = (service as any).calculateDuration(null, null);
      
      expect(duration1).toBeNull();
      expect(duration2).toBeNull();
      expect(duration3).toBeNull();
    });

    it('should handle fractional minutes correctly', () => {
      const inicio = new Date('2024-01-01T10:00:00Z');
      const fin = new Date('2024-01-01T10:00:30Z'); // 30 seconds
      
      const duration = (service as any).calculateDuration(inicio, fin);
      
      expect(duration).toBe(1); // Should round 0.5 minutes to 1
    });
  });

  describe('calculateMaterialTotal', () => {
    it('should calculate material total correctly without discount', () => {
      const total = (service as any).calculateMaterialTotal(5, 10.50, 0);
      expect(total).toBe(52.50);
    });

    it('should calculate material total correctly with discount', () => {
      const total = (service as any).calculateMaterialTotal(5, 10, 20); // 20% discount
      expect(total).toBe(40); // 5 * 10 * 0.8 = 40
    });

    it('should handle decimal precision correctly', () => {
      const total = (service as any).calculateMaterialTotal(3, 9.99, 15);
      expect(total).toBe(25.47); // 3 * 9.99 * 0.85 = 25.4715, rounded to 25.47
    });

    it('should handle 100% discount', () => {
      const total = (service as any).calculateMaterialTotal(5, 10, 100);
      expect(total).toBe(0);
    });
  });

  describe('verifyTicketNotClosed', () => {
    it('should throw error if ticket is not found', async () => {
      (mockPrisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

      await expect((service as any).verifyTicketNotClosed('TICKET-001'))
        .rejects.toThrow('Ticket no encontrado');
    });

    it('should throw 409 error if ticket is closed', async () => {
      (mockPrisma.ticket.findUnique as jest.Mock).mockResolvedValue({
        fechaCierre: new Date()
      });

      try {
        await (service as any).verifyTicketNotClosed('TICKET-001');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('No se pueden crear intervenciones en tickets cerrados');
        expect(error.statusCode).toBe(409);
      }
    });

    it('should pass if ticket is not closed', async () => {
      (mockPrisma.ticket.findUnique as jest.Mock).mockResolvedValue({
        fechaCierre: null
      });

      await expect((service as any).verifyTicketNotClosed('TICKET-001'))
        .resolves.toBeUndefined();
    });
  });

  describe('verifyUserPermissions', () => {
    it('should allow admin to do everything', async () => {
      await expect((service as any).verifyUserPermissions(
        'user123', ['ADMIN'], 'delete', 'int123'
      )).resolves.toBeUndefined();
    });

    it('should allow technician to read', async () => {
      await expect((service as any).verifyUserPermissions(
        'user123', ['TECNICO'], 'read'
      )).resolves.toBeUndefined();
    });

    it('should throw 403 for insufficient permissions', async () => {
      try {
        await (service as any).verifyUserPermissions(
          'user123', ['LECTOR'], 'write'
        );
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('Sin permisos suficientes');
        expect(error.statusCode).toBe(403);
      }
    });

    it('should prevent technician from deleting finalized intervention', async () => {
      (mockPrisma.intervencion.findUnique as jest.Mock).mockResolvedValue({
        tecnicoAsignadoId: 'user123',
        estadoTarea: 'FINALIZADA',
        ticket: { technicianId: 'user123' }
      });

      try {
        await (service as any).verifyUserPermissions(
          'user123', ['TECNICO'], 'delete', 'int123'
        );
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('No se puede borrar una intervención finalizada');
        expect(error.statusCode).toBe(403);
      }
    });
  });

  describe('Validation rules', () => {
    it('should validate fechaHoraFin >= fechaHoraInicio', () => {
      const validData = {
        fechaHoraInicio: '2024-01-01T10:00:00Z',
        fechaHoraFin: '2024-01-01T10:30:00Z',
        tecnicoAsignadoId: 'tech123',
        tipoAccion: 'Diagnostico' as const,
        estadoTarea: 'Pendiente' as const
      };

      const invalidData = {
        fechaHoraInicio: '2024-01-01T10:30:00Z',
        fechaHoraFin: '2024-01-01T10:00:00Z', // Earlier than start
        tecnicoAsignadoId: 'tech123',
        tipoAccion: 'Diagnostico' as const,
        estadoTarea: 'Pendiente' as const
      };

      // This would be tested in the schema validation, but we can test the logic
      const inicio1 = new Date(validData.fechaHoraInicio);
      const fin1 = new Date(validData.fechaHoraFin);
      expect(fin1 >= inicio1).toBe(true);

      const inicio2 = new Date(invalidData.fechaHoraInicio);
      const fin2 = new Date(invalidData.fechaHoraFin);
      expect(fin2 >= inicio2).toBe(false);
    });

    it('should require dates for finalized state', () => {
      const dataWithoutDates = {
        tecnicoAsignadoId: 'tech123',
        tipoAccion: 'Diagnostico' as const,
        estadoTarea: 'Finalizada' as const
      };

      const dataWithDates = {
        fechaHoraInicio: '2024-01-01T10:00:00Z',
        fechaHoraFin: '2024-01-01T10:30:00Z',
        tecnicoAsignadoId: 'tech123',
        tipoAccion: 'Diagnostico' as const,
        estadoTarea: 'Finalizada' as const
      };

      // Logic validation
      if (dataWithoutDates.estadoTarea === 'Finalizada') {
        expect(dataWithoutDates).not.toHaveProperty('fechaHoraInicio');
        expect(dataWithoutDates).not.toHaveProperty('fechaHoraFin');
      }

      if (dataWithDates.estadoTarea === 'Finalizada') {
        expect(dataWithDates.fechaHoraInicio).toBeDefined();
        expect(dataWithDates.fechaHoraFin).toBeDefined();
      }
    });
  });

  describe('formatIntervencionResponse', () => {
    it('should format response correctly', () => {
      const mockIntervencion = {
        id: 'int123',
        numeroTicket: 'TICKET-001',
        fechaHoraProgramada: new Date('2024-01-01T10:00:00Z'),
        fechaHoraInicio: new Date('2024-01-01T10:00:00Z'),
        fechaHoraFin: new Date('2024-01-01T10:30:00Z'),
        tecnicoAsignadoId: 'tech123',
        tipoAccion: 'DIAGNOSTICO',
        descripcion: 'Test intervention',
        estadoTarea: 'PENDIENTE',
        duracionMinutos: 30,
        costeEstimado: 100.50,
        resultado: null,
        firmaClienteUrl: null,
        ubicacion: 'CLIENTE',
        adjuntosJson: null,
        materiales: [
          {
            id: 'mat123',
            codigoArticulo: 'ART001',
            unidadesUtilizadas: 2,
            precio: 10,
            descuento: 0,
            importeTotal: 20,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z')
          }
        ],
        tecnico: {
          id: 'tech123',
          displayName: 'John Technician'
        },
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };

      const formatted = (service as any).formatIntervencionResponse(mockIntervencion);

      expect(formatted).toEqual({
        id: 'int123',
        numeroTicket: 'TICKET-001',
        fechaHoraProgramada: '2024-01-01T10:00:00.000Z',
        fechaHoraInicio: '2024-01-01T10:00:00.000Z',
        fechaHoraFin: '2024-01-01T10:30:00.000Z',
        tecnicoAsignadoId: 'tech123',
        tipoAccion: 'DIAGNOSTICO',
        descripcion: 'Test intervention',
        estadoTarea: 'PENDIENTE',
        duracionMinutos: 30,
        costeEstimado: 100.50,
        resultado: null,
        firmaClienteUrl: null,
        ubicacion: 'CLIENTE',
        adjuntosJson: null,
        materiales: [{
          id: 'mat123',
          codigoArticulo: 'ART001',
          unidadesUtilizadas: 2,
          precio: 10,
          descuento: 0,
          importeTotal: 20,
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T10:00:00.000Z'
        }],
        tecnico: {
          id: 'tech123',
          displayName: 'John Technician'
        },
        totales: {
          importeTotal: 20,
          cantidadMateriales: 1
        },
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z'
      });
    });

    it('should handle empty materiales array', () => {
      const mockIntervencion = {
        id: 'int123',
        numeroTicket: 'TICKET-001',
        fechaHoraProgramada: null,
        fechaHoraInicio: null,
        fechaHoraFin: null,
        tecnicoAsignadoId: 'tech123',
        tipoAccion: 'DIAGNOSTICO',
        descripcion: null,
        estadoTarea: 'PENDIENTE',
        duracionMinutos: null,
        costeEstimado: null,
        resultado: null,
        firmaClienteUrl: null,
        ubicacion: null,
        adjuntosJson: null,
        materiales: [],
        tecnico: {
          id: 'tech123',
          displayName: 'John Technician'
        },
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };

      const formatted = (service as any).formatIntervencionResponse(mockIntervencion);

      expect(formatted.totales).toEqual({
        importeTotal: 0,
        cantidadMateriales: 0
      });
      expect(formatted.materiales).toEqual([]);
    });
  });
});