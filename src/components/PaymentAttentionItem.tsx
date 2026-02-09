import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Phone, MessageCircle, Check } from 'lucide-react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';

interface PaymentAttentionItemProps {
    customerName: string;
    mobile?: string;
    amountDue: number;
    daysOverdue: number;
    onMarkPaid: () => void;
}

const PaymentAttentionItem: React.FC<PaymentAttentionItemProps> = ({
    customerName,
    mobile,
    amountDue,
    daysOverdue,
    onMarkPaid
}) => {
    const urgencyColor = daysOverdue >= 7 ? Colors.danger : daysOverdue >= 3 ? '#F59E0B' : Colors.textSecondary;

    const handleCall = () => {
        if (mobile) {
            Linking.openURL(`tel:${mobile}`);
        }
    };

    const handleWhatsApp = () => {
        if (mobile) {
            const message = encodeURIComponent(`Hi ${customerName}, this is a reminder about your pending payment of ₹${amountDue}. Please let me know when you can settle this. Thank you!`);
            Linking.openURL(`whatsapp://send?phone=91${mobile}&text=${message}`);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Text style={styles.customerName}>{customerName}</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.amount}>₹{amountDue.toLocaleString()}</Text>
                    <Text style={[styles.overdue, { color: urgencyColor }]}>
                        {daysOverdue} days overdue
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                {mobile && (
                    <>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.callBtn]}
                            onPress={handleCall}
                        >
                            <Phone size={16} color={Colors.white} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.whatsappBtn]}
                            onPress={handleWhatsApp}
                        >
                            <MessageCircle size={16} color={Colors.white} />
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.actionBtn, styles.paidBtn]}
                    onPress={onMarkPaid}
                >
                    <Check size={16} color={Colors.white} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 3,
        borderLeftColor: '#FEE2E2',
        ...Shadow.subtle,
    },
    info: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    customerName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    amount: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: Colors.danger,
    },
    overdue: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.subtle,
    },
    callBtn: {
        backgroundColor: '#3B82F6',
    },
    whatsappBtn: {
        backgroundColor: '#10B981',
    },
    paidBtn: {
        backgroundColor: Colors.primary,
    },
});

export default PaymentAttentionItem;
