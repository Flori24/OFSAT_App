import { defineStore } from 'pinia';
import { apiService, type User } from '@/services/api';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
    loading: false,
    error: null
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    
    getUserById: (state) => (id: string) => 
      state.users.find(user => user.id === id),
      
    getTecnicoUsers: (state) => 
      state.users.filter(user => user.roles.includes('TECNICO'))
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    async fetchUsers(filters: { q?: string; roles?: string[] } = {}) {
      this.setLoading(true);
      this.setError(null);

      try {
        const users = await apiService.users.list(filters);
        this.users = users;
      } catch (error: any) {
        console.error('Error fetching users:', error);
        this.setError(
          error.response?.data?.error || 
          'Error al cargar usuarios'
        );
        this.users = [];
      } finally {
        this.setLoading(false);
      }
    },

    async getUser(id: string): Promise<User> {
      // Check if user is already in store
      const existingUser = this.getUserById(id);
      if (existingUser) {
        return existingUser;
      }

      try {
        const user = await apiService.users.get(id);
        
        // Add to store
        this.users.push(user);
        
        return user;
      } catch (error: any) {
        console.error('Error fetching user:', error);
        throw error;
      }
    },

    async searchUsers(filters: { q: string; roles?: string[] }): Promise<User[]> {
      try {
        return await apiService.users.searchUsers(filters);
      } catch (error: any) {
        console.error('Error searching users:', error);
        this.setError('Error al buscar usuarios');
        return [];
      }
    }
  }
});