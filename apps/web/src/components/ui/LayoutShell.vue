<template>
  <div class="layout-shell">
    <!-- Mobile overlay -->
    <div 
      class="sidebar-overlay" 
      :class="{ active: sidebarOpen }"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <nav class="sidebar" :class="{ active: sidebarOpen }">
      <div class="sidebar-header p-4">
        <h4 class="text-white mb-4 d-flex align-items-center justify-content-between">
          <span>
            <i class="fas fa-ticket-alt me-2"></i>
            OFSAT App
          </span>
          <button 
            class="btn btn-link text-white d-lg-none p-0"
            @click="sidebarOpen = false"
          >
            <i class="fas fa-times"></i>
          </button>
        </h4>
        
        <ul class="nav flex-column">
          <li class="nav-item">
            <router-link 
              to="/tickets" 
              class="nav-link d-flex align-items-center py-3"
              active-class="active"
              @click="closeSidebarOnMobile"
            >
              <i class="fas fa-tachometer-alt me-3"></i>
              <span class="nav-text">Dashboard</span>
            </router-link>
          </li>
          <li v-if="canCreateTickets" class="nav-item">
            <router-link 
              to="/tickets/new" 
              class="nav-link d-flex align-items-center py-3"
              active-class="active"
              @click="closeSidebarOnMobile"
            >
              <i class="fas fa-plus me-3"></i>
              <span class="nav-text">Nuevo Ticket</span>
            </router-link>
          </li>
          
          <!-- Configuración Section -->
          <li class="nav-item mt-3 mb-2" v-if="canManageTecnicos || auth.hasRole('ADMIN')">
            <h6 class="text-uppercase text-xs font-weight-bolder opacity-8 text-white-50 px-3">
              Configuración
            </h6>
          </li>
          
          <li class="nav-item" v-if="canManageTecnicos">
            <router-link 
              to="/config/tecnicos" 
              class="nav-link d-flex align-items-center py-3"
              active-class="active"
              @click="closeSidebarOnMobile"
            >
              <i class="fas fa-user-cog me-3"></i>
              <span class="nav-text">Técnicos</span>
            </router-link>
          </li>
          
          <li class="nav-item" v-if="auth.hasRole('ADMIN')">
            <router-link 
              to="/admin/users" 
              class="nav-link d-flex align-items-center py-3"
              active-class="active"
              @click="closeSidebarOnMobile"
            >
              <i class="fas fa-users me-3"></i>
              <span class="nav-text">Usuarios</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Main content wrapper -->
    <div class="main-wrapper">
      <!-- Nav / Topbar -->
      <nav class="navbar navbar-top navbar-expand navbar-dark bg-primary border-bottom">
        <div class="container-fluid">
          <!-- Mobile menu toggle -->
          <button 
            class="btn btn-link text-white d-lg-none me-3 p-2"
            @click="sidebarOpen = !sidebarOpen"
          >
            <i class="fas fa-bars"></i>
          </button>

          <!-- Mobile logo -->
          <span class="navbar-brand d-lg-none text-white mb-0">
            <i class="fas fa-ticket-alt me-2"></i>
            OFSAT
          </span>

          <div class="navbar-collapse">
            <ul class="navbar-nav align-items-center ms-auto">
              <li class="nav-item dropdown" :class="{ show: showUserMenu }">
                <a class="nav-link pr-0 dropdown-toggle" href="#" role="button" @click.prevent="toggleUserMenu">
                  <span class="mb-0 text-sm fw-bold d-none d-sm-inline">
                    {{ auth.user?.displayName || auth.user?.username || 'Usuario' }}
                  </span>
                  <span class="mb-0 text-sm fw-bold d-sm-none">
                    <i class="fas fa-user"></i>
                  </span>
                </a>
                <div class="dropdown-menu dropdown-menu-end" :class="{ show: showUserMenu }">
                  <div class="dropdown-item-text d-sm-none">
                    <strong>{{ auth.user?.displayName || auth.user?.username || 'Usuario' }}</strong>
                  </div>
                  <div class="dropdown-divider d-sm-none"></div>
                  <a class="dropdown-item" href="#" @click.prevent="onLogout">
                    <i class="fas fa-sign-out-alt me-2"></i>
                    Salir
                  </a>
                  <a class="dropdown-item" href="#" @click.prevent="onForceLogout">
                    <i class="fas fa-broom me-2"></i>
                    Limpiar Sesión
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- Page content -->
      <div class="page-content">
        <div class="container-fluid">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const showUserMenu = ref(false);
const sidebarOpen = ref(false);

const canCreateTickets = computed(() => {
  return auth.hasRole('ADMIN') || auth.hasRole('SUPERVISOR');
});

const canManageTecnicos = computed(() => {
  return auth.hasRole('ADMIN') || auth.hasRole('SUPERVISOR');
});

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

function closeSidebarOnMobile() {
  if (window.innerWidth < 992) {
    sidebarOpen.value = false;
  }
}

function handleResize() {
  if (window.innerWidth >= 992) {
    sidebarOpen.value = false;
  }
}

function onLogout() { 
  auth.logout(); 
  router.push('/login'); 
  showUserMenu.value = false;
}

function onForceLogout() {
  auth.forceLogout();
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.layout-shell {
  min-height: 100vh;
  display: flex;
  overflow-x: hidden;
}

/* Sidebar Overlay for Mobile */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* Sidebar Styles */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 1050;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  overflow-y: auto;
}

.sidebar.active {
  transform: translateX(0);
}

.sidebar .nav-link {
  color: rgba(255, 255, 255, 0.8);
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  transition: all 0.15s ease;
}

.sidebar .nav-link:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar .nav-link.active {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
}

/* Main Content Wrapper */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Navbar adjustments */
.navbar-top {
  height: 60px;
  z-index: 1030;
}

.navbar-brand {
  font-size: 1.1rem;
  font-weight: 600;
}

/* Page Content */
.page-content {
  flex: 1;
  padding: 1.5rem 0;
  overflow-x: auto;
}

/* Dropdown improvements */
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

/* Mobile and Desktop Breakpoints */
@media (min-width: 992px) {
  .sidebar {
    position: static;
    transform: translateX(0);
    height: 100vh;
  }
  
  .sidebar-overlay {
    display: none;
  }
  
  .main-wrapper {
    margin-left: 0;
  }
}

@media (max-width: 991.98px) {
  .main-wrapper {
    width: 100%;
  }
  
  .page-content {
    padding: 1rem 0;
  }
  
  .container-fluid {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Tablet and Small Desktop */
@media (min-width: 768px) and (max-width: 991.98px) {
  .page-content {
    padding: 1.25rem 0;
  }
}

/* Mobile Portrait */
@media (max-width: 575.98px) {
  .navbar-top {
    height: 56px;
    padding: 0.5rem 1rem;
  }
  
  .page-content {
    padding: 0.75rem 0;
  }
  
  .container-fluid {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .sidebar {
    width: 260px;
  }
  
  .sidebar-header .p-4 {
    padding: 1.5rem !important;
  }
  
  .nav-link {
    padding: 0.75rem 0 !important;
    font-size: 0.9rem;
  }
}

/* User menu responsiveness */
@media (max-width: 575.98px) {
  .dropdown-menu {
    min-width: 180px;
    right: 0.5rem !important;
  }
}

/* Animation improvements */
.nav-link {
  transition: all 0.2s ease;
}

.btn-link:hover {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* Focus states for accessibility */
.btn:focus,
.nav-link:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
}
</style>
