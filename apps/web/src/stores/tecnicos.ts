import { defineStore } from 'pinia';
import { apiService } from '@/services/api';

export interface Tecnico {
  id: string;
  usuarioId: string;
  nombre: string;
  email: string;
  telefono?: string;
  activo: boolean;
  especialidades: string[];
  zonas: string[];
  tarifaHora?: number;
  capacidadDia?: number;
  color?: string;
  firmaUrl?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TecnicoFilters {
  q?: string;
  activo?: string;
  especialidad?: string;
  zona?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTecnicoInput {
  usuarioId: string;
  nombre: string;
  email: string;
  telefono?: string;
  activo?: boolean;
  especialidades?: string[];
  zonas?: string[];
  tarifaHora?: number;
  capacidadDia?: number;
  color?: string;
  firmaUrl?: string;
  notas?: string;
}

export interface UpdateTecnicoInput extends Partial<CreateTecnicoInput> {}

export interface TecnicoKpis {
  intervencionesEsteMes: number;
  duracionMedia: number;
  tasaResolucion: number;
  ingresosMes: number;
}

interface TecnicosState {
  items: Tecnico[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  filters: TecnicoFilters;
}

export const useTecnicosStore = defineStore('tecnicos', {
  state: (): TecnicosState => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    error: null,
    filters: {}
  }),

  getters: {
    isEmpty: (state) => state.items.length === 0 && !state.loading,
    hasError: (state) => !!state.error,
    isLoading: (state) => state.loading,
    
    // Helper to get tecnico by id
    getTecnicoById: (state) => (id: string) => 
      state.items.find(tecnico => tecnico.id === id),
      
    // Get active tecnicos only
    activeTecnicos: (state) => 
      state.items.filter(tecnico => tecnico.activo),
      
    // Get tecnicos by especialidad
    tecnicosByEspecialidad: (state) => (especialidad: string) =>
      state.items.filter(tecnico => 
        tecnico.especialidades.includes(especialidad) && tecnico.activo
      ),
      
    // Get tecnicos by zona
    tecnicosByZona: (state) => (zona: string) =>
      state.items.filter(tecnico => 
        tecnico.zonas.includes(zona) && tecnico.activo
      )
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setFilters(filters: TecnicoFilters) {
      this.filters = { ...this.filters, ...filters };
    },

    /**
     * Fetch tecnicos with filters and pagination
     */
    async fetch(filters: TecnicoFilters = {}) {
      this.setLoading(true);
      this.setError(null);
      
      // Update filters and pagination
      this.setFilters(filters);
      this.page = filters.page || 1;
      this.pageSize = filters.pageSize || 20;

      try {
        const response = await apiService.tecnicos.list({
          ...this.filters,
          page: this.page,
          pageSize: this.pageSize
        });
        
        this.items = response.data;
        this.total = response.total;
      } catch (error: any) {
        console.error('Error fetching tecnicos:', error);
        this.setError(
          error.response?.data?.error || 
          'Error al cargar los técnicos'
        );
        this.items = [];
        this.total = 0;
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Get single tecnico by ID
     */
    async get(id: string): Promise<Tecnico> {
      try {
        return await apiService.tecnicos.get(id);
      } catch (error: any) {
        console.error('Error fetching tecnico:', error);
        throw error;
      }
    },

    /**
     * Create new tecnico
     */
    async create(data: CreateTecnicoInput): Promise<Tecnico> {
      this.setLoading(true);
      this.setError(null);

      try {
        const tecnico = await apiService.tecnicos.create(data);
        
        // Add to current list if it fits the filters
        if (this.shouldIncludeInCurrentList(tecnico)) {
          this.items.unshift(tecnico);
          this.total += 1;
        }
        
        return tecnico;
      } catch (error: any) {
        console.error('Error creating tecnico:', error);
        this.setError(
          error.response?.data?.error || 
          'Error al crear el técnico'
        );
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Update existing tecnico
     */
    async update(id: string, data: UpdateTecnicoInput): Promise<Tecnico> {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedTecnico = await apiService.tecnicos.update(id, data);
        
        // Update in current list
        const index = this.items.findIndex(t => t.id === id);
        if (index !== -1) {
          this.items[index] = updatedTecnico;
        }
        
        return updatedTecnico;
      } catch (error: any) {
        console.error('Error updating tecnico:', error);
        this.setError(
          error.response?.data?.error || 
          'Error al actualizar el técnico'
        );
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Activate tecnico
     */
    async activate(id: string): Promise<void> {
      try {
        await apiService.tecnicos.activate(id);
        
        // Update in current list
        const tecnico = this.items.find(t => t.id === id);
        if (tecnico) {
          tecnico.activo = true;
        }
      } catch (error: any) {
        console.error('Error activating tecnico:', error);
        this.setError(
          error.response?.data?.error || 
          'Error al activar el técnico'
        );
        throw error;
      }
    },

    /**
     * Deactivate tecnico
     */
    async deactivate(id: string): Promise<void> {
      try {
        await apiService.tecnicos.deactivate(id);
        
        // Update in current list
        const tecnico = this.items.find(t => t.id === id);
        if (tecnico) {
          tecnico.activo = false;
        }
      } catch (error: any) {
        console.error('Error deactivating tecnico:', error);
        this.setError(
          error.response?.data?.error || 
          'Error al desactivar el técnico'
        );
        throw error;
      }
    },

    /**
     * Export tecnicos to CSV
     */
    async exportCsv(): Promise<void> {
      try {
        const blob = await apiService.tecnicos.exportCsv(this.filters);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tecnicos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error: any) {
        console.error('Error exporting CSV:', error);
        this.setError('Error al exportar el archivo CSV');
        throw error;
      }
    },

    /**
     * Import tecnicos from CSV
     */
    async importCsv(file: File): Promise<{ created: number; updated: number; errors: string[] }> {
      this.setLoading(true);
      this.setError(null);

      try {
        const result = await apiService.tecnicos.importCsv(file);
        
        // Refresh the list
        await this.fetch(this.filters);
        
        return result;
      } catch (error: any) {
        console.error('Error importing CSV:', error);
        this.setError(
          error.response?.data?.error || 
          'Error al importar el archivo CSV'
        );
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Get tecnico KPIs
     */
    async getKpis(id: string): Promise<TecnicoKpis> {
      try {
        return await apiService.tecnicos.getKpis(id);
      } catch (error: any) {
        console.error('Error fetching tecnico KPIs:', error);
        return {
          intervencionesEsteMes: 0,
          duracionMedia: 0,
          tasaResolucion: 0,
          ingresosMes: 0
        };
      }
    },

    /**
     * Get recent interventions for tecnico
     */
    async getRecentInterventions(id: string, limit: number = 10): Promise<any[]> {
      try {
        return await apiService.tecnicos.getRecentInterventions(id, limit);
      } catch (error: any) {
        console.error('Error fetching recent interventions:', error);
        return [];
      }
    },

    /**
     * Get audit logs for tecnico
     */
    async getAuditLogs(id: string, limit: number = 20): Promise<any[]> {
      try {
        return await apiService.tecnicos.getAuditLogs(id, limit);
      } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return [];
      }
    },

    /**
     * Clear current state
     */
    clear() {
      this.items = [];
      this.total = 0;
      this.page = 1;
      this.filters = {};
      this.error = null;
    },

    /**
     * Helper to determine if a tecnico should be included in current list
     */
    shouldIncludeInCurrentList(tecnico: Tecnico): boolean {
      const filters = this.filters;
      
      // Check text filter
      if (filters.q) {
        const query = filters.q.toLowerCase();
        if (!tecnico.nombre.toLowerCase().includes(query) && 
            !tecnico.email.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Check active filter
      if (filters.activo !== undefined && filters.activo !== '') {
        const isActive = filters.activo === 'true';
        if (tecnico.activo !== isActive) {
          return false;
        }
      }
      
      // Check especialidad filter
      if (filters.especialidad) {
        if (!tecnico.especialidades.includes(filters.especialidad)) {
          return false;
        }
      }
      
      // Check zona filter
      if (filters.zona) {
        if (!tecnico.zonas.includes(filters.zona)) {
          return false;
        }
      }
      
      return true;
    }
  }
});