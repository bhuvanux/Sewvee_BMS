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
import { Search, Filter, ChevronRight, Calendar, Clock, Receipt, User, ArrowLeft, X, SlidersHorizontal, ArrowUpDown, Check, ChevronLeft, ReceiptIndianRupee, Plus } from 'lucide-react-native';
import { formatDate, parseDate } from '../utils/dateUtils';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OrdersListScreen = ({ navigation }: any) => {
    const { orders } = useData();
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Due' | 'Partial'>('All');
    const [sortBy, setSortBy] = useState<'DateDesc' | 'DateAsc' | 'AmountDesc' | 'AmountAsc'>('DateDesc');
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: '2-digit' }); // Compact date

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    const filteredOrders = orders.filter(o => {
        // First filter by month
        const oDate = parseDate(o.date);

        const isSameMonth = oDate.getMonth() === currentDate.getMonth() && oDate.getFullYear() === currentDate.getFullYear();

        if (!isSameMonth) return false;

        // Filter by status
        if (filterStatus !== 'All' && o.status !== filterStatus) return false;

        // Then filter by search query
        return o.billNo.includes(search) ||
            o.customerName.toLowerCase().includes(search.toLowerCase());
    }).sort((a, b) => {
        const dateA = parseDate(a.date).getTime();
        const dateB = parseDate(b.date).getTime();

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

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.billNo}>Bill No: #{item.billNo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.orderContent}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <View style={styles.dateRow}>
                        <Calendar size={12} color={Colors.textSecondary} />
                        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                    </View>
                </View>
                <View style={styles.amountArea}>
                    <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                        <Text style={styles.amount}>₹{item.total}</Text>
                        {item.balance > 0 && (
                            <Text style={styles.balanceTag}>Due: ₹{item.balance}</Text>
                        )}
                    </View>
                    <ChevronRight size={18} color={Colors.textSecondary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return Colors.success;
            case 'Due': return Colors.danger;
            case 'Partial': return '#F59E0B'; // Amber
            default: return Colors.textSecondary;
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
                        <Filter size={20} color={isFilterVisible ? Colors.white : Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Row 2: Search */}
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
                        <Text style={{ color: Colors.textSecondary }}>Total: </Text>
                        ₹{totals.total.toLocaleString()}
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Rec: </Text>
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
                            <View style={styles.filterGroup}>
                                <Text style={styles.groupLabel}>Bill Status</Text>
                                <View style={styles.chipGrid}>
                                    {['All', 'Paid', 'Partial', 'Due'].map(status => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                                            onPress={() => setFilterStatus(status as any)}
                                        >
                                            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                                                {status}
                                            </Text>
                                            {filterStatus === status && <Check size={14} color={Colors.white} style={{ marginLeft: 4 }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

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

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateOrderFlow')}
            >
                <Plus size={24} color={Colors.white} />
                <Text style={styles.fabText}>New Order</Text>
            </TouchableOpacity>
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
        padding: Spacing.md,
        paddingBottom: Spacing.xs,
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
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 8,
    },
    monthArrow: {
        padding: 4,
    },
    monthText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
        minWidth: 80,
        textAlign: 'center',
    },
    filterBtn: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    filterBtnActive: {
        backgroundColor: Colors.primary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 12,
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
