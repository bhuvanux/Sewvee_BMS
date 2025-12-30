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
    Platform,
    Keyboard,
    LayoutAnimation,
    UIManager
} from 'react-native';
import { Colors, Shadow } from '../constants/theme';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const insets = useSafeAreaInsets();

    // Keyboard Listeners for Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const hideSub = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardHeight(0);
            });

            return () => {
                showSub.remove();
                hideSub.remove();
            };
        }
    }, []);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={[styles.overlayWrapper]}>
                {/* Backdrop - Touchable to close */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                {/* Drawer Content */}
                <View
                    style={[
                        styles.drawerContainer,
                        {
                            height: height as any,
                            marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
                            // Refined Fix: Use 80px min for Android as per user request
                            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 80 : 32)
                        }
                    ]}
                >
                    {/* Drag Handle Indicator */}
                    <View style={styles.dragHandle} />

                    {/* Title Bar */}
                    {title && (
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Content */}
                    <View>
                        {children}
                    </View>
                </View>
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
        maxHeight: '90%', // Limit height
        overflow: 'hidden',
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
