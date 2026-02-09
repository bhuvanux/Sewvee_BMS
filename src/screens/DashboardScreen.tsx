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
    IndianRupee,
    Clock,
    Users,
    ChevronRight,
    Search,
    Bell,
    CreditCard,
    X,
    LayoutGrid,
    Receipt,
    Calendar,
    Flame,
    CheckCircle2,
    ReceiptIndianRupee,
    MessageCircle,
    Phone,
    Plus,
    AlertCircle
} from 'lucide-react-native';
import { formatDate, parseDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent } from '../config/firebase';
import firestore from '@react-native-firebase/firestore';
import PaymentAttentionItem from '../components/PaymentAttentionItem';

import Constants from 'expo-constants';
import { Linking } from 'react-native';

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

    const [activeRecentTab, setActiveRecentTab] = useState<'orders' | 'payments'>('orders');

    const getDaysRemaining = (dateString: string | undefined) => {
        if (!dateString) return 999;
        const targetDate = parseDate(dateString);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

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

                if (configSnap.exists()) {
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

    // TODAY-FOCUSED CALCULATIONS
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Today's Work Snapshot
    const dueToday = orders.filter(o => {
        const deliveryDate = o.deliveryDate;
        if (!deliveryDate) return false;
        try {
            return parseDate(deliveryDate).toISOString().split('T')[0] === todayStr && o.status !== 'Completed' && o.status !== 'Cancelled';
        } catch (e) {
            return false;
        }
    }).length;

    const inProgress = orders.filter(o => o.status === 'In Progress').length;

    const completedToday = orders.filter(o => {
        const completedDate = o.updatedAt;
        if (!completedDate) return false;
        try {
            return parseDate(completedDate).toISOString().split('T')[0] === todayStr && o.status === 'Completed';
        } catch (e) {
            return false;
        }
    }).length;

    // Today's Money Snapshot
    const todaysCollection = validPayments.filter(p => {
        const paymentDate = parseDate(p.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate.getTime() === today.getTime();
    }).reduce((sum, p) => sum + p.amount, 0);

    // Payment Attention List (customers with overdue payments)
    const overdueCustomers = orders
        .filter(o => o.balance > 0 && o.status !== 'Cancelled')
        .map(o => {
            const customer = customers.find(c => c.id === o.customerId);
            const daysOverdue = getDaysRemaining(o.deliveryDate) < 0 ? Math.abs(getDaysRemaining(o.deliveryDate)) : 0;
            return {
                orderId: o.id,
                customerName: o.customerName,
                mobile: customer?.mobile || o.customerMobile,
                amountDue: o.balance,
                daysOverdue
            };
        })
        .filter(c => c.daysOverdue > 0)
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
        .slice(0, 5);

    // Order Health Overview
    const orderHealthData = orders.reduce((acc, o) => {
        if (o.status === 'Cancelled') return acc;
        const daysLeft = getDaysRemaining(o.deliveryDate);
        if (daysLeft > 2) acc.onTime++;
        else if (daysLeft >= 0 && daysLeft <= 2) acc.nearDue++;
        else if (daysLeft < 0) acc.overdue++;
        return acc;
    }, { onTime: 0, nearDue: 0, overdue: 0 });

    const totalActiveOrders = orderHealthData.onTime + orderHealthData.nearDue + orderHealthData.overdue;
    const onTimePercent = totalActiveOrders > 0 ? Math.round((orderHealthData.onTime / totalActiveOrders) * 100) : 0;

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

    // Recent Orders
    const recentOrders = orders.slice(0, 5);
    const recentPayments = payments.slice(0, 5);

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

    // Calculate Monthly Growth
    const now = new Date(); // Restore this for dateStr usage

    // Date for Header
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    console.log('Rendering Dashboard - Premium Revamp');

    // Business Snapshot Calculation (Monthly)
    const currentMonthOrders = orders.filter(o => {
        const d = parseDate(o.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const currentMonthTotal = payments.filter(p => {
        const pDate = parseDate(p.date);
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.amount, 0);

    // Completion Rate
    const completedMonthOrders = currentMonthOrders.filter(o => o.status === 'Completed').length;
    const completionRate = currentMonthOrders.length > 0
        ? Math.round((completedMonthOrders / currentMonthOrders.length) * 100)
        : 0;

    const handleCall = (mobile: string) => {
        Linking.openURL(`tel:${mobile}`);
    };

    const handleWhatsApp = (mobile: string, name: string, amount: number) => {
        const text = `Hello ${name}, your payment of ₹${amount} is pending. Please pay at your earliest convenience.`;
        Linking.openURL(`whatsapp://send?phone=${mobile}&text=${text}`);
    };

    return (
        <View style={styles.container}>
            {/* Header - Daily First */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.dateText}>{dateStr}</Text>
                        <View style={styles.userInfo}>
                            <Text style={styles.greeting}>Hello, </Text>
                            <Text style={styles.companyName}>{company?.name || 'My Boutique'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => navigation.navigate('More')}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{company?.name?.[0]?.toUpperCase() || 'S'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. Today's Work Snapshot (Priority) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Work</Text>
                </View>
                <View style={styles.statsGrid}>
                    {/* Due Today */}
                    <TouchableOpacity
                        style={[styles.statCard, styles.cardDue]}
                        onPress={() => navigation.navigate('Orders', { screen: 'OrderList', params: { filterDueToday: true } })}
                    >
                        <View style={styles.statIconWrapper}>
                            <Clock size={20} color={Colors.danger} />
                        </View>
                        <Text style={styles.statValue}>{dueToday}</Text>
                        <Text style={styles.statLabel}>Due Today</Text>
                    </TouchableOpacity>

                    {/* Overdue Orders (New) */}
                    <TouchableOpacity
                        style={[styles.statCard, styles.cardOverdue]}
                        onPress={() => navigation.navigate('Orders', { screen: 'OrderList', params: { filterHealth: 'overdue' } })}
                    >
                        <View style={styles.statIconWrapper}>
                            <AlertCircle size={20} color="#E11D48" />
                        </View>
                        <Text style={styles.statValue}>{orderHealthData.overdue}</Text>
                        <Text style={styles.statLabel}>Overdue Orders</Text>
                    </TouchableOpacity>

                    {/* In Progress */}
                    <TouchableOpacity
                        style={[styles.statCard, styles.cardProgress]}
                        onPress={() => navigation.navigate('Orders', { screen: 'OrderList', params: { filterStatus: 'In Progress' } })}
                    >
                        <View style={styles.statIconWrapper}>
                            <LayoutGrid size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.statValue}>{inProgress}</Text>
                        <Text style={styles.statLabel}>In Progress</Text>
                    </TouchableOpacity>

                    {/* Completed */}
                    <TouchableOpacity
                        style={[styles.statCard, styles.cardCompleted]}
                        onPress={() => navigation.navigate('Orders', { screen: 'OrderList', params: { filterStatus: 'Completed' } })}
                    >
                        <View style={styles.statIconWrapper}>
                            <CheckCircle2 size={20} color={Colors.success} />
                        </View>
                        <Text style={styles.statValue}>{completedToday}</Text>
                        <Text style={styles.statLabel}>Completed Today</Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Today's Money Snapshot */}
                <View style={styles.moneySnapshot}>
                    <View style={styles.moneyRow}>
                        <View style={styles.moneyItem}>
                            <Text style={styles.moneyLabel}>Today's Collection</Text>
                            <Text style={styles.moneyValue}>₹{todaysCollection.toLocaleString()}</Text>
                        </View>
                        <View style={styles.moneyDivider} />
                        <View style={styles.moneyItem}>
                            <Text style={styles.moneyLabel}>Pending Amount</Text>
                            <Text style={[styles.moneyValue, { color: pendingAmount > 0 ? Colors.danger : Colors.success }]}>
                                ₹{pendingAmount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 3. Payment Attention List (Actionable) */}
                {overdueCustomers.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Needs Attention</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{overdueCustomers.length}</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {overdueCustomers.map((customer) => (
                                <View key={customer.orderId} style={styles.overdueCardActionable}>
                                    <View style={styles.overdueHeaderRow}>
                                        <Text style={styles.overdueName} numberOfLines={1}>{customer.customerName}</Text>
                                        <Text style={styles.overdueDays}>{customer.daysOverdue} days late</Text>
                                    </View>
                                    <Text style={styles.overdueAmountLarge}>₹{customer.amountDue}</Text>

                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                                            onPress={() => handleCall(customer.mobile)}
                                        >
                                            <Phone size={16} color="#3B82F6" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]}
                                            onPress={() => handleWhatsApp(customer.mobile, customer.customerName, customer.amountDue)}
                                        >
                                            <MessageCircle size={16} color="#10B981" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.markPaidBtn}
                                            onPress={() => navigation.navigate('Payments', { orderId: customer.orderId })}
                                        >
                                            <Text style={styles.markPaidText}>Mark Paid</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 4. Quick Actions */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                    </View>
                    <View style={[styles.quickActionsRow, { paddingHorizontal: Spacing.lg }]}>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('CreateOrderFlow')}>
                            <View style={[styles.qaIcon, { backgroundColor: Colors.primary }]}>
                                <Plus size={24} color={Colors.white} />
                            </View>
                            <Text style={styles.qaLabel}>New Order</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Customers', { screen: 'AddCustomer' })}>
                            <View style={[styles.qaIcon, { backgroundColor: '#E0E7FF' }]}>
                                <Users size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.qaLabel}>Add Client</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Payments')}>
                            <View style={[styles.qaIcon, { backgroundColor: '#FEF3C7' }]}>
                                <CreditCard size={24} color="#D97706" />
                            </View>
                            <Text style={styles.qaLabel}>Collect</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Orders', { screen: 'OrderList', params: { filterDueToday: true } })}>
                            <View style={[styles.qaIcon, { backgroundColor: '#FCE7F3' }]}>
                                <Calendar size={24} color="#DB2777" />
                            </View>
                            <Text style={styles.qaLabel}>Deliveries</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 5. Business Snapshot (Analytics) */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Business Snapshot (This Month)</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.analyticsCard, { marginHorizontal: Spacing.lg }]}
                        onPress={() => navigation.navigate('Analytics')}
                    >
                        <View style={styles.acRow}>
                            <View style={styles.acItem}>
                                <Text style={styles.acLabel}>Revenue</Text>
                                <Text style={styles.acValue}>₹{currentMonthTotal.toLocaleString()}</Text>
                            </View>
                            <View style={styles.moneyDivider} />
                            <View style={styles.acItem}>
                                <Text style={styles.acLabel}>Orders</Text>
                                <Text style={styles.acValue}>{currentMonthOrders.length}</Text>
                            </View>
                            <View style={styles.moneyDivider} />
                            <View style={styles.acItem}>
                                <Text style={styles.acLabel}>Completion</Text>
                                <Text style={[styles.acValue, { color: Colors.success }]}>{completionRate}%</Text>
                            </View>
                        </View>
                        <View style={styles.acFooter}>
                            <Text style={styles.acFooterText}>Tap for deep insights</Text>
                            <ChevronRight size={14} color={Colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Recent Items Tabs */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeRecentTab === 'orders' && styles.activeTab]}
                                onPress={() => setActiveRecentTab('orders')}
                            >
                                <Text style={[styles.tabText, activeRecentTab === 'orders' && styles.activeTabText]}>Recent Orders</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeRecentTab === 'payments' && styles.activeTab]}
                                onPress={() => setActiveRecentTab('payments')}
                            >
                                <Text style={[styles.tabText, activeRecentTab === 'payments' && styles.activeTabText]}>Recent Payments</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate(activeRecentTab === 'orders' ? 'Orders' : 'Payments')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {activeRecentTab === 'orders' ? (
                        recentOrders.length === 0 ? (
                            <View style={styles.emptyRecent}>
                                <Text style={styles.emptyText}>No recent orders</Text>
                            </View>
                        ) : (
                            recentOrders.map((item) => {
                                // Logic to find earliest delivery date from items or fallback to order date
                                let targetDateVal = item.deliveryDate;
                                let daysLeft = 999;
                                let isUrgent = false;

                                if (item.items && item.items.length > 0) {
                                    const activeItems = item.items.filter((i: any) => i.status !== 'Cancelled');
                                    const hasUrgentItem = activeItems.some((i: any) => i.urgency === 'Urgent' || i.urgency === 'High');
                                    isUrgent = (item.urgency === 'Urgent' || item.urgency === 'High' || hasUrgentItem) && item.status !== 'Cancelled';

                                    const validDates = activeItems
                                        .map((i: any) => i.deliveryDate)
                                        .filter((d: any) => d)
                                        .map((d: any) => parseDate(d).getTime());

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
                                        daysLeft = item.deliveryDate ? getDaysRemaining(item.deliveryDate) : 999;
                                    }
                                } else {
                                    daysLeft = item.deliveryDate ? getDaysRemaining(item.deliveryDate) : 999;
                                    isUrgent = (item.urgency === 'Urgent' || item.urgency === 'High') && item.status !== 'Cancelled';
                                }

                                const isNearingDeadline = daysLeft >= 0 && daysLeft <= 3 && item.status !== 'Completed' && item.status !== 'Cancelled';

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.orderListItem}
                                        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                                    >
                                        <View style={styles.orderListIcon}>
                                            <Text style={styles.orderListId}>{item.billNo}</Text>
                                        </View>
                                        <View style={styles.orderListContent}>
                                            <Text style={styles.orderListName}>{item.customerName}</Text>
                                            <Text style={[styles.orderListDate, isNearingDeadline && { color: Colors.danger }]}>
                                                {isNearingDeadline && daysLeft < 500
                                                    ? `Due: ${daysLeft === 0 ? 'Today' : (daysLeft === 1 ? 'Tomorrow' : formatDate(targetDateVal))}`
                                                    : (targetDateVal ? `Delivery: ${formatDate(targetDateVal)}` : formatDate(item.date))
                                                }
                                            </Text>
                                        </View>
                                        <View style={styles.orderListRight}>
                                            <Text style={styles.orderListAmount}>₹{item.total}</Text>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )
                    ) : (
                        recentPayments.length === 0 ? (
                            <View style={styles.emptyRecent}>
                                <Text style={styles.emptyText}>No recent payments</Text>
                            </View>
                        ) : (
                            recentPayments.map((item) => {
                                const order = orders.find(o => o.id === item.orderId);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.orderListItem}
                                        onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}
                                    >
                                        <View style={[styles.orderListIcon, { backgroundColor: '#F0FDF4' }]}>
                                            <IndianRupee size={16} color={Colors.success} />
                                        </View>
                                        <View style={styles.orderListContent}>
                                            <Text style={styles.orderListName}>{order?.customerName || 'Unknown Customer'}</Text>
                                            <Text style={styles.orderListDate}>
                                                {item.mode} • Bill #{order?.billNo || 'N/A'} • {formatDate(item.date)}
                                            </Text>
                                        </View>
                                        <View style={styles.orderListRight}>
                                            <Text style={[styles.orderListAmount, { color: Colors.success }]}>₹{item.amount}</Text>
                                            <ChevronRight size={16} color={Colors.textSecondary} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

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
                                <View style={styles.emptySearchState}>
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
        backgroundColor: '#F8FAFC', // Slightly cooler white for premium feel
    },
    header: {
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        // No shadow for cleaner look, or very subtle
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    greeting: {
        fontSize: 24,
        fontFamily: 'Inter-Regular',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    companyName: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    profileBtn: {
        ...Shadow.subtle,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14, // Squircle-ish
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: Colors.white,
    },
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 40,
    },
    toolBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: 12,
    },
    searchBarButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        height: 46,
        borderRadius: 12,
        paddingHorizontal: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    iconBtn: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
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
    iconContainer: {
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
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: '#0F172A',
        // marginLeft: Spacing.lg, // Removed to fix alignment
        marginBottom: 12,
    },
    seeAll: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.primary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.lg,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (width - (Spacing.lg * 2) - 12) / 2, // 2 columns
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        ...Shadow.subtle,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardDue: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    cardOverdue: { // New style for Overdue
        backgroundColor: '#FFF1F2',
        borderColor: '#FDA4AF',
    },
    cardProgress: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    cardCompleted: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    cardMoney: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
    },
    statIconWrapper: {
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    statValue: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        color: '#64748B',
    },
    // Pending Banner
    pendingBanner: {
        marginHorizontal: Spacing.lg,
        backgroundColor: '#0F172A', // Dark theme
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Shadow.medium,
    },
    pendingLabel: {
        color: '#94A3B8',
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    pendingValue: {
        color: Colors.white,
        fontSize: 24,
        fontFamily: 'Inter-Bold',
    },
    pendingAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 4,
    },
    pendingActionText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
    },
    // Attention Section
    horizontalScroll: {
        paddingLeft: Spacing.lg,
        paddingRight: Spacing.lg,
    },
    badge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    badgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.danger,
    },
    overdueCard: {
        width: 160,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadow.subtle,
    },
    overdueHeader: {
        backgroundColor: '#FEF2F2',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
    },

    overdueName: {
        fontSize: 15,
        fontFamily: 'Inter-SemiBold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    overdueAmount: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    collectBtn: {
        backgroundColor: Colors.textPrimary,
        borderRadius: 10, // Pill shape
        paddingVertical: 8,
        alignItems: 'center',
    },
    collectBtnText: {
        color: Colors.white,
        fontSize: 13,
        fontFamily: 'Inter-SemiBold',
    },
    // Recent Orders List Styling
    orderListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        marginHorizontal: Spacing.lg,
        marginBottom: 10,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9', // Very subtle border
        ...Shadow.subtle, // Very subtle shadow
    },
    orderListIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    orderListId: {
        fontSize: 13,
        fontFamily: 'Inter-Bold',
        color: '#64748B',
    },
    orderListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    orderListName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#0F172A',
        marginBottom: 2,
    },
    orderListDate: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: '#64748B',
    },
    orderListRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    orderListAmount: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#0F172A',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    emptyRecent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        height: 100,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter-Medium',
    },
    // Search & Modals (Keep roughly same structure but updated padding)
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
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: 'Inter-Regular',
    },
    emptySearchState: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    // New Styles for Daily-First Layout
    moneySnapshot: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        marginHorizontal: Spacing.lg, // Align with other cards
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadow.subtle,
    },
    moneyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    moneyItem: {
        flex: 1,
        alignItems: 'center',
    },
    moneyLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    moneyValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
    },
    moneyDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E2E8F0',
    },
    // Overdue Actionable
    overdueCardActionable: {
        width: width * 0.75,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        ...Shadow.subtle,
    },
    overdueHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    overdueDays: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.danger,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
    },
    overdueAmountLarge: {
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 10, // Squircle
        justifyContent: 'center',
        alignItems: 'center',
    },
    markPaidBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
    },
    markPaidText: {
        fontFamily: 'Inter-SemiBold',
        color: Colors.white,
        fontSize: 14,
    },
    // Quick Actions
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    quickActionBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    qaIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.subtle,
    },
    qaLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textPrimary,
        marginTop: 4,
    },
    // Analytics Card
    analyticsCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadow.subtle,
    },
    acRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    acItem: {
        alignItems: 'center',
        flex: 1,
    },
    acLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    acValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    acFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        gap: 4,
    },
    acFooterText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    // Helper Text for search
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
    },
    tabContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    tab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.white,
    },
});

export default DashboardScreen;
