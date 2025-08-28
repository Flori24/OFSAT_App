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
auth.fetchMe().finally(() => {
  app.mount('#app');
});
