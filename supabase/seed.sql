-- ==============================================================================
-- SISTEMA DE GESTIÓN DE LICITACIONES - SEED DATA DE EJEMPLO
-- ==============================================================================

-- 1. Insertar Clientes
INSERT INTO clients (id, name, tax_id, email, phone, address, contact_name) VALUES
('a0000001-0000-0000-0000-000000000001', 'Corporación Minera Andina S.A.', 'RUC-20489123451', 'licitaciones@mineraandina.com', '+51 987 654 321', 'Av. Las Begonias 450, San Isidro, Lima', 'Ing. Roberto Mendoza'),
('a0000001-0000-0000-0000-000000000002', 'Hospital Metropolitano del Norte', 'NIT-901234567-8', 'compras@hospitalmetronorte.org', '+57 310 987 6543', 'Cra. 45 # 120-30, Bogotá', 'Dra. Patricia Silva'),
('a0000001-0000-0000-0000-000000000003', 'Gobierno Regional de Infraestructura', 'RUT-76543210-K', 'abastecimiento@gobregion.gob', '+56 2 2345 6789', 'Calle Moneda 820, Santiago', 'Lic. Alejandro Torres'),
('a0000001-0000-0000-0000-000000000004', 'Constructora e Inmobiliaria Horizon', 'RUC-20601239874', 'proyectos@constructora-horizon.com', '+51 999 111 222', 'Av. El Sol 880, Arequipa', 'Arq. Marcela Castro')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Productos de Catálogo Maestro
INSERT INTO products (id, code, name, description, unit_price, unit_measure, is_active) VALUES
('b0000001-0000-0000-0000-000000000001', 'SRV-ENT-001', 'Servidor Rack Enterprise Dell PowerEdge R750', '2x Xeon Gold, 128GB RAM DDR4, 4x 1.92TB SSD NVMe, Dual PSU', 4850.00, 'UNIDAD', true),
('b0000001-0000-0000-0000-000000000002', 'LIC-SO-WIN', 'Licencia Microsoft Windows Server 2022 Datacenter', 'Licencia OEM 16 núcleos con soporte de virtualización ilimitada', 1250.00, 'LICENCIA', true),
('b0000001-0000-0000-0000-000000000003', 'NET-SW-C9300', 'Switch Cisco Catalyst 9300 48 Puertos PoE+ Gigabit', 'Switch administrable Layer 3 con módulo de fibra 10GbE y Network Essentials', 3400.00, 'UNIDAD', true),
('b0000001-0000-0000-0000-000000000004', 'UPS-APC-3KVA', 'Sistema UPS Online APC Smart-UPS RT 3000VA 230V', 'Doble conversión en línea, pantalla LCD, gestión remota SNMP', 1890.00, 'UNIDAD', true),
('b0000001-0000-0000-0000-000000000005', 'SRV-INST-PRO', 'Servicio Profesional de Implementación y Cableado Estructurado', 'Despliegue, configuración en clúster, cableado Cat6A y certificación', 2500.00, 'SERVICIO', true),
('b0000001-0000-0000-0000-000000000006', 'LAP-BUS-THINK', 'Laptop Empresarial Lenovo ThinkPad T14 Gen 4', 'Core i7 13th Gen, 32GB RAM, 1TB SSD, 14 pulgadas FHD, Win 11 Pro', 1450.00, 'UNIDAD', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Licitaciones en Diferentes Estados para Pruebas Completas
INSERT INTO tenders (id, code, title, description, client_id, status, presupuesto_maximo, total_estimado, fecha_limite, proposal_file_url, proposal_file_name, proposal_file_size, reminder_sent) VALUES
-- 3.1. Estado Borrador (recién creada, sin enviar)
('c0000001-0000-0000-0000-000000000001', 'LIC-2026-001', 'Renovación de Servidores Data Center Central', 'Suministro e instalación de 4 servidores de alta densidad para base de datos transaccional.', 'a0000001-0000-0000-0000-000000000001', 'borrador', 30000.00, 21900.00, NOW() + INTERVAL '15 days', 'https://raw.githubusercontent.com/sample/propuesta-servidores.pdf', 'Propuesta_Tecnica_MineraAndina_v1.pdf', 2450120, false),

-- 3.2. Estado Activa (Urgente: próxima a vencer en 24h para probar banner y recordatorio)
('c0000001-0000-0000-0000-000000000002', 'LIC-2026-002', 'Equipamiento de Redes y Switches Hospitalarios', 'Infraestructura de red de alta disponibilidad para salas de urgencias y telemedicina.', 'a0000001-0000-0000-0000-000000000002', 'activa', 25000.00, 16100.00, NOW() + INTERVAL '30 hours', 'https://raw.githubusercontent.com/sample/propuesta-hospital.pdf', 'Propuesta_Hospital_Redes_2026.pdf', 1890450, false),

-- 3.3. Estado Finalizada (Ganada, pendiente de facturar)
('c0000001-0000-0000-0000-000000000003', 'LIC-2026-003', 'Modernización de Laptops para Área de Ingeniería', 'Dotación de 10 equipos de cómputo de alto rendimiento para proyectos de infraestructura.', 'a0000001-0000-0000-0000-000000000003', 'finalizada', 18000.00, 14500.00, NOW() - INTERVAL '5 days', 'https://raw.githubusercontent.com/sample/propuesta-laptops.pdf', 'Propuesta_Gobierno_Laptops.pdf', 1420800, true),

-- 3.4. Estado Por Cobrar (Facturada, con pagos parciales)
('c0000001-0000-0000-0000-000000000004', 'LIC-2026-004', 'Sistemas de Respaldo Energético UPS para Obras', 'Instalación de bancos de baterías y UPS de 3kVA en campamento minero.', 'a0000001-0000-0000-0000-000000000004', 'por_cobrar', 12000.00, 8170.00, NOW() - INTERVAL '20 days', 'https://raw.githubusercontent.com/sample/propuesta-ups.pdf', 'Propuesta_Horizon_Energia.pdf', 980300, true),

-- 3.5. Estado Cobrada (Totalmente pagada)
('c0000001-0000-0000-0000-000000000005', 'LIC-2026-005', 'Cableado y Certificación de Fibra Óptica', 'Servicio de integración de redes y canalización subterránea.', 'a0000001-0000-0000-0000-000000000001', 'cobrada', 8000.00, 5000.00, NOW() - INTERVAL '40 days', 'https://raw.githubusercontent.com/sample/propuesta-fibra.pdf', 'Propuesta_Minera_Fibra.pdf', 850200, true),

-- 3.6. Estado Perdida (No adjudicada / vencida)
('c0000001-0000-0000-0000-000000000006', 'LIC-2026-006', 'Licenciamiento Corporativo de Servidores', 'Adquisición de licencias para data center alterno.', 'a0000001-0000-0000-0000-000000000002', 'perdida', 10000.00, 6250.00, NOW() - INTERVAL '2 days', 'https://raw.githubusercontent.com/sample/propuesta-licencias.pdf', 'Propuesta_Licencias_Metronorte.pdf', 620100, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Productos de Licitaciones (Tender Items)
INSERT INTO tender_items (tender_id, product_id, quantity, unit_price) VALUES
-- LIC-2026-001 (Borrador)
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 4.00, 4850.00), -- 19,400
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', 1.00, 2500.00), -- 2,500 = Total 21,900

-- LIC-2026-002 (Activa)
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000003', 4.00, 3400.00), -- 13,600
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 1.00, 2500.00), -- 2,500 = Total 16,100

-- LIC-2026-003 (Finalizada)
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000006', 10.00, 1450.00), -- 14,500

-- LIC-2026-004 (Por Cobrar - Total 8,170)
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 3.00, 1890.00), -- 5,670
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000005', 1.00, 2500.00), -- 2,500 = Total 8,170

-- LIC-2026-005 (Cobrada - Total 5,000)
('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000005', 2.00, 2500.00), -- 5,000

-- LIC-2026-006 (Perdida - Total 6,250)
('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000002', 5.00, 1250.00)  -- 6,250
ON CONFLICT (tender_id, product_id) DO NOTHING;

-- 5. Insertar Pagos Registrados
INSERT INTO payments (id, tender_id, amount, payment_date, reference) VALUES
-- LIC-2026-004 (Por cobrar: Total 8,170.00, Pagado: 5,000.00, Saldo Pendiente: 3,170.00)
('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004', 3000.00, CURRENT_DATE - INTERVAL '10 days', 'Anticipo 35% - Transf. BCP #9872134'),
('d0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000004', 2000.00, CURRENT_DATE - INTERVAL '3 days', 'Segundo Abono Entrega Parcial - Cheque #44219'),

-- LIC-2026-005 (Cobrada: Total 5,000.00, Pagado: 5,000.00, Saldo: 0.00)
('d0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000005', 2500.00, CURRENT_DATE - INTERVAL '25 days', 'Pago 50% Inicio - Factura F001-492'),
('d0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000005', 2500.00, CURRENT_DATE - INTERVAL '15 days', 'Pago Final Liquidación - Transf. BBVA #102934')
ON CONFLICT (id) DO NOTHING;

-- 6. Insertar Historial de Transiciones y Auditoría
INSERT INTO tender_transitions (tender_id, previous_status, new_status, user_name, notes, created_at) VALUES
-- LIC-2026-001
('c0000001-0000-0000-0000-000000000001', 'none', 'borrador', 'Admin Comercial', 'Creación inicial de la licitación y definición de presupuesto.', NOW() - INTERVAL '1 day'),

-- LIC-2026-002
('c0000001-0000-0000-0000-000000000002', 'none', 'borrador', 'Admin Comercial', 'Registro de licitación para equipamiento hospitalario.', NOW() - INTERVAL '3 days'),
('c0000001-0000-0000-0000-000000000002', 'borrador', 'activa', 'Admin Comercial', 'Subida de propuesta técnica y envío formal por correo con adjunto.', NOW() - INTERVAL '2 days'),

-- LIC-2026-003
('c0000001-0000-0000-0000-000000000003', 'borrador', 'activa', 'Admin Comercial', 'Envío formal de propuesta aprobada.', NOW() - INTERVAL '12 days'),
('c0000001-0000-0000-0000-000000000003', 'activa', 'finalizada', 'Admin Comercial', 'Licitación adjudicada a nuestra empresa. Entrega de laptops completada.', NOW() - INTERVAL '5 days'),

-- LIC-2026-004
('c0000001-0000-0000-0000-000000000004', 'borrador', 'activa', 'Admin Comercial', 'Envío de propuesta económica al cliente.', NOW() - INTERVAL '30 days'),
('c0000001-0000-0000-0000-000000000004', 'activa', 'finalizada', 'Admin Comercial', 'Adjudicación exitosa y firma de contrato.', NOW() - INTERVAL '22 days'),
('c0000001-0000-0000-0000-000000000004', 'finalizada', 'por_cobrar', 'Finanzas / Cobranzas', 'Emisión de Factura F001-0982 por un total de $8,170.00. En gestión de cobro.', NOW() - INTERVAL '20 days'),

-- LIC-2026-005
('c0000001-0000-0000-0000-000000000005', 'borrador', 'activa', 'Admin Comercial', 'Envío de propuesta técnica de fibra óptica.', NOW() - INTERVAL '50 days'),
('c0000001-0000-0000-0000-000000000005', 'activa', 'finalizada', 'Admin Comercial', 'Acta de conformidad de servicio firmada.', NOW() - INTERVAL '42 days'),
('c0000001-0000-0000-0000-000000000005', 'finalizada', 'por_cobrar', 'Finanzas / Cobranzas', 'Facturado.', NOW() - INTERVAL '40 days'),
('c0000001-0000-0000-0000-000000000005', 'por_cobrar', 'cobrada', 'Sistema de Cobranza', 'Saldo pendiente llegó a $0.00 tras el registro del pago final. Transición automática.', NOW() - INTERVAL '15 days'),

-- LIC-2026-006
('c0000001-0000-0000-0000-000000000006', 'borrador', 'activa', 'Admin Comercial', 'Envío de propuesta formal.', NOW() - INTERVAL '10 days'),
('c0000001-0000-0000-0000-000000000006', 'activa', 'perdida', 'Vercel Cron Job (Auto)', 'La fecha límite venció sin confirmación de adjudicación. Transición automática por tarea programada.', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;
