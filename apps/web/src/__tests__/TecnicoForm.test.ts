import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import TecnicoForm from '@/pages/config/TecnicoForm.vue';
import { useTecnicosStore } from '@/stores/tecnicos';
import { useUsersStore } from '@/stores/users';

// Mock API service
vi.mock('@/services/api', () => ({
  apiService: {
    tecnicos: {
      create: vi.fn(),
      update: vi.fn(),
      get: vi.fn(),
    },
    users: {
      searchUsers: vi.fn(),
      get: vi.fn(),
    }
  }
}));

describe('TecnicoForm', () => {
  let wrapper: any;
  let router: any;
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/config/tecnicos/nuevo', component: TecnicoForm },
        { path: '/config/tecnicos/:id/editar', component: TecnicoForm },
        { path: '/config/tecnicos', component: { template: '<div>List</div>' } }
      ]
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      // Try to submit empty form
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should validate email format', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const emailInput = wrapper.find('input[type="email"]');
      await emailInput.setValue('invalid-email');
      await emailInput.trigger('blur');

      // Should show validation error
      expect(wrapper.text()).toContain('formato válido');
    });

    it('should enable submit button when form is valid', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      // Fill required fields
      const nombreInput = wrapper.find('input[type="text"]');
      const emailInput = wrapper.find('input[type="email"]');
      
      await nombreInput.setValue('Juan Pérez');
      await emailInput.setValue('juan@example.com');

      // Mock user selection
      const component = wrapper.vm;
      component.form.usuarioId = 'user-123';
      await wrapper.vm.$nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('User Search', () => {
    it('should search users when typing in search field', async () => {
      const usersStore = useUsersStore();
      const searchUsersMock = vi.spyOn(usersStore, 'searchUsers').mockResolvedValue([
        {
          id: 'user-1',
          displayName: 'Juan Pérez',
          email: 'juan@example.com',
          roles: ['TECNICO'],
          username: 'juan',
          isActive: true
        }
      ]);

      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const searchInput = wrapper.find('input[placeholder*="Buscar usuario"]');
      await searchInput.setValue('Juan');
      await searchInput.trigger('input');

      // Wait for debounced search
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(searchUsersMock).toHaveBeenCalledWith({
        q: 'Juan',
        roles: ['TECNICO']
      });
    });
  });

  describe('Especialidades and Zonas', () => {
    it('should allow selecting multiple especialidades', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const informaticaCheckbox = wrapper.find('#esp-Informatica');
      const impHwCheckbox = wrapper.find('#esp-ImpHW');
      
      await informaticaCheckbox.setChecked();
      await impHwCheckbox.setChecked();

      const component = wrapper.vm;
      expect(component.form.especialidades).toContain('Informatica');
      expect(component.form.especialidades).toContain('ImpHW');
    });

    it('should allow selecting multiple zonas', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const andorraCheckbox = wrapper.find('#zona-Andorra\\ la\\ Vella');
      const escaldesCheckbox = wrapper.find('#zona-Escaldes-Engordany');
      
      await andorraCheckbox.setChecked();
      await escaldesCheckbox.setChecked();

      const component = wrapper.vm;
      expect(component.form.zonas).toContain('Andorra la Vella');
      expect(component.form.zonas).toContain('Escaldes-Engordany');
    });
  });

  describe('Form Submission', () => {
    it('should create new tecnico when form is submitted', async () => {
      const tecnicosStore = useTecnicosStore();
      const createMock = vi.spyOn(tecnicosStore, 'create').mockResolvedValue({
        id: 'tecnico-1',
        usuarioId: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        activo: true,
        especialidades: ['Informatica'],
        zonas: ['Andorra la Vella'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);

      const routerPushMock = vi.spyOn(router, 'push');

      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const component = wrapper.vm;
      
      // Set form data
      component.form = {
        usuarioId: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        activo: true,
        especialidades: ['Informatica'],
        zonas: ['Andorra la Vella'],
        tarifaHora: 45,
        capacidadDia: 480,
        color: '#007bff',
        telefono: '+376 123456',
        firmaUrl: '',
        notas: 'Técnico especializado'
      };

      await component.handleSubmit();

      expect(createMock).toHaveBeenCalledWith({
        usuarioId: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        activo: true,
        especialidades: ['Informatica'],
        zonas: ['Andorra la Vella'],
        tarifaHora: 45,
        capacidadDia: 480,
        color: '#007bff',
        telefono: '+376 123456',
        firmaUrl: '',
        notas: 'Técnico especializado'
      });

      expect(routerPushMock).toHaveBeenCalledWith('/config/tecnicos');
    });

    it('should update existing tecnico in edit mode', async () => {
      const tecnicosStore = useTecnicosStore();
      const getMock = vi.spyOn(tecnicosStore, 'get').mockResolvedValue({
        id: 'tecnico-1',
        usuarioId: 'user-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        activo: true,
        especialidades: ['Informatica'],
        zonas: ['Andorra la Vella'],
        tarifaHora: 45,
        capacidadDia: 480,
        color: '#007bff',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);

      const updateMock = vi.spyOn(tecnicosStore, 'update').mockResolvedValue({} as any);

      await router.push('/config/tecnicos/tecnico-1/editar');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      // Wait for component to load existing data
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(getMock).toHaveBeenCalledWith('tecnico-1');

      const component = wrapper.vm;
      component.form.nombre = 'Juan Pérez Actualizado';
      
      await component.handleSubmit();

      expect(updateMock).toHaveBeenCalledWith('tecnico-1', expect.objectContaining({
        nombre: 'Juan Pérez Actualizado'
      }));
    });
  });

  describe('Color Selection', () => {
    it('should allow selecting preset colors', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const presetColorButton = wrapper.find('button[style*="background-color: rgb(40, 167, 69)"]'); // #28a745
      await presetColorButton.trigger('click');

      const component = wrapper.vm;
      expect(component.form.color).toBe('#28a745');
    });

    it('should sync color picker with form', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const colorInput = wrapper.find('input[type="color"]');
      await colorInput.setValue('#ff5722');

      const component = wrapper.vm;
      expect(component.form.color).toBe('#ff5722');
    });
  });

  describe('Capacity Calculation', () => {
    it('should convert hours to minutes for capacidadDia', async () => {
      await router.push('/config/tecnicos/nuevo');
      
      wrapper = mount(TecnicoForm, {
        global: {
          plugins: [pinia, router]
        }
      });

      const capacityInput = wrapper.find('input[step="0.5"]');
      await capacityInput.setValue('8');
      await capacityInput.trigger('input');

      const component = wrapper.vm;
      expect(component.form.capacidadDia).toBe(480); // 8 * 60
    });
  });
});