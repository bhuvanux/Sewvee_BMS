import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    StatusBar
} from 'react-native';
import { useToast } from '../context/ToastContext';
import { Colors, Spacing, Shadow } from '../constants/theme';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const Toast: React.FC = () => {
    const { toast, hideToast } = useToast();
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [show, setShow] = React.useState(toast.visible);

    useEffect(() => {
        if (toast.visible) {
            setShow(true);
            // Slide in
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            // Slide out
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -150,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start(() => setShow(false));
        }
    }, [toast.visible]);

    if (!show) return null;

    const getIcon = () => {
        const size = 20;
        switch (toast.type) {
            case 'success':
                return <CheckCircle2 size={size} color="#059669" />;
            case 'error':
                return <AlertCircle size={size} color={Colors.danger} />;
            case 'warning':
                return <AlertTriangle size={size} color="#D97706" />;
            case 'dark':
                return <AlertCircle size={size} color="#FCD34D" />;
            case 'info':
            default:
                return <Info size={size} color={Colors.primary} />;
        }
    };

    const getBgColor = () => {
        switch (toast.type) {
            case 'success':
                return '#ECFDF5';
            case 'error':
                return '#FEF2F2';
            case 'warning':
                return '#FFFBEB';
            case 'dark':
                return '#1F2937';
            case 'info':
            default:
                return '#EFF6FF';
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success':
                return '#10B981';
            case 'error':
                return '#EF4444';
            case 'warning':
                return '#F59E0B';
            case 'dark':
                return '#F59E0B';
            case 'info':
            default:
                return '#3B82F6';
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: insets.top + 10,
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                }
            ]}
        >
            <View style={[
                styles.content,
                { backgroundColor: getBgColor(), borderLeftColor: getBorderColor() }
            ]}>
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>
                <Text style={[styles.message, toast.type === 'dark' && { color: '#FFFFFF' }]} numberOfLines={2}>
                    {toast.message}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 12,
        right: 12,
        zIndex: 99999,
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        borderLeftWidth: 4,
        ...Shadow.medium,
        ...Platform.select({
            ios: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
            },
            android: {
                backgroundColor: 'white',
                elevation: 10,
            }
        }),
    },
    iconContainer: {
        marginRight: 10,
    },
    message: {
        flex: 1,
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
    }
});

export default Toast;
