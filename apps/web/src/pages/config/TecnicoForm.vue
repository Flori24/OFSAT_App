<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <!-- Header -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h6>{{ isEdit ? 'Editar Técnico' : 'Nuevo Técnico' }}</h6>
                <p class="text-sm mb-0">
                  {{ isEdit ? 'Modifica la información del técnico' : 'Crea un nuevo técnico en el sistema' }}
                </p>
              </div>
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

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div class="row">
            <!-- Información de identidad -->
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header pb-0">
                  <h6>Identidad</h6>
                </div>
                <div class="card-body">
                  <!-- Usuario ID (autocomplete) -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Usuario del Sistema *</label>
                    <div class="position-relative">
                      <input
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors.usuarioId }"
                        v-model="searchUser"
                        @input="searchUsers"
                        placeholder="Buscar usuario por nombre o email..."
                        :disabled="isEdit"
                      />
                      <div v-if="userSearchResults.length > 0" class="dropdown-menu show w-100">
                        <a 
                          v-for="user in userSearchResults" 
                          :key="user.id"
                          class="dropdown-item"
                          href="#"
                          @click.prevent="selectUser(user)"
                        >
                          <div>
                            <strong>{{ user.displayName }}</strong>
                            <br>
                            <small class="text-muted">{{ user.email }} - {{ user.roles.join(', ') }}</small>
                          </div>
                        </a>
                      </div>
                      <div v-if="errors.usuarioId" class="invalid-feedback">
                        {{ errors.usuarioId }}
                      </div>
                    </div>
                  </div>

                  <!-- Nombre -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Nombre Completo *</label>
                    <input
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': errors.nombre }"
                      v-model="form.nombre"
                    />
                    <div v-if="errors.nombre" class="invalid-feedback">
                      {{ errors.nombre }}
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Email *</label>
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

                  <!-- Teléfono -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Teléfono</label>
                    <input
                      type="tel"
                      class="form-control"
                      v-model="form.telefono"
                    />
                  </div>

                  <!-- Estado activo -->
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="activo"
                      v-model="form.activo"
                    />
                    <label class="form-check-label" for="activo">
                      Técnico activo
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información operativa -->
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header pb-0">
                  <h6>Información Operativa</h6>
                </div>
                <div class="card-body">
                  <!-- Especialidades -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Especialidades</label>
                    <div class="d-flex flex-wrap gap-2 mb-2">
                      <div v-for="esp in especialidadesDisponibles" :key="esp.value" class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="`esp-${esp.value}`"
                          :value="esp.value"
                          v-model="form.especialidades"
                        />
                        <label class="form-check-label" :for="`esp-${esp.value}`">
                          {{ esp.label }}
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Zonas -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Zonas de Trabajo</label>
                    <div class="d-flex flex-wrap gap-2 mb-2">
                      <div v-for="zona in zonasDisponibles" :key="zona" class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="`zona-${zona}`"
                          :value="zona"
                          v-model="form.zonas"
                        />
                        <label class="form-check-label" :for="`zona-${zona}`">
                          {{ zona }}
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Tarifa por hora -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Tarifa por Hora (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      class="form-control"
                      v-model.number="form.tarifaHora"
                    />
                  </div>

                  <!-- Capacidad diaria -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Capacidad Diaria (horas)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      class="form-control"
                      v-model.number="capacidadHoras"
                      @input="form.capacidadDia = capacidadHoras * 60"
                    />
                    <small class="form-text text-muted">
                      Equivale a {{ form.capacidadDia || 0 }} minutos
                    </small>
                  </div>

                  <!-- Color del calendario -->
                  <div class="form-group mb-3">
                    <label class="form-control-label">Color del Calendario</label>
                    <div class="d-flex align-items-center gap-3">
                      <input
                        type="color"
                        class="form-control form-control-color"
                        v-model="form.color"
                        style="width: 60px; height: 40px;"
                      />
                      <div class="d-flex gap-1">
                        <button 
                          v-for="color in coloresPreset" 
                          :key="color"
                          type="button"
                          class="btn btn-sm p-2"
                          :style="{ backgroundColor: color, width: '30px', height: '30px' }"
                          @click="form.color = color"
                        ></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Firma y notas -->
          <div class="row">
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header pb-0">
                  <h6>Firma Digital</h6>
                </div>
                <div class="card-body">
                  <div class="form-group">
                    <label class="form-control-label">Subir Imagen de Firma</label>
                    <input
                      type="file"
                      class="form-control"
                      accept="image/*"
                      @change="handleFirmaUpload"
                    />
                    <div v-if="form.firmaUrl" class="mt-2">
                      <img 
                        :src="form.firmaUrl" 
                        alt="Firma"
                        class="img-thumbnail"
                        style="max-width: 200px; max-height: 100px;"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header pb-0">
                  <h6>Notas Adicionales</h6>
                </div>
                <div class="card-body">
                  <div class="form-group">
                    <textarea
                      class="form-control"
                      rows="4"
                      v-model="form.notas"
                      placeholder="Notas adicionales sobre el técnico..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit buttons -->
          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <div class="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      class="btn btn-outline-secondary"
                      @click="$router.push('/config/tecnicos')"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      class="btn btn-primary"
                      :disabled="loading || !isFormValid"
                    >
                      <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                      {{ isEdit ? 'Actualizar' : 'Crear' }} Técnico
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTecnicosStore } from '@/stores/tecnicos';
import { useUsersStore } from '@/stores/users';
import { debounce } from 'lodash-es';

const route = useRoute();
const router = useRouter();
const tecnicosStore = useTecnicosStore();
const usersStore = useUsersStore();

const isEdit = computed(() => route.params.id !== 'nuevo');
const loading = ref(false);
const searchUser = ref('');
const userSearchResults = ref<any[]>([]);
const capacidadHoras = ref(0);

const especialidadesDisponibles = [
  { value: 'Informatica', label: 'Informática' },
  { value: 'ImpHW', label: 'Impresoras Hardware' },
  { value: 'ImpSW', label: 'Impresoras Software' }
];

const zonasDisponibles = [
  'Andorra la Vella',
  'Escaldes-Engordany', 
  'Encamp',
  'La Massana',
  'Ordino',
  'Sant Julià de Lòria',
  'Canillo'
];

const coloresPreset = [
  '#007bff', '#28a745', '#dc3545', '#ffc107', 
  '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'
];

const form = ref({
  usuarioId: '',
  nombre: '',
  email: '',
  telefono: '',
  activo: true,
  especialidades: [] as string[],
  zonas: [] as string[],
  tarifaHora: null as number | null,
  capacidadDia: null as number | null,
  color: '#007bff',
  firmaUrl: '',
  notas: ''
});

const errors = ref<Record<string, string>>({});

const isFormValid = computed(() => {
  return form.value.usuarioId && 
         form.value.nombre && 
         form.value.email &&
         Object.keys(errors.value).length === 0;
});

const validateForm = () => {
  errors.value = {};
  
  if (!form.value.usuarioId) {
    errors.value.usuarioId = 'Debe seleccionar un usuario del sistema';
  }
  
  if (!form.value.nombre) {
    errors.value.nombre = 'El nombre es requerido';
  }
  
  if (!form.value.email) {
    errors.value.email = 'El email es requerido';
  } else if (!/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = 'El email debe tener un formato válido';
  }
};

const searchUsers = debounce(async () => {
  if (searchUser.value.length >= 2) {
    try {
      const users = await usersStore.searchUsers({
        q: searchUser.value,
        roles: ['TECNICO']
      });
      userSearchResults.value = users;
    } catch (error) {
      console.error('Error searching users:', error);
    }
  } else {
    userSearchResults.value = [];
  }
}, 300);

const selectUser = (user: any) => {
  form.value.usuarioId = user.id;
  form.value.nombre = user.displayName;
  form.value.email = user.email || '';
  searchUser.value = user.displayName;
  userSearchResults.value = [];
  validateForm();
};

const handleFirmaUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      form.value.firmaUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleSubmit = async () => {
  validateForm();
  
  if (!isFormValid.value) {
    return;
  }
  
  loading.value = true;
  
  try {
    if (isEdit.value) {
      await tecnicosStore.update(route.params.id as string, form.value);
    } else {
      await tecnicosStore.create(form.value);
    }
    
    router.push('/config/tecnicos');
  } catch (error: any) {
    console.error('Error saving tecnico:', error);
    // Handle API validation errors
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors;
    }
  } finally {
    loading.value = false;
  }
};

// Load existing data for edit mode
onMounted(async () => {
  if (isEdit.value) {
    loading.value = true;
    try {
      const tecnico = await tecnicosStore.get(route.params.id as string);
      form.value = { ...tecnico };
      capacidadHoras.value = tecnico.capacidadDia ? tecnico.capacidadDia / 60 : 0;
      
      // Load user info for display
      if (tecnico.usuarioId) {
        const user = await usersStore.getUser(tecnico.usuarioId);
        searchUser.value = user.displayName;
      }
    } catch (error) {
      console.error('Error loading tecnico:', error);
      router.push('/config/tecnicos');
    } finally {
      loading.value = false;
    }
  }
});

// Watch form changes for validation
watch(() => form.value, validateForm, { deep: true });
</script>

<style scoped>
.form-control-color {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

.dropdown-menu.show {
  display: block;
  position: absolute;
  top: 100%;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.form-check {
  margin-right: 1rem;
  margin-bottom: 0.5rem;
}

.img-thumbnail {
  border: 1px solid #dee2e6;
}
</style>