import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRoles } from '../middleware/auth';
import bcrypt from 'bcrypt';
const router = Router();

// GET /api/users - List all users (ADMIN only)
router.get('/', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ 
      include: { tecnico: true }, 
      orderBy: { username: 'asc' } 
    });
    
    res.json(users.map(u => ({ 
      id: u.id, 
      username: u.username, 
      email: u.email,
      displayName: u.displayName, 
      roles: u.roles, 
      isActive: u.isActive,
      tecnicoId: u.tecnico?.id || null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    })));
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id - Get user by ID (ADMIN only)
router.get('/:id', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
  try {
    const u = await prisma.user.findUnique({ 
      where: { id: req.params.id }, 
      include: { tecnico: true } 
    });
    
    if (!u) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      id: u.id, 
      username: u.username, 
      email: u.email,
      displayName: u.displayName, 
      roles: u.roles, 
      isActive: u.isActive,
      tecnicoId: u.tecnico?.id || null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Create new user (ADMIN only)
router.post('/', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
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
        roles: roles?.length ? roles : [Role.USER] 
      },
    });
    
    res.status(201).json({ 
      id: created.id, 
      username: created.username, 
      email: created.email,
      displayName: created.displayName,
      roles: created.roles,
      isActive: created.isActive
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id - Update user (ADMIN only)
router.put('/:id', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
  const { email, displayName, roles, isActive } = req.body || {};
  
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { email, displayName, roles, isActive },
    });
    
    res.json({ 
      id: updated.id, 
      username: updated.username, 
      email: updated.email,
      displayName: updated.displayName,
      roles: updated.roles, 
      isActive: updated.isActive 
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/reset-password - Reset user password (ADMIN only)
router.post('/:id/reset-password', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
  const { password } = req.body || {};
  
  if (!password) return res.status(400).json({ error: 'password required' });
  
  try {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({ 
      where: { id: req.params.id }, 
      data: { passwordHash: hash } 
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/link-tecnico - Link user to tecnico (ADMIN only)
router.post('/:id/link-tecnico', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
  const { tecnicoId } = req.body || {};
  
  if (!tecnicoId) return res.status(400).json({ error: 'tecnicoId required' });
  
  try {
    await prisma.tecnico.update({ 
      where: { id: tecnicoId }, 
      data: { usuarioId: req.params.id } 
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Link tecnico error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tecnico not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/unlink-tecnico - Unlink user from tecnico (ADMIN only)
router.post('/:id/unlink-tecnico', requireAuth, requireRoles(Role.ADMIN), async (req, res) => {
  try {
    await prisma.tecnico.updateMany({ 
      where: { usuarioId: req.params.id }, 
      data: { usuarioId: null } 
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Unlink tecnico error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;