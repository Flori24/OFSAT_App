import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { signAccessToken } from '../auth/jwt';
import { requireAuth, requireRoles } from '../middleware/auth';
const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = signAccessToken(user);
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName, 
        roles: user.roles 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { tecnico: true },
    });
    
    if (!me) return res.status(404).json({ error: 'User not found' });
    
    return res.json({ 
      user: { 
        id: me.id, 
        username: me.username, 
        displayName: me.displayName, 
        roles: me.roles, 
        technicianId: me.tecnico?.id || null 
      } 
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register (solo ADMIN)
router.post('/register', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
  const { username, email, displayName, password, roles } = req.body || {};
  if (!username || !displayName || !password) {
    return res.status(400).json({ error: 'Missing required fields: username, displayName, password' });
  }
  
  try {
    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    
    const hash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { 
        username, 
        email, 
        displayName, 
        passwordHash: hash, 
        roles: roles?.length ? roles : [Role.LECTOR] 
      },
    });
    
    return res.status(201).json({ 
      id: created.id, 
      username: created.username, 
      displayName: created.displayName,
      roles: created.roles 
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;