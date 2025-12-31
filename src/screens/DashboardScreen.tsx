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
    Image as LucideImage,
    Flame
} from 'lucide-react-native';
import { formatDate, parseDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent } from '../config/firebase';

import Constants from 'expo-constants';
import { Linking } from 'react-native';
import { firestore } from '../config/firebase';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
    const { company, user } = useAuth();
    const { orders, customers, payments } = useData();
    const insets = useSafeAreaInsets();

    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isActivityVisible, setIsActivityVisible] = useState(false);

    // Update State
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateUrl, setUpdateUrl] = useState('');
    const [updateMessage, setUpdateMessage] = useState('New update available!');

    // Check for Updates
    React.useEffect(() => {
        const checkUpdate = async () => {
            try {
                // Determine current version code (Android) or build number (iOS)
                const currentVersionCode = Platform.OS === 'android'
                    ? Constants.expoConfig?.android?.versionCode || 1
                    : parseInt(Constants.expoConfig?.ios?.buildNumber || '1');

                const configRef = firestore().collection('settings').doc('app_config');
                const configSnap = await configRef.get();

                if (configSnap.exists) {
                    const data = configSnap.data();
                    if (data) {
                        const latestVersionCode = Platform.OS === 'android'
                            ? data.androidVersionCode || 0
                            : parseInt(data.iosBuildNumber || '0');

                        if (latestVersionCode > currentVersionCode) {
                            setUpdateAvailable(true);
                            setUpdateUrl(data.updateUrl || 'https://play.google.com/store/apps/details?id=com.sewvee.app');
                            if (data.message) setUpdateMessage(data.message);
                        }
                    }
                }
            } catch (error) {
                console.log('Error checking for updates:', error);
            }
        };

        checkUpdate();
    }, []);

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
            (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.mobile || '').includes(searchQuery)
        ).slice(0, 5)
        : [];

    const filteredOrders = searchQuery.length > 1
        ? orders.filter(o =>
            (o.billNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase())
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

    const recentActivities = [
        ...orders.map(o => ({
            id: `ord-${o.id}`,
            type: 'order',
            title: `Order #${o.billNo} Created`,
            subtitle: `${o.customerName} - ₹${o.total}`,
            date: o.date || o.createdAt,
            timestamp: parseDate(o.date || o.createdAt).getTime(),
            icon: Clock, // Placeholder, will set in render
            color: '#3B82F6',
            data: o
        })),
        ...payments.map(p => ({
            id: `pay-${p.id}`,
            type: 'payment',
            title: `Payment Received`,
            subtitle: `₹${p.amount} from ${orders.find(o => o.id === p.orderId)?.customerName || 'Unknown'}`,
            date: p.date,
            timestamp: parseDate(p.date).getTime(),
            icon: CreditCard,
            color: '#10B981',
            data: p
        }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

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

    const getDaysRemaining = (dateString: string | undefined) => {
        if (!dateString) return 999;
        const targetDate = parseDate(dateString);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

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
                {/* Update Banner */}
                {updateAvailable && (
                    <View style={styles.updateBanner}>
                        <View style={styles.updateContent}>
                            <View style={styles.updateIconContainer}>
                                <Flame size={24} color={Colors.white} fill={Colors.white} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.updateTitle}>{updateMessage}</Text>
                                <Text style={styles.updateSubtitle}>Tap to update now</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.updateButton}
                                onPress={() => Linking.openURL(updateUrl)}
                            >
                                <Text style={styles.updateButtonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
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
                    recentOrders.map((item) => {
                        // Logic to find earliest delivery date from items or fallback to order date
                        let targetDateVal = item.deliveryDate;
                        let daysLeft = 999;
                        let isUrgent = false;

                        if (item.items && item.items.length > 0) {
                            const activeItems = item.items.filter((i: any) => i.status !== 'Cancelled');

                            // Check urgency
                            const hasUrgentItem = activeItems.some((i: any) => i.urgency === 'Urgent' || i.urgency === 'High');
                            // Determine if the order itself is urgent (top level or via any item)
                            isUrgent = (item.urgency === 'Urgent' || item.urgency === 'High' || hasUrgentItem) && item.status !== 'Cancelled';

                            // Valid dates from active items
                            const validDates = activeItems
                                .map((i: any) => i.deliveryDate)
                                .filter((d: any) => d)
                                .map((d: string) => parseDate(d).getTime());

                            if (validDates.length > 0) {
                                const minDate = Math.min(...validDates);
                                targetDateVal = new Date(minDate).toISOString();

                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const tDate = new Date(minDate);
                                tDate.setHours(0, 0, 0, 0);
                                const diff = tDate.getTime() - today.getTime();
                                daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            } else {
                                // Fallback to order delivery date if exists
                                daysLeft = item.deliveryDate ? getDaysRemaining(item.deliveryDate) : 999;
                            }
                        } else {
                            // Fallback if no items
                            daysLeft = item.deliveryDate ? getDaysRemaining(item.deliveryDate) : 999;
                            isUrgent = (item.urgency === 'Urgent' || item.urgency === 'High') && item.status !== 'Cancelled';
                        }

                        // Re-verify isNearing based on calculated daysLeft
                        const isNearingDeadline = daysLeft >= 0 && daysLeft <= 3 && item.status !== 'Completed' && item.status !== 'Cancelled';

                        return (
                            <TouchableOpacity
                                key={item.id}
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
                                    {item.items && item.items.length > 1 ? (
                                        <View style={{ flexDirection: 'row', gap: 6 }}>
                                            {Object.entries(item.items.reduce((acc: any, i: any) => {
                                                const s = i.status || 'Pending';
                                                acc[s] = (acc[s] || 0) + 1;
                                                return acc;
                                            }, {})).map(([status, count]: any) => (
                                                <View key={status} style={{
                                                    backgroundColor: getStatusColor(status),
                                                    width: 22, height: 22, borderRadius: 11,
                                                    justifyContent: 'center', alignItems: 'center',
                                                    borderWidth: 1, borderColor: 'white',
                                                    ...Shadow.subtle
                                                }}>
                                                    <Text style={{ color: 'white', fontSize: 11, fontFamily: 'Inter-Bold' }}>{count}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.orderContent}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.customerName}>{item.customerName}</Text>
                                        <View style={styles.dateRow}>
                                            <Calendar size={12} color={isNearingDeadline ? Colors.danger : Colors.textSecondary} />
                                            <Text style={[styles.dateText, isNearingDeadline && { color: Colors.danger, fontFamily: 'Inter-SemiBold' }]}>
                                                {isNearingDeadline && daysLeft < 500
                                                    ? `Due: ${daysLeft === 0 ? 'Today' : (daysLeft === 1 ? 'Tomorrow' : formatDate(targetDateVal))}`
                                                    : (targetDateVal ? `Delivery: ${formatDate(targetDateVal)}` : formatDate(item.date))
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.amountArea}>
                                        <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                                            <Text style={[
                                                styles.amount,
                                                item.status === 'Cancelled' && { textDecorationLine: 'line-through', color: Colors.textSecondary }
                                            ]}>
                                                ₹{item.total}
                                            </Text>
                                            {item.status !== 'Cancelled' && (
                                                item.balance > 0 ? (
                                                    <Text style={[styles.balanceTag, { fontSize: 13 }]}>Due: ₹{item.balance}</Text>
                                                ) : (
                                                    <Text style={[styles.balanceTag, { color: Colors.success, fontSize: 13 }]}>Paid</Text>
                                                )
                                            )}
                                        </View>
                                        <ChevronRight size={18} color={Colors.textSecondary} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
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
                            {recentActivities.length === 0 ? (
                                <View style={styles.noActivity}>
                                    <Bell size={40} color={Colors.border} />
                                    <Text style={styles.noActivityText}>No recent activity yet</Text>
                                </View>
                            ) : (
                                recentActivities.map(activity => (
                                    <View key={activity.id} style={styles.activityItem}>
                                        <View style={[styles.activityIcon, { backgroundColor: activity.type === 'payment' ? '#DCFCE7' : '#EFF6FF' }]}>
                                            {activity.type === 'payment' ? (
                                                <CreditCard size={16} color="#10B981" />
                                            ) : (
                                                <Receipt size={16} color="#3B82F6" />
                                            )}
                                        </View>
                                        <View style={styles.activityContent}>
                                            <Text style={styles.activityText}>
                                                <Text style={styles.boldText}>{activity.title}</Text>
                                            </Text>
                                            <Text style={[styles.activityText, { fontSize: 13, color: Colors.textSecondary, marginTop: 2 }]}>
                                                {activity.subtitle}
                                            </Text>
                                            <Text style={styles.activityTime}>{formatDate(activity.date)}</Text>
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
    // Update Banner Styles
    updateBanner: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        overflow: 'hidden'
    },
    updateContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12
    },
    updateIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    updateTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: '#1E3A8A'
    },
    updateSubtitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#3B82F6'
    },
    updateButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    updateButtonText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 14
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
        marginTop: 18,
    },
    seeAll: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.primary,
        marginTop: 18,
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
    orderCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        marginHorizontal: Spacing.lg,
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
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    cancelText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.primary,
    },
    searchResults: {
        paddingHorizontal: Spacing.lg,
    },
    searchSection: {
        marginBottom: 24,
    },
    searchSectionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 16,
    },
    searchResultIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    searchResultSub: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    noResults: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noResultsText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    searchPlaceholder: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    searchPlaceholderIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchPlaceholderText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        maxWidth: 200,
    },
    bottomSheet: {
        backgroundColor: Colors.white,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '80%',
        ...Shadow.large,
    },
    sheetHeader: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sheetTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
    },
    activityList: {
        padding: 24,
    },
    activityItem: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 24,
    },
    activityText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
        lineHeight: 22,
    },
    boldText: {
        fontFamily: 'Inter-Bold',
    },
    activityTime: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    noActivity: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    noActivityText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
    }
});

export default DashboardScreen;
