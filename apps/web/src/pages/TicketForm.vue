<template>
  <div class="ticket-form">
    <!-- Header -->
    <div class="row align-items-center mb-4">
      <div class="col">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item">
              <router-link to="/tickets" class="text-decoration-none">Tickets</router-link>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              {{ isEditing ? 'Editar Ticket' : 'Nuevo Ticket' }}
            </li>
          </ol>
        </nav>
        <h1 class="h3 mb-0">
          {{ isEditing ? `Editar Ticket ${ticketId}` : 'Nuevo Ticket' }}
        </h1>
      </div>
      <div class="col-auto">
        <div class="btn-group">
          <router-link 
            v-if="isEditing" 
            :to="`/tickets/${ticketId}/intervenciones`" 
            class="btn btn-primary"
          >
            <i class="fas fa-tools me-2"></i>
            Intervenciones
          </router-link>
          <router-link to="/tickets" class="btn btn-outline-secondary">
            <i class="fas fa-arrow-left me-2"></i>
            Volver
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="fas fa-exclamation-circle me-2"></i>
      {{ error }}
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit">
      <!-- Datos Básicos -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Datos Básicos</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Número de Ticket</label>
                <input 
                  v-model="form.numeroTicket" 
                  type="text" 
                  class="form-control" 
                  :readonly="isEditing"
                  placeholder="Se genera automáticamente"
                >
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Usuario Creación *</label>
                <input 
                  v-model="form.usuarioCreacion" 
                  type="text" 
                  class="form-control" 
                  required
                  placeholder="Usuario que crea el ticket"
                >
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Tipo de Ticket *</label>
                <select v-model="form.tipoTicket" class="form-select" required>
                  <option value="">Seleccionar tipo</option>
                  <option value="IMPRESORA_SOFTWARE">Impresora Software</option>
                  <option value="IMPRESORA_HARDWARE">Impresora Hardware</option>
                  <option value="INFORMATICA">Informática</option>
                  <option value="INTERNO">Interno</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Categoría</label>
                <input 
                  v-model="form.categoria" 
                  type="text" 
                  class="form-control" 
                  placeholder="Ej: Atasco de papel"
                >
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Subcategoría</label>
                <input 
                  v-model="form.subCategoria" 
                  type="text" 
                  class="form-control" 
                  placeholder="Ej: Bandeja principal"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cliente -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-building me-2"></i>Información del Cliente</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Cliente *</label>
                <select 
                  v-model="form.codigoCliente" 
                  class="form-select" 
                  required
                  @change="onClientChange"
                >
                  <option value="">Seleccionar cliente</option>
                  <option 
                    v-for="client in clientsStore.clients" 
                    :key="client.codigoCliente"
                    :value="client.codigoCliente"
                  >
                    {{ client.razonSocial }} ({{ client.codigoCliente }})
                  </option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Razón Social *</label>
                <input 
                  v-model="form.razonSocial" 
                  type="text" 
                  class="form-control" 
                  required
                  readonly
                >
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Contacto</label>
                <input 
                  v-model="form.contacto" 
                  type="text" 
                  class="form-control"
                >
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Teléfono</label>
                <input 
                  v-model="form.telefono" 
                  type="text" 
                  class="form-control"
                >
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input 
                  v-model="form.email" 
                  type="email" 
                  class="form-control"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contrato -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-file-contract me-2"></i>Contrato (Opcional)</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Buscar por Número de Serie</label>
                <input 
                  v-model="contractSearch" 
                  type="text" 
                  class="form-control" 
                  placeholder="Escriba el número de serie..."
                  @input="searchContracts"
                >
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">Contrato</label>
                <select v-model="form.contratoId" class="form-select">
                  <option value="">Sin contrato</option>
                  <option 
                    v-for="contract in availableContracts" 
                    :key="contract.id"
                    :value="contract.id"
                  >
                    {{ contract.numeroSerie }} - {{ contract.marca }} {{ contract.modelo }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Número de Serie</label>
            <input 
              v-model="form.numeroSerie" 
              type="text" 
              class="form-control"
              placeholder="Número de serie del equipo"
            >
          </div>
        </div>
      </div>

      <!-- Estado y Asignación -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-tasks me-2"></i>Estado y Asignación</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <div class="mb-3">
                <label class="form-label">Estado</label>
                <select v-model="form.estadoTicket" class="form-select">
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
            </div>
            <div class="col-md-3">
              <div class="mb-3">
                <label class="form-label">Origen *</label>
                <select v-model="form.origen" class="form-select" required>
                  <option value="">Seleccionar origen</option>
                  <option value="TELEFONO">Teléfono</option>
                  <option value="WEB">Web</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
            </div>
            <div class="col-md-3">
              <div class="mb-3">
                <label class="form-label">Urgencia</label>
                <select v-model="form.urgencia" class="form-select">
                  <option value="NORMAL">Normal</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="EXTREMA">Extrema</option>
                </select>
              </div>
            </div>
            <div class="col-md-3">
              <div class="mb-3">
                <label class="form-label">Técnico</label>
                <select v-model="form.technicianId" class="form-select">
                  <option value="">Sin asignar</option>
                  <option 
                    v-for="technician in techniciansStore.technicians" 
                    :key="technician.id"
                    :value="technician.id"
                  >
                    {{ technician.nombre }} ({{ technician.perfil }})
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detalle -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-comment me-2"></i>Detalle</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label class="form-label">Descripción del problema</label>
            <textarea 
              v-model="form.detalle" 
              class="form-control" 
              rows="4"
              placeholder="Describa detalladamente el problema o solicitud..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Fechas -->
      <div class="card mb-4" v-if="isEditing">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-calendar me-2"></i>Fechas</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Fecha Creación</label>
                <input 
                  :value="formatDateTime(form.fechaCreacion)" 
                  type="text" 
                  class="form-control" 
                  readonly
                >
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">Última Actualización</label>
                <input 
                  :value="formatDateTime(form.fechaUltimaActualizacion)" 
                  type="text" 
                  class="form-control" 
                  readonly
                >
              </div>
            </div>
            <div class="col-md-4" v-if="form.estadoTicket !== 'ABIERTO'">
              <div class="mb-3">
                <label class="form-label">Fecha Cierre</label>
                <input 
                  v-model="form.fechaCierre" 
                  type="datetime-local" 
                  class="form-control"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <button 
                v-if="isEditing" 
                @click="deleteTicket" 
                type="button" 
                class="btn btn-danger"
              >
                <i class="fas fa-trash me-2"></i>
                Eliminar
              </button>
            </div>
            <div class="d-flex gap-2">
              <router-link to="/tickets" class="btn btn-outline-secondary">
                Cancelar
              </router-link>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <i class="fas fa-save me-2"></i>
                {{ isEditing ? 'Actualizar' : 'Crear' }} Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTicketsStore, useClientsStore, useTechniciansStore, useContractsStore } from '@/store';
import type { TicketCreateInput } from '@/services/api';

const route = useRoute();
const router = useRouter();

const ticketsStore = useTicketsStore();
const clientsStore = useClientsStore();
const techniciansStore = useTechniciansStore();
const contractsStore = useContractsStore();

const ticketId = computed(() => route.params.id as string);
const isEditing = computed(() => !!ticketId.value);

const loading = ref(false);
const error = ref<string | null>(null);

const contractSearch = ref('');
const availableContracts = ref<any[]>([]);

// Form data
const form = ref<TicketCreateInput & { numeroTicket?: string; fechaCreacion?: string; fechaUltimaActualizacion?: string; fechaCierre?: string }>({
  usuarioCreacion: 'admin',
  tipoTicket: '',
  categoria: '',
  subCategoria: '',
  codigoCliente: '',
  razonSocial: '',
  contacto: '',
  telefono: '',
  email: '',
  contratoId: '',
  numeroSerie: '',
  estadoTicket: 'ABIERTO',
  origen: '',
  urgencia: 'NORMAL',
  detalle: '',
  technicianId: '',
});

// Methods
const loadTicket = async () => {
  if (!isEditing.value) return;

  loading.value = true;
  error.value = null;

  try {
    const ticket = await ticketsStore.getTicket(ticketId.value);
    
    // Map ticket data to form
    Object.assign(form.value, {
      numeroTicket: ticket.numeroTicket,
      usuarioCreacion: ticket.usuarioCreacion,
      tipoTicket: ticket.tipoTicket,
      categoria: ticket.categoria || '',
      subCategoria: ticket.subCategoria || '',
      codigoCliente: ticket.codigoCliente,
      razonSocial: ticket.razonSocial,
      contacto: ticket.contacto || '',
      telefono: ticket.telefono || '',
      email: ticket.email || '',
      contratoId: ticket.contratoId || '',
      numeroSerie: ticket.numeroSerie || '',
      estadoTicket: ticket.estadoTicket,
      origen: ticket.origen,
      urgencia: ticket.urgencia,
      detalle: ticket.detalle || '',
      technicianId: ticket.technicianId || '',
      fechaCreacion: ticket.fechaCreacion,
      fechaUltimaActualizacion: ticket.fechaUltimaActualizacion,
      fechaCierre: ticket.fechaCierre ? new Date(ticket.fechaCierre).toISOString().slice(0, 16) : '',
    });

    // Load client contracts if client is selected
    if (form.value.codigoCliente) {
      await loadClientContracts(form.value.codigoCliente);
    }
  } catch (err: any) {
    error.value = err.message || 'Error al cargar el ticket';
  } finally {
    loading.value = false;
  }
};

const onClientChange = async () => {
  const selectedClient = clientsStore.clients.find(c => c.codigoCliente === form.value.codigoCliente);
  if (selectedClient) {
    form.value.razonSocial = selectedClient.razonSocial;
    form.value.contacto = selectedClient.contacto || '';
    form.value.telefono = selectedClient.telefono || '';
    form.value.email = selectedClient.email || '';
    
    // Load client contracts
    await loadClientContracts(selectedClient.codigoCliente);
  } else {
    form.value.razonSocial = '';
    form.value.contacto = '';
    form.value.telefono = '';
    form.value.email = '';
    availableContracts.value = [];
  }
  
  // Reset contract selection
  form.value.contratoId = '';
  form.value.numeroSerie = '';
};

const loadClientContracts = async (codigoCliente: string) => {
  try {
    const contracts = await clientsStore.getClientContracts(codigoCliente);
    availableContracts.value = contracts;
  } catch (err) {
    console.error('Error loading client contracts:', err);
    availableContracts.value = [];
  }
};

const searchContracts = async () => {
  if (contractSearch.value.length >= 3) {
    try {
      const contracts = await contractsStore.searchBySerial(contractSearch.value);
      availableContracts.value = contracts;
    } catch (err) {
      console.error('Error searching contracts:', err);
    }
  }
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Validate required fields
    if (!form.value.usuarioCreacion || !form.value.tipoTicket || !form.value.codigoCliente || !form.value.razonSocial || !form.value.origen) {
      throw new Error('Por favor complete todos los campos requeridos');
    }

    // Prepare data for submission
    const submitData: TicketCreateInput = {
      usuarioCreacion: form.value.usuarioCreacion,
      tipoTicket: form.value.tipoTicket,
      categoria: form.value.categoria || undefined,
      subCategoria: form.value.subCategoria || undefined,
      codigoCliente: form.value.codigoCliente,
      razonSocial: form.value.razonSocial,
      contacto: form.value.contacto || undefined,
      telefono: form.value.telefono || undefined,
      email: form.value.email || undefined,
      contratoId: form.value.contratoId || undefined,
      numeroSerie: form.value.numeroSerie || undefined,
      estadoTicket: form.value.estadoTicket,
      origen: form.value.origen,
      urgencia: form.value.urgencia,
      detalle: form.value.detalle || undefined,
      technicianId: form.value.technicianId || undefined,
      fechaCierre: form.value.fechaCierre || undefined,
    };

    if (isEditing.value) {
      await ticketsStore.updateTicket(ticketId.value, submitData);
    } else {
      await ticketsStore.createTicket(submitData);
    }

    router.push('/tickets');
  } catch (err: any) {
    error.value = err.message || 'Error al guardar el ticket';
  } finally {
    loading.value = false;
  }
};

const deleteTicket = async () => {
  if (confirm('¿Está seguro de que desea eliminar este ticket?')) {
    try {
      loading.value = true;
      await ticketsStore.deleteTicket(ticketId.value);
      router.push('/tickets');
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar el ticket';
      loading.value = false;
    }
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('es-ES');
};

// Load data on mount
onMounted(async () => {
  await Promise.all([
    clientsStore.fetchClients(),
    techniciansStore.fetchTechnicians(),
    loadTicket()
  ]);
});
</script>

<style scoped>
.breadcrumb {
  background: none;
  padding: 0;
  margin-bottom: 0.5rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: '/';
}
</style>
