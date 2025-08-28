/**
 * Utilidades TypeScript puras para el módulo de intervenciones
 * Estas funciones son puras (sin efectos secundarios) y completamente testeables
 */

// Tipos para mayor seguridad de tipos
export type EstadoTarea = 'Pendiente' | 'EnCurso' | 'Finalizada' | 'Cancelada';

export interface TransicionEstado {
  actual: EstadoTarea;
  nuevo: EstadoTarea;
}

export interface ValidacionTransicion {
  valida: boolean;
  requiereFechaInicio?: boolean;
  requiereFechaFin?: boolean;
  error?: string;
}

export interface ArchivoAdjunto {
  id: string;
  name: string;
  url: string;
  size: number;
  contentType: string;
}

export interface AdjuntosJson {
  files: ArchivoAdjunto[];
}

/**
 * Calcula el importe total de un material aplicando descuento
 * @param unidades - Cantidad de unidades (puede ser decimal)
 * @param precio - Precio unitario
 * @param descuentoPct - Descuento en porcentaje (0-100)
 * @returns Importe total redondeado a 2 decimales
 */
export function calcImporteTotal(
  unidades: number, 
  precio: number, 
  descuentoPct: number = 0
): number {
  // Validar que sean números válidos PRIMERO
  if (!Number.isFinite(unidades) || !Number.isFinite(precio) || !Number.isFinite(descuentoPct)) {
    throw new Error('Los valores deben ser números finitos válidos');
  }
  
  // Validaciones de entrada
  if (unidades < 0) {
    throw new Error('Las unidades no pueden ser negativas');
  }
  
  if (precio < 0) {
    throw new Error('El precio no puede ser negativo');
  }
  
  if (descuentoPct < 0 || descuentoPct > 100) {
    throw new Error('El descuento debe estar entre 0 y 100');
  }
  
  // Cálculo del subtotal
  const subtotal = unidades * precio;
  
  // Aplicar descuento
  const descuentoDecimal = descuentoPct / 100;
  const importeConDescuento = subtotal * (1 - descuentoDecimal);
  
  // Redondear a 2 decimales usando el método más preciso
  return Math.round((importeConDescuento + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula la duración en minutos entre dos fechas
 * @param inicio - Fecha de inicio
 * @param fin - Fecha de fin
 * @returns Duración en minutos (siempre >= 0)
 */
export function calcDuracionMinutos(inicio: Date, fin: Date): number {
  // Validaciones de entrada
  if (!(inicio instanceof Date) || !(fin instanceof Date)) {
    throw new Error('Los parámetros deben ser objetos Date válidos');
  }
  
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new Error('Las fechas proporcionadas no son válidas');
  }
  
  if (fin < inicio) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
  }
  
  // Calcular diferencia en milisegundos y convertir a minutos
  const diferenciaMs = fin.getTime() - inicio.getTime();
  const minutos = Math.floor(diferenciaMs / (1000 * 60));
  
  return Math.max(0, minutos); // Asegurar que nunca sea negativo
}

/**
 * Valida si una transición de estado es válida y qué requisitos tiene
 * @param actual - Estado actual
 * @param nuevo - Estado al que se quiere transicionar
 * @returns Objeto con información de validación
 */
export function validarEstadoTransicion(
  actual: EstadoTarea, 
  nuevo: EstadoTarea
): ValidacionTransicion {
  // Si es el mismo estado, siempre es válido
  if (actual === nuevo) {
    return { valida: true };
  }
  
  // Matriz de transiciones válidas
  const transicionesValidas: Record<EstadoTarea, EstadoTarea[]> = {
    'Pendiente': ['EnCurso', 'Cancelada', 'Finalizada'],
    'EnCurso': ['Finalizada', 'Pendiente', 'Cancelada'],
    'Finalizada': [], // No se puede cambiar desde finalizada
    'Cancelada': ['Pendiente'] // Solo se puede reactivar
  };
  
  const estadosPermitidos = transicionesValidas[actual];
  
  if (!estadosPermitidos.includes(nuevo)) {
    return {
      valida: false,
      error: `No se puede cambiar de "${actual}" a "${nuevo}"`
    };
  }
  
  // Reglas especiales para estado "Finalizada"
  if (nuevo === 'Finalizada') {
    return {
      valida: true,
      requiereFechaInicio: true,
      requiereFechaFin: true
    };
  }
  
  // Reglas especiales para estado "EnCurso"
  if (nuevo === 'EnCurso') {
    return {
      valida: true,
      requiereFechaInicio: true
    };
  }
  
  return { valida: true };
}

/**
 * Normaliza un array de archivos a formato JSON estándar
 * @param files - Array de archivos (puede ser File[] del navegador o información de archivos)
 * @returns Objeto JSON normalizado con información de archivos
 */
export function normalizarAdjuntos(files: any[]): AdjuntosJson {
  // Validar entrada
  if (!Array.isArray(files)) {
    throw new Error('El parámetro files debe ser un array');
  }
  
  if (files.length === 0) {
    return { files: [] };
  }
  
  const archivosNormalizados: ArchivoAdjunto[] = files.map((file, index) => {
    // Si es un objeto File del navegador (debe ser instancia real de File)
    if (file instanceof File) {
      return {
        id: generateFileId(file.name, index),
        name: file.name,
        url: generateFileUrl(file.name),
        size: file.size,
        contentType: file.type || inferContentType(file.name)
      };
    }
    
    // Si es un objeto simple con propiedades de archivo (simulado File o estructura personalizada)
    if (file && typeof file === 'object') {
      const fileName = file.name || `archivo-${index}`;
      return {
        id: file.id !== undefined ? file.id : generateFileId(fileName, index),
        name: fileName,
        url: file.url !== undefined ? file.url : generateFileUrl(fileName),
        size: typeof file.size === 'number' ? file.size : 0,
        contentType: file.contentType || file.type || inferContentType(fileName)
      };
    }
    
    // Fallback para tipos no reconocidos
    throw new Error(`Formato de archivo no reconocido en índice ${index}`);
  });
  
  return { files: archivosNormalizados };
}

/**
 * Genera un ID único para un archivo basado en su nombre e índice
 */
function generateFileId(fileName: string, index: number): string {
  const timestamp = Date.now();
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `file-${timestamp}-${index}-${cleanName}`;
}

/**
 * Genera una URL para un archivo (placeholder)
 */
function generateFileUrl(fileName: string): string {
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `/uploads/adjuntos/${cleanName}`;
}

/**
 * Infiere el tipo de contenido basado en la extensión del archivo
 */
function inferContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}