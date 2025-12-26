import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, ActivityIndicator, Share } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors, Spacing, Shadow, Typography } from '../constants/theme';
import { ChevronLeft, Printer, Share2, X } from 'lucide-react-native';

interface PDFPreviewModalProps {
    visible: boolean;
    onClose: () => void;
    html: string;
    onPrint: () => void;
    onShare: () => void;
    title?: string;
}

const PDFPreviewModal = ({
    visible,
    onClose,
    html,
    onPrint,
    onShare,
    title = 'PDF Preview'
}: PDFPreviewModalProps) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={28} color={Colors.primary} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>{title}</Text>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerIcon} onPress={onPrint}>
                            <Printer size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIcon} onPress={onShare}>
                            <Share2 size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* WebView Container */}
                <View style={styles.webviewContainer}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html }}
                        style={styles.webview}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                            </View>
                        )}
                    />
                </View>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.footerBtn, styles.closeBtn]} onPress={onClose}>
                        <X size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={styles.closeBtnText}>Close Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.footerBtn, styles.printBtn]} onPress={onPrint}>
                        <Printer size={20} color={Colors.white} style={{ marginRight: 8 }} />
                        <Text style={styles.printBtnText}>Print Now</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        ...Shadow.subtle,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        color: Colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        padding: 8,
        marginLeft: 8,
    },
    webviewContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    webview: {
        flex: 1,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    footer: {
        padding: 16,
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    footerBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.small,
    },
    closeBtn: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    closeBtnText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    printBtn: {
        backgroundColor: Colors.primary,
    },
    printBtnText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
});

export default PDFPreviewModal;
