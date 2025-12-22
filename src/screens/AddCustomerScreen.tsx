import React, { useState, useLayoutEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { User, Phone, MapPin, ArrowLeft } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import SuccessModal from '../components/SuccessModal';
import { validatePhone } from '../utils/validation';

const AddCustomerScreen = ({ navigation }: any) => {
    const { addCustomer } = useData();
    const [name, setName] = useState('');

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ padding: 8, marginLeft: -8 }}
                >
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);
    const [mobile, setMobile] = useState('');
    const [location, setLocation] = useState('');
    const [successVisible, setSuccessVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Alert Modal State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDesc, setAlertDesc] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'warning' | 'info' | 'error'>('success');

    const handleSave = async () => {
        if (!name.trim()) {
            setAlertTitle('Required');
            setAlertDesc('Please enter customer name');
            setAlertType('warning');
            setAlertVisible(true);
            return;
        }

        if (!validatePhone(mobile)) {
            setAlertTitle('Required');
            setAlertDesc('Please enter valid 10-digit mobile number');
            setAlertType('warning');
            setAlertVisible(true);
            return;
        }

        setLoading(true);
        try {
            await addCustomer({ name, mobile, location });
            setSuccessVisible(true);
        } catch (error: any) {
            console.error('AddCustomerScreen: handleSave error:', error);
            setAlertTitle('Error');
            setAlertDesc(error.message || 'Failed to save customer. Please try again.');
            setAlertType('error');
            setAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessDone = () => {
        setSuccessVisible(false);
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Customer Name *</Text>
                        <View style={styles.inputContainer}>
                            <User size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Ex: Shwetha"
                                placeholderTextColor={Colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>WhatsApp Number *</Text>
                        <View style={styles.inputContainer}>
                            <Phone size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="10 digit mobile"
                                placeholderTextColor={Colors.textSecondary}
                                value={mobile}
                                onChangeText={(val) => setMobile(val.replace(/[^0-9]/g, '').slice(0, 10))}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <View style={styles.inputContainer}>
                            <MapPin size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Ex: Coimbatore"
                                placeholderTextColor={Colors.textSecondary}
                                value={location}
                                onChangeText={setLocation}
                            />
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
                            <Text style={styles.saveButtonText}>Add Customer</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <SuccessModal
                visible={successVisible}
                onClose={handleSuccessDone}
                title="Customer Added"
                description={`${name} has been successfully added to your customer list.`}
            />

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
    content: {
        padding: Spacing.lg,
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
    input: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
        marginLeft: Spacing.sm,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.lg,
        ...Shadow.medium,
    },
    saveButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
});

export default AddCustomerScreen;
