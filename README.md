#  Sistema de Gestión de Licitaciones Comerciales (CSC)

Sistema web integral y moderno para la gestión del ciclo de vida de licitaciones comerciales, cotizaciones técnicas, control presupuestario, notificaciones automáticas y cobranza.

Desarrollado con **Next.js 16 (App Router)**, **Supabase (PostgreSQL, RLS y Storage)**, **Resend (Emails transaccionales con adjuntos reales)** y **Vercel Cron Jobs (Automatización de vencimientos y recordatorios)**.

<img width="677" height="455" alt="image" src="https://github.com/user-attachments/assets/88755f9e-51f5-46e4-93bc-fcdcc0302bbc" />

<img width="937" height="451" alt="image" src="https://github.com/user-attachments/assets/33c07459-de11-4cd8-9979-514b45457cec" />

<img width="950" height="453" alt="image" src="https://github.com/user-attachments/assets/1267e7d1-f8d7-4e78-ac7c-c91e693b86ca" />



##  Principios de Interacción Humano-Computadora (HCI) Aplicados

Diseñado especialmente para la facilidad de uso de operadores y ejecutivos comerciales sin experiencia técnica compleja:

1. **Visibilidad del Estado del Sistema & Flujo Guiado**:
   - **Lifecycle Stepper**: Barra de progreso interactiva paso a paso (`Borrador` → `Activa` → `Finalizada` → `Por Cobrar` → `Cobrada` / `Perdida`).
   - **Status Badges**: Indicadores visuales con código cromático claro e iconografía inequívoca.
2. **Prevención Proactiva de Errores**:
   - **Control de Presupuesto en Tiempo Real**: Barra dinámica que calcula y bloquea inmediatamente si los productos superan el `presupuesto_maximo`.
   - **Requisito Obligatorio de Propuesta**: El sistema impide la activación y envío de una licitación si no cuenta con el archivo de propuesta adjunto subido.
   - **Validación de Sobrecobros**: El modal de pagos calcula el saldo pendiente y rechaza pagos superiores a dicho saldo.
3. **Reducción de Carga Cognitiva**:
   - Asistente guiado (Wizard) de 3 pasos para la creación de nuevas licitaciones.
   - Dashboard con KPIs comerciales y banner de alertas prioritarias para licitaciones próximas a vencer (< 48 horas).
4. **Trazabilidad & Auditoría Inmutable**:
   - Registro de transiciones y cambios de estado con usuario, fecha exacta y notas explicativas.

---

##  Arquitectura y Tecnologías

- **Frontend**: Next.js 16 (App Router, Server & Client Components), React 19, Tailwind CSS 4, Lucide Icons.
- **Backend & APIs**: Next.js Route Handlers (`/api/tenders`, `/api/clients`, `/api/products`, `/api/cron`, etc.).
- **Base de Datos & Auth**: Supabase (PostgreSQL 15+, Row Level Security, Triggers automáticos de cálculo).
- **Almacenamiento de Archivos**: Supabase Storage (Bucket `proposals` con soporte para PDFs y documentos de cotización).
- **Emails Transaccionales**: Resend API con plantillas HTML responsivas y envío de documentos adjuntos reales.
- **Tareas Programadas (Cron)**: Vercel Cron Jobs configurados en `vercel.json` para ejecutar `/api/cron/check-deadlines`.

---

##  Máquina de Estados y Reglas de Negocio

```
   [ Borrador ]
        │  (Requiere documento adjunto + dispara email Resend con PDF)
        ▼
    [ Activa ] ─────── (No ganada o Vencida por Cron) ───────► [ Perdida ]
        │
        │  (Ganada y entrega completada)
        ▼
  [ Finalizada ]
        │
        │  (Facturada)
        ▼
  [ Por Cobrar ] ───── (Saldo pendiente llega a $0.00) ──────► [ Cobrada ]
```

### Reglas de Negocio Implementadas:
1. **Presupuesto Máximo**: EL sistema calcula automáticamente la diferencia entre el presupuesto máximo permitido y el valor de ´productos agregados a la licitación.
2. **Envío y Activación**: Requiere documento de propuesta adjunto. Envía correo formal al cliente con resumen y documento adjunto.
3. **Vencimiento Automático (Vercel Cron)**: Si `fecha_limite < NOW()` y sigue en `activa`, transiciona automáticamente a `perdida`.
4. **Recordatorio 48h (Vercel Cron)**: Si faltan menos de 48 horas para la `fecha_limite` y no se ha recordado, envía correo de alerta al cliente.
5. **Gestión de Pagos**: Solo en `por_cobrar`. El pago no puede exceder el `saldo_pendiente`. Al liquidar al 100%, pasa automáticamente a `cobrada`.
6. **Inmutabilidad de Productos**: En estados `finalizada`, `por_cobrar`, `cobrada` o `perdida` no se permite agregar o quitar productos.

---

##  Instalación y Ejecución Local

### 1. Clonar el repositorio e instalar dependencias:
```bash
git clone https://github.com/tu-usuario/sistema-licitaciones.git
cd sistema-licitaciones
npm install
```

### 2. Configurar Variables de Entorno:
Copia el archivo de ejemplo:
```bash
cp .env.example .env.local
```

Configura tus credenciales en `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https: #######
NEXT_PUBLIC_SUPABASE_ANON_KEY=#######
SUPABASE_SERVICE_ROLE_KEY=####

# Resend Email
RESEND_API_KEY=############
RESEND_FROM_EMAIL=#########

# Vercel Cron
CRON_SECRET=##############

# URL de la Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---


### Prueba Manual del Cron Job:
En el Dashboard principal hay un botón interactivo **"Probar Vercel Cron Job"** que ejecuta `/api/cron/check-deadlines?manual=true` y muestra el log en vivo de licitaciones auto-expiradas y recordatorios de 48h enviados.

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` / `POST` | `/api/tenders` | Listado y creación de licitaciones |
| `GET` | `/api/tenders/[id]` | Detalle de licitación con clientes, ítems y pagos |
| `POST` | `/api/tenders/[id]/upload` | Subida de propuesta formal a Supabase Storage |
| `POST` | `/api/tenders/[id]/send` | Envío formal por correo Resend con adjunto + Activación |
| `POST` | `/api/tenders/[id]/status` | Transiciones de estado validadas (`finalizada`, `perdida`, `por_cobrar`) |
| `POST` / `DELETE` | `/api/tenders/[id]/items` | Agregar/quitar productos con control de presupuesto |
| `GET` / `POST` | `/api/tenders/[id]/payments` | Consulta y registro de pagos con liquidación automática a `cobrada` |
| `GET` / `POST` | `/api/cron/check-deadlines` | Endpoint programado para auto-vencimiento y recordatorio 48h |
| `GET` / `POST` | `/api/clients` | Gestión de empresas cliente |
| `GET` / `POST` | `/api/products` | Catálogo maestro de productos y servicios |
| `GET` | `/api/transitions` | Registro global de auditoría |

---


