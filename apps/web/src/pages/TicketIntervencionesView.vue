<template>
  <div class="interventions-view">
    <!-- Header con información del ticket -->
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">
        <div class="row align-items-center">
          <div class="col">
            <h4 class="mb-0">
              <i class="fas fa-tools me-2"></i>
              Intervenciones - Ticket {{ $route.params.numero }}
            </h4>
          </div>
          <div class="col-auto">
            <button 
              class="btn btn-light btn-sm me-2" 
              @click="$router.push(`/tickets/${$route.params.numero}`)"
            >
              <i class="fas fa-arrow-left me-1"></i>
              Volver al Ticket
            </button>
            <button 
              class="btn btn-success btn-sm" 
              @click="showIntervencionForm = true"
              :disabled="store.isLoading"
            >
              <i class="fas fa-plus me-1"></i>
              Nueva Intervención
            </button>
          </div>
        </div>
      </div>
      
      <div class="card-body" v-if="currentTicket">
        <div class="row">
          <div class="col-md-3">
            <strong>Cliente:</strong><br>
            {{ currentTicket.razonSocial }}
            <small class="text-muted d-block">{{ currentTicket.codigoCliente }}</small>
          </div>
          <div class="col-md-3">
            <strong>Estado:</strong><br>
            <span class="badge" :class="getEstadoBadgeClass(currentTicket.estadoTicket)">
              {{ currentTicket.estadoTicket }}
            </span>
          </div>
          <div class="col-md-3">
            <strong>Técnico Principal:</strong><br>
            {{ currentTicket.technician?.nombre || 'No asignado' }}
          </div>
          <div class="col-md-3">
            <strong>Fecha Creación:</strong><br>
            {{ formatDate(currentTicket.fechaCreacion) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">Estado</label>
            <select 
              class="form-select" 
              v-model="filters.estadoTarea"
              @change="applyFilters"
            >
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="EnCurso">En Curso</option>
              <option value="Finalizada">Finalizada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
          
          <div class="col-md-3">
            <label class="form-label">Técnico</label>
            <select 
              class="form-select" 
              v-model="filters.tecnicoAsignadoId"
              @change="applyFilters"
            >
              <option value="">Todos</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.nombre }}
              </option>
            </select>
          </div>
          
          <div class="col-md-3">
            <label class="form-label">Fecha Desde</label>
            <input 
              type="date" 
              class="form-control" 
              v-model="filters.fechaDesde"
              @change="applyFilters"
            >
          </div>
          
          <div class="col-md-3">
            <label class="form-label">Fecha Hasta</label>
            <input 
              type="date" 
              class="form-control" 
              v-model="filters.fechaHasta"
              @change="applyFilters"
            >
          </div>
        </div>
        
        <div class="row mt-3">
          <div class="col">
            <button 
              class="btn btn-outline-secondary btn-sm"
              @click="clearFilters"
            >
              <i class="fas fa-times me-1"></i>
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-warning">
              <i class="fas fa-clock fa-2x"></i>
            </div>
            <h4 class="mt-2">{{ store.pendientes.length }}</h4>
            <p class="text-muted mb-0">Pendientes</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-info">
              <i class="fas fa-play fa-2x"></i>
            </div>
            <h4 class="mt-2">{{ store.enCurso.length }}</h4>
            <p class="text-muted mb-0">En Curso</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-success">
              <i class="fas fa-check fa-2x"></i>
            </div>
            <h4 class="mt-2">{{ store.finalizadas.length }}</h4>
            <p class="text-muted mb-0">Finalizadas</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-primary">
              <i class="fas fa-euro-sign fa-2x"></i>
            </div>
            <h4 class="mt-2">{{ formatCurrency(store.totalImporteMateriales) }}</h4>
            <p class="text-muted mb-0">Importe Materiales</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="store.hasError" class="alert alert-danger" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {{ store.error }}
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading && store.intervenciones.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2 text-muted">Cargando intervenciones...</p>
    </div>

    <!-- Tabla de intervenciones -->
    <div class="card" v-else>
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          Intervenciones ({{ store.total }})
        </h5>
        <div class="small text-muted">
          Página {{ store.page }} de {{ store.totalPages }}
        </div>
      </div>
      
      <!-- Vista de escritorio -->
      <div class="table-responsive d-none d-lg-block">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Fecha Prog.</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Duración</th>
              <th>Técnico</th>
              <th>Tipo Acción</th>
              <th>Estado</th>
              <th>Resultado</th>
              <th>Ubicación</th>
              <th>Adjuntos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.isEmpty && !store.isLoading">
              <td colspan="11" class="text-center py-5 text-muted">
                <i class="fas fa-tools fa-2x mb-3 d-block opacity-50"></i>
                No hay intervenciones registradas
              </td>
            </tr>
            <tr v-for="intervencion in store.intervenciones" :key="intervencion.id">
              <td>
                <small>{{ formatDateTime(intervencion.fechaHoraProgramada) }}</small>
              </td>
              <td>
                <small>{{ formatDateTime(intervencion.fechaHoraInicio) }}</small>
              </td>
              <td>
                <small>{{ formatDateTime(intervencion.fechaHoraFin) }}</small>
              </td>
              <td>
                <span v-if="intervencion.duracionMinutos" class="badge bg-light text-dark">
                  {{ intervencion.duracionMinutos }}min
                </span>
              </td>
              <td>
                <small>{{ intervencion.tecnico.displayName }}</small>
              </td>
              <td>
                <span class="badge bg-secondary">{{ intervencion.tipoAccion }}</span>
              </td>
              <td>
                <span class="badge" :class="getEstadoBadgeClass(intervencion.estadoTarea)">
                  {{ intervencion.estadoTarea }}
                </span>
              </td>
              <td>
                <span v-if="intervencion.resultado" class="badge" :class="getResultadoBadgeClass(intervencion.resultado)">
                  {{ intervencion.resultado }}
                </span>
              </td>
              <td>
                <small>{{ intervencion.ubicacion || '-' }}</small>
              </td>
              <td>
                <span v-if="intervencion.adjuntosJson" class="text-success">
                  <i class="fas fa-paperclip"></i>
                </span>
                <span v-if="intervencion.firmaClienteUrl" class="text-primary ms-1">
                  <i class="fas fa-signature"></i>
                </span>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button 
                    class="btn btn-outline-primary btn-sm"
                    @click="viewIntervencion(intervencion)"
                    title="Ver detalles"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button 
                    class="btn btn-outline-warning btn-sm"
                    @click="editIntervencion(intervencion)"
                    title="Editar"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-outline-danger btn-sm"
                    @click="deleteIntervencion(intervencion)"
                    title="Eliminar"
                    :disabled="intervencion.estadoTarea === 'Finalizada'"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vista móvil -->
      <div class="d-lg-none">
        <div v-if="store.isEmpty && !store.isLoading" class="text-center py-5 text-muted">
          <i class="fas fa-tools fa-2x mb-3 d-block opacity-50"></i>
          No hay intervenciones registradas
        </div>
        
        <div v-for="intervencion in store.intervenciones" :key="intervencion.id" class="card m-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 class="mb-1">{{ intervencion.tipoAccion }}</h6>
                <small class="text-muted">{{ intervencion.tecnico.displayName }}</small>
              </div>
              <span class="badge" :class="getEstadoBadgeClass(intervencion.estadoTarea)">
                {{ intervencion.estadoTarea }}
              </span>
            </div>
            
            <div class="row g-2 mb-3">
              <div class="col-6">
                <small class="text-muted">Programada:</small><br>
                <small>{{ formatDateTime(intervencion.fechaHoraProgramada) }}</small>
              </div>
              <div class="col-6" v-if="intervencion.duracionMinutos">
                <small class="text-muted">Duración:</small><br>
                <span class="badge bg-light text-dark">{{ intervencion.duracionMinutos }}min</span>
              </div>
            </div>
            
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span v-if="intervencion.resultado" class="badge me-1" :class="getResultadoBadgeClass(intervencion.resultado)">
                  {{ intervencion.resultado }}
                </span>
                <span v-if="intervencion.ubicacion" class="badge bg-info me-1">{{ intervencion.ubicacion }}</span>
                <span v-if="intervencion.adjuntosJson" class="text-success me-2">
                  <i class="fas fa-paperclip"></i>
                </span>
                <span v-if="intervencion.firmaClienteUrl" class="text-primary">
                  <i class="fas fa-signature"></i>
                </span>
              </div>
              <div class="btn-group btn-group-sm">
                <button 
                  class="btn btn-outline-primary btn-sm"
                  @click="viewIntervencion(intervencion)"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  class="btn btn-outline-warning btn-sm"
                  @click="editIntervencion(intervencion)"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="btn btn-outline-danger btn-sm"
                  @click="deleteIntervencion(intervencion)"
                  :disabled="intervencion.estadoTarea === 'Finalizada'"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div class="card-footer" v-if="store.totalPages > 1">
        <nav>
          <ul class="pagination pagination-sm justify-content-center mb-0">
            <li class="page-item" :class="{ disabled: store.page === 1 }">
              <button class="page-link" @click="changePage(store.page - 1)" :disabled="store.page === 1">
                Anterior
              </button>
            </li>
            
            <li v-for="pageNum in getVisiblePages()" :key="pageNum" 
                class="page-item" :class="{ active: pageNum === store.page }">
              <button class="page-link" @click="changePage(pageNum)">
                {{ pageNum }}
              </button>
            </li>
            
            <li class="page-item" :class="{ disabled: store.page === store.totalPages }">
              <button class="page-link" @click="changePage(store.page + 1)" :disabled="store.page === store.totalPages">
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Modal de formulario de intervención -->
    <IntervencionForm 
      v-if="showIntervencionForm"
      :show="showIntervencionForm"
      :intervencion="selectedIntervencion"
      :ticket-numero="$route.params.numero as string"
      @close="closeIntervencionForm"
      @saved="handleIntervencionSaved"
    />

    <!-- Modal de detalles de intervención -->
    <div v-if="showIntervencionDetails" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-tools me-2"></i>
              Detalles de Intervención
            </h5>
            <button type="button" class="btn-close" @click="showIntervencionDetails = false"></button>
          </div>
          <div class="modal-body" v-if="selectedIntervencion">
            <div class="row">
              <div class="col-md-6">
                <strong>Tipo Acción:</strong> {{ selectedIntervencion.tipoAccion }}<br>
                <strong>Estado:</strong> 
                <span class="badge ms-1" :class="getEstadoBadgeClass(selectedIntervencion.estadoTarea)">
                  {{ selectedIntervencion.estadoTarea }}
                </span><br>
                <strong>Técnico:</strong> {{ selectedIntervencion.tecnico.displayName }}<br>
                <strong>Ubicación:</strong> {{ selectedIntervencion.ubicacion || 'No especificada' }}<br>
              </div>
              <div class="col-md-6">
                <strong>Fecha Programada:</strong> {{ formatDateTime(selectedIntervencion.fechaHoraProgramada) }}<br>
                <strong>Fecha Inicio:</strong> {{ formatDateTime(selectedIntervencion.fechaHoraInicio) }}<br>
                <strong>Fecha Fin:</strong> {{ formatDateTime(selectedIntervencion.fechaHoraFin) }}<br>
                <strong>Duración:</strong> {{ selectedIntervencion.duracionMinutos ? `${selectedIntervencion.duracionMinutos} min` : 'No calculada' }}<br>
              </div>
            </div>
            
            <div class="mt-3" v-if="selectedIntervencion.descripcion">
              <strong>Descripción:</strong>
              <p class="mt-1">{{ selectedIntervencion.descripcion }}</p>
            </div>
            
            <!-- Materiales -->
            <div class="mt-3" v-if="selectedIntervencion.materiales.length > 0">
              <strong>Materiales ({{ selectedIntervencion.materiales.length }}):</strong>
              <div class="table-responsive mt-2">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Descuento</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="material in selectedIntervencion.materiales" :key="material.id">
                      <td>{{ material.codigoArticulo }}</td>
                      <td>{{ material.unidadesUtilizadas }}</td>
                      <td>{{ formatCurrency(material.precio) }}</td>
                      <td>{{ material.descuento }}%</td>
                      <td>{{ formatCurrency(material.importeTotal) }}</td>
                    </tr>
                    <tr class="table-primary fw-bold">
                      <td colspan="4">Total Materiales:</td>
                      <td>{{ formatCurrency(selectedIntervencion.totales.importeTotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showIntervencionDetails = false">
              Cerrar
            </button>
            <button type="button" class="btn btn-primary" @click="editIntervencion(selectedIntervencion)">
              <i class="fas fa-edit me-1"></i>
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useIntervencionesStore } from '@/stores/intervenciones';
import { useTicketsStore } from '@/stores/tickets';
import { apiService, type Intervencion, type Technician } from '@/services/api';
import IntervencionForm from '@/components/IntervencionForm.vue';

const route = useRoute();
const store = useIntervencionesStore();
const ticketsStore = useTicketsStore();

// State
const showIntervencionForm = ref(false);
const showIntervencionDetails = ref(false);
const selectedIntervencion = ref<Intervencion | null>(null);
const technicians = ref<Technician[]>([]);

const filters = reactive({
  estadoTarea: '',
  tecnicoAsignadoId: '',
  fechaDesde: '',
  fechaHasta: '',
});

// Computed
const currentTicket = computed(() => ticketsStore.currentTicket);

// Methods
const loadData = async () => {
  const numeroTicket = route.params.numero as string;
  
  try {
    // Load ticket info
    await ticketsStore.getTicket(numeroTicket);
    
    // Load technicians for filters
    technicians.value = await apiService.technicians.list();
    
    // Load interventions
    await store.fetchIntervenciones(numeroTicket);
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

const applyFilters = async () => {
  const numeroTicket = route.params.numero as string;
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== '')
  );
  
  await store.fetchIntervenciones(numeroTicket, activeFilters);
};

const clearFilters = async () => {
  Object.keys(filters).forEach(key => {
    (filters as any)[key] = '';
  });
  
  const numeroTicket = route.params.numero as string;
  store.clearFilters();
  await store.fetchIntervenciones(numeroTicket);
};

const changePage = async (page: number) => {
  if (page < 1 || page > store.totalPages) return;
  
  const numeroTicket = route.params.numero as string;
  await store.fetchIntervenciones(numeroTicket, { ...filters, page });
};

const getVisiblePages = () => {
  const current = store.page;
  const total = store.totalPages;
  const delta = 2;
  const range = [];
  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);

  if (total <= 1) return [];

  // Always show first page
  range.push(1);

  // Add dots if needed
  if (start > 2) range.push('...');

  // Add pages around current
  for (let i = start; i <= end; i++) {
    if (i !== 1 && i !== total) range.push(i);
  }

  // Add dots if needed
  if (end < total - 1) range.push('...');

  // Always show last page if more than 1
  if (total > 1) range.push(total);

  return range;
};

// Intervención actions
const viewIntervencion = (intervencion: Intervencion) => {
  selectedIntervencion.value = intervencion;
  showIntervencionDetails.value = true;
};

const editIntervencion = (intervencion: Intervencion) => {
  selectedIntervencion.value = intervencion;
  showIntervencionDetails.value = false;
  showIntervencionForm.value = true;
};

const deleteIntervencion = async (intervencion: Intervencion) => {
  if (intervencion.estadoTarea === 'Finalizada') {
    alert('No se puede eliminar una intervención finalizada');
    return;
  }
  
  if (confirm(`¿Está seguro de eliminar la intervención "${intervencion.tipoAccion}"?`)) {
    try {
      await store.deleteIntervencion(intervencion.id);
    } catch (error) {
      console.error('Error deleting intervention:', error);
    }
  }
};

const closeIntervencionForm = () => {
  showIntervencionForm.value = false;
  selectedIntervencion.value = null;
};

const handleIntervencionSaved = async () => {
  closeIntervencionForm();
  const numeroTicket = route.params.numero as string;
  await store.fetchIntervenciones(numeroTicket, filters);
};

// Utility functions
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES');
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('es-ES');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount);
};

const getEstadoBadgeClass = (estado: string) => {
  const classes: { [key: string]: string } = {
    'Pendiente': 'bg-warning text-dark',
    'EnCurso': 'bg-info text-white',
    'Finalizada': 'bg-success text-white',
    'Cancelada': 'bg-danger text-white',
    'ABIERTO': 'bg-warning text-dark',
    'ASIGNADA': 'bg-info text-white',
    'EN_PROCESO': 'bg-primary text-white',
    'PENDIENTE': 'bg-warning text-dark',
  };
  return classes[estado] || 'bg-secondary text-white';
};

const getResultadoBadgeClass = (resultado: string) => {
  const classes: { [key: string]: string } = {
    'Resuelto': 'bg-success text-white',
    'NoResuelto': 'bg-danger text-white',
    'PendientePiezas': 'bg-warning text-dark',
    'Escalado': 'bg-info text-white',
  };
  return classes[resultado] || 'bg-secondary text-white';
};

// Lifecycle
onMounted(() => {
  loadData();
});

// Watch for route changes
watch(() => route.params.numero, (newNumero) => {
  if (newNumero) {
    store.clearAll();
    loadData();
  }
});
</script>

<style scoped>
.interventions-view {
  padding: 20px;
}

.table td {
  vertical-align: middle;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

@media (max-width: 768px) {
  .interventions-view {
    padding: 10px;
  }
  
  .card.m-3 {
    margin: 0.5rem !important;
  }
}
</style>