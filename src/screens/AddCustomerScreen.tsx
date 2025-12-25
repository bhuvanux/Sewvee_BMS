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
import { validatePhone } from '../utils/validation';
import { useToast } from '../context/ToastContext';

const AddCustomerScreen = ({ navigation }: any) => {
    const { addCustomer } = useData();
    const { showToast } = useToast();
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
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('Please enter customer name', 'warning');
            return;
        }

        if (!validatePhone(mobile)) {
            showToast('Please enter valid 10-digit mobile number', 'warning');
            return;
        }

        setLoading(true);
        try {
            await addCustomer({ name, mobile, location });
            showToast(`${name} added successfully!`, 'dark');
            navigation.goBack();
        } catch (error: any) {
            console.error('AddCustomerScreen: handleSave error:', error);
            showToast(error.message || 'Failed to save customer', 'error');
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                                placeholder="Enter customer name"
                                placeholderTextColor="#6B7280"
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
                                placeholder="Enter 10-digit mobile number"
                                placeholderTextColor="#6B7280"
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
                                placeholder="City, Area or Full Address"
                                placeholderTextColor="#6B7280"
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
