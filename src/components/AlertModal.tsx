import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    onConfirm?: () => void;
    buttonText?: string;
    confirmText?: string;
}

const AlertModal = ({
    visible,
    title,
    message,
    type = 'success',
    onClose,
    onConfirm,
    buttonText = 'OK',
    confirmText = 'Yes, Proceed'
}: AlertModalProps) => {
    const [animation] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.spring(animation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        } else {
            Animated.timing(animation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={50} color={Colors.primary} />;
            case 'error':
                return <AlertCircle size={50} color="#EF4444" />;
            case 'info':
                return <Info size={50} color="#3B82F6" />;
            case 'warning':
                return <AlertCircle size={50} color="#F59E0B" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'success': return Colors.primary;
            case 'error': return '#EF4444';
            case 'info': return '#3B82F6';
            case 'warning': return '#F59E0B';
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            opacity: animation,
                            transform: [{
                                scale: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1]
                                })
                            }]
                        }
                    ]}
                >
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            {getIcon()}
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelButtonText}>{onConfirm ? 'Cancel' : buttonText}</Text>
                            </TouchableOpacity>

                            {onConfirm && (
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: getHeaderColor() }]}
                                    onPress={() => {
                                        onClose();
                                        onConfirm();
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.buttonText}>{confirmText}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: Colors.white,
        borderRadius: 24,
        overflow: 'hidden',
        ...Shadow.large
    },
    content: {
        padding: Spacing.xl,
        alignItems: 'center'
    },
    iconContainer: {
        marginBottom: Spacing.lg,
        padding: Spacing.md,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.03)'
    },
    title: {
        fontSize: 22,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center'
    },
    message: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.small
    },
    cancelButton: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold'
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: 'Inter-SemiBold'
    }
});

export default AlertModal;
