import { createRouter, createWebHistory } from 'vue-router';
import TicketsDashboard from '@/pages/TicketsDashboard.vue';
import TicketForm from '@/pages/TicketForm.vue';
import Login from '@/pages/Login.vue';
import LayoutShell from '@/components/ui/LayoutShell.vue';
import AdminUsers from '@/pages/admin/AdminUsers.vue';
import { useAuthStore } from '@/store/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    { path: '/', redirect: '/tickets' },
    {
      path: '/',
      component: LayoutShell,
      children: [
        { path: 'tickets', component: TicketsDashboard, meta: { requiresAuth: true } },
        // Solo ADMIN/GESTOR puede crear
        { path: 'tickets/new', component: TicketForm, meta: { requiresAuth: true, roles: ['ADMIN','GESTOR'] } },
        // Editar: cualquiera autenticado; el backend aplicará reglas finas (técnico solo si asignado)
        { path: 'tickets/:id', component: TicketForm, meta: { requiresAuth: true } },
        // Panel de administración - solo ADMIN
        { path: 'admin/users', component: AdminUsers, meta: { requiresAuth: true, roles: ['ADMIN'] } },
      ]
    }
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  
  // Si es la ruta de login y ya está autenticado, redirigir al dashboard
  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: '/tickets' };
  }
  
  // Si requiere autenticación y no está autenticado, redirigir a login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { r: to.fullPath } };
  }
  
  // Si requiere roles específicos, verificar que el usuario tenga al menos uno
  if (to.meta.roles && auth.isAuthenticated) {
    const roles = to.meta.roles as string[];
    const allowed = roles.some(r => auth.hasRole(r));
    if (!allowed) return { path: '/tickets' };
  }
});

export default router;
