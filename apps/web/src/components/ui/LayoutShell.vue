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
          <li class="nav-item">
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
        <span class="text-sm text-muted">
          <i class="fas fa-user me-2"></i>
          Usuario
        </span>
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
import { RouterView } from 'vue-router';
</script>

<style scoped>
.layout-shell {
  min-height: 100vh;
}
</style>
