import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
    Keyboard
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Plus, Edit2, Trash2, X, Image as ImageIcon, Layers, Check, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image as ExpoImage } from 'expo-image';
import { useData, DEFAULT_OUTFITS } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit, OutfitCategory, OutfitSubCategory, OutfitOption } from '../types';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';

// --- STABLE FORM COMPONENTS ---

interface CategoryDetailFormProps {
    visible: boolean;
    editMode: boolean;
    modalType: 'subcategory' | 'option';
    inputName: string;
    editImage: string | null;
    suggestions?: string[];
    setInputName: (text: string) => void;
    pickImage: () => void;
    handleSave: () => void;
    closeForm: () => void;
}

const CategoryDetailForm = React.memo(({
    visible,
    editMode,
    modalType,
    inputName,
    editImage,
    suggestions,
    setInputName,
    pickImage,
    handleSave,
    closeForm
}: CategoryDetailFormProps) => {
    if (!visible) return null;

    return (
        <View style={styles.inlineFormContainer}>
            <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>
                    {editMode ? 'Edit' : 'Add'} {modalType === 'subcategory' ? 'Sub-Category' : 'Option'}
                </Text>
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

                        {/* "Upload Photo" Badge - Always Visible */}
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
                    <Text style={styles.inlineLabel}>Name</Text>
                    <TextInput
                        style={styles.inlineInput}
                        value={inputName}
                        onChangeText={setInputName}
                        placeholder={modalType === 'subcategory' ? "e.g. Back, Sleeve" : "e.g. Boat Neck, Long"}
                        placeholderTextColor={Colors.textSecondary}
                        autoFocus={!editMode}
                    />
                </View>
            </View>

            {/* Suggestions Chips - Moved outside body for more space */}
            {!editMode && modalType === 'subcategory' && suggestions && suggestions.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.suggestionLabel}>Suggestions (tap to autofill):</Text>
                    <View style={styles.suggestionContainer}>
                        {suggestions.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={styles.suggestionChip}
                                onPress={() => setInputName(s)}
                            >
                                <Text style={styles.suggestionText}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.inlineFormFooter}>
                <TouchableOpacity style={styles.inlineCancelBtn} onPress={closeForm}>
                    <Text style={styles.inlineCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleSave}>
                    <Text style={styles.inlineSaveBtnText}>{editMode ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
            </View>
        </View >
    );
});

const EditCategoryScreen = ({ navigation, route }: any) => {
    const { outfitId, categoryId, categoryName } = route.params;
    const { outfits, updateOutfit } = useData();
    const insets = useSafeAreaInsets();

    // Use DEFAULT_OUTFITS for suggestions (Safe to call unconditinally)
    const suggestions = React.useMemo(() => {
        // Extract unique subcat names from all defaults
        const names = new Set<string>();
        // Note: DEFAULT_OUTFITS should be imported. If not, we might need to import it or use 'outfits' if they contain defaults.
        // Assuming DEFAULT_OUTFITS is available in scope or imported from DataContext
        // If implicit from context use, we might use 'outfits' state if seeded. 
        // But the original code referenced DEFAULT_OUTFITS global? 
        // Let's assume it's imported. If not, use empty array safely for now to avoid crash.
        // Actually, line 496 in original used it. Let's check imports.
        // If not imported, I'll add it.
        try {
            // Using a safer approach:
            const source = (typeof DEFAULT_OUTFITS !== 'undefined') ? DEFAULT_OUTFITS : [];
            source.forEach((o: any) => {
                o.categories?.forEach((c: any) => {
                    c.subCategories?.forEach((sc: any) => names.add(sc.name));
                });
            });
        } catch (e) {
            // Ignore
        }
        return Array.from(names).slice(0, 8);
    }, []);

    const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);
    const [currentCategory, setCurrentCategory] = useState<OutfitCategory | null>(null);

    // Form State (Inline instead of Modal)
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [modalType, setModalType] = useState<'subcategory' | 'option'>('subcategory');
    const [editMode, setEditMode] = useState(false);
    const [targetId, setTargetId] = useState<string | null>(null); // SubCategory ID or Option ID
    const [parentId, setParentId] = useState<string | null>(null); // For Options (SubCategory ID)
    const [inputName, setInputName] = useState('');
    const [editImage, setEditImage] = useState<string | null>(null);


    // Success Modal


    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    // Delete State
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{
        type: 'subcategory' | 'option' | 'suboption',
        id: string,
        name: string,
        parentId?: string,
        subCategoryId?: string
    } | null>(null);

    useEffect(() => {
        const foundOutfit = outfits.find(o => o.id === outfitId);
        if (foundOutfit) {
            setCurrentOutfit(foundOutfit);
            const foundCat = foundOutfit.categories?.find(c => c.id === categoryId);
            if (foundCat) {
                setCurrentCategory(foundCat);
            }
        }
    }, [outfits, outfitId, categoryId]);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        if (!inputName.trim()) {
            setAlertConfig({ title: 'Missing Information', message: 'Please enter a name.' });
            setAlertVisible(true);
            return;
        }
        if (!currentOutfit || !currentCategory) return;

        setIsFormVisible(false);

        let updatedCategories = [...(currentOutfit.categories || [])];
        const catIndex = updatedCategories.findIndex(c => c.id === categoryId);
        if (catIndex === -1) return;

        let finalImage = editImage;
        if (editImage && (editImage.startsWith('file:') || editImage.startsWith('content:'))) {
            try {
                const manipResult = await ImageManipulator.manipulateAsync(
                    editImage,
                    [{ resize: { width: 300 } }],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );
                if (manipResult.base64) {
                    finalImage = `data:image/jpeg;base64,${manipResult.base64}`;
                }
            } catch (e) {
                console.error('Image processing failed during save', e);
            }
        }

        const updatedCategory = { ...updatedCategories[catIndex] };
        let updatedSubCategories = [...(updatedCategory.subCategories || [])];

        try {
            if (modalType === 'subcategory') {
                if (editMode && targetId) {
                    updatedSubCategories = updatedSubCategories.map(sc =>
                        sc.id === targetId ? { ...sc, name: inputName.trim(), image: finalImage || null } : sc
                    );
                } else {
                    // Check for default options if name matches a known default
                    let initialOptions: OutfitOption[] = [];
                    // Flatten defaults to find matching subcat
                    const allDefaults: OutfitSubCategory[] = [];
                    DEFAULT_OUTFITS.forEach((o: any) => {
                        o.categories?.forEach((c: any) => {
                            c.subCategories?.forEach((sc: any) => {
                                allDefaults.push({
                                    ...sc,
                                    options: sc.options || []
                                } as OutfitSubCategory);
                            });
                        });
                    });

                    const foundDefault = allDefaults.find(d => d.name.toLowerCase() === inputName.trim().toLowerCase());
                    if (foundDefault && foundDefault.options) {
                        initialOptions = foundDefault.options.map(opt => ({
                            ...opt,
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5) // Ensure unique IDs
                        }));
                    }

                    updatedSubCategories.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        name: inputName.trim(),
                        image: finalImage || null,
                        options: initialOptions
                    });
                }
            } else if (modalType === 'option' && parentId) {
                const subCatIndex = updatedSubCategories.findIndex(sc => sc.id === parentId);
                if (subCatIndex !== -1) {
                    const subCat = { ...updatedSubCategories[subCatIndex] };
                    let updatedOptions = [...(subCat.options || [])];

                    if (editMode && targetId) {
                        updatedOptions = updatedOptions.map(opt =>
                            opt.id === targetId ? { ...opt, name: inputName.trim(), image: finalImage || null } : opt
                        );
                    } else {
                        updatedOptions.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            name: inputName.trim(),
                            image: finalImage || null
                        });
                    }
                    subCat.options = updatedOptions;
                    updatedSubCategories[subCatIndex] = subCat;
                }
            }

            updatedCategory.subCategories = updatedSubCategories;
            updatedCategories[catIndex] = updatedCategory;

            await updateOutfit(outfitId, { categories: updatedCategories });
            setEditImage(null);
            setIsFormVisible(false);
        } catch (error) {
            console.error('Save EditCategory Error:', error);
        }
    }, [inputName, currentOutfit, currentCategory, editImage, modalType, editMode, targetId, parentId, categoryId, outfitId, updateOutfit]);



    const handleDelete = useCallback((type: 'subcategory' | 'option' | 'suboption', id: string, name: string, parentId?: string, subCategoryId?: string) => {
        setDeleteConfig({ type, id, name, parentId, subCategoryId });
        setDeleteSheetVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteConfig || !currentOutfit || !currentCategory) return;
        const { type, id, parentId, subCategoryId } = deleteConfig;

        let updatedCategories = [...(currentOutfit.categories || [])];
        const catIndex = updatedCategories.findIndex(c => c.id === categoryId);
        if (catIndex === -1) return;

        const updatedCategory = { ...updatedCategories[catIndex] };
        let updatedSubCategories = [...(updatedCategory.subCategories || [])];

        if (type === 'subcategory') {
            updatedSubCategories = updatedSubCategories.filter(sc => sc.id !== id);
        } else if (type === 'option' && parentId) {
            const subCatIndex = updatedSubCategories.findIndex(sc => sc.id === parentId);
            if (subCatIndex !== -1) {
                const subCat = { ...updatedSubCategories[subCatIndex] };
                subCat.options = subCat.options.filter(opt => opt.id !== id);
                updatedSubCategories[subCatIndex] = subCat;
            }
        } else if (type === 'suboption' && parentId && subCategoryId) {
            // parentId here is optionId
            const subCatIndex = updatedSubCategories.findIndex(sc => sc.id === subCategoryId);
            if (subCatIndex !== -1) {
                const subCat = { ...updatedSubCategories[subCatIndex] };
                const optIndex = subCat.options.findIndex(o => o.id === parentId);
                if (optIndex !== -1) {
                    const opt = { ...subCat.options[optIndex] };
                    opt.subOptions = (opt.subOptions || []).filter(so => so.id !== id);
                    subCat.options[optIndex] = opt;
                    updatedSubCategories[subCatIndex] = subCat;
                }
            }
        }
        updatedCategory.subCategories = updatedSubCategories;
        updatedCategories[catIndex] = updatedCategory;
        await updateOutfit(outfitId, { categories: updatedCategories });
        setDeleteSheetVisible(false);
        setDeleteConfig(null);
    }, [deleteConfig, currentOutfit, currentCategory, categoryId, outfitId, updateOutfit]);

    const openSubCatForm = useCallback((edit: boolean, subCat?: OutfitSubCategory) => {
        setModalType('subcategory');
        setEditMode(edit);
        setTargetId(subCat?.id || null);
        setInputName(subCat?.name || '');
        setEditImage(subCat?.image || null);
        setIsFormVisible(true);
    }, []);


    const closeForm = useCallback(() => {
        setIsFormVisible(false);
        setEditMode(false);
        setTargetId(null);
        setParentId(null);
        setInputName('');
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

    const renderItem = useCallback(({ item }: { item: OutfitSubCategory }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => navigation.navigate('ManageSubOptions', {
                    outfitId,
                    categoryId,
                    subCategoryId: item.id,
                    subCategoryName: item.name
                })}
            >
                <View style={styles.iconBox}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                        <ImageIcon size={20} color={Colors.textSecondary} />
                    )}
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                        {(item.options?.length || 0)} Options
                    </Text>
                </View>
                <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openSubCatForm(true, item)}
                >
                    <Edit2 size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete('subcategory', item.id, item.name)}
                >
                    <Trash2 size={18} color={Colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
    ), [navigation, outfitId, categoryId, openSubCatForm, handleDelete]);



    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerSubtitle}>{currentCategory?.name || 'Category'}</Text>
                        <Text style={styles.headerTitle}>Manage Sub-Categories</Text>
                    </View>
                    {!isFormVisible ? (
                        <TouchableOpacity onPress={() => openSubCatForm(false)} style={styles.backBtn}>
                            <Plus size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>
            </View>

            <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
                {isFormVisible && (
                    <CategoryDetailForm
                        visible={isFormVisible}
                        editMode={editMode}
                        modalType={modalType}
                        inputName={inputName}
                        editImage={editImage}
                        setInputName={setInputName}
                        pickImage={pickImage}
                        handleSave={handleSave}
                        closeForm={closeForm}
                        suggestions={modalType === 'subcategory' ? suggestions : undefined}
                    />
                )}
            </View>

            <FlatList
                data={currentCategory?.subCategories || []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !isFormVisible ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Layers size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Sub-Categories</Text>
                            <Text style={styles.emptySubtitle}>
                                Add sub-categories (e.g. Back, Sleeve) to define options.
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
                title={`Delete ${deleteConfig?.type === 'subcategory' ? 'Sub-Category' : 'Option'}`}
                description={`Are you sure you want to delete "${deleteConfig?.name}"? This action cannot be undone.`}
                confirmText="Delete"
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
    suggestionLabel: { fontFamily: 'Inter-Medium', fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
    suggestionContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
    suggestionChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginRight: 8,
        marginBottom: 8,
    },
    suggestionText: { fontSize: 12, color: Colors.textPrimary, fontFamily: 'Inter-Medium' },

    // Empty State
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyIconBox: { width: 64, height: 64, backgroundColor: '#F0FDF9', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default EditCategoryScreen;
