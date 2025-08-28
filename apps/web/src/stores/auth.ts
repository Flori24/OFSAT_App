import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export interface User {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  technicianId?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('auth-token'));
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.roles.includes('ADMIN') || false);
  const isGestor = computed(() => user.value?.roles.includes('GESTOR') || false);
  const isTecnico = computed(() => user.value?.roles.includes('TECNICO') || false);
  const hasRole = computed(() => (role: string) => user.value?.roles.includes(role) || false);

  // Actions
  async function login(credentials: LoginCredentials): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      const { token: authToken, user: authUser } = response.data;

      // Store token and user
      token.value = authToken;
      user.value = authUser;
      
      // Persist token to localStorage
      localStorage.setItem('auth-token', authToken);
      
      // Set default Authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Error de autenticación';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      // Clear state
      token.value = null;
      user.value = null;
      error.value = null;
      
      // Clear localStorage
      localStorage.removeItem('auth-token');
      
      // Remove Authorization header
      delete api.defaults.headers.common['Authorization'];
      
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  async function getCurrentUser(): Promise<void> {
    if (!token.value) return;
    
    try {
      isLoading.value = true;
      
      // Set Authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      
      const response = await api.get<{ user: User }>('/api/auth/me');
      user.value = response.data.user;
      
    } catch (err: any) {
      console.error('Get current user error:', err);
      // If token is invalid, logout
      if (err.response?.status === 401) {
        await logout();
      }
    } finally {
      isLoading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  // Initialize auth state on store creation
  if (token.value) {
    getCurrentUser();
  }

  return {
    // State
    token,
    user,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    isGestor,
    isTecnico,
    hasRole,
    // Actions
    login,
    logout,
    getCurrentUser,
    clearError,
  };
});