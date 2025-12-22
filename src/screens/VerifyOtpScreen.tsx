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
import { CheckCircle2, ArrowRight, ShieldCheck, RefreshCw, SkipForward } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { auth, firestore, COLLECTIONS } from '../config/firebase';
import AlertModal from '../components/AlertModal';

const VerifyOtpScreen = ({ route, navigation }: any) => {
    const { phone, verificationId, type } = route.params; // type: 'signup' or 'forgot_pin'
    const { confirmOtp, sendOtp } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const inputs = useRef<any[]>([]);

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

    useEffect(() => {
        // Send OTP on mount
        if (phone) {
            sendOtp(phone);
        }

        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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
                navigation.navigate('ResetPin', { phone });
            }
        } catch (error: any) {
            showAlert('Failed', error.message || 'Invalid code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setLoading(true);
        try {
            await sendOtp(phone);
            setTimer(30);
            showAlert('Sent', 'A new code has been sent to your WhatsApp', 'success');
        } catch (error: any) {
            showAlert('Error', error.message || 'Failed to resend code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            const currentUser = auth().currentUser;
            if (currentUser) {
                await firestore().collection(COLLECTIONS.USERS).doc(currentUser.uid).set({
                    isPhoneVerified: true
                }, { merge: true });
                // Force a check if possible, or usually context listener will pick it up.
                // But context might not re-fetch immediately on local update unless we reload app.
                // However, AuthContext listener for onAuthStateChanged is usually triggered by sign in/out,
                // not database changes unless we implement a snapshot listener on the user Doc.
                // The current AuthContext only fetches ONCE on load/login.
                // So we might need to rely on the app reload or logic.
                // Let's just alert and ask to restart or hope dashboard re-renders.
                // ACTUALLY: AuthContext doesn't expose a 'refreshUser' method.
                // But we can trigger confirmOtp's logic which does setUser.
                // Let's just manually update local state via a hack or navigation?
                // Wait, confirmOtp does setUser. I'll just skip the context update and assume
                // RootNavigator will re-render if I update the context?
                // I can't update context state from here.
                // I'll show an Alert saying "Skipped. Please restart app if not redirected."
                // But wait, if I update firestore, and then reload app, it works.
                showAlert('Skipped', 'Verification skipped. App may need restart.', 'success');
            }
        } catch (error: any) {
            showAlert('Error', error.message, 'error');
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
                    <View style={styles.iconContainer}>
                        <ShieldCheck size={40} color={Colors.white} />
                    </View>
                    <Text style={styles.title}>Verify Phone</Text>
                    <Text style={styles.subtitle}>
                        We have sent a 6-digit verification code to {'\n'}
                        <Text style={styles.phoneText}>+91 {phone}</Text>
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

                {/* DEV SKIP BUTTON */}
                <TouchableOpacity onPress={handleSkip} style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter-Medium', color: Colors.textSecondary, textDecorationLine: 'underline' }}>
                        (Dev) Skip Verification
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <AlertModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
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
