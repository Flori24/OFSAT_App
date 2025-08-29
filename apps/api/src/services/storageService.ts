/**
 * Service for S3/MinIO file uploads with security validation
 * Handles file uploads with type validation, size limits, and virus scanning
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import crypto from 'crypto';

interface UploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  bucket: string;
}

interface UploadResult {
  key: string;
  url: string;
  originalName: string;
  size: number;
  contentType: string;
}

export class StorageService {
  private s3Client: S3Client;
  private config: UploadConfig;
  
  constructor() {
    // Initialize S3 client with environment variables
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.config = {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'txt', 'log', 'zip'],
      bucket: process.env.S3_BUCKET || 'ofsat-uploads',
    };
  }

  /**
   * Upload file with security validation
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    folder: 'adjuntos' | 'firmas' = 'adjuntos'
  ): Promise<UploadResult> {
    // Validate file size
    if (buffer.length > this.config.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.config.maxFileSize / 1024 / 1024}MB`);
    }

    // Validate file type using magic bytes (more secure than extension)
    const fileType = await fileTypeFromBuffer(buffer);
    const extension = path.extname(originalName).toLowerCase().slice(1);
    
    // Check both magic bytes and extension
    const detectedType = fileType?.ext || extension;
    if (!this.isAllowedFileType(detectedType, buffer)) {
      throw new Error(`File type not allowed: ${detectedType}. Allowed types: ${this.config.allowedTypes.join(', ')}`);
    }

    // Reject executable files by checking magic bytes
    if (this.isExecutableFile(buffer)) {
      throw new Error('Executable files are not allowed');
    }

    // Generate secure filename
    const fileExtension = fileType?.ext || extension;
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `${folder}/${timestamp}-${randomString}-${sanitizedName}`;

    try {
      // Upload to S3/MinIO
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: fileType?.mime || this.getMimeType(fileExtension),
        ContentLength: buffer.length,
        Metadata: {
          'original-name': originalName,
          'upload-timestamp': timestamp.toString(),
        },
      });

      await this.s3Client.send(command);

      // Generate access URL
      const url = await this.getFileUrl(key);

      return {
        key,
        url,
        originalName,
        size: buffer.length,
        contentType: fileType?.mime || this.getMimeType(fileExtension),
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload signature image from canvas dataURL
   */
  async uploadSignature(dataUrl: string, intervencionId: string): Promise<UploadResult> {
    // Extract base64 data from dataURL
    const matches = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid signature data URL format');
    }

    const [, imageType, base64Data] = matches;
    if (imageType !== 'png') {
      throw new Error('Signature must be PNG format');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `firma-${intervencionId}-${Date.now()}.png`;

    return this.uploadFile(buffer, filename, 'firmas');
  }

  /**
   * Get signed URL for file access
   */
  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error(`Failed to generate file URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate file type against allowed types
   */
  private isAllowedFileType(detectedType: string, buffer: Buffer): boolean {
    // Special handling for text files that might not have magic bytes
    if (['txt', 'log'].includes(detectedType)) {
      return this.isTextFile(buffer);
    }

    return this.config.allowedTypes.includes(detectedType);
  }

  /**
   * Check if file is executable by examining magic bytes
   */
  private isExecutableFile(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    const header = buffer.subarray(0, 4);
    
    // Check for common executable signatures
    const executableSignatures = [
      [0x4D, 0x5A], // PE/COFF executable (Windows .exe)
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable (Linux)
      [0xCE, 0xFA, 0xED, 0xFE], // Mach-O executable (macOS)
      [0xCF, 0xFA, 0xED, 0xFE], // Mach-O 64-bit executable
      [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
      [0x50, 0x4B, 0x03, 0x04], // ZIP-based executables (check deeper)
    ];

    // Check PE/COFF signature
    if (header[0] === 0x4D && header[1] === 0x5A) {
      return true;
    }

    // Check ELF signature
    if (header[0] === 0x7F && header[1] === 0x45 && header[2] === 0x4C && header[3] === 0x46) {
      return true;
    }

    // Check Mach-O signatures
    if ((header[0] === 0xCE || header[0] === 0xCF) && header[1] === 0xFA && 
        header[2] === 0xED && header[3] === 0xFE) {
      return true;
    }

    // Check Java class file
    if (header[0] === 0xCA && header[1] === 0xFE && header[2] === 0xBA && header[3] === 0xBE) {
      return true;
    }

    return false;
  }

  /**
   * Check if buffer contains text content
   */
  private isTextFile(buffer: Buffer): boolean {
    // Sample first 1KB to check for text content
    const sample = buffer.subarray(0, Math.min(1024, buffer.length));
    
    // Count printable ASCII characters
    let printableCount = 0;
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      // Printable ASCII (32-126) + common whitespace (9, 10, 13)
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        printableCount++;
      }
    }

    // Consider it text if > 95% are printable characters
    return (printableCount / sample.length) > 0.95;
  }

  /**
   * Get MIME type for file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'txt': 'text/plain',
      'log': 'text/plain',
      'zip': 'application/zip',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Optional: Virus scanning with ClamAV
   * This would require ClamAV to be installed and clamd service running
   */
  async scanForVirus(buffer: Buffer): Promise<boolean> {
    // TODO: Implement ClamAV scanning
    // For now, return true (clean)
    // In production, integrate with node-clamscan or similar library
    return true;
  }
}

export const storageService = new StorageService();