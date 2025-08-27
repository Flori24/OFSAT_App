import { defineStore } from 'pinia';
import { apiService, type Contract } from '@/services/api';

interface ContractsState {
  contracts: Contract[];
  currentContract: Contract | null;
  loading: boolean;
  error: string | null;
}

export const useContractsStore = defineStore('contracts', {
  state: (): ContractsState => ({
    contracts: [],
    currentContract: null,
    loading: false,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    isEmpty: (state) => state.contracts.length === 0 && !state.loading,
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    async fetchContracts(searchQuery?: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const contracts = await apiService.contracts.list(searchQuery);
        this.contracts = contracts;
      } catch (error: any) {
        console.error('Error fetching contracts:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar contratos');
        this.contracts = [];
      } finally {
        this.setLoading(false);
      }
    },

    async getContract(id: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const contract = await apiService.contracts.get(id);
        this.currentContract = contract;
        return contract;
      } catch (error: any) {
        console.error('Error fetching contract:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar contrato');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    clearCurrentContract() {
      this.currentContract = null;
    },

    // Helper to find contract by id
    findContractById(id: string): Contract | undefined {
      return this.contracts.find(c => c.id === id);
    },

    // Helper to search contracts by serial number
    async searchBySerial(numeroSerie: string) {
      if (!numeroSerie.trim()) {
        this.contracts = [];
        return [];
      }

      await this.fetchContracts(numeroSerie);
      return this.contracts;
    },
  },
});