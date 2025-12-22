import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated
} from 'react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    buttonText?: string;
    confirmText?: string;
}

const AlertModal = ({
    visible,
    title,
    message,
    onClose,
    onConfirm,
    buttonText = 'OK',
    confirmText = 'Yes'
}: AlertModalProps) => {

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {!onConfirm && (
                            <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                                <Text style={styles.primaryActionText}>{buttonText}</Text>
                            </TouchableOpacity>
                        )}

                        {onConfirm && (
                            <>
                                <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                                    <Text style={styles.secondaryActionText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { onClose(); onConfirm(); }} style={styles.actionBtn}>
                                    <Text style={styles.primaryActionText}>{confirmText}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker overlay for focus
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl
    },
    modalContainer: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: Colors.white,
        borderRadius: 8, // Sharper corners for dialog look
        padding: 24,
        ...Shadow.medium
    },
    title: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: Colors.textSecondary,
        lineHeight: 24,
        marginBottom: 24
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 24,
    },
    actionBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8
    },
    primaryActionText: {
        color: Colors.primary,
        fontSize: 15,
        fontFamily: 'Inter-SemiBold'
    },
    secondaryActionText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontFamily: 'Inter-Medium'
    }
});

export default AlertModal;
