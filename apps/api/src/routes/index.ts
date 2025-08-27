import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'OFSAT App API',
    version: '1.0.0',
    status: 'running'
  });
});

export default router;
