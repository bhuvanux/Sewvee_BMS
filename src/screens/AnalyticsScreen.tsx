import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';
import { TrendingUp, Users, ReceiptIndianRupee, IndianRupee, Clock, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseDate } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

type TimeFilter = 'month' | 'week' | 'today' | 'all';

const AnalyticsScreen = ({ navigation }: any) => {
    const { orders, customers, payments } = useData();
    const insets = useSafeAreaInsets();
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getFilteredData = () => {
        let startDate = new Date();
        let prevStartDate = new Date();
        const now = new Date();

        if (timeFilter === 'today') {
            startDate = new Date(today);
            prevStartDate = new Date(today);
            prevStartDate.setDate(today.getDate() - 1);
        } else if (timeFilter === 'week') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            prevStartDate = new Date(startDate);
            prevStartDate.setDate(startDate.getDate() - 7);
        } else if (timeFilter === 'month') {
            startDate = new Date(today);
            startDate.setMonth(today.getMonth());
            startDate.setDate(1);
            prevStartDate = new Date(startDate);
            prevStartDate.setMonth(startDate.getMonth() - 1);
        } else {
            startDate = new Date(0); // All time
            prevStartDate = new Date(0);
        }

        const filterByDate = (items: any[], start: Date, end?: Date) => {
            return items.filter(i => {
                const date = parseDate(i.date || i.createdAt);
                if (end) return date >= start && date < end;
                return date >= start;
            });
        };

        const currentOrders = filterByDate(orders, startDate);
        const previousOrders = filterByDate(orders, prevStartDate, timeFilter === 'all' ? undefined : startDate);
        const currentPayments = filterByDate(payments, startDate);
        const previousPayments = filterByDate(payments, prevStartDate, timeFilter === 'all' ? undefined : startDate);

        const currentRevenue = currentPayments.reduce((sum, p) => sum + p.amount, 0);
        const prevRevenue = previousPayments.reduce((sum, p) => sum + p.amount, 0);

        const currentSales = currentOrders.reduce((sum, o) => sum + o.total, 0);
        const prevSales = previousOrders.reduce((sum, o) => sum + o.total, 0);

        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // Top Outfits logic
        const outfitCounts: Record<string, { count: number, revenue: number }> = {};
        currentOrders.forEach(order => {
            if (order.items) {
                order.items.forEach((item: any) => {
                    const name = item.outfitName || 'Other';
                    if (!outfitCounts[name]) outfitCounts[name] = { count: 0, revenue: 0 };
                    outfitCounts[name].count += 1;
                    outfitCounts[name].revenue += item.rate || 0;
                });
            }
        });

        const topOutfits = Object.entries(outfitCounts)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Repeat Customer Stats
        const customerOrderCounts: Record<string, number> = {};
        orders.forEach(o => {
            customerOrderCounts[o.customerId] = (customerOrderCounts[o.customerId] || 0) + 1;
        });
        const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
        const repeatRate = customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0;

        // New Customers in period
        const newCustomers = customers.filter(c => {
            const createdDate = parseDate(c.createdAt);
            return createdDate >= startDate;
        }).length;

        return {
            ordersCount: currentOrders.length,
            ordersGrowth: calculateGrowth(currentOrders.length, previousOrders.length),
            revenue: currentRevenue,
            revenueGrowth: calculateGrowth(currentRevenue, prevRevenue),
            sales: currentSales,
            salesGrowth: calculateGrowth(currentSales, prevSales),
            pendingAmount: currentSales - currentRevenue,
            completionRate: currentOrders.length > 0
                ? Math.round((currentOrders.filter(o => o.status === 'Completed').length / currentOrders.length) * 100)
                : 0,
            topOutfits,
            repeatCustomers,
            repeatRate,
            newCustomers,
            avgOrderValue: currentOrders.length > 0 ? Math.round(currentSales / currentOrders.length) : 0
        };
    };

    const deliveryMetrics = React.useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'Completed');
        if (completedOrders.length === 0) return { avgDelay: '0', delayedPercent: 0, onTimePercent: 0 };

        let totalDelay = 0;
        let delayedCount = 0;
        let onTimeCount = 0;

        completedOrders.forEach(order => {
            if (!order.deliveryDate || !order.updatedAt) return;

            const deliveryDate = parseDate(order.deliveryDate);
            const actualDate = parseDate(order.updatedAt);

            deliveryDate.setHours(0, 0, 0, 0);
            actualDate.setHours(0, 0, 0, 0);

            const diffDays = Math.ceil((actualDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                totalDelay += diffDays;
                delayedCount++;
            } else {
                onTimeCount++;
            }
        });

        const avgDelay = delayedCount > 0 ? (totalDelay / delayedCount).toFixed(1) : '0';
        const delayedPercent = completedOrders.length > 0 ? Math.round((delayedCount / completedOrders.length) * 100) : 0;
        const onTimePercent = completedOrders.length > 0 ? Math.round((onTimeCount / completedOrders.length) * 100) : 0;

        return {
            avgDelay,
            delayedPercent,
            onTimePercent
        };
    }, [orders]);

    const data = getFilteredData();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Text style={styles.headerTitle}>Analytics</Text>
                <Text style={styles.headerSubtitle}>Business insights & performance</Text>
            </View>

            {/* Time Filter Pill Selector */}
            <View style={styles.filterBarContainer}>
                <View style={styles.pillSelector}>
                    {(['today', 'week', 'month', 'all'] as TimeFilter[]).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.pillBtn, timeFilter === filter && styles.pillBtnActive]}
                            onPress={() => setTimeFilter(filter)}
                        >
                            <Text style={[styles.pillBtnText, timeFilter === filter && styles.pillBtnTextActive]}>
                                {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Store Health Score - Major Card */}
                <View style={styles.mainScoreCard}>
                    <View style={styles.scoreInfo}>
                        <Text style={styles.scoreLabel}>Store Health Score</Text>
                        <View style={styles.scoreValueRow}>
                            <Text style={styles.scoreNumber}>{Math.round((deliveryMetrics.onTimePercent * 0.4) + (data.completionRate * 0.3) + (data.repeatRate * 0.3))}</Text>
                            <Text style={styles.scoreBasis}>/100</Text>
                        </View>
                        <View style={styles.scoreQualityBadge}>
                            <TrendingUp size={12} color={Colors.success} />
                            <Text style={styles.qualityText}>Good Performance</Text>
                        </View>
                    </View>
                    <View style={styles.scoreVisual}>
                        <View style={styles.gaugePlaceholder}>
                            <LayoutGrid size={40} color={Colors.primary} opacity={0.2} />
                        </View>
                    </View>
                </View>

                {/* Financial Overview - Modular Card */}
                <View style={styles.moduleCard}>
                    <View style={styles.moduleHeader}>
                        <ReceiptIndianRupee size={20} color={Colors.primary} />
                        <Text style={styles.moduleTitle}>Financial Overview</Text>
                    </View>
                    <View style={styles.financialGrid}>
                        <View style={styles.financialItem}>
                            <Text style={styles.finLabel}>Total Sales</Text>
                            <Text style={styles.finValue}>₹{data.sales.toLocaleString()}</Text>
                            {data.salesGrowth !== 0 && (
                                <View style={[styles.finGrowth, { backgroundColor: data.salesGrowth > 0 ? '#DCFCE7' : '#FEE2E2' }]}>
                                    <Text style={[styles.finGrowthText, { color: data.salesGrowth > 0 ? Colors.success : Colors.danger }]}>
                                        {data.salesGrowth > 0 ? '↑' : '↓'} {Math.abs(data.salesGrowth)}%
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.finDivider} />
                        <View style={styles.financialItem}>
                            <Text style={styles.finLabel}>Collections</Text>
                            <Text style={[styles.finValue, { color: Colors.success }]}>₹{data.revenue.toLocaleString()}</Text>
                            <Text style={styles.finSubtext}>{Math.round((data.revenue / (data.sales || 1)) * 100)}% efficiency</Text>
                        </View>
                    </View>
                    <View style={styles.pendingStrip}>
                        <Clock size={14} color="#B45309" />
                        <Text style={styles.pendingText}>Pending: ₹{data.pendingAmount.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Products Analysis */}
                <View style={styles.moduleCard}>
                    <View style={styles.moduleHeader}>
                        <LayoutGrid size={20} color={Colors.primary} />
                        <Text style={styles.moduleTitle}>Top Categories</Text>
                    </View>
                    {data.topOutfits.length === 0 ? (
                        <Text style={styles.emptyModuleText}>No category data yet</Text>
                    ) : (
                        data.topOutfits.map((outfit, index) => (
                            <View key={outfit.name} style={styles.rankingItem}>
                                <View style={styles.rankingInfo}>
                                    <Text style={styles.rankingName}>{outfit.name}</Text>
                                    <Text style={styles.rankingStats}>{outfit.count} orders • ₹{outfit.revenue.toLocaleString()}</Text>
                                </View>
                                <View style={styles.rankingGraph}>
                                    <View style={[styles.rankingBar, { width: `${(outfit.count / data.topOutfits[0].count) * 100}%` }]} />
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Customers & Efficiency Grid */}
                <View style={styles.bottomGrid}>
                    <View style={styles.smallModuleCard}>
                        <Users size={18} color={Colors.primary} />
                        <Text style={styles.smallCardValue}>{data.repeatRate}%</Text>
                        <Text style={styles.smallCardLabel}>Repeat Rate</Text>
                    </View>
                    <View style={styles.smallModuleCard}>
                        <CheckCircle2 size={18} color={Colors.success} />
                        <Text style={styles.smallCardValue}>{deliveryMetrics.onTimePercent}%</Text>
                        <Text style={styles.smallCardLabel}>On-Time</Text>
                    </View>
                </View>

                {/* Delivery Insight */}
                <View style={styles.insightPremiumBox}>
                    <AlertCircle size={20} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.insightTitle}>Pro Tip</Text>
                        <Text style={styles.insightDesc}>
                            {deliveryMetrics.onTimePercent > 90 ? 'Your delivery game is strong! Highlight this in your shop.' : 'Try padding your delivery dates by 1-2 days to boost your reliability score.'}
                        </Text>
                    </View>
                </View>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    filterBarContainer: {
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    pillSelector: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        padding: 4,
    },
    pillBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    pillBtnActive: {
        backgroundColor: Colors.white,
        ...Shadow.subtle,
    },
    pillBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    pillBtnTextActive: {
        color: Colors.primary,
    },
    mainScoreCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: Spacing.lg,
        ...Shadow.medium,
        alignItems: 'center',
    },
    scoreInfo: {
        flex: 1,
    },
    scoreLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    scoreValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    scoreNumber: {
        fontFamily: 'Inter-Bold',
        fontSize: 48,
        color: Colors.textPrimary,
    },
    scoreBasis: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    scoreQualityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    qualityText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.success,
    },
    scoreVisual: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gaugePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 6,
        borderColor: '#F1F5F9',
        borderTopColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
    },
    moduleCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: Spacing.lg,
        ...Shadow.subtle,
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    moduleTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    financialGrid: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    financialItem: {
        flex: 1,
    },
    finLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    finValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    finGrowth: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    finGrowthText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
    finSubtext: {
        fontFamily: 'Inter-Medium',
        fontSize: 11,
        color: Colors.textSecondary,
    },
    finDivider: {
        width: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 16,
    },
    pendingStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    pendingText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: '#B45309',
    },
    rankingItem: {
        marginBottom: 16,
    },
    rankingInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    rankingName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    rankingStats: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    rankingGraph: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    rankingBar: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    emptyModuleText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingVertical: 10,
    },
    bottomGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: Spacing.lg,
    },
    smallModuleCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        ...Shadow.subtle,
        alignItems: 'center',
    },
    smallCardValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
        marginVertical: 4,
    },
    smallCardLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    insightPremiumBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    insightTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    insightDesc: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
});

export default AnalyticsScreen;
