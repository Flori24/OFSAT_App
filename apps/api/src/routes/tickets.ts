import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ticketCreateSchema, ticketUpdateSchema, ticketQuerySchema } from '../schemas/ticket';

const router = Router();

// GET /api/tickets - List tickets with pagination and filtering
router.get('/', async (req, res, next) => {
  try {
    const query = ticketQuerySchema.parse(req.query);
    const { page, pageSize, codigoCliente, technicianId, estadoTicket, urgencia, fechaDesde, fechaHasta, q } = query;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};
    
    if (codigoCliente) where.codigoCliente = codigoCliente;
    if (technicianId) where.technicianId = technicianId;
    if (estadoTicket) where.estadoTicket = estadoTicket;
    if (urgencia) where.urgencia = urgencia;
    
    if (fechaDesde || fechaHasta) {
      where.fechaCreacion = {};
      if (fechaDesde) where.fechaCreacion.gte = fechaDesde;
      if (fechaHasta) where.fechaCreacion.lte = fechaHasta;
    }

    if (q) {
      where.OR = [
        { detalle: { contains: q, mode: 'insensitive' } },
        { numeroSerie: { contains: q, mode: 'insensitive' } },
        { numeroTicket: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Get total count and tickets
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          client: {
            select: { razonSocial: true, codigoCliente: true }
          },
          technician: {
            select: { id: true, nombre: true }
          },
          contrato: {
            select: { id: true, tipoContrato: true, numeroSerie: true }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    res.json({
      data: tickets,
      page,
      pageSize,
      total,
      totalPages
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tickets/:id - Get single ticket
router.get('/:id', async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { numeroTicket: req.params.id },
      include: {
        client: {
          select: { 
            razonSocial: true, 
            codigoCliente: true,
            telefono: true,
            email: true,
            contacto: true
          }
        },
        technician: {
          select: { id: true, nombre: true, email: true, telefono: true }
        },
        contrato: {
          select: { 
            id: true, 
            tipoContrato: true, 
            numeroSerie: true, 
            marca: true, 
            modelo: true, 
            ubicacion: true 
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        error: { message: 'Ticket no encontrado', status: 404 }
      });
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// POST /api/tickets - Create new ticket
router.post('/', async (req, res, next) => {
  try {
    const data = ticketCreateSchema.parse(req.body);

    // Generate ticket number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get the next ticket number for this month
    const prefix = `T${year}${month}-`;
    const lastTicket = await prisma.ticket.findFirst({
      where: { numeroTicket: { startsWith: prefix } },
      orderBy: { numeroTicket: 'desc' }
    });

    let nextNumber = 1;
    if (lastTicket) {
      const lastNumber = parseInt(lastTicket.numeroTicket.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    const numeroTicket = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { codigoCliente: data.codigoCliente }
    });

    if (!client) {
      return res.status(400).json({
        error: { message: 'Cliente no encontrado', status: 400 }
      });
    }

    // Verify technician exists if provided
    if (data.technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: data.technicianId }
      });

      if (!technician) {
        return res.status(400).json({
          error: { message: 'Técnico no encontrado', status: 400 }
        });
      }
    }

    // Verify contract exists if provided
    if (data.contratoId) {
      const contract = await prisma.contract.findUnique({
        where: { id: data.contratoId }
      });

      if (!contract || contract.codigoCliente !== data.codigoCliente) {
        return res.status(400).json({
          error: { message: 'Contrato no encontrado o no pertenece al cliente', status: 400 }
        });
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        numeroTicket,
        fechaCreacion: now,
        fechaUltimaActualizacion: now,
      },
      include: {
        client: { select: { razonSocial: true, codigoCliente: true } },
        technician: { select: { id: true, nombre: true } },
        contrato: { select: { id: true, tipoContrato: true, numeroSerie: true } }
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', async (req, res, next) => {
  try {
    const data = ticketUpdateSchema.parse(req.body);

    // Verify ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { numeroTicket: req.params.id }
    });

    if (!existingTicket) {
      return res.status(404).json({
        error: { message: 'Ticket no encontrado', status: 404 }
      });
    }

    // Verify client exists if provided
    if (data.codigoCliente) {
      const client = await prisma.client.findUnique({
        where: { codigoCliente: data.codigoCliente }
      });

      if (!client) {
        return res.status(400).json({
          error: { message: 'Cliente no encontrado', status: 400 }
        });
      }
    }

    // Verify technician exists if provided
    if (data.technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: data.technicianId }
      });

      if (!technician) {
        return res.status(400).json({
          error: { message: 'Técnico no encontrado', status: 400 }
        });
      }
    }

    // Verify contract exists if provided
    if (data.contratoId) {
      const contract = await prisma.contract.findUnique({
        where: { id: data.contratoId }
      });

      const clientCode = data.codigoCliente || existingTicket.codigoCliente;
      if (!contract || contract.codigoCliente !== clientCode) {
        return res.status(400).json({
          error: { message: 'Contrato no encontrado o no pertenece al cliente', status: 400 }
        });
      }
    }

    const ticket = await prisma.ticket.update({
      where: { numeroTicket: req.params.id },
      data,
      include: {
        client: { select: { razonSocial: true, codigoCliente: true } },
        technician: { select: { id: true, nombre: true } },
        contrato: { select: { id: true, tipoContrato: true, numeroSerie: true } }
      }
    });

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { numeroTicket: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({
        error: { message: 'Ticket no encontrado', status: 404 }
      });
    }

    await prisma.ticket.delete({
      where: { numeroTicket: req.params.id }
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;