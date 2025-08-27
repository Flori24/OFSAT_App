<template>
  <div class="ticket-form">
    <!-- Header -->
    <div class="row align-items-center mb-4">
      <div class="col">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item">
              <router-link to="/tickets" class="text-decoration-none">
                Tickets
              </router-link>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              {{ isEditing ? 'Editar Ticket' : 'Nuevo Ticket' }}
            </li>
          </ol>
        </nav>
        <h1 class="h3 mb-0">
          {{ isEditing ? 'Editar Ticket' : 'Nuevo Ticket' }}
        </h1>
      </div>
      <div class="col-auto">
        <router-link 
          to="/tickets" 
          class="btn btn-outline-secondary"
        >
          <i class="fas fa-arrow-left me-2"></i>
          Volver
        </router-link>
      </div>
    </div>

    <!-- Form Card -->
    <div class="card">
      <div class="card-header">
        <h4 class="mb-0">
          <i class="fas fa-edit me-2"></i>
          Información del Ticket
        </h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row">
            <div class="col-md-8">
              <div class="mb-3">
                <label for="title" class="form-label">Título *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="title" 
                  v-model="form.title"
                  placeholder="Ingrese el título del ticket"
                  required
                >
              </div>
              
              <div class="mb-3">
                <label for="description" class="form-label">Descripción</label>
                <textarea 
                  class="form-control" 
                  id="description" 
                  rows="5"
                  v-model="form.description"
                  placeholder="Describa el problema o solicitud..."
                ></textarea>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="mb-3">
                <label for="priority" class="form-label">Prioridad</label>
                <select class="form-select" id="priority" v-model="form.priority">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="category" class="form-label">Categoría</label>
                <select class="form-select" id="category" v-model="form.category">
                  <option value="">Seleccionar categoría</option>
                  <option value="technical">Técnico</option>
                  <option value="support">Soporte</option>
                  <option value="feature">Nueva funcionalidad</option>
                  <option value="bug">Error/Bug</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="assignee" class="form-label">Asignado a</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="assignee" 
                  v-model="form.assignee"
                  placeholder="Asignar a usuario..."
                >
              </div>
            </div>
          </div>
          
          <div class="d-flex justify-content-end gap-2 mt-4">
            <router-link 
              to="/tickets" 
              class="btn btn-outline-secondary"
            >
              Cancelar
            </router-link>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save me-2"></i>
              {{ isEditing ? 'Actualizar' : 'Crear' }} Ticket
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Preview Card -->
    <div class="card mt-4" v-if="form.title || form.description">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="fas fa-eye me-2"></i>
          Vista previa
        </h5>
      </div>
      <div class="card-body">
        <h6 class="mb-2">{{ form.title || 'Sin título' }}</h6>
        <p class="text-muted mb-3">{{ form.description || 'Sin descripción' }}</p>
        <div class="d-flex gap-2">
          <span class="badge bg-secondary">{{ form.priority || 'Sin prioridad' }}</span>
          <span class="badge bg-info" v-if="form.category">{{ form.category }}</span>
          <span class="badge bg-success" v-if="form.assignee">{{ form.assignee }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isEditing = computed(() => route.name === 'ticket-edit');

const form = ref({
  title: '',
  description: '',
  priority: 'medium',
  category: '',
  assignee: ''
});

const handleSubmit = () => {
  console.log('Form submitted:', form.value);
  // Form submission logic will be implemented in Milestone 1
  alert('Funcionalidad de guardado será implementada en el Hito 1');
};

onMounted(() => {
  if (isEditing.value) {
    const ticketId = route.params.id;
    console.log('Editing ticket:', ticketId);
    // Load ticket data logic will be implemented in Milestone 1
  }
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
