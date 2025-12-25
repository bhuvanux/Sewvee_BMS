import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Phone } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import { logEvent } from '../config/firebase';
import AlertModal from '../components/AlertModal';

const LoginScreen = ({ navigation }: any) => {
    const { loginWithPhone } = useAuth();
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'error'
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'error', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };



    const handleLogin = async () => {
        if (!phone || pin.length < 4) {
            showAlert('Required', 'Please enter your phone number and 4-digit PIN', 'warning');
            return;
        }

        setLoading(true);
        logEvent('login_attempt', { phone });
        try {
            await loginWithPhone(phone, pin);
            logEvent('login_success');
        } catch (error: any) {
            logEvent('login_error', { error: error.message });
            console.error('Login Error:', error);

            showAlert('Login Failed', error.message || 'Check your credentials and try again.', 'error');
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
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>SV</Text>
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Enter your details to access your account</Text>
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
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Enter 4-Digit PIN</Text>
                        <PinInput
                            value={pin}
                            onValueChange={setPin}
                            length={4}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPass}
                        onPress={() => navigation.navigate('ForgotPin')}
                    >
                        <Text style={styles.forgotPassText}>Forgot PIN?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.loginBtnText}>Login Account</Text>
                                <ArrowRight size={20} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.signupText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
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
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: Colors.primary,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...Shadow.medium,
    },
    logoText: {
        fontFamily: 'Inter-Bold',
        fontSize: 32,
        color: Colors.white,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
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
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPassText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    loginBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        ...Shadow.medium,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
    loginBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.white,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    signupText: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: Colors.primary,
    }
});

export default LoginScreen;
