import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Switch,
    Modal,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    Image,
    TouchableOpacity
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronRight, Image as ImageIcon, MoreVertical, X, Camera, Shirt, Layers, Check, CheckCircle2, AlertCircle, PlayCircle, StopCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { Image as ExpoImage } from 'expo-image';

import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit } from '../types';


// --- STABLE FORM COMPONENTS ---

interface OutfitFormProps {
    visible: boolean;
    editId: string | null;
    editName: string;
    editImage: string | null;
    setEditName: (text: string) => void;
    pickImage: () => void;
    handleSave: () => void;
    closeForm: () => void;
}

const OutfitForm = React.memo(({
    visible,
    editId,
    editName,
    editImage,
    setEditName,
    pickImage,
    handleSave,
    closeForm
}: OutfitFormProps) => {
    if (!visible) return null;
    const editMode = editId !== null;

    return (
        <View style={styles.inlineFormContainer}>
            <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>
                    {editMode ? 'Edit' : 'Add'} Outfit
                </Text>
                <TouchableOpacity onPress={closeForm}>
                    <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.inlineFormBody}>
                {/* Image Picker */}
                <TouchableOpacity style={styles.inlineImagePicker} onPress={pickImage}>
                    <View style={styles.inlinePickedImageContainer}>
                        {editImage ? (
                            <Image
                                source={{ uri: editImage }}
                                style={styles.inlinePickedImage}
                                resizeMode="cover"
                            />
                        ) : (
                            // Fallback just in case, though editImage should always be set
                            <Image
                                source={{ uri: "https://placehold.co/600x600/e2e8f0/475569.png?text=Stitched\\nOutfit&font=roboto" }}
                                style={styles.inlinePickedImage}
                                resizeMode="cover"
                            />
                        )}

                        <View style={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            paddingHorizontal: 4,
                            paddingVertical: 2,
                            borderRadius: 4
                        }}>
                            <Text style={{ color: 'white', fontSize: 8, fontWeight: '600' }}>Upload Photo</Text>
                        </View>

                        <View style={styles.inlineImageOverlay}>
                            <Edit2 size={16} color="white" />
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.inlineInputWrapper}>
                    <Text style={styles.inlineLabel}>Outfit Name</Text>
                    <TextInput
                        style={styles.inlineInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="e.g. Silk Saree, Cotton Blouse"
                        placeholderTextColor={Colors.textSecondary}
                        autoFocus
                    />
                </View>
            </View>

            <View style={styles.inlineFormFooter}>
                <TouchableOpacity style={styles.inlineCancelBtn} onPress={closeForm}>
                    <Text style={styles.inlineCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleSave}>
                    <Text style={styles.inlineSaveBtnText}>{editMode ? 'Update Outfit' : 'Save Outfit'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';
import BottomActionSheet from '../components/BottomActionSheet';


const ManageOutfitsScreen = ({ navigation }: any) => {
    const { outfits, addOutfit, updateOutfit, deleteOutfit } = useData();
    const insets = useSafeAreaInsets();

    // Form State (Inline instead of Modal)
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editImage, setEditImage] = useState<string | null>(null);

    // Alert State (Validation/Error)
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });


    // Delete Confirmation State
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

    // Default Image for outfits
    // Default Image for outfits - Stitching/Fashion Theme
    // Default Image for outfits - Stitching/Fashion Theme
    const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a18e474?q=80&w=1080&auto=format&fit=crop";

    // Bottom Action Sheet State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Outfit | null>(null);

    const openAddForm = useCallback(() => {
        setEditId(null);
        setEditName('');
        setEditImage(DEFAULT_IMAGE); // Pre-fill with default
        setIsFormVisible(true);
    }, []);

    const openEditForm = useCallback((outfit: Outfit) => {
        setEditId(outfit.id);
        setEditName(outfit.name);
        setEditImage(outfit.image || DEFAULT_IMAGE);
        setIsFormVisible(true);
    }, []);

    const closeForm = useCallback(() => {
        setIsFormVisible(false);
        setEditId(null);
        setEditName('');
        setEditImage(null);
    }, []);

    const pickImage = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets) {
                const asset = result.assets[0];
                try {
                    const manipResult = await ImageManipulator.manipulateAsync(
                        asset.uri,
                        [{ resize: { width: 1080 } }],
                        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    setEditImage(manipResult.uri);
                } catch (e) {
                    setEditImage(asset.uri);
                }
            }
        } catch (error) {
            console.error('Pick Image Error:', error);
        }
    }, [setEditImage]);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        if (!editName.trim()) {
            setAlertConfig({ title: 'Missing Information', message: 'Please enter an outfit name.' });
            setAlertVisible(true);
            return;
        }

        // Optimistic Close
        setIsFormVisible(false);

        let finalImage = editImage;
        if (editImage && (editImage.startsWith('file:') || editImage.startsWith('content:'))) {
            try {
                const manipResult = await ImageManipulator.manipulateAsync(
                    editImage,
                    [{ resize: { width: 400 } }],
                    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );
                if (manipResult.base64) {
                    finalImage = `data:image/jpeg;base64,${manipResult.base64}`;
                }
            } catch (error) {
                console.error("Save processing error:", error);
            }
        }

        try {
            if (editId) {
                await updateOutfit(editId, {
                    name: editName,
                    image: finalImage
                });
            } else {
                await addOutfit({
                    name: editName,
                    image: finalImage,
                    isVisible: true,
                    categories: []
                });
            }

            setEditId(null);
            setEditName('');
            setEditImage(null);

        } catch (error: any) {
            console.error("Save Error:", error);
            setIsFormVisible(true);
            setAlertConfig({ title: 'Error', message: error.message || 'Could not save outfit' });
            setAlertVisible(true);
        }
    }, [editId, editName, editImage, updateOutfit, addOutfit]);

    const handleDelete = useCallback((id: string, name: string) => {
        setItemToDelete({ id, name });
        setDeleteSheetVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (itemToDelete) {
            try {
                await deleteOutfit(itemToDelete.id);
                setDeleteSheetVisible(false);
                setItemToDelete(null);
            } catch (error: any) {
                console.error("Delete failed:", error);
                Alert.alert("Delete Error", "Could not delete outfit. Please try again.");
            }
        }
    }, [itemToDelete, deleteOutfit]);

    const handleConfigure = useCallback((outfit: Outfit) => {
        navigation.navigate('OutfitCategories', {
            outfitId: outfit.id,
            outfitName: outfit.name
        });
    }, [navigation]);

    const toggleVisibility = useCallback(async (id: string, currentStatus: boolean) => {
        await updateOutfit(id, { isVisible: !currentStatus });
    }, [updateOutfit]);

    const openActionSheet = useCallback((item: Outfit) => {
        setSelectedItem(item);
        setActionSheetVisible(true);
    }, []);

    const renderItem = useCallback(({ item }: { item: Outfit }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => item.isVisible && navigation.navigate('OutfitCategories', {
                    outfitId: item.id,
                    outfitName: item.name
                })}
                activeOpacity={item.isVisible ? 0.7 : 1}
            >
                <View style={[styles.iconBox, !item.isVisible && { opacity: 0.5 }]}>
                    {item.image ? (
                        <ExpoImage source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" />
                    ) : (
                        <Shirt size={24} color={Colors.textSecondary} />
                    )}
                </View>
                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, !item.isVisible && { color: Colors.textSecondary }]}>
                        {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                        {item.isVisible ? `${item.categories?.length || 0} Categories` : 'Archived'}
                    </Text>
                </View>
                {item.isVisible && <ChevronRight size={20} color={Colors.textSecondary} />}
            </TouchableOpacity>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openActionSheet(item)}
                >
                    <MoreVertical size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    ), [navigation, openActionSheet]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerSubtitle}>Sewvee Master</Text>
                        <Text style={styles.headerTitle}>Manage Outfits</Text>
                    </View>
                    {!isFormVisible ? (
                        <TouchableOpacity onPress={openAddForm} style={styles.backBtn}>
                            <Plus size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>
            </View>

            <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
                <Text style={styles.helperText}>
                    Manage and customize the types of outfits you offer.
                    {'\n'}Categories and designs are nested within each outfit.
                </Text>

                <OutfitForm
                    visible={isFormVisible}
                    editId={editId}
                    editName={editName}
                    editImage={editImage}
                    setEditName={setEditName}
                    pickImage={pickImage}
                    handleSave={handleSave}
                    closeForm={closeForm}
                />
            </View>

            <FlatList
                data={outfits}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !isFormVisible ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Layers size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Outfits Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Add your first outfit type to get started.
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* Floating Add Button Removed as per request */}



            <AlertModal
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />

            <BottomConfirmationSheet
                visible={deleteSheetVisible}
                onClose={() => setDeleteSheetVisible(false)}
                onConfirm={confirmDelete}
                title="Delete Outfit?"
                description={`Are you sure you want to delete "${itemToDelete?.name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            <BottomActionSheet
                visible={actionSheetVisible}
                onClose={() => setActionSheetVisible(false)}
                title={selectedItem?.name || 'Outfit Options'}
            >
                <TouchableOpacity
                    style={styles.actionOption}
                    onPress={() => {
                        setActionSheetVisible(false);
                        if (selectedItem) openEditForm(selectedItem);
                    }}
                >
                    <Edit2 size={20} color={Colors.textPrimary} />
                    <Text style={styles.actionText}>Edit Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionOption}
                    onPress={() => {
                        setActionSheetVisible(false);
                        if (selectedItem) handleConfigure(selectedItem);
                    }}
                >
                    <Shirt size={20} color={Colors.textPrimary} />
                    <Text style={styles.actionText}>Manage Categories</Text>
                </TouchableOpacity>

                <View style={styles.actionDivider} />

                <TouchableOpacity
                    style={[styles.actionOption, styles.destructiveAction]}
                    onPress={() => {
                        setActionSheetVisible(false);
                        if (selectedItem) handleDelete(selectedItem.id, selectedItem.name);
                    }}
                >
                    <Trash2 size={20} color={Colors.danger} />
                    <Text style={[styles.actionText, { color: Colors.danger }]}>Delete Outfit</Text>
                </TouchableOpacity>
            </BottomActionSheet>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 60,
    },
    backBtn: {
        padding: 4,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerSubtitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    headerTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 100,
    },
    helperText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },

    // Standardized Card Styles
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: 12,
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 12,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    itemMeta: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: Colors.border,
        paddingLeft: 12,
    },
    actionBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    // Inline Form Styles
    inlineFormContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.medium,
    },
    inlineFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    inlineFormTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    inlineFormBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    inlineImagePicker: {
        width: 80,
        height: 80,
    },
    inlinePickedImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
    },
    inlinePickedImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    inlineImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineInputWrapper: {
        flex: 1,
    },
    inlineLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    inlineInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 10,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
        backgroundColor: '#FAFCFC',
    },
    inlineFormFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    inlineCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    inlineCancelBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    inlineSaveBtn: {
        flex: 2,
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    inlineSaveBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.white,
    },

    // Action Sheet & Helper Styles
    actionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    actionText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
        marginLeft: 16,
    },
    destructiveAction: {
        marginTop: 4,
    },
    actionDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 20,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        backgroundColor: '#F0FDF9',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ManageOutfitsScreen;
