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
    ScrollView,
    Alert
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Phone } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import { logEvent } from '../config/firebase';

const SignupScreen = ({ navigation }: any) => {
    const { signup } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password || !phone) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 4) {
            Alert.alert('Error', 'PIN should be exactly 4 digits');
            return;
        }

        setLoading(true);
        logEvent('signup_attempt', { email, phone });
        try {
            await signup(email, password, name, phone);
            logEvent('signup_success');
            // After signup, AuthContext will update and RootNavigator will switch to Onboarding
        } catch (error: any) {
            logEvent('signup_error', { error: error.message });
            console.error('Signup Error:', error);
            Alert.alert('Signup Failed', error.message || 'Could not create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
            >
                <ArrowLeft size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join Sewvee and start managing your boutique professionally</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={20} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Your Name"
                                placeholderTextColor={Colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email ID</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor={Colors.textSecondary}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

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
                        <Text style={styles.label}>Set 4-Digit PIN</Text>
                        <PinInput
                            value={password}
                            onValueChange={setPassword}
                            length={4}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.signupBtnText}>Create Account</Text>
                                <ArrowRight size={20} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        backgroundColor: Colors.white,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.subtle,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.xl,
        paddingTop: 120,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 32,
        color: Colors.textPrimary,
        marginBottom: 8,
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
    signupBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        ...Shadow.medium,
    },
    signupBtnDisabled: {
        opacity: 0.7,
    },
    signupBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.white,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 40,
    },
    footerText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
    },
    loginText: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: Colors.primary,
    }
});

export default SignupScreen;
