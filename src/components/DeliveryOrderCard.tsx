import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle2, IndianRupee, User } from 'lucide-react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';

interface DeliveryOrderCardProps {
    orderNo: string;
    customerName: string;
    garmentTypes: string[];
    status: 'In Progress' | 'Ready' | 'Completed';
    amountPending: number;
    deliveryDate: string;
    onMarkReady?: () => void;
    onMarkDelivered?: () => void;
    onCollectPayment?: () => void;
    onPress?: () => void;
}

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
    orderNo,
    customerName,
    garmentTypes,
    status,
    amountPending,
    deliveryDate,
    onMarkReady,
    onMarkDelivered,
    onCollectPayment,
    onPress
}) => {
    const statusColor = status === 'Ready' ? Colors.success : status === 'In Progress' ? '#F59E0B' : Colors.textSecondary;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNo}>#{orderNo}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.deliveryDate}>{deliveryDate}</Text>
            </View>

            <View style={styles.customerRow}>
                <User size={16} color={Colors.textSecondary} />
                <Text style={styles.customerName}>{customerName}</Text>
            </View>

            <View style={styles.garmentRow}>
                {garmentTypes.slice(0, 3).map((type, index) => (
                    <View key={index} style={styles.garmentChip}>
                        <Text style={styles.garmentText}>{type}</Text>
                    </View>
                ))}
                {garmentTypes.length > 3 && (
                    <Text style={styles.moreText}>+{garmentTypes.length - 3} more</Text>
                )}
            </View>

            {amountPending > 0 && (
                <View style={styles.pendingRow}>
                    <IndianRupee size={14} color={Colors.danger} />
                    <Text style={styles.pendingText}>₹{amountPending.toLocaleString()} pending</Text>
                </View>
            )}

            <View style={styles.actions}>
                {status === 'In Progress' && onMarkReady && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.readyBtn]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onMarkReady();
                        }}
                    >
                        <CheckCircle2 size={16} color={Colors.white} />
                        <Text style={styles.actionBtnText}>Mark Ready</Text>
                    </TouchableOpacity>
                )}

                {status === 'Ready' && onMarkDelivered && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deliveredBtn]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onMarkDelivered();
                        }}
                    >
                        <CheckCircle2 size={16} color={Colors.white} />
                        <Text style={styles.actionBtnText}>Mark Delivered</Text>
                    </TouchableOpacity>
                )}

                {amountPending > 0 && onCollectPayment && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.paymentBtn]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onCollectPayment();
                        }}
                    >
                        <IndianRupee size={16} color={Colors.white} />
                        <Text style={styles.actionBtnText}>Collect</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    orderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    orderNo: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
    },
    deliveryDate: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.sm,
    },
    customerName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    garmentRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: Spacing.sm,
    },
    garmentChip: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    garmentText: {
        fontFamily: 'Inter-Medium',
        fontSize: 11,
        color: Colors.primary,
    },
    moreText: {
        fontFamily: 'Inter-Medium',
        fontSize: 11,
        color: Colors.textSecondary,
        alignSelf: 'center',
    },
    pendingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Spacing.sm,
    },
    pendingText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.danger,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        ...Shadow.subtle,
    },
    readyBtn: {
        backgroundColor: '#F59E0B',
    },
    deliveredBtn: {
        backgroundColor: Colors.success,
    },
    paymentBtn: {
        backgroundColor: Colors.primary,
    },
    actionBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.white,
    },
});

export default DeliveryOrderCard;
