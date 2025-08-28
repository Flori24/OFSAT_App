import { Router, Request, Response, NextFunction } from 'express';
import { intervencionService } from '../services/intervencionService';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  CreateIntervencionSchema,
  UpdateIntervencionSchema,
  CreateMaterialSchema,
  UpdateMaterialSchema,
  CreateMaterialesSchema,
  IntervencionFiltersSchema
} from '../schemas/intervencion';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const router = Router();

// Middleware para requerir roles específicos
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    
    next();
  };
};

// Middleware de manejo de errores async
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /tickets/:numero/intervenciones - Lista intervenciones de un ticket
router.get('/tickets/:numero/intervenciones', 
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { numero } = req.params;
    const filters = IntervencionFiltersSchema.parse(req.query);
    
    const result = await intervencionService.listByTicket(
      numero,
      filters,
      req.user!.id,
      req.user!.roles
    );
    
    res.json(result);
  })
);

// GET /intervenciones/:id - Detalle de intervención
router.get('/intervenciones/:id',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const intervencion = await intervencionService.getById(
      id,
      req.user!.id,
      req.user!.roles
    );
    
    res.json(intervencion);
  })
);

// POST /tickets/:numero/intervenciones - Crear intervención
router.post('/tickets/:numero/intervenciones',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { numero } = req.params;
    const data = CreateIntervencionSchema.parse(req.body);
    
    const intervencion = await intervencionService.create(
      numero,
      data,
      req.user!.id,
      req.user!.roles
    );
    
    res.status(201).json(intervencion);
  })
);

// PUT /intervenciones/:id - Editar intervención
router.put('/intervenciones/:id',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = UpdateIntervencionSchema.parse(req.body);
    
    const intervencion = await intervencionService.update(
      id,
      data,
      req.user!.id,
      req.user!.roles
    );
    
    res.json(intervencion);
  })
);

// DELETE /intervenciones/:id - Borrar intervención
router.delete('/intervenciones/:id',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await intervencionService.delete(
      id,
      req.user!.id,
      req.user!.roles
    );
    
    res.status(204).send();
  })
);

// POST /intervenciones/:id/materiales - Agregar materiales
router.post('/intervenciones/:id/materiales',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Validar si es un array o un objeto single
    let materiales;
    if (Array.isArray(req.body)) {
      materiales = CreateMaterialesSchema.parse(req.body);
    } else {
      const material = CreateMaterialSchema.parse(req.body);
      materiales = [material];
    }
    
    const intervencion = await intervencionService.addMateriales(
      id,
      materiales,
      req.user!.id,
      req.user!.roles
    );
    
    res.json(intervencion);
  })
);

// PUT /intervenciones/:id/materiales/:materialId - Editar material
router.put('/intervenciones/:id/materiales/:materialId',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, materialId } = req.params;
    const data = UpdateMaterialSchema.parse(req.body);
    
    const intervencion = await intervencionService.updateMaterial(
      id,
      materialId,
      data,
      req.user!.id,
      req.user!.roles
    );
    
    res.json(intervencion);
  })
);

// DELETE /intervenciones/:id/materiales/:materialId - Eliminar material
router.delete('/intervenciones/:id/materiales/:materialId',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, materialId } = req.params;
    
    const intervencion = await intervencionService.deleteMaterial(
      id,
      materialId,
      req.user!.id,
      req.user!.roles
    );
    
    res.json(intervencion);
  })
);

// POST /intervenciones/:id/adjuntos - Subir adjuntos
router.post('/intervenciones/:id/adjuntos',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  upload.array('files', 5),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron archivos' });
    }
    
    // Obtener adjuntos actuales
    const intervencion = await intervencionService.getById(
      id,
      req.user!.id,
      req.user!.roles
    );
    
    const currentFiles = intervencion.adjuntosJson?.files || [];
    
    // Agregar nuevos archivos
    const newFiles = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`, // En producción sería S3 URL
      size: file.size,
      contentType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user!.id
    }));
    
    const adjuntosJson = {
      files: [...currentFiles, ...newFiles]
    };
    
    const updated = await intervencionService.updateAdjuntos(
      id,
      adjuntosJson,
      req.user!.id,
      req.user!.roles
    );
    
    res.json({
      message: 'Archivos subidos correctamente',
      files: newFiles,
      intervencion: updated
    });
  })
);

// DELETE /intervenciones/:id/adjuntos/:fileId - Eliminar adjunto
router.delete('/intervenciones/:id/adjuntos/:fileId',
  requireAuth,
  requireRole(['ADMIN', 'TECNICO', 'GESTOR']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, fileId } = req.params;
    
    // Obtener intervención actual
    const intervencion = await intervencionService.getById(
      id,
      req.user!.id,
      req.user!.roles
    );
    
    const currentFiles = intervencion.adjuntosJson?.files || [];
    const fileToDelete = currentFiles.find((f: any) => f.id === fileId);
    
    if (!fileToDelete) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Eliminar archivo físico
    const filePath = path.join('uploads', fileToDelete.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error eliminando archivo físico:', error);
    }
    
    // Actualizar JSON sin el archivo eliminado
    const adjuntosJson = {
      files: currentFiles.filter((f: any) => f.id !== fileId)
    };
    
    const updated = await intervencionService.updateAdjuntos(
      id,
      adjuntosJson,
      req.user!.id,
      req.user!.roles
    );
    
    res.json({
      message: 'Archivo eliminado correctamente',
      intervencion: updated
    });
  })
);

// Middleware de manejo de errores
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error en intervenciones:', error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: error.errors
    });
  }
  
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message
    });
  }
  
  res.status(500).json({
    error: 'Error interno del servidor'
  });
});

export default router;