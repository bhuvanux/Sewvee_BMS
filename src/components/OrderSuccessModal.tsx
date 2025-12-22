import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Check, X, Printer, Share2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OrderSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onPrint: () => void;
    onWhatsapp: () => void;
    order: any; // Ideally Order type, but using any to avoid import issues for now, or importing Order
}

const OrderSuccessModal = ({
    visible,
    onClose,
    onPrint,
    onWhatsapp,
    order
}: OrderSuccessModalProps) => {

    if (!order) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon Header */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Check size={40} color={Colors.white} strokeWidth={4} />
                        </View>
                        <Text style={styles.title}>Order created{'\n'}successfully!</Text>
                        <View style={styles.subTitleContainer}>
                            <Text style={styles.subTitle}>Order and Payment details has been sent to customer</Text>
                        </View>
                    </View>

                    {/* Details Table */}
                    <ScrollView style={styles.detailsContainer}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Order ID:</Text>
                            <Text style={styles.value}>{order.billNo || order.id || '-'}</Text>
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <Text style={styles.label}>Order Date & Time:</Text>
                            <Text style={styles.value}>
                                {order.date && typeof order.date === 'string'
                                    ? order.date.split('T')[0]
                                    : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-')}
                                {order.time ? ` - ${order.time}` : ''}
                            </Text>
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <Text style={styles.label}>Customer Name:</Text>
                            <Text style={styles.value}>{order.customerName}</Text>
                        </View>
                        <View style={styles.divider} />

                        {/* Use the first item's dates if available, or general dates */}
                        {order.deliveryDate && (
                            <>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Delivery Date:</Text>
                                    <Text style={styles.value}>{order.deliveryDate}</Text>
                                </View>
                                <View style={styles.divider} />
                            </>
                        )}

                        <View style={styles.row}>
                            <Text style={styles.label}>Total Amount :</Text>
                            <Text style={[styles.value, { fontFamily: 'Inter-Bold', color: '#111827' }]}>
                                ₹{order.total?.toLocaleString('en-IN')}
                            </Text>
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <Text style={styles.label}>Advance Paid:</Text>
                            <Text style={[styles.value, { color: Colors.textSecondary }]}>
                                ₹{order.advance?.toLocaleString('en-IN')}
                            </Text>
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <Text style={styles.label}>Pending Amount:</Text>
                            <Text style={[styles.value, { color: Colors.textSecondary }]}>
                                ₹{order.balance?.toLocaleString('en-IN')}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.btn, styles.whatsappBtn]} onPress={onWhatsapp}>
                            <Text style={styles.whatsappBtnText}>Whatsapp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.btn, styles.printBtn]} onPress={onPrint}>
                            <Text style={styles.printBtnText}>Print Order Copy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.btn, styles.closeBtn]} onPress={onClose}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.md
    },
    container: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
        padding: 24,
        ...Shadow.large,
        alignItems: 'center'
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        width: '100%'
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#00C805', // Bright Green
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 32
    },
    subTitleContainer: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    subTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center'
    },
    detailsContainer: {
        width: '100%',
        marginBottom: 24
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: '#111827',
        flex: 1
    },
    value: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'right',
        flex: 1
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        width: '100%'
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginTop: 8
    },
    btn: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    whatsappBtn: {
        backgroundColor: '#F97316', // Orange as per design
        borderColor: '#F97316'
    },
    whatsappBtnText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 13
    },
    printBtn: {
        backgroundColor: Colors.white,
        borderColor: '#E5E7EB'
    },
    printBtnText: {
        color: '#374151',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13
    },
    closeBtn: {
        backgroundColor: Colors.white,
        borderColor: '#E5E7EB'
    },
    closeBtnText: {
        color: '#374151',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13
    }
});

export default OrderSuccessModal;
