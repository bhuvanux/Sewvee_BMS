import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Building2, MapPin, Phone, Hash, Mail, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateEmail, validatePhone } from '../utils/validation';
import SuccessModal from '../components/SuccessModal';

const OnboardingScreen = ({ navigation }: any) => {
    const { saveCompany, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [secondaryPhone, setSecondaryPhone] = useState('');
    const [email, setEmail] = useState('');
    const [gstin, setGstin] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDesc, setAlertDesc] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'warning' | 'info' | 'error'>('success');

    // Get initials from company name
    const getInitials = (name: string) => {
        return name.trim().substring(0, 2).toUpperCase() || 'BT';
    };

    const handleSave = async () => {
        if (!companyName.trim() || !address.trim()) {
            setAlertTitle('Missing Information');
            setAlertDesc('Please enter company name and address.');
            setAlertType('warning');
            setAlertVisible(true);
            return;
        }

        if (!validatePhone(phone)) {
            setAlertTitle('Invalid Phone');
            setAlertDesc('Primary Phone Number must be 10 digits.');
            setAlertType('warning');
            setAlertVisible(true);
            return;
        }

        if (secondaryPhone && !validatePhone(secondaryPhone)) {
            setAlertTitle('Invalid Secondary Phone');
            setAlertDesc('Secondary Phone Number must be 10 digits.');
            setAlertType('warning');
            setAlertVisible(true);
            return;
        }

        if (!validateEmail(email)) {
            setAlertTitle('Invalid Email');
            setAlertDesc('Please enter a valid email address.');
            setAlertType('warning');
            setAlertVisible(true);
            return;
        }

        setLoading(true);
        try {
            await saveCompany({
                name: companyName,
                address,
                phone,
                secondaryPhone,
                email,
                gstin
            });
        } catch (error) {
            setAlertTitle('Setup Failed');
            setAlertDesc('Failed to save company details. Please try again.');
            setAlertType('error');
            setAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => logout()}
                >
                    <LogOut size={18} color={Colors.danger} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <View style={styles.header}>
                    <Text style={Typography.h1}>Company Profile</Text>
                    <Text style={[Typography.bodyMedium, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
                        Setup your boutique details for the invoice
                    </Text>
                </View>

                <View style={styles.imageSection}>
                    <View style={styles.initialsContainer}>
                        <Text style={styles.initialsText}>{getInitials(companyName)}</Text>
                    </View>
                    <Text style={styles.initialsHint}>Your business initials will appear on invoices</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Company Name *</Text>
                        <View style={styles.inputContainer}>
                            <Building2 size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Enter shop name"
                                value={companyName}
                                onChangeText={setCompanyName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address *</Text>
                        <View style={[styles.inputContainer, styles.multiLineContainer]}>
                            <MapPin size={18} color={Colors.textSecondary} style={{ marginTop: 10 }} />
                            <TextInput
                                style={[styles.input, styles.multiLineInput]}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="V.R.S Complex, Annamar Petrol Bunk..."
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Primary Phone Number *</Text>
                        <View style={styles.inputContainer}>
                            <Phone size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Customer care number"
                                value={phone}
                                onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, '').slice(0, 10))}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Secondary Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Phone size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Alternative contact (Optional)"
                                value={secondaryPhone}
                                onChangeText={(val) => setSecondaryPhone(val.replace(/[^0-9]/g, '').slice(0, 10))}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address *</Text>
                        <View style={styles.inputContainer}>
                            <Mail size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="boutique@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>GSTIN (Optional)</Text>
                        <View style={styles.inputContainer}>
                            <Hash size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="33BKPK44338F1ZC"
                                value={gstin}
                                onChangeText={setGstin}
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.8 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>Complete Setup</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <SuccessModal
                visible={alertVisible}
                onClose={() => setAlertVisible(false)}
                title={alertTitle}
                description={alertDesc}
                type={alertType}
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
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },

    initialsContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
    },
    initialsText: {
        fontFamily: 'Inter-Bold',
        fontSize: 36,
        color: Colors.white,
    },
    initialsHint: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    form: {
        gap: Spacing.md,
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
        borderRadius: 8,
        paddingHorizontal: Spacing.md,
        height: 50,
    },
    multiLineContainer: {
        height: 100,
        alignItems: 'flex-start',
        paddingTop: 8,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
        marginLeft: Spacing.sm,
    },
    multiLineInput: {
        height: '100%',
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xl,
        ...Shadow.medium,
    },
    saveButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 6,
        marginBottom: Spacing.sm,
        padding: 8,
    },
    logoutText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.danger,
    }
});

export default OnboardingScreen;
