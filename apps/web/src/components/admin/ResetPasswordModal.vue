<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Cambiar Contraseña</h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        
        <form @submit.prevent="onSubmit">
          <div class="modal-body">
            <div class="mb-3">
              <p class="text-muted">
                Cambiar la contraseña del usuario: <strong>{{ user?.displayName }}</strong>
                <br>
                <small>@{{ user?.username }}</small>
              </p>
            </div>
            
            <div class="form-group">
              <label class="form-control-label">Nueva Contraseña *</label>
              <input 
                type="password" 
                class="form-control"
                :class="{ 'is-invalid': errors.password }"
                v-model="form.password"
                placeholder="Mínimo 6 caracteres"
                required
                ref="passwordInput"
              />
              <div v-if="errors.password" class="invalid-feedback">
                {{ errors.password }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-control-label">Confirmar Contraseña *</label>
              <input 
                type="password" 
                class="form-control"
                :class="{ 'is-invalid': errors.confirmPassword }"
                v-model="form.confirmPassword"
                placeholder="Repetir contraseña"
                required
              />
              <div v-if="errors.confirmPassword" class="invalid-feedback">
                {{ errors.confirmPassword }}
              </div>
            </div>
            
            <div class="alert alert-warning" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Advertencia:</strong> El usuario deberá usar la nueva contraseña en su próximo inicio de sesión.
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-warning" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
              Cambiar Contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { resetPassword, type UserListItem } from '@/services/users';

const props = defineProps<{
  user: UserListItem | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const loading = ref(false);
const errors = ref<Record<string, string>>({});
const passwordInput = ref<HTMLInputElement | null>(null);

const form = ref({
  password: '',
  confirmPassword: ''
});

function validateForm(): boolean {
  errors.value = {};
  
  if (!form.value.password) {
    errors.value.password = 'Contraseña es requerida';
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Contraseña debe tener al menos 6 caracteres';
  }
  
  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = 'Confirmación de contraseña es requerida';
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Las contraseñas no coinciden';
  }
  
  return Object.keys(errors.value).length === 0;
}

async function onSubmit() {
  if (!validateForm() || !props.user) return;
  
  loading.value = true;
  try {
    await resetPassword(props.user.id, form.value.password);
    alert(`Contraseña cambiada exitosamente para ${props.user.displayName}`);
    emit('saved');
  } catch (error: any) {
    console.error('Error resetting password:', error);
    if (error?.response?.data?.error) {
      alert('Error: ' + error.response.data.error);
    } else {
      alert('Error al cambiar contraseña');
    }
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = {
    password: '',
    confirmPassword: ''
  };
  errors.value = {};
}

onMounted(async () => {
  resetForm();
  await nextTick();
  passwordInput.value?.focus();
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

.alert-warning {
  border-left: 4px solid #fb6340;
}
</style>