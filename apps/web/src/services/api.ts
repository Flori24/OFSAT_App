import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Types for API responses
export interface Client {
  codigoCliente: string;
  razonSocial: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  departamento?: string;
  edificio?: string;
  contacto?: string;
  _count?: {
    contracts: number;
    tickets: number;
  };
}

export interface Technician {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  perfil?: string;
  _count?: {
    tickets: number;
  };
}

export interface Contract {
  id: string;
  codigoCliente: string;
  fechaInicio: string;
  fechaFin?: string;
  tipoContrato: string;
  numeroSerie: string;
  marca?: string;
  modelo?: string;
  ubicacion?: string;
  copiasNegro?: number;
  copiasColor?: number;
  client?: {
    codigoCliente: string;
    razonSocial: string;
    contacto?: string;
  };
  _count?: {
    tickets: number;
  };
}

export interface Ticket {
  numeroTicket: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  tipoTicket: 'IMPRESORA_SOFTWARE' | 'IMPRESORA_HARDWARE' | 'INFORMATICA' | 'INTERNO';
  categoria?: string;
  subCategoria?: string;
  subCategoria2?: string;
  codigoCliente: string;
  razonSocial: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  contratoId?: string;
  numeroSerie?: string;
  estadoTicket: 'ABIERTO' | 'ASIGNADA' | 'PENDIENTE' | 'PENDIENTE_CLIENTE' | 'PENDIENTE_PROVEEDOR' | 'EN_TRANSITO' | 'PENDIENTE_RMA' | 'EN_PROCESO';
  origen: 'TELEFONO' | 'WEB' | 'MANUAL';
  urgencia: 'NORMAL' | 'MEDIA' | 'ALTA' | 'EXTREMA';
  detalle?: string;
  fechaUltimaActualizacion?: string;
  fechaCierre?: string;
  technicianId?: string;
  client?: {
    codigoCliente: string;
    razonSocial: string;
  };
  technician?: {
    id: string;
    nombre: string;
  };
  contrato?: {
    id: string;
    tipoContrato: string;
    numeroSerie: string;
  };
}

export interface TicketCreateInput {
  usuarioCreacion: string;
  tipoTicket: string;
  categoria?: string;
  subCategoria?: string;
  subCategoria2?: string;
  codigoCliente: string;
  razonSocial: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  contratoId?: string;
  numeroSerie?: string;
  estadoTicket?: string;
  origen: string;
  urgencia?: string;
  detalle?: string;
  fechaCierre?: string;
  technicianId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TicketFilters {
  page?: number;
  pageSize?: number;
  codigoCliente?: string;
  technicianId?: string;
  estadoTicket?: string;
  urgencia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  q?: string;
}


// API methods
export const apiService = {
  // Health check
  health: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Authentication
  auth: {
    login: async (credentials: { username: string; password: string }) => {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    },

    me: async () => {
      const response = await api.get('/api/auth/me');
      return response.data;
    },

    register: async (userData: {
      username: string;
      displayName: string;
      email?: string;
      password: string;
      roles: string[];
    }) => {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    },
  },

  // Tickets
  tickets: {
    list: async (filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/api/tickets?${params.toString()}`);
      return response.data;
    },

    get: async (id: string): Promise<Ticket> => {
      const response = await api.get(`/api/tickets/${id}`);
      return response.data;
    },

    create: async (data: TicketCreateInput): Promise<Ticket> => {
      const response = await api.post('/api/tickets', data);
      return response.data;
    },

    update: async (id: string, data: Partial<TicketCreateInput>): Promise<Ticket> => {
      const response = await api.put(`/api/tickets/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/api/tickets/${id}`);
    },
  },

  // Clients
  clients: {
    list: async (q?: string): Promise<Client[]> => {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const response = await api.get(`/api/clients${params}`);
      return response.data;
    },

    get: async (codigoCliente: string): Promise<Client> => {
      const response = await api.get(`/api/clients/${codigoCliente}`);
      return response.data;
    },

    getContracts: async (codigoCliente: string): Promise<Contract[]> => {
      const response = await api.get(`/api/clients/${codigoCliente}/contracts`);
      return response.data;
    },
  },

  // Contracts
  contracts: {
    list: async (qNumeroSerie?: string): Promise<Contract[]> => {
      const params = qNumeroSerie ? `?qNumeroSerie=${encodeURIComponent(qNumeroSerie)}` : '';
      const response = await api.get(`/api/contracts${params}`);
      return response.data;
    },

    get: async (id: string): Promise<Contract> => {
      const response = await api.get(`/api/contracts/${id}`);
      return response.data;
    },
  },

  // Technicians
  technicians: {
    list: async (): Promise<Technician[]> => {
      const response = await api.get('/api/technicians');
      return response.data;
    },
  },
};