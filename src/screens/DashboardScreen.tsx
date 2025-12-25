import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import {
    Plus,
    ReceiptIndianRupee,
    IndianRupee,
    Clock,
    Users,
    TrendingUp,
    ChevronRight,
    Search,
    Bell,
    CreditCard,
    X,
    LayoutGrid,
    Phone,
    MapPin,
    Receipt,
    Calendar,
    Image as LucideImage
} from 'lucide-react-native';
import { formatDate, parseDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent } from '../config/firebase';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
    const { company, user } = useAuth();
    const { orders, customers, payments } = useData();
    const insets = useSafeAreaInsets();

    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isActivityVisible, setIsActivityVisible] = useState(false);

    const activeOrderIds = new Set(orders.map(o => o.id));
    const validPayments = payments.filter(p => activeOrderIds.has(p.orderId));

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalCollected = validPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = totalRevenue - totalCollected;

    // Calculate Monthly Growth
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Use centralized parseDate from dateUtils

    const currentMonthTotal = payments.filter(p => {
        const pDate = parseDate(p.date);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + p.amount, 0);

    const lastMonthTotal = payments.filter(p => {
        const pDate = parseDate(p.date);
        return pDate.getMonth() === lastMonth && pDate.getFullYear() === lastMonthYear;
    }).reduce((sum, p) => sum + p.amount, 0);

    let growth: number = 0;
    if (lastMonthTotal > 0) {
        growth = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (currentMonthTotal > 0) {
        growth = 0; // First month of data as requested
    }

    const growthText = growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
    const TrendIcon = growth >= 0 ? TrendingUp : TrendingUp;
    const trendColor = growth >= 0 ? Colors.white : 'rgba(255,255,255,0.8)';

    const filteredCustomers = searchQuery.length > 1
        ? customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.mobile.includes(searchQuery)
        ).slice(0, 5)
        : [];

    const filteredOrders = searchQuery.length > 1
        ? orders.filter(o =>
            o.billNo.includes(searchQuery) ||
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    const stats = [
        {
            title: "Total Orders",
            value: orders.length.toString(),
            icon: ReceiptIndianRupee,
            color: '#6366F1',
            onPress: () => navigation.navigate('Orders', { screen: 'OrderList' })
        },
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString()}`,
            icon: IndianRupee,
            color: '#10B981',
            onPress: () => {
                logEvent('revenue_card_click');
                navigation.navigate('Payments');
            }
        },
        {
            title: "Balance Due",
            value: `₹${pendingAmount.toLocaleString()}`,
            icon: Clock,
            color: '#F59E0B',
            onPress: () => {
                logEvent('balance_card_click');
                navigation.navigate('Payments');
            }
        },
        {
            title: "Customers",
            value: customers.length.toString(),
            icon: Users,
            color: '#3B82F6',
            onPress: () => navigation.navigate('Customers', { screen: 'CustomerList' })
        }
    ];

    const recentOrders = orders.slice(0, 5);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <View style={styles.headerTop}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{company?.name?.[0]?.toUpperCase() || 'S'}</Text>
                        </View>
                        <View>
                            <Text style={styles.greeting}>Hello,</Text>
                            <Text style={[styles.companyName, { color: Colors.primary }]}>{company?.name || 'My Boutique'}</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => {
                                logEvent('dashboard_search_open');
                                setIsSearchVisible(true);
                            }}
                        >
                            <Search size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => setIsActivityVisible(true)}
                        >
                            <Bell size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Quick Actions at the top for better visibility */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.actionItem, styles.primaryAction]}
                        onPress={() => navigation.navigate('CreateOrderFlow')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: Colors.primary }]}>
                            <Plus size={28} color={Colors.white} />
                        </View>
                        <Text style={[styles.actionLabel, { color: Colors.primary, fontFamily: 'Inter-Bold' }]}>New Order</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Customers', { screen: 'AddCustomer' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
                            <Users size={24} color="#4F46E5" />
                        </View>
                        <Text style={styles.actionLabel}>Add Client</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Payments')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <CreditCard size={24} color="#D97706" />
                        </View>
                        <Text style={styles.actionLabel}>Payment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Orders', { screen: 'OrderList' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
                            <ReceiptIndianRupee size={24} color="#DB2777" />
                        </View>
                        <Text style={styles.actionLabel}>Orders List</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Stats Card */}
                <View style={styles.mainCard}>
                    <View style={styles.mainCardContent}>
                        <View>
                            <Text style={styles.mainCardLabel}>Total Collection</Text>
                            <Text style={styles.mainCardValue}>₹{totalCollected.toLocaleString()}</Text>
                        </View>
                        {growth !== 0 && (
                            <View style={styles.trendBadge}>
                                <TrendIcon size={16} color={trendColor} />
                                <Text style={styles.trendText}>{growthText}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.mainCardFooter}>
                        <Text style={styles.mainCardFooterText}>Monthly growth vs last month</Text>
                    </View>
                </View>

                {/* KPI Grid */}
                <View style={styles.kpiGrid}>
                    {stats.map((stat, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.kpiCard}
                            onPress={stat.onPress}
                        >
                            <View style={[styles.kpiIconContainer, { backgroundColor: stat.color + '15' }]}>
                                <stat.icon size={22} color={stat.color} />
                            </View>
                            <Text style={styles.kpiLabel}>{stat.title}</Text>
                            <Text style={styles.kpiValue}>{stat.value}</Text>
                        </TouchableOpacity>
                    ))}
                </View>


                {/* Recent Items */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Orders', { screen: 'OrderList' })}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {recentOrders.length === 0 ? (
                    <View style={styles.emptyRecent}>
                        <Text style={styles.emptyText}>No recent orders found</Text>
                    </View>
                ) : (
                    recentOrders.map((order) => (
                        <TouchableOpacity
                            key={order.id}
                            style={styles.recentItem}
                            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                        >
                            <View style={styles.recentLeft}>
                                <View style={styles.recentIcon}>
                                    <ReceiptIndianRupee size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.recentName}>{order.customerName}</Text>
                                    <Text style={styles.recentDate}>
                                        {formatDate(order.date || order.createdAt || new Date().toISOString())} •
                                        <Text style={{ fontFamily: 'Inter-Bold', color: Colors.primary }}> #{order.billNo}</Text>
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.recentRight}>
                                <Text style={styles.recentAmount}>₹{order.total}</Text>
                                <ChevronRight size={18} color={Colors.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Float Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateOrderFlow')}
            >
                <Plus size={28} color={Colors.white} />
            </TouchableOpacity>

            {/* Search Modal */}
            <Modal
                visible={isSearchVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => {
                    setIsSearchVisible(false);
                    setSearchQuery('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchHeader}>
                            <View style={styles.searchBar}>
                                <Search size={18} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholderTextColor={Colors.textSecondary}
                                    placeholder="Search Order No or Customer..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <X size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => {
                                setIsSearchVisible(false);
                                setSearchQuery('');
                            }}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.searchResults}>
                            {searchQuery.length > 1 && (
                                <>
                                    {filteredOrders.length > 0 && (
                                        <View style={styles.searchSection}>
                                            <Text style={styles.searchSectionTitle}>Orders</Text>
                                            {filteredOrders.map(o => (
                                                <TouchableOpacity
                                                    key={o.id}
                                                    style={styles.searchResultItem}
                                                    onPress={() => {
                                                        setIsSearchVisible(false);
                                                        setSearchQuery('');
                                                        navigation.navigate('OrderDetail', { orderId: o.id });
                                                    }}
                                                >
                                                    <View style={styles.searchResultIcon}>
                                                        <ReceiptIndianRupee size={18} color={Colors.primary} />
                                                    </View>
                                                    <View>
                                                        <Text style={styles.searchResultTitle}>Order #{o.billNo}</Text>
                                                        <Text style={styles.searchResultSub}>{formatDate(o.date)} • {o.customerName}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {filteredCustomers.length > 0 && (
                                        <View style={styles.searchSection}>
                                            <Text style={styles.searchSectionTitle}>Customers</Text>
                                            {filteredCustomers.map(c => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    style={styles.searchResultItem}
                                                    onPress={() => {
                                                        setIsSearchVisible(false);
                                                        setSearchQuery('');
                                                        navigation.navigate('Customers', { screen: 'CustomerDetail', params: { customer: c } });
                                                    }}
                                                >
                                                    <View style={[styles.searchResultIcon, { backgroundColor: '#EFF6FF' }]}>
                                                        <Users size={18} color="#3B82F6" />
                                                    </View>
                                                    <View>
                                                        <Text style={styles.searchResultTitle}>{c.name}</Text>
                                                        <Text style={styles.searchResultSub}>{c.mobile}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {filteredOrders.length === 0 && filteredCustomers.length === 0 && (
                                        <View style={styles.noResults}>
                                            <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
                                        </View>
                                    )}
                                </>
                            )}
                            {searchQuery.length <= 1 && (
                                <View style={styles.searchPlaceholder}>
                                    <View style={styles.searchPlaceholderIcon}>
                                        <Search size={40} color={Colors.border} />
                                    </View>
                                    <Text style={styles.searchPlaceholderText}>Start typing to search bills or customers</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Activity Modal */}
            <Modal
                visible={isActivityVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsActivityVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetHandle} />
                            <View style={styles.sheetHeaderRow}>
                                <Text style={styles.sheetTitle}>Recent Activity</Text>
                                <TouchableOpacity onPress={() => setIsActivityVisible(false)}>
                                    <X size={24} color={Colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView style={styles.activityList} contentContainerStyle={{ paddingBottom: 40 }}>
                            {orders.length === 0 ? (
                                <View style={styles.noActivity}>
                                    <Bell size={40} color={Colors.border} />
                                    <Text style={styles.noActivityText}>No recent activity yet</Text>
                                </View>
                            ) : (
                                orders.slice(0, 10).map(order => (
                                    <View key={order.id} style={styles.activityItem}>
                                        <View style={[styles.activityIcon, { backgroundColor: order.status === 'Paid' ? '#D1FAE5' : '#FEF3C7' }]}>
                                            <Clock size={16} color={order.status === 'Paid' ? '#10B981' : '#F59E0B'} />
                                        </View>
                                        <View style={styles.activityContent}>
                                            <Text style={styles.activityText}>
                                                <Text style={styles.boldText}>{order.customerName}</Text>'s order <Text style={styles.boldText}>#{order.billNo}</Text> was created.
                                            </Text>
                                            <Text style={styles.activityTime}>{order.date}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
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
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...Shadow.medium,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    avatarText: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: Colors.primary,
    },
    greeting: {
        fontSize: 15,
        fontFamily: 'Inter-Regular',
        color: Colors.textSecondary,
    },
    companyName: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: Spacing.lg,
        paddingBottom: 40,
    },
    mainCard: {
        backgroundColor: Colors.primary,
        marginHorizontal: Spacing.lg,
        borderRadius: 24,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        ...Shadow.medium,
    },
    mainCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainCardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'Inter-Medium',
        fontSize: 18,
        marginBottom: 8,
    },
    mainCardValue: {
        color: Colors.white,
        fontFamily: 'Inter-Bold',
        fontSize: 36,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    trendText: {
        color: Colors.white,
        fontFamily: 'Inter-Bold',
        fontSize: 12,
    },
    mainCardFooter: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    mainCardFooterText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Inter-Regular',
        fontSize: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    seeAll: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.primary,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.lg,
        gap: 12,
        marginBottom: Spacing.xl,
    },
    kpiCard: {
        backgroundColor: Colors.white,
        width: (width - (Spacing.lg * 2) - 12) / 2,
        borderRadius: 20,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    kpiIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    kpiLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    kpiValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 4, // Prevent shadow crop
        paddingBottom: Spacing.md,
        marginBottom: Spacing.md,
    },
    actionItem: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.subtle,
    },
    actionLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    primaryAction: {
        transform: [{ scale: 1.05 }],
    },
    recentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.white,
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: 16,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    recentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    recentIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    recentDate: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    recentRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    recentAmount: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    emptyRecent: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: Colors.white,
        marginHorizontal: Spacing.lg,
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
    },
    searchContainer: {
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        maxHeight: '80%',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        gap: 12,
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: Spacing.md,
        height: 44,
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
    cancelText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.primary,
    },
    searchResults: {
        paddingHorizontal: Spacing.lg,
    },
    searchSection: {
        marginBottom: 20,
    },
    searchSectionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchResultIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    searchResultTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    searchResultSub: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    noResults: {
        padding: 40,
        alignItems: 'center',
    },
    noResultsText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    searchPlaceholder: {
        padding: 60,
        alignItems: 'center',
    },
    searchPlaceholderIcon: {
        marginBottom: 16,
    },
    searchPlaceholderText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    bottomSheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 'auto',
        maxHeight: '70%',
    },
    sheetHeader: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        marginBottom: 16,
    },
    sheetHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: Spacing.lg,
    },
    sheetTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
    },
    activityList: {
        paddingHorizontal: Spacing.lg,
    },
    activityItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textPrimary,
        lineHeight: 20,
    },
    boldText: {
        fontFamily: 'Inter-SemiBold',
    },
    activityTime: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    noActivity: {
        padding: 60,
        alignItems: 'center',
    },
    noActivityText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 16,
    }
});

export default DashboardScreen;
