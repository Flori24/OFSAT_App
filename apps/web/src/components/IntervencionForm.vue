<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-tools me-2"></i>
            {{ isEditing ? 'Editar Intervención' : 'Nueva Intervención' }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <!-- Información básica -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label">Técnico Asignado <span class="text-danger">*</span></label>
                <select 
                  class="form-select" 
                  v-model="form.tecnicoAsignadoId" 
                  :class="{ 'is-invalid': errors.tecnicoAsignadoId }"
                  required
                >
                  <option value="">Seleccionar técnico...</option>
                  <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                    {{ tech.nombre }}
                  </option>
                </select>
                <div class="invalid-feedback">{{ errors.tecnicoAsignadoId }}</div>
              </div>
              
              <div class="col-md-6">
                <label class="form-label">Tipo Acción <span class="text-danger">*</span></label>
                <select 
                  class="form-select" 
                  v-model="form.tipoAccion" 
                  :class="{ 'is-invalid': errors.tipoAccion }"
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="Diagnostico">Diagnóstico</option>
                  <option value="Reparacion">Reparación</option>
                  <option value="Sustitucion">Sustitución</option>
                  <option value="Configuracion">Configuración</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Revision">Revisión</option>
                </select>
                <div class="invalid-feedback">{{ errors.tipoAccion }}</div>
              </div>
            </div>

            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">Estado Tarea <span class="text-danger">*</span></label>
                <select 
                  class="form-select" 
                  v-model="form.estadoTarea" 
                  :class="{ 'is-invalid': errors.estadoTarea }"
                  required
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="EnCurso">En Curso</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
                <div class="invalid-feedback">{{ errors.estadoTarea }}</div>
              </div>
              
              <div class="col-md-4">
                <label class="form-label">Resultado</label>
                <select class="form-select" v-model="form.resultado">
                  <option value="">Sin resultado...</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="NoResuelto">No Resuelto</option>
                  <option value="PendientePiezas">Pendiente Piezas</option>
                  <option value="Escalado">Escalado</option>
                </select>
              </div>
              
              <div class="col-md-4">
                <label class="form-label">Ubicación</label>
                <select class="form-select" v-model="form.ubicacion">
                  <option value="">Sin especificar...</option>
                  <option value="Remota">Remota</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Taller">Taller</option>
                </select>
              </div>
            </div>

            <!-- Fechas y tiempos -->
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">Fecha/Hora Programada</label>
                <input 
                  type="datetime-local" 
                  class="form-control" 
                  v-model="form.fechaHoraProgramada"
                  :class="{ 'is-invalid': errors.fechaHoraProgramada }"
                >
                <div class="invalid-feedback">{{ errors.fechaHoraProgramada }}</div>
              </div>
              
              <div class="col-md-4">
                <label class="form-label">Fecha/Hora Inicio</label>
                <input 
                  type="datetime-local" 
                  class="form-control" 
                  v-model="form.fechaHoraInicio"
                  :class="{ 'is-invalid': errors.fechaHoraInicio }"
                >
                <div class="invalid-feedback">{{ errors.fechaHoraInicio }}</div>
              </div>
              
              <div class="col-md-4">
                <label class="form-label">Fecha/Hora Fin</label>
                <input 
                  type="datetime-local" 
                  class="form-control" 
                  v-model="form.fechaHoraFin"
                  :class="{ 'is-invalid': errors.fechaHoraFin }"
                >
                <div class="invalid-feedback">{{ errors.fechaHoraFin }}</div>
              </div>
            </div>

            <!-- Costo estimado y descripción -->
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label">Coste Estimado (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  class="form-control" 
                  v-model="form.costeEstimado"
                  placeholder="0.00"
                >
              </div>
              
              <div class="col-md-8">
                <label class="form-label">Descripción</label>
                <textarea 
                  class="form-control" 
                  v-model="form.descripcion" 
                  rows="3"
                  placeholder="Descripción detallada de la intervención..."
                ></textarea>
              </div>
            </div>

            <!-- Firma digital -->
            <div class="mb-4" v-if="isEditing">
              <label class="form-label">Firma del Cliente</label>
              <div class="border rounded p-3">
                <div class="mb-3">
                  <canvas 
                    ref="signatureCanvas"
                    width="600" 
                    height="200" 
                    class="border w-100"
                    style="max-height: 200px; cursor: crosshair;"
                    @mousedown="startSigning"
                    @mousemove="sign"
                    @mouseup="stopSigning"
                    @touchstart="startSigning"
                    @touchmove="sign"
                    @touchend="stopSigning"
                  ></canvas>
                </div>
                <div class="d-flex gap-2">
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary btn-sm"
                    @click="clearSignature"
                  >
                    <i class="fas fa-eraser me-1"></i>
                    Limpiar Firma
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-primary btn-sm"
                    @click="saveSignature"
                    :disabled="!hasSignature"
                  >
                    <i class="fas fa-save me-1"></i>
                    Guardar Firma
                  </button>
                  <div v-if="intervencion?.firmaClienteUrl" class="ms-auto">
                    <span class="text-success">
                      <i class="fas fa-check me-1"></i>
                      Firma guardada
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Adjuntos -->
            <div class="mb-4" v-if="isEditing">
              <label class="form-label">Adjuntos</label>
              <div class="border rounded p-3">
                <input 
                  type="file" 
                  class="form-control mb-3"
                  ref="fileInput"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  @change="handleFileSelect"
                >
                <div class="small text-muted mb-3">
                  Formatos permitidos: PDF, JPG, PNG, DOC, DOCX. Máximo 5MB por archivo.
                </div>
                
                <!-- Archivos seleccionados para subir -->
                <div v-if="selectedFiles.length > 0" class="mb-3">
                  <strong>Archivos seleccionados:</strong>
                  <ul class="list-group mt-2">
                    <li v-for="(file, index) in selectedFiles" :key="index" 
                        class="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i class="fas fa-file me-2"></i>
                        {{ file.name }}
                        <small class="text-muted ms-2">({{ formatFileSize(file.size) }})</small>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-outline-danger btn-sm"
                        @click="removeFile(index)"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </li>
                  </ul>
                  <button 
                    type="button" 
                    class="btn btn-outline-primary btn-sm mt-2"
                    @click="uploadFiles"
                    :disabled="uploadingFiles"
                  >
                    <i class="fas fa-upload me-1"></i>
                    {{ uploadingFiles ? 'Subiendo...' : 'Subir Archivos' }}
                  </button>
                </div>

                <!-- Archivos ya subidos -->
                <div v-if="intervencion?.adjuntosJson && intervencion.adjuntosJson.length > 0">
                  <strong>Archivos subidos:</strong>
                  <ul class="list-group mt-2">
                    <li v-for="(archivo, index) in intervencion.adjuntosJson" :key="index" 
                        class="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i class="fas fa-file me-2"></i>
                        {{ archivo.name }}
                      </div>
                      <div>
                        <a :href="archivo.url" target="_blank" class="btn btn-outline-primary btn-sm me-2">
                          <i class="fas fa-eye"></i>
                        </a>
                        <button 
                          type="button" 
                          class="btn btn-outline-danger btn-sm"
                          @click="removeUploadedFile(index)"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Materiales -->
            <div class="mb-4" v-if="isEditing">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <label class="form-label mb-0">Materiales</label>
                <button 
                  type="button" 
                  class="btn btn-outline-primary btn-sm"
                  @click="showAddMaterial = true"
                >
                  <i class="fas fa-plus me-1"></i>
                  Agregar Material
                </button>
              </div>
              
              <div class="table-responsive" v-if="intervencion?.materiales && intervencion.materiales.length > 0">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Código Artículo</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Descuento</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="material in intervencion.materiales" :key="material.id">
                      <td>{{ material.codigoArticulo }}</td>
                      <td>{{ material.unidadesUtilizadas }}</td>
                      <td>{{ formatCurrency(material.precio) }}</td>
                      <td>{{ material.descuento }}%</td>
                      <td>{{ formatCurrency(material.importeTotal) }}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button 
                            type="button"
                            class="btn btn-outline-warning btn-sm"
                            @click="editMaterial(material)"
                          >
                            <i class="fas fa-edit"></i>
                          </button>
                          <button 
                            type="button"
                            class="btn btn-outline-danger btn-sm"
                            @click="deleteMaterial(material.id)"
                          >
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr class="table-primary fw-bold">
                      <td colspan="4">Total Materiales:</td>
                      <td>{{ formatCurrency(intervencion.totales.importeTotal) }}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div v-else class="text-muted text-center py-3">
                No hay materiales agregados
              </div>
            </div>

            <!-- Validación global -->
            <div v-if="globalError" class="alert alert-danger">
              <i class="fas fa-exclamation-triangle me-2"></i>
              {{ globalError }}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="fas fa-save me-1"></i>
              {{ isEditing ? 'Actualizar' : 'Crear' }} Intervención
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal para agregar/editar material -->
    <div v-if="showAddMaterial" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.7); z-index: 1060;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingMaterial ? 'Editar Material' : 'Agregar Material' }}
            </h5>
            <button type="button" class="btn-close" @click="closeMaterialForm"></button>
          </div>
          <form @submit.prevent="saveMaterial">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Código Artículo <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="materialForm.codigoArticulo"
                  :class="{ 'is-invalid': materialErrors.codigoArticulo }"
                  required
                >
                <div class="invalid-feedback">{{ materialErrors.codigoArticulo }}</div>
              </div>
              
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Cantidad <span class="text-danger">*</span></label>
                  <input 
                    type="number" 
                    min="1" 
                    step="1" 
                    class="form-control" 
                    v-model="materialForm.unidadesUtilizadas"
                    :class="{ 'is-invalid': materialErrors.unidadesUtilizadas }"
                    required
                  >
                  <div class="invalid-feedback">{{ materialErrors.unidadesUtilizadas }}</div>
                </div>
                
                <div class="col-md-6">
                  <label class="form-label">Precio (€) <span class="text-danger">*</span></label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    class="form-control" 
                    v-model="materialForm.precio"
                    :class="{ 'is-invalid': materialErrors.precio }"
                    required
                  >
                  <div class="invalid-feedback">{{ materialErrors.precio }}</div>
                </div>
              </div>
              
              <div class="mt-3">
                <label class="form-label">Descuento (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="1" 
                  class="form-control" 
                  v-model="materialForm.descuento"
                  placeholder="0"
                >
              </div>
              
              <div class="mt-3" v-if="materialForm.precio && materialForm.unidadesUtilizadas">
                <div class="alert alert-info">
                  <strong>Total calculado:</strong> 
                  {{ formatCurrency(calculateMaterialTotal()) }}
                  <span v-if="materialForm.descuento > 0" class="small">
                    (Precio: {{ formatCurrency(materialForm.precio * materialForm.unidadesUtilizadas) }}, 
                    Descuento: {{ materialForm.descuento }}%)
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeMaterialForm">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="materialLoading">
                <span v-if="materialLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ editingMaterial ? 'Actualizar' : 'Agregar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { useIntervencionesStore } from '@/stores/intervenciones';
import { apiService, type Intervencion, type Technician, type CreateMaterialInput, type UpdateMaterialInput } from '@/services/api';

// Props & Emits
interface Props {
  show: boolean;
  intervencion?: Intervencion | null;
  ticketNumero: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  saved: [intervencion: Intervencion];
}>();

// Store
const store = useIntervencionesStore();

// Refs
const signatureCanvas = ref<HTMLCanvasElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// State
const loading = ref(false);
const materialLoading = ref(false);
const uploadingFiles = ref(false);
const technicians = ref<Technician[]>([]);
const selectedFiles = ref<File[]>([]);
const showAddMaterial = ref(false);
const editingMaterial = ref<any>(null);

// Signature state
const isDrawing = ref(false);
const hasSignature = ref(false);
const lastPoint = ref<{ x: number; y: number } | null>(null);

// Form data
const form = reactive({
  fechaHoraProgramada: '',
  fechaHoraInicio: '',
  fechaHoraFin: '',
  tecnicoAsignadoId: '',
  tipoAccion: '',
  descripcion: '',
  estadoTarea: 'Pendiente',
  costeEstimado: null as number | null,
  resultado: '',
  ubicacion: ''
});

const materialForm = reactive({
  codigoArticulo: '',
  unidadesUtilizadas: 1,
  precio: 0,
  descuento: 0
});

// Errors
const errors = reactive({
  tecnicoAsignadoId: '',
  tipoAccion: '',
  estadoTarea: '',
  fechaHoraProgramada: '',
  fechaHoraInicio: '',
  fechaHoraFin: ''
});

const materialErrors = reactive({
  codigoArticulo: '',
  unidadesUtilizadas: '',
  precio: ''
});

const globalError = ref('');

// Computed
const isEditing = computed(() => !!props.intervencion);

// Methods
const loadTechnicians = async () => {
  try {
    technicians.value = await apiService.technicians.list();
  } catch (error) {
    console.error('Error loading technicians:', error);
  }
};

const initializeForm = () => {
  if (props.intervencion) {
    // Edit mode - populate form
    const int = props.intervencion;
    form.fechaHoraProgramada = int.fechaHoraProgramada ? formatDateTimeLocal(int.fechaHoraProgramada) : '';
    form.fechaHoraInicio = int.fechaHoraInicio ? formatDateTimeLocal(int.fechaHoraInicio) : '';
    form.fechaHoraFin = int.fechaHoraFin ? formatDateTimeLocal(int.fechaHoraFin) : '';
    form.tecnicoAsignadoId = int.tecnicoAsignadoId;
    form.tipoAccion = int.tipoAccion;
    form.descripcion = int.descripcion || '';
    form.estadoTarea = int.estadoTarea;
    form.costeEstimado = int.costeEstimado;
    form.resultado = int.resultado || '';
    form.ubicacion = int.ubicacion || '';
  } else {
    // New mode - reset form
    Object.keys(form).forEach(key => {
      if (key === 'estadoTarea') {
        (form as any)[key] = 'Pendiente';
      } else if (key === 'costeEstimado') {
        (form as any)[key] = null;
      } else {
        (form as any)[key] = '';
      }
    });
  }
  
  // Clear errors
  Object.keys(errors).forEach(key => {
    (errors as any)[key] = '';
  });
  globalError.value = '';
};

const validateForm = () => {
  let isValid = true;
  
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    (errors as any)[key] = '';
  });
  globalError.value = '';
  
  // Required fields
  if (!form.tecnicoAsignadoId) {
    errors.tecnicoAsignadoId = 'El técnico asignado es requerido';
    isValid = false;
  }
  
  if (!form.tipoAccion) {
    errors.tipoAccion = 'El tipo de acción es requerido';
    isValid = false;
  }
  
  if (!form.estadoTarea) {
    errors.estadoTarea = 'El estado de la tarea es requerido';
    isValid = false;
  }
  
  // Date validation
  if (form.fechaHoraFin && !form.fechaHoraInicio) {
    errors.fechaHoraFin = 'Si especifica fecha fin, debe especificar fecha inicio';
    isValid = false;
  }
  
  if (form.fechaHoraInicio && form.fechaHoraFin) {
    const inicio = new Date(form.fechaHoraInicio);
    const fin = new Date(form.fechaHoraFin);
    
    if (fin <= inicio) {
      errors.fechaHoraFin = 'La fecha fin debe ser mayor que la fecha inicio';
      isValid = false;
    }
  }
  
  // State validation
  if (form.estadoTarea === 'Finalizada') {
    if (!form.fechaHoraInicio || !form.fechaHoraFin) {
      globalError.value = 'Para marcar como "Finalizada" debe especificar fecha inicio y fin';
      isValid = false;
    }
  }
  
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  
  try {
    const data = {
      ...form,
      fechaHoraProgramada: form.fechaHoraProgramada || null,
      fechaHoraInicio: form.fechaHoraInicio || null,
      fechaHoraFin: form.fechaHoraFin || null,
      descripcion: form.descripcion || undefined,
      costeEstimado: form.costeEstimado || null,
      resultado: form.resultado || null,
      ubicacion: form.ubicacion || null,
    };
    
    let result: Intervencion;
    
    if (isEditing.value) {
      result = await store.updateIntervencion(props.intervencion!.id, data);
    } else {
      result = await store.createIntervencion(props.ticketNumero, data);
    }
    
    emit('saved', result);
  } catch (error: any) {
    console.error('Error saving intervention:', error);
    globalError.value = error.response?.data?.error?.message || 'Error al guardar la intervención';
  } finally {
    loading.value = false;
  }
};

// Signature methods
const getMousePos = (e: MouseEvent) => {
  const rect = signatureCanvas.value!.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (signatureCanvas.value!.width / rect.width),
    y: (e.clientY - rect.top) * (signatureCanvas.value!.height / rect.height)
  };
};

const getTouchPos = (e: TouchEvent) => {
  const rect = signatureCanvas.value!.getBoundingClientRect();
  const touch = e.touches[0];
  return {
    x: (touch.clientX - rect.left) * (signatureCanvas.value!.width / rect.width),
    y: (touch.clientY - rect.top) * (signatureCanvas.value!.height / rect.height)
  };
};

const startSigning = (e: MouseEvent | TouchEvent) => {
  isDrawing.value = true;
  const canvas = signatureCanvas.value!;
  const ctx = canvas.getContext('2d')!;
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  const pos = e instanceof MouseEvent ? getMousePos(e) : getTouchPos(e);
  lastPoint.value = pos;
  
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  
  e.preventDefault();
};

const sign = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !lastPoint.value) return;
  
  const canvas = signatureCanvas.value!;
  const ctx = canvas.getContext('2d')!;
  const pos = e instanceof MouseEvent ? getMousePos(e) : getTouchPos(e);
  
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  
  lastPoint.value = pos;
  hasSignature.value = true;
  
  e.preventDefault();
};

const stopSigning = () => {
  isDrawing.value = false;
  lastPoint.value = null;
};

const clearSignature = () => {
  const canvas = signatureCanvas.value!;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasSignature.value = false;
};

const saveSignature = async () => {
  if (!hasSignature.value || !props.intervencion) return;
  
  const canvas = signatureCanvas.value!;
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    
    const file = new File([blob], 'firma.png', { type: 'image/png' });
    
    try {
      loading.value = true;
      const updated = await store.uploadFirma(props.intervencion!.id, file);
      emit('saved', updated);
      hasSignature.value = false;
      clearSignature();
    } catch (error) {
      console.error('Error saving signature:', error);
      globalError.value = 'Error al guardar la firma';
    } finally {
      loading.value = false;
    }
  }, 'image/png');
};

// File methods
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  
  const files = Array.from(target.files);
  const validFiles: File[] = [];
  
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert(`El archivo ${file.name} es demasiado grande. Máximo 5MB.`);
      continue;
    }
    
    validFiles.push(file);
  }
  
  selectedFiles.value = [...selectedFiles.value, ...validFiles];
  target.value = ''; // Clear input
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const uploadFiles = async () => {
  if (!selectedFiles.value.length || !props.intervencion) return;
  
  uploadingFiles.value = true;
  
  try {
    // Create FileList from selected files
    const dt = new DataTransfer();
    selectedFiles.value.forEach(file => dt.items.add(file));
    const fileList = dt.files;
    
    const updated = await store.uploadAdjuntos(props.intervencion.id, fileList);
    emit('saved', updated);
    selectedFiles.value = [];
  } catch (error) {
    console.error('Error uploading files:', error);
    globalError.value = 'Error al subir archivos';
  } finally {
    uploadingFiles.value = false;
  }
};

const removeUploadedFile = async (index: number) => {
  // This would require a backend endpoint to remove specific files
  // For now, just show a message
  alert('La funcionalidad de eliminar archivos individuales será implementada próximamente');
};

// Material methods
const editMaterial = (material: any) => {
  editingMaterial.value = material;
  materialForm.codigoArticulo = material.codigoArticulo;
  materialForm.unidadesUtilizadas = material.unidadesUtilizadas;
  materialForm.precio = material.precio;
  materialForm.descuento = material.descuento;
  showAddMaterial.value = true;
};

const closeMaterialForm = () => {
  showAddMaterial.value = false;
  editingMaterial.value = null;
  Object.keys(materialForm).forEach(key => {
    if (key === 'unidadesUtilizadas') {
      (materialForm as any)[key] = 1;
    } else if (key === 'descuento') {
      (materialForm as any)[key] = 0;
    } else {
      (materialForm as any)[key] = key === 'precio' ? 0 : '';
    }
  });
  Object.keys(materialErrors).forEach(key => {
    (materialErrors as any)[key] = '';
  });
};

const validateMaterialForm = () => {
  let isValid = true;
  
  Object.keys(materialErrors).forEach(key => {
    (materialErrors as any)[key] = '';
  });
  
  if (!materialForm.codigoArticulo) {
    materialErrors.codigoArticulo = 'El código del artículo es requerido';
    isValid = false;
  }
  
  if (!materialForm.unidadesUtilizadas || materialForm.unidadesUtilizadas < 1) {
    materialErrors.unidadesUtilizadas = 'La cantidad debe ser mayor a 0';
    isValid = false;
  }
  
  if (!materialForm.precio || materialForm.precio <= 0) {
    materialErrors.precio = 'El precio debe ser mayor a 0';
    isValid = false;
  }
  
  return isValid;
};

const saveMaterial = async () => {
  if (!validateMaterialForm() || !props.intervencion) return;
  
  materialLoading.value = true;
  
  try {
    const data = {
      codigoArticulo: materialForm.codigoArticulo,
      unidadesUtilizadas: materialForm.unidadesUtilizadas,
      precio: materialForm.precio,
      descuento: materialForm.descuento || 0
    };
    
    let updated: Intervencion;
    
    if (editingMaterial.value) {
      updated = await store.updateMaterial(props.intervencion.id, editingMaterial.value.id, data);
    } else {
      updated = await store.addMaterials(props.intervencion.id, [data]);
    }
    
    emit('saved', updated);
    closeMaterialForm();
  } catch (error: any) {
    console.error('Error saving material:', error);
    // Set material form error or show global error
  } finally {
    materialLoading.value = false;
  }
};

const deleteMaterial = async (materialId: string) => {
  if (!props.intervencion) return;
  
  if (confirm('¿Está seguro de eliminar este material?')) {
    try {
      const updated = await store.deleteMaterial(props.intervencion.id, materialId);
      emit('saved', updated);
    } catch (error) {
      console.error('Error deleting material:', error);
      globalError.value = 'Error al eliminar material';
    }
  }
};

const calculateMaterialTotal = () => {
  const subtotal = materialForm.precio * materialForm.unidadesUtilizadas;
  const descuento = subtotal * (materialForm.descuento / 100);
  return subtotal - descuento;
};

// Utility functions
const formatDateTimeLocal = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount);
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Lifecycle
onMounted(async () => {
  await loadTechnicians();
  initializeForm();
  
  // Initialize signature canvas
  if (signatureCanvas.value) {
    const ctx = signatureCanvas.value.getContext('2d')!;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }
});
</script>

<style scoped>
.modal-xl {
  max-width: 1200px;
}

.form-label span.text-danger {
  font-size: 0.9em;
}

canvas {
  border: 2px dashed #dee2e6;
  border-radius: 0.375rem;
}

canvas:hover {
  border-color: #86b7fe;
}

.list-group-item {
  padding: 0.5rem 1rem;
}

@media (max-width: 768px) {
  .modal-xl {
    max-width: 95%;
  }
  
  canvas {
    height: 150px !important;
  }
}
</style>