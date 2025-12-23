import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer'

// Register fonts


const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#1e293b' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    companyInfo: { width: '45%' },
    rideInfo: { width: '50%', backgroundColor: '#f8fafc', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
    companyName: { fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 5 },
    label: { fontSize: 8, color: '#64748b', fontWeight: 600, marginTop: 4 },
    value: { fontSize: 9, color: '#0f172a' },
    section: { marginTop: 20 },
    box: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: 10, marginTop: 5 },

    table: { marginTop: 20, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    col1: { width: '15%' }, // Cod
    col2: { width: '45%' }, // Desc
    col3: { width: '10%', textAlign: 'center' }, // Cant
    col4: { width: '15%', textAlign: 'right' }, // Precio
    col5: { width: '15%', textAlign: 'right' }, // Total

    totals: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    totalsBox: { width: '40%' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    totalLabel: { fontWeight: 600, color: '#64748b' },
    totalValue: { fontWeight: 700, color: '#0f172a' },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
    accessKey: { fontSize: 8, fontFamily: 'Courier', marginTop: 2, color: '#334155' }
})

export function InvoicePDF({ factura, empresa }: { factura: any, empresa: any }) {
    const items = factura.venta?.detalles || []
    const cliente = factura.venta?.cliente || {}

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('es-EC', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        {/* Logo placeholder if URL exists, implementation depends on proxying */}
                        <Text style={styles.companyName}>{empresa.nombre}</Text>
                        <Text style={styles.label}>RUC:</Text>
                        <Text style={styles.value}>{empresa.ruc}</Text>
                        <Text style={styles.label}>Dirección Matriz:</Text>
                        <Text style={styles.value}>{empresa.direccion || 'S/N'}</Text>
                        <Text style={styles.label}>Obligado a Llevar Contabilidad:</Text>
                        <Text style={styles.value}>{empresa.obligado_contabilidad ? 'SI' : 'NO'}</Text>
                    </View>

                    <View style={styles.rideInfo}>
                        <Text style={styles.label}>R.U.C.:</Text>
                        <Text style={[styles.value, { fontSize: 12, fontWeight: 700 }]}>{empresa.ruc}</Text>

                        <Text style={[styles.label, { marginTop: 10 }]}>FACTURA</Text>
                        <Text style={[styles.value, { fontSize: 11 }]}>N° {factura.numero}</Text>

                        <Text style={styles.label}>NÚMERO DE AUTORIZACIÓN</Text>
                        <Text style={styles.value}>{factura.numero_autorizacion || 'PENDIENTE'}</Text>

                        <Text style={styles.label}>FECHA Y HORA DE AUTORIZACIÓN</Text>
                        <Text style={styles.value}>{formatDate(factura.updated_at)}</Text>

                        <Text style={styles.label}>AMBIENTE</Text>
                        <Text style={styles.value}>{factura.ambiente === 'produccion' ? 'PRODUCCIÓN' : 'PRUEBAS'}</Text>

                        <Text style={styles.label}>EMISIÓN</Text>
                        <Text style={styles.value}>NORMAL</Text>

                        <Text style={styles.label}>CLAVE DE ACCESO</Text>
                        <Text style={styles.accessKey}>{factura.clave_acceso}</Text>
                    </View>
                </View>

                {/* Client Info */}
                <View style={styles.box}>
                    <Text style={styles.value}>Razón Social / Nombres y Apellidos:  {factura.cliente_nombre}</Text>
                    <Text style={[styles.value, { marginTop: 4 }]}>Identificación:  {factura.cliente_identificacion}</Text>
                    <Text style={[styles.value, { marginTop: 4 }]}>Fecha Emisión:  {formatDate(factura.created_at)}</Text>
                    <Text style={[styles.value, { marginTop: 4 }]}>Dirección:  {cliente.direccion || 'S/N'}</Text>
                </View>

                {/* Details Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.label, styles.col1]}>Cod. Principal</Text>
                        <Text style={[styles.label, styles.col2]}>Descripción</Text>
                        <Text style={[styles.label, styles.col3]}>Cant</Text>
                        <Text style={[styles.label, styles.col4]}>Precio Unitario</Text>
                        <Text style={[styles.label, styles.col5]}>Precio Total</Text>
                    </View>
                    {items.map((item: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.value, styles.col1]}>{item.producto?.codigo || '-'}</Text>
                            <Text style={[styles.value, styles.col2]}>{item.producto?.nombre || '-'}</Text>
                            <Text style={[styles.value, styles.col3]}>{item.cantidad}</Text>
                            <Text style={[styles.value, styles.col4]}>{Number(item.precio_unitario).toFixed(2)}</Text>
                            <Text style={[styles.value, styles.col5]}>{Number(item.subtotal).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>SUBTOTAL 15%</Text>
                            <Text style={styles.totalValue}>{Number(factura.subtotal).toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>SUBTOTAL 0%</Text>
                            <Text style={styles.totalValue}>0.00</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>DESCUENTO</Text>
                            <Text style={styles.totalValue}>0.00</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>IVA 15%</Text>
                            <Text style={styles.totalValue}>{Number(factura.iva).toFixed(2)}</Text>
                        </View>
                        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 4 }]}>
                            <Text style={[styles.totalLabel, { fontSize: 11 }]}>VALOR TOTAL</Text>
                            <Text style={[styles.totalValue, { fontSize: 11 }]}>{Number(factura.total).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Generado por RepairApp - Facturación Electrónica</Text>
                </View>
            </Page>
        </Document>
    )
}
