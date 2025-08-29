# 🔄 Migration Analysis: Technician to Tecnico Model

## 📋 Migration Overview

This migration transforms the existing `Technician` model to a new comprehensive `Tecnico` model with enhanced features for scheduling, specialization management, and business logic.

---

## 🔄 **Schema Changes**

### 1. **Enum Updates**
```sql
-- Role enum changes
BEFORE: ADMIN | GESTOR | TECNICO | LECTOR  
AFTER:  ADMIN | TECNICO | SUPERVISOR | USER
```

### 2. **Model Transformation**
```sql
-- Old Technician Model
CREATE TABLE "Technician" (
    "id" TEXT PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "perfil" TEXT,
    "userId" TEXT UNIQUE,
    -- Basic structure only
);

-- New Tecnico Model  
CREATE TABLE "Tecnico" (
    "id" TEXT PRIMARY KEY,
    "usuarioId" TEXT UNIQUE NOT NULL,  -- Required FK
    "nombre" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,      -- Now required & unique
    "telefono" TEXT,
    "activo" BOOLEAN DEFAULT true,     -- Active status
    "especialidades" TEXT[],           -- Skills array
    "zonas" TEXT[],                    -- Work zones array
    "tarifaHora" DECIMAL(10,2),        -- Hourly rate
    "capacidadDia" INTEGER,            -- Daily capacity (minutes)
    "color" TEXT,                      -- Calendar color
    "firmaUrl" TEXT,                   -- Signature image
    "notas" TEXT,                      -- Notes field
    "createdAt" TIMESTAMP(3) DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

### 3. **New Indices for Performance**
```sql
-- Tecnico indices
CREATE INDEX "Tecnico_activo_idx" ON "Tecnico"("activo");
CREATE INDEX "Tecnico_email_idx" ON "Tecnico"("email");  
CREATE INDEX "Tecnico_usuarioId_idx" ON "Tecnico"("usuarioId");

-- Additional reporting indices
CREATE INDEX "Intervencion_fechaHoraInicio_idx" ON "Intervencion"("fechaHoraInicio");
CREATE INDEX "Intervencion_tecnicoAsignadoId_estadoTarea_idx" ON "Intervencion"("tecnicoAsignadoId", "estadoTarea");
```

---

## ⚠️ **Breaking Changes & Data Impact**

### **High Impact Changes**
1. **Model Rename**: `Technician` → `Tecnico`
2. **Required Fields**: `email` now required and unique
3. **Foreign Key**: `usuarioId` now required (was optional)
4. **Role Enum**: Removed `GESTOR` and `LECTOR`, added `SUPERVISOR` and `USER`

### **Data Migration Required**
- **Existing Records**: All current `Technician` records need transformation
- **Default Values**: New fields need sensible defaults
- **Validation**: Email uniqueness must be enforced
- **Relationship Updates**: All FK references need updating

---

## 🚀 **New Features Added**

### **Business Intelligence**
- `especialidades`: Multi-select skills (Informatica, ImpHW, ImpSW)
- `zonas`: Work area assignments (geographical zones)
- `tarifaHora`: Hourly billing rate for cost calculations
- `capacidadDia`: Daily work capacity for scheduling optimization

### **User Experience**
- `color`: Personalized calendar colors for visual organization
- `firmaUrl`: Digital signature storage for documentation
- `notas`: Additional notes and comments
- `activo`: Soft delete capability for inactive technicians

### **System Integration**
- Enhanced audit logging with `AuditLog` table
- Performance indices for reporting queries
- Proper CASCADE deletion with User relationship

---

## 📊 **Migration SQL Script**

```sql
-- Step 1: Backup existing data
CREATE TABLE "Technician_backup" AS SELECT * FROM "Technician";

-- Step 2: Apply schema changes
BEGIN;

-- Update Role enum
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'TECNICO', 'SUPERVISOR', 'USER');
ALTER TABLE "User" ALTER COLUMN "roles" TYPE "Role_new"[] USING ("roles"::text::"Role_new"[]);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

-- Drop old relationships
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_technicianId_fkey";
ALTER TABLE "Technician" DROP CONSTRAINT "Technician_userId_fkey";

-- Create new Tecnico table
CREATE TABLE "Tecnico" (
    "id" TEXT PRIMARY KEY,
    "usuarioId" TEXT UNIQUE NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "especialidades" TEXT[],
    "zonas" TEXT[],
    "tarifaHora" DECIMAL(10,2),
    "capacidadDia" INTEGER,
    "color" TEXT,
    "firmaUrl" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create indices
CREATE INDEX "Tecnico_activo_idx" ON "Tecnico"("activo");
CREATE INDEX "Tecnico_email_idx" ON "Tecnico"("email");
CREATE INDEX "Tecnico_usuarioId_idx" ON "Tecnico"("usuarioId");

-- Restore relationships
ALTER TABLE "Tecnico" ADD CONSTRAINT "Tecnico_usuarioId_fkey" 
    FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_technicianId_fkey" 
    FOREIGN KEY ("technicianId") REFERENCES "Tecnico"("id") ON DELETE SET NULL;

COMMIT;
```

---

## 🔧 **Service Layer Updates Required**

### **File Updates Needed**
1. **Services**: Update all references to `Technician` → `Tecnico`
2. **Routes**: Update API endpoints and validation
3. **Types**: Update TypeScript interfaces
4. **Tests**: Update test data and assertions

### **API Changes**
```typescript
// Before
technician?: Technician

// After  
tecnico?: Tecnico
```

---

## ✅ **Post-Migration Validation**

### **Data Integrity Checks**
```sql
-- Verify record count matches
SELECT 'Technician_backup' as source, COUNT(*) FROM "Technician_backup"
UNION ALL  
SELECT 'Tecnico' as source, COUNT(*) FROM "Tecnico";

-- Check for missing relationships
SELECT t.*, u.username FROM "Tecnico" t
LEFT JOIN "User" u ON u.id = t."usuarioId"
WHERE u.id IS NULL;

-- Verify unique constraints
SELECT email, COUNT(*) FROM "Tecnico" GROUP BY email HAVING COUNT(*) > 1;
```

### **Functional Testing**
- [ ] User-Tecnico relationship working
- [ ] Ticket assignment to technicians working  
- [ ] Intervention assignment working
- [ ] Reporting endpoints updated
- [ ] Authentication flow unaffected

---

## 📈 **Performance Impact**

### **Positive Impacts**
- ✅ New indices improve reporting query performance
- ✅ Required relationships eliminate null checks
- ✅ Specialized fields enable better business logic

### **Potential Concerns**
- ⚠️ Larger table size with additional fields
- ⚠️ Array fields (`especialidades`, `zonas`) need proper indexing for searches
- ⚠️ Email uniqueness enforcement may require data cleanup

---

## 🎯 **Next Steps**

1. **Pre-Migration**: Execute data backup and validation
2. **Apply Migration**: Run the schema changes
3. **Data Migration**: Transform and migrate existing records  
4. **Service Updates**: Update all service layer references
5. **Testing**: Comprehensive functional testing
6. **Deployment**: Staged rollout with rollback plan

---

## 📝 **Migration Execution Summary**

**Impact Level**: 🔴 **High** - Breaking changes to core entity  
**Downtime Required**: ⚠️ **Yes** - Schema and data migration  
**Rollback Complexity**: 🔶 **Medium** - Data backup available  
**Testing Requirements**: 🔴 **Extensive** - Core functionality affected

This migration significantly enhances the technician management system while requiring careful data migration and service layer updates.