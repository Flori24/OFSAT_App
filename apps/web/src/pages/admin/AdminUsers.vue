<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card shadow">
          <div class="card-header border-0">
            <div class="row align-items-center">
              <div class="col">
                <h3 class="mb-0">Gestión de Usuarios</h3>
              </div>
              <div class="col text-right">
                <button 
                  class="btn btn-sm btn-primary"
                  @click="openCreateModal"
                >
                  <i class="fas fa-plus"></i> Nuevo Usuario
                </button>
              </div>
            </div>
          </div>
          
          <!-- Búsqueda -->
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <div class="form-group">
                  <div class="input-group input-group-alternative">
                    <div class="input-group-prepend">
                      <span class="input-group-text"><i class="fas fa-search"></i></span>
                    </div>
                    <input 
                      class="form-control" 
                      placeholder="Buscar por username o nombre..."
                      v-model="searchQuery"
                      @input="onSearch"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabla de usuarios - Desktop -->
            <div class="d-none d-lg-block">
              <div class="table-responsive">
                <table class="table align-items-center table-flush">
                  <thead class="thead-light">
                    <tr>
                      <th scope="col">Usuario</th>
                      <th scope="col">Roles</th>
                      <th scope="col">Técnico</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in paginatedUsers" :key="user.id">
                      <td>
                        <div class="media align-items-center">
                          <div class="media-body">
                            <span class="mb-0 text-sm font-weight-bold">{{ user.displayName }}</span>
                            <div class="text-xs text-muted">@{{ user.username }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          v-for="role in user.roles" 
                          :key="role"
                          class="badge badge-dot me-2"
                          :class="getRoleBadgeClass(role)"
                        >
                          <i class="bg-warning"></i>
                          {{ role }}
                        </span>
                      </td>
                      <td>
                        <span v-if="user.technicianId" class="text-xs">
                          <i class="fas fa-tools text-primary"></i>
                          Vinculado
                        </span>
                        <span v-else class="text-xs text-muted">Sin vincular</span>
                      </td>
                      <td>
                        <span 
                          class="badge"
                          :class="user.isActive !== false ? 'badge-success' : 'badge-secondary'"
                        >
                          {{ user.isActive !== false ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="text-right">
                        <div class="dropdown">
                          <a class="btn btn-sm btn-icon-only text-light" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                          </a>
                          <div class="dropdown-menu dropdown-menu-right dropdown-menu-arrow">
                            <a class="dropdown-item" href="#" @click.prevent="openEditModal(user)">
                              <i class="fas fa-edit"></i> Editar
                            </a>
                            <a class="dropdown-item" href="#" @click.prevent="openResetPasswordModal(user)">
                              <i class="fas fa-key"></i> Cambiar Contraseña
                            </a>
                            <div class="dropdown-divider"></div>
                            <a 
                              class="dropdown-item" 
                              href="#" 
                              @click.prevent="openLinkTechnicianModal(user)"
                            >
                              <i class="fas fa-tools"></i> 
                              {{ user.technicianId ? 'Cambiar Técnico' : 'Vincular Técnico' }}
                            </a>
                            <a 
                              v-if="user.technicianId"
                              class="dropdown-item text-warning" 
                              href="#" 
                              @click.prevent="unlinkTechnician(user)"
                            >
                              <i class="fas fa-unlink"></i> Desvincular Técnico
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Cards de usuarios - Mobile/Tablet -->
            <div class="d-lg-none">
              <div class="row">
                <div class="col-12" v-for="user in paginatedUsers" :key="user.id">
                  <div class="card shadow-sm mb-3">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <h6 class="mb-1">{{ user.displayName }}</h6>
                          <p class="text-muted mb-2">@{{ user.username }}</p>
                          
                          <!-- Roles -->
                          <div class="mb-2">
                            <small class="text-muted d-block mb-1">Roles:</small>
                            <span 
                              v-for="role in user.roles" 
                              :key="role"
                              class="badge me-1 mb-1"
                              :class="getRoleBadgeClass(role)"
                            >
                              {{ role }}
                            </span>
                          </div>
                          
                          <!-- Estado y Técnico -->
                          <div class="d-flex flex-wrap gap-2 align-items-center">
                            <span 
                              class="badge"
                              :class="user.isActive !== false ? 'badge-success' : 'badge-secondary'"
                            >
                              {{ user.isActive !== false ? 'Activo' : 'Inactivo' }}
                            </span>
                            
                            <span v-if="user.technicianId" class="badge badge-info">
                              <i class="fas fa-tools me-1"></i>
                              Técnico Vinculado
                            </span>
                            <span v-else class="badge badge-outline-secondary">
                              Sin Técnico
                            </span>
                          </div>
                        </div>
                        
                        <!-- Acciones móviles -->
                        <div class="dropdown">
                          <button 
                            class="btn btn-sm btn-outline-primary dropdown-toggle" 
                            type="button" 
                            :id="`dropdown-${user.id}`"
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                          >
                            <i class="fas fa-cog"></i>
                          </button>
                          <ul class="dropdown-menu" :aria-labelledby="`dropdown-${user.id}`">
                            <li>
                              <a class="dropdown-item" href="#" @click.prevent="openEditModal(user)">
                                <i class="fas fa-edit me-2"></i> Editar
                              </a>
                            </li>
                            <li>
                              <a class="dropdown-item" href="#" @click.prevent="openResetPasswordModal(user)">
                                <i class="fas fa-key me-2"></i> Cambiar Contraseña
                              </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                              <a class="dropdown-item" href="#" @click.prevent="openLinkTechnicianModal(user)">
                                <i class="fas fa-tools me-2"></i> 
                                {{ user.technicianId ? 'Cambiar Técnico' : 'Vincular Técnico' }}
                              </a>
                            </li>
                            <li v-if="user.technicianId">
                              <a class="dropdown-item text-warning" href="#" @click.prevent="unlinkTechnician(user)">
                                <i class="fas fa-unlink me-2"></i> Desvincular Técnico
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paginación simple -->
            <div class="row mt-3" v-if="totalPages > 1">
              <div class="col">
                <nav aria-label="Table navigation">
                  <ul class="pagination justify-content-center">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <a class="page-link" href="#" @click.prevent="currentPage = Math.max(1, currentPage - 1)">
                        Anterior
                      </a>
                    </li>
                    <li 
                      class="page-item" 
                      :class="{ active: currentPage === page }"
                      v-for="page in visiblePages" 
                      :key="page"
                    >
                      <a class="page-link" href="#" @click.prevent="currentPage = page">
                        {{ page }}
                      </a>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                      <a class="page-link" href="#" @click.prevent="currentPage = Math.min(totalPages, currentPage + 1)">
                        Siguiente
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <UserCreateEditModal 
      v-if="showCreateEditModal"
      :user="selectedUser"
      @close="closeCreateEditModal"
      @saved="onUserSaved"
    />
    
    <ResetPasswordModal 
      v-if="showResetPasswordModal"
      :user="selectedUser"
      @close="closeResetPasswordModal"
      @saved="onPasswordReset"
    />
    
    <LinkTechnicianModal 
      v-if="showLinkTechnicianModal"
      :user="selectedUser"
      @close="closeLinkTechnicianModal"
      @saved="onTechnicianLinked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { listUsers, unlinkTechnician as unlinkTechnicianApi, type UserListItem } from '@/services/users';
import UserCreateEditModal from '@/components/admin/UserCreateEditModal.vue';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal.vue';
import LinkTechnicianModal from '@/components/admin/LinkTechnicianModal.vue';

const users = ref<UserListItem[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 10;
const loading = ref(false);

// Modales
const showCreateEditModal = ref(false);
const showResetPasswordModal = ref(false);
const showLinkTechnicianModal = ref(false);
const selectedUser = ref<UserListItem | null>(null);

// Computed
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.displayName.toLowerCase().includes(query)
  );
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredUsers.value.slice(start, end);
});

const totalPages = computed(() => 
  Math.ceil(filteredUsers.value.length / pageSize)
);

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Methods
function getRoleBadgeClass(role: string) {
  const classes = {
    'ADMIN': 'badge-danger',
    'GESTOR': 'badge-warning',
    'TECNICO': 'badge-info',
    'LECTOR': 'badge-secondary'
  };
  return classes[role as keyof typeof classes] || 'badge-secondary';
}

function onSearch() {
  currentPage.value = 1;
}

async function loadUsers() {
  loading.value = true;
  try {
    users.value = await listUsers();
  } catch (error) {
    console.error('Error loading users:', error);
  } finally {
    loading.value = false;
  }
}

// Modal handlers
function openCreateModal() {
  selectedUser.value = null;
  showCreateEditModal.value = true;
}

function openEditModal(user: UserListItem) {
  selectedUser.value = user;
  showCreateEditModal.value = true;
}

function closeCreateEditModal() {
  showCreateEditModal.value = false;
  selectedUser.value = null;
}

function openResetPasswordModal(user: UserListItem) {
  selectedUser.value = user;
  showResetPasswordModal.value = true;
}

function closeResetPasswordModal() {
  showResetPasswordModal.value = false;
  selectedUser.value = null;
}

function openLinkTechnicianModal(user: UserListItem) {
  selectedUser.value = user;
  showLinkTechnicianModal.value = true;
}

function closeLinkTechnicianModal() {
  showLinkTechnicianModal.value = false;
  selectedUser.value = null;
}

async function unlinkTechnician(user: UserListItem) {
  if (!confirm(`¿Está seguro de desvincular el técnico del usuario ${user.displayName}?`)) {
    return;
  }
  
  try {
    await unlinkTechnicianApi(user.id);
    await loadUsers(); // Reload users
  } catch (error) {
    console.error('Error unlinking technician:', error);
    alert('Error al desvincular técnico');
  }
}

// Event handlers
async function onUserSaved() {
  closeCreateEditModal();
  await loadUsers();
}

async function onPasswordReset() {
  closeResetPasswordModal();
}

async function onTechnicianLinked() {
  closeLinkTechnicianModal();
  await loadUsers();
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.badge-dot {
  padding-right: 0;
}

.badge-dot i {
  display: inline-block;
  border-radius: 50%;
  width: 0.375rem;
  height: 0.375rem;
  margin-right: 0.375rem;
}

.table td {
  vertical-align: middle;
}
</style>