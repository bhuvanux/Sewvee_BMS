import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { User, Phone, Mail, ArrowLeft, Save, Lock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateEmail, validatePhone } from '../utils/validation';
import SuccessModal from '../components/SuccessModal';
import ChangePinModal from '../components/ChangePinModal';

const EditProfileScreen = ({ navigation }: any) => {
    const { user, saveUser } = useAuth();
    const insets = useSafeAreaInsets();
    
    // Form State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [mobile, setMobile] = useState(user?.mobile || '');
    
    const [loading, setLoading] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    
    // PIN Modal State
    const [changePinVisible, setChangePinVisible] = useState(false);
    const [pinSuccessVisible, setPinSuccessVisible] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'error' });

    const showAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert('Valid Name Required', 'Please enter your full name.', 'warning');
            return;
        }
        if (!validatePhone(mobile)) {
            showAlert('Invalid Phone', 'Please enter a valid 10-digit mobile number.', 'warning');
            return;
        }
        if (email && !validateEmail(email)) {
            showAlert('Invalid Email', 'Please enter a valid email address.', 'warning');
            return;
        }

        setLoading(true);
        try {
            await saveUser({
                ...user,
                name,
                email,
                mobile
            });
            setSuccessVisible(true);
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to update profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={Typography.h3}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveIconButton}>
                    <Save size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <User size={40} color={Colors.white} />
                    </View>
                    <Text style={styles.avatarHint}>Personal Details</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={styles.inputContainer}>
                            <User size={18} color={Colors.textSecondary} />
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
                        <Text style={styles.label}>Mobile Number *</Text>
                        <View style={styles.inputContainer}>
                            <Phone size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="9876543210"
                                placeholderTextColor={Colors.textSecondary}
                                value={mobile}
                                onChangeText={(v) => setMobile(v.replace(/[^0-9]/g, '').slice(0, 10))}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                </View>

                {/* Security Section specific to User */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Security</Text>
                    <TouchableOpacity style={styles.securityCard} onPress={() => setChangePinVisible(true)}>
                        <View style={styles.securityIcon}>
                            <Lock size={20} color={Colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.securityTitle}>Change App PIN</Text>
                            <Text style={styles.securitySubtitle}>Update your 4-digit security code</Text>
                        </View>
                        <View style={styles.arrowIcon}>
                            <ArrowLeft size={16} color={Colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.8 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modals */}
            <SuccessModal
                visible={successVisible}
                onClose={() => {
                    setSuccessVisible(false);
                    navigation.goBack();
                }}
                title="Profile Updated"
                description="Your personal details have been updated."
            />

            <ChangePinModal
                visible={changePinVisible}
                onClose={() => setChangePinVisible(false)}
                onSuccess={() => {
                    setChangePinVisible(false);
                    setTimeout(() => setPinSuccessVisible(true), 500);
                }}
            />

            <SuccessModal
                visible={pinSuccessVisible}
                onClose={() => setPinSuccessVisible(false)}
                title="PIN Updated"
                description="Your security PIN has been changed successfully."
                type="success"
            />

            <SuccessModal
                visible={alertVisible}
                onClose={() => setAlertVisible(false)}
                title={alertConfig.title}
                description={alertConfig.message}
                type={alertConfig.type}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 4,
    },
    saveIconButton: {
        padding: 4,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
    },
    avatarHint: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 12,
    },
    form: {
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 52,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
        marginLeft: Spacing.sm,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 10,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    securityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    securityIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    securityTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    securitySubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    arrowIcon: {
        marginLeft: 8,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
        ...Shadow.medium,
    },
    saveButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
});

export default EditProfileScreen;
