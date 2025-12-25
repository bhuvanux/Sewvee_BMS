import React, { useState, useEffect, useRef } from 'react';
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
import { CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, updateDoc } from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../config/firebase';
import AlertModal from '../components/AlertModal';

const VerifyOtpScreen = ({ route, navigation }: any) => {
    const { phone: paramPhone, verificationId, type } = route.params; // type: 'signup' or 'forgot_pin'
    const { confirmOtp, sendOtp, user } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const inputs = useRef<any[]>([]);

    // Use phone from params OR from user context (fixes race condition on signup)
    const targetPhone = paramPhone || user?.phone;

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
        onClose: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: () => { }
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success', onClose?: () => void) => {
        setModalConfig({
            visible: true,
            title,
            message,
            type,
            onClose: () => {
                setModalConfig(prev => ({ ...prev, visible: false }));
                if (onClose) onClose();
            }
        });
    };

    // Effect to send OTP once we have the phone number
    useEffect(() => {
        if (targetPhone) {
            // Only send if we haven't just sent one (timer check is rough proxy, but good for mount)
            // Actually, we should just send it. logic in functionality handles rate limiting usually,
            // but here we just want to ensure we trigger it if it wasn't triggered before.
            // Since this component mounts once, this is fine.
            sendOtp(targetPhone).catch(err => {
                console.log('Auto-send OTP failed (possibly already sent or invalid):', err);
            });
        }

        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [targetPhone]); // Depend on targetPhone so if it arrives late, we trigger sendOtp

    const handleChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text.replace(/[^0-9]/g, '');
        setOtp(newOtp);

        if (text && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            showAlert('Wait!', 'Please enter the full 6-digit code', 'info');
            return;
        }

        setLoading(true);
        try {
            await confirmOtp(verificationId, code);

            if (type === 'signup') {
                showAlert('Success', 'Phone number verified successfully!', 'success');
            } else if (type === 'forgot_pin') {
                navigation.navigate('ResetPin', { phone: targetPhone });
            }
        } catch (error: any) {
            showAlert('Failed', error.message || 'Invalid code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        if (!targetPhone) {
            showAlert('Error', 'Phone number is missing. Please restart the app or try logging in again.', 'error');
            return;
        }

        setLoading(true);
        try {
            await sendOtp(targetPhone);
            setTimer(30);
            showAlert('Sent', 'A new code has been sent to your WhatsApp', 'success');
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to resend code', 'error');
        } finally {
            setLoading(false);
        }
    };



    // Render Error State if Data is Missing
    if (!targetPhone || targetPhone.trim() === '') {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.danger }]}>
                    <ShieldCheck size={40} color={Colors.white} />
                </View>
                <Text style={styles.title}>Session Error</Text>
                <Text style={styles.subtitle}>
                    We couldn't retrieve your phone number. This can happen if the network is slow or the session is invalid.
                </Text>

                <TouchableOpacity
                    style={[styles.verifyBtn, { marginTop: 30, width: '100%' }]}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.verifyBtnText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <ShieldCheck size={40} color={Colors.white} />
                    </View>
                    <Text style={styles.title}>Verify Phone</Text>
                    <Text style={styles.subtitle}>
                        We have sent a 6-digit verification code to {'\n'}
                        <Text style={styles.phoneText}>+91 {targetPhone}</Text>
                    </Text>
                </View>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputs.current[index] = ref; }}
                            style={styles.otpInput}
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="numeric"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Text style={styles.verifyBtnText}>Verify & Continue</Text>
                            <ArrowRight size={20} color={Colors.white} />
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Didn't receive code? </Text>
                    <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                        <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
                            {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                        </Text>
                    </TouchableOpacity>
                </View>


            </ScrollView>

            <AlertModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={modalConfig.onClose}
            />
        </KeyboardAvoidingView >
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
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: Colors.primary,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...Shadow.medium,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: Spacing.md,
    },
    phoneText: {
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        gap: 8,
    },
    otpInput: {
        flex: 1,
        height: 56,
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        textAlign: 'center',
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: Colors.primary,
        ...Shadow.subtle,
    },
    verifyBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        ...Shadow.medium,
    },
    verifyBtnDisabled: {
        opacity: 0.7,
    },
    verifyBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.white,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    resendText: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: Colors.primary,
    },
    resendTextDisabled: {
        color: '#CBD5E1',
    },
});

export default VerifyOtpScreen;
