import { createAdminSupabaseClient } from '@/lib/supabase/admin';
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

export const VALID_TRANSITIONS: Record<string, TenderStatus[]> = {
  borrador: ['activa'],
  activa: ['finalizada', 'perdida'],
  finalizada: ['por_cobrar'],
  por_cobrar: ['cobrada'],
  cobrada: [],
  perdida: [],
};

const getSupabase = () => createAdminSupabaseClient();

export const dataStore = {
  // ==========================================
  // ROLES
  // ==========================================
  async getRoles(): Promise<Role[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) throw new Error(`Error obteniendo roles: ${error.message}`);
    return data || [];
  },

  // ==========================================
  // USUARIOS (RBAC)
  // ==========================================
  async getUsers(): Promise<User[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(id, name, description)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo usuarios: ${error.message}`);

    return (data || []).map((u: any) => ({
      ...u,
      role: u.roles?.name || u.role || 'visualizador',
    }));
  },

  async getUserById(id: string): Promise<User | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(id, name, description)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      role: data.roles?.name || data.role || 'visualizador',
    };
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const supabase = getSupabase();
    const normalized = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(id, name, description)')
      .ilike('email', normalized)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      role: data.roles?.name || data.role || 'visualizador',
    };
  },

  async createUser(userData: {
    email: string;
    password_hash: string;
    role: RoleType;
    full_name: string;
  }): Promise<User> {
    const supabase = getSupabase();
    const normalized = userData.email.trim().toLowerCase();

    // Buscar el rol correspondiente
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', userData.role)
      .single();

    if (roleError || !roleData) {
      throw new Error(`Rol "${userData.role}" no encontrado en base de datos`);
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: normalized,
        password_hash: userData.password_hash,
        role_id: roleData.id,
        full_name: userData.full_name,
        is_active: true,
      })
      .select('*, roles(name)')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('El correo electrónico ya se encuentra registrado');
      }
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    return {
      ...data,
      role: data.roles?.name || userData.role,
    };
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
    const supabase = getSupabase();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (userData.full_name !== undefined) updates.full_name = userData.full_name;
    if (userData.password_hash !== undefined) updates.password_hash = userData.password_hash;
    if (userData.is_active !== undefined) updates.is_active = userData.is_active;

    if (userData.role) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', userData.role)
        .single();
      if (roleData) {
        updates.role_id = roleData.id;
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('*, roles(name)')
      .single();

    if (error || !data) {
      throw new Error(`Error actualizando usuario: ${error?.message || 'No encontrado'}`);
    }

    return {
      ...data,
      role: data.roles?.name || data.role,
    };
  },

  async deleteUser(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando usuario: ${error.message}`);
    return true;
  },

  async updateLastLogin(id: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async createAuditLog(log: AuditLog): Promise<AuditLog> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: log.user_id || null,
        user_email: log.user_email || null,
        action: log.action,
        table_name: log.table_name || null,
        record_id: log.record_id || null,
        old_values: log.old_values || null,
        new_values: log.new_values || null,
        ip_address: log.ip_address || '127.0.0.1',
      })
      .select()
      .single();

    if (error) {
      console.error('[AUDIT_ERROR] Error insertando log en Supabase:', error.message);
      return log;
    }

    return data;
  },

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const supabase = getSupabase();
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters?.userId) {
      query = query.or(`user_id.eq.${filters.userId},user_email.ilike.%${filters.userId}%`);
    }
    if (filters?.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }
    if (filters?.startDate) {
      query = query.gte('timestamp', new Date(filters.startDate).toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('timestamp', new Date(filters.endDate).toISOString());
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error obteniendo logs de auditoría: ${error.message}`);
    return data || [];
  },

  // ==========================================
  // CLIENTES
  // ==========================================
  async getClients(): Promise<Client[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Error obteniendo clientes: ${error.message}`);
    return data || [];
  },

  async searchClients(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Client[]; total: number; page: number; totalPages: number }> {
    const supabase = getSupabase();
    const cleanQuery = (query || '').trim();
    const safeLimit = Math.min(50, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    let countQuery = supabase.from('clients').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('clients').select('*').order('name');

    if (cleanQuery) {
      const filter = `name.ilike.%${cleanQuery}%,tax_id.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`;
      countQuery = countQuery.or(filter);
      dataQuery = dataQuery.or(filter);
    }

    const [{ count, error: countErr }, { data, error: dataErr }] = await Promise.all([
      countQuery,
      dataQuery.range(offset, offset + safeLimit - 1),
    ]);

    if (countErr || dataErr) {
      throw new Error(`Error buscando clientes: ${countErr?.message || dataErr?.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      data: data || [],
      total,
      page: safePage,
      totalPages,
    };
  },

  async getClientById(id: string): Promise<Client | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data;
  },

  async createClient(clientData: Partial<Client>): Promise<Client> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: clientData.name,
        tax_id: clientData.tax_id,
        email: clientData.email,
        phone: clientData.phone || null,
        address: clientData.address || null,
        contact_name: clientData.contact_name || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Error registrando cliente: ${error.message}`);
    return data;
  },

  async updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...(clientData.name ? { name: clientData.name } : {}),
        ...(clientData.tax_id ? { tax_id: clientData.tax_id } : {}),
        ...(clientData.email ? { email: clientData.email } : {}),
        ...(clientData.phone !== undefined ? { phone: clientData.phone } : {}),
        ...(clientData.address !== undefined ? { address: clientData.address } : {}),
        ...(clientData.contact_name !== undefined ? { contact_name: clientData.contact_name } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(`Error actualizando cliente: ${error?.message || 'No encontrado'}`);
    return data;
  },

  async deleteClient(id: string): Promise<boolean> {
    const supabase = getSupabase();
    // Verificar si tiene licitaciones
    const { count } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id);

    if (count && count > 0) {
      throw new Error('No se puede eliminar un cliente con licitaciones asociadas');
    }

    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando cliente: ${error.message}`);
    return true;
  },

  // ==========================================
  // PRODUCTOS
  // ==========================================
  async getProducts(): Promise<Product[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('code', { ascending: true });

    if (error) throw new Error(`Error obteniendo catálogo de productos: ${error.message}`);
    return data || [];
  },

  async getProductById(id: string): Promise<Product | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data;
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .insert({
        code: productData.code || `PRD-${Date.now().toString().slice(-4)}`,
        name: productData.name,
        description: productData.description || null,
        unit_price: Number(productData.unit_price) || 0,
        unit_measure: productData.unit_measure || 'UNIDAD',
        is_active: productData.is_active !== undefined ? productData.is_active : true,
      })
      .select()
      .single();

    if (error) throw new Error(`Error creando producto: ${error.message}`);
    return data;
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const supabase = getSupabase();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (productData.code) updates.code = productData.code;
    if (productData.name) updates.name = productData.name;
    if (productData.description !== undefined) updates.description = productData.description;
    if (productData.unit_price !== undefined) updates.unit_price = Number(productData.unit_price);
    if (productData.unit_measure) updates.unit_measure = productData.unit_measure;
    if (productData.is_active !== undefined) updates.is_active = productData.is_active;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(`Error actualizando producto: ${error?.message || 'No encontrado'}`);
    return data;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { count } = await supabase
      .from('tender_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    if (count && count > 0) {
      throw new Error('No se puede eliminar un producto utilizado en licitaciones existentes');
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando producto: ${error.message}`);
    return true;
  },

  // ==========================================
  // LICITACIONES
  // ==========================================
  async getTenders(): Promise<Tender[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tenders')
      .select(`
        *,
        client:clients(*),
        items:tender_items(*, product:products(*)),
        payments(*),
        transitions:tender_transitions(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo licitaciones: ${error.message}`);
    return data || [];
  },

  async getTenderById(id: string): Promise<Tender | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tenders')
      .select(`
        *,
        client:clients(*),
        items:tender_items(*, product:products(*)),
        payments(*),
        transitions:tender_transitions(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },

  populateTender(tender: Tender): Tender {
    return tender;
  },

  async createTender(tenderData: {
    title: string;
    description?: string;
    client_id: string;
    presupuesto_maximo: number;
    fecha_limite: string;
    code?: string;
  }): Promise<Tender> {
    const supabase = getSupabase();

    // Generar código si no viene
    let generatedCode = tenderData.code;
    if (!generatedCode) {
      const { count } = await supabase.from('tenders').select('*', { count: 'exact', head: true });
      const nextNumber = (count || 0) + 1;
      generatedCode = `LIC-2026-${String(nextNumber).padStart(3, '0')}`;
    }

    const { data: newTender, error } = await supabase
      .from('tenders')
      .insert({
        code: generatedCode,
        title: tenderData.title,
        description: tenderData.description || '',
        client_id: tenderData.client_id,
        status: 'borrador',
        presupuesto_maximo: Number(tenderData.presupuesto_maximo),
        total_estimado: 0.0,
        fecha_limite: new Date(tenderData.fecha_limite).toISOString(),
        reminder_sent: false,
      })
      .select()
      .single();

    if (error || !newTender) {
      throw new Error(`Error creando licitación: ${error?.message || 'Desconocido'}`);
    }

    // Registrar transición inicial
    await this.logTransition(
      newTender.id,
      'none',
      'borrador',
      'Admin / Gestor',
      'Creación inicial de la licitación en estado borrador.'
    );

    return (await this.getTenderById(newTender.id)) || newTender;
  },

  async updateTenderProposal(
    id: string,
    fileData: { url: string; name: string; size: number }
  ): Promise<Tender> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('tenders')
      .update({
        proposal_file_url: fileData.url,
        proposal_file_name: fileData.name,
        proposal_file_size: fileData.size,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(`Error actualizando propuesta: ${error.message}`);
    const tender = await this.getTenderById(id);
    if (!tender) throw new Error('Licitación no encontrada');
    return tender;
  },

  // ==========================================
  // PRODUCTOS EN LICITACIÓN
  // ==========================================
  async addItemToTender(
    tenderId: string,
    productId: string,
    quantity: number
  ): Promise<{ item: TenderItem; tender: Tender }> {
    const supabase = getSupabase();
    const tender = await this.getTenderById(tenderId);
    if (!tender) throw new Error('Licitación no encontrada');

    if (['finalizada', 'por_cobrar', 'cobrada', 'perdida'].includes(tender.status)) {
      throw new Error(`No se permite modificar productos en licitaciones con estado "${tender.status}"`);
    }

    const product = await this.getProductById(productId);
    if (!product) throw new Error('Producto no encontrado');

    const itemSubtotal = quantity * Number(product.unit_price);
    const currentItems = tender.items || [];
    const currentTotal = currentItems.reduce((sum, i) => sum + Number(i.subtotal), 0);
    const projectedTotal = currentTotal + itemSubtotal;

    if (projectedTotal > Number(tender.presupuesto_maximo)) {
      throw new Error(
        `El monto total proyectado ($${projectedTotal.toFixed(2)}) supera el presupuesto máximo permitido ($${Number(tender.presupuesto_maximo).toFixed(2)})`
      );
    }

    // Insertar o actualizar item
    const existingItem = currentItems.find((i) => i.product_id === productId);
    let insertedItem: any;

    if (existingItem) {
      const newQty = Number(existingItem.quantity) + quantity;
      const newSub = newQty * Number(product.unit_price);
      const { data, error } = await supabase
        .from('tender_items')
        .update({ quantity: newQty, subtotal: newSub })
        .eq('id', existingItem.id)
        .select('*, product:products(*)')
        .single();
      if (error) throw new Error(`Error actualizando ítem: ${error.message}`);
      insertedItem = data;
    } else {
      const { data, error } = await supabase
        .from('tender_items')
        .insert({
          tender_id: tenderId,
          product_id: productId,
          quantity,
          unit_price: product.unit_price,
          subtotal: itemSubtotal,
        })
        .select('*, product:products(*)')
        .single();
      if (error) throw new Error(`Error agregando ítem: ${error.message}`);
      insertedItem = data;
    }

    // Recalcular total estimado en la licitación
    const { data: allItems } = await supabase
      .from('tender_items')
      .select('subtotal')
      .eq('tender_id', tenderId);

    const newEstimatedTotal = (allItems || []).reduce((sum, i) => sum + Number(i.subtotal), 0);
    await supabase
      .from('tenders')
      .update({ total_estimado: newEstimatedTotal, updated_at: new Date().toISOString() })
      .eq('id', tenderId);

    const updatedTender = await this.getTenderById(tenderId);
    return { item: insertedItem, tender: updatedTender! };
  },

  async removeItemFromTender(tenderId: string, itemId: string): Promise<Tender> {
    const supabase = getSupabase();
    const tender = await this.getTenderById(tenderId);
    if (!tender) throw new Error('Licitación no encontrada');

    if (['finalizada', 'por_cobrar', 'cobrada', 'perdida'].includes(tender.status)) {
      throw new Error(`No se permite modificar productos en licitaciones con estado "${tender.status}"`);
    }

    const { error } = await supabase
      .from('tender_items')
      .delete()
      .eq('id', itemId)
      .eq('tender_id', tenderId);

    if (error) throw new Error(`Error eliminando ítem: ${error.message}`);

    // Recalcular total estimado
    const { data: allItems } = await supabase
      .from('tender_items')
      .select('subtotal')
      .eq('tender_id', tenderId);

    const newEstimatedTotal = (allItems || []).reduce((sum, i) => sum + Number(i.subtotal), 0);
    await supabase
      .from('tenders')
      .update({ total_estimado: newEstimatedTotal, updated_at: new Date().toISOString() })
      .eq('id', tenderId);

    const updatedTender = await this.getTenderById(tenderId);
    return updatedTender!;
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
    const supabase = getSupabase();
    const tender = await this.getTenderById(tenderId);
    if (!tender) throw new Error('Licitación no encontrada');

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

    const { error } = await supabase
      .from('tenders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', tenderId);

    if (error) throw new Error(`Error actualizando estado en Supabase: ${error.message}`);

    await this.logTransition(tenderId, previousStatus, newStatus, userName, notes);

    const updated = await this.getTenderById(tenderId);
    return updated!;
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
    const supabase = getSupabase();
    const tender = await this.getTenderById(tenderId);
    if (!tender) throw new Error('Licitación no encontrada');

    if (tender.status !== 'por_cobrar') {
      throw new Error(
        `Solo se pueden registrar pagos en licitaciones en estado "por_cobrar" (Estado actual: "${tender.status}")`
      );
    }

    if (amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    const previousPaymentsSum = (tender.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = Number(tender.total_estimado) - previousPaymentsSum;

    if (amount > pendingBalance + 0.01) {
      throw new Error(
        `El monto ($${amount.toFixed(2)}) supera el saldo pendiente de cobro ($${pendingBalance.toFixed(2)})`
      );
    }

    const { data: newPayment, error: payError } = await supabase
      .from('payments')
      .insert({
        tender_id: tenderId,
        amount,
        payment_date: new Date().toISOString().split('T')[0],
        reference: reference || 'Abono / Pago registrado',
      })
      .select()
      .single();

    if (payError || !newPayment) {
      throw new Error(`Error registrando pago en Supabase: ${payError?.message}`);
    }

    const newTotalPaid = previousPaymentsSum + amount;
    const newRemainingBalance = Number(tender.total_estimado) - newTotalPaid;

    let autoCobrada = false;
    if (newRemainingBalance <= 0.01) {
      await supabase
        .from('tenders')
        .update({ status: 'cobrada', updated_at: new Date().toISOString() })
        .eq('id', tenderId);

      autoCobrada = true;

      await this.logTransition(
        tenderId,
        'por_cobrar',
        'cobrada',
        'Sistema Automático de Cobranzas',
        `Saldo liquidado al 100% tras el pago de $${amount.toFixed(2)} (Ref: ${reference || 'N/A'}). Transición automática.`
      );
    }

    const updatedTender = await this.getTenderById(tenderId);

    return {
      payment: newPayment,
      tender: updatedTender!,
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
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tender_transitions')
      .insert({
        tender_id: tenderId,
        previous_status: previousStatus,
        new_status: newStatus,
        user_name: userName,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[TRANSITION_ERROR] Error registrando transición en Supabase:', error.message);
    }

    return data;
  },

  async getAllTransitions(): Promise<TenderTransition[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tender_transitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo transiciones: ${error.message}`);
    return data || [];
  },
};
