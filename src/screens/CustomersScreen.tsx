import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Modal,
    Platform
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Plus, Search, ChevronRight, User, Phone, ShoppingBag, ListFilter, ChevronLeft, Calendar, X, Check } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent } from '../config/firebase';
import { parseDate, formatDate } from '../utils/dateUtils';
import AlertModal from '../components/AlertModal';

const { width } = Dimensions.get('window');

const CustomersScreen = ({ navigation }: any) => {
    const { customers, loading } = useData();
    const { user } = useData() as any; // Access user from context if available, or just assume auth
    // Wait, useAuth is better source for user
    const { user: authUser } = require('../context/AuthContext').useAuth();

    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'Name' | 'DateNew' | 'Orders'>('Name');
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: '2-digit' });

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    const filteredCustomers = customers.filter(c => {
        // If searching, bypass month filter
        if (!search.trim()) {
            // SHOW ALL CLIENTS BY DEFAULT
            // Month filter was hiding existing clients. disabling it for now.
            return true;
        }

        const query = search.toLowerCase();
        return c.name.toLowerCase().includes(query) ||
            c.mobile.includes(query);
    }).sort((a, b) => {
        if (sortBy === 'Name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'DateNew') {
            const dateA = a.createdAt ? parseDate(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? parseDate(b.createdAt).getTime() : 0;
            return dateB - dateA;
        } else if (sortBy === 'Orders') {
            return (b.totalOrders || 0) - (a.totalOrders || 0);
        }
        return 0;
    });

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.customerCard}
            onPress={() => navigation.navigate('CustomerDetail', { customer: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <View style={styles.mobileRow}>
                        <Phone size={12} color={Colors.textSecondary} />
                        <Text style={styles.customerMobile}>{item.mobile}</Text>
                    </View>
                </View>
                <View style={[styles.badgeContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={styles.badgeText}>{(item.displayId || item.id).replace(/^#/, '')}</Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.statsContainer}>
                    <ShoppingBag size={14} color={Colors.primary} />
                    <Text style={styles.statsText}>{item.totalOrders || 0} Orders</Text>
                </View>
                <ChevronRight size={18} color={Colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.screenTitle}>Clients</Text>

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
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, { backgroundColor: Colors.primary, marginLeft: 8 }]}
                        onPress={() => {
                            logEvent('add_customer_click');
                            navigation.navigate('AddCustomer');
                        }}
                    >
                        <Plus size={20} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholderTextColor={Colors.textSecondary}
                        placeholder="Search Clients..."
                        value={search}
                        onChangeText={(text) => {
                            setSearch(text);
                            if (text.length > 2) {
                                logEvent('customer_search', { query: text });
                            }
                        }}
                    />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>Total: </Text>
                        {customers.length}
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statText}>
                        <Text style={{ color: Colors.textSecondary }}>New: </Text>
                        <Text style={{ color: Colors.primary }}>{filteredCustomers.length}</Text>
                    </Text>
                </View>
            </View>

            <FlatList
                data={filteredCustomers}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <User size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No Customers Found</Text>
                        <Text style={styles.emptySub}>
                            {search ? 'Try adjusting your search' : 'Add your first customer to get started'}
                        </Text>
                    </View>
                }
            />

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
                    <View style={[
                        styles.modalContent,
                        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 80 : 32) }
                    ]}>
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
                                <Text style={styles.groupLabel}>Sort By</Text>
                                <View style={styles.chipGrid}>
                                    {[
                                        { label: 'Name (A-Z)', value: 'Name' },
                                        { label: 'Newest First', value: 'DateNew' },
                                        { label: 'Most Orders', value: 'Orders' },
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
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 120,
    },
    customerCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    headerLeft: {
        flex: 1,
    },
    customerName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    mobileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    customerMobile: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    badgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.primary,
    },
    fab: {
        position: 'absolute',
        bottom: 110,
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        gap: 16,
    },
    emptyText: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textSecondary,
    },
    emptySub: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
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
        ...Shadow.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    closeBtn: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    filterGroup: {
        marginBottom: 24,
    },
    groupLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 12,
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
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    filterChipTextActive: {
        color: Colors.white,
        fontFamily: 'Inter-Bold',
    },
    applyBtn: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        ...Shadow.small,
    },
    applyBtnText: {
        color: Colors.white,
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});

export default CustomersScreen;
