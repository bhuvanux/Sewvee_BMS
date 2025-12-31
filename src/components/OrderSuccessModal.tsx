import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';
import { Check, X, Printer } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface OrderSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onPrint: () => void;
    onWhatsapp: () => void;
    order: any;
}

const OrderSuccessModal = ({
    visible,
    onClose,
    onPrint,
    onWhatsapp,
    order
}: OrderSuccessModalProps) => {
    // Animation Refs
    const slideAnim = React.useRef(new Animated.Value(height)).current;

    React.useEffect(() => {
        if (visible) {
            // Slide Up
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 40
            }).start();
        } else {
            // Reset (though modal usually unmounts/hides, good practice)
            slideAnim.setValue(height);
        }
    }, [visible]);

    const insets = useSafeAreaInsets();

    if (!order) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade" // Fade the background, slide the content manually
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Background Tap to Close */}
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <Animated.View style={[
                    styles.container,
                    { transform: [{ translateY: slideAnim }], paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 80 : 32) }
                ]}>

                    {/* Header Handle */}
                    <View style={styles.handle} />

                    <View style={styles.content}>
                        {/* Success Icon */}
                        <View style={styles.iconCircle}>
                            <Check size={32} color={Colors.white} strokeWidth={4} />
                        </View>

                        <Text style={styles.title}>Order Created Successfully!</Text>
                        <Text style={styles.subTitle}>Order #{order.billNo || order.id || '-'}</Text>

                        <View style={styles.divider} />

                        {/* Details Table */}
                        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                            <DetailRow label="Customer" value={order.customerName} />
                            <DetailRow label="Total Amount" value={`₹${order.total?.toLocaleString('en-IN')}`} isBold />
                            <DetailRow label="Advance Paid" value={`₹${order.advance?.toLocaleString('en-IN')}`} />
                            <DetailRow label="Balance Due" value={`₹${order.balance?.toLocaleString('en-IN')}`} color={Colors.danger} />

                            {order.deliveryDate && (
                                <DetailRow label="Delivery Date" value={order.deliveryDate} />
                            )}
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.printBtn} onPress={onPrint}>
                                <Printer size={20} color={Colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.printBtnText}>Print Customer Copy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Text style={styles.closeBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const DetailRow = ({ label, value, isBold, color }: { label: string, value: string, isBold?: boolean, color?: string }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[
            styles.value,
            isBold && { fontFamily: 'Inter-Bold', fontSize: 16 },
            color ? { color } : {}
        ]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        width: '100%',
        maxHeight: '85%',
        paddingBottom: Math.max(34, Platform.OS === 'android' ? 80 : 34), // Standardized padding
        ...Shadow.large,
    },
    handle: {
        width: 48,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8
    },
    content: {
        padding: 24,
        alignItems: 'center'
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#059669', // Emerald 600
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        ...Shadow.medium
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        color: '#111827',
        marginBottom: 4,
        textAlign: 'center'
    },
    subTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 20
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 20
    },
    detailsContainer: {
        width: '100%',
        marginBottom: 24
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB'
    },
    label: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    value: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    footer: {
        width: '100%',
        gap: 12
    },
    printBtn: {
        backgroundColor: Colors.primary,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.small
    },
    printBtnText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16
    },
    closeBtn: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    closeBtnText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16
    }
});

export default OrderSuccessModal;
