import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';
import { Role } from '@prisma/client';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  const token = hdr?.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, username: payload.username, roles: payload.roles };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: any, res: any, next: any) => {
    const has = req.user?.roles?.some((r: Role) => roles.includes(r));
    if (!has) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}