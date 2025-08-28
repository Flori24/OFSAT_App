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

- **postgres**: Base de datos PostgreSQL 16 con volumen persistente
- **api**: API Backend con hot-reload y bind mounts para desarrollo
- **web**: Frontend con hot-reload y bind mounts para desarrollo

### Comandos Docker principales:

```bash
# 🚀 Iniciar servicios con build (Recomendado)
pnpm run dev:docker

# Equivalente a:
docker compose -f docker/docker-compose.yml up -d --build

# Ver logs en tiempo real
docker compose -f docker/docker-compose.yml logs -f

# Ver logs de un servicio específico
docker compose -f docker/docker-compose.yml logs -f api
docker compose -f docker/docker-compose.yml logs -f web

# Detener servicios
docker compose -f docker/docker-compose.yml down

# Detener y limpiar volúmenes (⚠️ Elimina datos de BD)
docker compose -f docker/docker-compose.yml down -v
```

### 🗃️ Migraciones y Seeds:

```bash
# Ejecutar migraciones desde contenedor Docker
docker compose -f docker/docker-compose.yml exec api pnpm prisma:migrate

# Ejecutar seeds desde contenedor Docker  
docker compose -f docker/docker-compose.yml exec api pnpm prisma:seed

# O usando el script del workspace:
pnpm run seed:docker
```

### 🔧 Comandos de mantenimiento:

```bash
# Reiniciar un servicio específico
docker compose -f docker/docker-compose.yml restart api
docker compose -f docker/docker-compose.yml restart web
docker compose -f docker/docker-compose.yml restart postgres

# Reconstruir un servicio específico
docker compose -f docker/docker-compose.yml up -d --build api

# Acceder al bash de un contenedor
docker compose -f docker/docker-compose.yml exec api bash
docker compose -f docker/docker-compose.yml exec web bash

# Acceder a PostgreSQL
docker compose -f docker/docker-compose.yml exec postgres psql -U ofsat_app -d ofsat_app

# Generar cliente Prisma en contenedor
docker compose -f docker/docker-compose.yml exec api pnpm prisma:gen
```

### 🐞 Troubleshooting Docker:

#### 1. **Error de puerto ocupado (EADDRINUSE)**
```bash
# Verificar qué proceso usa el puerto
sudo lsof -i :3000
sudo lsof -i :5173
sudo lsof -i :5432

# Detener los servicios Docker actuales
docker compose -f docker/docker-compose.yml down

# Reiniciar servicios
pnpm run dev:docker
```

#### 2. **Base de datos no responde**
```bash
# Verificar estado del contenedor de PostgreSQL
docker compose -f docker/docker-compose.yml ps postgres

# Ver logs de PostgreSQL
docker compose -f docker/docker-compose.yml logs postgres

# Reiniciar solo PostgreSQL
docker compose -f docker/docker-compose.yml restart postgres

# Si persiste, recrear el volumen (⚠️ Elimina datos)
docker compose -f docker/docker-compose.yml down -v
pnpm run dev:docker
docker compose -f docker/docker-compose.yml exec api pnpm prisma:migrate
docker compose -f docker/docker-compose.yml exec api pnpm prisma:seed
```

#### 3. **API no puede conectar a PostgreSQL**
```bash
# Verificar variables de entorno
docker compose -f docker/docker-compose.yml exec api env | grep DATABASE

# Verificar que PostgreSQL esté healthy
docker compose -f docker/docker-compose.yml ps

# Si postgres no está healthy, esperar o reiniciar
docker compose -f docker/docker-compose.yml restart postgres
```

#### 4. **Cambios en código no se reflejan (Hot-reload no funciona)**
```bash
# Verificar bind mounts en docker-compose.yml
docker compose -f docker/docker-compose.yml config

# Reiniciar servicio específico
docker compose -f docker/docker-compose.yml restart api
docker compose -f docker/docker-compose.yml restart web

# Verificar logs para errores de compilación
docker compose -f docker/docker-compose.yml logs -f api
```

#### 5. **Error "node_modules not found"**
```bash
# Reconstruir contenedores
docker compose -f docker/docker-compose.yml up -d --build

# Si persiste, limpiar volúmenes anonymous de node_modules
docker compose -f docker/docker-compose.yml down
docker volume prune -f
pnpm run dev:docker
```

#### 6. **CORS errors en el frontend**
```bash
# Verificar configuración CORS en API
docker compose -f docker/docker-compose.yml logs api | grep CORS

# Verificar variables de entorno
docker compose -f docker/docker-compose.yml exec api env | grep CORS_ORIGIN

# La configuración correcta es:
# CORS_ORIGIN=http://localhost:5173
```

### 📊 Monitoreo de servicios:

```bash
# Ver estado de todos los servicios
docker compose -f docker/docker-compose.yml ps

# Ver uso de recursos
docker stats ofsat_postgres ofsat_api ofsat_web

# Ver logs de los últimos 100 mensajes
docker compose -f docker/docker-compose.yml logs --tail=100

# Seguir logs de todos los servicios
docker compose -f docker/docker-compose.yml logs -f
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
- JWT Authentication (jsonwebtoken + bcrypt)
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

#### Authentication (`/api/auth`)
- `POST /api/auth/login` - Login de usuario (obtener JWT token)
- `GET /api/auth/me` - Obtener información del usuario autenticado
- `POST /api/auth/register` - Registrar nuevo usuario (solo ADMIN)

#### Users (`/api/users`)
- `GET /api/users` - Listar usuarios (solo ADMIN)
- `GET /api/users/:id` - Obtener usuario específico (solo ADMIN)
- `POST /api/users` - Crear nuevo usuario (solo ADMIN)
- `PUT /api/users/:id` - Actualizar usuario (solo ADMIN)
- `POST /api/users/:id/reset-password` - Resetear contraseña (solo ADMIN)
- `POST /api/users/:id/link-technician` - Vincular usuario a técnico (solo ADMIN)
- `POST /api/users/:id/unlink-technician` - Desvincular técnico (solo ADMIN)

### 🔐 Autenticación y Roles

El sistema implementa autenticación JWT con los siguientes roles:

- **ADMIN**: Acceso completo al sistema
- **GESTOR**: Gestión de tickets y operaciones principales
- **TECNICO**: Acceso a tickets asignados
- **LECTOR**: Solo lectura

#### Protección de rutas:

##### Tickets (`/api/tickets`):
- `GET /api/tickets`, `GET /api/tickets/:id` - Requiere autenticación
- `POST /api/tickets` - Requiere ADMIN o GESTOR
- `PUT /api/tickets/:id`, `DELETE /api/tickets/:id` - ADMIN/GESTOR tienen acceso completo, TECNICO solo a tickets asignados

##### Auth y Users:
- Todas las rutas de `/api/users` requieren rol ADMIN
- `POST /api/auth/register` requiere rol ADMIN
- `POST /api/auth/login` y `GET /api/auth/me` son públicas/autenticadas

### Ejemplos de uso con curl:

#### Autenticación:

```bash
# 1. Login (obtener token JWT)
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Respuesta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": "clz1234567890",
#     "username": "admin",
#     "displayName": "Administrador",
#     "roles": ["ADMIN"]
#   }
# }

# 2. Obtener información del usuario autenticado
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/auth/me"

# 3. Registrar nuevo usuario (solo ADMIN)
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tecnico1",
    "displayName": "Juan Técnico",
    "email": "juan@empresa.com",
    "password": "password123",
    "roles": ["TECNICO"]
  }'
```

#### Gestión de usuarios:

```bash
# Listar todos los usuarios (solo ADMIN)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/users"

# Crear usuario (solo ADMIN)
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gestor1",
    "displayName": "María Gestora",
    "email": "maria@empresa.com",
    "password": "password123",
    "roles": ["GESTOR"]
  }'

# Resetear contraseña (solo ADMIN)
curl -X POST "http://localhost:3000/api/users/USER_ID/reset-password" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "nuevaPassword123"}'
```

#### 1. Listar tickets con paginación y filtros:
```bash
# Todos los tickets (página 1, 20 por página) - REQUIERE AUTH
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/tickets"

# Con filtros
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/tickets?page=1&pageSize=10&estadoTicket=ABIERTO&urgencia=ALTA&codigoCliente=CLI001&q=impresora"

# Por rango de fechas
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/tickets?fechaDesde=2024-08-01T00:00:00.000Z&fechaHasta=2024-08-31T23:59:59.999Z"
```

#### 2. Obtener ticket específico:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/tickets/T202508-0001"
```

#### 3. Crear nuevo ticket (requiere ADMIN o GESTOR):
```bash
curl -X POST "http://localhost:3000/api/tickets" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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

#### 4. Actualizar ticket (requiere permisos):
```bash
curl -X PUT "http://localhost:3000/api/tickets/T202508-0001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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
- [x] **Frontend completo con Vue 3 + TypeScript** ✨
- [x] **Dashboard funcional con filtros y estadísticas** ✨
- [x] **Formulario completo de tickets** ✨
- [x] **Estado management con Pinia** ✨
- [x] **Integración frontend-backend completa** ✨
- [x] **Hot-reload en Docker para desarrollo** ✨
- [x] **Autenticación JWT con roles** ✨

### 🚧 Por implementar:
- [ ] Tests unitarios e integración
- [ ] Reportes y estadísticas avanzadas
- [ ] Notificaciones en tiempo real
- [ ] Subida de archivos/imágenes
- [ ] Configuración de producción

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
