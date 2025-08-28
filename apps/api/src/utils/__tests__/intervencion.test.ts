import {
  calcImporteTotal,
  calcDuracionMinutos,
  validarEstadoTransicion,
  normalizarAdjuntos,
  type EstadoTarea,
  type AdjuntosJson
} from '../intervencion';

describe('Utilidades de Intervención', () => {
  
  describe('calcImporteTotal', () => {
    // Casos básicos
    it('should calculate total without discount', () => {
      expect(calcImporteTotal(5, 10.50, 0)).toBe(52.50);
      expect(calcImporteTotal(1, 25.99)).toBe(25.99); // descuento omitido, por defecto 0
    });
    
    it('should calculate total with discount', () => {
      expect(calcImporteTotal(2, 100, 20)).toBe(160.00); // 2 * 100 * 0.8 = 160
      expect(calcImporteTotal(3, 50, 10)).toBe(135.00); // 3 * 50 * 0.9 = 135
    });
    
    // Casos con decimales
    it('should handle decimal units correctly', () => {
      expect(calcImporteTotal(2.5, 10, 0)).toBe(25.00);
      expect(calcImporteTotal(1.33, 15.75, 0)).toBe(20.95); // 1.33 * 15.75 = 20.9475 -> 20.95
    });
    
    it('should handle decimal prices with proper rounding', () => {
      expect(calcImporteTotal(3, 9.99, 15)).toBe(25.47); // 3 * 9.99 * 0.85 = 25.4715 -> 25.47
      expect(calcImporteTotal(7, 1.234, 0)).toBe(8.64); // 7 * 1.234 = 8.638 -> 8.64
    });
    
    // Casos borde con descuentos
    it('should handle 0% discount', () => {
      expect(calcImporteTotal(5, 20, 0)).toBe(100.00);
    });
    
    it('should handle 100% discount', () => {
      expect(calcImporteTotal(5, 20, 100)).toBe(0.00);
      expect(calcImporteTotal(10, 999.99, 100)).toBe(0.00);
    });
    
    it('should handle 50% discount', () => {
      expect(calcImporteTotal(4, 25, 50)).toBe(50.00);
    });
    
    // Casos con valores cero
    it('should handle zero units', () => {
      expect(calcImporteTotal(0, 100, 0)).toBe(0.00);
      expect(calcImporteTotal(0, 100, 50)).toBe(0.00);
    });
    
    it('should handle zero price', () => {
      expect(calcImporteTotal(10, 0, 0)).toBe(0.00);
      expect(calcImporteTotal(10, 0, 25)).toBe(0.00);
    });
    
    // Casos de error - valores negativos
    it('should throw error for negative units', () => {
      expect(() => calcImporteTotal(-1, 10, 0)).toThrow('Las unidades no pueden ser negativas');
      expect(() => calcImporteTotal(-0.5, 10, 0)).toThrow('Las unidades no pueden ser negativas');
    });
    
    it('should throw error for negative price', () => {
      expect(() => calcImporteTotal(5, -10, 0)).toThrow('El precio no puede ser negativo');
    });
    
    it('should throw error for invalid discount percentage', () => {
      expect(() => calcImporteTotal(5, 10, -1)).toThrow('El descuento debe estar entre 0 y 100');
      expect(() => calcImporteTotal(5, 10, 101)).toThrow('El descuento debe estar entre 0 y 100');
      expect(() => calcImporteTotal(5, 10, 150)).toThrow('El descuento debe estar entre 0 y 100');
    });
    
    // Casos de error - valores no finitos
    it('should throw error for non-finite values', () => {
      expect(() => calcImporteTotal(Infinity, 10, 0)).toThrow('Los valores deben ser números finitos válidos');
      expect(() => calcImporteTotal(5, NaN, 0)).toThrow('Los valores deben ser números finitos válidos');
      expect(() => calcImporteTotal(5, 10, Infinity)).toThrow('Los valores deben ser números finitos válidos');
    });
    
    // Pruebas de precisión decimal
    it('should handle floating point precision correctly', () => {
      // Caso problemático típico de JavaScript: 0.1 + 0.2 = 0.30000000000000004
      expect(calcImporteTotal(0.1, 0.2, 0)).toBe(0.02);
      expect(calcImporteTotal(0.3, 0.1, 0)).toBe(0.03);
    });
  });
  
  describe('calcDuracionMinutos', () => {
    // Casos básicos
    it('should calculate duration correctly', () => {
      const inicio = new Date('2024-01-01T10:00:00Z');
      const fin = new Date('2024-01-01T10:30:00Z');
      expect(calcDuracionMinutos(inicio, fin)).toBe(30);
    });
    
    it('should calculate duration for same time', () => {
      const fecha = new Date('2024-01-01T10:00:00Z');
      expect(calcDuracionMinutos(fecha, fecha)).toBe(0);
    });
    
    it('should calculate duration across hours', () => {
      const inicio = new Date('2024-01-01T10:30:00Z');
      const fin = new Date('2024-01-01T12:15:00Z');
      expect(calcDuracionMinutos(inicio, fin)).toBe(105); // 1h 45min
    });
    
    it('should calculate duration across days', () => {
      const inicio = new Date('2024-01-01T23:30:00Z');
      const fin = new Date('2024-01-02T01:15:00Z');
      expect(calcDuracionMinutos(inicio, fin)).toBe(105); // 1h 45min
    });
    
    it('should handle seconds precision (floor to minutes)', () => {
      const inicio = new Date('2024-01-01T10:00:00Z');
      const fin = new Date('2024-01-01T10:00:59Z'); // 59 segundos
      expect(calcDuracionMinutos(inicio, fin)).toBe(0); // Se redondea hacia abajo
      
      const fin2 = new Date('2024-01-01T10:01:30Z'); // 1 minuto 30 segundos
      expect(calcDuracionMinutos(inicio, fin2)).toBe(1); // Se redondea hacia abajo
    });
    
    // Casos de error - fin antes que inicio
    it('should throw error when fin < inicio', () => {
      const inicio = new Date('2024-01-01T10:30:00Z');
      const fin = new Date('2024-01-01T10:00:00Z');
      expect(() => calcDuracionMinutos(inicio, fin))
        .toThrow('La fecha de fin no puede ser anterior a la fecha de inicio');
    });
    
    // Casos de error - fechas inválidas
    it('should throw error for invalid Date objects', () => {
      const fechaValida = new Date('2024-01-01T10:00:00Z');
      const fechaInvalida = new Date('invalid-date');
      
      expect(() => calcDuracionMinutos(fechaInvalida, fechaValida))
        .toThrow('Las fechas proporcionadas no son válidas');
      expect(() => calcDuracionMinutos(fechaValida, fechaInvalida))
        .toThrow('Las fechas proporcionadas no son válidas');
    });
    
    it('should throw error for non-Date parameters', () => {
      const fecha = new Date('2024-01-01T10:00:00Z');
      
      expect(() => calcDuracionMinutos('2024-01-01' as any, fecha))
        .toThrow('Los parámetros deben ser objetos Date válidos');
      expect(() => calcDuracionMinutos(fecha, null as any))
        .toThrow('Los parámetros deben ser objetos Date válidos');
      expect(() => calcDuracionMinutos(undefined as any, fecha))
        .toThrow('Los parámetros deben ser objetos Date válidos');
    });
    
    // Casos extremos de duración
    it('should handle very long durations', () => {
      const inicio = new Date('2024-01-01T00:00:00Z');
      const fin = new Date('2024-01-02T00:00:00Z'); // 24 horas
      expect(calcDuracionMinutos(inicio, fin)).toBe(1440); // 24 * 60
    });
  });
  
  describe('validarEstadoTransicion', () => {
    // Casos válidos básicos
    it('should allow valid transitions from Pendiente', () => {
      expect(validarEstadoTransicion('Pendiente', 'EnCurso')).toEqual({
        valida: true,
        requiereFechaInicio: true
      });
      
      expect(validarEstadoTransicion('Pendiente', 'Cancelada')).toEqual({
        valida: true
      });
      
      expect(validarEstadoTransicion('Pendiente', 'Finalizada')).toEqual({
        valida: true,
        requiereFechaInicio: true,
        requiereFechaFin: true
      });
    });
    
    it('should allow valid transitions from EnCurso', () => {
      expect(validarEstadoTransicion('EnCurso', 'Finalizada')).toEqual({
        valida: true,
        requiereFechaInicio: true,
        requiereFechaFin: true
      });
      
      expect(validarEstadoTransicion('EnCurso', 'Pendiente')).toEqual({
        valida: true
      });
      
      expect(validarEstadoTransicion('EnCurso', 'Cancelada')).toEqual({
        valida: true
      });
    });
    
    it('should handle transitions from Cancelada', () => {
      expect(validarEstadoTransicion('Cancelada', 'Pendiente')).toEqual({
        valida: true
      });
    });
    
    it('should allow same state transition', () => {
      expect(validarEstadoTransicion('Pendiente', 'Pendiente')).toEqual({
        valida: true
      });
      
      expect(validarEstadoTransicion('Finalizada', 'Finalizada')).toEqual({
        valida: true
      });
    });
    
    // Casos inválidos
    it('should reject transitions from Finalizada to other states', () => {
      expect(validarEstadoTransicion('Finalizada', 'Pendiente')).toEqual({
        valida: false,
        error: 'No se puede cambiar de "Finalizada" a "Pendiente"'
      });
      
      expect(validarEstadoTransicion('Finalizada', 'EnCurso')).toEqual({
        valida: false,
        error: 'No se puede cambiar de "Finalizada" a "EnCurso"'
      });
      
      expect(validarEstadoTransicion('Finalizada', 'Cancelada')).toEqual({
        valida: false,
        error: 'No se puede cambiar de "Finalizada" a "Cancelada"'
      });
    });
    
    it('should reject invalid transitions from Cancelada', () => {
      expect(validarEstadoTransicion('Cancelada', 'EnCurso')).toEqual({
        valida: false,
        error: 'No se puede cambiar de "Cancelada" a "EnCurso"'
      });
      
      expect(validarEstadoTransicion('Cancelada', 'Finalizada')).toEqual({
        valida: false,
        error: 'No se puede cambiar de "Cancelada" a "Finalizada"'
      });
    });
    
    // Casos especiales con requisitos
    it('should require dates for Finalizada state', () => {
      const resultado = validarEstadoTransicion('EnCurso', 'Finalizada');
      expect(resultado.valida).toBe(true);
      expect(resultado.requiereFechaInicio).toBe(true);
      expect(resultado.requiereFechaFin).toBe(true);
    });
    
    it('should require start date for EnCurso state', () => {
      const resultado = validarEstadoTransicion('Pendiente', 'EnCurso');
      expect(resultado.valida).toBe(true);
      expect(resultado.requiereFechaInicio).toBe(true);
      expect(resultado.requiereFechaFin).toBeUndefined();
    });
  });
  
  describe('normalizarAdjuntos', () => {
    // Casos básicos
    it('should handle empty array', () => {
      const result = normalizarAdjuntos([]);
      expect(result).toEqual({ files: [] });
    });
    
    it('should normalize File objects from browser', () => {
      const mockFiles = [
        {
          name: 'documento.pdf',
          size: 1024,
          type: 'application/pdf'
        },
        {
          name: 'imagen.jpg',
          size: 2048,
          type: 'image/jpeg'
        }
      ];
      
      const result = normalizarAdjuntos(mockFiles);
      
      expect(result.files).toHaveLength(2);
      expect(result.files[0]).toMatchObject({
        name: 'documento.pdf',
        size: 1024,
        contentType: 'application/pdf',
        url: '/uploads/adjuntos/documento.pdf'
      });
      expect(result.files[0].id).toMatch(/^file-\d+-0-documento\.pdf$/);
      
      expect(result.files[1]).toMatchObject({
        name: 'imagen.jpg',
        size: 2048,
        contentType: 'image/jpeg'
      });
    });
    
    it('should normalize objects with existing structure', () => {
      const mockFiles = [
        {
          id: 'existing-id-1',
          name: 'archivo.doc',
          url: '/custom/path/archivo.doc',
          size: 512,
          contentType: 'application/msword'
        }
      ];
      
      const result = normalizarAdjuntos(mockFiles);
      
      expect(result.files[0]).toEqual({
        id: 'existing-id-1',
        name: 'archivo.doc',
        url: '/custom/path/archivo.doc',
        size: 512,
        contentType: 'application/msword'
      });
    });
    
    it('should infer content type from file extension', () => {
      const mockFiles = [
        { name: 'documento.pdf', size: 1024 },
        { name: 'spreadsheet.xlsx', size: 2048 },
        { name: 'image.png', size: 512 },
        { name: 'unknown.xyz', size: 256 }
      ];
      
      const result = normalizarAdjuntos(mockFiles);
      
      expect(result.files[0].contentType).toBe('application/pdf');
      expect(result.files[1].contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.files[2].contentType).toBe('image/png');
      expect(result.files[3].contentType).toBe('application/octet-stream'); // fallback
    });
    
    it('should handle files without extension', () => {
      const mockFiles = [
        { name: 'README', size: 128 },
        { name: 'config', size: 64 }
      ];
      
      const result = normalizarAdjuntos(mockFiles);
      
      expect(result.files[0].contentType).toBe('application/octet-stream');
      expect(result.files[1].contentType).toBe('application/octet-stream');
    });
    
    it('should handle partial object data with fallbacks', () => {
      const mockFiles = [
        { name: 'partial.txt' }, // sin size
        { size: 1024 }, // sin name
        {} // objeto vacío
      ];
      
      const result = normalizarAdjuntos(mockFiles);
      
      expect(result.files).toHaveLength(3);
      
      // Archivo parcial con nombre pero sin size
      expect(result.files[0]).toMatchObject({
        name: 'partial.txt',
        size: 0,
        contentType: 'text/plain'
      });
      
      // Archivo sin nombre pero con size
      expect(result.files[1]).toMatchObject({
        name: 'archivo-1',
        size: 1024,
        url: '/uploads/adjuntos/archivo-1'
      });
      
      // Objeto vacío
      expect(result.files[2]).toMatchObject({
        name: 'archivo-2',
        size: 0
      });
    });
    
    it('should generate unique IDs for each file', () => {
      const mockFiles = [
        { name: 'file1.txt', size: 100 },
        { name: 'file2.txt', size: 200 },
        { name: 'file1.txt', size: 300 } // nombre duplicado
      ];
      
      const result = normalizarAdjuntos(mockFiles);
      
      const ids = result.files.map(f => f.id);
      expect(new Set(ids).size).toBe(3); // Todos los IDs deben ser únicos
      
      // Verificar formato de ID
      ids.forEach(id => {
        expect(id).toMatch(/^file-\d+-\d+-/);
      });
    });
    
    it('should sanitize file names in URLs and IDs', () => {
      const mockFiles = [
        { name: 'archivo con espacios.pdf', size: 1024 },
        { name: 'archivo@#$%&*().doc', size: 512 },
        { name: 'archivo_normal.txt', size: 256 }
      ];
      
      const result = normalizarAdjuntos(mockFiles);
      
      expect(result.files[0].url).toBe('/uploads/adjuntos/archivo-con-espacios.pdf');
      expect(result.files[0].id).toMatch(/file-\d+-0-archivo-con-espacios\.pdf$/);
      
      expect(result.files[1].url).toBe('/uploads/adjuntos/archivo--------.doc');
      expect(result.files[1].id).toMatch(/file-\d+-1-archivo--------\.doc$/);
      
      expect(result.files[2].url).toBe('/uploads/adjuntos/archivo_normal.txt');
    });
    
    // Casos de error
    it('should throw error for non-array input', () => {
      expect(() => normalizarAdjuntos('not-an-array' as any))
        .toThrow('El parámetro files debe ser un array');
      
      expect(() => normalizarAdjuntos(null as any))
        .toThrow('El parámetro files debe ser un array');
      
      expect(() => normalizarAdjuntos(undefined as any))
        .toThrow('El parámetro files debe ser un array');
    });
    
    it('should throw error for unrecognizable file format', () => {
      const invalidFiles = [
        'string-instead-of-object',
        123,
        true
      ];
      
      expect(() => normalizarAdjuntos(invalidFiles))
        .toThrow('Formato de archivo no reconocido en índice 0');
    });
    
    // Casos borde con muchos archivos
    it('should handle large number of files', () => {
      const manyFiles = Array.from({ length: 100 }, (_, i) => ({
        name: `file${i}.txt`,
        size: i * 10
      }));
      
      const result = normalizarAdjuntos(manyFiles);
      
      expect(result.files).toHaveLength(100);
      expect(result.files[99].name).toBe('file99.txt');
      expect(result.files[99].size).toBe(990);
    });
  });
});