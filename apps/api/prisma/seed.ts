import { PrismaClient, TipoTicket, EstadoTicket, OrigenTicket, UrgenciaTicket, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Password hashing function
async function pass(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.ticket.deleteMany();
  await prisma.contract.deleteMany();
  
  // Try to clear technician data - may not exist
  try {
    await prisma.technician.deleteMany();
  } catch (e) {
    console.log('No technician table to clear (expected)');
  }
  
  // Try to clear tecnico data - may not exist  
  try {
    await prisma.tecnico.deleteMany();
  } catch (e) {
    console.log('No tecnico table to clear (expected)');
  }
  
  await prisma.client.deleteMany();
  
  // Clear User data if table exists
  try {
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('User table does not exist yet - expected on first run');
  }

  // Usuarios base
  const [admin, supervisor, tecnicoUser, user] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@ofsat.local',
        displayName: 'Administrador',
        passwordHash: await pass('Admin.2025!'),
        roles: [Role.ADMIN],
      },
    }),
    prisma.user.upsert({
      where: { username: 'supervisor' },
      update: {},
      create: {
        username: 'supervisor',
        email: 'supervisor@ofsat.local',
        displayName: 'Supervisor',
        passwordHash: await pass('Supervisor.2025!'),
        roles: [Role.SUPERVISOR],
      },
    }),
    prisma.user.upsert({
      where: { username: 'tecnico' },
      update: {},
      create: {
        username: 'tecnico',
        email: 'tecnico@ofsat.local',
        displayName: 'Técnico',
        passwordHash: await pass('Tecnico.2025!'),
        roles: [Role.TECNICO],
      },
    }),
    prisma.user.upsert({
      where: { username: 'user' },
      update: {},
      create: {
        username: 'user',
        email: 'user@ofsat.local',
        displayName: 'Usuario',
        passwordHash: await pass('User.2025!'),
        roles: [Role.USER],
      },
    }),
  ]);

  // Seed Clients
  const clients = await prisma.client.createMany({
    data: [
      {
        codigoCliente: 'CLI001',
        razonSocial: 'Empresa Nacional de Telecomunicaciones ANTEL',
        telefono: '2902-1000',
        email: 'soporte@antel.com.uy',
        domicilio: 'Guatemala 1075',
        departamento: 'Montevideo',
        contacto: 'Juan Pérez'
      },
      {
        codigoCliente: 'CLI002',
        razonSocial: 'Banco de la República Oriental del Uruguay',
        telefono: '2902-2000',
        email: 'sistemas@brou.com.uy',
        domicilio: 'Cerrito 351',
        departamento: 'Montevideo',
        edificio: 'Torre Central',
        contacto: 'María González'
      },
      {
        codigoCliente: 'CLI003',
        razonSocial: 'Hospital de Clínicas Dr. Manuel Quintela',
        telefono: '2487-1515',
        email: 'informatica@hc.edu.uy',
        domicilio: 'Av. Italia s/n',
        departamento: 'Montevideo',
        contacto: 'Dr. Carlos Rodríguez'
      },
      {
        codigoCliente: 'CLI004',
        razonSocial: 'Intendencia de Montevideo',
        telefono: '1950-1950',
        email: 'tic@imm.gub.uy',
        domicilio: '18 de Julio 1360',
        departamento: 'Montevideo',
        edificio: 'Palacio Municipal',
        contacto: 'Ana Martínez'
      },
      {
        codigoCliente: 'CLI005',
        razonSocial: 'Universidad de la República',
        telefono: '2408-2929',
        email: 'seciu@seciu.edu.uy',
        domicilio: '18 de Julio 1968',
        departamento: 'Montevideo',
        contacto: 'Luis Fernández'
      },
      {
        codigoCliente: 'CLI006',
        razonSocial: 'Administración Nacional de Educación Pública',
        telefono: '2900-7070',
        email: 'direccion@anep.edu.uy',
        domicilio: 'Libertador 1409',
        departamento: 'Montevideo',
        contacto: 'Patricia Silva'
      }
    ]
  });

  // Create Tecnicos if the table exists
  let tecnicos: any[] = [];
  let tecnicosList: any[] = [];
  
  try {
    tecnicos = await Promise.all([
      prisma.tecnico.create({
        data: {
          usuarioId: tecnicoUser.id,
          nombre: 'Roberto Mendoza',
          email: 'roberto.mendoza@ofsat.com',
          telefono: '+376-123-456',
          activo: true,
          especialidades: ['Informatica'],
          zonas: ['Andorra la Vella'],
          tarifaHora: 45.0,
          capacidadDia: 480,
          color: '#007bff',
          notas: 'Técnico especializado en informática'
        }
      }),
      prisma.tecnico.create({
        data: {
          usuarioId: supervisor.id,
          nombre: 'Sandra López',
          email: 'sandra.lopez@ofsat.com',
          telefono: '+376-234-567',
          activo: true,
          especialidades: ['ImpHW'],
          zonas: ['Escaldes-Engordany'],
          tarifaHora: 42.0,
          capacidadDia: 450,
          color: '#28a745',
          notas: 'Especialista en hardware de impresoras'
        }
      }),
      prisma.tecnico.create({
        data: {
          usuarioId: admin.id, // Admin can also be a tecnico
          nombre: 'Miguel Torres',
          email: 'miguel.torres@ofsat.com',
          telefono: '+376-345-678',
          activo: true,
          especialidades: ['ImpSW', 'Informatica'],
          zonas: ['Andorra la Vella', 'Encamp'],
          tarifaHora: 50.0,
          capacidadDia: 420,
          color: '#dc3545',
          notas: 'Técnico senior con experiencia en software y sistemas'
        }
      })
    ]);
    tecnicosList = tecnicos;
    console.log('Created tecnicos successfully');
  } catch (e) {
    console.log('Tecnico table does not exist yet - creating legacy technician entries');
    
    // Fallback to old technician model if new one doesn't exist
    const technicians = await prisma.technician.createMany({
      data: [
        {
          nombre: 'Roberto Mendoza',
          email: 'roberto.mendoza@ofsat.com',
          telefono: '099-123-456',
          perfil: 'Informático'
        },
        {
          nombre: 'Sandra López',
          email: 'sandra.lopez@ofsat.com',
          telefono: '099-234-567',
          perfil: 'Imp HW'
        },
        {
          nombre: 'Miguel Torres',
          email: 'miguel.torres@ofsat.com',
          telefono: '099-345-678',
          perfil: 'Imp SW'
        }
      ]
    });
    
    // Get created technicians for reference
    tecnicosList = await prisma.technician.findMany();
    
    // Link first technician with the tecnico user
    if (tecnicosList[0]) {
      await prisma.technician.update({
        where: { id: tecnicosList[0].id },
        data: { userId: tecnicoUser.id },
      });
    }
  }

  // Seed Contracts
  const contracts = await prisma.contract.createMany({
    data: [
      {
        codigoCliente: 'CLI001',
        fechaInicio: new Date('2024-01-15'),
        fechaFin: new Date('2025-01-14'),
        tipoContrato: 'Mantenimiento Impresoras',
        numeroSerie: 'HP123456789',
        marca: 'HP',
        modelo: 'LaserJet Pro M404dn',
        ubicacion: 'Piso 3 - Oficina 301',
        copiasNegro: 15000,
        copiasColor: 0
      },
      {
        codigoCliente: 'CLI002',
        fechaInicio: new Date('2024-02-01'),
        fechaFin: new Date('2025-01-31'),
        tipoContrato: 'Soporte Técnico PC',
        numeroSerie: 'DELL987654321',
        marca: 'Dell',
        modelo: 'OptiPlex 7090',
        ubicacion: 'Mesa de Ayuda - Planta Baja'
      },
      {
        codigoCliente: 'CLI003',
        fechaInicio: new Date('2024-03-01'),
        tipoContrato: 'Mantenimiento Impresoras',
        numeroSerie: 'EPSON555666777',
        marca: 'Epson',
        modelo: 'WorkForce Pro WF-C8690',
        ubicacion: 'Laboratorio Central',
        copiasNegro: 25000,
        copiasColor: 10000
      },
      {
        codigoCliente: 'CLI004',
        fechaInicio: new Date('2024-01-01'),
        fechaFin: new Date('2024-12-31'),
        tipoContrato: 'Soporte Integral',
        numeroSerie: 'LENOVO111222333',
        marca: 'Lenovo',
        modelo: 'ThinkCentre M70q',
        ubicacion: 'Dirección de TIC'
      },
      {
        codigoCliente: 'CLI005',
        fechaInicio: new Date('2024-04-01'),
        tipoContrato: 'Mantenimiento Impresoras',
        numeroSerie: 'CANON444555666',
        marca: 'Canon',
        modelo: 'imageRUNNER ADVANCE DX C5735i',
        ubicacion: 'Biblioteca Central',
        copiasNegro: 30000,
        copiasColor: 15000
      },
      {
        codigoCliente: 'CLI006',
        fechaInicio: new Date('2024-05-01'),
        fechaFin: new Date('2025-04-30'),
        tipoContrato: 'Soporte Técnico PC',
        numeroSerie: 'HP777888999',
        marca: 'HP',
        modelo: 'EliteDesk 800 G8',
        ubicacion: 'Secretaría General'
      }
    ]
  });

  // Get created contracts for reference
  const contractsList = await prisma.contract.findMany();

  // Generate ticket number function
  function generateTicketNumber(index: number): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const ticketNum = String(index + 1).padStart(4, '0');
    return `T${year}${month}-${ticketNum}`;
  }

  // Seed Tickets with variety
  const ticketData = [
    {
      numeroTicket: generateTicketNumber(0),
      fechaCreacion: new Date('2024-08-01T09:30:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.IMPRESORA_HARDWARE,
      categoria: 'Atasco de papel',
      subCategoria: 'Bandeja principal',
      codigoCliente: 'CLI001',
      razonSocial: 'Empresa Nacional de Telecomunicaciones ANTEL',
      contacto: 'Juan Pérez',
      telefono: '2902-1000',
      email: 'juan.perez@antel.com.uy',
      contratoId: contractsList[0]?.id,
      numeroSerie: 'HP123456789',
      estadoTicket: EstadoTicket.ASIGNADA,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.MEDIA,
      detalle: 'Impresora HP LaserJet presenta atasco frecuente en bandeja principal. Cliente reporta que ocurre cada 10-15 impresiones.',
      fechaUltimaActualizacion: new Date('2024-08-01T14:20:00'),
      technicianId: tecnicosList[1]?.id
    },
    {
      numeroTicket: generateTicketNumber(1),
      fechaCreacion: new Date('2024-08-02T11:15:00'),
      usuarioCreacion: 'operador1',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Windows',
      subCategoria: 'Instalación software',
      codigoCliente: 'CLI002',
      razonSocial: 'Banco de la República Oriental del Uruguay',
      contacto: 'María González',
      telefono: '2902-2000',
      email: 'maria.gonzalez@brou.com.uy',
      contratoId: contractsList[1]?.id,
      numeroSerie: 'DELL987654321',
      estadoTicket: EstadoTicket.EN_PROCESO,
      origen: OrigenTicket.WEB,
      urgencia: UrgenciaTicket.ALTA,
      detalle: 'Solicitud de instalación de aplicación bancaria específica en PC Dell. Requiere permisos especiales de administrador.',
      fechaUltimaActualizacion: new Date('2024-08-02T16:30:00'),
      technicianId: tecnicosList[0]?.id
    },
    {
      numeroTicket: generateTicketNumber(2),
      fechaCreacion: new Date('2024-08-03T08:45:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.IMPRESORA_SOFTWARE,
      categoria: 'Driver',
      subCategoria: 'Actualización',
      codigoCliente: 'CLI003',
      razonSocial: 'Hospital de Clínicas Dr. Manuel Quintela',
      contacto: 'Dr. Carlos Rodríguez',
      telefono: '2487-1515',
      email: 'carlos.rodriguez@hc.edu.uy',
      contratoId: contractsList[2]?.id,
      numeroSerie: 'EPSON555666777',
      estadoTicket: EstadoTicket.PENDIENTE_PROVEEDOR,
      origen: OrigenTicket.MANUAL,
      urgencia: UrgenciaTicket.NORMAL,
      detalle: 'Actualización de driver de impresora Epson WorkForce. La versión actual presenta incompatibilidades con Windows 11.',
      fechaUltimaActualizacion: new Date('2024-08-03T13:10:00'),
      technicianId: tecnicosList[2]?.id
    },
    {
      numeroTicket: generateTicketNumber(3),
      fechaCreacion: new Date('2024-08-04T10:20:00'),
      usuarioCreacion: 'operador2',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Hardware',
      subCategoria: 'Memoria RAM',
      codigoCliente: 'CLI004',
      razonSocial: 'Intendencia de Montevideo',
      contacto: 'Ana Martínez',
      telefono: '1950-1950',
      email: 'ana.martinez@imm.gub.uy',
      contratoId: contractsList[3]?.id,
      numeroSerie: 'LENOVO111222333',
      estadoTicket: EstadoTicket.ABIERTO,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.EXTREMA,
      detalle: 'PC Lenovo presenta pantalla azul frecuente. Se sospecha falla en módulo de memoria RAM. Requiere diagnóstico urgente.',
      fechaUltimaActualizacion: new Date('2024-08-04T10:20:00')
    },
    {
      numeroTicket: generateTicketNumber(4),
      fechaCreacion: new Date('2024-08-05T14:30:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.IMPRESORA_HARDWARE,
      categoria: 'Mantenimiento',
      subCategoria: 'Limpieza preventiva',
      codigoCliente: 'CLI005',
      razonSocial: 'Universidad de la República',
      contacto: 'Luis Fernández',
      telefono: '2408-2929',
      email: 'luis.fernandez@seciu.edu.uy',
      contratoId: contractsList[4]?.id,
      numeroSerie: 'CANON444555666',
      estadoTicket: EstadoTicket.ASIGNADA,
      origen: OrigenTicket.WEB,
      urgencia: UrgenciaTicket.NORMAL,
      detalle: 'Mantenimiento preventivo programado para impresora Canon. Incluye limpieza de rodillos y calibración de colores.',
      fechaUltimaActualizacion: new Date('2024-08-05T15:45:00'),
      technicianId: tecnicosList[2]?.id
    },
    {
      numeroTicket: generateTicketNumber(5),
      fechaCreacion: new Date('2024-08-06T09:00:00'),
      usuarioCreacion: 'operador1',
      tipoTicket: TipoTicket.INTERNO,
      categoria: 'Capacitación',
      subCategoria: 'Personal técnico',
      codigoCliente: 'CLI006',
      razonSocial: 'Administración Nacional de Educación Pública',
      contacto: 'Patricia Silva',
      telefono: '2900-7070',
      email: 'patricia.silva@anep.edu.uy',
      estadoTicket: EstadoTicket.PENDIENTE,
      origen: OrigenTicket.MANUAL,
      urgencia: UrgenciaTicket.MEDIA,
      detalle: 'Capacitación para personal de ANEP sobre uso básico de equipos informáticos y procedimientos de soporte.',
      fechaUltimaActualizacion: new Date('2024-08-06T09:00:00')
    },
    {
      numeroTicket: generateTicketNumber(6),
      fechaCreacion: new Date('2024-08-07T11:30:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.IMPRESORA_SOFTWARE,
      categoria: 'Configuración',
      subCategoria: 'Red',
      codigoCliente: 'CLI001',
      razonSocial: 'Empresa Nacional de Telecomunicaciones ANTEL',
      contacto: 'Juan Pérez',
      telefono: '2902-1000',
      email: 'juan.perez@antel.com.uy',
      contratoId: contractsList[0]?.id,
      numeroSerie: 'HP123456789',
      estadoTicket: EstadoTicket.EN_TRANSITO,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.ALTA,
      detalle: 'Reconfiguración de parámetros de red de impresora HP. Cambio de dirección IP y configuración de SNMP.',
      fechaUltimaActualizacion: new Date('2024-08-07T16:00:00'),
      technicianId: tecnicosList[2]?.id
    },
    {
      numeroTicket: generateTicketNumber(7),
      fechaCreacion: new Date('2024-08-08T13:15:00'),
      usuarioCreacion: 'operador2',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Software',
      subCategoria: 'Antivirus',
      codigoCliente: 'CLI002',
      razonSocial: 'Banco de la República Oriental del Uruguay',
      contacto: 'María González',
      telefono: '2902-2000',
      email: 'maria.gonzalez@brou.com.uy',
      estadoTicket: EstadoTicket.PENDIENTE_CLIENTE,
      origen: OrigenTicket.WEB,
      urgencia: UrgenciaTicket.MEDIA,
      detalle: 'Actualización y configuración de software antivirus en estaciones de trabajo del banco. Pendiente confirmación de horario.',
      fechaUltimaActualizacion: new Date('2024-08-08T14:30:00')
    },
    {
      numeroTicket: generateTicketNumber(8),
      fechaCreacion: new Date('2024-08-09T10:45:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.IMPRESORA_HARDWARE,
      categoria: 'Repuesto',
      subCategoria: 'Fusor',
      codigoCliente: 'CLI003',
      razonSocial: 'Hospital de Clínicas Dr. Manuel Quintela',
      contacto: 'Dr. Carlos Rodríguez',
      telefono: '2487-1515',
      email: 'carlos.rodriguez@hc.edu.uy',
      contratoId: contractsList[2]?.id,
      numeroSerie: 'EPSON555666777',
      estadoTicket: EstadoTicket.PENDIENTE_RMA,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.ALTA,
      detalle: 'Reemplazo de unidad fusora en impresora Epson. Equipo presenta rayas en impresiones. Repuesto en proceso RMA.',
      fechaUltimaActualizacion: new Date('2024-08-09T15:20:00'),
      technicianId: tecnicosList[2]?.id
    },
    {
      numeroTicket: generateTicketNumber(9),
      fechaCreacion: new Date('2024-08-10T08:30:00'),
      usuarioCreacion: 'operador1',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Conectividad',
      subCategoria: 'WiFi',
      codigoCliente: 'CLI004',
      razonSocial: 'Intendencia de Montevideo',
      contacto: 'Ana Martínez',
      telefono: '1950-1950',
      email: 'ana.martinez@imm.gub.uy',
      estadoTicket: EstadoTicket.ASIGNADA,
      origen: OrigenTicket.MANUAL,
      urgencia: UrgenciaTicket.NORMAL,
      detalle: 'Configuración de acceso WiFi corporativo en equipos portátiles del personal de campo de la Intendencia.',
      fechaUltimaActualizacion: new Date('2024-08-10T12:00:00'),
      technicianId: tecnicosList[0]?.id
    },
    {
      numeroTicket: generateTicketNumber(10),
      fechaCreacion: new Date('2024-08-11T15:45:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.INTERNO,
      categoria: 'Documentación',
      subCategoria: 'Procedimientos',
      codigoCliente: 'CLI005',
      razonSocial: 'Universidad de la República',
      contacto: 'Luis Fernández',
      telefono: '2408-2929',
      email: 'luis.fernandez@seciu.edu.uy',
      estadoTicket: EstadoTicket.EN_PROCESO,
      origen: OrigenTicket.WEB,
      urgencia: UrgenciaTicket.NORMAL,
      detalle: 'Actualización de documentación de procedimientos técnicos para el área de soporte de la Universidad.',
      fechaUltimaActualizacion: new Date('2024-08-11T16:30:00'),
      technicianId: tecnicosList[0]?.id
    },
    {
      numeroTicket: generateTicketNumber(11),
      fechaCreacion: new Date('2024-08-12T09:15:00'),
      usuarioCreacion: 'operador2',
      tipoTicket: TipoTicket.IMPRESORA_HARDWARE,
      categoria: 'Instalación',
      subCategoria: 'Nueva impresora',
      codigoCliente: 'CLI006',
      razonSocial: 'Administración Nacional de Educación Pública',
      contacto: 'Patricia Silva',
      telefono: '2900-7070',
      email: 'patricia.silva@anep.edu.uy',
      contratoId: contractsList[5]?.id,
      numeroSerie: 'HP777888999',
      estadoTicket: EstadoTicket.ABIERTO,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.MEDIA,
      detalle: 'Instalación de nueva impresora HP en secretaría. Incluye configuración de red y pruebas de funcionamiento.',
      fechaUltimaActualizacion: new Date('2024-08-12T09:15:00')
    },
    {
      numeroTicket: generateTicketNumber(12),
      fechaCreacion: new Date('2024-08-13T12:00:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Backup',
      subCategoria: 'Restauración',
      codigoCliente: 'CLI001',
      razonSocial: 'Empresa Nacional de Telecomunicaciones ANTEL',
      contacto: 'Juan Pérez',
      telefono: '2902-1000',
      email: 'juan.perez@antel.com.uy',
      estadoTicket: EstadoTicket.PENDIENTE,
      origen: OrigenTicket.WEB,
      urgencia: UrgenciaTicket.EXTREMA,
      detalle: 'Restauración urgente de archivos desde backup. Usuario perdió documentos importantes por falla de disco duro.',
      fechaUltimaActualizacion: new Date('2024-08-13T12:00:00')
    },
    {
      numeroTicket: generateTicketNumber(13),
      fechaCreacion: new Date('2024-08-14T14:20:00'),
      usuarioCreacion: 'operador1',
      tipoTicket: TipoTicket.IMPRESORA_SOFTWARE,
      categoria: 'Aplicación',
      subCategoria: 'Scanner',
      codigoCliente: 'CLI002',
      razonSocial: 'Banco de la República Oriental del Uruguay',
      contacto: 'María González',
      telefono: '2902-2000',
      email: 'maria.gonzalez@brou.com.uy',
      estadoTicket: EstadoTicket.ASIGNADA,
      origen: OrigenTicket.MANUAL,
      urgencia: UrgenciaTicket.MEDIA,
      detalle: 'Configuración de aplicación de digitalización de documentos. Integración con sistema bancario interno.',
      fechaUltimaActualizacion: new Date('2024-08-14T17:00:00'),
      technicianId: tecnicosList[2]?.id
    },
    {
      numeroTicket: generateTicketNumber(14),
      fechaCreacion: new Date('2024-08-15T10:30:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Email',
      subCategoria: 'Configuración',
      codigoCliente: 'CLI003',
      razonSocial: 'Hospital de Clínicas Dr. Manuel Quintela',
      contacto: 'Dr. Carlos Rodríguez',
      telefono: '2487-1515',
      email: 'carlos.rodriguez@hc.edu.uy',
      estadoTicket: EstadoTicket.EN_PROCESO,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.NORMAL,
      detalle: 'Migración y configuración de cuentas de correo del personal médico a nuevo servidor Exchange.',
      fechaUltimaActualizacion: new Date('2024-08-15T14:45:00'),
      technicianId: tecnicosList[0]?.id
    },
    {
      numeroTicket: generateTicketNumber(15),
      fechaCreacion: new Date('2024-08-16T11:45:00'),
      usuarioCreacion: 'operador2',
      tipoTicket: TipoTicket.INTERNO,
      categoria: 'Inventario',
      subCategoria: 'Actualización',
      codigoCliente: 'CLI004',
      razonSocial: 'Intendencia de Montevideo',
      contacto: 'Ana Martínez',
      telefono: '1950-1950',
      email: 'ana.martinez@imm.gub.uy',
      estadoTicket: EstadoTicket.PENDIENTE_CLIENTE,
      origen: OrigenTicket.WEB,
      urgencia: UrgenciaTicket.NORMAL,
      detalle: 'Actualización de inventario de equipos informáticos. Relevamiento de hardware y software instalado.',
      fechaUltimaActualizacion: new Date('2024-08-16T13:20:00')
    },
    {
      numeroTicket: generateTicketNumber(16),
      fechaCreacion: new Date('2024-08-17T13:30:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.IMPRESORA_HARDWARE,
      categoria: 'Calibración',
      subCategoria: 'Colores',
      codigoCliente: 'CLI005',
      razonSocial: 'Universidad de la República',
      contacto: 'Luis Fernández',
      telefono: '2408-2929',
      email: 'luis.fernandez@seciu.edu.uy',
      contratoId: contractsList[4]?.id,
      numeroSerie: 'CANON444555666',
      estadoTicket: EstadoTicket.EN_TRANSITO,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.MEDIA,
      detalle: 'Calibración de colores en impresora Canon. Los colores impresos no coinciden con los mostrados en pantalla.',
      fechaUltimaActualizacion: new Date('2024-08-17T16:15:00'),
      technicianId: tecnicosList[1]?.id
    },
    {
      numeroTicket: generateTicketNumber(17),
      fechaCreacion: new Date('2024-08-18T08:00:00'),
      usuarioCreacion: 'operador1',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Sistema Operativo',
      subCategoria: 'Actualización',
      codigoCliente: 'CLI006',
      razonSocial: 'Administración Nacional de Educación Pública',
      contacto: 'Patricia Silva',
      telefono: '2900-7070',
      email: 'patricia.silva@anep.edu.uy',
      contratoId: contractsList[5]?.id,
      numeroSerie: 'HP777888999',
      estadoTicket: EstadoTicket.ABIERTO,
      origen: OrigenTicket.MANUAL,
      urgencia: UrgenciaTicket.ALTA,
      detalle: 'Actualización masiva de sistemas operativos Windows en laboratorios educativos. Coordinar horarios fuera del horario lectivo.',
      fechaUltimaActualizacion: new Date('2024-08-18T08:00:00')
    },
    {
      numeroTicket: generateTicketNumber(18),
      fechaCreacion: new Date('2024-08-19T15:10:00'),
      usuarioCreacion: 'admin',
      tipoTicket: TipoTicket.IMPRESORA_SOFTWARE,
      categoria: 'Driver',
      subCategoria: 'Instalación',
      codigoCliente: 'CLI001',
      razonSocial: 'Empresa Nacional de Telecomunicaciones ANTEL',
      contacto: 'Juan Pérez',
      telefono: '2902-1000',
      email: 'juan.perez@antel.com.uy',
      contratoId: contractsList[0]?.id,
      numeroSerie: 'HP123456789',
      estadoTicket: EstadoTicket.ASIGNADA,
      origen: OrigenTicket.WEB,
      urgencia: UrgenciaTicket.NORMAL,
      detalle: 'Instalación de driver actualizado de impresora HP en nuevas estaciones de trabajo incorporadas al área.',
      fechaUltimaActualizacion: new Date('2024-08-19T17:30:00'),
      technicianId: tecnicosList[0]?.id
    },
    {
      numeroTicket: generateTicketNumber(19),
      fechaCreacion: new Date('2024-08-20T12:45:00'),
      usuarioCreacion: 'operador2',
      tipoTicket: TipoTicket.INFORMATICA,
      categoria: 'Seguridad',
      subCategoria: 'Firewall',
      codigoCliente: 'CLI002',
      razonSocial: 'Banco de la República Oriental del Uruguay',
      contacto: 'María González',
      telefono: '2902-2000',
      email: 'maria.gonzalez@brou.com.uy',
      estadoTicket: EstadoTicket.EN_PROCESO,
      origen: OrigenTicket.TELEFONO,
      urgencia: UrgenciaTicket.EXTREMA,
      detalle: 'Configuración urgente de reglas de firewall tras detección de intento de acceso no autorizado. Revisión de logs de seguridad.',
      fechaUltimaActualizacion: new Date('2024-08-20T18:00:00'),
      technicianId: tecnicosList[0]?.id,
      fechaCierre: new Date('2024-08-20T18:30:00')
    }
  ];

  // Create tickets
  for (const ticket of ticketData) {
    await prisma.ticket.create({
      data: ticket
    });
  }

  console.log('Database seeded successfully!');
  console.log(`Created:`);
  console.log(`- 4 users (admin, supervisor, tecnico, user)`);
  console.log(`- ${clients.count} clients`);
  console.log(`- ${tecnicos.length} tecnicos`);
  console.log(`- ${contracts.count} contracts`);
  console.log(`- ${ticketData.length} tickets`);
  console.log(`\nDefault user credentials:`);
  console.log(`- admin / Admin.2025!`);
  console.log(`- supervisor / Supervisor.2025!`);
  console.log(`- tecnico / Tecnico.2025!`);
  console.log(`- user / User.2025!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
