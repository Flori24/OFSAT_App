-- Data Migration Strategy: Technician to Tecnico Model Transition
-- This script should be executed BEFORE applying the schema migration

-- Step 1: Create temporary backup of existing Technician data
CREATE TABLE "Technician_backup" AS SELECT * FROM "Technician";

-- Step 2: Data transformation strategy
-- Note: This migration assumes that:
-- 1. All existing technicians have corresponding users with TECNICO role
-- 2. Default values will be used for new fields
-- 3. Manual data mapping may be required for some fields

-- Step 3: Insert data into new Tecnico table (to be executed AFTER schema migration)
/*
INSERT INTO "Tecnico" (
    id,
    "usuarioId", 
    nombre,
    email,
    telefono,
    activo,
    especialidades,
    zonas,
    "tarifaHora",
    "capacidadDia",
    color,
    "firmaUrl",
    notas,
    "createdAt",
    "updatedAt"
)
SELECT 
    t.id,
    COALESCE(t."userId", u.id) as "usuarioId",
    t.nombre,
    COALESCE(t.email, u.email) as email,
    t.telefono,
    true as activo, -- Default to active
    ARRAY['General'] as especialidades, -- Default specialization
    ARRAY['Andorra la Vella'] as zonas, -- Default zone
    NULL as "tarifaHora",
    420 as "capacidadDia", -- Default 7 hours (420 minutes)
    '#007bff' as color, -- Default blue color
    NULL as "firmaUrl",
    t.perfil as notas, -- Map perfil to notas
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM "Technician_backup" t
LEFT JOIN "User" u ON u.id = t."userId"
WHERE t."userId" IS NOT NULL
   OR u."roles" @> ARRAY['TECNICO'::Role];
*/

-- Step 4: Verification queries (to be executed AFTER migration)
/*
-- Verify data integrity
SELECT 
    'Original Technicians' as table_name, 
    COUNT(*) as record_count 
FROM "Technician_backup"
UNION ALL
SELECT 
    'New Tecnicos' as table_name,
    COUNT(*) as record_count 
FROM "Tecnico";

-- Check for unmapped records
SELECT 
    t.*,
    u.username,
    u."displayName"
FROM "Technician_backup" t
LEFT JOIN "User" u ON u.id = t."userId"
WHERE t."userId" IS NULL 
   OR u.id IS NULL;
*/

-- Step 5: Cleanup (execute only after verification)
-- DROP TABLE "Technician_backup";