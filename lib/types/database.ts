export type TenderStatus = 'borrador' | 'activa' | 'finalizada' | 'por_cobrar' | 'cobrada' | 'perdida';
export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  tax_id: string; // RUC / NIT
  email: string;
  phone?: string | null;
  address?: string | null;
  contact_name?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  unit_price: number;
  unit_measure: string;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenderItem {
  id: string;
  tender_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product?: Product;
}

export interface Payment {
  id: string;
  tender_id: string;
  amount: number;
  payment_date: string;
  reference?: string | null;
  registered_by?: string | null;
  created_at: string;
}

export interface TenderTransition {
  id: string;
  tender_id: string;
  previous_status: TenderStatus | 'none';
  new_status: TenderStatus;
  user_id?: string | null;
  user_name: string;
  notes?: string | null;
  created_at: string;
}

export interface Tender {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  client_id: string;
  status: TenderStatus;
  presupuesto_maximo: number;
  total_estimado: number;
  fecha_limite: string;
  proposal_file_url?: string | null;
  proposal_file_name?: string | null;
  proposal_file_size?: number | null;
  reminder_sent: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Joins / Populated fields
  client?: Client;
  items?: TenderItem[];
  payments?: Payment[];
  transitions?: TenderTransition[];
}
