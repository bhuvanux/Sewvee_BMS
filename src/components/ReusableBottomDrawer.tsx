import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';
import { Colors, Shadow } from '../constants/theme';
import { X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReusableBottomDrawerProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    height?: number | string; // Height of the drawer
}

const ReusableBottomDrawer = ({
    visible,
    onClose,
    title,
    children,
    height = 'auto'
}: ReusableBottomDrawerProps) => {
    // Internal visibility state to keep Modal open during exit animation
    const [isVisible, setIsVisible] = useState(visible);

    // Animations
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            // Animate In
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 90,
                    mass: 0.8
                })
            ]).start();
        } else {
            // If parent forces close (rare in this flow, usually handled by internal handleClose)
            // But good to have:
            // handleClose(); -- Wait, this might loop if local state isn't managed well.
            // In this specific design, we assume handleClose is the primary trigger.
            // If parent resets visible prop, we should sync, but careful about animation interrupts.
        }
    }, [visible]);

    const handleClose = () => {
        // Animate Out
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }) // Using timing for exit is often cleaner than spring
        ]).start(() => {
            setIsVisible(false);
            onClose();
        });
    };

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none" // We handle animation manually
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={styles.overlayWrapper}>
                {/* Backdrop with Fade */}
                <TouchableWithoutFeedback onPress={handleClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                {/* Drawer with Slide */}
                <Animated.View
                    style={[
                        styles.drawerContainer,
                        {
                            transform: [{ translateY: slideAnim }],
                            height: height as any
                        }
                    ]}
                >
                    <View style={styles.drawerContent}>
                        {/* Drag Handle Indicator */}
                        <View style={styles.dragHandle} />

                        {/* Title Bar */}
                        {title && (
                            <View style={styles.header}>
                                <Text style={styles.title}>{title}</Text>
                                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                                    <X size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Content */}
                        <View style={{ flex: 1 }}>
                            {children}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawerContainer: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...Shadow.large,
        width: '100%',
        maxHeight: '90%', // Limit height regardless
        overflow: 'hidden', // Ensure content doesn't bleed during radius clip
    },
    drawerContent: {
        flex: 1,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Bottom safe area approximation
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 0
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary
    },
    closeBtn: {
        padding: 4,
    }
});

export default ReusableBottomDrawer;
