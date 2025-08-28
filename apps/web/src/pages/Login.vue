<template>
  <div class="container mt-7">
    <div class="row justify-content-center">
      <div class="col-md-5">
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

