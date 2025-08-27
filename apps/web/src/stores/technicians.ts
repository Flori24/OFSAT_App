import { defineStore } from 'pinia';
import { apiService, type Technician } from '@/services/api';

interface TechniciansState {
  technicians: Technician[];
  loading: boolean;
  error: string | null;
}

export const useTechniciansStore = defineStore('technicians', {
  state: (): TechniciansState => ({
    technicians: [],
    loading: false,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    isEmpty: (state) => state.technicians.length === 0 && !state.loading,
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    async fetchTechnicians() {
      this.setLoading(true);
      this.setError(null);

      try {
        const technicians = await apiService.technicians.list();
        this.technicians = technicians;
      } catch (error: any) {
        console.error('Error fetching technicians:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar técnicos');
        this.technicians = [];
      } finally {
        this.setLoading(false);
      }
    },

    // Helper to get technician by id
    findTechnicianById(id: string): Technician | undefined {
      return this.technicians.find(t => t.id === id);
    },
  },
});