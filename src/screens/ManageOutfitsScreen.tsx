import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Switch,
    Modal,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    Image
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronRight, Image as ImageIcon, MoreVertical, X, Camera, Shirt } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit } from '../types';
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

    // Bottom Action Sheet State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Outfit | null>(null);

    const openAddForm = () => {
        setEditId(null);
        setEditName('');
        setEditImage(null);
        setIsFormVisible(true);
    };

    const openEditForm = (outfit: Outfit) => {
        setEditId(outfit.id);
        setEditName(outfit.name);
        setEditImage(outfit.image || null);
        setIsFormVisible(true);
        // Scroll to top to see form if editing
    };

    const closeForm = () => {
        setIsFormVisible(false);
        setEditId(null);
        setEditName('');
        setEditImage(null);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Match New Order Flow exactly
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
    };

    const handleSave = async () => {
        Keyboard.dismiss();
        if (!editName.trim()) {
            setAlertConfig({ title: 'Missing Information', message: 'Please enter an outfit name.' });
            setAlertVisible(true);
            return;
        }

        // Optimistic Close
        setIsFormVisible(false);

        // Process Image if URI is file-based (rare now since we do Base64 on pick, but keep for safety)
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

            // Cleanup state after successful save
            setEditId(null);
            setEditName('');
            setEditImage(null);

        } catch (error: any) {
            console.error("Save Error:", error);
            // Re-open if failed
            setIsFormVisible(true);
            setAlertConfig({ title: 'Error', message: error.message || 'Could not save outfit' });
            setAlertVisible(true);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setItemToDelete({ id, name });
        setDeleteSheetVisible(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteOutfit(itemToDelete.id);
            setDeleteSheetVisible(false);
            setItemToDelete(null);
        }
    };

    const handleConfigure = (outfit: Outfit) => {
        navigation.navigate('OutfitCategories', {
            outfitId: outfit.id,
            outfitName: outfit.name
        });
    };

    const toggleVisibility = async (id: string, currentStatus: boolean) => {
        await updateOutfit(id, { isVisible: !currentStatus });
    };

    const openActionSheet = (item: Outfit) => {
        setSelectedItem(item);
        setActionSheetVisible(true);
    };

    const renderItem = ({ item }: { item: Outfit }) => (
        <View style={styles.itemRow}>
            {/* Left: Icon/Image */}
            <View style={styles.iconBox}>
                {item.image ? (
                    <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                ) : (
                    <ImageIcon size={24} color={Colors.textSecondary} />
                )}
            </View>

            {/* Middle: Info */}
            <TouchableOpacity
                style={styles.itemInfo}
                onPress={() => handleConfigure(item)}
            >
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{(item.categories?.length || 0)} Categories</Text>
            </TouchableOpacity>

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
        </View>
    );

    const InlineForm = () => (
        <View style={styles.inlineFormContainer}>
            <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>{editId ? 'Edit Outfit' : 'Add New Outfit'}</Text>
                <TouchableOpacity onPress={closeForm}>
                    <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.inlineFormBody}>
                {/* Image Picker */}
                <TouchableOpacity style={styles.inlineImagePicker} onPress={pickImage}>
                    {editImage ? (
                        <View style={styles.inlinePickedImageContainer}>
                            <Image
                                source={{ uri: editImage }}
                                style={styles.inlinePickedImage}
                                resizeMode="cover"
                            />
                            <View style={styles.inlineImageOverlay}>
                                <Edit2 size={16} color="white" />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.inlineImagePlaceholder}>
                            <Camera size={20} color={Colors.textSecondary} />
                            <Text style={styles.inlineImagePlaceholderText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.inlineInputWrapper}>
                    <Text style={styles.inlineLabel}>Outfit Name</Text>
                    <TextInput
                        style={styles.inlineInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="e.g. Kurta, Blouse"
                        placeholderTextColor={Colors.textSecondary}
                    />
                </View>
            </View>

            <View style={styles.inlineFormFooter}>
                <TouchableOpacity style={styles.inlineCancelBtn} onPress={closeForm}>
                    <Text style={styles.inlineCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleSave}>
                    <Text style={styles.inlineSaveBtnText}>Save Outfit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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

            <FlatList
                data={outfits}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <>
                        <Text style={styles.helperText}>
                            Manage the types of outfits you create orders for. Toggle visibility to hide them from the selection list.
                        </Text>
                        {isFormVisible && <InlineForm />}
                    </>
                }
                ListEmptyComponent={
                    !isFormVisible ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Shirt size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Outfits Added</Text>
                            <Text style={styles.emptySubtitle}>
                                Add your first outfit type (e.g. Blouse, Kurta) to get started with orders.
                            </Text>
                        </View>
                    ) : null
                }
            />

            {!isFormVisible && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: 24 + (insets.bottom || 0), zIndex: 9999 }]}
                    onPress={openAddForm}
                >
                    <Plus size={24} color={Colors.white} />
                    <Text style={styles.fabText}>Add Outfit</Text>
                </TouchableOpacity>
            )}



            <AlertModal
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />

            <BottomActionSheet
                visible={actionSheetVisible}
                onClose={() => setActionSheetVisible(false)}
                title={selectedItem?.name}
                actions={[
                    {
                        id: 'edit',
                        label: 'Edit Outfit',
                        icon: Edit2,
                        onPress: () => {
                            if (selectedItem) openEditForm(selectedItem);
                        }
                    },
                    {
                        id: 'delete',
                        label: 'Delete Outfit',
                        icon: Trash2,
                        type: 'danger',
                        onPress: () => {
                            if (selectedItem) handleDelete(selectedItem.id, selectedItem.name);
                        }
                    }
                ]}
            />

            <BottomConfirmationSheet
                visible={deleteSheetVisible}
                onClose={() => setDeleteSheetVisible(false)}
                onConfirm={confirmDelete}
                title="Delete Outfit"
                description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Outfit"
                cancelText="Cancel"
                type="danger"
            />
        </View >
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
        justifyContent: 'space-between',
        height: 56,
        paddingHorizontal: Spacing.md,
    },
    backBtn: {
        padding: 4,
    },
    subtitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 140,
    },
    helperText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        lineHeight: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: 12,
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    itemMeta: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuTrigger: {
        padding: 4,
    },
    imagePickerBtn: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    pickedImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    placeholderImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    toggleTrack: {
        width: 36,
        height: 20,
        borderRadius: 12,
        justifyContent: 'center',
        padding: 2,
    },
    toggleThumb: {
        width: 16,
        height: 16,
        backgroundColor: Colors.white,
        borderRadius: 8,
        ...Shadow.subtle,
    },
    fab: {
        position: 'absolute',
        right: 24,
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        ...Shadow.medium,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fabText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        ...Shadow.medium,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    inputContainer: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 12,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
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
    inlineImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineImagePlaceholderText: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    inlinePickedImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    inlinePickedImage: {
        width: '100%',
        height: '100%',
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
        backgroundColor: '#FAFBFC',
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
