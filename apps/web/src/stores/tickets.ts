import { defineStore } from 'pinia';
import { apiService, type Ticket, type TicketCreateInput, type TicketFilters } from '@/services/api';

interface TicketsState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: TicketFilters;
}

export const useTicketsStore = defineStore('tickets', {
  state: (): TicketsState => ({
    tickets: [],
    currentTicket: null,
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
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    isEmpty: (state) => state.tickets.length === 0 && !state.loading,
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setFilters(filters: Partial<TicketFilters>) {
      this.filters = { ...this.filters, ...filters };
    },

    clearFilters() {
      this.filters = {
        page: 1,
        pageSize: 20,
      };
    },

    async fetchTickets(filters: TicketFilters = {}) {
      this.setLoading(true);
      this.setError(null);

      try {
        const searchFilters = { ...this.filters, ...filters };
        const response = await apiService.tickets.list(searchFilters);

        this.tickets = response.data;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.total = response.total;
        this.totalPages = response.totalPages;
        
        // Update filters with current values
        this.filters = { ...this.filters, ...searchFilters };
        
      } catch (error: any) {
        console.error('Error fetching tickets:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar tickets');
        this.tickets = [];
      } finally {
        this.setLoading(false);
      }
    },

    async getTicket(id: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const ticket = await apiService.tickets.get(id);
        this.currentTicket = ticket;
        return ticket;
      } catch (error: any) {
        console.error('Error fetching ticket:', error);
        this.setError(error.response?.data?.error?.message || 'Error al cargar ticket');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async createTicket(data: TicketCreateInput) {
      this.setLoading(true);
      this.setError(null);

      try {
        const newTicket = await apiService.tickets.create(data);
        this.tickets.unshift(newTicket);
        this.total += 1;
        return newTicket;
      } catch (error: any) {
        console.error('Error creating ticket:', error);
        this.setError(error.response?.data?.error?.message || 'Error al crear ticket');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async updateTicket(id: string, data: Partial<TicketCreateInput>) {
      this.setLoading(true);
      this.setError(null);

      try {
        const updatedTicket = await apiService.tickets.update(id, data);
        
        // Update ticket in list if it exists
        const index = this.tickets.findIndex(t => t.numeroTicket === id);
        if (index !== -1) {
          this.tickets[index] = updatedTicket;
        }
        
        // Update current ticket if it's the same
        if (this.currentTicket?.numeroTicket === id) {
          this.currentTicket = updatedTicket;
        }
        
        return updatedTicket;
      } catch (error: any) {
        console.error('Error updating ticket:', error);
        this.setError(error.response?.data?.error?.message || 'Error al actualizar ticket');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async deleteTicket(id: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        await apiService.tickets.delete(id);
        
        // Remove from list
        this.tickets = this.tickets.filter(t => t.numeroTicket !== id);
        this.total -= 1;
        
        // Clear current ticket if it's the same
        if (this.currentTicket?.numeroTicket === id) {
          this.currentTicket = null;
        }
        
        return true;
      } catch (error: any) {
        console.error('Error deleting ticket:', error);
        this.setError(error.response?.data?.error?.message || 'Error al eliminar ticket');
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    clearCurrentTicket() {
      this.currentTicket = null;
    },
  },
});