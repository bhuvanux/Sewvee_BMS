import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';

interface DailyStatusCardProps {
    title: string;
    count: number;
    color: string;
    icon: React.ElementType;
    onPress?: () => void;
}

const DailyStatusCard: React.FC<DailyStatusCardProps> = ({
    title,
    count,
    color,
    icon: Icon,
    onPress
}) => {
    return (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    <Icon size={28} color={color} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={[styles.count, { color }]}>{count}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadow.medium,
        borderLeftWidth: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    title: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    count: {
        fontFamily: 'Inter-Bold',
        fontSize: 32,
        letterSpacing: -1,
    },
});

export default DailyStatusCard;
