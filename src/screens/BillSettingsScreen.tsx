import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Save, FileText, PenTool, Trash2, X } from 'lucide-react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SuccessModal from '../components/SuccessModal';

const BillSettingsScreen = ({ navigation }: any) => {
    const { company, saveCompany } = useAuth();
    const insets = useSafeAreaInsets();
    const signatureRef = useRef<any>(null);

    const [terms, setTerms] = useState(company?.billTerms || '');
    const [signature, setSignature] = useState<string | null>(company?.billSignature || null);
    const [signatureModalVisible, setSignatureModalVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDesc, setAlertDesc] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'warning' | 'info' | 'error'>('success');

    const handleSignatureSave = (signatureData: string) => {
        setSignature(signatureData);
        setSignatureModalVisible(false);
    };

    const handleClearSignature = () => {
        setSignature(null);
    };

    const handleSave = async () => {
        try {
            await saveCompany({
                ...company,
                billTerms: terms,
                billSignature: signature
            });
            setSuccessVisible(true);
        } catch (error) {
            setAlertTitle('Error');
            setAlertDesc('Failed to save bill settings. Please try again.');
            setAlertType('error');
            setAlertVisible(true);
        }
    };

    const signatureStyle = `.m-signature-pad { box-shadow: none; border: none; } 
        .m-signature-pad--body { border: none; }
        .m-signature-pad--footer { display: none; margin: 0px; }
        body,html { width: 100%; height: 100%; }`;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={Typography.h3}>Order Settings</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveIconButton}>
                    <Save size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <FileText size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                    </View>
                    <Text style={styles.sectionDesc}>This will be printed at the bottom of every bill.</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textArea}
                            placeholderTextColor={Colors.textSecondary}
                            placeholder="Enter your terms and conditions (e.g., No refund after 7 days, etc.)"
                            value={terms}
                            onChangeText={setTerms}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <PenTool size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>Digital Signature</Text>
                    </View>
                    <Text style={styles.sectionDesc}>Draw your signature to appear on the digital invoice.</Text>

                    <TouchableOpacity
                        style={styles.signaturePicker}
                        onPress={() => setSignatureModalVisible(true)}
                    >
                        {signature ? (
                            <View style={styles.signatureContainer}>
                                <Image source={{ uri: signature }} style={styles.signatureImage} resizeMode="contain" />
                                <View style={styles.signatureActions}>
                                    <TouchableOpacity
                                        style={styles.clearBadge}
                                        onPress={handleClearSignature}
                                    >
                                        <Trash2 size={14} color={Colors.white} />
                                        <Text style={styles.badgeText}>Clear</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.changeBadge}
                                        onPress={() => setSignatureModalVisible(true)}
                                    >
                                        <PenTool size={14} color={Colors.white} />
                                        <Text style={styles.badgeText}>Redraw</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.signaturePlaceholder}>
                                <PenTool size={32} color={Colors.textSecondary} />
                                <Text style={styles.placeholderText}>Tap to draw your signature</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Order Settings</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Signature Drawing Modal */}
            <Modal
                visible={signatureModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setSignatureModalVisible(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
                            <X size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Draw Your Signature</Text>
                        <TouchableOpacity onPress={() => signatureRef.current?.clearSignature()}>
                            <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.canvasContainer}>
                        <SignatureScreen
                            ref={signatureRef}
                            onOK={handleSignatureSave}
                            onEmpty={() => {
                                setAlertTitle('Empty Signature');
                                setAlertDesc('Please draw your signature before saving.');
                                setAlertType('warning');
                                setAlertVisible(true);
                            }}
                            descriptionText=""
                            clearText="Clear"
                            confirmText="Save"
                            webStyle={signatureStyle}
                            backgroundColor="#FFFFFF"
                            penColor="#000000"
                            dotSize={2}
                            minWidth={2}
                            maxWidth={4}
                        />
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setSignatureModalVisible(false)}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={() => signatureRef.current?.readSignature()}
                        >
                            <Text style={styles.confirmBtnText}>Save Signature</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <SuccessModal
                visible={successVisible}
                onClose={() => {
                    setSuccessVisible(false);
                    navigation.goBack();
                }}
                title="Settings Saved"
                description="Your bill terms and signature have been successfully updated."
            />

            <SuccessModal
                visible={alertVisible}
                onClose={() => setAlertVisible(false)}
                title={alertTitle}
                description={alertDesc}
                type={alertType}
            />
        </KeyboardAvoidingView>
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
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 4,
    },
    saveIconButton: {
        padding: 4,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    sectionDesc: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    inputContainer: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: Spacing.sm,
        minHeight: 120,
    },
    textArea: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
        padding: Spacing.xs,
    },
    signaturePicker: {
        height: 180,
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    signaturePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    signatureContainer: {
        flex: 1,
        position: 'relative',
        padding: Spacing.md,
        backgroundColor: '#FCFCFC',
    },
    signatureImage: {
        width: '100%',
        height: '100%',
    },
    signatureActions: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        gap: 8,
    },
    clearBadge: {
        backgroundColor: Colors.danger,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...Shadow.subtle,
    },
    changeBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...Shadow.subtle,
    },
    badgeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.white,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
        ...Shadow.medium,
    },
    saveButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    clearText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.danger,
    },
    canvasContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: Colors.border,
        margin: Spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    confirmBtn: {
        flex: 2,
        height: 52,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.white,
    },
});

export default BillSettingsScreen;
