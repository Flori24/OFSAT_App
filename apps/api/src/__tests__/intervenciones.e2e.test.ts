import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import app from '../index';

const prisma = new PrismaClient();

describe('Intervenciones E2E Tests', () => {
  let adminToken: string;
  let tecnicoToken: string;
  let testTicket: string;
  let testIntervencion: string;
  let testTecnicoId: string;

  beforeAll(async () => {
    // Create test users and get tokens
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin-test',
        displayName: 'Admin Test',
        email: 'admin@test.com',
        passwordHash: 'hashedpassword',
        roles: ['ADMIN']
      }
    });

    const tecnicoUser = await prisma.user.create({
      data: {
        username: 'tecnico-test',
        displayName: 'Tecnico Test',
        email: 'tecnico@test.com',
        passwordHash: 'hashedpassword',
        roles: ['TECNICO']
      }
    });

    testTecnicoId = tecnicoUser.id;

    adminToken = sign(
      { userId: adminUser.id, roles: adminUser.roles },
      process.env.JWT_SECRET || 'test-secret'
    );

    tecnicoToken = sign(
      { userId: tecnicoUser.id, roles: tecnicoUser.roles },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test client and ticket
    const client = await prisma.client.create({
      data: {
        codigoCliente: 'CLI-TEST-001',
        razonSocial: 'Test Client S.A.',
        telefono: '555-0001',
        email: 'client@test.com'
      }
    });

    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: 'TICKET-TEST-001',
        usuarioCreacion: 'admin-test',
        tipoTicket: 'INFORMATICA',
        codigoCliente: client.codigoCliente,
        razonSocial: client.razonSocial,
        origen: 'MANUAL',
        detalle: 'Test ticket for interventions'
      }
    });

    testTicket = ticket.numeroTicket;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.intervencionMaterial.deleteMany({});
    await prisma.intervencion.deleteMany({});
    await prisma.ticket.deleteMany({ where: { numeroTicket: { contains: 'TEST' } } });
    await prisma.client.deleteMany({ where: { codigoCliente: { contains: 'TEST' } } });
    await prisma.user.deleteMany({ where: { username: { contains: 'test' } } });
    await prisma.$disconnect();
  });

  describe('POST /tickets/:numero/intervenciones', () => {
    it('should create intervention with valid data', async () => {
      const intervencionData = {
        fechaHoraProgramada: '2024-01-01T10:00:00Z',
        tecnicoAsignadoId: testTecnicoId,
        tipoAccion: 'Diagnostico',
        descripcion: 'Diagnóstico inicial del problema',
        estadoTarea: 'Pendiente',
        costeEstimado: 150.50,
        ubicacion: 'Cliente'
      };

      const response = await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(intervencionData)
        .expect(201);

      expect(response.body).toMatchObject({
        numeroTicket: testTicket,
        tipoAccion: 'Diagnostico',
        estadoTarea: 'Pendiente',
        costeEstimado: 150.50,
        ubicacion: 'Cliente'
      });

      testIntervencion = response.body.id;
    });

    it('should reject invalid tipoAccion', async () => {
      const invalidData = {
        tecnicoAsignadoId: testTecnicoId,
        tipoAccion: 'InvalidAction',
        estadoTarea: 'Pendiente'
      };

      await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should reject fechaHoraFin without fechaHoraInicio', async () => {
      const invalidData = {
        fechaHoraFin: '2024-01-01T11:00:00Z',
        tecnicoAsignadoId: testTecnicoId,
        tipoAccion: 'Diagnostico',
        estadoTarea: 'Pendiente'
      };

      await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should reject Finalizada state without required dates', async () => {
      const invalidData = {
        tecnicoAsignadoId: testTecnicoId,
        tipoAccion: 'Diagnostico',
        estadoTarea: 'Finalizada'
      };

      await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should require authentication', async () => {
      const data = {
        tecnicoAsignadoId: testTecnicoId,
        tipoAccion: 'Diagnostico',
        estadoTarea: 'Pendiente'
      };

      await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .send(data)
        .expect(401);
    });
  });

  describe('GET /tickets/:numero/intervenciones', () => {
    it('should list interventions for ticket', async () => {
      const response = await request(app as Express)
        .get(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by estadoTarea', async () => {
      await request(app as Express)
        .get(`/api/tickets/${testTicket}/intervenciones?estadoTarea=Pendiente`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should filter by tecnico', async () => {
      await request(app as Express)
        .get(`/api/tickets/${testTicket}/intervenciones?tecnicoAsignadoId=${testTecnicoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /intervenciones/:id', () => {
    it('should get intervention details', async () => {
      const response = await request(app as Express)
        .get(`/api/intervenciones/${testIntervencion}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testIntervencion,
        numeroTicket: testTicket,
        tipoAccion: 'Diagnostico'
      });

      expect(response.body).toHaveProperty('materiales');
      expect(response.body).toHaveProperty('totales');
      expect(response.body).toHaveProperty('tecnico');
    });

    it('should return 404 for non-existent intervention', async () => {
      await request(app as Express)
        .get('/api/intervenciones/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /intervenciones/:id', () => {
    it('should update intervention', async () => {
      const updateData = {
        descripcion: 'Updated description',
        estadoTarea: 'EnCurso',
        fechaHoraInicio: '2024-01-01T10:00:00Z'
      };

      const response = await request(app as Express)
        .put(`/api/intervenciones/${testIntervencion}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        descripcion: 'Updated description',
        estadoTarea: 'EnCurso'
      });

      expect(response.body.fechaHoraInicio).toBe('2024-01-01T10:00:00.000Z');
    });

    it('should calculate duration when updating dates', async () => {
      const updateData = {
        fechaHoraFin: '2024-01-01T10:45:00Z'
      };

      const response = await request(app as Express)
        .put(`/api/intervenciones/${testIntervencion}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.duracionMinutos).toBe(45);
    });
  });

  describe('Materials Management', () => {
    it('should add materials to intervention', async () => {
      const materials = [
        {
          codigoArticulo: 'ART001',
          unidadesUtilizadas: 2,
          precio: 15.50,
          descuento: 10
        },
        {
          codigoArticulo: 'ART002',
          unidadesUtilizadas: 1,
          precio: 25.00,
          descuento: 0
        }
      ];

      const response = await request(app as Express)
        .post(`/api/intervenciones/${testIntervencion}/materiales`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(materials)
        .expect(200);

      expect(response.body.materiales).toHaveLength(2);
      expect(response.body.totales.cantidadMateriales).toBe(2);
      expect(response.body.totales.importeTotal).toBe(52.90); // (2*15.50*0.9) + (1*25*1) = 27.9 + 25 = 52.9
    });

    it('should add single material', async () => {
      const material = {
        codigoArticulo: 'ART003',
        unidadesUtilizadas: 3,
        precio: 10.00,
        descuento: 5
      };

      const response = await request(app as Express)
        .post(`/api/intervenciones/${testIntervencion}/materiales`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(material)
        .expect(200);

      expect(response.body.materiales).toHaveLength(3);
      expect(response.body.totales.importeTotal).toBe(81.40); // Previous 52.90 + (3*10*0.95) = 52.90 + 28.50 = 81.40
    });

    it('should update material', async () => {
      // Get the first material ID
      const getResponse = await request(app as Express)
        .get(`/api/intervenciones/${testIntervencion}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const materialId = getResponse.body.materiales[0].id;

      const updateData = {
        precio: 20.00,
        descuento: 20
      };

      const response = await request(app as Express)
        .put(`/api/intervenciones/${testIntervencion}/materiales/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      const updatedMaterial = response.body.materiales.find((m: any) => m.id === materialId);
      expect(updatedMaterial.precio).toBe(20.00);
      expect(updatedMaterial.descuento).toBe(20);
      expect(updatedMaterial.importeTotal).toBe(32.00); // 2 * 20 * 0.8 = 32
    });

    it('should delete material', async () => {
      // Get materials
      const getResponse = await request(app as Express)
        .get(`/api/intervenciones/${testIntervencion}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const materialId = getResponse.body.materiales[0].id;
      const initialCount = getResponse.body.materiales.length;

      const response = await request(app as Express)
        .delete(`/api/intervenciones/${testIntervencion}/materiales/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.materiales).toHaveLength(initialCount - 1);
    });
  });

  describe('DELETE /intervenciones/:id', () => {
    it('should delete intervention', async () => {
      // Create a new intervention for deletion
      const intervencionData = {
        tecnicoAsignadoId: testTecnicoId,
        tipoAccion: 'Revision',
        estadoTarea: 'Pendiente'
      };

      const createResponse = await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(intervencionData)
        .expect(201);

      const intervencionId = createResponse.body.id;

      await request(app as Express)
        .delete(`/api/intervenciones/${intervencionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify it's deleted
      await request(app as Express)
        .get(`/api/intervenciones/${intervencionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Authorization Tests', () => {
    it('should prevent tecnico from creating intervention for another tech', async () => {
      const intervencionData = {
        tecnicoAsignadoId: testTecnicoId + '-other', // Different tech
        tipoAccion: 'Diagnostico',
        estadoTarea: 'Pendiente'
      };

      await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${tecnicoToken}`)
        .send(intervencionData)
        .expect(403);
    });

    it('should allow tecnico to create intervention for themselves', async () => {
      const intervencionData = {
        tecnicoAsignadoId: testTecnicoId,
        tipoAccion: 'Llamada',
        estadoTarea: 'Pendiente'
      };

      await request(app as Express)
        .post(`/api/tickets/${testTicket}/intervenciones`)
        .set('Authorization', `Bearer ${tecnicoToken}`)
        .send(intervencionData)
        .expect(201);
    });
  });
});