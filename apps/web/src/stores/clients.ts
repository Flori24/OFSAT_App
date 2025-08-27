import { defineStore } from 'pinia';
import { apiService, type Client, type Contract } from '@/services/api';

interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  clientContracts: Contract[];
  loading: boolean;
  error: string | null;
}

export const useClientsStore = defineStore('clients', {
  state: (): ClientsState => ({
    clients: [],
    currentClient: null,
    clientContracts: [],
    loading: false,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    isEmpty: (state) => state.clients.length === 0 && !state.loading,
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    async fetchClients(searchQuery?: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const clients = await apiService.clients.list(searchQuery);
        this.clients = clients;
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar clientes');
        this.clients = [];
      } finally {
        this.setLoading(false);
      }
    },

    async getClient(codigoCliente: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const client = await apiService.clients.get(codigoCliente);
        this.currentClient = client;
        return client;
      } catch (error: any) {
        console.error('Error fetching client:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar cliente');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async getClientContracts(codigoCliente: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const contracts = await apiService.clients.getContracts(codigoCliente);
        this.clientContracts = contracts;
        return contracts;
      } catch (error: any) {
        console.error('Error fetching client contracts:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar contratos');
        this.clientContracts = [];
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    clearCurrentClient() {
      this.currentClient = null;
      this.clientContracts = [];
    },

    // Helper to get client by codigo
    findClientByCode(codigoCliente: string): Client | undefined {
      return this.clients.find(c => c.codigoCliente === codigoCliente);
    },
  },
});