import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { X, Lock, Check } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import PinInput from './PinInput';

interface ChangePinModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ChangePinModal = ({ visible, onClose, onSuccess }: ChangePinModalProps) => {
    const { changePin } = useAuth();
    const [step, setStep] = useState(0); // 0: Old PIN, 1: New PIN
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const resetState = () => {
        setStep(0);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setError('');
        setLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const verifyOldPin = () => {
        if (oldPin.length !== 4) return;
        setStep(1);
        setError('');
    };

    const handleUpdate = async () => {
        if (newPin.length !== 4 || confirmPin.length !== 4) {
            setError('Please enter complete PINs');
            return;
        }

        if (newPin !== confirmPin) {
            setError('New PINs do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await changePin(oldPin, newPin);
            resetState();
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to update PIN');
            // If incorrect old PIN, maybe go back to step 0?
            if (err.message.includes('Incorrect old PIN')) {
                setStep(0);
                setOldPin('');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.overlay}>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Change App PIN</Text>
                                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                                    <X size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.content}>
                                {step === 0 ? (
                                    <>
                                        <Text style={styles.subtitle}>Enter your current 4-digit PIN</Text>
                                        <PinInput
                                            value={oldPin}
                                            onValueChange={(val) => {
                                                setOldPin(val);
                                                setError('');
                                            }}
                                            length={4}
                                        />
                                        <TouchableOpacity
                                            style={[styles.actionBtn, oldPin.length !== 4 && styles.disabledBtn]}
                                            onPress={verifyOldPin}
                                            disabled={oldPin.length !== 4}
                                        >
                                            <Text style={styles.btnText}>Next</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.subtitle}>Set your new 4-digit PIN</Text>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>New PIN</Text>
                                            <PinInput
                                                value={newPin}
                                                onValueChange={(val) => {
                                                    setNewPin(val);
                                                    setError('');
                                                }}
                                                length={4}
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Confirm New PIN</Text>
                                            <PinInput
                                                value={confirmPin}
                                                onValueChange={(val) => {
                                                    setConfirmPin(val);
                                                    setError('');
                                                }}
                                                length={4}
                                            />
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.actionBtn, (newPin.length !== 4 || confirmPin.length !== 4) && styles.disabledBtn]}
                                            onPress={handleUpdate}
                                            disabled={newPin.length !== 4 || confirmPin.length !== 4 || loading}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color={Colors.white} />
                                            ) : (
                                                <Text style={styles.btnText}>Update PIN</Text>
                                            )}
                                        </TouchableOpacity>
                                    </>
                                )}

                                {error ? (
                                    <Text style={styles.errorText}>{error}</Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 400,
        padding: Spacing.xl,
        ...Shadow.large,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        gap: 20,
        alignItems: 'center',
    },
    subtitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    inputGroup: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 8,
        alignSelf: 'flex-start',
        marginLeft: '10%'
    },
    actionBtn: {
        width: '100%',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledBtn: {
        backgroundColor: '#E5E7EB',
    },
    btnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.white,
    },
    errorText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.danger,
        marginTop: 10,
    }
});

export default ChangePinModal;
