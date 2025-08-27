-- CreateEnum
CREATE TYPE "TipoTicket" AS ENUM ('IMPRESORA_SOFTWARE', 'IMPRESORA_HARDWARE', 'INFORMATICA', 'INTERNO');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('ABIERTO', 'ASIGNADA', 'PENDIENTE', 'PENDIENTE_CLIENTE', 'PENDIENTE_PROVEEDOR', 'EN_TRANSITO', 'PENDIENTE_RMA', 'EN_PROCESO');

-- CreateEnum
CREATE TYPE "OrigenTicket" AS ENUM ('TELEFONO', 'WEB', 'MANUAL');

-- CreateEnum
CREATE TYPE "UrgenciaTicket" AS ENUM ('NORMAL', 'MEDIA', 'ALTA', 'EXTREMA');

-- CreateTable
CREATE TABLE "Client" (
    "codigoCliente" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "domicilio" TEXT,
    "departamento" TEXT,
    "edificio" TEXT,
    "contacto" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("codigoCliente")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "perfil" TEXT,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "codigoCliente" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "tipoContrato" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "ubicacion" TEXT,
    "copiasNegro" INTEGER,
    "copiasColor" INTEGER,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "numeroTicket" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCreacion" TEXT NOT NULL,
    "tipoTicket" "TipoTicket" NOT NULL,
    "categoria" TEXT,
    "subCategoria" TEXT,
    "subCategoria2" TEXT,
    "codigoCliente" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "contratoId" TEXT,
    "numeroSerie" TEXT,
    "estadoTicket" "EstadoTicket" NOT NULL DEFAULT 'ABIERTO',
    "origen" "OrigenTicket" NOT NULL,
    "urgencia" "UrgenciaTicket" NOT NULL DEFAULT 'NORMAL',
    "detalle" TEXT,
    "fechaUltimaActualizacion" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "technicianId" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("numeroTicket")
);

-- CreateIndex
CREATE INDEX "Client_razonSocial_idx" ON "Client"("razonSocial");

-- CreateIndex
CREATE INDEX "Technician_nombre_idx" ON "Technician"("nombre");

-- CreateIndex
CREATE INDEX "Contract_codigoCliente_numeroSerie_idx" ON "Contract"("codigoCliente", "numeroSerie");

-- CreateIndex
CREATE INDEX "Ticket_codigoCliente_estadoTicket_urgencia_technicianId_idx" ON "Ticket"("codigoCliente", "estadoTicket", "urgencia", "technicianId");

-- CreateIndex
CREATE INDEX "Ticket_fechaCreacion_idx" ON "Ticket"("fechaCreacion");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_codigoCliente_fkey" FOREIGN KEY ("codigoCliente") REFERENCES "Client"("codigoCliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_codigoCliente_fkey" FOREIGN KEY ("codigoCliente") REFERENCES "Client"("codigoCliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;
