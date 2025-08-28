import { defineStore } from 'pinia';
import { apiService, type Intervencion, type CreateIntervencionInput, type UpdateIntervencionInput, type IntervencionFilters, type CreateMaterialInput, type UpdateMaterialInput } from '@/services/api';

interface IntervencionesState {
  intervenciones: Intervencion[];
  currentIntervencion: Intervencion | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: IntervencionFilters;
  currentTicketNumber: string | null;
}

export const useIntervencionesStore = defineStore('intervenciones', {
  state: (): IntervencionesState => ({
    intervenciones: [],
    currentIntervencion: null,
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    filters: {
      page: 1,
      pageSize: 20,
    },
    currentTicketNumber: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    isEmpty: (state) => state.intervenciones.length === 0 && !state.loading,
    
    pendientes: (state) => state.intervenciones.filter(i => i.estadoTarea === 'Pendiente'),
    enCurso: (state) => state.intervenciones.filter(i => i.estadoTarea === 'EnCurso'),
    finalizadas: (state) => state.intervenciones.filter(i => i.estadoTarea === 'Finalizada'),
    
    totalImporteMateriales: (state) => state.intervenciones.reduce((sum, i) => sum + i.totales.importeTotal, 0),
    totalDuracionMinutos: (state) => state.intervenciones.reduce((sum, i) => sum + (i.duracionMinutos || 0), 0),
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setFilters(filters: Partial<IntervencionFilters>) {
      this.filters = { ...this.filters, ...filters };
    },

    clearFilters() {
      this.filters = {
        page: 1,
        pageSize: 20,
      };
    },

    setCurrentTicket(numeroTicket: string) {
      this.currentTicketNumber = numeroTicket;
    },

    async fetchIntervenciones(numeroTicket: string, filters: IntervencionFilters = {}) {
      this.setLoading(true);
      this.setError(null);
      this.setCurrentTicket(numeroTicket);

      try {
        const searchFilters = { ...this.filters, ...filters };
        const response = await apiService.intervenciones.listByTicket(numeroTicket, searchFilters);

        this.intervenciones = response.data;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.total = response.total;
        this.totalPages = response.totalPages;
        
        // Update filters with current values
        this.filters = { ...this.filters, ...searchFilters };
        
      } catch (error: any) {
        console.error('Error fetching intervenciones:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar intervenciones');
        this.intervenciones = [];
      } finally {
        this.setLoading(false);
      }
    },

    async getIntervencion(id: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const intervencion = await apiService.intervenciones.get(id);
        this.currentIntervencion = intervencion;
        return intervencion;
      } catch (error: any) {
        console.error('Error fetching intervencion:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar intervención');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async createIntervencion(numeroTicket: string, data: CreateIntervencionInput) {
      this.setLoading(true);
      this.setError(null);

      try {
        const newIntervencion = await apiService.intervenciones.create(numeroTicket, data);
        this.intervenciones.unshift(newIntervencion);
        this.total += 1;
        return newIntervencion;
      } catch (error: any) {
        console.error('Error creating intervencion:', error);
        this.setError(error.response?.data?.error?.message || 'Error al crear intervención');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async updateIntervencion(id: string, data: UpdateIntervencionInput) {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedIntervencion = await apiService.intervenciones.update(id, data);
        
        // Update intervencion in list if it exists
        const index = this.intervenciones.findIndex(i => i.id === id);
        if (index !== -1) {
          this.intervenciones[index] = updatedIntervencion;
        }
        
        // Update current intervencion if it's the same
        if (this.currentIntervencion?.id === id) {
          this.currentIntervencion = updatedIntervencion;
        }
        
        return updatedIntervencion;
      } catch (error: any) {
        console.error('Error updating intervencion:', error);
        this.setError(error.response?.data?.error?.message || 'Error al actualizar intervención');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async deleteIntervencion(id: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        await apiService.intervenciones.delete(id);
        
        // Remove from list
        this.intervenciones = this.intervenciones.filter(i => i.id !== id);
        this.total -= 1;
        
        // Clear current intervencion if it's the same
        if (this.currentIntervencion?.id === id) {
          this.currentIntervencion = null;
        }
        
        return true;
      } catch (error: any) {
        console.error('Error deleting intervencion:', error);
        this.setError(error.response?.data?.error?.message || 'Error al eliminar intervención');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // Material management
    async addMaterials(intervencionId: string, materials: CreateMaterialInput[]) {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedIntervencion = await apiService.intervenciones.addMaterials(intervencionId, materials);
        
        // Update in list and current
        const index = this.intervenciones.findIndex(i => i.id === intervencionId);
        if (index !== -1) {
          this.intervenciones[index] = updatedIntervencion;
        }
        
        if (this.currentIntervencion?.id === intervencionId) {
          this.currentIntervencion = updatedIntervencion;
        }
        
        return updatedIntervencion;
      } catch (error: any) {
        console.error('Error adding materials:', error);
        this.setError(error.response?.data?.error?.message || 'Error al agregar materiales');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async updateMaterial(intervencionId: string, materialId: string, data: UpdateMaterialInput) {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedIntervencion = await apiService.intervenciones.updateMaterial(intervencionId, materialId, data);
        
        // Update in list and current
        const index = this.intervenciones.findIndex(i => i.id === intervencionId);
        if (index !== -1) {
          this.intervenciones[index] = updatedIntervencion;
        }
        
        if (this.currentIntervencion?.id === intervencionId) {
          this.currentIntervencion = updatedIntervencion;
        }
        
        return updatedIntervencion;
      } catch (error: any) {
        console.error('Error updating material:', error);
        this.setError(error.response?.data?.error?.message || 'Error al actualizar material');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async deleteMaterial(intervencionId: string, materialId: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedIntervencion = await apiService.intervenciones.deleteMaterial(intervencionId, materialId);
        
        // Update in list and current
        const index = this.intervenciones.findIndex(i => i.id === intervencionId);
        if (index !== -1) {
          this.intervenciones[index] = updatedIntervencion;
        }
        
        if (this.currentIntervencion?.id === intervencionId) {
          this.currentIntervencion = updatedIntervencion;
        }
        
        return updatedIntervencion;
      } catch (error: any) {
        console.error('Error deleting material:', error);
        this.setError(error.response?.data?.error?.message || 'Error al eliminar material');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    // File uploads
    async uploadAdjuntos(intervencionId: string, files: FileList) {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedIntervencion = await apiService.intervenciones.uploadAdjuntos(intervencionId, files);
        
        // Update in list and current
        const index = this.intervenciones.findIndex(i => i.id === intervencionId);
        if (index !== -1) {
          this.intervenciones[index] = updatedIntervencion;
        }
        
        if (this.currentIntervencion?.id === intervencionId) {
          this.currentIntervencion = updatedIntervencion;
        }
        
        return updatedIntervencion;
      } catch (error: any) {
        console.error('Error uploading adjuntos:', error);
        this.setError(error.response?.data?.error?.message || 'Error al subir adjuntos');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async uploadFirma(intervencionId: string, firmaFile: File) {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedIntervencion = await apiService.intervenciones.uploadFirma(intervencionId, firmaFile);
        
        // Update in list and current
        const index = this.intervenciones.findIndex(i => i.id === intervencionId);
        if (index !== -1) {
          this.intervenciones[index] = updatedIntervencion;
        }
        
        if (this.currentIntervencion?.id === intervencionId) {
          this.currentIntervencion = updatedIntervencion;
        }
        
        return updatedIntervencion;
      } catch (error: any) {
        console.error('Error uploading firma:', error);
        this.setError(error.response?.data?.error?.message || 'Error al subir firma');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    clearCurrentIntervencion() {
      this.currentIntervencion = null;
    },

    clearAll() {
      this.intervenciones = [];
      this.currentIntervencion = null;
      this.currentTicketNumber = null;
      this.page = 1;
      this.total = 0;
      this.totalPages = 0;
      this.clearFilters();
      this.setError(null);
    },
  },
});