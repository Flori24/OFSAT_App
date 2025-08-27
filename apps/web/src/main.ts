import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/argon.scss';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
