<template>
  <div class="tickets-dashboard">
    <!-- Header -->
    <div class="row align-items-center mb-4">
      <div class="col">
        <h1 class="h3 mb-0">Dashboard de Tickets</h1>
        <p class="text-muted mb-0">Gestiona y revisa todos los tickets del sistema</p>
      </div>
      <div class="col-auto">
        <router-link 
          to="/tickets/new" 
          class="btn btn-primary"
        >
          <i class="fas fa-plus me-2"></i>
          Nuevo Ticket
        </router-link>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="card bg-gradient-primary text-white">
          <div class="card-body">
            <div class="row">
              <div class="col">
                <h5 class="card-title text-uppercase text-white-50 mb-0">Total</h5>
                <span class="h2 font-weight-bold mb-0">0</span>
              </div>
              <div class="col-auto">
                <div class="icon icon-shape bg-white text-primary rounded-circle shadow">
                  <i class="fas fa-ticket-alt"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-xl-3 col-md-6">
        <div class="card bg-gradient-warning text-white">
          <div class="card-body">
            <div class="row">
              <div class="col">
                <h5 class="card-title text-uppercase text-white-50 mb-0">Pendientes</h5>
                <span class="h2 font-weight-bold mb-0">0</span>
              </div>
              <div class="col-auto">
                <div class="icon icon-shape bg-white text-warning rounded-circle shadow">
                  <i class="fas fa-clock"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-xl-3 col-md-6">
        <div class="card bg-gradient-success text-white">
          <div class="card-body">
            <div class="row">
              <div class="col">
                <h5 class="card-title text-uppercase text-white-50 mb-0">Completados</h5>
                <span class="h2 font-weight-bold mb-0">0</span>
              </div>
              <div class="col-auto">
                <div class="icon icon-shape bg-white text-success rounded-circle shadow">
                  <i class="fas fa-check"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tickets Table -->
    <div class="card">
      <div class="card-header border-0">
        <h3 class="mb-0">Tickets</h3>
      </div>
      <div class="card-body">
        <div class="text-center py-5">
          <i class="fas fa-ticket-alt text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-3 mb-0">No hay tickets disponibles</p>
          <p class="text-sm text-muted">Los tickets aparecerán aquí cuando se implementen en el Hito 1</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Ticket dashboard functionality will be implemented in Milestone 1
</script>

<style scoped>
.icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-gradient-primary {
  background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%);
}

.bg-gradient-warning {
  background: linear-gradient(87deg, #fb6340 0, #fbb140 100%);
}

.bg-gradient-success {
  background: linear-gradient(87deg, #2dce89 0, #2dcecc 100%);
}
</style>
