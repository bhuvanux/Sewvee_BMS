import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import SuccessModal from '../components/SuccessModal';
import AlertModal from '../components/AlertModal';

const ResetPinScreen = ({ route, navigation }: any) => {
    const { phone } = route.params;
    const { resetPinWithPhone } = useAuth();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'error' as 'error' | 'success' | 'info' | 'warning'
    });

    const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const handleReset = async () => {
        if (pin.length < 4 || confirmPin.length < 4) {
            showAlert('Required', 'Please enter both PINs', 'warning');
            return;
        }

        if (pin !== confirmPin) {
            showAlert('Mismatch', 'PINs do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            await resetPinWithPhone(phone, pin);
            setSuccessVisible(true);
        } catch (error: any) {
            showAlert('Reset Failed', error.message || 'Failed to reset PIN', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>New PIN</Text>
                    <Text style={styles.subtitle}>Set a new 4-digit PIN for your account</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Enter New PIN</Text>
                        <PinInput
                            value={pin}
                            onValueChange={setPin}
                            length={4}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New PIN</Text>
                        <PinInput
                            value={confirmPin}
                            onValueChange={setConfirmPin}
                            length={4}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.resetBtnText}>Reset PIN</Text>
                                <ArrowRight size={20} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <SuccessModal
                visible={successVisible}
                onClose={() => {
                    setSuccessVisible(false);
                    navigation.navigate('Login');
                }}
                title="PIN Reset Successful"
                description="Your PIN has been updated successfully. You can now login with your new PIN."
                type="success"
            />

            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.xl,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 32,
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 32,
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 12,
        marginLeft: 4,
    },
    resetBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        ...Shadow.medium,
        marginTop: 20,
    },
    resetBtnDisabled: {
        opacity: 0.7,
    },
    resetBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.white,
    }
});

export default ResetPinScreen;
