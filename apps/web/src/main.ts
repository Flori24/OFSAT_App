import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import './styles/argon.scss';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

import { useAuthStore } from './store/auth';
const auth = useAuthStore();
// Intentar recuperar /me si hay token
if (auth.token) {
  console.log('Token found in localStorage, verifying...');
  auth.fetchMe().catch((error) => {
    console.log('Token verification failed:', error);
    // Si falla, el logout ya se ejecutó en fetchMe
  }).finally(() => {
    console.log('Auth verification complete, mounting app');
    app.mount('#app');
  });
} else {
  console.log('No token found, mounting app directly');
  app.mount('#app');
}
