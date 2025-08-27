import { Router } from 'express';
import ticketsRouter from './tickets';
import clientsRouter from './clients';
import contractsRouter from './contracts';
import techniciansRouter from './technicians';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'OFSAT App API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      tickets: '/api/tickets',
      clients: '/api/clients', 
      contracts: '/api/contracts',
      technicians: '/api/technicians'
    }
  });
});

// Mount subrouters
router.use('/tickets', ticketsRouter);
router.use('/clients', clientsRouter);
router.use('/contracts', contractsRouter);
router.use('/technicians', techniciansRouter);

export default router;
