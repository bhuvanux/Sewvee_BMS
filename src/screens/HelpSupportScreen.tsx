import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import { MessageCircle, Mail, Phone, ChevronRight, HelpCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HelpSupportScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    const handleEmail = () => {
        Linking.openURL('mailto:support@sewvee.com');
    };

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/919999999999'); // Replace with actual number
    };

    const handleCall = () => {
        Linking.openURL('tel:+919999999999'); // Replace with actual number
    };

    const SupportItem = ({ icon: Icon, title, subtitle, onPress, color }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemSubtitle}>{subtitle}</Text>
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
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.banner}>
                    <HelpCircle size={48} color={Colors.primary} />
                    <Text style={styles.bannerTitle}>How can we help you?</Text>
                    <Text style={styles.bannerText}>
                        We are here to help you with any questions or issues you may have.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Contact Us</Text>

                <View style={styles.card}>
                    <SupportItem
                        icon={Mail}
                        title="Email Support"
                        subtitle="Get help via email"
                        color="#EA4335"
                        onPress={handleEmail}
                    />
                    <View style={styles.separator} />
                    <SupportItem
                        icon={MessageCircle}
                        title="Chat on WhatsApp"
                        subtitle="Instant support"
                        color="#25D366"
                        onPress={handleWhatsApp}
                    />
                    <View style={styles.separator} />
                    <SupportItem
                        icon={Phone}
                        title="Call Us"
                        subtitle="Speak to our team"
                        color="#3B82F6"
                        onPress={handleCall}
                    />
                </View>

                <View style={{ height: 20 }} />

                <Text style={styles.sectionTitle}>FAQ</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.item}>
                        <View style={styles.itemContent}>
                            <Text style={styles.itemTitle}>How to add a new order?</Text>
                        </View>
                        <ChevronRight size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.item}>
                        <View style={styles.itemContent}>
                            <Text style={styles.itemTitle}>How to manage outfits?</Text>
                        </View>
                        <ChevronRight size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
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
    },
    banner: {
        alignItems: 'center',
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    bannerTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    bannerText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    itemSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 70,
    },
});

export default HelpSupportScreen;
