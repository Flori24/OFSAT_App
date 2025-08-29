# Tecnicos Management System

This directory contains the complete Tecnicos (Technicians) management system for the OFSAT App web interface.

## 📁 Components Overview

### TecnicosList.vue
**Main listing and management page** - `/config/tecnicos`

**Features:**
- ✅ Paginated table with sorting
- ✅ Advanced filtering (text search, active/inactive, specialization, zone)
- ✅ Quick actions (activate/deactivate)
- ✅ Export to CSV functionality
- ✅ Responsive design with mobile support
- ✅ Real-time debounced search
- ✅ Visual indicators (status chips, color avatars, specialization tags)

**Columns:**
- Técnico (with color avatar and name)
- Contact info (email, phone)
- Status (active/inactive badge)
- Specializations (info badges)
- Work zones (secondary badges)  
- Hourly rate
- Daily capacity (in hours)
- Actions dropdown menu

### TecnicoForm.vue
**Create/Edit form** - `/config/tecnicos/nuevo` & `/config/tecnicos/:id/editar`

**Features:**
- ✅ Comprehensive form validation
- ✅ User autocomplete with role filtering (TECNICO users only)
- ✅ Multi-select specializations and zones
- ✅ Color picker with preset colors
- ✅ Signature upload functionality
- ✅ Capacity conversion (hours ↔ minutes)
- ✅ Real-time validation feedback
- ✅ Responsive form sections

**Form Sections:**
1. **Identity** - User selection, name, email, phone, status
2. **Operational** - Specializations, zones, rates, capacity, calendar color
3. **Digital Signature** - File upload with preview
4. **Additional Notes** - Free text field

### TecnicoDetail.vue
**Detailed view with tabs** - `/config/tecnicos/:id`

**Features:**
- ✅ Comprehensive technician profile
- ✅ KPI dashboard (monthly stats, resolution rate, earnings)
- ✅ Tabbed interface (Profile | Schedule | History)
- ✅ Recent interventions table
- ✅ Audit log timeline
- ✅ Quick edit access
- ✅ Schedule integration placeholder

**Tabs:**
- **Profile** - Contact info, specializations, zones, operational data, signature
- **Agenda** - Calendar view (placeholder) + recent interventions
- **History** - Audit log timeline with action details

## 🗃️ Store Management

### useTecnicosStore (Pinia)
**State management for technicians data**

**State:**
```typescript
{
  items: Tecnico[],
  total: number,
  page: number, 
  pageSize: number,
  loading: boolean,
  error: string | null,
  filters: TecnicoFilters
}
```

**Actions:**
- `fetch(filters)` - Load paginated tecnicos with filters
- `get(id)` - Get single tecnico by ID
- `create(data)` - Create new tecnico
- `update(id, data)` - Update existing tecnico
- `activate(id)` / `deactivate(id)` - Toggle status
- `exportCsv()` / `importCsv(file)` - Data import/export
- `getKpis(id)` - Load performance metrics
- `getRecentInterventions(id)` - Load recent work
- `getAuditLogs(id)` - Load audit history

**Getters:**
- `activeTecnicos` - Filter active only
- `tecnicosByEspecialidad(esp)` - Filter by specialization
- `tecnicosByZona(zona)` - Filter by work zone
- `getTecnicoById(id)` - Find by ID

## 🌐 API Integration

### API Service Extensions
**Added to `/services/api.ts`**

**New Interfaces:**
- `Tecnico` - Main technician data structure
- `TecnicoFilters` - Search and filter parameters
- `CreateTecnicoInput` / `UpdateTecnicoInput` - Form data
- `TecnicoKpis` - Performance metrics
- `User` - User management integration

**API Endpoints:**
```typescript
apiService.tecnicos = {
  list(filters): PaginatedResponse<Tecnico>
  get(id): Tecnico
  create(data): Tecnico
  update(id, data): Tecnico
  delete(id): void
  activate(id): void
  deactivate(id): void
  getKpis(id): TecnicoKpis
  getRecentInterventions(id): Intervencion[]
  getAuditLogs(id): AuditLog[]
  exportCsv(filters): Blob
  importCsv(file): ImportResult
  uploadFirma(id, file): Tecnico
}
```

## 🧪 Testing

### Component Tests
- **TecnicoForm.test.ts** - Form validation, user search, submission logic
- **stores/tecnicos.test.ts** - Store actions, getters, API integration
- **Coverage** - Form validation, CRUD operations, filtering, error handling

### Test Features:
- ✅ Form validation scenarios
- ✅ User autocomplete functionality  
- ✅ Multi-select components
- ✅ API mock integration
- ✅ Store state management
- ✅ Error handling
- ✅ Filter logic testing

## 🔐 Security & Permissions

**Role-Based Access Control:**
- **ADMIN** - Full access (create, edit, delete, manage all)
- **SUPERVISOR** - Full management access (create, edit, activate/deactivate)
- **TECNICO** - View only (own profile details)
- **USER** - No access

**Route Guards:**
All tecnicos routes require authentication and appropriate roles:
```typescript
meta: { requiresAuth: true, roles: ['ADMIN', 'SUPERVISOR'] }
```

## 🎨 UX/UI Features

### Visual Design
- ✅ Consistent with Argon Design System
- ✅ Responsive Bootstrap 5 layout
- ✅ FontAwesome icons throughout
- ✅ Color-coded technician avatars
- ✅ Status badges and tag systems
- ✅ Professional form styling

### User Experience
- ✅ Debounced search (500ms delay)
- ✅ Loading states and error handling
- ✅ Confirmation dialogs for destructive actions
- ✅ Toast notifications (success/error)
- ✅ Breadcrumb navigation
- ✅ Mobile-responsive design
- ✅ Keyboard navigation support

### Interactive Elements
- ✅ Sortable table columns
- ✅ Advanced filter dropdowns
- ✅ Quick action buttons
- ✅ Dropdown menus with contextual actions
- ✅ Color picker with presets
- ✅ File upload with preview
- ✅ Multi-select checkboxes

## 🔄 Integration Points

### Backend Integration
- **API Endpoints** - Full CRUD + specialized endpoints
- **File Uploads** - Signature images with preview
- **CSV Import/Export** - Bulk data management
- **Audit Logging** - Complete action tracking

### Frontend Integration
- **Router** - Clean URL structure with nested routes
- **Navigation** - Sidebar menu integration with role-based visibility
- **State Management** - Pinia store with persistent filters
- **Form Management** - Vue 3 Composition API with reactive validation

### Future Enhancements
- 📅 Calendar integration for scheduling
- 📧 Email notifications for status changes
- 📊 Advanced reporting and analytics
- 🔄 Real-time updates with WebSocket
- 📱 Mobile app integration
- 🌍 Multi-language support

## 📋 Development Notes

### Architecture Decisions
- **Vue 3 Composition API** for reactive state management
- **TypeScript** for type safety and developer experience
- **Pinia** for centralized state management
- **Axios** for HTTP client with interceptors
- **Lodash-es** for utility functions (debounce)
- **Bootstrap 5** for responsive UI components

### Code Organization
- **Separation of Concerns** - Components, stores, services clearly separated
- **Reusable Logic** - Common patterns extracted to composables
- **Type Safety** - Full TypeScript coverage with strict mode
- **Error Handling** - Consistent error handling with user feedback
- **Performance** - Optimized with debounced search and lazy loading

This comprehensive system provides complete technician management capabilities with a modern, responsive interface and robust backend integration.