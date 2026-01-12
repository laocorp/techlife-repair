export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    status: 'active' | 'suspended' | 'trial'
                    plan_id: string | null
                    payment_due_date: string | null
                    settings: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    status?: 'active' | 'suspended' | 'trial'
                    plan_id?: string | null
                    payment_due_date?: string | null
                    settings?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    status?: 'active' | 'suspended' | 'trial'
                    plan_id?: string | null
                    payment_due_date?: string | null
                    settings?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            plans: {
                Row: {
                    id: string
                    name: string
                    price_monthly: number
                    price_yearly: number
                    max_users: number
                    max_clients: number
                    features: Json | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    price_monthly: number
                    price_yearly: number
                    max_users?: number
                    max_clients?: number
                    features?: Json | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    price_monthly?: number
                    price_yearly?: number
                    max_users?: number
                    max_clients?: number
                    features?: Json | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    tenant_id: string
                    auth_user_id: string
                    role: 'admin' | 'technician' | 'client'
                    full_name: string
                    email: string
                    phone: string | null
                    avatar_url: string | null
                    is_active: boolean
                    invited_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    auth_user_id: string
                    role?: 'admin' | 'technician' | 'client'
                    full_name: string
                    email: string
                    phone?: string | null
                    avatar_url?: string | null
                    is_active?: boolean
                    invited_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    auth_user_id?: string
                    role?: 'admin' | 'technician' | 'client'
                    full_name?: string
                    email?: string
                    phone?: string | null
                    avatar_url?: string | null
                    is_active?: boolean
                    invited_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    tenant_id: string
                    company_name: string
                    tax_id: string | null
                    email: string | null
                    phone: string | null
                    address: string | null
                    contacts: Json | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    company_name: string
                    tax_id?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    contacts?: Json | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    company_name?: string
                    tax_id?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    contacts?: Json | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            work_orders: {
                Row: {
                    id: string
                    tenant_id: string
                    client_id: string
                    assigned_to: string | null
                    status: 'open' | 'in_progress' | 'completed' | 'cancelled'
                    priority: 'low' | 'medium' | 'high' | 'urgent'
                    title: string
                    description: string | null
                    scheduled_date: string | null
                    completed_date: string | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    client_id: string
                    assigned_to?: string | null
                    status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    title: string
                    description?: string | null
                    scheduled_date?: string | null
                    completed_date?: string | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    client_id?: string
                    assigned_to?: string | null
                    status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    title?: string
                    description?: string | null
                    scheduled_date?: string | null
                    completed_date?: string | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            technical_reports: {
                Row: {
                    id: string
                    tenant_id: string
                    work_order_id: string
                    technician_id: string
                    diagnosis: string
                    work_performed: string
                    recommendations: string | null
                    signature_client: string | null
                    signature_tech: string | null
                    created_at: string
                    exported_at: string | null
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    work_order_id: string
                    technician_id: string
                    diagnosis: string
                    work_performed: string
                    recommendations?: string | null
                    signature_client?: string | null
                    signature_tech?: string | null
                    created_at?: string
                    exported_at?: string | null
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    work_order_id?: string
                    technician_id?: string
                    diagnosis?: string
                    work_performed?: string
                    recommendations?: string | null
                    signature_client?: string | null
                    signature_tech?: string | null
                    created_at?: string
                    exported_at?: string | null
                }
            }
            product_categories: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    parent_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    parent_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    parent_id?: string | null
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    tenant_id: string
                    category_id: string | null
                    sku: string
                    name: string
                    description: string | null
                    unit_price: number
                    current_stock: number
                    min_stock: number
                    track_serials: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    category_id?: string | null
                    sku: string
                    name: string
                    description?: string | null
                    unit_price?: number
                    current_stock?: number
                    min_stock?: number
                    track_serials?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    category_id?: string | null
                    sku?: string
                    name?: string
                    description?: string | null
                    unit_price?: number
                    current_stock?: number
                    min_stock?: number
                    track_serials?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            product_serials: {
                Row: {
                    id: string
                    tenant_id: string
                    product_id: string
                    serial_number: string
                    status: 'available' | 'assigned' | 'sold' | 'defective'
                    assigned_to_order: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    product_id: string
                    serial_number: string
                    status?: 'available' | 'assigned' | 'sold' | 'defective'
                    assigned_to_order?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    product_id?: string
                    serial_number?: string
                    status?: 'available' | 'assigned' | 'sold' | 'defective'
                    assigned_to_order?: string | null
                    created_at?: string
                }
            }
            inventory_movements: {
                Row: {
                    id: string
                    tenant_id: string
                    product_id: string
                    serial_id: string | null
                    movement_type: 'in' | 'out' | 'adjustment'
                    quantity: number
                    reference_type: string | null
                    reference_id: string | null
                    notes: string | null
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    product_id: string
                    serial_id?: string | null
                    movement_type: 'in' | 'out' | 'adjustment'
                    quantity: number
                    reference_type?: string | null
                    reference_id?: string | null
                    notes?: string | null
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    product_id?: string
                    serial_id?: string | null
                    movement_type?: 'in' | 'out' | 'adjustment'
                    quantity?: number
                    reference_type?: string | null
                    reference_id?: string | null
                    notes?: string | null
                    created_by?: string
                    created_at?: string
                }
            }
            invoices: {
                Row: {
                    id: string
                    tenant_id: string
                    client_id: string
                    work_order_id: string | null
                    invoice_number: string
                    issue_date: string
                    due_date: string
                    subtotal: number
                    tax: number
                    total: number
                    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    client_id: string
                    work_order_id?: string | null
                    invoice_number: string
                    issue_date?: string
                    due_date: string
                    subtotal: number
                    tax?: number
                    total: number
                    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    client_id?: string
                    work_order_id?: string | null
                    invoice_number?: string
                    issue_date?: string
                    due_date?: string
                    subtotal?: number
                    tax?: number
                    total?: number
                    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            invoice_lines: {
                Row: {
                    id: string
                    invoice_id: string
                    description: string
                    quantity: number
                    unit_price: number
                    total: number
                    product_id: string | null
                }
                Insert: {
                    id?: string
                    invoice_id: string
                    description: string
                    quantity: number
                    unit_price: number
                    total: number
                    product_id?: string | null
                }
                Update: {
                    id?: string
                    invoice_id?: string
                    description?: string
                    quantity?: number
                    unit_price?: number
                    total?: number
                    product_id?: string | null
                }
            }
            payments: {
                Row: {
                    id: string
                    tenant_id: string
                    invoice_id: string
                    amount: number
                    payment_date: string
                    payment_method: string
                    reference: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    invoice_id: string
                    amount: number
                    payment_date?: string
                    payment_method: string
                    reference?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    invoice_id?: string
                    amount?: number
                    payment_date?: string
                    payment_method?: string
                    reference?: string | null
                    created_at?: string
                }
            }
            accounting_entries: {
                Row: {
                    id: string
                    tenant_id: string
                    entry_date: string
                    type: 'income' | 'expense'
                    category: string
                    amount: number
                    description: string | null
                    reference_type: string | null
                    reference_id: string | null
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    entry_date?: string
                    type: 'income' | 'expense'
                    category: string
                    amount: number
                    description?: string | null
                    reference_type?: string | null
                    reference_id?: string | null
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    entry_date?: string
                    type?: 'income' | 'expense'
                    category?: string
                    amount?: number
                    description?: string | null
                    reference_type?: string | null
                    reference_id?: string | null
                    created_by?: string
                    created_at?: string
                }
            }
            saas_payments: {
                Row: {
                    id: string
                    tenant_id: string
                    amount: number
                    payment_date: string
                    period_start: string
                    period_end: string
                    status: 'pending' | 'completed' | 'failed'
                    payment_method: string
                    external_reference: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    amount: number
                    payment_date?: string
                    period_start: string
                    period_end: string
                    status?: 'pending' | 'completed' | 'failed'
                    payment_method: string
                    external_reference?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    amount?: number
                    payment_date?: string
                    period_start?: string
                    period_end?: string
                    status?: 'pending' | 'completed' | 'failed'
                    payment_method?: string
                    external_reference?: string | null
                    created_at?: string
                }
            }
            super_admins: {
                Row: {
                    id: string
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Commonly used types
export type Tenant = Tables<'tenants'>
export type Plan = Tables<'plans'>
export type User = Tables<'users'>
export type Client = Tables<'clients'>
export type WorkOrder = Tables<'work_orders'>
export type TechnicalReport = Tables<'technical_reports'>
export type Product = Tables<'products'>
export type ProductCategory = Tables<'product_categories'>
export type ProductSerial = Tables<'product_serials'>
export type InventoryMovement = Tables<'inventory_movements'>
export type Invoice = Tables<'invoices'>
export type InvoiceLine = Tables<'invoice_lines'>
export type Payment = Tables<'payments'>
export type AccountingEntry = Tables<'accounting_entries'>
export type SaasPayment = Tables<'saas_payments'>
