<template>
  <div class="container-fluid py-4" v-if="tecnico">
    <!-- Header -->
    <div class="row">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header pb-0">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center">
                <div 
                  class="avatar avatar-xl me-3"
                  :style="{ backgroundColor: tecnico.color || '#6c757d' }"
                >
                  <span class="text-white text-lg font-weight-bold">
                    {{ getInitials(tecnico.nombre) }}
                  </span>
                </div>
                <div>
                  <h4 class="mb-0">{{ tecnico.nombre }}</h4>
                  <p class="text-sm mb-0">
                    <span 
                      class="badge badge-sm me-2"
                      :class="tecnico.activo ? 'bg-gradient-success' : 'bg-gradient-secondary'"
                    >
                      {{ tecnico.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                    ID: {{ tecnico.id }}
                  </p>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-outline-primary btn-sm"
                  @click="$router.push(`/config/tecnicos/${tecnico.id}/editar`)"
                >
                  <i class="fas fa-edit me-1"></i>
                  Editar
                </button>
                <button 
                  class="btn btn-outline-secondary btn-sm"
                  @click="$router.push('/config/tecnicos')"
                >
                  <i class="fas fa-arrow-left me-1"></i>
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="row mb-4">
      <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
        <div class="card">
          <div class="card-body p-3">
            <div class="row">
              <div class="col-8">
                <div class="numbers">
                  <p class="text-sm mb-0 text-capitalize font-weight-bold">Intervenciones Mes</p>
                  <h5 class="font-weight-bolder mb-0">
                    {{ kpis.intervencionesEsteMes }}
                  </h5>
                </div>
              </div>
              <div class="col-4 text-end">
                <div class="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                  <i class="ni ni-calendar-grid-58 text-lg opacity-10" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
        <div class="card">
          <div class="card-body p-3">
            <div class="row">
              <div class="col-8">
                <div class="numbers">
                  <p class="text-sm mb-0 text-capitalize font-weight-bold">Duración Media</p>
                  <h5 class="font-weight-bolder mb-0">
                    {{ kpis.duracionMedia }}min
                  </h5>
                </div>
              </div>
              <div class="col-4 text-end">
                <div class="icon icon-shape bg-gradient-info shadow text-center border-radius-md">
                  <i class="ni ni-time-alarm text-lg opacity-10" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
        <div class="card">
          <div class="card-body p-3">
            <div class="row">
              <div class="col-8">
                <div class="numbers">
                  <p class="text-sm mb-0 text-capitalize font-weight-bold">Tasa Resolución</p>
                  <h5 class="font-weight-bolder mb-0">
                    {{ kpis.tasaResolucion }}%
                  </h5>
                </div>
              </div>
              <div class="col-4 text-end">
                <div class="icon icon-shape bg-gradient-success shadow text-center border-radius-md">
                  <i class="ni ni-check-bold text-lg opacity-10" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-sm-6">
        <div class="card">
          <div class="card-body p-3">
            <div class="row">
              <div class="col-8">
                <div class="numbers">
                  <p class="text-sm mb-0 text-capitalize font-weight-bold">Ingresos Mes</p>
                  <h5 class="font-weight-bolder mb-0">
                    €{{ kpis.ingresosMes }}
                  </h5>
                </div>
              </div>
              <div class="col-4 text-end">
                <div class="icon icon-shape bg-gradient-warning shadow text-center border-radius-md">
                  <i class="ni ni-money-coins text-lg opacity-10" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <ul class="nav nav-tabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link"
                  :class="{ active: activeTab === 'perfil' }"
                  @click="activeTab = 'perfil'"
                  type="button"
                >
                  <i class="fas fa-user me-2"></i>
                  Perfil
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link"
                  :class="{ active: activeTab === 'agenda' }"
                  @click="activeTab = 'agenda'"
                  type="button"
                >
                  <i class="fas fa-calendar me-2"></i>
                  Agenda
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link"
                  :class="{ active: activeTab === 'historial' }"
                  @click="activeTab = 'historial'"
                  type="button"
                >
                  <i class="fas fa-history me-2"></i>
                  Historial
                </button>
              </li>
            </ul>
          </div>

          <div class="card-body">
            <!-- Tab Perfil -->
            <div v-if="activeTab === 'perfil'" class="tab-pane active">
              <div class="row">
                <div class="col-md-6">
                  <h6>Información de Contacto</h6>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between">
                      <span><i class="fas fa-envelope me-2 text-primary"></i>Email:</span>
                      <span class="font-weight-bold">{{ tecnico.email }}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span><i class="fas fa-phone me-2 text-primary"></i>Teléfono:</span>
                      <span class="font-weight-bold">{{ tecnico.telefono || 'N/A' }}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span><i class="fas fa-user me-2 text-primary"></i>Usuario:</span>
                      <span class="font-weight-bold">{{ usuario?.displayName || 'N/A' }}</span>
                    </li>
                  </ul>

                  <h6 class="mt-4">Especialidades</h6>
                  <div class="d-flex flex-wrap gap-1 mb-3">
                    <span 
                      v-for="esp in tecnico.especialidades" 
                      :key="esp"
                      class="badge bg-gradient-info"
                    >
                      {{ getEspecialidadLabel(esp) }}
                    </span>
                    <span v-if="!tecnico.especialidades?.length" class="text-muted">
                      Sin especialidades asignadas
                    </span>
                  </div>

                  <h6>Zonas de Trabajo</h6>
                  <div class="d-flex flex-wrap gap-1">
                    <span 
                      v-for="zona in tecnico.zonas" 
                      :key="zona"
                      class="badge bg-gradient-secondary"
                    >
                      {{ zona }}
                    </span>
                    <span v-if="!tecnico.zonas?.length" class="text-muted">
                      Sin zonas asignadas
                    </span>
                  </div>
                </div>

                <div class="col-md-6">
                  <h6>Información Operativa</h6>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between">
                      <span><i class="fas fa-euro-sign me-2 text-warning"></i>Tarifa/Hora:</span>
                      <span class="font-weight-bold">
                        {{ tecnico.tarifaHora ? `${tecnico.tarifaHora}€` : 'N/A' }}
                      </span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span><i class="fas fa-clock me-2 text-info"></i>Capacidad Diaria:</span>
                      <span class="font-weight-bold">
                        {{ tecnico.capacidadDia ? `${Math.round(tecnico.capacidadDia/60)}h` : 'N/A' }}
                      </span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      <span><i class="fas fa-palette me-2 text-secondary"></i>Color Calendario:</span>
                      <div class="d-flex align-items-center gap-2">
                        <div 
                          class="rounded-circle"
                          :style="{ 
                            backgroundColor: tecnico.color,
                            width: '20px',
                            height: '20px'
                          }"
                        ></div>
                        <span class="font-weight-bold">{{ tecnico.color }}</span>
                      </div>
                    </li>
                  </ul>

                  <h6 class="mt-4">Firma Digital</h6>
                  <div v-if="tecnico.firmaUrl" class="mb-3">
                    <img 
                      :src="tecnico.firmaUrl" 
                      alt="Firma"
                      class="img-thumbnail"
                      style="max-width: 250px; max-height: 120px;"
                    />
                  </div>
                  <span v-else class="text-muted">Sin firma digital</span>

                  <h6 class="mt-4">Notas</h6>
                  <p class="text-sm">
                    {{ tecnico.notas || 'Sin notas adicionales' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Tab Agenda -->
            <div v-if="activeTab === 'agenda'" class="tab-pane active">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>Agenda de {{ tecnico.nombre }}</h6>
                <button 
                  class="btn btn-primary btn-sm"
                  @click="openNewIntervention"
                >
                  <i class="fas fa-plus me-1"></i>
                  Nueva Intervención
                </button>
              </div>
              
              <!-- Calendar placeholder -->
              <div class="text-center py-5 border rounded">
                <i class="fas fa-calendar-alt text-muted" style="font-size: 3rem;"></i>
                <h6 class="text-muted mt-3">Vista de Calendario</h6>
                <p class="text-muted">
                  La integración del calendario estará disponible próximamente.<br>
                  Aquí se mostrarán las intervenciones programadas del técnico.
                </p>
              </div>

              <!-- Recent interventions -->
              <h6 class="mt-4 mb-3">Intervenciones Recientes</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Ticket</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="recentInterventions.length === 0">
                      <td colspan="5" class="text-center text-muted">
                        No hay intervenciones recientes
                      </td>
                    </tr>
                    <tr v-for="intervention in recentInterventions" :key="intervention.id">
                      <td>{{ formatDate(intervention.fechaHoraInicio) }}</td>
                      <td>
                        <a :href="`/tickets/${intervention.numeroTicket}`" class="text-primary">
                          {{ intervention.numeroTicket }}
                        </a>
                      </td>
                      <td>{{ intervention.tipoAccion }}</td>
                      <td>
                        <span 
                          class="badge badge-sm"
                          :class="getEstadoBadgeClass(intervention.estadoTarea)"
                        >
                          {{ intervention.estadoTarea }}
                        </span>
                      </td>
                      <td>{{ intervention.duracionMinutos || 'N/A' }}min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Tab Historial -->
            <div v-if="activeTab === 'historial'" class="tab-pane active">
              <h6>Historial de Auditoría</h6>
              <div class="timeline timeline-one-side" data-timeline-axis-style="dashed">
                <div v-if="auditLogs.length === 0" class="text-center py-4 text-muted">
                  No hay registros de auditoría disponibles
                </div>
                
                <div 
                  v-for="log in auditLogs" 
                  :key="log.id"
                  class="timeline-block mb-3"
                >
                  <span class="timeline-step">
                    <i class="fas fa-info-circle text-primary"></i>
                  </span>
                  <div class="timeline-content">
                    <h6 class="text-dark text-sm font-weight-bold mb-0">
                      {{ getAuditActionLabel(log.action) }}
                    </h6>
                    <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">
                      {{ formatDateTime(log.createdAt) }}
                    </p>
                    <p class="text-sm mt-3 mb-2">
                      {{ log.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTecnicosStore } from '@/stores/tecnicos';
import { useUsersStore } from '@/stores/users';

const route = useRoute();
const router = useRouter();
const tecnicosStore = useTecnicosStore();
const usersStore = useUsersStore();

const tecnico = ref<any>(null);
const usuario = ref<any>(null);
const activeTab = ref('perfil');
const recentInterventions = ref<any[]>([]);
const auditLogs = ref<any[]>([]);

const kpis = ref({
  intervencionesEsteMes: 0,
  duracionMedia: 0,
  tasaResolucion: 0,
  ingresosMes: 0
});

const getInitials = (nombre: string) => {
  return nombre
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getEspecialidadLabel = (esp: string) => {
  const labels: Record<string, string> = {
    'Informatica': 'Informática',
    'ImpHW': 'Imp. HW',
    'ImpSW': 'Imp. SW'
  };
  return labels[esp] || esp;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES');
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-ES');
};

const getEstadoBadgeClass = (estado: string) => {
  const classes: Record<string, string> = {
    'PENDIENTE': 'bg-gradient-warning',
    'EN_CURSO': 'bg-gradient-info',
    'FINALIZADA': 'bg-gradient-success',
    'CANCELADA': 'bg-gradient-secondary'
  };
  return classes[estado] || 'bg-gradient-secondary';
};

const getAuditActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    'CREATE': 'Técnico creado',
    'UPDATE': 'Técnico actualizado',
    'ACTIVATE': 'Técnico activado',
    'DEACTIVATE': 'Técnico desactivado'
  };
  return labels[action] || action;
};

const openNewIntervention = () => {
  // TODO: Open intervention form modal with technician pre-selected
  console.log('Open new intervention for technician:', tecnico.value.id);
};

const loadTecnicoData = async () => {
  try {
    const id = route.params.id as string;
    tecnico.value = await tecnicosStore.get(id);
    
    if (tecnico.value.usuarioId) {
      usuario.value = await usersStore.getUser(tecnico.value.usuarioId);
    }
    
    // Load KPIs
    kpis.value = await tecnicosStore.getKpis(id);
    
    // Load recent interventions
    recentInterventions.value = await tecnicosStore.getRecentInterventions(id);
    
    // Load audit logs
    auditLogs.value = await tecnicosStore.getAuditLogs(id);
    
  } catch (error) {
    console.error('Error loading tecnico data:', error);
    router.push('/config/tecnicos');
  }
};

onMounted(() => {
  loadTecnicoData();
});
</script>

<style scoped>
.avatar-xl {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-tabs .nav-link {
  border: none;
  color: #67748e;
  font-weight: 600;
}

.nav-tabs .nav-link.active {
  color: #344767;
  border-bottom: 2px solid #344767;
  background: none;
}

.timeline-step {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  left: -12px;
  background: white;
  border: 1px solid #e9ecef;
}

.timeline-content {
  margin-left: 30px;
}

.list-group-item {
  border: none;
  padding: 0.5rem 0;
}
</style>