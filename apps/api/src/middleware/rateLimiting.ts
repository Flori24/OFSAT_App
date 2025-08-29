/**
 * Rate limiting middleware with different limits for different operations
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { auditService } from '../services/auditService';

// General API rate limit
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    // Log rate limiting event
    const context = auditService.getContextFromRequest(req);
    await auditService.logSecurityEvent('RATE_LIMITED', {
      endpoint: req.path,
      method: req.method,
      limit: 'general',
      windowMs: 15 * 60 * 1000,
      max: 100,
    }, context);

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMITED'
    });
  }
});

// Strict rate limit for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 file uploads per 5 minutes
  message: {
    error: 'Too many file upload attempts, please try again later.',
    code: 'UPLOAD_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    const context = auditService.getContextFromRequest(req);
    await auditService.logSecurityEvent('RATE_LIMITED', {
      endpoint: req.path,
      method: req.method,
      limit: 'upload',
      windowMs: 5 * 60 * 1000,
      max: 10,
    }, context);

    res.status(429).json({
      error: 'Too many file upload attempts, please try again later.',
      code: 'UPLOAD_RATE_LIMITED'
    });
  }
});

// Authentication rate limit
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    const context = auditService.getContextFromRequest(req);
    await auditService.logSecurityEvent('RATE_LIMITED', {
      endpoint: req.path,
      method: req.method,
      limit: 'auth',
      windowMs: 15 * 60 * 1000,
      max: 5,
    }, context);

    res.status(429).json({
      error: 'Too many login attempts, please try again later.',
      code: 'AUTH_RATE_LIMITED'
    });
  }
});

// Create intervention rate limit (to prevent spam)
export const createRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 creation requests per minute
  message: {
    error: 'Too many creation requests, please slow down.',
    code: 'CREATE_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    const context = auditService.getContextFromRequest(req);
    await auditService.logSecurityEvent('RATE_LIMITED', {
      endpoint: req.path,
      method: req.method,
      limit: 'create',
      windowMs: 1 * 60 * 1000,
      max: 20,
    }, context);

    res.status(429).json({
      error: 'Too many creation requests, please slow down.',
      code: 'CREATE_RATE_LIMITED'
    });
  }
});