import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';

interface OrderHealthIndicatorProps {
    onTimeCount: number;
    onTimePercent: number;
    nearDueCount: number;
    overdueCount: number;
    oldestOverdueDays?: number;
    onPressOnTime?: () => void;
    onPressNearDue?: () => void;
    onPressOverdue?: () => void;
}

const OrderHealthIndicator: React.FC<OrderHealthIndicatorProps> = ({
    onTimeCount,
    onTimePercent,
    nearDueCount,
    overdueCount,
    oldestOverdueDays,
    onPressOnTime,
    onPressNearDue,
    onPressOverdue
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.healthCard, styles.onTime]}
                onPress={onPressOnTime}
                activeOpacity={0.7}
            >
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <CheckCircle2 size={20} color={Colors.success} />
                </View>
                <View style={styles.healthInfo}>
                    <Text style={styles.healthCount}>{onTimeCount}</Text>
                    <Text style={styles.healthLabel}>On-time</Text>
                    <Text style={styles.healthPercent}>{onTimePercent}%</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.healthCard, styles.nearDue]}
                onPress={onPressNearDue}
                activeOpacity={0.7}
            >
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Clock size={20} color="#F59E0B" />
                </View>
                <View style={styles.healthInfo}>
                    <Text style={styles.healthCount}>{nearDueCount}</Text>
                    <Text style={styles.healthLabel}>Near Due</Text>
                    <Text style={styles.healthSubtext}>1-2 days</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.healthCard, styles.overdue]}
                onPress={onPressOverdue}
                activeOpacity={0.7}
            >
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <AlertCircle size={20} color={Colors.danger} />
                </View>
                <View style={styles.healthInfo}>
                    <Text style={styles.healthCount}>{overdueCount}</Text>
                    <Text style={styles.healthLabel}>Overdue</Text>
                    {oldestOverdueDays !== undefined && oldestOverdueDays > 0 && (
                        <Text style={styles.healthSubtext}>Oldest: {oldestOverdueDays}d</Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    healthCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        alignItems: 'center',
        ...Shadow.subtle,
        borderWidth: 1,
    },
    onTime: {
        borderColor: '#D1FAE5',
    },
    nearDue: {
        borderColor: '#FEF3C7',
    },
    overdue: {
        borderColor: '#FEE2E2',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    healthInfo: {
        alignItems: 'center',
    },
    healthCount: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    healthLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    healthPercent: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        color: Colors.success,
    },
    healthSubtext: {
        fontFamily: 'Inter-Medium',
        fontSize: 10,
        color: Colors.textSecondary,
    },
});

export default OrderHealthIndicator;
