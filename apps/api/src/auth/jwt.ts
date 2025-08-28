import jwt from 'jsonwebtoken';
import { Role, User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export type JwtPayload = {
  sub: string;
  username: string;
  roles: Role[];
};

export function signAccessToken(user: User) {
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    roles: user.roles as Role[],
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}