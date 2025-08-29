<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="row">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header pb-0">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6>Gestión de Técnicos</h6>
                <p class="text-sm mb-0">
                  Administra los técnicos del sistema - especialidades, zonas y capacidades
                </p>
              </div>
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-outline-primary btn-sm"
                  @click="exportCsv"
                  :disabled="tecnicosStore.loading"
                >
                  <i class="fas fa-download me-1"></i>
                  Exportar CSV
                </button>
                <button 
                  class="btn btn-primary btn-sm"
                  @click="$router.push('/config/tecnicos/nuevo')"
                >
                  <i class="fas fa-plus me-1"></i>
                  Nuevo Técnico
                </button>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="card-body pt-2">
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <div class="form-group">
                  <input 
                    type="text" 
                    class="form-control form-control-sm" 
                    placeholder="Buscar por nombre, email..."
                    v-model="filters.q"
                    @input="debouncedSearch"
                  />
                </div>
              </div>
              <div class="col-md-2">
                <select 
                  class="form-select form-select-sm" 
                  v-model="filters.activo"
                  @change="fetchTecnicos"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
              <div class="col-md-3">
                <select 
                  class="form-select form-select-sm" 
                  v-model="filters.especialidad"
                  @change="fetchTecnicos"
                >
                  <option value="">Todas las especialidades</option>
                  <option value="Informatica">Informática</option>
                  <option value="ImpHW">Impresoras Hardware</option>
                  <option value="ImpSW">Impresoras Software</option>
                </select>
              </div>
              <div class="col-md-3">
                <select 
                  class="form-select form-select-sm" 
                  v-model="filters.zona"
                  @change="fetchTecnicos"
                >
                  <option value="">Todas las zonas</option>
                  <option value="Andorra la Vella">Andorra la Vella</option>
                  <option value="Escaldes">Escaldes-Engordany</option>
                  <option value="Encamp">Encamp</option>
                  <option value="La Massana">La Massana</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="table-responsive">
            <table class="table align-items-center mb-0">
              <thead>
                <tr>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Técnico
                  </th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Contacto
                  </th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Estado
                  </th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Especialidades
                  </th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Zonas
                  </th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Tarifa/h
                  </th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Capacidad
                  </th>
                  <th class="text-secondary opacity-7">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="tecnicosStore.loading">
                  <td colspan="8" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Cargando...</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="tecnicosStore.isEmpty">
                  <td colspan="8" class="text-center py-4 text-muted">
                    No hay técnicos registrados
                  </td>
                </tr>
                <tr v-else v-for="tecnico in tecnicosStore.items" :key="tecnico.id">
                  <td>
                    <div class="d-flex px-2 py-1">
                      <div 
                        class="avatar avatar-sm me-3"
                        :style="{ backgroundColor: tecnico.color || '#6c757d' }"
                      >
                        <span class="text-white text-sm font-weight-bold">
                          {{ getInitials(tecnico.nombre) }}
                        </span>
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">{{ tecnico.nombre }}</h6>
                        <p class="text-xs text-secondary mb-0">ID: {{ tecnico.id.slice(-8) }}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p class="text-xs font-weight-bold mb-0">{{ tecnico.email }}</p>
                    <p class="text-xs text-secondary mb-0">{{ tecnico.telefono || 'N/A' }}</p>
                  </td>
                  <td>
                    <span 
                      class="badge badge-sm"
                      :class="tecnico.activo ? 'bg-gradient-success' : 'bg-gradient-secondary'"
                    >
                      {{ tecnico.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <span 
                        v-for="esp in tecnico.especialidades" 
                        :key="esp"
                        class="badge bg-gradient-info badge-sm"
                      >
                        {{ getEspecialidadLabel(esp) }}
                      </span>
                      <span v-if="!tecnico.especialidades?.length" class="text-muted text-xs">
                        Sin especialidades
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <span 
                        v-for="zona in tecnico.zonas" 
                        :key="zona"
                        class="badge bg-gradient-secondary badge-sm"
                      >
                        {{ zona }}
                      </span>
                      <span v-if="!tecnico.zonas?.length" class="text-muted text-xs">
                        Sin zonas
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="text-secondary text-xs font-weight-bold">
                      {{ tecnico.tarifaHora ? `${tecnico.tarifaHora}€/h` : 'N/A' }}
                    </span>
                  </td>
                  <td>
                    <span class="text-secondary text-xs font-weight-bold">
                      {{ tecnico.capacidadDia ? `${Math.round(tecnico.capacidadDia/60)}h/día` : 'N/A' }}
                    </span>
                  </td>
                  <td class="align-middle">
                    <div class="dropdown">
                      <button 
                        class="btn btn-link text-secondary mb-0" 
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i class="fas fa-ellipsis-v text-xs"></i>
                      </button>
                      <ul class="dropdown-menu">
                        <li>
                          <a 
                            class="dropdown-item" 
                            href="#" 
                            @click.prevent="$router.push(`/config/tecnicos/${tecnico.id}`)"
                          >
                            <i class="fas fa-eye me-2"></i> Ver detalle
                          </a>
                        </li>
                        <li>
                          <a 
                            class="dropdown-item" 
                            href="#" 
                            @click.prevent="$router.push(`/config/tecnicos/${tecnico.id}/editar`)"
                          >
                            <i class="fas fa-edit me-2"></i> Editar
                          </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                          <a 
                            class="dropdown-item" 
                            href="#" 
                            @click.prevent="toggleActivation(tecnico)"
                            :class="tecnico.activo ? 'text-warning' : 'text-success'"
                          >
                            <i :class="tecnico.activo ? 'fas fa-pause me-2' : 'fas fa-play me-2'"></i>
                            {{ tecnico.activo ? 'Desactivar' : 'Activar' }}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="card-footer d-flex justify-content-between align-items-center" v-if="tecnicosStore.total > 0">
            <span class="text-sm text-muted">
              Mostrando {{ ((tecnicosStore.page - 1) * tecnicosStore.pageSize) + 1 }} a 
              {{ Math.min(tecnicosStore.page * tecnicosStore.pageSize, tecnicosStore.total) }} de 
              {{ tecnicosStore.total }} técnicos
            </span>
            
            <nav aria-label="Paginación">
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: tecnicosStore.page <= 1 }">
                  <a 
                    class="page-link" 
                    href="#" 
                    @click.prevent="changePage(tecnicosStore.page - 1)"
                    :disabled="tecnicosStore.page <= 1"
                  >
                    Anterior
                  </a>
                </li>
                
                <li 
                  v-for="page in visiblePages" 
                  :key="page"
                  class="page-item" 
                  :class="{ active: page === tecnicosStore.page }"
                >
                  <a 
                    class="page-link" 
                    href="#" 
                    @click.prevent="changePage(page)"
                  >
                    {{ page }}
                  </a>
                </li>
                
                <li 
                  class="page-item" 
                  :class="{ disabled: tecnicosStore.page >= Math.ceil(tecnicosStore.total / tecnicosStore.pageSize) }"
                >
                  <a 
                    class="page-link" 
                    href="#" 
                    @click.prevent="changePage(tecnicosStore.page + 1)"
                    :disabled="tecnicosStore.page >= Math.ceil(tecnicosStore.total / tecnicosStore.pageSize)"
                  >
                    Siguiente
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTecnicosStore } from '@/stores/tecnicos';
import { debounce } from 'lodash-es';

const tecnicosStore = useTecnicosStore();

const filters = ref({
  q: '',
  activo: '',
  especialidad: '',
  zona: ''
});

const debouncedSearch = debounce(() => {
  fetchTecnicos();
}, 500);

const fetchTecnicos = async () => {
  await tecnicosStore.fetch({
    ...filters.value,
    page: tecnicosStore.page,
    pageSize: tecnicosStore.pageSize
  });
};

const changePage = async (page: number) => {
  if (page >= 1 && page <= Math.ceil(tecnicosStore.total / tecnicosStore.pageSize)) {
    await tecnicosStore.fetch({
      ...filters.value,
      page,
      pageSize: tecnicosStore.pageSize
    });
  }
};

const visiblePages = computed(() => {
  const totalPages = Math.ceil(tecnicosStore.total / tecnicosStore.pageSize);
  const current = tecnicosStore.page;
  const pages = [];
  
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
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

const toggleActivation = async (tecnico: any) => {
  if (tecnico.activo) {
    // TODO: Check for future interventions
    if (confirm(`¿Estás seguro de que quieres desactivar a ${tecnico.nombre}?`)) {
      await tecnicosStore.deactivate(tecnico.id);
      await fetchTecnicos();
    }
  } else {
    await tecnicosStore.activate(tecnico.id);
    await fetchTecnicos();
  }
};

const exportCsv = async () => {
  await tecnicosStore.exportCsv();
};

onMounted(() => {
  fetchTecnicos();
});
</script>

<style scoped>
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
}

.badge {
  font-size: 0.75rem;
}

.dropdown-menu {
  font-size: 0.875rem;
}
</style>