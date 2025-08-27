import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false,
    error: null as string | null,
    sidebarCollapsed: false,
  }),
  
  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    
    setError(error: string | null) {
      this.error = error;
    },
    
    clearError() {
      this.error = null;
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
  }
});

// Export store modules
export { useTicketsStore } from '@/stores/tickets';
export { useClientsStore } from '@/stores/clients';
export { useTechniciansStore } from '@/stores/technicians';
export { useContractsStore } from '@/stores/contracts';
