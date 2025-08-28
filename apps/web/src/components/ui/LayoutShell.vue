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
          <li class="nav-item" v-if="auth.hasRole('ADMIN')">
            <router-link 
              to="/admin/users" 
              class="nav-link d-flex align-items-center py-3"
              active-class="active"
            >
              <i class="fas fa-users me-3"></i>
              Usuarios
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Nav / Topbar -->
    <nav class="navbar navbar-top navbar-expand navbar-dark bg-primary border-bottom">
      <div class="container-fluid">
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav align-items-center ms-auto">
            <li class="nav-item dropdown" :class="{ show: showUserMenu }">
              <a class="nav-link pr-0 dropdown-toggle" href="#" role="button" @click.prevent="toggleUserMenu">
                <span class="mb-0 text-sm fw-bold">
                  {{ auth.user?.displayName || auth.user?.username || 'Usuario' }}
                </span>
              </a>
              <div class="dropdown-menu dropdown-menu-end" :class="{ show: showUserMenu }">
                <a class="dropdown-item" href="#" @click.prevent="onLogout">Salir</a>
                <a class="dropdown-item" href="#" @click.prevent="onForceLogout">Limpiar Sesión</a>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Aquí va el slot para páginas -->
    <div class="container-fluid mt-4">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const showUserMenu = ref(false);

const canCreateTickets = computed(() => {
  return auth.hasRole('ADMIN') || auth.hasRole('GESTOR');
});

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

function onLogout() { 
  auth.logout(); 
  router.push('/login'); 
  showUserMenu.value = false;
}

function onForceLogout() {
  auth.forceLogout();
}
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
