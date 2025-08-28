import api from './api';

export type Role = 'ADMIN'|'GESTOR'|'TECNICO'|'LECTOR';
export type UserListItem = {
  id: string;
  username: string;
  displayName: string;
  roles: Role[];
  technicianId?: string|null;
  isActive?: boolean;
};
export type Technician = {
  id: string;
  nombre: string;
  email?: string|null;
};

export async function listUsers(): Promise<UserListItem[]> {
  const { data } = await api.get('/api/users');
  return data;
}
export async function getUser(id: string): Promise<UserListItem> {
  const { data } = await api.get(`/api/users/${id}`);
  return data;
}
export async function createUser(payload: {
  username: string; displayName: string; email?: string;
  password: string; roles: Role[];
}): Promise<{id:string;username:string;roles:Role[]}> {
  const { data } = await api.post('/api/users', payload);
  return data;
}
export async function updateUser(id: string, payload: {
  displayName?: string; email?: string; roles?: Role[]; isActive?: boolean;
}): Promise<any> {
  const { data } = await api.put(`/api/users/${id}`, payload);
  return data;
}
export async function resetPassword(id: string, password: string): Promise<{ok:boolean}> {
  const { data } = await api.post(`/api/users/${id}/reset-password`, { password });
  return data;
}
export async function linkTechnician(id: string, technicianId: string): Promise<{ok:boolean}> {
  const { data } = await api.post(`/api/users/${id}/link-technician`, { technicianId });
  return data;
}
export async function unlinkTechnician(id: string): Promise<{ok:boolean}> {
  const { data } = await api.post(`/api/users/${id}/unlink-technician`);
  return data;
}
export async function listTechnicians(): Promise<Technician[]> {
  const { data } = await api.get('/api/technicians');
  return data;
}