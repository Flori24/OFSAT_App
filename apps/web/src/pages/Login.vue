<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo and header -->
        <div class="auth-header">
          <h1 class="auth-title">OFSAT App</h1>
          <p class="auth-subtitle">Sistema de Gestión de Tickets</p>
        </div>

        <!-- Login form -->
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="username" class="form-label">Usuario</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.username }"
              placeholder="Ingrese su usuario"
              required
              :disabled="authStore.isLoading"
            />
            <div v-if="errors.username" class="invalid-feedback">
              {{ errors.username }}
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              placeholder="Ingrese su contraseña"
              required
              :disabled="authStore.isLoading"
            />
            <div v-if="errors.password" class="invalid-feedback">
              {{ errors.password }}
            </div>
          </div>

          <!-- Error message -->
          <div v-if="authStore.error" class="alert alert-danger" role="alert">
            <i class="fa fa-exclamation-circle me-2"></i>
            {{ authStore.error }}
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="authStore.isLoading || !form.username || !form.password"
          >
            <span v-if="authStore.isLoading" class="spinner-border spinner-border-sm me-2"></span>
            {{ authStore.isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <!-- Demo credentials -->
        <div class="demo-credentials">
          <h6>Credenciales de prueba:</h6>
          <div class="demo-users">
            <div class="demo-user" @click="fillCredentials('admin', 'Admin.2025!')">
              <strong>Admin:</strong> admin / Admin.2025!
            </div>
            <div class="demo-user" @click="fillCredentials('gestor', 'Gestor.2025!')">
              <strong>Gestor:</strong> gestor / Gestor.2025!
            </div>
            <div class="demo-user" @click="fillCredentials('tecnico', 'Tecnico.2025!')">
              <strong>Técnico:</strong> tecnico / Tecnico.2025!
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form data
const form = reactive({
  username: '',
  password: ''
});

// Form validation errors
const errors = reactive({
  username: '',
  password: ''
});

// Handle login submission
const handleLogin = async () => {
  // Clear previous errors
  errors.username = '';
  errors.password = '';
  authStore.clearError();

  // Basic validation
  if (!form.username) {
    errors.username = 'El usuario es requerido';
    return;
  }
  if (!form.password) {
    errors.password = 'La contraseña es requerida';
    return;
  }

  try {
    await authStore.login({
      username: form.username,
      password: form.password
    });

    // Redirect to dashboard on success
    router.push('/tickets');
  } catch (error) {
    // Error is handled by the store
    console.error('Login failed:', error);
  }
};

// Fill demo credentials
const fillCredentials = (username: string, password: string) => {
  form.username = username;
  form.password = password;
};

// Redirect if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/tickets');
  }
});
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  color: #344767;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #67748e;
  font-size: 0.875rem;
  margin: 0;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #344767;
  font-weight: 600;
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border: 1px solid #d2d6da;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: #5e72e4;
  box-shadow: 0 0 0 3px rgba(94, 114, 228, 0.1);
}

.form-control.is-invalid {
  border-color: #fd5c70;
}

.invalid-feedback {
  display: block;
  color: #fd5c70;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.btn-block {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
}

.btn-primary {
  background: linear-gradient(87deg, #5e72e4 0%, #825ee4 100%);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(94, 114, 228, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.alert-danger {
  background-color: #fed7d7;
  border: 1px solid #feb2b2;
  color: #c53030;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.demo-credentials {
  border-top: 1px solid #e3e6f0;
  padding-top: 1rem;
  text-align: center;
}

.demo-credentials h6 {
  color: #67748e;
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.demo-users {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.demo-user {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.75rem;
}

.demo-user:hover {
  background-color: #e9ecef;
}

.demo-user strong {
  color: #344767;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
  
  .auth-title {
    font-size: 1.5rem;
  }
}
</style>