import { defineStore } from 'pinia';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false,
    error: null as string | null,
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
    }
  }
});

export { api };
