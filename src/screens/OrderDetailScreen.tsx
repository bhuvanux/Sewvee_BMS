import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import {
    Phone,
    ArrowLeft,
    Share2,
    Printer,
    Calendar,
    ReceiptIndianRupee,
    Download,
    Edit2,
    Trash2,
    PlusCircle,
    ChevronLeft
} from 'lucide-react-native';
import { formatDate, getCurrentDate } from '../utils/dateUtils';
import { Platform } from 'react-native';
import { generateInvoicePDF } from '../services/pdfService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import SuccessModal from '../components/SuccessModal';

const { width } = Dimensions.get('window');

const OrderDetailScreen = ({ route, navigation }: any) => {
    const { orderId } = route.params;
    const { orders, deleteOrder, updateOrder, addPayment, payments } = useData();
    const { company } = useAuth();
    const insets = useSafeAreaInsets();
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Custom Modal State
    const [successVisible, setSuccessVisible] = useState(false);
    const [successTitle, setSuccessTitle] = useState('');
    const [successDesc, setSuccessDesc] = useState('');
    const [successType, setSuccessType] = useState<'success' | 'warning' | 'info' | 'error'>('success');
    const [onSuccessDone, setOnSuccessDone] = useState<(() => void) | null>(null);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', { screen: 'Dashboard' })}
                    style={{ padding: 8, marginLeft: -8 }}
                >
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);



    // Use orderId to find the order in the global state
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        return (
            <View style={styles.center}>
                <Text style={Typography.bodyMedium}>Order not found</Text>
                <TouchableOpacity
                    style={{ marginTop: 20, padding: 10, backgroundColor: Colors.primary, borderRadius: 8 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: Colors.white }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const billPayments = payments.filter(p => p.orderId === order.id);
    const totalPaid = billPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = (order.total || 0) - totalPaid;

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const companyData = {
                name: company?.name || 'My Boutique',
                address: company?.address || 'Your Address Here',
                phone: company?.phone || 'Your Phone Here',
                gstin: company?.gstin || '',
                billSignature: company?.billSignature || null,
                billTerms: company?.billTerms || null
            };
            await generateInvoicePDF(order, companyData);
        } catch (error: any) {
            setSuccessTitle('Share Failed');
            setSuccessDesc(error.message || 'Could not generate PDF for WhatsApp');
            setSuccessType('error');
            setOnSuccessDone(null);
            setSuccessVisible(true);
        } finally {
            setIsSharing(false);
        }
    };

    const handlePrint = async () => {
        if (isPrinting) return;
        setIsPrinting(true);
        try {
            const companyData = {
                name: company?.name || 'My Boutique',
                address: company?.address || 'Your Address Here',
                phone: company?.phone || 'Your Phone Here',
                gstin: company?.gstin || '',
                billSignature: company?.billSignature || null,
                billTerms: company?.billTerms || null
            };
            await generateInvoicePDF(order, companyData);
        } catch (error: any) {
            setSuccessTitle('Print Failed');
            setSuccessDesc(error.message || 'Could not generate PDF');
            setSuccessType('error');
            setOnSuccessDone(null);
            setSuccessVisible(true);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleDelete = () => {
        setSuccessTitle('Delete Bill');
        setSuccessDesc('Are you sure you want to delete this bill? This action cannot be undone.');
        setSuccessType('error');
        setOnSuccessDone(() => async () => {
            if (isDeleting) return;
            setIsDeleting(true);
            try {
                await deleteOrder(order.id);
                navigation.goBack();
            } catch (e: any) {
                setSuccessTitle('Delete Failed');
                setSuccessDesc(e.message || 'Could not delete bill');
                setSuccessType('error');
                setOnSuccessDone(null);
                setSuccessVisible(true);
                setIsDeleting(false);
            }
        });
        setSuccessVisible(true);
    };

    const handleSavePayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            setSuccessTitle('Invalid Amount');
            setSuccessDesc('Please enter a valid payment amount.');
            setSuccessType('warning');
            setSuccessVisible(true);
            return;
        }
        if (amount > currentBalance) {
            setSuccessTitle('Excess Amount');
            setSuccessDesc('Payment cannot be greater than the balance due.');
            setSuccessType('warning');
            setSuccessVisible(true);
            return;
        }

        try {
            await addPayment({
                orderId: order.id,
                customerId: order.customerId,
                amount: amount,
                mode: paymentMode,
                date: order.date || getCurrentDate(),
            });

            setPaymentModalVisible(false);
            setPaymentAmount('');

            setSuccessTitle('Payment Successful');
            setSuccessDesc(`₹${amount} has been added to bill #${order.billNo}`);
            setSuccessType('success');
            setSuccessVisible(true);
        } catch (error: any) {
            console.error('Payment Error:', error);
            setSuccessTitle('Payment Failed');
            setSuccessDesc(error.message || 'Could not save payment');
            setSuccessType('error');
            setOnSuccessDone(null);
            setSuccessVisible(true);
        }
    };

    // billPayments definition moved up for dynamic calculation

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.billNoLabel}>Bill No</Text>
                            <Text style={styles.billNoValue}>#{order.billNo}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoGrid}>
                        <View style={styles.infoRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Date & Time</Text>
                                <Text style={styles.infoValue}>{formatDate(order.date)}  •  {order.time || '10:00 AM'}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={{ flex: 1.5 }}>
                                <Text style={styles.infoLabel}>Customer Name</Text>
                                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]} numberOfLines={1}>{order.customerName}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <Text style={[styles.infoLabel, { textAlign: 'right' }]}>WhatsApp No</Text>
                                <Text style={styles.infoValue}>{order.customerMobile}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Manage Bill</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateOrder', { editOrderId: order.id })}>
                            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                                <Edit2 size={18} color="#4F46E5" />
                            </View>
                            <Text style={styles.actionText}>Edit Bill</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => setPaymentModalVisible(true)}>
                            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                                <PlusCircle size={18} color="#059669" />
                            </View>
                            <Text style={styles.actionText}>Add Amt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, isDeleting && { opacity: 0.7 }]}
                            onPress={handleDelete}
                            disabled={isDeleting}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#DC2626" />
                                ) : (
                                    <Trash2 size={18} color="#DC2626" />
                                )}
                            </View>
                            <Text style={styles.actionText}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill Items</Text>
                    <View style={styles.itemsCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
                            <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amt</Text>
                        </View>
                        {order.items.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <View style={{ flex: 2 }}>
                                    <Text style={styles.itemText}>{item.name}</Text>
                                    {item.description ? (
                                        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                                            {item.description}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={[styles.itemText, { flex: 0.5, textAlign: 'center' }]}>{item.qty}</Text>
                                <Text style={[styles.itemText, { flex: 1, textAlign: 'right' }]}>₹{item.rate}</Text>
                                <Text style={[styles.itemTextBold, { flex: 1, textAlign: 'right' }]}>₹{item.amount}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {billPayments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment History</Text>
                        <View style={styles.itemsCard}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Date</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Mode</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                            </View>
                            {billPayments.map((p, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.itemText, { flex: 1.5 }]}>
                                        {formatDate(p.date)}
                                    </Text>
                                    <Text style={[styles.itemText, { flex: 1 }]}>{p.mode}</Text>
                                    <Text style={[styles.itemTextBold, { flex: 1, textAlign: 'right', color: Colors.success }]}>₹{p.amount}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={[styles.section, { marginTop: Spacing.lg }]}>
                    <View style={styles.amountGrid}>
                        <View style={styles.amountBox}>
                            <Text style={styles.amountLabel}>TOTAL</Text>
                            <Text style={styles.amountValueMain}>₹{order.total.toLocaleString()}</Text>
                        </View>
                        <View style={styles.amountBox}>
                            <Text style={styles.amountLabel}>PAID</Text>
                            <Text style={[styles.amountValueMain, { color: Colors.success }]}>₹{totalPaid.toLocaleString()}</Text>
                        </View>
                        <View style={styles.amountBox}>
                            <Text style={styles.amountLabel}>BALANCE</Text>
                            <Text style={[styles.amountValueMain, { color: currentBalance > 0 ? Colors.danger : Colors.success }]}>
                                ₹{currentBalance.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Spacing.md + (insets.bottom > 0 ? insets.bottom - 10 : 0) }]}>
                <TouchableOpacity
                    style={[styles.secondaryBtn, isPrinting && { opacity: 0.7 }]}
                    onPress={handlePrint}
                    disabled={isPrinting || isSharing}
                >
                    {isPrinting ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <>
                            <Printer size={20} color={Colors.primary} />
                            <Text style={styles.secondaryBtnText}>Print Bill</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.primaryBtn, isSharing && { opacity: 0.7 }]}
                    onPress={handleShare}
                    disabled={isPrinting || isSharing}
                >
                    {isSharing ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <>
                            <Share2 size={20} color={Colors.white} />
                            <Text style={styles.primaryBtnText}>WhatsApp</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={paymentModalVisible}
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={[Typography.h2, { marginBottom: Spacing.lg }]}>Add Payment</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount Received (Balance: ₹{currentBalance})</Text>
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="₹ 0.00"
                                keyboardType="numeric"
                                value={paymentAmount}
                                onChangeText={setPaymentAmount}
                                autoFocus
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Payment Mode</Text>
                            <View style={styles.modeRow}>
                                {['Cash', 'UPI', 'GPay', 'Card'].map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.modeBtn, paymentMode === m && styles.modeBtnActive]}
                                        onPress={() => setPaymentMode(m)}
                                    >
                                        <Text style={[styles.modeBtnText, paymentMode === m && styles.modeBtnTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePayment}>
                                <Text style={styles.saveBtnText}>Save Payment</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <SuccessModal
                visible={successVisible}
                title={successTitle}
                description={successDesc}
                type={successType}
                onConfirm={onSuccessDone || undefined}
                confirmText={successType === 'error' ? 'Delete' : (successType === 'info' ? 'Confirm' : 'Done')}
                onClose={() => {
                    setSuccessVisible(false);
                }}
            />
        </View>
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Paid': return Colors.success;
        case 'Due': return Colors.danger;
        case 'Partial': return '#F59E0B';
        default: return Colors.textSecondary;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 180, // More padding for floating tab bar and footer
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    billNoLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    billNoValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 24, // Increased
        color: Colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    infoGrid: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12, // Increased slightly
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoValue: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 17, // Increased
        color: Colors.textPrimary,
    },
    section: {
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemsCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tableHeaderText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    itemTextBold: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    summaryLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    dividerSmall: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: Spacing.sm,
    },
    totalLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    totalValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.primary,
    },
    amountGrid: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'space-between',
    },
    amountBox: {
        flex: 1,
        alignItems: 'center',
    },
    amountLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    amountValueMain: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1, // Balanced 3-column
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textPrimary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        // paddingBottom set dynamically via inline style
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadow.medium,
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        height: 52,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 17,
        color: Colors.white,
    },
    secondaryBtn: {
        flex: 1,
        backgroundColor: Colors.white,
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    secondaryBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        paddingBottom: Spacing.xl + (Platform.OS === 'ios' ? 24 : 0),
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        height: 56,
        paddingHorizontal: Spacing.md,
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
    },
    modeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    modeBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    modeBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: '#EEF2FF',
    },
    modeBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    modeBtnTextActive: {
        color: Colors.primary,
        fontFamily: 'Inter-Bold',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    cancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    saveBtn: {
        flex: 2,
        height: 56,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.white,
    }
});



export default OrderDetailScreen;
