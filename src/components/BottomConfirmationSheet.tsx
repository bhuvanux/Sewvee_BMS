
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Colors, Spacing, Shadow, Typography } from '../constants/theme';
import { AlertCircle, X, Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface BottomConfirmationSheetProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const BottomConfirmationSheet = ({
    visible,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}: BottomConfirmationSheetProps) => {

    // Determine colors based on type
    const getIconColor = () => {
        switch (type) {
            case 'danger': return Colors.danger;
            case 'warning': return '#F59E0B'; // Amber
            default: return Colors.primary;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'danger': return '#FEF2F2';
            case 'warning': return '#FFFBEB';
            default: return '#F0F9FF';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Close on tap outside */}
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.sheet}>
                    <View style={styles.contentRow}>
                        {/* Icon */}
                        <View style={[styles.iconBox, { backgroundColor: getIconBg() }]}>
                            <AlertCircle size={24} color={getIconColor()} />
                        </View>

                        {/* Text Content */}
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.description}>{description}</Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: type === 'danger' ? Colors.danger : Colors.primary }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmBtnText}>{confirmText}</Text>
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
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        ...Shadow.medium,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        paddingTop: 2,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    description: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    cancelBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    confirmBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.subtle,
    },
    confirmBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.white,
    },
});

export default BottomConfirmationSheet;
