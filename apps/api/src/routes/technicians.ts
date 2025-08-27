import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/technicians - List all technicians (for dropdowns)
router.get('/', async (req, res, next) => {
  try {
    const technicians = await prisma.technician.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: {
            tickets: {
              where: {
                estadoTicket: {
                  notIn: ['EN_PROCESO']  // Count only active tickets
                }
              }
            }
          }
        }
      }
    });

    res.json(technicians);
  } catch (error) {
    next(error);
  }
});

export default router;