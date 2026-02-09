import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDate, parseDate } from '../utils/dateUtils';
import DeliveryOrderCard from '../components/DeliveryOrderCard';

type FilterTab = 'today' | 'tomorrow' | 'overdue';

const TodayDeliveryScreen = ({ navigation }: any) => {
    const { orders } = useData();
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('today');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Filter orders based on active tab
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            if (order.status === 'Cancelled' || order.status === 'Completed') return false;

            const deliveryDate = order.deliveryDate;
            if (!deliveryDate) return false;

            let deliveryDateStr = '';
            try {
                deliveryDateStr = parseDate(deliveryDate).toISOString().split('T')[0];
            } catch (e) {
                return false;
            }

            if (activeFilter === 'today') {
                return deliveryDateStr === todayStr;
            } else if (activeFilter === 'tomorrow') {
                return deliveryDateStr === tomorrowStr;
            } else if (activeFilter === 'overdue') {
                const deliveryTimestamp = parseDate(deliveryDate).getTime();
                return deliveryTimestamp < today.getTime();
            }
            return false;
        });
    }, [orders, activeFilter]);

    const overdueCount = useMemo(() => {
        return orders.filter((o) => {
            if (o.status === 'Cancelled' || o.status === 'Completed') return false;
            const deliveryDate = parseDate(o.deliveryDate || '');
            deliveryDate.setHours(0, 0, 0, 0);
            return deliveryDate.getTime() < today.getTime();
        }).length;
    }, [orders]);

    const handleMarkReady = (orderId: string) => {
        // Navigate to order detail to mark ready
        navigation.navigate('OrderDetail', { orderId, action: 'markReady' });
    };

    const handleMarkDelivered = (orderId: string) => {
        // Navigate to order detail to mark delivered
        navigation.navigate('OrderDetail', { orderId, action: 'markDelivered' });
    };

    const handleCollectPayment = (orderId: string) => {
        // Navigate to payments screen
        navigation.navigate('Payments', { orderId });
    };

    const getGarmentTypes = (order: any): string[] => {
        if (!order.items || order.items.length === 0) return ['Order'];
        return order.items.map((item: any) => item.outfitType || item.category || 'Item');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Text style={styles.headerTitle}>Today's Deliveries</Text>
                <Text style={styles.headerSubtitle}>Manage your delivery schedule</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'today' && styles.filterTabActive]}
                    onPress={() => setActiveFilter('today')}
                >
                    <Calendar size={18} color={activeFilter === 'today' ? Colors.white : Colors.textPrimary} />
                    <Text style={[styles.filterTabText, activeFilter === 'today' && styles.filterTabTextActive]}>
                        Today
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'tomorrow' && styles.filterTabActive]}
                    onPress={() => setActiveFilter('tomorrow')}
                >
                    <Calendar size={18} color={activeFilter === 'tomorrow' ? Colors.white : Colors.textPrimary} />
                    <Text style={[styles.filterTabText, activeFilter === 'tomorrow' && styles.filterTabTextActive]}>
                        Tomorrow
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'overdue' && styles.filterTabActive]}
                    onPress={() => setActiveFilter('overdue')}
                >
                    <AlertCircle size={18} color={activeFilter === 'overdue' ? Colors.white : Colors.danger} />
                    <Text style={[styles.filterTabText, activeFilter === 'overdue' && styles.filterTabTextActive]}>
                        Overdue
                    </Text>
                    {overdueCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{overdueCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Orders List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <CheckCircle2 size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>All Clear!</Text>
                        <Text style={styles.emptyText}>
                            {activeFilter === 'today' && 'No deliveries scheduled for today'}
                            {activeFilter === 'tomorrow' && 'No deliveries scheduled for tomorrow'}
                            {activeFilter === 'overdue' && 'No overdue deliveries'}
                        </Text>
                    </View>
                ) : (
                    filteredOrders.map((order) => (
                        <DeliveryOrderCard
                            key={order.id}
                            orderNo={order.billNo || order.id}
                            customerName={order.customerName}
                            garmentTypes={getGarmentTypes(order)}
                            status={order.status as any}
                            amountPending={order.balance || 0}
                            deliveryDate={formatDate(order.deliveryDate)}
                            onMarkReady={() => handleMarkReady(order.id)}
                            onMarkDelivered={() => handleMarkDelivered(order.id)}
                            onCollectPayment={() => handleCollectPayment(order.id)}
                            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                        />
                    ))
                )}
            </ScrollView>
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
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...Shadow.medium,
    },
    headerTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    filterTabs: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    filterTabActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterTabText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    filterTabTextActive: {
        color: Colors.white,
    },
    badge: {
        backgroundColor: Colors.danger,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 11,
        color: Colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xs,
    },
    emptyText: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});

export default TodayDeliveryScreen;
