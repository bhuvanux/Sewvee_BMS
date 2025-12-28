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
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.itemRow}
            onPress={() => handleConfigure(item)}
        >
            {/* Left: Icon/Image */}
            <View style={styles.iconBox}>
                {item.image ? (
                    <Image
                        source={{ uri: item.image || DEFAULT_IMAGE }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                ) : (
                    <ImageIcon size={24} color={Colors.textSecondary} />
                )}
            </View>

            {/* Middle: Info */}
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{(item.categories?.length || 0)} Categories</Text>
            </View>

            {/* Right: Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={() => toggleVisibility(item.id, item.isVisible)}
                    style={{ padding: 4 }}
                >
                    <View style={[
                        styles.toggleTrack,
                        item.isVisible ? { backgroundColor: Colors.primary } : { backgroundColor: '#E2E8F0' }
                    ]}>
                        <View style={[
                            styles.toggleThumb,
                            item.isVisible ? { transform: [{ translateX: 14 }] } : {}
                        ]} />
                    </View>
                </TouchableOpacity>

                {/* More Menu Trigger */}
                <TouchableOpacity
                    style={styles.menuTrigger}
                    onPress={() => openActionSheet(item)}
                >
                    <MoreVertical size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleConfigure(item)}>
                    <ChevronRight size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    ), [handleConfigure, toggleVisibility, openActionSheet]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.subtitle}>Manage Outfits</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
                <Text style={styles.helperText}>
                    Manage and customize the types of outfits you offer.
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

            {/* Floating Add Button */}
            {!isFormVisible && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={openAddForm}
                >
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            )}


            <AlertModal
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />

            <BottomConfirmationSheet
                visible={deleteSheetVisible}
                title="Delete Outfit?"
                message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive
                onConfirm={confirmDelete}
                onCancel={() => setDeleteSheetVisible(false)}
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
                    <Trash2 size={20} color={Colors.error} />
                    <Text style={[styles.actionText, { color: Colors.error }]}>Delete Outfit</Text>
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
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    subtitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        // Reverted to original as user requested bold only on cards
    },
    helperText: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        textAlign: 'center'
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 100, // Space for FAB
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        ...Shadow.sm,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden'
    },
    itemImage: {
        width: '100%',
        height: '100%'
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 18, // Increased for readability
        color: Colors.textPrimary,
        marginBottom: 2,
        fontWeight: 'bold',
    },
    itemMeta: {
        fontSize: 14, // Increased for readability
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    toggleTrack: {
        width: 32,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleThumb: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'white',
        ...Shadow.sm
    },
    menuTrigger: {
        padding: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.md,
        elevation: 6
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md
    },
    emptyTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginBottom: 4
    },
    emptySubtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        maxWidth: 260
    },

    // Inline Form Styles
    inlineFormContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        ...Shadow.md,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    inlineFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    inlineFormTitle: {
        ...Typography.h4,
        color: Colors.textPrimary,
        // Reverted to original
    },
    inlineFormBody: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20
    },
    inlineImagePicker: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    inlinePickedImageContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 12
    },
    inlinePickedImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    photoReadyContainer: {
        gap: 4
    },
    photoReadyText: {
        ...Typography.caption,
        color: '#166534',
        fontSize: 10,
        fontWeight: '600'
    },
    inlineImageOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 24,
        height: 24,
        borderTopLeftRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    inlineImagePlaceholder: {
        alignItems: 'center',
        gap: 4
    },
    inlineImagePlaceholderText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        fontSize: 10
    },
    inlineInputWrapper: {
        flex: 1,
        justifyContent: 'center'
    },
    inlineLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    inlineInput: {
        ...Typography.body,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 8,
        color: Colors.textPrimary,
        height: 40
    },
    inlineFormFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12
    },
    inlineCancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F1F5F9'
    },
    inlineCancelBtnText: {
        ...Typography.button,
        color: Colors.textSecondary,
        fontSize: 14
    },
    inlineSaveBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: Colors.primary
    },
    inlineSaveBtnText: {
        ...Typography.button,
        color: 'white',
        fontSize: 14
    },
    actionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20
    },
    actionText: {
        ...Typography.body,
        color: Colors.textPrimary,
        marginLeft: 16
    },
    destructiveAction: {
        marginTop: 4
    },
    actionDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20
    },
    dragHandle: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginRight: 4,
        marginLeft: -4
    }
});

export default ManageOutfitsScreen;
