import { defineStore } from 'pinia';
import api from '@/services/api';

type User = { id: string; username: string; displayName: string; roles: string[]; technicianId?: string | null };

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('access_token') || '',
    user: null as User | null,
    loading: false,
    error: '' as string | '',
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
    hasRole: (s) => (r: string) => s.user?.roles?.includes(r) || false,
  },
  actions: {
    async login(username: string, password: string) {
      this.loading = true; this.error = '';
      try {
        const { data } = await api.post('/api/auth/login', { username, password });
        this.token = data.token;
        localStorage.setItem('access_token', this.token);
        this.user = data.user;
      } catch (e: any) {
        this.error = e?.response?.data?.error || 'Error de login';
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      if (!this.token) return;
      const { data } = await api.get('/api/auth/me');
      this.user = data.user;
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('access_token');
    },
  },
});