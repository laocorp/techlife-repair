// PDF Template for Service Orders - Premium Design
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer'

const colors = {
    primary: '#1e3a5f',      // Deep blue
    secondary: '#3b82f6',    // Bright blue
    accent: '#10b981',       // Emerald
    dark: '#0f172a',         // Slate 900
    gray: '#64748b',         // Slate 500
    lightGray: '#94a3b8',    // Slate 400
    border: '#e2e8f0',       // Slate 200
    background: '#f8fafc',   // Slate 50
    white: '#ffffff',
}

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: colors.dark,
        backgroundColor: colors.white,
    },
    // Header with gradient-like effect
    headerBand: {
        backgroundColor: colors.primary,
        padding: 30,
        paddingBottom: 40,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {},
    headerRight: {
        textAlign: 'right',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: colors.white,
        marginBottom: 4,
        letterSpacing: 1,
    },
    orderNumber: {
        fontSize: 14,
        color: '#93c5fd', // Blue 300
        fontWeight: 600,
    },
    companyName: {
        fontSize: 16,
        fontWeight: 700,
        color: colors.white,
        marginBottom: 4,
    },
    companyDetail: {
        fontSize: 8,
        color: '#cbd5e1', // Slate 300
        marginTop: 2,
    },

    // Main content area
    mainContent: {
        padding: 30,
        paddingTop: 20,
    },

    // Status badge in header
    statusBadge: {
        position: 'absolute',
        top: 25,
        right: 30,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.accent,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 700,
        color: colors.white,
        textTransform: 'uppercase',
    },

    // Card sections
    card: {
        marginBottom: 16,
        border: 1,
        borderColor: colors.border,
        borderRadius: 8,
        overflow: 'hidden',
    },
    cardHeader: {
        backgroundColor: colors.background,
        padding: 10,
        paddingHorizontal: 14,
        borderBottom: 1,
        borderBottomColor: colors.border,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardBody: {
        padding: 14,
    },

    // Grid layout
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '50%',
        marginBottom: 10,
    },
    gridItemFull: {
        width: '100%',
        marginBottom: 10,
    },

    // Label value pairs
    label: {
        fontSize: 8,
        color: colors.gray,
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    value: {
        fontSize: 10,
        color: colors.dark,
        fontWeight: 500,
    },
    valueLarge: {
        fontSize: 12,
        color: colors.dark,
        fontWeight: 700,
    },

    // Two column layout
    twoColumn: {
        flexDirection: 'row',
        gap: 16,
    },
    column: {
        flex: 1,
    },

    // Costs section with highlight
    costsCard: {
        marginBottom: 16,
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    costItem: {
        alignItems: 'center',
    },
    costLabel: {
        fontSize: 8,
        color: '#93c5fd',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    costValue: {
        fontSize: 18,
        fontWeight: 700,
        color: colors.white,
    },
    costValueSmall: {
        fontSize: 14,
        fontWeight: 600,
        color: '#93c5fd',
    },

    // QR Section - Modern look
    qrSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        border: 1,
        borderColor: colors.border,
    },
    qrImage: {
        width: 80,
        height: 80,
        marginRight: 16,
    },
    qrInfo: {
        flex: 1,
    },
    qrTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: colors.primary,
        marginBottom: 4,
    },
    qrText: {
        fontSize: 9,
        color: colors.gray,
        marginBottom: 6,
        lineHeight: 1.4,
    },
    qrUrl: {
        fontSize: 8,
        color: colors.secondary,
        fontWeight: 600,
    },

    // Signature Section - Modern
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        marginBottom: 20,
    },
    signatureBox: {
        width: '45%',
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: colors.dark,
        marginTop: 40,
        paddingTop: 8,
    },
    signatureLabel: {
        fontSize: 9,
        color: colors.gray,
        textAlign: 'center',
    },

    // Terms - Compact
    termsSection: {
        backgroundColor: colors.background,
        borderRadius: 6,
        padding: 12,
        marginTop: 10,
    },
    termsTitle: {
        fontSize: 9,
        fontWeight: 700,
        color: colors.primary,
        marginBottom: 6,
    },
    termsText: {
        fontSize: 7,
        color: colors.gray,
        lineHeight: 1.5,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    footerText: {
        fontSize: 7,
        color: colors.lightGray,
    },

    // Status colors
    statusRecibido: { backgroundColor: '#64748b' },
    statusDiagnostico: { backgroundColor: '#3b82f6' },
    statusCotizado: { backgroundColor: '#f59e0b' },
    statusAprobado: { backgroundColor: '#06b6d4' },
    statusReparacion: { backgroundColor: '#8b5cf6' },
    statusTerminado: { backgroundColor: '#10b981' },
    statusEntregado: { backgroundColor: '#22c55e' },
})

interface OrdenData {
    numero_orden: string
    equipo: string
    marca: string | null
    modelo: string | null
    serie: string | null
    accesorios: string | null
    problema: string | null
    diagnostico: string | null
    observaciones_recepcion: string | null
    estado: string
    prioridad: string
    costo_estimado: number | null
    costo_final: number | null
    created_at: string
    cliente: {
        nombre: string
        identificacion: string
        telefono: string | null
        email: string | null
        direccion: string | null
    } | null
    tecnico: {
        nombre: string
    } | null
    empresa: {
        nombre: string
        ruc: string
        direccion: string | null
        telefono: string | null
        email: string | null
    }
}

interface ServiceOrderPDFProps {
    orden: OrdenData
    qrCodeUrl: string
    trackingUrl: string
}

const getStatusStyle = (estado: string) => {
    switch (estado) {
        case 'recibido': return styles.statusRecibido
        case 'diagnostico':
        case 'en_diagnostico': return styles.statusDiagnostico
        case 'cotizado': return styles.statusCotizado
        case 'aprobado': return styles.statusAprobado
        case 'reparando':
        case 'en_reparacion': return styles.statusReparacion
        case 'listo':
        case 'terminado': return styles.statusTerminado
        case 'entregado': return styles.statusEntregado
        default: return styles.statusRecibido
    }
}

const getStatusLabel = (estado: string): string => {
    const labels: Record<string, string> = {
        recibido: 'Recibido',
        diagnostico: 'En Diagnóstico',
        en_diagnostico: 'En Diagnóstico',
        cotizado: 'Cotizado',
        aprobado: 'Aprobado',
        reparando: 'En Reparación',
        en_reparacion: 'En Reparación',
        listo: 'Listo',
        terminado: 'Terminado',
        entregado: 'Entregado',
    }
    return labels[estado] || estado
}

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const formatCurrency = (amount: number | null): string => {
    if (!amount) return '$0.00'
    return `$${amount.toFixed(2)}`
}

export function ServiceOrderPDF({ orden, qrCodeUrl, trackingUrl }: ServiceOrderPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Band */}
                <View style={styles.headerBand}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.title}>ORDEN DE SERVICIO</Text>
                            <Text style={styles.orderNumber}>N° {orden.numero_orden}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={styles.companyName}>{orden.empresa.nombre}</Text>
                            {orden.empresa.ruc && (
                                <Text style={styles.companyDetail}>RUC: {orden.empresa.ruc}</Text>
                            )}
                            {orden.empresa.direccion && (
                                <Text style={styles.companyDetail}>{orden.empresa.direccion}</Text>
                            )}
                            {orden.empresa.telefono && (
                                <Text style={styles.companyDetail}>Tel: {orden.empresa.telefono}</Text>
                            )}
                        </View>
                    </View>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, getStatusStyle(orden.estado)]}>
                        <Text style={styles.statusText}>{getStatusLabel(orden.estado)}</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {/* Two column layout: Client & Equipment */}
                    <View style={styles.twoColumn}>
                        {/* Client Card */}
                        <View style={[styles.card, styles.column]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Cliente</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.gridItemFull}>
                                    <Text style={styles.label}>Nombre</Text>
                                    <Text style={styles.valueLarge}>{orden.cliente?.nombre || 'Consumidor Final'}</Text>
                                </View>
                                <View style={styles.grid}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>Identificación</Text>
                                        <Text style={styles.value}>{orden.cliente?.identificacion || '-'}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>Teléfono</Text>
                                        <Text style={styles.value}>{orden.cliente?.telefono || '-'}</Text>
                                    </View>
                                </View>
                                {orden.cliente?.email && (
                                    <View style={styles.gridItemFull}>
                                        <Text style={styles.label}>Email</Text>
                                        <Text style={styles.value}>{orden.cliente.email}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Equipment Card */}
                        <View style={[styles.card, styles.column]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Equipo</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.gridItemFull}>
                                    <Text style={styles.label}>Tipo</Text>
                                    <Text style={styles.valueLarge}>{orden.equipo}</Text>
                                </View>
                                <View style={styles.grid}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>Marca</Text>
                                        <Text style={styles.value}>{orden.marca || '-'}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>Modelo</Text>
                                        <Text style={styles.value}>{orden.modelo || '-'}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>N° Serie</Text>
                                        <Text style={styles.value}>{orden.serie || '-'}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>Fecha</Text>
                                        <Text style={styles.value}>{formatDate(orden.created_at)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Service Details Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Detalle del Servicio</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.grid}>
                                <View style={{ width: '70%', paddingRight: 16 }}>
                                    <Text style={styles.label}>Problema Reportado</Text>
                                    <Text style={[styles.value, { lineHeight: 1.5 }]}>{orden.problema || 'No especificado'}</Text>
                                </View>
                                <View style={{ width: '30%' }}>
                                    <Text style={styles.label}>Técnico Asignado</Text>
                                    <Text style={styles.value}>{orden.tecnico?.nombre || 'Sin asignar'}</Text>
                                </View>
                            </View>
                            {orden.diagnostico && (
                                <View style={[styles.gridItemFull, { marginTop: 10 }]}>
                                    <Text style={styles.label}>Diagnóstico</Text>
                                    <Text style={[styles.value, { lineHeight: 1.5 }]}>{orden.diagnostico}</Text>
                                </View>
                            )}
                            {orden.accesorios && (
                                <View style={[styles.gridItemFull, { marginTop: 10 }]}>
                                    <Text style={styles.label}>Accesorios Entregados</Text>
                                    <Text style={styles.value}>{orden.accesorios}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Costs Card - Highlighted */}
                    {(orden.costo_estimado || orden.costo_final) && (
                        <View style={styles.costsCard}>
                            <View style={styles.costItem}>
                                <Text style={styles.costLabel}>Costo Estimado</Text>
                                <Text style={styles.costValueSmall}>{formatCurrency(orden.costo_estimado)}</Text>
                            </View>
                            <View style={styles.costItem}>
                                <Text style={styles.costLabel}>Costo Final</Text>
                                <Text style={styles.costValue}>{formatCurrency(orden.costo_final)}</Text>
                            </View>
                            <View style={styles.costItem}>
                                <Text style={styles.costLabel}>Prioridad</Text>
                                <Text style={styles.costValueSmall}>{orden.prioridad?.toUpperCase() || 'NORMAL'}</Text>
                            </View>
                        </View>
                    )}

                    {/* QR Code Section */}
                    {qrCodeUrl && (
                        <View style={styles.qrSection}>
                            <Image style={styles.qrImage} src={qrCodeUrl} />
                            <View style={styles.qrInfo}>
                                <Text style={styles.qrTitle}>Consulta el Estado de tu Equipo</Text>
                                <Text style={styles.qrText}>
                                    Escanea el código QR con tu teléfono para ver el estado actualizado de tu reparación en tiempo real.
                                </Text>
                                <Text style={styles.qrUrl}>{trackingUrl}</Text>
                            </View>
                        </View>
                    )}

                    {/* Signatures */}
                    <View style={styles.signatureSection}>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine}>
                                <Text style={styles.signatureLabel}>Firma del Cliente</Text>
                            </View>
                        </View>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine}>
                                <Text style={styles.signatureLabel}>Firma del Técnico</Text>
                            </View>
                        </View>
                    </View>

                    {/* Terms */}
                    <View style={styles.termsSection}>
                        <Text style={styles.termsTitle}>Términos y Condiciones</Text>
                        <Text style={styles.termsText}>
                            1. El cliente tiene 30 días para retirar su equipo una vez notificado. {'\n'}
                            2. No nos hacemos responsables por equipos no retirados después de 90 días. {'\n'}
                            3. Garantía de 30 días sobre el trabajo realizado. {'\n'}
                            4. El diagnóstico tiene costo si no se realiza la reparación.
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Generado: {new Date().toLocaleDateString('es-EC')} | Orden: {orden.numero_orden}
                    </Text>
                    <Text style={styles.footerText}>
                        RepairApp - Sistema de Gestión de Servicio Técnico
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
