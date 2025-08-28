import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LayoutShell from '@/components/ui/LayoutShell.vue';
import TicketsDashboard from '@/pages/TicketsDashboard.vue';
import TicketForm from '@/pages/TicketForm.vue';
import Login from '@/pages/Login.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/tickets'
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { 
        title: 'Iniciar Sesión',
        requiresAuth: false,
        public: true 
      }
    },
    {
      path: '/',
      component: LayoutShell,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'tickets',
          name: 'tickets',
          component: TicketsDashboard,
          meta: { 
            title: 'Dashboard de Tickets',
            requiresAuth: true 
          }
        },
        {
          path: 'tickets/new',
          name: 'ticket-new',
          component: TicketForm,
          meta: { 
            title: 'Nuevo Ticket',
            requiresAuth: true,
            requiredRoles: ['ADMIN', 'GESTOR']
          }
        },
        {
          path: 'tickets/:id',
          name: 'ticket-edit',
          component: TicketForm,
          meta: { 
            title: 'Editar Ticket',
            requiresAuth: true
          }
        }
      ]
    }
  ]
});

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  
  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} | OFSAT App`;
  }
  
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth) {
    // Wait for auth store to initialize if needed
    if (!authStore.user && authStore.token) {
      try {
        await authStore.getCurrentUser();
      } catch (error) {
        // Token might be invalid
        console.error('Auth initialization error:', error);
      }
    }
    
    if (!authStore.isAuthenticated) {
      // Redirect to login with return path
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      });
      return;
    }
    
    // Check role requirements
    const requiredRoles = to.meta.requiredRoles as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        authStore.user?.roles.includes(role)
      );
      
      if (!hasRequiredRole) {
        // User doesn't have required role
        next({ 
          name: 'tickets',
          query: { error: 'insufficient_permissions' }
        });
        return;
      }
    }
  }
  
  // Redirect authenticated users away from login
  if (to.name === 'login' && authStore.isAuthenticated) {
    const redirect = to.query.redirect as string;
    next(redirect || '/tickets');
    return;
  }
  
  next();
});

export default router;
