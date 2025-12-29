import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
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
    // Header
    headerBand: {
        backgroundColor: colors.primary,
        padding: 30,
        paddingBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    companyName: {
        fontSize: 18,
        fontWeight: 700,
        color: colors.white,
        marginBottom: 4,
    },
    companyDetail: {
        fontSize: 9,
        color: '#cbd5e1', // Slate 300
        marginTop: 2,
    },
    invoiceTitleBlock: {
        alignItems: 'flex-end',
    },
    invoiceType: {
        fontSize: 10,
        color: '#93c5fd', // Blue 300
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 1,
    },
    invoiceNumber: {
        fontSize: 28,
        fontWeight: 700,
        color: colors.white,
    },
    invoiceDate: {
        fontSize: 10,
        color: '#cbd5e1',
        marginTop: 4,
    },

    // Content
    mainContent: {
        padding: 30,
    },

    // Client Section
    clientSection: {
        flexDirection: 'row',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    clientCol: {
        flex: 1,
    },
    metaCol: {
        width: '40%',
    },
    sectionLabel: {
        fontSize: 8,
        color: colors.gray,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: 700,
    },
    clientName: {
        fontSize: 14,
        fontWeight: 700,
        color: colors.dark,
        marginBottom: 4,
    },
    clientDetail: {
        fontSize: 9,
        color: colors.gray,
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    metaLabel: {
        fontSize: 9,
        color: colors.gray,
    },
    metaValue: {
        fontSize: 9,
        color: colors.dark,
        fontWeight: 600,
    },

    // SRI Info
    sriBox: {
        backgroundColor: colors.background,
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 10,
    },
    sriText: {
        fontSize: 8,
        fontFamily: 'Courier',
        color: colors.gray,
    },

    // Items Table
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
    },
    colDesc: { flex: 4 },
    colQty: { flex: 1, textAlign: 'right' },
    colPrice: { flex: 1.5, textAlign: 'right' },
    colTotal: { flex: 1.5, textAlign: 'right' },

    tableHeaderLabel: {
        fontSize: 9,
        fontWeight: 700,
        color: colors.primary,
        textTransform: 'uppercase',
    },
    itemTitle: {
        fontSize: 10,
        fontWeight: 600,
        color: colors.dark,
    },
    itemSubtitle: {
        fontSize: 8,
        color: colors.gray,
        marginTop: 2,
    },
    itemValue: {
        fontSize: 9,
        color: colors.gray,
    },
    itemTotal: {
        fontSize: 10,
        fontWeight: 700,
        color: colors.dark,
    },

    // Totals
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    totalsBox: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    totalLabel: {
        fontSize: 9,
        color: colors.gray,
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 600,
        color: colors.dark,
    },
    finalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    finalTotalLabel: {
        fontSize: 12,
        fontWeight: 700,
        color: colors.primary,
    },
    finalTotalValue: {
        fontSize: 14,
        fontWeight: 700,
        color: colors.primary,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: colors.lightGray,
        marginBottom: 2,
    },
})

export function SalesPDF({ venta }: { venta: any }) {
    const esFactura = !!venta.factura
    const empresa = venta.empresa || {}
    const cliente = venta.cliente || {}
    const items = venta.detalles || []

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Band */}
                <View style={styles.headerBand}>
                    <View>
                        <Text style={styles.companyName}>{empresa.nombre_comercial || 'EMPRESA'}</Text>
                        <Text style={styles.companyDetail}>{empresa.direccion || 'Dirección no registrada'}</Text>
                        <Text style={styles.companyDetail}>RUC: {empresa.ruc || '9999999999999'}</Text>
                        <Text style={styles.companyDetail}>{empresa.telefono || ''}</Text>
                        <Text style={styles.companyDetail}>{empresa.email || ''}</Text>
                    </View>
                    <View style={styles.invoiceTitleBlock}>
                        <Text style={styles.invoiceType}>
                            {esFactura ? 'FACTURA ELECTRÓNICA' : 'NOTA DE VENTA'}
                        </Text>
                        <Text style={styles.invoiceNumber}>Nº {venta.numero}</Text>
                        <Text style={styles.invoiceDate}>{formatDate(venta.created_at)}</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>

                    {/* Client & Meta Info */}
                    <View style={styles.clientSection}>
                        <View style={styles.clientCol}>
                            <Text style={styles.sectionLabel}>Facturado A:</Text>
                            <Text style={styles.clientName}>{cliente.nombre || 'Consumidor Final'}</Text>
                            {cliente.identificacion && (
                                <Text style={styles.clientDetail}>CI/RUC: {cliente.identificacion}</Text>
                            )}
                            {cliente.direccion && (
                                <Text style={styles.clientDetail}>{cliente.direccion}</Text>
                            )}
                            {cliente.telefono && (
                                <Text style={styles.clientDetail}>{cliente.telefono}</Text>
                            )}
                            {cliente.email && (
                                <Text style={styles.clientDetail}>{cliente.email}</Text>
                            )}
                        </View>

                        <View style={styles.metaCol}>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Fecha de Emisión:</Text>
                                <Text style={styles.metaValue}>{new Date(venta.created_at).toLocaleDateString('es-EC')}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Forma de Pago:</Text>
                                <Text style={[styles.metaValue, { textTransform: 'capitalize' }]}>{venta.metodo_pago}</Text>
                            </View>

                            {esFactura && (
                                <View style={styles.sriBox}>
                                    <Text style={[styles.sectionLabel, { marginBottom: 2 }]}>Autorización SRI</Text>
                                    <Text style={styles.sriText}>{venta.factura.numero_autorizacion}</Text>
                                    <Text style={[styles.sectionLabel, { marginTop: 4, marginBottom: 2 }]}>Clave Acceso</Text>
                                    <Text style={styles.sriText}>{venta.factura.clave_acceso}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Items Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderLabel, styles.colDesc]}>Descripción</Text>
                            <Text style={[styles.tableHeaderLabel, styles.colQty]}>Cant.</Text>
                            <Text style={[styles.tableHeaderLabel, styles.colPrice]}>P. Unit</Text>
                            <Text style={[styles.tableHeaderLabel, styles.colTotal]}>Total</Text>
                        </View>
                        {items.map((item: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={styles.colDesc}>
                                    <Text style={styles.itemTitle}>{item.producto?.nombre || 'Producto'}</Text>
                                    {item.producto?.codigo && (
                                        <Text style={styles.itemSubtitle}>Cod: {item.producto.codigo}</Text>
                                    )}
                                </View>
                                <Text style={[styles.itemValue, styles.colQty]}>{item.cantidad}</Text>
                                <Text style={[styles.itemValue, styles.colPrice]}>${Number(item.precio_unitario).toFixed(2)}</Text>
                                <Text style={[styles.itemTotal, styles.colTotal]}>${Number(item.subtotal).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Totals Section */}
                    <View style={styles.totalsSection}>
                        <View style={styles.totalsBox}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>${Number(venta.subtotal).toFixed(2)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Descuento</Text>
                                <Text style={styles.totalValue}>${Number(venta.descuento || 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>IVA (15%)</Text>
                                <Text style={styles.totalValue}>${Number(venta.iva).toFixed(2)}</Text>
                            </View>
                            <View style={styles.finalTotalRow}>
                                <Text style={styles.finalTotalLabel}>TOTAL A PAGAR</Text>
                                <Text style={styles.finalTotalValue}>${Number(venta.total).toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>

                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Gracias por su compra. Para garantías es indispensable presentar este documento.</Text>
                    <Text style={styles.footerText}>Generado por RepairApp v2.0</Text>
                </View>
            </Page>
        </Document>
    )
}
