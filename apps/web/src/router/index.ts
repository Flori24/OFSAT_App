import { createRouter, createWebHistory } from 'vue-router';
import LayoutShell from '@/components/ui/LayoutShell.vue';
import TicketsDashboard from '@/pages/TicketsDashboard.vue';
import TicketForm from '@/pages/TicketForm.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/tickets'
    },
    {
      path: '/',
      component: LayoutShell,
      children: [
        {
          path: 'tickets',
          name: 'tickets',
          component: TicketsDashboard,
          meta: { title: 'Dashboard de Tickets' }
        },
        {
          path: 'tickets/new',
          name: 'ticket-new',
          component: TicketForm,
          meta: { title: 'Nuevo Ticket' }
        },
        {
          path: 'tickets/:id',
          name: 'ticket-edit',
          component: TicketForm,
          meta: { title: 'Editar Ticket' }
        }
      ]
    }
  ]
});

export default router;
