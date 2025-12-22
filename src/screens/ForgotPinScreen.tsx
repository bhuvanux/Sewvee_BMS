import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Phone, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { firestore, COLLECTIONS } from '../config/firebase';
import AlertModal from '../components/AlertModal';

const ForgotPinScreen = ({ navigation }: any) => {
    const { sendOtp } = useAuth();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'error' as 'error' | 'success' | 'info' | 'warning',
        confirmText: undefined as string | undefined,
        onConfirm: undefined as (() => void) | undefined
    });

    const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error') => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onConfirm: undefined,
            confirmText: undefined
        });
    };

    const handleNext = async () => {
        if (phone.length < 10) {
            showAlert('Error', 'Please enter a valid 10-digit phone number', 'warning');
            return;
        }

        setLoading(true);
        try {
            // Check if user exists
            const userSnapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .where('phone', '==', phone)
                .get();

            if (userSnapshot.empty) {
                setAlertConfig({
                    visible: true,
                    title: 'Account Not Found',
                    message: `The number ${phone} is not linked with any account. Would you like to create a new account?`,
                    type: 'info',
                    confirmText: 'Sign Up',
                    onConfirm: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        navigation.navigate('Signup');
                    }
                });
                setLoading(false);
                return;
            }

            const verificationId = await sendOtp(phone);
            navigation.navigate('VerifyOtp', {
                phone,
                verificationId,
                type: 'forgot_pin'
            });
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to send OTP', 'error');
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
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Forgot PIN?</Text>
                    <Text style={styles.subtitle}>Enter your registered phone number to reset your PIN</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                            <Phone size={20} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="10 Digit Mobile Number"
                                placeholderTextColor={Colors.textSecondary}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={phone}
                                onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                                autoFocus
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.nextBtnText}>Send OTP</Text>
                                <ArrowRight size={20} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false, onConfirm: undefined, confirmText: undefined }))}
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
    },
    backBtn: {
        marginTop: 20,
        marginBottom: 40,
        width: 40,
        height: 40,
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
        lineHeight: 24,
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
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    nextBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        ...Shadow.medium,
        marginTop: 10,
    },
    nextBtnDisabled: {
        opacity: 0.7,
    },
    nextBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.white,
    }
});

export default ForgotPinScreen;
