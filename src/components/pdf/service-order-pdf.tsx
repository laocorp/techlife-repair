// PDF Template for Service Orders
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Font,
} from '@react-pdf/renderer'

// Register fonts
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
    ],
})

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Inter',
        fontSize: 10,
        color: '#1e293b',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6',
    },
    logo: {
        width: 120,
    },
    companyInfo: {
        textAlign: 'right',
    },
    companyName: {
        fontSize: 16,
        fontWeight: 700,
        color: '#1e3a5f',
    },
    companyDetail: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: 700,
        color: '#1e3a5f',
        marginBottom: 5,
    },
    orderNumber: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: 600,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 600,
        color: '#1e3a5f',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '30%',
        fontWeight: 600,
        color: '#64748b',
    },
    value: {
        width: '70%',
        color: '#1e293b',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '50%',
        marginBottom: 8,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 8,
        borderRadius: 4,
    },
    tableHeaderCell: {
        fontWeight: 600,
        color: '#1e3a5f',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tableCell: {
        color: '#1e293b',
    },
    status: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 600,
    },
    statusRecibido: { backgroundColor: '#e2e8f0', color: '#475569' },
    statusEnDiagnostico: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
    statusCotizado: { backgroundColor: '#fef3c7', color: '#b45309' },
    statusAprobado: { backgroundColor: '#cffafe', color: '#0891b2' },
    statusEnReparacion: { backgroundColor: '#ede9fe', color: '#7c3aed' },
    statusTerminado: { backgroundColor: '#d1fae5', color: '#059669' },
    statusEntregado: { backgroundColor: '#dcfce7', color: '#16a34a' },
    qrSection: {
        alignItems: 'center',
        marginTop: 20,
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    qrImage: {
        width: 100,
        height: 100,
    },
    qrText: {
        marginTop: 10,
        fontSize: 9,
        color: '#64748b',
        textAlign: 'center',
    },
    qrUrl: {
        fontSize: 8,
        color: '#3b82f6',
        marginTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
    },
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        marginTop: 50,
        paddingTop: 5,
    },
    signatureLabel: {
        fontSize: 9,
        color: '#64748b',
        textAlign: 'center',
    },
    termsSection: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    termsTitle: {
        fontSize: 10,
        fontWeight: 600,
        color: '#1e3a5f',
        marginBottom: 8,
    },
    termsText: {
        fontSize: 8,
        color: '#64748b',
        lineHeight: 1.5,
    },
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
        case 'en_diagnostico': return styles.statusEnDiagnostico
        case 'cotizado': return styles.statusCotizado
        case 'aprobado': return styles.statusAprobado
        case 'en_reparacion': return styles.statusEnReparacion
        case 'terminado': return styles.statusTerminado
        case 'entregado': return styles.statusEntregado
        default: return styles.statusRecibido
    }
}

const getStatusLabel = (estado: string) => {
    const labels: Record<string, string> = {
        recibido: 'Recibido',
        en_diagnostico: 'En Diagnóstico',
        cotizado: 'Cotizado',
        aprobado: 'Aprobado',
        en_reparacion: 'En Reparación',
        terminado: 'Terminado',
        entregado: 'Entregado',
    }
    return labels[estado] || estado
}

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

export function ServiceOrderPDF({ orden, qrCodeUrl, trackingUrl }: ServiceOrderPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Orden de Servicio</Text>
                        <Text style={styles.orderNumber}>N° {orden.numero_orden}</Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{orden.empresa.nombre}</Text>
                        <Text style={styles.companyDetail}>RUC: {orden.empresa.ruc}</Text>
                        {orden.empresa.direccion && (
                            <Text style={styles.companyDetail}>{orden.empresa.direccion}</Text>
                        )}
                        {orden.empresa.telefono && (
                            <Text style={styles.companyDetail}>Tel: {orden.empresa.telefono}</Text>
                        )}
                    </View>
                </View>

                {/* Client Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos del Cliente</Text>
                    <View style={styles.grid}>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Nombre:</Text>
                                <Text style={styles.value}>{orden.cliente?.nombre || 'Consumidor Final'}</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Identificación:</Text>
                                <Text style={styles.value}>{orden.cliente?.identificacion || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Teléfono:</Text>
                                <Text style={styles.value}>{orden.cliente?.telefono || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Email:</Text>
                                <Text style={styles.value}>{orden.cliente?.email || '-'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Equipment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos del Equipo</Text>
                    <View style={styles.grid}>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Equipo:</Text>
                                <Text style={styles.value}>{orden.equipo}</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Marca:</Text>
                                <Text style={styles.value}>{orden.marca || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Modelo:</Text>
                                <Text style={styles.value}>{orden.modelo || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={styles.row}>
                                <Text style={styles.label}>N° Serie:</Text>
                                <Text style={styles.value}>{orden.serie || '-'}</Text>
                            </View>
                        </View>
                    </View>
                    {orden.accesorios && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Accesorios:</Text>
                            <Text style={styles.value}>{orden.accesorios}</Text>
                        </View>
                    )}
                </View>

                {/* Problem & Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalle del Servicio</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Problema:</Text>
                        <Text style={styles.value}>{orden.problema || 'No especificado'}</Text>
                    </View>
                    {orden.diagnostico && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Diagnóstico:</Text>
                            <Text style={styles.value}>{orden.diagnostico}</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.label}>Estado:</Text>
                        <View style={[styles.status, getStatusStyle(orden.estado)]}>
                            <Text>{getStatusLabel(orden.estado)}</Text>
                        </View>
                    </View>
                    {orden.tecnico && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Técnico:</Text>
                            <Text style={styles.value}>{orden.tecnico.nombre}</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha ingreso:</Text>
                        <Text style={styles.value}>{formatDate(orden.created_at)}</Text>
                    </View>
                </View>

                {/* Costs */}
                {(orden.costo_estimado || orden.costo_final) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Costos</Text>
                        {orden.costo_estimado && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Costo Estimado:</Text>
                                <Text style={styles.value}>${orden.costo_estimado.toFixed(2)}</Text>
                            </View>
                        )}
                        {orden.costo_final && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Costo Final:</Text>
                                <Text style={[styles.value, { fontWeight: 700 }]}>${orden.costo_final.toFixed(2)}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* QR Code Section */}
                <View style={styles.qrSection}>
                    {qrCodeUrl && <Image style={styles.qrImage} src={qrCodeUrl} />}
                    <Text style={styles.qrText}>
                        Escanea el código QR para consultar el estado de tu equipo
                    </Text>
                    <Text style={styles.qrUrl}>{trackingUrl}</Text>
                </View>

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
                        1. El cliente tiene un plazo de 30 días para retirar su equipo una vez notificado.{'\n'}
                        2. No nos hacemos responsables por equipos no retirados después de 90 días.{'\n'}
                        3. La garantía del servicio es de 30 días sobre el trabajo realizado.{'\n'}
                        4. El diagnóstico tiene un costo si el cliente decide no realizar la reparación.
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Generado el {new Date().toLocaleDateString('es-EC')}
                    </Text>
                    <Text style={styles.footerText}>
                        RepairApp - Sistema de Servicio Técnico
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
