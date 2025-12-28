import React from 'react';
import { View, Text, StyleSheet, Share, TouchableOpacity, Linking, Image } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import { Share2, Star, Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent } from '../config/firebase';

const ShareAppScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    const handleShare = async () => {
        try {
            logEvent('share_app_clicked');
            const result = await Share.share({
                message: 'Check out Sewvee - The best app for boutiques to manage orders and measurements! Download now: https://sewvee.com',
                url: 'https://sewvee.com', // iOS only
                title: 'Sewvee - Boutique Management' // Android only
            });
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
        } catch (error: any) {
            console.error(error.message);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Share App</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.circle}>
                        <Share2 size={50} color={Colors.white} />
                    </View>
                </View>

                <Text style={styles.title}>Love using Sewvee?</Text>
                <Text style={styles.subtitle}>
                    Share the experience with your friends and other boutique owners. Let's grow the community together!
                </Text>

                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Share2 size={20} color={Colors.white} style={{ marginRight: 10 }} />
                    <Text style={styles.shareButtonText}>Share Now</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.footerText}>Thank you for your support!</Text>
                <Heart size={24} color={Colors.danger} style={{ marginTop: 10 }} fill={Colors.danger} />
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    iconContainer: {
        marginBottom: Spacing.xl,
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
        lineHeight: 24,
        marginBottom: Spacing.xxl,
    },
    shareButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    shareButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        width: '60%',
        marginVertical: Spacing.xxl,
    },
    footerText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
});

export default ShareAppScreen;
