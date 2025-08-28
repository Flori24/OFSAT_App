import { Router } from 'express';
import authRouter from './auth';
import usersRouter from './users';
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
      auth: '/api/auth',
      users: '/api/users',
      tickets: '/api/tickets',
      clients: '/api/clients', 
      contracts: '/api/contracts',
      technicians: '/api/technicians'
    }
  });
});

// Mount subrouters
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/tickets', ticketsRouter);
router.use('/clients', clientsRouter);
router.use('/contracts', contractsRouter);
router.use('/technicians', techniciansRouter);

export default router;
