<template>
  <div class="tickets-dashboard">
    <!-- Header -->
    <div class="row align-items-center mb-4">
      <div class="col">
        <h1 class="h3 mb-0">Dashboard de Tickets</h1>
        <p class="text-muted mb-0">Gestiona y revisa todos los tickets del sistema</p>
      </div>
      <div class="col-auto">
        <router-link v-if="auth.hasRole('ADMIN') || auth.hasRole('GESTOR')" to="/tickets/new" class="btn btn-primary">
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
                <span class="h2 font-weight-bold mb-0">{{ ticketsStore.total }}</span>
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
                <h5 class="card-title text-uppercase text-white-50 mb-0">Abiertos</h5>
                <span class="h2 font-weight-bold mb-0">{{ openTicketsCount }}</span>
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
                <h5 class="card-title text-uppercase text-white-50 mb-0">En Proceso</h5>
                <span class="h2 font-weight-bold mb-0">{{ inProgressCount }}</span>
              </div>
              <div class="col-auto">
                <div class="icon icon-shape bg-white text-success rounded-circle shadow">
                  <i class="fas fa-cog"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card bg-gradient-danger text-white">
          <div class="card-body">
            <div class="row">
              <div class="col">
                <h5 class="card-title text-uppercase text-white-50 mb-0">Urgentes</h5>
                <span class="h2 font-weight-bold mb-0">{{ urgentTicketsCount }}</span>
              </div>
              <div class="col-auto">
                <div class="icon icon-shape bg-white text-danger rounded-circle shadow">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">Cliente</label>
            <select v-model="filters.codigoCliente" class="form-select">
              <option value="">Todos los clientes</option>
              <option 
                v-for="client in clientsStore.clients" 
                :key="client.codigoCliente"
                :value="client.codigoCliente"
              >
                {{ client.razonSocial }}
              </option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label">Técnico</label>
            <select v-model="filters.technicianId" class="form-select">
              <option value="">Todos los técnicos</option>
              <option 
                v-for="technician in techniciansStore.technicians" 
                :key="technician.id"
                :value="technician.id"
              >
                {{ technician.nombre }}
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <label class="form-label">Estado</label>
            <select v-model="filters.estadoTicket" class="form-select">
              <option value="">Todos</option>
              <option value="ABIERTO">Abierto</option>
              <option value="ASIGNADA">Asignada</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PENDIENTE_CLIENTE">Pendiente Cliente</option>
              <option value="PENDIENTE_PROVEEDOR">Pendiente Proveedor</option>
              <option value="EN_TRANSITO">En Tránsito</option>
              <option value="PENDIENTE_RMA">Pendiente RMA</option>
              <option value="EN_PROCESO">En Proceso</option>
            </select>
          </div>

          <div class="col-md-2">
            <label class="form-label">Urgencia</label>
            <select v-model="filters.urgencia" class="form-select">
              <option value="">Todas</option>
              <option value="NORMAL">Normal</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="EXTREMA">Extrema</option>
            </select>
          </div>

          <div class="col-md-2">
            <label class="form-label">Página</label>
            <select v-model="filters.pageSize" class="form-select">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>

        <div class="row g-3 mt-2">
          <div class="col-md-3">
            <label class="form-label">Fecha Desde</label>
            <input 
              v-model="filters.fechaDesde" 
              type="date" 
              class="form-control"
            >
          </div>

          <div class="col-md-3">
            <label class="form-label">Fecha Hasta</label>
            <input 
              v-model="filters.fechaHasta" 
              type="date" 
              class="form-control"
            >
          </div>

          <div class="col-md-4">
            <label class="form-label">Búsqueda</label>
            <input 
              v-model="filters.q" 
              type="text" 
              class="form-control" 
              placeholder="Buscar en detalle, número de serie, número de ticket..."
            >
          </div>

          <div class="col-md-2 d-flex align-items-end gap-2">
            <button @click="applyFilters" class="btn btn-primary">
              <i class="fas fa-search me-1"></i>
              Aplicar
            </button>
            <button @click="clearFilters" class="btn btn-outline-secondary">
              <i class="fas fa-times me-1"></i>
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="ticketsStore.isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="ticketsStore.hasError" class="alert alert-danger">
      <i class="fas fa-exclamation-circle me-2"></i>
      {{ ticketsStore.error }}
    </div>

    <!-- Tickets Table -->
    <div v-else class="card">
      <div class="card-header border-0">
        <div class="row align-items-center">
          <div class="col">
            <h3 class="mb-0">Tickets</h3>
          </div>
          <div class="col-auto">
            <span class="badge bg-secondary">{{ ticketsStore.total }} tickets</span>
          </div>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table align-items-center table-flush">
          <thead class="thead-light">
            <tr>
              <th scope="col">Número</th>
              <th scope="col">Cliente</th>
              <th scope="col">Tipo</th>
              <th scope="col">Estado</th>
              <th scope="col">Urgencia</th>
              <th scope="col">Técnico</th>
              <th scope="col">Fecha</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ticketsStore.isEmpty" class="text-center">
              <td colspan="8" class="py-5">
                <i class="fas fa-ticket-alt text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3 mb-0">No hay tickets que coincidan con los filtros</p>
              </td>
            </tr>
            <tr v-for="ticket in ticketsStore.tickets" :key="ticket.numeroTicket">
              <td>
                <span class="badge badge-soft-primary">{{ ticket.numeroTicket }}</span>
              </td>
              <td>
                <div>
                  <span class="text-sm font-weight-bold">{{ ticket.client?.razonSocial || ticket.razonSocial }}</span>
                  <br>
                  <span class="text-xs text-muted">{{ ticket.codigoCliente }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getTypeClass(ticket.tipoTicket)">
                  {{ formatTicketType(ticket.tipoTicket) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getStatusClass(ticket.estadoTicket)">
                  {{ formatStatus(ticket.estadoTicket) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getUrgencyClass(ticket.urgencia)">
                  {{ formatUrgency(ticket.urgencia) }}
                </span>
              </td>
              <td>
                <span v-if="ticket.technician" class="text-sm">{{ ticket.technician.nombre }}</span>
                <span v-else class="text-muted text-sm">Sin asignar</span>
              </td>
              <td>
                <span class="text-sm">{{ formatDate(ticket.fechaCreacion) }}</span>
                <br>
                <span class="text-xs text-muted">{{ formatTime(ticket.fechaCreacion) }}</span>
              </td>
              <td>
                <div class="btn-group" role="group">
                  <router-link 
                    :to="`/tickets/${ticket.numeroTicket}`" 
                    class="btn btn-sm btn-outline-primary"
                    title="Editar"
                  >
                    <i class="fas fa-edit"></i>
                  </router-link>
                  <button 
                    @click="deleteTicket(ticket.numeroTicket)" 
                    class="btn btn-sm btn-outline-danger"
                    title="Eliminar"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="ticketsStore.totalPages > 1" class="card-footer">
        <nav aria-label="Page navigation">
          <ul class="pagination justify-content-center mb-0">
            <li class="page-item" :class="{ disabled: ticketsStore.page === 1 }">
              <button class="page-link" @click="goToPage(ticketsStore.page - 1)">
                <i class="fas fa-angle-left"></i>
                <span class="sr-only">Anterior</span>
              </button>
            </li>
            
            <li 
              v-for="page in getVisiblePages()" 
              :key="page"
              class="page-item" 
              :class="{ active: ticketsStore.page === page }"
            >
              <button class="page-link" @click="goToPage(page)">
                {{ page }}
              </button>
            </li>
            
            <li class="page-item" :class="{ disabled: ticketsStore.page === ticketsStore.totalPages }">
              <button class="page-link" @click="goToPage(ticketsStore.page + 1)">
                <i class="fas fa-angle-right"></i>
                <span class="sr-only">Siguiente</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div class="text-center mt-3">
          <small class="text-muted">
            Página {{ ticketsStore.page }} de {{ ticketsStore.totalPages }} 
            ({{ ticketsStore.total }} tickets en total)
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTicketsStore, useClientsStore, useTechniciansStore } from '@/store';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const ticketsStore = useTicketsStore();
const clientsStore = useClientsStore();
const techniciansStore = useTechniciansStore();
const auth = useAuthStore();

// Filters
const filters = ref({
  codigoCliente: '',
  technicianId: '',
  estadoTicket: '',
  urgencia: '',
  fechaDesde: '',
  fechaHasta: '',
  q: '',
  page: 1,
  pageSize: 20
});

// Computed stats
const openTicketsCount = computed(() => 
  ticketsStore.tickets.filter(t => t.estadoTicket === 'ABIERTO').length
);

const inProgressCount = computed(() => 
  ticketsStore.tickets.filter(t => t.estadoTicket === 'EN_PROCESO').length
);

const urgentTicketsCount = computed(() => 
  ticketsStore.tickets.filter(t => t.urgencia === 'ALTA' || t.urgencia === 'EXTREMA').length
);

// Methods
const applyFilters = () => {
  filters.value.page = 1; // Reset to first page
  ticketsStore.fetchTickets(filters.value);
};

const clearFilters = () => {
  filters.value = {
    codigoCliente: '',
    technicianId: '',
    estadoTicket: '',
    urgencia: '',
    fechaDesde: '',
    fechaHasta: '',
    q: '',
    page: 1,
    pageSize: 20
  };
  ticketsStore.fetchTickets(filters.value);
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= ticketsStore.totalPages) {
    filters.value.page = page;
    ticketsStore.fetchTickets(filters.value);
  }
};

const getVisiblePages = () => {
  const current = ticketsStore.page;
  const total = ticketsStore.totalPages;
  const delta = 2;
  
  let start = Math.max(1, current - delta);
  let end = Math.min(total, current + delta);
  
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, start + 4);
    else if (end === total) start = Math.max(1, end - 4);
  }
  
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
};

const deleteTicket = async (numeroTicket: string) => {
  if (confirm('¿Está seguro de que desea eliminar este ticket?')) {
    try {
      await ticketsStore.deleteTicket(numeroTicket);
      // Refresh the list
      ticketsStore.fetchTickets(filters.value);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  }
};

// Formatting methods
const formatTicketType = (type: string) => {
  const types: { [key: string]: string } = {
    'IMPRESORA_SOFTWARE': 'Imp. Software',
    'IMPRESORA_HARDWARE': 'Imp. Hardware', 
    'INFORMATICA': 'Informática',
    'INTERNO': 'Interno'
  };
  return types[type] || type;
};

const formatStatus = (status: string) => {
  const statuses: { [key: string]: string } = {
    'ABIERTO': 'Abierto',
    'ASIGNADA': 'Asignada',
    'PENDIENTE': 'Pendiente',
    'PENDIENTE_CLIENTE': 'Pend. Cliente',
    'PENDIENTE_PROVEEDOR': 'Pend. Proveedor',
    'EN_TRANSITO': 'En Tránsito',
    'PENDIENTE_RMA': 'Pend. RMA',
    'EN_PROCESO': 'En Proceso'
  };
  return statuses[status] || status;
};

const formatUrgency = (urgency: string) => {
  const urgencies: { [key: string]: string } = {
    'NORMAL': 'Normal',
    'MEDIA': 'Media',
    'ALTA': 'Alta',
    'EXTREMA': 'Extrema'
  };
  return urgencies[urgency] || urgency;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES');
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Style classes
const getTypeClass = (type: string) => {
  const classes: { [key: string]: string } = {
    'IMPRESORA_SOFTWARE': 'bg-info',
    'IMPRESORA_HARDWARE': 'bg-warning',
    'INFORMATICA': 'bg-primary',
    'INTERNO': 'bg-secondary'
  };
  return classes[type] || 'bg-light';
};

const getStatusClass = (status: string) => {
  const classes: { [key: string]: string } = {
    'ABIERTO': 'bg-warning',
    'ASIGNADA': 'bg-info',
    'PENDIENTE': 'bg-secondary',
    'PENDIENTE_CLIENTE': 'bg-warning',
    'PENDIENTE_PROVEEDOR': 'bg-warning',
    'EN_TRANSITO': 'bg-primary',
    'PENDIENTE_RMA': 'bg-danger',
    'EN_PROCESO': 'bg-success'
  };
  return classes[status] || 'bg-light';
};

const getUrgencyClass = (urgency: string) => {
  const classes: { [key: string]: string } = {
    'NORMAL': 'bg-light text-dark',
    'MEDIA': 'bg-warning',
    'ALTA': 'bg-danger',
    'EXTREMA': 'bg-dark'
  };
  return classes[urgency] || 'bg-light';
};

// Load data on mount
onMounted(async () => {
  await Promise.all([
    clientsStore.fetchClients(),
    techniciansStore.fetchTechnicians(),
    ticketsStore.fetchTickets(filters.value)
  ]);
});
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
