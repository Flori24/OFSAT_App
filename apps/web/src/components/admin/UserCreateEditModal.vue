<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-responsive">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        
        <form @submit.prevent="onSubmit">
          <div class="modal-body">
            <div class="row">
              <!-- Username -->
              <div class="col-md-6">
                <div class="form-group">
                  <label class="form-control-label">Username *</label>
                  <input 
                    type="text" 
                    class="form-control"
                    :class="{ 'is-invalid': errors.username }"
                    v-model="form.username"
                    :disabled="isEditing"
                    required
                  />
                  <div v-if="errors.username" class="invalid-feedback">
                    {{ errors.username }}
                  </div>
                </div>
              </div>
              
              <!-- Display Name -->
              <div class="col-md-6">
                <div class="form-group">
                  <label class="form-control-label">Nombre para mostrar *</label>
                  <input 
                    type="text" 
                    class="form-control"
                    :class="{ 'is-invalid': errors.displayName }"
                    v-model="form.displayName"
                    required
                  />
                  <div v-if="errors.displayName" class="invalid-feedback">
                    {{ errors.displayName }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row">
              <!-- Email -->
              <div class="col-md-6">
                <div class="form-group">
                  <label class="form-control-label">Email</label>
                  <input 
                    type="email" 
                    class="form-control"
                    :class="{ 'is-invalid': errors.email }"
                    v-model="form.email"
                  />
                  <div v-if="errors.email" class="invalid-feedback">
                    {{ errors.email }}
                  </div>
                </div>
              </div>
              
              <!-- Password (solo para nuevo usuario) -->
              <div class="col-md-6" v-if="!isEditing">
                <div class="form-group">
                  <label class="form-control-label">Contraseña *</label>
                  <input 
                    type="password" 
                    class="form-control"
                    :class="{ 'is-invalid': errors.password }"
                    v-model="form.password"
                    required
                  />
                  <div v-if="errors.password" class="invalid-feedback">
                    {{ errors.password }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Roles -->
            <div class="form-group">
              <label class="form-control-label">Roles *</label>
              <div class="row">
                <div class="col-md-3" v-for="role in availableRoles" :key="role">
                  <div class="form-check">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      :id="`role-${role}`"
                      :value="role"
                      v-model="form.roles"
                    />
                    <label class="form-check-label" :for="`role-${role}`">
                      {{ role }}
                    </label>
                  </div>
                </div>
              </div>
              <div v-if="errors.roles" class="text-danger">
                <small>{{ errors.roles }}</small>
              </div>
            </div>
            
            <!-- Estado (solo para edición) -->
            <div class="form-group" v-if="isEditing">
              <div class="form-check form-switch">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="isActive"
                  v-model="form.isActive"
                />
                <label class="form-check-label" for="isActive">
                  Usuario Activo
                </label>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isEditing ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { createUser, updateUser, type UserListItem, type Role } from '@/services/users';

const props = defineProps<{
  user?: UserListItem | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const loading = ref(false);
const errors = ref<Record<string, string>>({});

const form = ref({
  username: '',
  displayName: '',
  email: '',
  password: '',
  roles: [] as Role[],
  isActive: true
});

const availableRoles: Role[] = ['ADMIN', 'GESTOR', 'TECNICO', 'LECTOR'];

const isEditing = computed(() => !!props.user);

function resetForm() {
  if (props.user) {
    form.value = {
      username: props.user.username,
      displayName: props.user.displayName,
      email: '',
      password: '',
      roles: [...props.user.roles],
      isActive: props.user.isActive !== false
    };
  } else {
    form.value = {
      username: '',
      displayName: '',
      email: '',
      password: '',
      roles: [],
      isActive: true
    };
  }
  errors.value = {};
}

function validateForm(): boolean {
  errors.value = {};
  
  if (!form.value.username.trim()) {
    errors.value.username = 'Username es requerido';
  }
  
  if (!form.value.displayName.trim()) {
    errors.value.displayName = 'Nombre para mostrar es requerido';
  }
  
  if (!isEditing.value && !form.value.password) {
    errors.value.password = 'Contraseña es requerida';
  }
  
  if (!isEditing.value && form.value.password && form.value.password.length < 6) {
    errors.value.password = 'Contraseña debe tener al menos 6 caracteres';
  }
  
  if (form.value.roles.length === 0) {
    errors.value.roles = 'Debe seleccionar al menos un rol';
  }
  
  if (form.value.email && !/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = 'Email no válido';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function onSubmit() {
  if (!validateForm()) return;
  
  loading.value = true;
  try {
    if (isEditing.value && props.user) {
      // Editar usuario
      const payload = {
        displayName: form.value.displayName,
        roles: form.value.roles,
        isActive: form.value.isActive
      };
      if (form.value.email) {
        payload.email = form.value.email;
      }
      await updateUser(props.user.id, payload);
    } else {
      // Crear nuevo usuario
      const payload = {
        username: form.value.username,
        displayName: form.value.displayName,
        password: form.value.password,
        roles: form.value.roles
      };
      if (form.value.email) {
        payload.email = form.value.email;
      }
      await createUser(payload);
    }
    
    emit('saved');
  } catch (error: any) {
    console.error('Error saving user:', error);
    if (error?.response?.data?.error) {
      // Si el backend devuelve un error específico
      if (error.response.data.error.includes('username')) {
        errors.value.username = 'Este username ya existe';
      } else {
        alert('Error: ' + error.response.data.error);
      }
    } else {
      alert('Error al guardar usuario');
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  resetForm();
});
</script>

<style scoped>
.modal {
  z-index: 1060;
}

.form-check-input:checked {
  background-color: #5e72e4;
  border-color: #5e72e4;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
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
  
  .row .col-md-6 {
    margin-bottom: 1rem;
  }
}

@media (max-width: 575.98px) {
  .modal-dialog-responsive {
    margin: 0.25rem;
    max-width: calc(100% - 0.5rem);
    height: calc(100vh - 0.5rem);
  }
  
  .modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
}
</style>