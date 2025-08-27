import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/clients - List clients with optional search
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    const where: any = {};
    
    if (q && typeof q === 'string') {
      where.OR = [
        { razonSocial: { contains: q, mode: 'insensitive' } },
        { codigoCliente: { contains: q, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { razonSocial: 'asc' },
      include: {
        _count: {
          select: {
            contracts: true,
            tickets: true
          }
        }
      }
    });

    res.json(clients);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:codigoCliente - Get single client
router.get('/:codigoCliente', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { codigoCliente: req.params.codigoCliente },
      include: {
        _count: {
          select: {
            contracts: true,
            tickets: true
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        error: { message: 'Cliente no encontrado', status: 404 }
      });
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:codigoCliente/contracts - Get client contracts
router.get('/:codigoCliente/contracts', async (req, res, next) => {
  try {
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { codigoCliente: req.params.codigoCliente }
    });

    if (!client) {
      return res.status(404).json({
        error: { message: 'Cliente no encontrado', status: 404 }
      });
    }

    const contracts = await prisma.contract.findMany({
      where: { codigoCliente: req.params.codigoCliente },
      orderBy: { fechaInicio: 'desc' },
      include: {
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    res.json(contracts);
  } catch (error) {
    next(error);
  }
});

export default router;