<template>
  <div class="layout-shell">
    <!-- Sidebar -->
    <nav class="sidebar">
      <div class="p-4">
        <h4 class="text-white mb-4">
          <i class="fas fa-ticket-alt me-2"></i>
          OFSAT App
        </h4>
        
        <ul class="nav flex-column">
          <li class="nav-item">
            <router-link 
              to="/tickets" 
              class="nav-link d-flex align-items-center py-3"
              active-class="active"
            >
              <i class="fas fa-tachometer-alt me-3"></i>
              Dashboard
            </router-link>
          </li>
          <li v-if="canCreateTickets" class="nav-item">
            <router-link 
              to="/tickets/new" 
              class="nav-link d-flex align-items-center py-3"
              active-class="active"
            >
              <i class="fas fa-plus me-3"></i>
              Nuevo Ticket
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Top Bar -->
    <nav class="topbar d-flex align-items-center px-4">
      <div class="d-flex align-items-center ms-auto">
        <!-- User Info -->
        <div class="dropdown">
          <button 
            class="btn btn-link text-decoration-none d-flex align-items-center"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div class="user-avatar me-2">
              <i class="fas fa-user"></i>
            </div>
            <div class="user-info">
              <div class="user-name">{{ authStore.user?.displayName }}</div>
              <div class="user-role">{{ primaryRole }}</div>
            </div>
            <i class="fas fa-chevron-down ms-2 text-muted"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <span class="dropdown-item-text">
                <div class="fw-bold">{{ authStore.user?.displayName }}</div>
                <small class="text-muted">{{ authStore.user?.username }}</small>
              </span>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item" @click="handleLogout">
                <i class="fas fa-sign-out-alt me-2"></i>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container-fluid py-4">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Get primary role for display
const primaryRole = computed(() => {
  const roles = authStore.user?.roles || [];
  if (roles.includes('ADMIN')) return 'Administrador';
  if (roles.includes('GESTOR')) return 'Gestor';
  if (roles.includes('TECNICO')) return 'Técnico';
  if (roles.includes('LECTOR')) return 'Lector';
  return 'Usuario';
});

// Check permissions
const canCreateTickets = computed(() => {
  return authStore.isAdmin || authStore.isGestor;
});

// Handle logout
const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<style scoped>
.layout-shell {
  min-height: 100vh;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background-color: #5e72e4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
}

.user-info {
  text-align: left;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #344767;
  line-height: 1.2;
}

.user-role {
  font-size: 0.75rem;
  color: #67748e;
  line-height: 1.2;
}

.btn-link {
  color: #344767 !important;
  padding: 0.5rem !important;
}

.btn-link:hover {
  color: #5e72e4 !important;
}

.dropdown-menu {
  min-width: 200px;
  border: 1px solid #e3e6f0;
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
}

.dropdown-item-text {
  padding: 0.5rem 1rem;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}
</style>
