import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
    Modal,
    ScrollView
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Search, ListFilter, ChevronRight, Calendar, Clock, Receipt, User, ArrowLeft, X, SlidersHorizontal, ArrowUpDown, Check, ChevronLeft, ReceiptIndianRupee, Plus, Flame } from 'lucide-react-native';
import { formatDate, parseDate } from '../utils/dateUtils';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OrdersListScreen = ({ navigation }: any) => {
    const { orders } = useData();
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');
    const [filterOrderStatus, setFilterOrderStatus] = useState<'All' | 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'>('All');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<'All' | 'Paid' | 'Unpaid'>('All');
    const [sortBy, setSortBy] = useState<'DateDesc' | 'DateAsc' | 'AmountDesc' | 'AmountAsc'>('DateDesc');
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: '2-digit' });

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    const isFilterActive = filterOrderStatus !== 'All' || filterPaymentStatus !== 'All' || sortBy !== 'DateDesc';

    const filteredOrders = orders.filter(o => {
        // 1. Filter by Month
        const oDate = parseDate(o.date);
        const isSameMonth = oDate.getMonth() === currentDate.getMonth() && oDate.getFullYear() === currentDate.getFullYear();
        if (!isSameMonth) return false;

        // 2. Filter by Order Status
        if (filterOrderStatus !== 'All' && o.status !== filterOrderStatus) return false;

        // 3. Filter by Payment Status
        if (filterPaymentStatus !== 'All') {
            const isPaid = o.balance <= 0;
            if (filterPaymentStatus === 'Paid' && !isPaid) return false;
            if (filterPaymentStatus === 'Unpaid' && isPaid) return false;
        }

        // 4. Filter by Search Query
        const query = search.toLowerCase();
        return (o.billNo?.toLowerCase().includes(query) ?? false) ||
            (o.customerName?.toLowerCase().includes(query) ?? false);
    }).sort((a, b) => {
        // Sort Logic
        const dateA = a.date ? parseDate(a.date).getTime() : 0;
        const dateB = b.date ? parseDate(b.date).getTime() : 0;

        if (sortBy === 'DateDesc' || sortBy === 'DateAsc') {
            return sortBy === 'DateDesc' ? dateB - dateA : dateA - dateB;
        } else {
            return sortBy === 'AmountDesc' ? b.total - a.total : a.total - b.total;
        }
    });

    const totals = filteredOrders.reduce((acc: any, current: any) => {
        acc.total += current.total;
        acc.advance += current.advance;
        acc.balance += current.balance;
        return acc;
    }, { total: 0, advance: 0, balance: 0 });

    const getDaysRemaining = (dateString: string | undefined) => {
        if (!dateString) return 999;
        const targetDate = parseDate(dateString);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const renderItem = ({ item }: any) => {
        const daysLeft = getDaysRemaining(item.deliveryDate);
        const isNearingDeadline = daysLeft >= 0 && daysLeft <= 3 && item.status !== 'Completed' && item.status !== 'Cancelled';
        const isUrgent = item.urgency === 'Urgent' || item.urgency === 'High'; // Handle legacy values if any

        return (
            <TouchableOpacity
                style={[
                    styles.orderCard,
                    isNearingDeadline && { borderColor: '#FECACA', backgroundColor: '#FEF2F2', borderWidth: 1.5 }
                ]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
                <View style={styles.orderHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.billNo}>Order No: #{item.billNo}</Text>
                        {isUrgent && (
                            <View style={{ backgroundColor: '#FEE2E2', padding: 4, borderRadius: 12 }}>
                                <Flame size={14} color={Colors.danger} fill={Colors.danger} />
                            </View>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.orderContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.customerName}>{item.customerName}</Text>
                        <View style={styles.dateRow}>
                            <Calendar size={12} color={isNearingDeadline ? Colors.danger : Colors.textSecondary} />
                            <Text style={[styles.dateText, isNearingDeadline && { color: Colors.danger, fontFamily: 'Inter-SemiBold' }]}>
                                {item.deliveryDate ? `Delivery: ${formatDate(item.deliveryDate)}` : formatDate(item.date || item.createdAt)}
                            </Text>
                        </View>
                        {isNearingDeadline && (
                            <Text style={{ fontSize: 11, color: Colors.danger, fontFamily: 'Inter-Medium', marginTop: 2 }}>
                                {daysLeft === 0 ? 'Delivery Today' : `Due in ${daysLeft} days`}
                            </Text>
                        )}
                    </View>
                    <View style={styles.amountArea}>
                        <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                            <Text style={styles.amount}>₹{item.total}</Text>
                            {item.balance > 0 ? (
                                <Text style={styles.balanceTag}>Due: ₹{item.balance}</Text>
                            ) : (
                                <Text style={[styles.balanceTag, { color: Colors.success }]}>Paid</Text>
                            )}
                        </View>
                        <ChevronRight size={18} color={Colors.textSecondary} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress': return '#3B82F6'; // Blue
            case 'Trial': return '#8B5CF6'; // Purple
            case 'Overdue': return Colors.danger;
            case 'Cancelled': return '#6B7280'; // Gray
            case 'Completed': return Colors.success;
            case 'Pending': return '#F59E0B'; // Amber
            default: return '#6B7280';
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                {/* Row 1: Title + Month + Filter */}
                <View style={styles.headerTop}>
                    <Text style={styles.screenTitle}>Orders</Text>

                    <View style={styles.monthSelector}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
                            <ChevronLeft size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>{monthName}</Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
                            <ChevronRight size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.filterBtn, isFilterVisible && styles.filterBtnActive]}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <ListFilter size={20} color={isFilterVisible ? Colors.white : Colors.textPrimary} />
                        {isFilterActive && (
                            <View style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: Colors.primary,
                                borderWidth: 2,
                                borderColor: Colors.white
                            }} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, { backgroundColor: Colors.primary, marginLeft: 8 }]}
                        onPress={() => navigation.navigate('CreateOrderFlow')}
                    >
                        <Plus size={20} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholderTextColor={Colors.textSecondary}
                        placeholder="Search Orders..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Row 3: Compact Stats */}
                <View style={styles.statsRow}>
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Orders: </Text>
                        {filteredOrders.length}
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Total: </Text>
                        ₹{totals.total.toLocaleString()}
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Paid: </Text>
                        <Text style={{ color: Colors.success }}>₹{totals.advance.toLocaleString()}</Text>
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Due: </Text>
                        <Text style={{ color: totals.balance > 0 ? Colors.danger : Colors.success }}>₹{totals.balance.toLocaleString()}</Text>
                    </Text>
                </View>
            </View>

            {/* Filter Modal */}
            <Modal
                visible={isFilterVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFilterVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsFilterVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter & Sort</Text>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setIsFilterVisible(false)}
                            >
                                <X size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* 1. Order Status */}
                            <View style={styles.filterGroup}>
                                <Text style={styles.groupLabel}>Order Status</Text>
                                <View style={styles.chipGrid}>
                                    {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(status => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[styles.filterChip, filterOrderStatus === status && styles.filterChipActive]}
                                            onPress={() => setFilterOrderStatus(status as any)}
                                        >
                                            <Text style={[styles.filterChipText, filterOrderStatus === status && styles.filterChipTextActive]}>
                                                {status}
                                            </Text>
                                            {filterOrderStatus === status && <Check size={14} color={Colors.white} style={{ marginLeft: 4 }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* 2. Payment Status */}
                            <View style={styles.filterGroup}>
                                <Text style={styles.groupLabel}>Payment Status</Text>
                                <View style={styles.chipGrid}>
                                    {['All', 'Paid', 'Unpaid'].map(status => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[styles.filterChip, filterPaymentStatus === status && styles.filterChipActive]}
                                            onPress={() => setFilterPaymentStatus(status as any)}
                                        >
                                            <Text style={[styles.filterChipText, filterPaymentStatus === status && styles.filterChipTextActive]}>
                                                {status}
                                            </Text>
                                            {filterPaymentStatus === status && <Check size={14} color={Colors.white} style={{ marginLeft: 4 }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* 3. Sort By */}
                            <View style={styles.filterGroup}>
                                <Text style={styles.groupLabel}>Sort By</Text>
                                <View style={styles.chipGrid}>
                                    {[
                                        { label: 'Date Newest', value: 'DateDesc' },
                                        { label: 'Date Oldest', value: 'DateAsc' },
                                        { label: 'High Amount', value: 'AmountDesc' },
                                        { label: 'Low Amount', value: 'AmountAsc' },
                                    ].map(sort => (
                                        <TouchableOpacity
                                            key={sort.value}
                                            style={[styles.filterChip, sortBy === sort.value && styles.filterChipActive]}
                                            onPress={() => setSortBy(sort.value as any)}
                                        >
                                            <Text style={[styles.filterChipText, sortBy === sort.value && styles.filterChipTextActive]}>
                                                {sort.label}
                                            </Text>
                                            {sortBy === sort.value && <Check size={14} color={Colors.white} style={{ marginLeft: 4 }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => setIsFilterVisible(false)}
                            >
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Month Selector */}




            <FlatList
                data={filteredOrders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={<View style={{ height: 160 }} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ReceiptIndianRupee size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No orders found</Text>
                    </View>
                }
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
    filterBtn: {
        padding: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginLeft: 8,
    },
    filterBtnActive: {
        backgroundColor: Colors.primary,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 50,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        color: Colors.textPrimary,
    },
    closeBtn: {
        padding: 4,
    },
    modalBody: {
        padding: 24,
        gap: 32,
    },
    filterGroup: {
        gap: 16,
    },
    groupLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    filterChipTextActive: {
        color: Colors.white,
        fontFamily: 'Inter-Bold',
    },
    applyBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        ...Shadow.medium,
    },
    applyBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.white,
    },
    summarySection: {
        padding: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    amountGrid: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'space-between',
        ...Shadow.subtle,
    },
    amountBox: {
        flex: 1,
        alignItems: 'center',
    },
    amountLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    amountValueMain: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    listContent: {
        padding: Spacing.md,
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
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    billNo: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
    },
    orderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    dateText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    amountArea: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amount: {
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        color: Colors.primary,
    },
    balanceTag: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.danger,
    },
    fab: {
        position: 'absolute',
        bottom: 110, // Position above the floating tab bar
        right: Spacing.lg,
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...Shadow.medium,
    },
    fabText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
    }
});

export default OrdersListScreen;
