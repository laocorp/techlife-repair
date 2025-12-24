// Database Types for RepairApp v2

// Enums
export type UserRole = 'superadmin' | 'admin' | 'tecnico' | 'vendedor' | 'cliente'
export type TipoIdentificacion = 'cedula' | 'ruc' | 'pasaporte'
export type TipoProducto = 'producto' | 'servicio'
export type EstadoOrden = 'recibido' | 'en_diagnostico' | 'cotizado' | 'aprobado' | 'rechazado' | 'en_reparacion' | 'terminado' | 'entregado'
export type EstadoPago = 'pendiente' | 'pagado' | 'vencido' | 'parcial'
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'credito'
export type EstadoCaja = 'abierta' | 'cerrada'
export type TipoMovimiento = 'ingreso' | 'egreso'
export type AmbienteSRI = 'pruebas' | 'produccion'
export type EstadoSRI = 'pendiente' | 'enviado' | 'autorizado' | 'rechazado'
export type EstadoExterior = 'bueno' | 'regular' | 'malo'
export type TipoGarantia = 'fabrica' | 'servicio' | 'ninguna'

// Base interfaces
export interface Empresa {
    id: string
    nombre: string
    ruc: string
    direccion?: string
    telefono?: string
    email?: string
    logo_url?: string
    ambiente_sri: AmbienteSRI
    certificado_p12?: Uint8Array
    certificado_password?: string
    punto_emision: string
    establecimiento: string
    plan: string
    suscripcion_activa: boolean
    fecha_vencimiento?: string
    created_at: string
}

export interface Usuario {
    id: string
    empresa_id: string
    nombre: string
    email: string
    rol: UserRole
    activo: boolean
    created_at: string
    empresa?: Empresa
}

export interface Cliente {
    id: string
    empresa_id: string
    user_id?: string
    tipo_identificacion: TipoIdentificacion
    identificacion: string
    nombre: string
    email?: string
    telefono?: string
    direccion?: string
    created_at: string
}

export interface Marca {
    id: string
    nombre: string
    logo_url?: string
    es_autorizado: boolean
    created_at: string
}

export interface Modelo {
    id: string
    marca_id: string
    codigo?: string
    nombre: string
    categoria?: string
    especificaciones?: Record<string, unknown>
    imagen_url?: string
    marca?: Marca
}

export interface Producto {
    id: string
    empresa_id: string
    codigo?: string
    nombre: string
    descripcion?: string
    precio: number
    costo?: number
    stock: number
    stock_minimo: number
    tipo: TipoProducto
    iva: number
    activo: boolean
    created_at: string
}

export interface OrdenServicio {
    id: string
    empresa_id: string
    tecnico_id?: string
    cliente_id?: string
    numero_orden: string
    equipo: string
    marca?: string
    modelo?: string
    serie?: string
    problema_reportado?: string
    diagnostico?: string
    solucion?: string
    estado: EstadoOrden
    fecha_recepcion: string
    fecha_entrega?: string
    costo_servicio?: number
    costo_repuestos?: number
    informe_tecnico?: InformeTecnico
    created_at: string
    cliente?: Cliente
    tecnico?: Usuario
}

export interface InformeTecnico {
    equipo: {
        marca: string
        modelo: string
        serie: string
        fechaFabricacion?: string
        voltaje: string
        potencia: string
    }
    inspeccionInicial: {
        estadoExterior: EstadoExterior
        dañosVisibles: string[]
        accesoriosRecibidos: string[]
        fotos: string[]
    }
    diagnostico: {
        problemaReportado: string
        problemasEncontrados: string[]
        causaRaiz: string
        piezasDañadas: Array<{
            nombre: string
            codigo: string
            estado: string
        }>
    }
    reparacion: {
        trabajosRealizados: string[]
        repuestosUtilizados: Array<{
            codigo: string
            descripcion: string
            cantidad: number
            precio: number
        }>
        horasTrabajo: number
        tecnicoResponsable: string
    }
    pruebasFuncionamiento: {
        pruebaVacio: boolean
        pruebaCarga: boolean
        medicionesElectricas: {
            voltaje: number
            amperaje: number
            resistencia: number
        }
        observaciones: string
    }
    garantia: {
        tipoGarantia: TipoGarantia
        mesesGarantia: number
        condiciones: string
    }
}

export interface Venta {
    id: string
    empresa_id: string
    usuario_id?: string
    cliente_id?: string
    numero_factura?: string
    clave_acceso?: string
    subtotal: number
    iva: number
    total: number
    estado_sri: EstadoSRI
    xml_autorizado?: string
    fecha: string
    detalles?: VentaDetalle[]
    cliente?: Cliente
    usuario?: Usuario
}

export interface VentaDetalle {
    id: string
    venta_id: string
    producto_id?: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    iva: number
    producto?: Producto
}

export interface Caja {
    id: string
    empresa_id: string
    usuario_id?: string
    monto_apertura: number
    monto_cierre?: number
    fecha_apertura: string
    fecha_cierre?: string
    estado: EstadoCaja
    movimientos?: CajaMovimiento[]
    usuario?: Usuario
}

export interface CajaMovimiento {
    id: string
    caja_id: string
    tipo: TipoMovimiento
    concepto?: string
    monto: number
    created_at: string
}

export interface Pago {
    id: string
    empresa_id: string
    venta_id?: string
    orden_id?: string
    cliente_id: string
    monto: number
    metodo_pago?: MetodoPago
    estado: EstadoPago
    fecha_vencimiento?: string
    fecha_pago?: string
    comprobante_url?: string
    notas?: string
    created_at: string
    cliente?: Cliente
    venta?: Venta
    orden?: OrdenServicio
}

// API Response types
export interface ApiResponse<T> {
    data?: T
    error?: string
    success: boolean
}

// Auth types
export interface AuthUser {
    id: string
    email: string
    user_metadata: {
        nombre?: string
        rol?: UserRole
    }
}

// Form types for creating/updating
export interface CreateClienteInput {
    tipo_identificacion: TipoIdentificacion
    identificacion: string
    nombre: string
    email?: string
    telefono?: string
    direccion?: string
}

export interface CreateOrdenInput {
    cliente_id?: string
    equipo: string
    marca?: string
    modelo?: string
    serie?: string
    problema_reportado?: string
}

export interface CreateVentaInput {
    cliente_id?: string
    detalles: Array<{
        producto_id: string
        cantidad: number
        precio_unitario: number
    }>
}

export interface CreateProductoInput {
    codigo?: string
    nombre: string
    descripcion?: string
    precio: number
    costo?: number
    stock?: number
    stock_minimo?: number
    tipo: TipoProducto
    iva?: number
}
