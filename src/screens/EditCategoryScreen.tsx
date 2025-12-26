import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Plus, Edit2, Trash2, X, Image as ImageIcon, Camera, Layers, ChevronRight, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image as ExpoImage } from 'expo-image';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit, OutfitCategory, OutfitSubCategory, OutfitOption } from '../types';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';


const EditCategoryScreen = ({ navigation, route }: any) => {
    const { outfitId, categoryId, categoryName } = route.params;
    const { outfits, updateOutfit } = useData();
    const insets = useSafeAreaInsets();

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
        type: 'subcategory' | 'option',
        id: string,
        name: string,
        parentId?: string
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

    const handleSave = async () => {
        Keyboard.dismiss();
        if (!inputName.trim()) {
            setAlertConfig({ title: 'Missing Information', message: 'Please enter a name.' });
            setAlertVisible(true);
            return;
        }
        if (!currentOutfit || !currentCategory) return;

        // Optimistic Close: Close form immediately for better UX
        setIsFormVisible(false);

        let updatedCategories = [...(currentOutfit.categories || [])];
        const catIndex = updatedCategories.findIndex(c => c.id === categoryId);
        if (catIndex === -1) return;

        // Process Image if URI is file-based
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
                        sc.id === targetId ? { ...sc, name: inputName.trim(), image: finalImage || undefined } : sc
                    );
                } else {
                    updatedSubCategories.push({
                        id: Date.now().toString(),
                        name: inputName.trim(),
                        image: finalImage || undefined,
                        options: []
                    });
                }
            } else if (modalType === 'option' && parentId) {
                const subCatIndex = updatedSubCategories.findIndex(sc => sc.id === parentId);
                if (subCatIndex !== -1) {
                    const subCat = { ...updatedSubCategories[subCatIndex] };
                    let updatedOptions = [...(subCat.options || [])];

                    if (editMode && targetId) {
                        updatedOptions = updatedOptions.map(opt =>
                            opt.id === targetId ? { ...opt, name: inputName.trim(), image: finalImage || undefined } : opt
                        );
                    } else {
                        updatedOptions.push({
                            id: Date.now().toString(),
                            name: inputName.trim(),
                            image: finalImage || undefined
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
            // If save fails silently (since drawer is closed), maybe show a toast or global alert?
            // For now, console log is safer than reopening drawer which is jarring.
            // setAlertConfig({ title: 'Error', message: 'Failed to save changes. Please try again.' });
            // setAlertVisible(true);
        }
    };


    const handleDelete = (type: 'subcategory' | 'option', id: string, name: string, parentId?: string) => {
        setDeleteConfig({ type, id, name, parentId });
        setDeleteSheetVisible(true);
    };

    const confirmDelete = async () => {
        if (!deleteConfig || !currentOutfit || !currentCategory) return;
        const { type, id, parentId } = deleteConfig;

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
        }
        updatedCategory.subCategories = updatedSubCategories;
        updatedCategories[catIndex] = updatedCategory;
        await updateOutfit(outfitId, { categories: updatedCategories });
        setDeleteSheetVisible(false);
        setDeleteConfig(null);
    };

    const openSubCatForm = (edit: boolean, subCat?: OutfitSubCategory) => {
        setModalType('subcategory');
        setEditMode(edit);
        setTargetId(subCat?.id || null);
        setInputName(subCat?.name || '');
        setEditImage(subCat?.image || null);
        setIsFormVisible(true);
    };

    const openOptionForm = (subCatId: string, edit: boolean, option?: OutfitOption) => {
        setModalType('option');
        setParentId(subCatId);
        setEditMode(edit);
        setTargetId(option?.id || null);
        setInputName(option?.name || '');
        setEditImage(option?.image || null);
        setIsFormVisible(true);
    };

    const closeForm = () => {
        setIsFormVisible(false);
        setEditMode(false);
        setTargetId(null);
        setParentId(null);
        setInputName('');
        setEditImage(null);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Match
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

    const renderItem = ({ item }: { item: OutfitSubCategory }) => (
        <View style={styles.card}>
            {/* Header: Image + Name + Actions */}
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconBox}>
                        {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                        ) : (
                            <ImageIcon size={20} color={Colors.textSecondary} />
                        )}
                    </View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                </View>
                <View style={styles.headerActions}>
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

            {/* Divider */}
            <View style={styles.divider} />

            {/* Options Body */}
            <View style={styles.cardBody}>
                <View style={styles.chipsContainer}>
                    {item.options?.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            style={styles.chip}
                            onPress={() => openOptionForm(item.id, true, opt)}
                        >
                            <Text style={styles.chipText}>{opt.name}</Text>
                            <TouchableOpacity
                                style={styles.chipCloseBtn}
                                onPress={() => handleDelete('option', opt.id, opt.name, item.id)}
                            >
                                <X size={14} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.addChip}
                        onPress={() => openOptionForm(item.id, false)}
                    >
                        <Plus size={14} color={Colors.primary} />
                        <Text style={styles.addChipText}>Option</Text>
                    </TouchableOpacity>
                </View>
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
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerSubtitle}>{currentCategory?.name || 'Category'}</Text>
                        <Text style={styles.headerTitle}>Manage Sub-Categories</Text>
                    </View>
                    <View style={{ width: 40 }} />
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

            {!isFormVisible && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: 24 + insets.bottom }]}
                    onPress={() => openSubCatForm(false)}
                >
                    <Plus size={24} color={Colors.white} />
                    <Text style={styles.fabText}>Add Sub Category</Text>
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

// --- STABLE FORM COMPONENTS ---

interface CategoryDetailFormProps {
    visible: boolean;
    editMode: boolean;
    modalType: 'subcategory' | 'option';
    inputName: string;
    editImage: string | null;
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
                {/* Image Picker */}
                <TouchableOpacity style={styles.inlineImagePicker} onPress={pickImage}>
                    {editImage ? (
                        <View style={styles.inlinePickedImageContainer}>
                            <View style={[styles.inlinePickedImage, styles.photoReadyContainer]}>
                                <Check size={24} color={Colors.primary} />
                                <Text style={styles.photoReadyText}>Photo Ready</Text>
                            </View>
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
                    <Text style={styles.inlineLabel}>Name</Text>
                    <TextInput
                        style={styles.inlineInput}
                        value={inputName}
                        onChangeText={setInputName}
                        placeholder={modalType === 'subcategory' ? "e.g. Back, Sleeve" : "e.g. Boat Neck, Long"}
                        placeholderTextColor={Colors.textSecondary}
                    />
                </View>
            </View>

            <View style={styles.inlineFormFooter}>
                <TouchableOpacity style={styles.inlineCancelBtn} onPress={closeForm}>
                    <Text style={styles.inlineCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleSave}>
                    <Text style={styles.inlineSaveBtnText}>Save Changes</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

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
        paddingBottom: 100, // Space for FAB
    },
    helperText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    // Card Styles
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        marginBottom: 16,
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        backgroundColor: Colors.white,
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
        resizeMode: 'cover',
    },
    cardTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
    },
    cardBody: {
        padding: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        paddingRight: 8, // Less padding on right for X icon
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    chipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textPrimary,
    },
    chipCloseBtn: {
        padding: 2,
        backgroundColor: '#E2E8F0',
        borderRadius: 10,
    },
    addChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7', // Light orange background
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#FCD34D',
        gap: 4,
    },
    addChipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#D97706',
    },
    // FAB
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        backgroundColor: '#F0FDF9', // Light green bg
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
    // Modal Styles
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
        backgroundColor: '#F1F5F9', // Slightly darker slate
        borderWidth: 1.5,
        borderColor: '#CBD5E1', // Darker border
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
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    photoReadyContainer: {
        backgroundColor: Colors.primary + '10', // Very light primary
        borderWidth: 1,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoReadyText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: Colors.primary,
        marginTop: 4,
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
});

export default EditCategoryScreen;
