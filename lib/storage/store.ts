import bcrypt from 'bcryptjs';
import {
  Client,
  Product,
  Tender,
  TenderItem,
  Payment,
  TenderTransition,
  TenderStatus,
  User,
  Role,
  AuditLog,
  RoleType,
} from '@/lib/types/database';

// ROLES INICIALES
const initialRoles: Role[] = [
  {
    id: 'r0000001-0000-0000-0000-000000000001',
    name: 'admin',
    description: 'Acceso total y administración del sistema',
  },
  {
    id: 'r0000001-0000-0000-0000-000000000002',
    name: 'gestor',
    description: 'Gestión operativa de licitaciones y transiciones',
  },
  {
    id: 'r0000001-0000-0000-0000-000000000003',
    name: 'visualizador',
    description: 'Solo lectura de catálogos y licitaciones',
  },
];

// Hash bcrypt precalculado para "Admin123!", "Gestor123!", "Visual123!" con 12 rondas
const ADMIN_HASH = bcrypt.hashSync('Admin123!', 12);
const GESTOR_HASH = bcrypt.hashSync('Gestor123!', 12);
const VISUAL_HASH = bcrypt.hashSync('Visual123!', 12);

// USUARIOS INICIALES
const initialUsers: User[] = [
  {
    id: 'u0000001-0000-0000-0000-000000000001',
    email: 'admin@csc.com',
    password_hash: ADMIN_HASH,
    role_id: 'r0000001-0000-0000-0000-000000000001',
    role: 'admin',
    full_name: 'Admin Comercial',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    last_login: new Date().toISOString(),
  },
  {
    id: 'u0000001-0000-0000-0000-000000000002',
    email: 'admin@test.com',
    password_hash: ADMIN_HASH,
    role_id: 'r0000001-0000-0000-0000-000000000001',
    role: 'admin',
    full_name: 'Administrador de Pruebas',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    last_login: null,
  },
  {
    id: 'u0000001-0000-0000-0000-000000000003',
    email: 'gestor@csc.com',
    password_hash: GESTOR_HASH,
    role_id: 'r0000001-0000-0000-0000-000000000002',
    role: 'gestor',
    full_name: 'Carlos Mendoza Gestor',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    last_login: null,
  },
  {
    id: 'u0000001-0000-0000-0000-000000000004',
    email: 'visualizador@csc.com',
    password_hash: VISUAL_HASH,
    role_id: 'r0000001-0000-0000-0000-000000000003',
    role: 'visualizador',
    full_name: 'Ana Rivas Visualizadora',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    last_login: null,
  },
];

// CLIENTES INICIALES
const initialClients: Client[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Corporación Minera Andina S.A.',
    tax_id: 'RUC-20489123451',
    email: 'licitaciones@mineraandina.com',
    phone: '+51 987 654 321',
    address: 'Av. Las Begonias 450, San Isidro, Lima',
    contact_name: 'Ing. Roberto Mendoza',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    name: 'Hospital Metropolitano del Norte',
    tax_id: 'NIT-901234567-8',
    email: 'compras@hospitalmetronorte.org',
    phone: '+57 310 987 6543',
    address: 'Cra. 45 # 120-30, Bogotá',
    contact_name: 'Dra. Patricia Silva',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    name: 'Gobierno Regional de Infraestructura',
    tax_id: 'RUT-76543210-K',
    email: 'abastecimiento@gobregion.gob',
    phone: '+56 2 2345 6789',
    address: 'Calle Moneda 820, Santiago',
    contact_name: 'Lic. Alejandro Torres',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'a0000001-0000-0000-0000-000000000004',
    name: 'Constructora e Inmobiliaria Horizon',
    tax_id: 'RUC-20601239874',
    email: 'proyectos@constructora-horizon.com',
    phone: '+51 999 111 222',
    address: 'Av. El Sol 880, Arequipa',
    contact_name: 'Arq. Marcela Castro',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
];

// PRODUCTOS INICIALES
const initialProducts: Product[] = [
  {
    id: 'b0000001-0000-0000-0000-000000000001',
    code: 'SRV-ENT-001',
    name: 'Servidor Rack Enterprise Dell PowerEdge R750',
    description: '2x Xeon Gold, 128GB RAM DDR4, 4x 1.92TB SSD NVMe, Dual PSU Redundante',
    unit_price: 4850.0,
    unit_measure: 'UNIDAD',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b0000001-0000-0000-0000-000000000002',
    code: 'LIC-SO-WIN',
    name: 'Licencia Microsoft Windows Server 2022 Datacenter',
    description: 'Licencia OEM 16 núcleos con soporte de virtualización ilimitada Hyper-V',
    unit_price: 1250.0,
    unit_measure: 'LICENCIA',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b0000001-0000-0000-0000-000000000003',
    code: 'NET-SW-C9300',
    name: 'Switch Cisco Catalyst 9300 48 Puertos PoE+ Gigabit',
    description: 'Switch administrable Layer 3 con módulo uplink 10GbE y garantía extendida',
    unit_price: 3400.0,
    unit_measure: 'UNIDAD',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b0000001-0000-0000-0000-000000000004',
    code: 'UPS-APC-3KVA',
    name: 'Sistema UPS Online APC Smart-UPS RT 3000VA 230V',
    description: 'Doble conversión en línea, pantalla LCD, gestión remota SNMP y bypass',
    unit_price: 1890.0,
    unit_measure: 'UNIDAD',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b0000001-0000-0000-0000-000000000005',
    code: 'SRV-INST-PRO',
    name: 'Servicio Profesional de Implementación y Certificación',
    description: 'Montaje en rack, configuración de clúster, cableado estructurado Cat6A',
    unit_price: 2500.0,
    unit_measure: 'SERVICIO',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b0000001-0000-0000-0000-000000000006',
    code: 'LAP-BUS-THINK',
    name: 'Laptop Empresarial Lenovo ThinkPad T14 Gen 4',
    description: 'Core i7 13th Gen, 32GB RAM, 1TB SSD, 14 pulgadas FHD, Win 11 Pro',
    unit_price: 1450.0,
    unit_measure: 'UNIDAD',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// LICITACIONES INICIALES
let memoryTenders: Tender[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    code: 'LIC-2026-001',
    title: 'Renovación de Servidores Data Center Central',
    description: 'Suministro e instalación de 4 servidores de alta densidad para base de datos transaccional.',
    client_id: 'a0000001-0000-0000-0000-000000000001',
    status: 'borrador',
    presupuesto_maximo: 30000.0,
    total_estimado: 21900.0,
    fecha_limite: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
    proposal_file_url: 'https://raw.githubusercontent.com/sample/propuesta-servidores.pdf',
    proposal_file_name: 'Propuesta_Tecnica_MineraAndina_v1.pdf',
    proposal_file_size: 2450120,
    reminder_sent: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    code: 'LIC-2026-002',
    title: 'Equipamiento de Redes y Switches Hospitalarios',
    description: 'Infraestructura de red de alta disponibilidad para salas de urgencias y telemedicina.',
    client_id: 'a0000001-0000-0000-0000-000000000002',
    status: 'activa',
    presupuesto_maximo: 25000.0,
    total_estimado: 16100.0,
    fecha_limite: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
    proposal_file_url: 'https://raw.githubusercontent.com/sample/propuesta-hospital.pdf',
    proposal_file_name: 'Propuesta_Hospital_Redes_2026.pdf',
    proposal_file_size: 1890450,
    reminder_sent: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    code: 'LIC-2026-003',
    title: 'Modernización de Laptops para Área de Ingeniería',
    description: 'Dotación de 10 equipos de cómputo de alto rendimiento para proyectos de infraestructura.',
    client_id: 'a0000001-0000-0000-0000-000000000003',
    status: 'finalizada',
    presupuesto_maximo: 18000.0,
    total_estimado: 14500.0,
    fecha_limite: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    proposal_file_url: 'https://raw.githubusercontent.com/sample/propuesta-laptops.pdf',
    proposal_file_name: 'Propuesta_Gobierno_Laptops.pdf',
    proposal_file_size: 1420800,
    reminder_sent: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    code: 'LIC-2026-004',
    title: 'Sistemas de Respaldo Energético UPS para Obras',
    description: 'Instalación de bancos de baterías y UPS de 3kVA en campamento minero.',
    client_id: 'a0000001-0000-0000-0000-000000000004',
    status: 'por_cobrar',
    presupuesto_maximo: 12000.0,
    total_estimado: 8170.0,
    fecha_limite: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    proposal_file_url: 'https://raw.githubusercontent.com/sample/propuesta-ups.pdf',
    proposal_file_name: 'Propuesta_Horizon_Energia.pdf',
    proposal_file_size: 980300,
    reminder_sent: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    code: 'LIC-2026-005',
    title: 'Cableado y Certificación de Fibra Óptica',
    description: 'Servicio de integración de redes y canalización subterránea.',
    client_id: 'a0000001-0000-0000-0000-000000000001',
    status: 'cobrada',
    presupuesto_maximo: 8000.0,
    total_estimado: 5000.0,
    fecha_limite: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    proposal_file_url: 'https://raw.githubusercontent.com/sample/propuesta-fibra.pdf',
    proposal_file_name: 'Propuesta_Minera_Fibra.pdf',
    proposal_file_size: 850200,
    reminder_sent: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'c0000001-0000-0000-0000-000000000006',
    code: 'LIC-2026-006',
    title: 'Licenciamiento Corporativo de Servidores',
    description: 'Adquisición de licencias para data center alterno.',
    client_id: 'a0000001-0000-0000-0000-000000000002',
    status: 'perdida',
    presupuesto_maximo: 10000.0,
    total_estimado: 6250.0,
    fecha_limite: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    proposal_file_url: 'https://raw.githubusercontent.com/sample/propuesta-licencias.pdf',
    proposal_file_name: 'Propuesta_Licencias_Metronorte.pdf',
    proposal_file_size: 620100,
    reminder_sent: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

let memoryClients: Client[] = [...initialClients];
let memoryProducts: Product[] = [...initialProducts];
let memoryUsers: User[] = [...initialUsers];
let memoryRoles: Role[] = [...initialRoles];
let memoryAuditLogs: AuditLog[] = [];

let memoryItems: TenderItem[] = [
  {
    id: 'i-001',
    tender_id: 'c0000001-0000-0000-0000-000000000001',
    product_id: 'b0000001-0000-0000-0000-000000000001',
    quantity: 4,
    unit_price: 4850.0,
    subtotal: 19400.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-002',
    tender_id: 'c0000001-0000-0000-0000-000000000001',
    product_id: 'b0000001-0000-0000-0000-000000000005',
    quantity: 1,
    unit_price: 2500.0,
    subtotal: 2500.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-003',
    tender_id: 'c0000001-0000-0000-0000-000000000002',
    product_id: 'b0000001-0000-0000-0000-000000000003',
    quantity: 4,
    unit_price: 3400.0,
    subtotal: 13600.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-004',
    tender_id: 'c0000001-0000-0000-0000-000000000002',
    product_id: 'b0000001-0000-0000-0000-000000000005',
    quantity: 1,
    unit_price: 2500.0,
    subtotal: 2500.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-005',
    tender_id: 'c0000001-0000-0000-0000-000000000003',
    product_id: 'b0000001-0000-0000-0000-000000000006',
    quantity: 10,
    unit_price: 1450.0,
    subtotal: 14500.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-006',
    tender_id: 'c0000001-0000-0000-0000-000000000004',
    product_id: 'b0000001-0000-0000-0000-000000000004',
    quantity: 3,
    unit_price: 1890.0,
    subtotal: 5670.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-007',
    tender_id: 'c0000001-0000-0000-0000-000000000004',
    product_id: 'b0000001-0000-0000-0000-000000000005',
    quantity: 1,
    unit_price: 2500.0,
    subtotal: 2500.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-008',
    tender_id: 'c0000001-0000-0000-0000-000000000005',
    product_id: 'b0000001-0000-0000-0000-000000000005',
    quantity: 2,
    unit_price: 2500.0,
    subtotal: 5000.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i-009',
    tender_id: 'c0000001-0000-0000-0000-000000000006',
    product_id: 'b0000001-0000-0000-0000-000000000002',
    quantity: 5,
    unit_price: 1250.0,
    subtotal: 6250.0,
    created_at: new Date().toISOString(),
  },
];

let memoryPayments: Payment[] = [
  {
    id: 'd0000001-0000-0000-0000-000000000001',
    tender_id: 'c0000001-0000-0000-0000-000000000004',
    amount: 3000.0,
    payment_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0],
    reference: 'Anticipo 35% - Transf. BCP #9872134',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000002',
    tender_id: 'c0000001-0000-0000-0000-000000000004',
    amount: 2000.0,
    payment_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
    reference: 'Segundo Abono Entrega Parcial - Cheque #44219',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000003',
    tender_id: 'c0000001-0000-0000-0000-000000000005',
    amount: 2500.0,
    payment_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString().split('T')[0],
    reference: 'Pago 50% Inicio - Factura F001-492',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000004',
    tender_id: 'c0000001-0000-0000-0000-000000000005',
    amount: 2500.0,
    payment_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString().split('T')[0],
    reference: 'Pago Final Liquidación - Transf. BBVA #102934',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
];

let memoryTransitions: TenderTransition[] = [
  {
    id: 't-001',
    tender_id: 'c0000001-0000-0000-0000-000000000001',
    previous_status: 'none',
    new_status: 'borrador',
    user_name: 'Admin Comercial',
    notes: 'Creación inicial de la licitación y definición de presupuesto.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 't-002',
    tender_id: 'c0000001-0000-0000-0000-000000000002',
    previous_status: 'none',
    new_status: 'borrador',
    user_name: 'Admin Comercial',
    notes: 'Registro de licitación para equipamiento hospitalario.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 't-003',
    tender_id: 'c0000001-0000-0000-0000-000000000002',
    previous_status: 'borrador',
    new_status: 'activa',
    user_name: 'Admin Comercial',
    notes: 'Subida de propuesta técnica y envío formal por correo con adjunto.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 't-004',
    tender_id: 'c0000001-0000-0000-0000-000000000003',
    previous_status: 'borrador',
    new_status: 'activa',
    user_name: 'Admin Comercial',
    notes: 'Envío formal de propuesta aprobada.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 't-005',
    tender_id: 'c0000001-0000-0000-0000-000000000003',
    previous_status: 'activa',
    new_status: 'finalizada',
    user_name: 'Admin Comercial',
    notes: 'Licitación adjudicada a nuestra empresa. Entrega de laptops completada.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 't-006',
    tender_id: 'c0000001-0000-0000-0000-000000000004',
    previous_status: 'borrador',
    new_status: 'activa',
    user_name: 'Admin Comercial',
    notes: 'Envío de propuesta económica al cliente.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 't-007',
    tender_id: 'c0000001-0000-0000-0000-000000000004',
    previous_status: 'activa',
    new_status: 'finalizada',
    user_name: 'Admin Comercial',
    notes: 'Adjudicación exitosa y firma de contrato.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
  },
  {
    id: 't-008',
    tender_id: 'c0000001-0000-0000-0000-000000000004',
    previous_status: 'finalizada',
    new_status: 'por_cobrar',
    user_name: 'Finanzas / Cobranzas',
    notes: 'Emisión de Factura F001-0982 por un total de $8,170.00. En gestión de cobro.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: 't-009',
    tender_id: 'c0000001-0000-0000-0000-000000000005',
    previous_status: 'por_cobrar',
    new_status: 'cobrada',
    user_name: 'Sistema de Cobranza',
    notes: 'Saldo pendiente llegó a $0.00 tras el registro del pago final. Transición automática.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 't-010',
    tender_id: 'c0000001-0000-0000-0000-000000000006',
    previous_status: 'activa',
    new_status: 'perdida',
    user_name: 'Vercel Cron Job (Auto)',
    notes: 'La fecha límite venció sin confirmación de adjudicación. Transición automática por tarea programada.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export const VALID_TRANSITIONS: Record<string, TenderStatus[]> = {
  borrador: ['activa'],
  activa: ['finalizada', 'perdida'],
  finalizada: ['por_cobrar'],
  por_cobrar: ['cobrada'],
  cobrada: [],
  perdida: [],
};

export const dataStore = {
  // ==========================================
  // ROLES
  // ==========================================
  async getRoles(): Promise<Role[]> {
    return memoryRoles;
  },

  // ==========================================
  // USUARIOS (RBAC)
  // ==========================================
  async getUsers(): Promise<User[]> {
    return memoryUsers.map((u) => {
      const role = memoryRoles.find((r) => r.id === u.role_id)?.name || u.role;
      return { ...u, role };
    });
  },

  async getUserById(id: string): Promise<User | null> {
    const user = memoryUsers.find((u) => u.id === id);
    if (!user) return null;
    const role = memoryRoles.find((r) => r.id === user.role_id)?.name || user.role;
    return { ...user, role };
  },

  async getUserByEmail(email: string): Promise<User | null> {
    // Consulta parametrizada exacta insensible a mayúsculas
    const normalized = email.trim().toLowerCase();
    const user = memoryUsers.find((u) => u.email.toLowerCase() === normalized);
    if (!user) return null;
    const role = memoryRoles.find((r) => r.id === user.role_id)?.name || user.role;
    return { ...user, role };
  },

  async createUser(userData: {
    email: string;
    password_hash: string;
    role: RoleType;
    full_name: string;
  }): Promise<User> {
    const normalized = userData.email.trim().toLowerCase();
    const existing = memoryUsers.find((u) => u.email.toLowerCase() === normalized);
    if (existing) {
      throw new Error('El correo electrónico ya se encuentra registrado');
    }

    const roleObj = memoryRoles.find((r) => r.name === userData.role) || memoryRoles[0];

    const newUser: User = {
      id: crypto.randomUUID(),
      email: normalized,
      password_hash: userData.password_hash,
      role_id: roleObj.id,
      role: userData.role,
      full_name: userData.full_name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null,
    };

    memoryUsers.unshift(newUser);
    return newUser;
  },

  async updateUser(
    id: string,
    userData: {
      role?: RoleType;
      full_name?: string;
      password_hash?: string;
      is_active?: boolean;
    }
  ): Promise<User> {
    const index = memoryUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');

    const currentUser = memoryUsers[index];
    let roleId = currentUser.role_id;
    let role = currentUser.role;

    if (userData.role) {
      const roleObj = memoryRoles.find((r) => r.name === userData.role);
      if (roleObj) {
        roleId = roleObj.id;
        role = userData.role;
      }
    }

    memoryUsers[index] = {
      ...currentUser,
      ...(userData.full_name ? { full_name: userData.full_name } : {}),
      ...(userData.password_hash ? { password_hash: userData.password_hash } : {}),
      ...(userData.is_active !== undefined ? { is_active: userData.is_active } : {}),
      role_id: roleId,
      role,
      updated_at: new Date().toISOString(),
    };

    return memoryUsers[index];
  },

  async deleteUser(id: string): Promise<boolean> {
    const index = memoryUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    memoryUsers.splice(index, 1);
    return true;
  },

  async updateLastLogin(id: string): Promise<void> {
    const index = memoryUsers.findIndex((u) => u.id === id);
    if (index !== -1) {
      memoryUsers[index].last_login = new Date().toISOString();
    }
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async createAuditLog(log: AuditLog): Promise<AuditLog> {
    memoryAuditLogs.unshift(log);
    return log;
  },

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let logs = [...memoryAuditLogs];

    if (filters?.userId) {
      logs = logs.filter((l) => l.user_id === filters.userId || l.user_email === filters.userId);
    }
    if (filters?.action) {
      logs = logs.filter((l) => l.action.toLowerCase().includes(filters.action!.toLowerCase()));
    }
    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= start);
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime();
      logs = logs.filter((l) => new Date(l.timestamp).getTime() <= end);
    }

    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  },

  // ==========================================
  // CLIENTES (Con Búsqueda Parametrizada e Índices)
  // ==========================================
  async getClients(): Promise<Client[]> {
    return memoryClients;
  },

  async searchClients(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Client[]; total: number; page: number; totalPages: number }> {
    const startTime = performance.now();
    const cleanQuery = (query || '').trim().toLowerCase();
    const safeLimit = Math.min(50, Math.max(1, limit));
    const safePage = Math.max(1, page);

    let filtered: Client[];
    if (!cleanQuery) {
      filtered = memoryClients;
    } else {
      // Búsqueda parametrizada segura simulando índice por name y email
      filtered = memoryClients.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.email.toLowerCase().includes(cleanQuery) ||
          c.tax_id.toLowerCase().includes(cleanQuery)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const offset = (safePage - 1) * safeLimit;
    const data = filtered.slice(offset, offset + safeLimit);

    const elapsedMs = performance.now() - startTime;
    console.log(
      `[PERF] Client search query="${cleanQuery}" page=${safePage} limit=${safeLimit} total=${total} (${elapsedMs.toFixed(2)}ms)`
    );

    return { data, total, page: safePage, totalPages };
  },

  async getClientById(id: string): Promise<Client | null> {
    return memoryClients.find((c) => c.id === id) || null;
  },

  async createClient(clientData: Partial<Client>): Promise<Client> {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: clientData.name || '',
      tax_id: clientData.tax_id || '',
      email: clientData.email || '',
      phone: clientData.phone || '',
      address: clientData.address || '',
      contact_name: clientData.contact_name || '',
      created_by: clientData.created_by || null,
      updated_by: clientData.updated_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryClients.unshift(newClient);
    return newClient;
  },

  async updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
    const index = memoryClients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Cliente no encontrado');
    memoryClients[index] = {
      ...memoryClients[index],
      ...clientData,
      updated_at: new Date().toISOString(),
    };
    return memoryClients[index];
  },

  async deleteClient(id: string): Promise<boolean> {
    const hasTenders = memoryTenders.some((t) => t.client_id === id);
    if (hasTenders) {
      throw new Error('No se puede eliminar un cliente con licitaciones asociadas');
    }
    memoryClients = memoryClients.filter((c) => c.id !== id);
    return true;
  },

  // ==========================================
  // PRODUCTOS
  // ==========================================
  async getProducts(): Promise<Product[]> {
    return memoryProducts;
  },

  async getProductById(id: string): Promise<Product | null> {
    return memoryProducts.find((p) => p.id === id) || null;
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      code: productData.code || `PRD-${Date.now().toString().slice(-4)}`,
      name: productData.name || '',
      description: productData.description || '',
      unit_price: Number(productData.unit_price) || 0,
      unit_measure: productData.unit_measure || 'UNIDAD',
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      created_by: productData.created_by || null,
      updated_by: productData.updated_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryProducts.unshift(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const index = memoryProducts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');
    memoryProducts[index] = {
      ...memoryProducts[index],
      ...productData,
      unit_price:
        productData.unit_price !== undefined
          ? Number(productData.unit_price)
          : memoryProducts[index].unit_price,
      updated_at: new Date().toISOString(),
    };
    return memoryProducts[index];
  },

  async deleteProduct(id: string): Promise<boolean> {
    const isUsed = memoryItems.some((i) => i.product_id === id);
    if (isUsed) {
      throw new Error('No se puede eliminar un producto utilizado en licitaciones existentes');
    }
    memoryProducts = memoryProducts.filter((p) => p.id !== id);
    return true;
  },

  // ==========================================
  // LICITACIONES
  // ==========================================
  async getTenders(): Promise<Tender[]> {
    return memoryTenders.map((tender) => this.populateTender(tender));
  },

  async getTenderById(id: string): Promise<Tender | null> {
    const tender = memoryTenders.find((t) => t.id === id);
    if (!tender) return null;
    return this.populateTender(tender);
  },

  populateTender(tender: Tender): Tender {
    const client = memoryClients.find((c) => c.id === tender.client_id);
    const items = memoryItems
      .filter((i) => i.tender_id === tender.id)
      .map((item) => ({
        ...item,
        product: memoryProducts.find((p) => p.id === item.product_id),
      }));
    const payments = memoryPayments.filter((p) => p.tender_id === tender.id);
    const transitions = memoryTransitions
      .filter((t) => t.tender_id === tender.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      ...tender,
      client,
      items,
      payments,
      transitions,
    };
  },

  async createTender(tenderData: {
    title: string;
    description?: string;
    client_id: string;
    presupuesto_maximo: number;
    fecha_limite: string;
    code?: string;
  }): Promise<Tender> {
    const client = await this.getClientById(tenderData.client_id);
    if (!client) throw new Error('El cliente seleccionado no existe');

    const nextNumber = memoryTenders.length + 1;
    const generatedCode = tenderData.code || `LIC-2026-${String(nextNumber).padStart(3, '0')}`;

    const newTender: Tender = {
      id: crypto.randomUUID(),
      code: generatedCode,
      title: tenderData.title,
      description: tenderData.description || '',
      client_id: tenderData.client_id,
      status: 'borrador',
      presupuesto_maximo: Number(tenderData.presupuesto_maximo),
      total_estimado: 0.0,
      fecha_limite: new Date(tenderData.fecha_limite).toISOString(),
      reminder_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryTenders.unshift(newTender);

    await this.logTransition(
      newTender.id,
      'none',
      'borrador',
      'Admin / Usuario',
      'Creación inicial de la licitación en estado borrador.'
    );

    return this.populateTender(newTender);
  },

  async updateTenderProposal(
    id: string,
    fileData: { url: string; name: string; size: number }
  ): Promise<Tender> {
    const index = memoryTenders.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Licitación no encontrada');

    memoryTenders[index].proposal_file_url = fileData.url;
    memoryTenders[index].proposal_file_name = fileData.name;
    memoryTenders[index].proposal_file_size = fileData.size;
    memoryTenders[index].updated_at = new Date().toISOString();

    return this.populateTender(memoryTenders[index]);
  },

  // ==========================================
  // PRODUCTOS EN LICITACIÓN
  // ==========================================
  async addItemToTender(
    tenderId: string,
    productId: string,
    quantity: number
  ): Promise<{ item: TenderItem; tender: Tender }> {
    const tender = memoryTenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Licitación no encontrada');

    if (['finalizada', 'por_cobrar', 'cobrada', 'perdida'].includes(tender.status)) {
      throw new Error(`No se permite modificar productos en licitaciones con estado "${tender.status}"`);
    }

    const product = memoryProducts.find((p) => p.id === productId);
    if (!product) throw new Error('Producto no encontrado');

    const itemSubtotal = quantity * product.unit_price;
    const currentTotal = memoryItems
      .filter((i) => i.tender_id === tenderId)
      .reduce((sum, i) => sum + i.subtotal, 0);

    const projectedTotal = currentTotal + itemSubtotal;

    if (projectedTotal > tender.presupuesto_maximo) {
      throw new Error(
        `El monto total proyectado ($${projectedTotal.toFixed(2)}) supera el presupuesto máximo permitido ($${Number(tender.presupuesto_maximo).toFixed(2)})`
      );
    }

    const newItem: TenderItem = {
      id: crypto.randomUUID(),
      tender_id: tenderId,
      product_id: productId,
      quantity,
      unit_price: product.unit_price,
      subtotal: itemSubtotal,
      created_at: new Date().toISOString(),
      product,
    };

    const existingIndex = memoryItems.findIndex(
      (i) => i.tender_id === tenderId && i.product_id === productId
    );

    if (existingIndex !== -1) {
      const updatedQuantity = memoryItems[existingIndex].quantity + quantity;
      const updatedSubtotal = updatedQuantity * product.unit_price;
      const newCalculatedTotal = currentTotal - memoryItems[existingIndex].subtotal + updatedSubtotal;

      if (newCalculatedTotal > tender.presupuesto_maximo) {
        throw new Error(
          `Al actualizar la cantidad, el total ($${newCalculatedTotal.toFixed(2)}) supera el presupuesto máximo permitido ($${Number(tender.presupuesto_maximo).toFixed(2)})`
        );
      }

      memoryItems[existingIndex].quantity = updatedQuantity;
      memoryItems[existingIndex].subtotal = updatedSubtotal;
      tender.total_estimado = newCalculatedTotal;
    } else {
      memoryItems.push(newItem);
      tender.total_estimado = projectedTotal;
    }

    tender.updated_at = new Date().toISOString();
    return { item: newItem, tender: this.populateTender(tender) };
  },

  async removeItemFromTender(tenderId: string, itemId: string): Promise<Tender> {
    const tender = memoryTenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Licitación no encontrada');

    if (['finalizada', 'por_cobrar', 'cobrada', 'perdida'].includes(tender.status)) {
      throw new Error(`No se permite modificar productos en licitaciones con estado "${tender.status}"`);
    }

    const itemIndex = memoryItems.findIndex((i) => i.id === itemId && i.tender_id === tenderId);
    if (itemIndex === -1) throw new Error('Ítem no encontrado en la licitación');

    memoryItems.splice(itemIndex, 1);

    const newTotal = memoryItems
      .filter((i) => i.tender_id === tenderId)
      .reduce((sum, i) => sum + i.subtotal, 0);

    tender.total_estimado = newTotal;
    tender.updated_at = new Date().toISOString();

    return this.populateTender(tender);
  },

  // ==========================================
  // TRANSICIONES DE ESTADO
  // ==========================================
  async transitionTenderStatus(
    tenderId: string,
    newStatus: TenderStatus,
    userName: string = 'Usuario',
    notes?: string
  ): Promise<Tender> {
    const index = memoryTenders.findIndex((t) => t.id === tenderId);
    if (index === -1) throw new Error('Licitación no encontrada');

    const tender = memoryTenders[index];
    const previousStatus = tender.status;

    const allowed = VALID_TRANSITIONS[previousStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Transición no permitida: No se puede cambiar de "${previousStatus}" a "${newStatus}". Transiciones válidas: [${allowed.join(', ') || 'ninguna'}]`
      );
    }

    if (previousStatus === 'borrador' && newStatus === 'activa') {
      if (!tender.proposal_file_url) {
        throw new Error(
          'Requisito obligatorio: Debe adjuntar el documento de propuesta formal antes de enviar y activar la licitación.'
        );
      }
    }

    tender.status = newStatus;
    tender.updated_at = new Date().toISOString();

    await this.logTransition(tenderId, previousStatus, newStatus, userName, notes);

    return this.populateTender(tender);
  },

  // ==========================================
  // PAGOS
  // ==========================================
  async registerPayment(
    tenderId: string,
    amount: number,
    reference?: string,
    userName: string = 'Usuario'
  ): Promise<{ payment: Payment; tender: Tender; autoCobrada: boolean }> {
    const tender = memoryTenders.find((t) => t.id === tenderId);
    if (!tender) throw new Error('Licitación no encontrada');

    if (tender.status !== 'por_cobrar') {
      throw new Error(
        `Solo se pueden registrar pagos en licitaciones en estado "por_cobrar" (Estado actual: "${tender.status}")`
      );
    }

    if (amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    const previousPaymentsSum = memoryPayments
      .filter((p) => p.tender_id === tenderId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingBalance = tender.total_estimado - previousPaymentsSum;

    if (amount > pendingBalance + 0.01) {
      throw new Error(
        `El monto ($${amount.toFixed(2)}) supera el saldo pendiente de cobro ($${pendingBalance.toFixed(2)})`
      );
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      tender_id: tenderId,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      reference: reference || 'Abono / Pago registrado',
      created_at: new Date().toISOString(),
    };

    memoryPayments.push(newPayment);

    const newTotalPaid = previousPaymentsSum + amount;
    const newRemainingBalance = tender.total_estimado - newTotalPaid;

    let autoCobrada = false;
    if (newRemainingBalance <= 0.01) {
      tender.status = 'cobrada';
      tender.updated_at = new Date().toISOString();
      autoCobrada = true;

      await this.logTransition(
        tenderId,
        'por_cobrar',
        'cobrada',
        'Sistema Automático de Cobranzas',
        `Saldo liquidado al 100% tras el pago de $${amount.toFixed(2)} (Ref: ${reference || 'N/A'}). Transición automática.`
      );
    }

    return {
      payment: newPayment,
      tender: this.populateTender(tender),
      autoCobrada,
    };
  },

  // ==========================================
  // AUDITORÍA DE TRANSICIONES
  // ==========================================
  async logTransition(
    tenderId: string,
    previousStatus: TenderStatus | 'none',
    newStatus: TenderStatus,
    userName: string,
    notes?: string
  ): Promise<TenderTransition> {
    const transition: TenderTransition = {
      id: crypto.randomUUID(),
      tender_id: tenderId,
      previous_status: previousStatus,
      new_status: newStatus,
      user_name: userName,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    memoryTransitions.unshift(transition);
    return transition;
  },

  async getAllTransitions(): Promise<TenderTransition[]> {
    return memoryTransitions;
  },
};
