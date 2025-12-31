import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import { Info, ShieldCheck, FileText, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AboutScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const version = '1.0.2'; // Should ideally come from app config

    const AboutItem = ({ icon: Icon, title, onPress }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.itemLeft}>
                <Icon size={20} color={Colors.textSecondary} />
                <Text style={styles.itemTitle}>{title}</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                        {/* Placeholder for actual logo */}
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>S</Text>
                        </View>
                    </View>
                    <Text style={styles.appName}>Sewvee</Text>
                    <Text style={styles.version}>Version {version}</Text>
                </View>

                <View style={styles.card}>
                    <AboutItem
                        icon={FileText}
                        title="Terms of Service"
                        onPress={() => { }}
                    />
                    <View style={styles.separator} />
                    <AboutItem
                        icon={ShieldCheck}
                        title="Privacy Policy"
                        onPress={() => { }}
                    />
                    <View style={styles.separator} />
                    <AboutItem
                        icon={Info}
                        title="Licenses"
                        onPress={() => { }}
                    />
                </View>

                <View style={styles.handcraftedSection}>
                    <Text style={styles.handcraftedText}>
                        Handcrafted for <Text style={styles.boutiqueText}>Boutiques</Text>
                    </Text>
                    <View style={styles.poweredByContainer}>
                        <Text style={styles.poweredByText}>Powered by </Text>
                        <Text style={styles.sewveeText}>Sewvee</Text>
                    </View>
                </View>

            </ScrollView>
            <View style={styles.footer}>
                <Text style={styles.copyright}>© 2024 Sewvee. All rights reserved.</Text>
            </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        backgroundColor: Colors.white,
        height: 50,
    },
    backButton: {
        padding: Spacing.sm,
    },
    backButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.md,
        alignItems: 'center',
    },
    logoSection: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
        marginBottom: Spacing.md,
    },
    logoContainer: {
        marginBottom: Spacing.md,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: Colors.primary,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontFamily: 'Inter-Bold',
        fontSize: 40,
        color: 'white',
    },
    appName: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    version: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    card: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginBottom: Spacing.xxl,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        paddingVertical: Spacing.lg,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    itemTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 50,
    },
    handcraftedSection: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    handcraftedText: {
        fontFamily: 'Inter-Regular', // Using standard Inter, but playing with styles
        fontSize: 16,
        color: Colors.textSecondary,
        fontStyle: 'italic', // Italic for elegance
        marginBottom: 8,
    },
    boutiqueText: {
        fontFamily: 'Playlist-Script', // Assuming a script font exists, or fallback to serif italic
        // If 'Playlist-Script' or similar isn't available, we'll try a fallback stack
        // Since I don't know the exact custom fonts available other than Inter, I'll use a system serif italic for now as fallback
        ...Platform.select({
            ios: { fontFamily: 'Didot-Italic' },
            android: { fontFamily: 'serif', fontStyle: 'italic' },
        }),
        fontSize: 18,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    poweredByContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    poweredByText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        opacity: 0.7,
    },
    sewveeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.textPrimary,
        letterSpacing: 1,
        marginLeft: 4,
    },
    footer: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    copyright: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        opacity: 0.5,
    }
});

export default AboutScreen;
