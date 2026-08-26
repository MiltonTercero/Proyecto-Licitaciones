-- ==============================================================================
-- SISTEMA DE GESTIÓN DE LICITACIONES - ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM PARA ESTADOS DE LA LICITACIÓN
DO $$ BEGIN
    CREATE TYPE tender_status AS ENUM (
        'borrador',
        'activa',
        'finalizada',
        'por_cobrar',
        'cobrada',
        'perdida'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ENUM PARA ROLES DE USUARIOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'user'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE PERFILES DE USUARIO (Extensión de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'user'::user_role NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABLA DE CLIENTES (Empresas)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tax_id TEXT NOT NULL, -- RUC / NIT / CIF
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    contact_name TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TABLA DE PRODUCTOS (Catálogo maestro)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    unit_measure TEXT DEFAULT 'UNIDAD' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. TABLA DE LICITACIONES
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- Ej: LIC-2026-001
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    status tender_status DEFAULT 'borrador'::tender_status NOT NULL,
    presupuesto_maximo NUMERIC(12, 2) NOT NULL CHECK (presupuesto_maximo > 0),
    total_estimado NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (total_estimado >= 0),
    fecha_limite TIMESTAMPTZ NOT NULL,
    proposal_file_url TEXT,
    proposal_file_name TEXT,
    proposal_file_size INTEGER,
    reminder_sent BOOLEAN DEFAULT false NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_total_presupuesto CHECK (total_estimado <= presupuesto_maximo)
);

-- 7. TABLA DE PRODUCTOS EN LICITACIÓN (Relación N:M)
CREATE TABLE IF NOT EXISTS tender_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (tender_id, product_id)
);

-- 8. TABLA DE PAGOS (Para licitaciones en estado por_cobrar)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    reference TEXT,
    registered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. TABLA DE HISTORIAL DE TRANSICIONES (Auditoría de estados)
CREATE TABLE IF NOT EXISTS tender_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT DEFAULT 'Sistema / Cron' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TRIGGERS PARA RECALCULAR TOTAL ESTIMADO AUTOMÁTICAMENTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_tender_total_estimado()
RETURNS TRIGGER AS $$
DECLARE
    target_tender_id UUID;
    calculated_total NUMERIC(12, 2);
    current_status tender_status;
    max_budget NUMERIC(12, 2);
BEGIN
    target_tender_id := COALESCE(NEW.tender_id, OLD.tender_id);

    -- Verificar que la licitación permita modificación de productos
    SELECT status, presupuesto_maximo INTO current_status, max_budget
    FROM tenders
    WHERE id = target_tender_id;

    IF current_status IN ('finalizada', 'por_cobrar', 'cobrada', 'perdida') THEN
        RAISE EXCEPTION 'No se permite agregar o quitar productos en licitaciones con estado %', current_status;
    END IF;

    -- Calcular el nuevo total
    SELECT COALESCE(SUM(quantity * unit_price), 0.00)
    INTO calculated_total
    FROM tender_items
    WHERE tender_id = target_tender_id;

    IF calculated_total > max_budget THEN
        RAISE EXCEPTION 'El total de los productos ($%) supera el presupuesto máximo permitido ($%)', calculated_total, max_budget;
    END IF;

    UPDATE tenders
    SET total_estimado = calculated_total,
        updated_at = NOW()
    WHERE id = target_tender_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tender_items_recalculate ON tender_items;
CREATE TRIGGER trigger_tender_items_recalculate
AFTER INSERT OR UPDATE OR DELETE ON tender_items
FOR EACH ROW
EXECUTE FUNCTION update_tender_total_estimado();

-- ==============================================================================
-- TRIGGER PARA ACTUALIZAR FECHA UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_tenders_updated_at ON tenders;
CREATE TRIGGER trigger_tenders_updated_at BEFORE UPDATE ON tenders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_transitions ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "Permitir lectura completa a usuarios autenticados" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura de clientes a usuarios autenticados" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura de clientes a usuarios autenticados" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir lectura de productos a usuarios autenticados" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura de productos a usuarios autenticados" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir lectura de licitaciones a usuarios autenticados" ON tenders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura de licitaciones a usuarios autenticados" ON tenders FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir lectura de items a usuarios autenticados" ON tender_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura de items a usuarios autenticados" ON tender_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir lectura de pagos a usuarios autenticados" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir registro de pagos a usuarios autenticados" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir lectura de transiciones a usuarios autenticados" ON tender_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir insercion de transiciones a usuarios autenticados" ON tender_transitions FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKET PARA PROPUESTAS FORMALES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir subida de propuestas a usuarios autenticados"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'proposals');

CREATE POLICY "Permitir lectura pública de propuestas"
ON storage.objects FOR SELECT
USING (bucket_id = 'proposals');
