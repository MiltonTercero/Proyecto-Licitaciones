# DOCUMENTACIÓN TÉCNICA INTEGRAL
## Sistema de Gestión de Licitaciones Comerciales (MT)

---

## 1. RESUMEN EJECUTIVO Y FICHA TÉCNICA

### 1.1. Propósito del Sistema
El **Sistema de Gestión de Licitaciones Comerciales (MT)** es una plataforma web empresarial diseñada para digitalizar, controlar y auditar todo el ciclo de vida de propuestas comerciales, cotizaciones técnicas, validación de presupuestos, envío formal de ofertas a clientes, automatización de vencimientos y gestión de cobranzas.

El sistema resuelve la problemática de inconsistencias presupuestarias, pérdida de propuestas, falta de seguimiento en fechas límites de convocatorias y desarticulación entre la adjudicación comercial y la recaudación financiera.

### 1.2. Ficha Técnica
* **Nombre de la Aplicación**: Sistema de Gestión de Licitaciones Comerciales
* **Framework Principal**: Next.js 16.3.3 (App Router, Server y Client Components)
* **Librería de Interfaz**: React 19.2.8
* **Lenguaje**: TypeScript 5
* **Estilos y Diseño**: Tailwind CSS 4.x, Lucide Icons
* **Motor de Base de Datos**: PostgreSQL 15+ (Gestionado vía Supabase)
* **Mecanismos de Seguridad en BD**: Row Level Security (RLS), Triggers PL/pgSQL, Generated Columns
* **Almacenamiento de Archivos (Object Storage)**: Supabase Storage (Bucket dedicado `proposals`)
* **Servicio de Correos Transaccionales**: Resend API con plantillas HTML dinámicas y buffer binario de adjuntos
* **Tareas Programadas (Cron Jobs)**: Vercel Cron Jobs / Endpoints HTTP protegidos con secreto criptográfico
* **Mecanismo de Autenticación**: Sesiones mediante JWT (JSON Web Tokens) en Cookies `HttpOnly`, validación en servidor y cliente, y contraseñas cifradas con `bcryptjs`

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1. Diagrama de Capas de la Aplicación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE PRESENTACIÓN (CLIENTE)                     │
│  React 19 / Next.js Pages (Client Components) + Context Providers       │
│  - Dashboard de Métricas e Indicadores de Rendimiento (KPIs)            │
│  - Wizard de Creación de Licitaciones en 3 Pasos                        │
│  - Vistas de Detalle con Stepper de Estados y Modal de Cobranzas        │
│  - Módulos Maestros: Clientes, Productos, Auditoría y Usuarios          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Peticiones HTTPS (Fetch API)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              CAPA DE SEGURIDAD PERIMETRAL Y ENRUTAMIENTO                │
│  - proxy.ts (Next.js 16 Server Interceptor / Middleware)                │
│  - Rate Limiter en Memoria (Protección contra fuerza bruta y DDoS)       │
│  - Control de Acceso Basado en Roles (RBAC: Admin, Gestor, Visualizador) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 CAPA DE CONTROL Y SERVICIOS (BACKEND)                   │
│  Route Handlers (/app/api/*)                                            │
│  - /api/auth/*: Gestión de sesiones, login, logout, me                  │
│  - /api/tenders/*: CRUD, control de ítems, subida de PDF, transiciones  │
│  - /api/clients/*: Catálogo y búsqueda de clientes corporativos         │
│  - /api/products/*: Catálogo maestro de productos y servicios           │
│  - /api/cron/*: Automatización de vencimientos y recordatorios          │
│  - /api/users/* y /api/audit/*: Administración del sistema              │
└──────────────────┬──────────────────┬─────────────────┬─────────────────┘
                   │                  │                 │
                   ▼                  ▼                 ▼
┌──────────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐
│   SUPABASE DATABASE  │  │ SUPABASE STORAGE │  │     RESEND EMAIL API    │
│  PostgreSQL 15+      │  │ Bucket:          │  │ Envío transaccional de  │
│  Triggers & Checks   │  │ 'proposals'      │  │ propuestas formales     │
│  Auditoría inmutable │  │ (Documentos PDF) │  │ y alertas de expiración │
└──────────────────────┘  └──────────────────┘  └─────────────────────────┘
```

### 2.2. Máquina de Estados Finitos (Lifecycle de una Licitación)

El núcleo de la lógica de negocio se rige bajo una máquina de estados estricta y determinista:

```
                  ┌──────────────┐
                  │   Borrador   │
                  └──────┬───────┘
                         │ Requiere PDF formal adjunto y dispara
                         │ email al cliente con resumen y archivo
                         ▼
                  ┌──────────────┐
       ┌──────────┤    Activa    ├──────────┐
       │          └──────┬───────┘          │
       │                 │                  │
       │ Plazo vencido   │ Adjudicación     │ Descalificación
       │ (Cron o Manual) │ aprobada         │ o desestimación
       ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐   ┌──────────────┐
│   Perdida    │  │  Finalizada  │   │   Perdida    │
└──────────────┘  └──────┬───────┘   └──────────────┘
                         │ Facturación emitida
                         ▼
                  ┌──────────────┐
                  │  Por Cobrar  │
                  └──────┬───────┘
                         │ Pagos sucesivos acumulados
                         │ hasta Saldo Pendiente = $0.00
                         ▼
                  ┌──────────────┐
                  │   Cobrada    │
                  └──────────────┘
```

#### Reglas de Transición Inviolables:
1. **De `borrador` a `activa`**: Solo es posible si la licitación cuenta con un archivo formal subido (`proposal_file_url`) y al menos un producto cotizado.
2. **De `activa` a `finalizada` o `perdida`**: La marca como ganada o no adjudicada. Si vence la fecha límite, el sistema automatizado la pasa directamente a `perdida`.
3. **De `finalizada` a `por_cobrar`**: Habilita el módulo contable de abonos y pagos parciales.
4. **De `por_cobrar` a `cobrada`**: Se dispara automáticamente cuando la suma de pagos registrados iguala el total estimado de la licitación.
5. **Congelamiento de Ítems**: Una vez que la licitación sale de `activa` (entra en `finalizada`, `por_cobrar`, `cobrada` o `perdida`), la base de datos y la API impiden estrictamente modificar, añadir o retirar productos.

---

## 3. ESQUEMA DE BASE DE DATOS Y PERSISTENCIA

El esquema reside en PostgreSQL gestionado a través de Supabase (`supabase/schema.sql`).

### 3.1. Tablas y Entidades

| Tabla | Clave Primaria | Propósito | Restricciones Destacadas |
|---|---|---|---|
| `roles` | `UUID` | Almacena los roles del sistema (`admin`, `gestor`, `visualizador`). | `name` es único. |
| `users` | `UUID` | Credenciales de acceso de usuarios del sistema. | `email` único, `password_hash` con bcrypt, llave foránea hacia `roles`. |
| `profiles` | `UUID` | Perfil extendido del usuario. | Sincronizado para lecturas y roles operativos. |
| `clients` | `UUID` | Registro de empresas y entidades convocantes. | `tax_id` (RUC/NIT/CIF), índices de búsqueda por nombre y correo. |
| `products` | `UUID` | Catálogo maestro de bienes y servicios ofrecidos. | `code` único, `unit_price >= 0`. |
| `tenders` | `UUID` | Registro maestro de la licitación. | `code` único (ej. `LIC-2026-001`), `check_total_presupuesto` (`total_estimado <= presupuesto_maximo`). |
| `tender_items` | `UUID` | Relación N:M entre licitaciones y productos. | `UNIQUE (tender_id, product_id)`. `subtotal` es columna generada: `GENERATED ALWAYS AS (quantity * unit_price) STORED`. |
| `payments` | `UUID` | Pagos y comprobantes de cobranza. | `amount > 0`, llave foránea hacia `tenders` con borrado en cascada. |
| `tender_transitions`| `UUID` | Pistas de auditoría del ciclo de vida de la licitación. | Guarda `previous_status`, `new_status`, fecha, usuario y notas explicativas. |
| `audit_logs` | `UUID` | Pistas globales de auditoría de seguridad y mutación de datos. | Registra `action`, `user_id`, `table_name`, `record_id`, valores anteriores y nuevos en `JSONB`, e IP. |

### 3.2. Lógica de Base de Datos (Triggers PL/pgSQL)

1. **`trigger_tender_items_recalculate`**:
   - Se ejecuta `AFTER INSERT OR UPDATE OR DELETE ON tender_items`.
   - Verifica que el estado de la licitación no sea un estado cerrado (`finalizada`, `por_cobrar`, `cobrada`, `perdida`).
   - Suma todos los subtotales de los productos asignados a la licitación.
   - Si la suma sobrepasa el `presupuesto_maximo`, arroja una excepción PostgreSQL y revierte la transacción.
   - Actualiza automáticamente la columna `total_estimado` en la tabla `tenders`.

2. **`set_updated_at`**:
   - Se ejecuta `BEFORE UPDATE` en `users`, `clients`, `products` y `tenders` para garantizar marcas de tiempo confiables.

---

## 4. ESTRUCTURA COMPLETA DEL PROYECTO

```
sistema-licitaciones/
├── app/                                 # Enrutador App Router de Next.js
│   ├── admin/                           # Vistas restringidas para Administradores
│   │   ├── audit/page.tsx               # Consola visual de logs de auditoría global
│   │   └── users/page.tsx               # Gestión integral de usuarios y asignación de roles
│   ├── api/                             # Endpoints backend (Route Handlers)
│   │   ├── audit/route.ts               # Consulta y filtrado de registros de auditoría
│   │   ├── auth/                        # Endpoints de autenticación
│   │   │   ├── login/route.ts           # Login con verificación bcrypt, emisión JWT y cookies
│   │   │   ├── logout/route.ts          # Cierre de sesión y limpieza de cookies
│   │   │   └── me/route.ts              # Consulta de usuario autenticado
│   │   ├── clients/                     # Endpoints de empresas clientes
│   │   │   ├── [id]/route.ts            # Edición y eliminación de un cliente
│   │   │   ├── route.ts                 # Listado y alta de clientes
│   │   │   └── search/route.ts          # Búsqueda rápida optimizada para comboboxes
│   │   ├── cron/                        # Tareas automáticas en segundo plano
│   │   │   └── check-deadlines/route.ts # Cron de expiración de plazos y recordatorio 48h
│   │   ├── products/                    # Endpoints del catálogo de productos
│   │   │   ├── [id]/route.ts            # Edición y baja de un producto
│   │   │   └── route.ts                 # Listado y alta de productos
│   │   ├── tenders/                     # Endpoints de licitaciones comerciales
│   │   │   ├── [id]/                    # Sub-recursos de una licitación específica
│   │   │   │   ├── items/route.ts       # Alta y baja de productos con validación presupuestaria
│   │   │   │   ├── payments/route.ts    # Registro de pagos y liquidación automática
│   │   │   │   ├── route.ts             # Detalle consolidado (join cliente, ítems, pagos)
│   │   │   │   ├── send/route.ts        # Envío de propuesta formal por Resend y activación
│   │   │   │   ├── status/route.ts      # Transición validada de la máquina de estados
│   │   │   │   └── upload/route.ts      # Recepción y subida de PDF a Supabase Storage
│   │   │   └── route.ts                 # Listado y creación atómica de licitaciones
│   │   ├── transitions/route.ts         # Registro global de cambios de estado
│   │   └── users/                       # Endpoints para administración de cuentas de usuario
│   │       ├── [id]/route.ts            # Actualización y baja de usuarios
│   │       └── route.ts                 # Listado y registro de nuevos usuarios
│   ├── auditoria/page.tsx               # Interfaz general de auditoría
│   ├── clientes/page.tsx                # Interfaz de gestión de empresas convocantes
│   ├── licitaciones/                    # Vistas del módulo de licitaciones
│   │   ├── [id]/page.tsx                # Vista de detalle, control de estado y finanzas
│   │   ├── nueva/page.tsx               # Wizard guiado de 3 pasos para nueva licitación
│   │   └── page.tsx                     # Listado general con filtros avanzados
│   ├── login/page.tsx                   # Pantalla de acceso con protección de credenciales
│   ├── productos/page.tsx               # Interfaz del catálogo maestro de productos
│   ├── globals.css                      # Estilos globales y tokens Tailwind CSS
│   ├── layout.tsx                       # Layout raíz con proveedores de contexto
│   └── page.tsx                         # Dashboard principal (KPIs, gráficos y alertas)
├── components/                          # Componentes modulares de interfaz
│   ├── auth/                            # Componentes de autenticación
│   │   └── auth-context.tsx             # Contexto React para estado de sesión y wrapper fetch
│   ├── clients/                         # Componentes del módulo de clientes
│   │   └── client-search-combobox.tsx   # Selector de autocompletado y alta rápida de clientes
│   ├── dashboard/                       # Componentes del panel principal
│   │   ├── kpi-card.tsx                 # Tarjeta de métrica con indicador de tendencia
│   │   ├── tender-distribution-chart.tsx# Gráfico de barras de distribución por estado
│   │   └── urgent-tenders-banner.tsx    # Banner de alerta visual para licitaciones < 48 horas
│   ├── layout/                          # Componentes estructurales de la aplicación
│   │   ├── app-shell.tsx                # Contenedor maestro con barra lateral y contenido
│   │   ├── navbar.tsx                   # Barra superior con datos de usuario y logout
│   │   ├── sidebar.tsx                  # Menú de navegación con filtrado por rol RBAC
│   │   ├── sidebar-context.tsx          # Control del estado colapsado/expandido de la barra
│   │   └── theme-context.tsx            # Soporte de modo oscuro / modo claro
│   ├── tenders/                         # Componentes especializados de licitaciones
│   │   ├── file-uploader.tsx            # Zona de arrastre y subida de PDFs técnicos
│   │   ├── payment-modal.tsx            # Ventana modal para registro de cobranzas
│   │   ├── status-stepper.tsx           # Barra de progreso del ciclo de vida
│   │   ├── tender-budget-bar.tsx        # Barra interactiva de control presupuestario
│   │   └── transition-history.tsx       # Línea de tiempo con historial de auditoría
│   └── ui/                              # Componentes genéricos de interfaz
│       └── status-badge.tsx             # Etiqueta con estilo cromático según estado
├── lib/                                 # Librerías auxiliares y lógica del servidor
│   ├── audit/                           # Módulo de auditoría
│   │   └── audit-logger.ts              # Función para registro estructurado en BD y consola
│   ├── auth/                            # Lógica de seguridad y autenticación
│   │   ├── jwt.ts                       # Generación y verificación de tokens JWT
│   │   ├── middleware.ts                # Decorador requireAuth y validación de roles en APIs
│   │   ├── password.ts                  # Hashing y validación de contraseñas con bcrypt
│   │   └── rate-limiter.ts              # Algoritmo de limitación de tasa por dirección IP
│   ├── email/                           # Módulo de mensajería electrónica
│   │   ├── resend.ts                    # Cliente Resend con soporte de adjuntos binarios
│   │   └── templates.ts                 # Plantillas HTML responsivas para correos
│   ├── storage/                         # Capa de acceso a datos unificada
│   │   └── store.ts                     # Funciones CRUD e integración con Supabase
│   ├── supabase/                        # Conectores de base de datos
│   │   ├── admin.ts                     # Cliente Supabase privilegiado (Service Role)
│   │   └── client.ts                    # Cliente Supabase anónimo / cliente
│   └── types/                           # Definiciones de TypeScript
│       └── database.ts                  # Interfaces de entidades y modelos del sistema
├── public/                              # Recursos estáticos servidos públicamente
├── supabase/                            # Scripts de infraestructura de base de datos
│   ├── schema.sql                       # Definición de tablas, tipos enum, índices y triggers
│   └── seed.sql                         # Datos de prueba para verificación inmediata
├── eslint.config.mjs                    # Configuración de linter de código
├── next.config.ts                       # Configuración de compilación de Next.js
├── package.json                         # Dependencias y scripts de ejecución
├── postcss.config.mjs                   # Pipeline de procesamiento CSS
├── proxy.ts                             # Guardián de servidor para intercepción de rutas
├── tsconfig.json                        # Configuración del compilador TypeScript
└── vercel.json                          # Configuración de Cron Jobs para Vercel
```

---

## 5. DESGLOSE DETALLADO ARCHIVO POR ARCHIVO

### 5.1. Archivos de Configuración y Raíz

#### `package.json`
Define el manifiesto del proyecto, las dependencias de ejecución y desarrollo, y los scripts principales:
- `npm run dev`: Ejecuta el servidor local de desarrollo con Turbopack.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia el servidor optimizado de producción.
- **Dependencias clave**: `@supabase/supabase-js`, `bcryptjs`, `jsonwebtoken`, `lucide-react`, `next`, `react`, `react-dom`, `resend`, `zod`.

#### `proxy.ts`
Es la **primera línea de defensa a nivel de servidor** en Next.js. Funciona como un interceptor perimetral de peticiones HTTP:
- **Rutas Públicas**: Permite libre acceso a `/login`, `/api/auth/*` y `/api/cron/*`.
- **Rutas de API Privadas**: Revisa si existe la cookie `mt_access_token` o el encabezado `Authorization: Bearer <token>`. Si no existe, retorna inmediatamente `401 Unauthorized`.
- **Páginas Protegidas**: Si un usuario intenta acceder a rutas como `/`, `/licitaciones`, `/clientes`, etc. sin una cookie válida de sesión, es redirigido automáticamente a `/login`.
- **Matcher**: Excluye activos estáticos (`_next`, imágenes, `favicon.ico`) para no degradar el rendimiento.

#### `vercel.json`
Define la automatización de infraestructura en la nube de Vercel. Configura un **Cron Job** que invoca periódicamente la ruta `/api/cron/check-deadlines` cada 6 horas (`0 */6 * * *`) para garantizar la auto-expiración de licitaciones y el despacho de recordatorios.

#### `tsconfig.json` y `next.config.ts`
Configuraciones estándar del compilador TypeScript con alias de módulo `@/*` apuntando a la raíz, optimización de fuentes y empaquetado de producción.

---

### 5.2. Capa de Servicios y Lógica de Negocio (`lib/`)

#### `lib/types/database.ts`
Declara los tipos estrictos de TypeScript para todo el modelo de datos:
- `TenderStatus`: `'borrador' | 'activa' | 'finalizada' | 'por_cobrar' | 'cobrada' | 'perdida'`
- `RoleType` / `UserRole`: `'admin' | 'gestor' | 'visualizador'`
- Interfaces para `User`, `Role`, `Profile`, `AuditLog`, `Client`, `Product`, `TenderItem`, `Payment`, `TenderTransition` y `Tender` (con campos anidados para joins).

#### `lib/supabase/admin.ts` y `lib/supabase/client.ts`
- `admin.ts`: Instancia el cliente de Supabase utilizando `SUPABASE_SERVICE_ROLE_KEY`. Este cliente tiene privilegios elevados para ejecutar operaciones administrativas de servidor evitando bloqueos por RLS.
- `client.ts`: Instancia el cliente público con `NEXT_PUBLIC_SUPABASE_ANON_KEY` para operaciones estándar en entornos seguros.

#### `lib/storage/store.ts`
Es el repositorio de datos centralizado del backend. Agrupa más de 25 métodos asíncronos que interactúan con Supabase:
- **Usuarios y Roles**: `getRoles`, `getUsers`, `getUserById`, `getUserByEmail`, `createUser`, `updateUser`, `deleteUser`, `updateLastLogin`.
- **Auditoría**: `createAuditLog`, `getAuditLogs` (soporta filtros por usuario, acción, tabla y rango de fechas).
- **Clientes**: `getClients`, `searchClients` (con coincidencias parciales por nombre, RUC y correo), `getClientById`, `createClient`, `updateClient`, `deleteClient`.
- **Productos**: `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct`.
- **Licitaciones**:
  - `getTenders`: Trae todas las licitaciones con joins a cliente, ítems, productos y pagos.
  - `getTenderById`: Trae el detalle completo incluyendo el historial de transiciones.
  - `createTender`: Inserta la licitación con su presupuesto y plazos.
  - `updateTenderProposal`: Asocia la URL, nombre y tamaño del archivo PDF subido.
  - `addItemToTender`: Agrega un producto calculando validaciones y omitiendo deliberadamente la columna generada `subtotal` para cumplir con las restricciones de PostgreSQL.
  - `removeItemFromTender`: Retira un producto recalculando el total en base de datos.
  - `transitionTenderStatus`: Valida que el cambio de estado esté permitido por la matriz `VALID_TRANSITIONS` y registra la transición en `tender_transitions`.
  - `registerPayment`: Registra un abono, valida que no supere el saldo pendiente y si el saldo llega a 0, transiciona la licitación a `cobrada`.
  - `logTransition`: Inserta en el log histórico de estados.

#### `lib/auth/jwt.ts`
- `generateAccessToken`: Crea un JWT firmado con validez de 1 hora conteniendo `userId`, `email`, `role` y `fullName`.
- `generateRefreshToken`: Crea un token de refresco con validez de 7 días.
- `verifyAccessToken` y `verifyRefreshToken`: Validan la firma criptográfica y descodifican el payload.

#### `lib/auth/password.ts`
- `hashPassword`: Genera un hash seguro utilizando `bcryptjs` con 10 rondas de salt.
- `verifyPassword`: Compara una contraseña en texto plano contra el hash almacenado.

#### `lib/auth/rate-limiter.ts`
Implementa un mecanismo de limitación de tasa en memoria por dirección IP:
- Límite global: Máximo 100 peticiones por minuto.
- Límite de login: Máximo 5 intentos fallidos por ventana de 15 minutos para prevenir ataques de fuerza bruta.

#### `lib/auth/middleware.ts`
- Función `requireAuth(req, allowedRoles)`:
  - Obtiene la IP del cliente y valida el rate limit.
  - Extrae el token JWT desde la cookie `mt_access_token` o el encabezado `Authorization`.
  - Si el token es inválido o no existe, retorna `401 Unauthorized`.
  - Si se especifican roles permitidos (RBAC) y el usuario no posee el rol requerido, retorna `403 Forbidden`.

#### `lib/audit/audit-logger.ts`
- Función `logAudit(params)`: Recibe la acción realizada, el usuario, la dirección IP, los valores anteriores y los valores nuevos. Guarda el registro en la tabla `audit_logs` y emite una traza formateada en la consola del servidor.

#### `lib/email/resend.ts` y `lib/email/templates.ts`
- `templates.ts`: Genera código HTML responsivo, moderno y profesional para dos eventos:
  1. Envío de propuesta formal al cliente (resumen de ítems, precio total, presupuesto y botón de contacto).
  2. Alerta de vencimiento urgente (< 48 horas restantes).
- `resend.ts`:
  - Se conecta a la API de Resend.
  - Si existe una URL de propuesta técnica, descarga el archivo en un `Buffer` en memoria y lo adjunta físicamente al correo electrónico.
  - Si no hay credenciales activas en desarrollo local, entra en modo **Simulación Segura**, registrando la operación en consola sin interrumpir el flujo del sistema.

---

### 5.3. Endpoints Backend (`app/api/`)

#### Autenticación y Perfil
* `POST /api/auth/login`: Recibe `email` y `password`. Valida intentos por IP, verifica el hash de contraseña, genera los tokens JWT, configura cookies `HttpOnly` seguras de sesión y registra el evento de inicio de sesión exitoso o fallido en auditoría.
* `POST /api/auth/logout`: Elimina las cookies de sesión y audita el cierre de sesión.
* `GET /api/auth/me`: Verifica la identidad del usuario actual a través de la cookie y retorna su perfil y rol.

#### Licitaciones y Operaciones Comerciales
* `GET /api/tenders`: Retorna todas las licitaciones registradas con sus relaciones.
* `POST /api/tenders`: Crea una nueva licitación. Si el payload incluye una lista de `items`, los inserta de manera atómica junto con la licitación.
* `GET /api/tenders/[id]`: Obtiene el detalle profundo de una licitación en particular.
* `POST /api/tenders/[id]/upload`: Recibe un archivo `FormData` (normalmente un PDF formal), lo valida y lo sube al bucket `proposals` de Supabase Storage, actualizando la URL en la licitación.
* `POST /api/tenders/[id]/send`: Verifica que la licitación cuente con archivo adjunto y productos. Despacha el correo formal al cliente con el PDF adjunto mediante Resend y transiciona el estado de `borrador` a `activa`.
* `POST /api/tenders/[id]/status`: Procesa transiciones manuales de estado (`finalizada`, `perdida`, `por_cobrar`), validando permisos y registrando la auditoría con notas.
* `POST /api/tenders/[id]/items`: Añade un producto a la licitación verificando que no se supere el presupuesto máximo.
* `DELETE /api/tenders/[id]/items`: Elimina un producto asignado.
* `GET /api/tenders/[id]/payments` y `POST /api/tenders/[id]/payments`: Permite consultar y registrar abonos a licitaciones en estado `por_cobrar`. Valida que el monto no supere el saldo pendiente y si el saldo llega a cero, transiciona automáticamente a `cobrada`.

#### Clientes y Productos
* `GET` / `POST /api/clients`: Listado general y registro de clientes.
* `PUT` / `DELETE /api/clients/[id]`: Modificación y eliminación de clientes (eliminación reservada para administradores).
* `GET /api/clients/search`: Búsqueda instantánea para componentes de selección rápida.
* `GET` / `POST /api/products`: Listado y creación de ítems en el catálogo de productos.
* `PUT` / `DELETE /api/products/[id]`: Modificación y desactivación de productos.

#### Administración, Auditoría y Automatización
* `GET /api/audit`: Consulta de trazas de auditoría con filtros.
* `GET /api/transitions`: Histórico general de cambios de estado.
* `GET` / `POST /api/users` y `/api/users/[id]`: Gestión de cuentas de usuario del sistema (solo administradores).
* `GET` / `POST /api/cron/check-deadlines`:
  - Compara `fecha_limite` contra la fecha actual (`NOW()`).
  - Licitaciones activas cuya fecha límite ya pasó: Se transicionan a `perdida` automáticamente.
  - Licitaciones activas con menos de 48 horas restantes y `reminder_sent = false`: Se les despacha un correo de recordatorio urgente y se actualiza `reminder_sent = true`.
  - Puede ejecutarse automáticamente vía Vercel Cron o manualmente mediante un parámetro de prueba en el dashboard.

---

### 5.4. Componentes de Interfaz de Usuario (`components/`)

#### Seguridad y Diseño Estructural
* `auth-context.tsx`: Gestiona el estado de autenticación en el cliente React. Provee funciones `login`, `logout` y un wrapper `authFetch` que inyecta encabezados de autorización y detecta respuestas `401` para redirigir al login.
* `app-shell.tsx`: Envoltura principal de la aplicación. Maneja el diseño responsivo, adaptando la barra lateral para dispositivos móviles y escritorio.
* `navbar.tsx`: Barra de navegación superior. Muestra el nombre de usuario, una insignia distintiva con su rol (`admin`, `gestor`, `visualizador`), selector de tema y botón de cierre de sesión.
* `sidebar.tsx`: Menú lateral izquierdo. Contiene enlaces a Dashboard, Licitaciones, Clientes, Productos, Auditoría y Gestión de Usuarios. Oculta dinámicamente los módulos administrativos a usuarios sin permisos.

#### Visualización y Control de Licitaciones
* `status-badge.tsx`: Insignia gráfica reutilizable con colores semánticos:
  - Borrador: Gris
  - Activa: Azul
  - Finalizada: Púrpura
  - Por Cobrar: Ámbar / Naranja
  - Cobrada: Verde Esmeralda
  - Perdida: Rojo
* `status-stepper.tsx`: Componente visual interactivo que muestra el avance en el ciclo de vida de la licitación y los posibles caminos de transición.
* `tender-budget-bar.tsx`: Indicador visual dinámico del presupuesto:
  - Verde: Consumo menor al 80%.
  - Amarillo: Consumo entre 80% y 100%.
  - Rojo: Consumo superior al 100% (alerta de bloqueo de cotización).
* `file-uploader.tsx`: Componente para subir documentos PDF técnicos arrastrando y soltando o seleccionando desde el explorador de archivos.
* `payment-modal.tsx`: Modal interactivo que calcula el saldo pendiente en tiempo real y permite ingresar el monto a abonar, la fecha y el número de comprobante.
* `transition-history.tsx`: Línea de tiempo visual que muestra cronológicamente cada cambio de estado, quién lo ejecutó, la fecha exacta y las observaciones ingresadas.

#### Componentes de Negocio y Métricas
* `kpi-card.tsx`: Muestra valores consolidados (total licitaciones, montos cotizados, tasa de éxito) con iconografía y porcentajes.
* `tender-distribution-chart.tsx`: Gráfico de barras que ilustra la cantidad de licitaciones existentes en cada una de las fases comerciales.
* `urgent-tenders-banner.tsx`: Banner de alerta de alta prioridad que aparece automáticamente en el panel principal cuando una o más licitaciones activas están a menos de 48 horas de expirar.
* `client-search-combobox.tsx`: Componente de búsqueda y selección de clientes con autocompletado en tiempo real.

---

### 5.5. Vistas y Páginas de la Aplicación (`app/`)

* `app/page.tsx` (Dashboard General): Centro de mando que reúne los KPIs del negocio, el gráfico de distribución, el banner de urgencias, la lista de licitaciones recientes y el botón de prueba para el Cron Job.
* `app/login/page.tsx`: Pantalla de inicio de sesión con validación de credenciales, protección contra fuerza bruta y diseño empresarial limpio.
* `app/licitaciones/page.tsx`: Directorio de todas las licitaciones con buscador por texto, filtro por estado comercial y ordenamiento por fecha límite.
* `app/licitaciones/nueva/page.tsx` (Asistente en 3 Pasos):
  - **Paso 1 (Datos & Cliente)**: Título, código, cliente convocante, presupuesto máximo y fecha límite.
  - **Paso 2 (Productos & Cotización)**: Selección de productos del catálogo, especificación de cantidades y cálculo dinámico con control de presupuesto en tiempo real.
  - **Paso 3 (Propuesta & Cierre)**: Carga del PDF formal y confirmación de guardado en borrador o activación inmediata con envío de correo.
* `app/licitaciones/[id]/page.tsx` (Detalle Integral): Vista 360° que reúne los datos generales, el stepper de estado, pestañas de ítems cotizados, visualizador/descargador de la propuesta técnica, panel de pagos y cobranzas, y registro histórico de transiciones.
* `app/clientes/page.tsx`: Módulo CRUD para dar de alta, editar y listar clientes con información de contacto y fiscal.
* `app/productos/page.tsx`: Módulo de mantenimiento del catálogo maestro de precios y unidades de medida.
* `app/admin/users/page.tsx`: Panel exclusivo de administradores para gestionar operadores del sistema y definir sus niveles de autorización.
* `app/admin/audit/page.tsx` y `app/auditoria/page.tsx`: Registro inmutable donde se visualizan todas las operaciones críticas realizadas en el sistema, con capacidad de inspeccionar cambios en formato JSON.

---

## 6. MATRIZ DE SEGURIDAD Y PERMISOS (RBAC)

El sistema aplica un modelo de control de acceso basado en roles con 3 niveles:

| Módulo / Acción | Administrador (`admin`) | Gestor (`gestor`) | Visualizador (`visualizador`) |
|---|:---:|:---:|:---:|
| Ver Dashboard y Métricas | Permitido | Permitido | Permitido |
| Ver Licitaciones, Clientes y Productos | Permitido | Permitido | Permitido |
| Crear y Editar Licitaciones | Permitido | Permitido | Bloqueado |
| Enviar y Activar Licitaciones | Permitido | Permitido | Bloqueado |
| Cambiar Estados (Finalizar/Perder) | Permitido | Permitido | Bloqueado |
| Registrar Pagos y Cobranzas | Permitido | Permitido | Bloqueado |
| Crear y Modificar Clientes y Productos | Permitido | Permitido | Bloqueado |
| Eliminar Clientes o Productos | Permitido | Bloqueado | Bloqueado |
| Gestionar Cuentas de Usuario | Permitido | Bloqueado | Bloqueado |
| Consultar Auditoría Global del Sistema | Permitido | Bloqueado | Bloqueado |

---

## 7. VARIABLES DE ENTORNO Y GUÍA DE CONFIGURACIÓN

Para ejecutar la aplicación localmente o en un entorno de nube, se requieren las siguientes variables en el archivo `.env.local`:

```env
# Conexión con Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-privada

# Servicio de Correo Electrónico (Resend)
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=Licitaciones MT <onboarding@resend.dev>

# Tareas Programadas (Vercel Cron)
CRON_SECRET=clave_secreta_para_proteger_endpoint_cron

# Seguridad de Sesión
JWT_SECRET=clave_super_secreta_para_firmar_jwt_de_sesion

# URL Base de la Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Instrucciones de Instalación:
1. Clonar el repositorio y acceder a la carpeta del proyecto:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd sistema-licitaciones
   ```
2. Instalar las dependencias de Node.js:
   ```bash
   npm install
   ```
3. Ejecutar el esquema y datos de prueba en la consola SQL de Supabase:
   - Copiar y ejecutar el contenido de `supabase/schema.sql`.
   - Opcionalmente, ejecutar `supabase/seed.sql` para poblar datos iniciales de prueba.
4. Crear un bucket público llamado `proposals` en el panel de Supabase Storage.
5. Iniciar el entorno de desarrollo:
   ```bash
   npm run dev
   ```
6. Ingresar desde el navegador a `http://localhost:3000`.

---
*Documento técnico de arquitectura y especificación de software elaborado para el Sistema de Gestión de Licitaciones Comerciales (MT).*
