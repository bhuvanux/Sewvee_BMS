import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Keyboard,
    Image // Added Image from react-native
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Edit2, Trash2, ChevronRight, Image as ImageIcon, X, Camera, Plus, Layers, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image as ExpoImage } from 'expo-image';

// Removed: import { Image } from 'expo-image';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit, OutfitCategory } from '../types';

import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';

// --- STABLE FORM COMPONENTS ---

interface CategoryFormProps {
    visible: boolean;
    categoryId: string | null;
    categoryName: string;
    editImage: string | null;
    setCategoryName: (text: string) => void;
    pickImage: () => void;
    handleSave: () => void;
    closeForm: () => void;
}

const CategoryForm = React.memo(({
    visible,
    categoryId,
    categoryName,
    editImage,
    setCategoryName,
    pickImage,
    handleSave,
    closeForm
}: CategoryFormProps) => {
    if (!visible) return null;

    return (
        <View style={styles.inlineFormContainer}>
            <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>{categoryId ? 'Edit Category' : 'Add New Category'}</Text>
                <TouchableOpacity onPress={closeForm}>
                    <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.inlineFormBody}>
                {/* Image Picker - EXACT MATCH to ManageOutfits Style */}
                <TouchableOpacity style={styles.inlineImagePicker} onPress={pickImage}>
                    <View style={styles.inlinePickedImageContainer}>
                        {editImage ? (
                            <Image
                                source={{ uri: editImage }}
                                style={styles.inlinePickedImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.inlinePickedImage, { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }]}>
                                <ImageIcon size={32} color="#166534" opacity={0.5} />
                            </View>
                        )}

                        {/* "Upload Photo" Badge - Always Visible (Green Style) */}
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

                        {/* Edit Icon Overlay - Always Visible */}
                        <View style={styles.inlineImageOverlay}>
                            <Edit2 size={16} color="white" />
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={[styles.inlineInputWrapper, { flex: 1 }]}>
                    <Text style={styles.inlineLabel}>Category Name</Text>
                    <TextInput
                        style={styles.inlineInput}
                        value={categoryName}
                        onChangeText={setCategoryName}
                        placeholder="e.g. Neck, Sleeve, Back"
                        placeholderTextColor={Colors.textSecondary}
                        autoFocus={!categoryId}
                    />
                </View>
            </View>

            <View style={styles.inlineFormFooter}>
                <TouchableOpacity style={styles.inlineCancelBtn} onPress={closeForm}>
                    <Text style={styles.inlineCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleSave}>
                    <Text style={styles.inlineSaveBtnText}>Save Category</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const OutfitCategoriesScreen = ({ navigation, route }: any) => {
    const { outfitId, outfitName } = route.params;
    const { outfits, updateOutfit } = useData();
    const insets = useSafeAreaInsets();

    const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);

    // Form State (Inline instead of Modal)
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [editImage, setEditImage] = useState<string | null>(null);


    // Success Modal


    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    // Delete State
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        const found = outfits.find(o => o.id === outfitId);
        if (found) setCurrentOutfit(found);
    }, [outfits, outfitId]);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        if (!categoryName.trim()) {
            setAlertConfig({ title: 'Missing Information', message: 'Please enter category name.' });
            setAlertVisible(true);
            return;
        }

        if (!currentOutfit) {
            setAlertConfig({ title: 'Error', message: 'Outfit data not found.' });
            setAlertVisible(true);
            return;
        }

        setIsFormVisible(false);

        try {
            let imageToSave = editImage;
            if (editImage && (editImage.startsWith('file://') || editImage.startsWith('content://'))) {
                try {
                    const manipResult = await ImageManipulator.manipulateAsync(
                        editImage,
                        [{ resize: { width: 400 } }],
                        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                    );
                    if (manipResult.base64) {
                        imageToSave = `data:image/jpeg;base64,${manipResult.base64}`;
                    }
                } catch (imgError) {
                    console.error('Image processing failed on save:', imgError);
                }
            }

            if (editMode) {
                const updatedCategories = (currentOutfit.categories || []).map((cat: OutfitCategory) => {
                    if (cat.id === categoryId) {
                        return { ...cat, name: categoryName.trim(), image: imageToSave };
                    }
                    return cat;
                });

                await updateOutfit(outfitId, {
                    ...currentOutfit,
                    categories: updatedCategories
                });
            } else {
                const newCategory: OutfitCategory = {
                    id: Date.now().toString(),
                    name: categoryName.trim(),
                    image: imageToSave,
                    subCategories: [],
                    isVisible: true,
                };

                await updateOutfit(outfitId, {
                    ...currentOutfit,
                    categories: [...(currentOutfit.categories || []), newCategory]
                });
            }

            setIsFormVisible(false);
            setCategoryId(null);
            setCategoryName('');
            setEditImage(null);
            setEditMode(false);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save category');
        }
    }, [categoryName, currentOutfit, editImage, editMode, categoryId, outfitId, updateOutfit]);

    const handleDelete = useCallback((id: string, name: string) => {
        setItemToDelete({ id, name });
        setDeleteSheetVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (itemToDelete && currentOutfit) {
            const updatedCategories = (currentOutfit.categories || []).filter(c => c.id !== itemToDelete.id);
            await updateOutfit(outfitId, { categories: updatedCategories });
            setDeleteSheetVisible(false);
            setItemToDelete(null);
        }
    }, [itemToDelete, currentOutfit, outfitId, updateOutfit]);

    const openAddForm = useCallback(() => {
        setEditMode(false);
        setCategoryName('');
        setEditImage(null);
        setIsFormVisible(true);
    }, []);

    const openEditForm = useCallback((cat: OutfitCategory) => {
        setEditMode(true);
        setCategoryId(cat.id);
        setCategoryName(cat.name);
        setEditImage(cat.image || null);
        setIsFormVisible(true);
    }, []);

    const closeForm = useCallback(() => {
        setIsFormVisible(false);
        setCategoryId(null);
        setCategoryName('');
        setEditImage(null);
        setEditMode(false);
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

    const renderItem = useCallback(({ item }: { item: OutfitCategory }) => (
        <View style={styles.card}>
            {/* Main Content Area - Navigates to EditCategory */}
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => navigation.navigate('EditCategory', {
                    outfitId,
                    categoryId: item.id,
                    categoryName: item.name
                })}
            >
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
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>{(item.subCategories?.length || 0)} Sub Categories</Text>
                </View>
                <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Actions (Edit/Delete) - Directly Visible */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openEditForm(item)}
                >
                    <Edit2 size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.id, item.name)}
                >
                    <Trash2 size={18} color={Colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
    ), [navigation, outfitId, openEditForm, handleDelete]);



    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerSubtitle}>Category Manager</Text>
                        <Text style={styles.headerTitle}>{outfitName}</Text>
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
                {isFormVisible && (
                    <CategoryForm
                        visible={isFormVisible}
                        categoryId={categoryId}
                        categoryName={categoryName}
                        editImage={editImage}
                        setCategoryName={setCategoryName}
                        pickImage={pickImage}
                        handleSave={handleSave}
                        closeForm={closeForm}
                    />
                )}
            </View>

            <FlatList
                data={currentOutfit?.categories || []}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !isFormVisible ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Layers size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Categories Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Add a category (e.g. Neck, Sleeve) to start organizing designs.
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* Floating Add Button Removed */}

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
                title="Delete Category"
                description={`Are you sure you want to delete "${itemToDelete?.name}"?`}
                confirmText="Delete Category"
                cancelText="Cancel"
                type="danger"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 60,
    },
    backBtn: { padding: 4 },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerSubtitle: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.textSecondary },
    headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.textPrimary },
    listContent: { padding: Spacing.md, paddingBottom: 100 },

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
    // Inline Form Styles
    inlineFormContainer: {
        backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.xl,
        borderWidth: 1, borderColor: Colors.border, ...Shadow.medium,
    },
    inlineFormHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    inlineFormTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary },
    inlineFormBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    inlineImagePicker: { width: 80, height: 80 },
    inlinePickedImageContainer: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
    inlinePickedImage: { width: 80, height: 80, borderRadius: 8 },
    inlineImageOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
    },
    inlineInputWrapper: { flex: 1 },
    inlineLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
    inlineInput: {
        borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10,
        fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.textPrimary, backgroundColor: '#FAFAFC',
    },
    inlineFormFooter: { flexDirection: 'row', gap: 12 },
    inlineCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    inlineCancelBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textSecondary },
    inlineSaveBtn: { flex: 2, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    inlineSaveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.white },

    // FAB
    fab: {
        position: 'absolute',
        bottom: Spacing.xl,
        right: Spacing.lg,
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...Shadow.medium,
    },
    fabText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },

    // Empty State
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyIconBox: { width: 64, height: 64, backgroundColor: '#F0FDF9', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default OutfitCategoriesScreen;
