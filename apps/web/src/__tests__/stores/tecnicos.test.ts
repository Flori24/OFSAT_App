import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTecnicosStore } from '@/stores/tecnicos';
import type { Tecnico, TecnicoFilters } from '@/stores/tecnicos';

// Mock API service
const mockApiService = {
  tecnicos: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    exportCsv: vi.fn(),
    importCsv: vi.fn(),
    getKpis: vi.fn(),
    getRecentInterventions: vi.fn(),
    getAuditLogs: vi.fn(),
  }
};

vi.mock('@/services/api', () => ({
  apiService: mockApiService
}));

describe('useTecnicosStore', () => {
  let store: ReturnType<typeof useTecnicosStore>;

  const mockTecnico: Tecnico = {
    id: 'tecnico-1',
    usuarioId: 'user-1',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '+376 123456',
    activo: true,
    especialidades: ['Informatica', 'ImpHW'],
    zonas: ['Andorra la Vella', 'Escaldes-Engordany'],
    tarifaHora: 45,
    capacidadDia: 480,
    color: '#007bff',
    firmaUrl: 'https://example.com/firma.png',
    notas: 'Técnico especializado en informática',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useTecnicosStore();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.items).toEqual([]);
      expect(store.total).toBe(0);
      expect(store.page).toBe(1);
      expect(store.pageSize).toBe(20);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(null);
      expect(store.filters).toEqual({});
    });

    it('should have correct getters for empty state', () => {
      expect(store.isEmpty).toBe(true);
      expect(store.hasError).toBe(false);
      expect(store.isLoading).toBe(false);
      expect(store.activeTecnicos).toEqual([]);
    });
  });

  describe('Fetch Tecnicos', () => {
    it('should fetch tecnicos successfully', async () => {
      const mockResponse = {
        data: [mockTecnico],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      };

      mockApiService.tecnicos.list.mockResolvedValue(mockResponse);

      const filters: TecnicoFilters = {
        q: 'Juan',
        activo: 'true',
        page: 1,
        pageSize: 20
      };

      await store.fetch(filters);

      expect(mockApiService.tecnicos.list).toHaveBeenCalledWith({
        q: 'Juan',
        activo: 'true',
        page: 1,
        pageSize: 20
      });

      expect(store.items).toEqual([mockTecnico]);
      expect(store.total).toBe(1);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(null);
      expect(store.isEmpty).toBe(false);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Network error');
      mockApiService.tecnicos.list.mockRejectedValue(error);

      await store.fetch();

      expect(store.items).toEqual([]);
      expect(store.total).toBe(0);
      expect(store.loading).toBe(false);
      expect(store.error).toBe('Error al cargar los técnicos');
      expect(store.hasError).toBe(true);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockApiService.tecnicos.list.mockReturnValue(promise);

      const fetchPromise = store.fetch();
      expect(store.loading).toBe(true);

      resolvePromise!({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
      await fetchPromise;

      expect(store.loading).toBe(false);
    });
  });

  describe('Get Single Tecnico', () => {
    it('should get tecnico by id', async () => {
      mockApiService.tecnicos.get.mockResolvedValue(mockTecnico);

      const result = await store.get('tecnico-1');

      expect(mockApiService.tecnicos.get).toHaveBeenCalledWith('tecnico-1');
      expect(result).toEqual(mockTecnico);
    });
  });

  describe('Create Tecnico', () => {
    it('should create new tecnico', async () => {
      const createData = {
        usuarioId: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        activo: true,
        especialidades: ['Informatica'],
        zonas: ['Andorra la Vella']
      };

      mockApiService.tecnicos.create.mockResolvedValue(mockTecnico);

      const result = await store.create(createData);

      expect(mockApiService.tecnicos.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockTecnico);
    });

    it('should add created tecnico to list if it matches filters', async () => {
      store.filters = { activo: 'true' };
      store.items = [];
      store.total = 0;

      const activeTecnico = { ...mockTecnico, activo: true };
      mockApiService.tecnicos.create.mockResolvedValue(activeTecnico);

      await store.create({
        usuarioId: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        activo: true
      });

      expect(store.items).toContain(activeTecnico);
      expect(store.total).toBe(1);
    });
  });

  describe('Update Tecnico', () => {
    it('should update existing tecnico', async () => {
      const updatedTecnico = { ...mockTecnico, nombre: 'Juan Actualizado' };
      store.items = [mockTecnico];

      mockApiService.tecnicos.update.mockResolvedValue(updatedTecnico);

      const result = await store.update('tecnico-1', { nombre: 'Juan Actualizado' });

      expect(mockApiService.tecnicos.update).toHaveBeenCalledWith('tecnico-1', {
        nombre: 'Juan Actualizado'
      });
      expect(result).toEqual(updatedTecnico);
      expect(store.items[0]).toEqual(updatedTecnico);
    });
  });

  describe('Activate/Deactivate', () => {
    it('should activate tecnico', async () => {
      const inactiveTecnico = { ...mockTecnico, activo: false };
      store.items = [inactiveTecnico];

      mockApiService.tecnicos.activate.mockResolvedValue(undefined);

      await store.activate('tecnico-1');

      expect(mockApiService.tecnicos.activate).toHaveBeenCalledWith('tecnico-1');
      expect(store.items[0].activo).toBe(true);
    });

    it('should deactivate tecnico', async () => {
      store.items = [mockTecnico];

      mockApiService.tecnicos.deactivate.mockResolvedValue(undefined);

      await store.deactivate('tecnico-1');

      expect(mockApiService.tecnicos.deactivate).toHaveBeenCalledWith('tecnico-1');
      expect(store.items[0].activo).toBe(false);
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      const inactiveTecnico = { ...mockTecnico, id: 'tecnico-2', activo: false };
      const hwTecnico = { 
        ...mockTecnico, 
        id: 'tecnico-3', 
        especialidades: ['ImpHW'], 
        zonas: ['Escaldes-Engordany'] 
      };
      
      store.items = [mockTecnico, inactiveTecnico, hwTecnico];
    });

    it('should get tecnico by id', () => {
      const found = store.getTecnicoById('tecnico-1');
      expect(found).toEqual(mockTecnico);
    });

    it('should get active tecnicos only', () => {
      const active = store.activeTecnicos;
      expect(active).toHaveLength(2);
      expect(active.every(t => t.activo)).toBe(true);
    });

    it('should get tecnicos by especialidad', () => {
      const informatica = store.tecnicosByEspecialidad('Informatica');
      expect(informatica).toHaveLength(1);
      expect(informatica[0].id).toBe('tecnico-1');

      const hardware = store.tecnicosByEspecialidad('ImpHW');
      expect(hardware).toHaveLength(2);
    });

    it('should get tecnicos by zona', () => {
      const andorra = store.tecnicosByZona('Andorra la Vella');
      expect(andorra).toHaveLength(1);
      expect(andorra[0].id).toBe('tecnico-1');

      const escaldes = store.tecnicosByZona('Escaldes-Engordany');
      expect(escaldes).toHaveLength(2);
    });
  });

  describe('Export/Import CSV', () => {
    it('should export CSV', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      mockApiService.tecnicos.exportCsv.mockResolvedValue(mockBlob);

      // Mock URL and DOM methods
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      
      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      await store.exportCsv({ activo: 'true' });

      expect(mockApiService.tecnicos.exportCsv).toHaveBeenCalledWith({ activo: 'true' });
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Cleanup mocks
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should import CSV', async () => {
      const mockFile = new File(['csv,data'], 'tecnicos.csv', { type: 'text/csv' });
      const importResult = { created: 2, updated: 1, errors: [] };
      
      mockApiService.tecnicos.importCsv.mockResolvedValue(importResult);
      mockApiService.tecnicos.list.mockResolvedValue({ 
        data: [], 
        total: 0, 
        page: 1, 
        pageSize: 20, 
        totalPages: 0 
      });

      const result = await store.importCsv(mockFile);

      expect(mockApiService.tecnicos.importCsv).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(importResult);
      // Should refresh the list after import
      expect(mockApiService.tecnicos.list).toHaveBeenCalled();
    });
  });

  describe('Filter Logic', () => {
    it('should correctly determine if tecnico should be included in current list', () => {
      store.filters = {
        q: 'juan',
        activo: 'true',
        especialidad: 'Informatica'
      };

      // Should match
      expect(store.shouldIncludeInCurrentList(mockTecnico)).toBe(true);

      // Should not match - wrong name
      const wrongName = { ...mockTecnico, nombre: 'Pedro García', email: 'pedro@example.com' };
      expect(store.shouldIncludeInCurrentList(wrongName)).toBe(false);

      // Should not match - inactive
      const inactive = { ...mockTecnico, activo: false };
      expect(store.shouldIncludeInCurrentList(inactive)).toBe(false);

      // Should not match - wrong especialidad
      const wrongEsp = { ...mockTecnico, especialidades: ['ImpSW'] };
      expect(store.shouldIncludeInCurrentList(wrongEsp)).toBe(false);
    });
  });
});