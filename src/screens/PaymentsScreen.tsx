import React, { useState, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    Platform,
    Dimensions,
    KeyboardAvoidingView
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import {
    Plus,
    CreditCard,
    Calendar,
    ReceiptIndianRupee,
    ChevronLeft,
    ChevronRight,
    Wallet,
    Smartphone,
    Trash2,
    Edit2,

    LogOut,
    ListFilter,
    Search,
    MoreVertical,
    MoreHorizontal
} from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useNavigation } from '@react-navigation/native';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent, firestore } from '../config/firebase';
import { getCurrentDate, formatDate, parseDate } from '../utils/dateUtils';

const PaymentsScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { payments, orders, addPayment, deletePayment, updatePayment } = useData();
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('History'); // History, Pending, Paid
    const scrollRef = useRef<ScrollView>(null);
    const { width: SCREEN_WIDTH } = Dimensions.get('window');

    const handleTabChange = (tab: string) => {
        logEvent('payments_tab_switch', { tab });

        let index = 0;
        if (tab === 'Pending') index = 1;
        if (tab === 'Paid') index = 2;

        setActiveTab(tab);
        scrollRef.current?.scrollTo({
            x: index * SCREEN_WIDTH,
            animated: true
        });
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        const tabs = ['History', 'Pending', 'Paid'];
        const newTab = tabs[index];
        if (newTab && newTab !== activeTab) {
            setActiveTab(newTab);
        }
    };

    // Success Modal state
    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    // Payment Options & Delete State
    const [paymentOptionsVisible, setPaymentOptionsVisible] = useState(false);
    const [activePayment, setActivePayment] = useState<any>(null);
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);

    // Month state
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: '2-digit' });

    // State for payment form
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('Cash');
    const [search, setSearch] = useState('');

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    // Use centralized parseDate from dateUtils

    const displayPayments = useMemo(() => {
        return payments.filter(p => {
            const pDate = parseDate(p.date);
            const isSameMonth = pDate.getMonth() === currentDate.getMonth() && pDate.getFullYear() === currentDate.getFullYear();
            if (!isSameMonth) return false;

            if (!search) return true;
            const order = orders.find(o => o.id === p.orderId);
            const query = search.toLowerCase();
            return (
                (order?.customerName || '').toLowerCase().includes(query) ||
                (order?.billNo || '').toLowerCase().includes(query) ||
                p.amount.toString().includes(query)
            );
        }).sort((a, b) => b.id.localeCompare(a.id));
    }, [payments, currentDate, search, orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const oDate = parseDate(o.date);
            return oDate.getMonth() === currentDate.getMonth() && oDate.getFullYear() === currentDate.getFullYear();
        });
    }, [orders, currentDate]);

    const getOrderMetrics = (orderId: string, total: number) => {
        const pList = payments.filter(p => p.orderId === orderId);
        const paid = pList.reduce((sum, current) => sum + current.amount, 0);
        return { paid, balance: total - paid };
    };

    const pendingOrders = useMemo(() => filteredOrders.filter(o => {
        const { balance } = getOrderMetrics(o.id, o.total);
        return balance > 0;
    }), [filteredOrders, payments]);

    const paidOrders = useMemo(() => filteredOrders.filter(o => {
        const { balance } = getOrderMetrics(o.id, o.total);
        return balance <= 0;
    }), [filteredOrders, payments]);

    const totals = useMemo(() => {
        if (activeTab === 'History') {
            const total = displayPayments.reduce((sum, p) => sum + p.amount, 0);
            const cash = displayPayments.filter(p => p.mode === 'Cash').reduce((sum, p) => sum + p.amount, 0);
            const upi = displayPayments.filter(p => p.mode === 'UPI' || p.mode === 'GPay').reduce((sum, p) => sum + p.amount, 0);
            return { total, cash, upi, advance: total, balance: 0 };
        } else {
            const targetOrders = activeTab === 'Pending' ? pendingOrders : paidOrders;
            const total = targetOrders.reduce((sum, o) => sum + o.total, 0);

            const stats = targetOrders.reduce((acc, o) => {
                const { paid, balance } = getOrderMetrics(o.id, o.total);
                return {
                    paid: acc.paid + paid,
                    balance: acc.balance + balance
                };
            }, { paid: 0, balance: 0 });

            return { total, advance: stats.paid, balance: stats.balance };
        }
    }, [activeTab, displayPayments, pendingOrders, paidOrders, payments]);

    const handleSavePayment = async () => {
        if (!selectedOrderId || !amount) {
            setAlertConfig({ title: 'Required', message: 'Please select a bill and enter amount' });
            setAlertVisible(true);
            return;
        }

        const order = orders.find(o => o.id === selectedOrderId);
        if (!order) return;

        try {
            if (isEditing && editingPaymentId) {
                await updatePayment(editingPaymentId, {
                    amount: parseFloat(amount),
                    mode
                });
                setAlertConfig({ title: 'Payment Updated', message: 'The payment record has been successfully updated.' });
            } else {
                await addPayment({
                    orderId: selectedOrderId,
                    customerId: order.customerId,
                    amount: parseFloat(amount),
                    mode,
                    date: getCurrentDate(),
                });
                setAlertConfig({ title: 'Payment Recorded', message: 'The payment has been successfully added to the bill.' });
            }
            setModalVisible(false);
            setAlertVisible(true);
            logEvent('payment_save_success', { amount: parseFloat(amount), mode });
        } catch (e) {
            setAlertConfig({ title: 'Error', message: 'Failed to save payment. Please try again.' });
            setAlertVisible(true);
        }
    };

    const confirmDelete = async () => {
        if (activePayment) {
            await deletePayment(activePayment.id);
            setDeleteSheetVisible(false);
            setActivePayment(null);
        }
    };

    const openEditModal = (payment: any) => {
        setIsEditing(true);
        setEditingPaymentId(payment.id);
        setSelectedOrderId(payment.orderId);
        setAmount(payment.amount.toString());
        setMode(payment.mode);
        setModalVisible(true);
    };

    const openPaymentModalForOrder = (order: any) => {
        setSelectedOrderId(order.id);
        setAmount(order.balance.toString());
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setIsEditing(false);
        setEditingPaymentId(null);
        setSelectedOrderId('');
        setAmount('');
        setMode('Cash');
    };

    const renderPaymentItem = ({ item }: any) => {
        const order = orders.find(o => o.id === item.orderId);

        const showOptions = () => {
            setActivePayment(item);
            setPaymentOptionsVisible(true);
        };

        return (
            <View style={styles.paymentCard}>
                <View style={styles.paymentInfo}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}
                    >
                        <Text style={styles.customerName}>{order?.customerName || 'Unknown'}</Text>
                        <View style={styles.detailRow}>
                            <ReceiptIndianRupee size={12} color={Colors.textSecondary} />
                            <Text style={styles.detailText}>Bill #{order?.billNo}</Text>
                            <Calendar size={12} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
                            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.paymentAmount}>₹{item.amount}</Text>
                            <TouchableOpacity
                                onPress={showOptions}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ padding: 4 }}
                            >
                                <MoreVertical size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.modeBadge, { backgroundColor: item.mode === 'UPI' || item.mode === 'GPay' ? '#EEF2FF' : '#F3F4F6', alignSelf: 'flex-end', marginRight: 28 }]}>
                            <Text style={[styles.modeText, { color: item.mode === 'UPI' || item.mode === 'GPay' ? '#4F46E5' : Colors.textSecondary }]}>{item.mode}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderOrderItem = ({ item }: any) => {
        const { paid, balance } = getOrderMetrics(item.id, item.total);
        return (
            <View style={styles.orderCard}>
                <TouchableOpacity
                    style={styles.orderTop}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                >
                    <View>
                        <Text style={styles.customerName}>{item.customerName}</Text>
                        <Text style={styles.billNoText}>Bill #{item.billNo} • {formatDate(item.date)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: balance > 0 ? '#FEF2F2' : '#ECFDF5' }]}>
                        <Text style={[styles.statusText, { color: balance > 0 ? Colors.danger : Colors.success }]}>
                            {balance > 0 ? 'PENDING' : 'PAID'}
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.orderStats}>
                    <View style={styles.statLine}>
                        <Text style={styles.statLabel}>Total: ₹{item.total}</Text>
                        <Text style={styles.statLabel}>Paid: ₹{paid}</Text>
                        <Text style={[styles.statLabel, { color: balance > 0 ? Colors.danger : Colors.success, fontFamily: 'Inter-Bold' }]}>
                            Bal: ₹{balance}
                        </Text>
                    </View>
                </View>
                {balance > 0 && (
                    <TouchableOpacity
                        style={styles.updatePaymentBtn}
                        onPress={() => openPaymentModalForOrder({ ...item, balance })}
                    >
                        <Plus size={16} color={Colors.primary} />
                        <Text style={styles.updatePaymentBtnText}>Update Payment</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header + Month Selector */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <Text style={styles.screenTitle}>Payments</Text>

                    <View style={styles.monthSelector}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
                            <ChevronLeft size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>{monthName}</Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
                            <ChevronRight size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.filterBtn}>
                        <ListFilter size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Search Row */}
                <View style={styles.searchContainer}>
                    <Search size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholderTextColor={Colors.textSecondary}
                        placeholder="Search Payments..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Compact Stats Row */}
                <View style={styles.statsRow}>
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Total: </Text>
                        ₹{totals.total.toLocaleString()}
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Coll: </Text>
                        <Text style={{ color: Colors.success }}>₹{totals.advance.toLocaleString()}</Text>
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Bal: </Text>
                        <Text style={{ color: totals.balance > 0 ? Colors.danger : Colors.success }}>₹{totals.balance.toLocaleString()}</Text>
                    </Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {['History', 'Pending', 'Paid'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => handleTabChange(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content List as Pager */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={{ flex: 1 }}
            >
                {/* History Tab */}
                <View style={{ width: SCREEN_WIDTH }}>
                    <FlatList
                        data={displayPayments}
                        renderItem={renderPaymentItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <ReceiptIndianRupee size={48} color={Colors.border} />
                                <Text style={styles.emptyText}>No payments recorded this month</Text>
                            </View>
                        }
                    />
                </View>

                {/* Pending Tab */}
                <View style={{ width: SCREEN_WIDTH }}>
                    <FlatList
                        data={pendingOrders}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <ReceiptIndianRupee size={48} color={Colors.border} />
                                <Text style={styles.emptyText}>No pending bills found</Text>
                            </View>
                        }
                    />
                </View>

                {/* Paid Tab */}
                <View style={{ width: SCREEN_WIDTH }}>
                    <FlatList
                        data={paidOrders}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <ReceiptIndianRupee size={48} color={Colors.border} />
                                <Text style={styles.emptyText}>No paid bills found</Text>
                            </View>
                        }
                    />
                </View>
            </ScrollView>

            {/* Payment Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={[Typography.h2, { marginBottom: Spacing.lg }]}>
                                {isEditing ? 'Edit Payment' : 'Record Payment'}
                            </Text>

                            <View style={styles.inputGroup}>
                                {selectedOrderId ? (
                                    <View style={[styles.orderCard, { borderColor: Colors.primary, backgroundColor: '#F9FAFB' }]}>
                                        <View style={{ marginBottom: 8 }}>
                                            <Text style={styles.customerName}>
                                                {orders.find(o => o.id === selectedOrderId)?.customerName}
                                            </Text>
                                            <Text style={styles.billNoText}>
                                                Order #{orders.find(o => o.id === selectedOrderId)?.billNo}
                                            </Text>
                                        </View>
                                        <View style={styles.statLine}>
                                            <Text style={styles.statLabel}>
                                                Total: ₹{orders.find(o => o.id === selectedOrderId)?.total}
                                            </Text>
                                            <Text style={styles.statLabel}>
                                                Paid: ₹{getOrderMetrics(selectedOrderId, orders.find(o => o.id === selectedOrderId)?.total || 0).paid}
                                            </Text>
                                            <Text style={[styles.statLabel, { color: Colors.danger, fontFamily: 'Inter-Bold' }]}>
                                                Bal: ₹{getOrderMetrics(selectedOrderId, orders.find(o => o.id === selectedOrderId)?.total || 0).balance}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={styles.label}>Select Order</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.billSelector}>
                                            {orders.filter(o => o.balance > 0 || o.id === selectedOrderId).map(o => (
                                                <TouchableOpacity
                                                    key={o.id}
                                                    style={[styles.billChip, selectedOrderId === o.id && styles.billChipActive]}
                                                    onPress={() => {
                                                        setSelectedOrderId(o.id);
                                                        const { balance } = getOrderMetrics(o.id, o.total);
                                                        if (!amount || isEditing) setAmount(balance.toString());
                                                    }}
                                                    disabled={isEditing}
                                                >
                                                    <Text style={[styles.billChipText, selectedOrderId === o.id && styles.billChipTextActive]}>
                                                        #{o.billNo} - {o.customerName}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Amount Received</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor={Colors.textSecondary}
                                    placeholder="₹ 0.00"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Payment Mode</Text>
                                <View style={styles.modeRow}>
                                    {['Cash', 'UPI', 'GPay', 'Card'].map(m => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                                            onPress={() => setMode(m)}
                                        >
                                            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSavePayment}>
                                    <Text style={styles.saveBtnText}>{isEditing ? 'Update' : 'Save'} Payment</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Payment Options Custom Sheet */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={paymentOptionsVisible}
                onRequestClose={() => setPaymentOptionsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setPaymentOptionsVisible(false)}
                    />
                    <View style={styles.bottomSheet}>
                        <View style={styles.bottomSheetHeader}>
                            <Text style={styles.bottomSheetTitle}>Payment Options</Text>
                            <TouchableOpacity onPress={() => setPaymentOptionsVisible(false)}>
                                <Text style={{ color: Colors.primary, fontFamily: 'Inter-SemiBold' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                setPaymentOptionsVisible(false);
                                if (activePayment) openEditModal(activePayment);
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F0F9FF' }]}>
                                <Edit2 size={20} color="#0284C7" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.optionLabel}>Edit Payment</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, { borderBottomWidth: 0 }]}
                            onPress={() => {
                                setPaymentOptionsVisible(false);
                                setDeleteSheetVisible(true);
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#FEF2F2' }]}>
                                <Trash2 size={20} color={Colors.danger} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.optionLabel, { color: Colors.danger }]}>Delete Payment</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <BottomConfirmationSheet
                visible={deleteSheetVisible}
                onClose={() => setDeleteSheetVisible(false)}
                onConfirm={confirmDelete}
                title="Delete Payment"
                description="Are you sure you want to delete this payment record? This will update the bill balance."
                confirmText="Delete Payment"
                type="danger"
            />

            <AlertModal
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    screenTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 6,
        gap: 8,
    },
    monthArrow: {
        padding: 4,
    },
    monthText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
        minWidth: 70,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 50,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    filterBtn: {
        padding: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginLeft: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textPrimary,
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#CBD5E1',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.primary,
        fontFamily: 'Inter-Bold',
    },
    analyticsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    analyticsCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    analyticsIcon: {
        marginBottom: 8,
    },
    analyticsLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    analyticsValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 110,
    },
    paymentCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    paymentInfo: {
        flexDirection: 'row',
        padding: Spacing.md,
        alignItems: 'center',
    },
    customerName: {
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    amountArea: {
        alignItems: 'flex-end',
    },
    paymentAmount: {
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        color: Colors.success,
        marginBottom: 4,
    },
    modeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    modeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingVertical: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    actionBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.primary,
    },
    orderCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    orderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    billNoText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
    },
    orderStats: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    statLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textPrimary,
    },
    updatePaymentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
        gap: 6,
    },
    updatePaymentBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    emptyText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        ...Shadow.large
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    bottomSheetTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 16
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    optionLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 4
    },

    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    billSelector: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    billChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
        backgroundColor: Colors.white,
    },
    billChipActive: {
        backgroundColor: '#EEF2FF',
        borderColor: Colors.primary,
    },
    billChipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    billChipTextActive: {
        color: Colors.primary,
        fontFamily: 'Inter-Bold',
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        height: 56,
        paddingHorizontal: Spacing.md,
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
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

export default PaymentsScreen;
