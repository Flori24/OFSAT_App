# OFSAT App

Sistema de gestión de tickets desarrollado como monorepo con PNPM, Node.js, TypeScript, Express, Vue 3, PostgreSQL y Docker.

## 🏗️ Estructura del Proyecto

```
OFSAT_App/
├── apps/
│   ├── api/          # API Backend (Node.js + Express + TypeScript)
│   └── web/          # Frontend Web (Vue 3 + TypeScript + Vite)
├── docker/
│   └── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 🛠️ Requisitos

- **Node.js**: >= 20.0.0
- **PNPM**: >= 8.0.0
- **Docker** y **Docker Compose**

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

### 3. Iniciar con Docker (Recomendado)

```bash
pnpm run dev:docker
```

Este comando ejecuta:
```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### 4. Acceder a los servicios

- **API**: http://localhost:3000
  - Health check: http://localhost:3000/health
  - API endpoints: http://localhost:3000/api

- **Web**: http://localhost:5173
  - Dashboard: http://localhost:5173/tickets
  - Nuevo ticket: http://localhost:5173/tickets/new

- **PostgreSQL**: localhost:5432
  - Database: `ofsat_app`
  - User: `ofsat_app`
  - Password: `1}{,93jxGnlgb`

## 📝 Scripts Disponibles

### Scripts del workspace raíz:

```bash
# Iniciar con Docker
pnpm run dev:docker

# Desarrollo local - API
pnpm run dev:api

# Desarrollo local - Web
pnpm run dev:web

# Construir todos los proyectos
pnpm run build

# Limpiar builds
pnpm run clean

# Ejecutar seed desde contenedor Docker
pnpm run seed:docker
```

### Scripts específicos:

```bash
# API
cd apps/api
pnpm dev              # Desarrollo con hot-reload
pnpm build            # Construir para producción
pnpm start            # Iniciar en producción
pnpm prisma:gen       # Generar cliente Prisma
pnpm prisma:migrate   # Ejecutar migraciones
pnpm prisma:seed      # Ejecutar seeds

# Web
cd apps/web
pnpm dev              # Desarrollo con hot-reload
pnpm build            # Construir para producción
pnpm preview          # Vista previa del build
```

## 🐳 Docker

### Servicios incluidos:

- **postgres**: Base de datos PostgreSQL 16
- **api**: API Backend con hot-reload
- **web**: Frontend con hot-reload

### Comandos útiles:

```bash
# Iniciar servicios
docker compose -f docker/docker-compose.yml up -d --build

# Ver logs
docker compose -f docker/docker-compose.yml logs -f

# Detener servicios
docker compose -f docker/docker-compose.yml down

# Reiniciar un servicio específico
docker compose -f docker/docker-compose.yml restart api

# Acceder a la base de datos
docker compose -f docker/docker-compose.yml exec postgres psql -U ofsat_app -d ofsat_app
```

## 🗄️ Base de Datos

La configuración de la base de datos se encuentra en:
- **Schema**: `apps/api/prisma/schema.prisma`
- **Seeds**: `apps/api/prisma/seed.ts`
- **URL**: Definida en `.env.local`

Los modelos y datos se implementarán en el **Hito 1**.

## 🎨 Frontend (Vue 3)

### Tecnologías incluidas:
- Vue 3 con Composition API
- TypeScript
- Vue Router 4
- Pinia (State Management)
- Bootstrap 5
- FontAwesome
- Axios
- Vite

### Diseño:
- **Layout**: Estilo Argon Dashboard
- **Sidebar**: Navegación fija
- **Rutas implementadas**:
  - `/tickets` - Dashboard de tickets
  - `/tickets/new` - Formulario de nuevo ticket
  - `/tickets/:id` - Formulario de edición

## 🔧 Backend (Node.js + Express)

### Tecnologías incluidas:
- Express.js
- TypeScript
- Prisma ORM
- Zod (Validación)
- CORS
- Morgan (Logging)
- Error handling middleware

### API Endpoints:

#### Base
- `GET /health` - Health check
- `GET /api/` - Info de la API

#### Tickets (`/api/tickets`)
- `GET /api/tickets` - Listar tickets con paginación y filtros
- `GET /api/tickets/:id` - Obtener ticket por ID
- `POST /api/tickets` - Crear nuevo ticket
- `PUT /api/tickets/:id` - Actualizar ticket
- `DELETE /api/tickets/:id` - Eliminar ticket

#### Clients (`/api/clients`)
- `GET /api/clients` - Listar clientes (con búsqueda opcional)
- `GET /api/clients/:codigoCliente` - Obtener cliente específico
- `GET /api/clients/:codigoCliente/contracts` - Obtener contratos del cliente

#### Contracts (`/api/contracts`)
- `GET /api/contracts` - Listar contratos (con búsqueda por número de serie)
- `GET /api/contracts/:id` - Obtener contrato específico

#### Technicians (`/api/technicians`)
- `GET /api/technicians` - Listar técnicos (para desplegables)

### Ejemplos de uso con curl:

#### 1. Listar tickets con paginación y filtros:
```bash
# Todos los tickets (página 1, 20 por página)
curl "http://localhost:3000/api/tickets"

# Con filtros
curl "http://localhost:3000/api/tickets?page=1&pageSize=10&estadoTicket=ABIERTO&urgencia=ALTA&codigoCliente=CLI001&q=impresora"

# Por rango de fechas
curl "http://localhost:3000/api/tickets?fechaDesde=2024-08-01T00:00:00.000Z&fechaHasta=2024-08-31T23:59:59.999Z"
```

#### 2. Obtener ticket específico:
```bash
curl "http://localhost:3000/api/tickets/T202508-0001"
```

#### 3. Crear nuevo ticket:
```bash
curl -X POST "http://localhost:3000/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioCreacion": "admin",
    "tipoTicket": "IMPRESORA_HARDWARE",
    "categoria": "Atasco de papel",
    "subCategoria": "Bandeja principal",
    "codigoCliente": "CLI001",
    "razonSocial": "Empresa Nacional de Telecomunicaciones ANTEL",
    "contacto": "Juan Pérez",
    "telefono": "2902-1000",
    "email": "juan.perez@antel.com.uy",
    "origen": "TELEFONO",
    "urgencia": "MEDIA",
    "detalle": "Impresora presenta atascos frecuentes en bandeja principal"
  }'
```

#### 4. Actualizar ticket:
```bash
curl -X PUT "http://localhost:3000/api/tickets/T202508-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "estadoTicket": "EN_PROCESO",
    "technicianId": "clz1234567890",
    "detalle": "Ticket asignado a técnico para revisión en sitio"
  }'
```

#### 5. Listar clientes:
```bash
# Todos los clientes
curl "http://localhost:3000/api/clients"

# Buscar cliente
curl "http://localhost:3000/api/clients?q=ANTEL"
```

#### 6. Obtener contratos de un cliente:
```bash
curl "http://localhost:3000/api/clients/CLI001/contracts"
```

#### 7. Listar técnicos:
```bash
curl "http://localhost:3000/api/technicians"
```

### Respuesta típica de listado de tickets:
```json
{
  "data": [
    {
      "numeroTicket": "T202508-0001",
      "fechaCreacion": "2024-08-01T09:30:00.000Z",
      "usuarioCreacion": "admin",
      "tipoTicket": "IMPRESORA_HARDWARE",
      "categoria": "Atasco de papel",
      "codigoCliente": "CLI001",
      "razonSocial": "Empresa Nacional de Telecomunicaciones ANTEL",
      "estadoTicket": "ASIGNADA",
      "origen": "TELEFONO",
      "urgencia": "MEDIA",
      "client": {
        "codigoCliente": "CLI001",
        "razonSocial": "Empresa Nacional de Telecomunicaciones ANTEL"
      },
      "technician": {
        "id": "clz1234567890",
        "nombre": "Sandra López"
      }
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 20,
  "totalPages": 1
}
```

## 📋 Estado del Proyecto

### ✅ Completado:
- [x] Configuración del monorepo con PNPM
- [x] Setup de Docker con PostgreSQL, API y Web
- [x] API base con Express + TypeScript
- [x] Frontend base con Vue 3 + TypeScript
- [x] Layout Argon Dashboard
- [x] Rutas básicas del frontend
- [x] Health checks y configuración básica
- [x] **Modelos de base de datos (Prisma)** ✨
- [x] **CRUD completo de tickets** ✨
- [x] **API endpoints para clientes, contratos y técnicos** ✨
- [x] **Validaciones con Zod** ✨
- [x] **Paginación y filtros avanzados** ✨
- [x] **Seeding de datos realistas** ✨

### 🚧 Por implementar:
- [ ] Autenticación y autorización
- [ ] Tests unitarios e integración
- [ ] Funcionalidad completa del dashboard (frontend)
- [ ] Integración frontend-backend
- [ ] Reportes y estadísticas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
