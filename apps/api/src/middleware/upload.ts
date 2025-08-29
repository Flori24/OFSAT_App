/**
 * Enhanced upload middleware with S3/MinIO integration and security
 */

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storageService';
import { auditService } from '../services/auditService';

// Memory storage for processing files before S3 upload
const storage = multer.memoryStorage();

// Enhanced file filter with security checks
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file extension first (basic check)
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.log', '.zip'];
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  
  if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
    return cb(new Error(`File type not allowed: ${fileExtension}. Allowed: ${allowedExtensions.join(', ')}`));
  }

  // Additional MIME type check (can be spoofed but adds a layer)
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`MIME type not allowed: ${file.mimetype}`));
  }

  // Check for suspicious filenames
  if (/[<>:"|?*\x00-\x1f]/.test(file.originalname)) {
    return cb(new Error('Invalid characters in filename'));
  }

  cb(null, true);
};

// Multer configuration with enhanced security
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB máximo (as requested)
    files: 10, // máximo 10 archivos por upload
    fieldNameSize: 100, // limit field name size
    fieldSize: 1024 * 1024, // 1MB limit for field values
    parts: 20, // limit number of parts
  }
});

/**
 * Middleware to handle file uploads with S3/MinIO integration
 */
export const handleFileUpload = (fieldName: string = 'adjuntos') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.array(fieldName, 10);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        const context = auditService.getContextFromRequest(req);
        
        // Log security event for rejected file
        await auditService.logSecurityEvent('FILE_REJECTED', {
          error: err.message,
          fieldName,
          files: req.files ? (req.files as Express.Multer.File[]).map(f => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size
          })) : [],
        }, context);

        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              error: 'File too large. Maximum size is 20MB', 
              code: 'FILE_TOO_LARGE' 
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
              error: 'Too many files. Maximum is 10 files', 
              code: 'TOO_MANY_FILES' 
            });
          }
        }
        
        return res.status(400).json({ 
          error: err.message, 
          code: 'UPLOAD_ERROR' 
        });
      }
      
      // Process uploaded files with S3/MinIO
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
            // Upload to S3/MinIO with security validation
            const uploadResult = await storageService.uploadFile(
              file.buffer, 
              file.originalname,
              'adjuntos'
            );

            // Log successful file upload
            const context = auditService.getContextFromRequest(req);
            await auditService.logFileUpload(
              'Intervencion',
              req.params.id || req.params.numeroTicket || 'unknown',
              'adjunto',
              file.originalname,
              file.size,
              context
            );

            return uploadResult;
          });

          const uploadResults = await Promise.all(uploadPromises);
          
          // Attach upload results to request for use in route handlers
          (req as any).uploadResults = uploadResults;
          
          next();
        } catch (error) {
          const context = auditService.getContextFromRequest(req);
          await auditService.logSecurityEvent('FILE_REJECTED', {
            error: error instanceof Error ? error.message : 'Upload failed',
            fieldName,
          }, context);

          return res.status(400).json({ 
            error: error instanceof Error ? error.message : 'Upload failed', 
            code: 'UPLOAD_PROCESSING_ERROR' 
          });
        }
      } else {
        next();
      }
    });
  };
};

/**
 * Middleware specifically for signature uploads
 */
export const handleSignatureUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signatureData } = req.body;
    
    if (!signatureData) {
      return res.status(400).json({ 
        error: 'Signature data is required', 
        code: 'MISSING_SIGNATURE' 
      });
    }

    // Validate data URL format
    if (!signatureData.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ 
        error: 'Invalid signature format. Must be PNG data URL', 
        code: 'INVALID_SIGNATURE_FORMAT' 
      });
    }

    const intervencionId = req.params.id;
    if (!intervencionId) {
      return res.status(400).json({ 
        error: 'Intervention ID is required', 
        code: 'MISSING_INTERVENTION_ID' 
      });
    }

    // Upload signature to S3/MinIO
    const uploadResult = await storageService.uploadSignature(signatureData, intervencionId);
    
    // Log signature upload
    const context = auditService.getContextFromRequest(req);
    await auditService.logFileUpload(
      'Intervencion',
      intervencionId,
      'firma',
      uploadResult.originalName,
      uploadResult.size,
      context
    );

    // Attach result to request
    (req as any).signatureUploadResult = uploadResult;
    
    next();
  } catch (error) {
    const context = auditService.getContextFromRequest(req);
    await auditService.logSecurityEvent('FILE_REJECTED', {
      error: error instanceof Error ? error.message : 'Signature upload failed',
      type: 'signature',
    }, context);

    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Signature upload failed', 
      code: 'SIGNATURE_UPLOAD_ERROR' 
    });
  }
};

// Legacy export for backwards compatibility
export { upload };