<template>
  <div class="container-fluid login-container">
    <div class="row justify-content-center align-items-center min-vh-100">
      <div class="col-12 col-sm-8 col-md-6 col-lg-5 col-xl-4">
        <div class="card shadow">
          <div class="card-header bg-transparent">
            <h4 class="mb-0">Iniciar sesión</h4>
          </div>
          <div class="card-body">
            <form @submit.prevent="onSubmit">
              <div class="mb-3">
                <label class="form-label">Usuario</label>
                <input v-model="username" class="form-control" autocomplete="username" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Contraseña</label>
                <input v-model="password" type="password" class="form-control" autocomplete="current-password" required />
              </div>
              <div class="d-grid gap-2">
                <button class="btn btn-primary" :disabled="auth.loading">
                  {{ auth.loading ? 'Entrando...' : 'Entrar' }}
                </button>
              </div>
              <p class="text-danger mt-3 mb-0" v-if="auth.error">{{ auth.error }}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useRouter, useRoute } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const username = ref('');
const password = ref('');

onMounted(() => {
  if (auth.isAuthenticated) router.replace((route.query.r as string) || '/tickets');
});

async function onSubmit() {
  await auth.login(username.value, password.value);
  await auth.fetchMe();
  router.replace((route.query.r as string) || '/tickets');
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

@media (max-width: 575.98px) {
  .login-container {
    padding: 0.5rem;
  }
  
  .card {
    border-radius: 0.5rem;
  }
  
  .card-header,
  .card-body {
    padding: 1.25rem;
  }
  
  .btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
}

@media (max-width: 374.98px) {
  .login-container {
    padding: 0.25rem;
  }
  
  .card-header,
  .card-body {
    padding: 1rem;
  }
}
</style>

