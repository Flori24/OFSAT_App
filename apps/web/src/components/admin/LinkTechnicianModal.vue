<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-dialog-responsive">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ user?.technicianId ? 'Cambiar Técnico' : 'Vincular Técnico' }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        
        <form @submit.prevent="onSubmit">
          <div class="modal-body">
            <div class="mb-3">
              <p class="text-muted">
                Usuario: <strong>{{ user?.displayName }}</strong>
                <br>
                <small>@{{ user?.username }}</small>
              </p>
              
              <div v-if="user?.technicianId" class="alert alert-info" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                Este usuario ya está vinculado a un técnico. Seleccione un nuevo técnico para cambiar la vinculación.
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-control-label">Seleccionar Técnico *</label>
              <select 
                class="form-select"
                :class="{ 'is-invalid': errors.technicianId }"
                v-model="form.technicianId"
                required
              >
                <option value="">-- Seleccionar técnico --</option>
                <option 
                  v-for="tech in availableTechnicians" 
                  :key="tech.id" 
                  :value="tech.id"
                >
                  {{ tech.nombre }}{{ tech.email ? ` (${tech.email})` : '' }}
                </option>
              </select>
              <div v-if="errors.technicianId" class="invalid-feedback">
                {{ errors.technicianId }}
              </div>
              <small class="form-text text-muted">
                Solo se muestran técnicos que no están vinculados a otros usuarios
              </small>
            </div>
            
            <div v-if="loadingTechnicians" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando técnicos...</span>
              </div>
              <p class="mt-2 text-muted">Cargando técnicos disponibles...</p>
            </div>
            
            <div v-if="!loadingTechnicians && availableTechnicians.length === 0" class="alert alert-warning" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              No hay técnicos disponibles para vincular.
            </div>
            
            <div class="alert alert-info" role="alert">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Nota:</strong> Un técnico solo puede estar vinculado a un usuario a la vez.
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="loading || loadingTechnicians || availableTechnicians.length === 0"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ user?.technicianId ? 'Cambiar' : 'Vincular' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { linkTechnician, listTechnicians, type UserListItem, type Technician } from '@/services/users';

const props = defineProps<{
  user: UserListItem | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const loading = ref(false);
const loadingTechnicians = ref(false);
const errors = ref<Record<string, string>>({});
const technicians = ref<Technician[]>([]);
const availableTechnicians = ref<Technician[]>([]);

const form = ref({
  technicianId: ''
});

function validateForm(): boolean {
  errors.value = {};
  
  if (!form.value.technicianId) {
    errors.value.technicianId = 'Debe seleccionar un técnico';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function loadTechnicians() {
  loadingTechnicians.value = true;
  try {
    technicians.value = await listTechnicians();
    // Por simplicidad, mostramos todos los técnicos
    // En un escenario real, deberíamos filtrar los que ya están vinculados
    availableTechnicians.value = technicians.value;
  } catch (error) {
    console.error('Error loading technicians:', error);
    alert('Error al cargar técnicos');
  } finally {
    loadingTechnicians.value = false;
  }
}

async function onSubmit() {
  if (!validateForm() || !props.user) return;
  
  loading.value = true;
  try {
    await linkTechnician(props.user.id, form.value.technicianId);
    const selectedTech = technicians.value.find(t => t.id === form.value.technicianId);
    alert(`Usuario ${props.user.displayName} vinculado exitosamente al técnico ${selectedTech?.nombre}`);
    emit('saved');
  } catch (error: any) {
    console.error('Error linking technician:', error);
    if (error?.response?.data?.error) {
      if (error.response.data.error.includes('already linked')) {
        errors.value.technicianId = 'Este técnico ya está vinculado a otro usuario';
      } else {
        alert('Error: ' + error.response.data.error);
      }
    } else {
      alert('Error al vincular técnico');
    }
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = {
    technicianId: ''
  };
  errors.value = {};
}

onMounted(async () => {
  resetForm();
  await loadTechnicians();
});
</script>

<style scoped>
.modal {
  z-index: 1060;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m1 6 7 7 7-7'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right .75rem center;
  background-size: 16px 12px;
}

.alert-info {
  border-left: 4px solid #11cdef;
}

.alert-warning {
  border-left: 4px solid #fb6340;
}

/* Responsive modal styles */
@media (max-width: 767.98px) {
  .modal-dialog-responsive {
    margin: 0.5rem;
    max-width: calc(100% - 1rem);
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-header {
    padding: 1rem 1rem 0.5rem;
  }
  
  .modal-footer {
    padding: 0.5rem 1rem 1rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
  
  .modal-footer .btn {
    width: 100%;
    margin: 0;
  }
}

@media (max-width: 575.98px) {
  .modal-dialog-responsive {
    margin: 0.25rem;
    max-width: calc(100% - 0.5rem);
  }
  
  .modal-body {
    padding: 0.75rem;
  }
}
</style>