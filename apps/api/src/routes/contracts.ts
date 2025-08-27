import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/contracts - List contracts with optional search by numeroSerie
router.get('/', async (req, res, next) => {
  try {
    const { qNumeroSerie } = req.query;
    
    const where: any = {};
    
    if (qNumeroSerie && typeof qNumeroSerie === 'string') {
      where.numeroSerie = {
        contains: qNumeroSerie,
        mode: 'insensitive'
      };
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { fechaInicio: 'desc' },
      include: {
        client: {
          select: {
            codigoCliente: true,
            razonSocial: true,
            contacto: true
          }
        },
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

// GET /api/contracts/:id - Get single contract
router.get('/:id', async (req, res, next) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: {
            codigoCliente: true,
            razonSocial: true,
            telefono: true,
            email: true,
            domicilio: true,
            contacto: true
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({
        error: { message: 'Contrato no encontrado', status: 404 }
      });
    }

    res.json(contract);
  } catch (error) {
    next(error);
  }
});

export default router;