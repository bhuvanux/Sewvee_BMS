import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { IS_STAGING } from '../config/firebase';
import { ArrowLeft, Trash2, RefreshCw } from 'lucide-react-native';

const DevSettingsScreen = ({ navigation }: any) => {
    const { logout } = useAuth();
    const { resetEnvironment } = useData();
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!IS_STAGING) {
            Alert.alert("Protected", "This action is only available in Staging.");
            return;
        }

        Alert.alert(
            "⚠️ FACTORY RESET STAGING?",
            "This will PERMANENTLY DELETE all Customers, Orders, Payments, and Outfits from the Staging Environment.\n\nType 'RESET' to confirm.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "DELETE EVERYTHING",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await resetEnvironment();
                            Alert.alert("Success", "Staging Environment Wiped. App will reload/logout.");
                            logout(); // Force logout to clear state
                        } catch (error: any) {
                            Alert.alert("Error", error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Developer Menu</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Environment: {IS_STAGING ? 'STAGING (Safe to Wipe)' : 'PRODUCTION'}</Text>

                    {IS_STAGING ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.dangerBtn]}
                            onPress={handleReset}
                            disabled={loading}
                        >
                            <Trash2 size={20} color="white" />
                            <Text style={styles.dangerBtnText}>
                                {loading ? "Wiping Data..." : "Factory Reset Staging Data"}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.lockedBox}>
                            <Text style={styles.lockedText}>Reset Tools Disabled in Production</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Debug Info</Text>
                    <Text style={styles.debugText}>Configured Collections:</Text>
                    <Text style={styles.debugText}>• staging_customers</Text>
                    <Text style={styles.debugText}>• staging_orders</Text>
                    <Text style={styles.debugText}>• staging_outfits</Text>
                </View>
            </ScrollView>
        </View>
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
        padding: Spacing.md,
        paddingTop: 60,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    dangerBtn: {
        backgroundColor: Colors.danger,
    },
    dangerBtnText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    lockedBox: {
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    lockedText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter-Medium',
    },
    debugText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 4,
    }
});

export default DevSettingsScreen;
