import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    Keyboard
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Plus, Edit2, Trash2, X, Image as ImageIcon, Layers, Check, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useData, DEFAULT_OUTFITS } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OutfitOption } from '../types';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';

// --- STABLE FORM COMPONENTS ---

interface SubOptionFormProps {
    visible: boolean;
    editMode: boolean;
    inputName: string;
    editImage: string | null;
    setInputName: (text: string) => void;
    pickImage: () => void;
    handleSave: () => void;
    closeForm: () => void;
    suggestions?: string[];
}

const SubOptionForm = React.memo(({
    visible,
    editMode,
    inputName,
    editImage,
    setInputName,
    pickImage,
    handleSave,
    closeForm,
    suggestions
}: SubOptionFormProps) => {
    if (!visible) return null;

    return (
        <View style={styles.inlineFormContainer}>
            <View style={styles.inlineFormHeader}>
                <Text style={styles.inlineFormTitle}>
                    {editMode ? 'Edit' : 'Add'} Sub-Option
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
                            <View style={[styles.inlinePickedImage, { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }]}>
                                <ImageIcon size={32} color="#166534" opacity={0.5} />
                            </View>
                        )}
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
                        placeholder="e.g. Deep, High, Regular"
                        placeholderTextColor={Colors.textSecondary}
                        autoFocus={!editMode}
                    />
                </View>
            </View>

            {/* Suggestions Chips - Moved outside body for more space */}
            {!editMode && suggestions && suggestions.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.suggestionLabel}>Suggestions:</Text>
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
        </View>
    );
});

const ManageSubOptionsScreen = ({ navigation, route }: any) => {
    // Determine level: if optionId is present, we are at Level 5 (Sub-options)
    const { outfitId, categoryId, subCategoryId, subCategoryName, optionId, optionName } = route.params;
    const { outfits, updateOutfit } = useData();
    const insets = useSafeAreaInsets();

    const [currentItems, setCurrentItems] = useState<any[]>([]);
    const isLevel5 = !!optionId;

    // Form State
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [targetId, setTargetId] = useState<string | null>(null);
    const [inputName, setInputName] = useState('');
    const [editImage, setEditImage] = useState<string | null>(null);

    // Alert & Delete State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{
        type: 'option' | 'suboption',
        id: string,
        name: string,
    } | null>(null);

    // Load Data
    useEffect(() => {
        const outfit = outfits.find(o => o.id === outfitId);
        const category = outfit?.categories?.find(c => c.id === categoryId);
        const subCategory = category?.subCategories?.find(sc => sc.id === subCategoryId);

        if (isLevel5) {
            const option = subCategory?.options?.find(opt => opt.id === optionId);
            setCurrentItems(option?.subOptions || []);
        } else {
            setCurrentItems(subCategory?.options || []);
        }
    }, [outfits, outfitId, categoryId, subCategoryId, optionId, isLevel5]);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        if (!inputName.trim()) {
            setAlertConfig({ title: 'Missing Information', message: 'Please enter a name.' });
            setAlertVisible(true);
            return;
        }

        setIsFormVisible(false);

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
                console.error('Image processing failed', e);
            }
        }

        const updatedOutfits = outfits.map(o => {
            if (o.id !== outfitId) return o;
            return {
                ...o,
                categories: o.categories.map(c => {
                    if (c.id !== categoryId) return c;
                    return {
                        ...c,
                        subCategories: c.subCategories.map(sc => {
                            if (sc.id !== subCategoryId) return sc;

                            if (isLevel5) {
                                return {
                                    ...sc,
                                    options: sc.options.map(opt => {
                                        if (opt.id !== optionId) return opt;
                                        let newSubOptions = [...(opt.subOptions || [])];
                                        if (editMode && targetId) {
                                            newSubOptions = newSubOptions.map(so =>
                                                so.id === targetId ? { ...so, name: inputName.trim(), image: finalImage || null } : so
                                            );
                                        } else {
                                            newSubOptions.push({
                                                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                                                name: inputName.trim(),
                                                image: finalImage || null
                                            });
                                        }
                                        return { ...opt, subOptions: newSubOptions };
                                    })
                                };
                            } else {
                                let newOptions = [...(sc.options || [])];
                                if (editMode && targetId) {
                                    newOptions = newOptions.map(opt =>
                                        opt.id === targetId ? { ...opt, name: inputName.trim(), image: finalImage || null } : opt
                                    );
                                } else {
                                    newOptions.push({
                                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                                        name: inputName.trim(),
                                        image: finalImage || null
                                    });
                                }
                                return { ...sc, options: newOptions };
                            }
                        })
                    };
                })
            };
        });

        const targetOutfit = updatedOutfits.find(o => o.id === outfitId);
        if (targetOutfit) {
            await updateOutfit(outfitId, { categories: targetOutfit.categories });
        }
        cleanupForm();
    }, [inputName, editImage, editMode, targetId, outfitId, categoryId, subCategoryId, optionId, isLevel5, outfits, updateOutfit]);

    const cleanupForm = () => {
        setInputName('');
        setEditImage(null);
        setEditMode(false);
        setTargetId(null);
    };

    const handleDelete = (type: 'option' | 'suboption', id: string, name: string) => {
        setDeleteConfig({ type, id, name });
        setDeleteSheetVisible(true);
    };

    const confirmDelete = async () => {
        if (!deleteConfig) return;
        const { id } = deleteConfig;

        const updatedOutfits = outfits.map(o => {
            if (o.id !== outfitId) return o;
            return {
                ...o,
                categories: o.categories.map(c => {
                    if (c.id !== categoryId) return c;
                    return {
                        ...c,
                        subCategories: c.subCategories.map(sc => {
                            if (sc.id !== subCategoryId) return sc;

                            if (isLevel5) {
                                return {
                                    ...sc,
                                    options: sc.options.map(opt => {
                                        if (opt.id !== optionId) return opt;
                                        return {
                                            ...opt,
                                            subOptions: (opt.subOptions || []).filter(so => so.id !== id)
                                        };
                                    })
                                };
                            } else {
                                return {
                                    ...sc,
                                    options: sc.options.filter(opt => opt.id !== id)
                                };
                            }
                        })
                    };
                })
            };
        });

        const targetOutfit = updatedOutfits.find(o => o.id === outfitId);
        if (targetOutfit) {
            await updateOutfit(outfitId, { categories: targetOutfit.categories });
        }

        setDeleteSheetVisible(false);
        setDeleteConfig(null);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });
            if (!result.canceled && result.assets) {
                setEditImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => {
                        if (!isLevel5) {
                            navigation.push('ManageSubOptions', {
                                outfitId,
                                categoryId,
                                subCategoryId,
                                subCategoryName,
                                optionId: item.id,
                                optionName: item.name
                            });
                        }
                    }}
                    activeOpacity={isLevel5 ? 1 : 0.7}
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
                        {!isLevel5 && (
                            <Text style={styles.itemMeta}>
                                {(item.subOptions?.length || 0)} Sub Options
                            </Text>
                        )}
                    </View>
                    {!isLevel5 && (
                        <ChevronRight size={20} color={Colors.textSecondary} />
                    )}
                </TouchableOpacity>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            setTargetId(item.id);
                            setInputName(item.name);
                            setEditImage(item.image || null);
                            setEditMode(true);
                            setIsFormVisible(true);
                        }}
                    >
                        <Edit2 size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(isLevel5 ? 'suboption' : 'option', item.id, item.name)}
                    >
                        <Trash2 size={18} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerSubtitle}>
                            {isLevel5 ? `Option: ${optionName}` : `Sub-Category: ${subCategoryName}`}
                        </Text>
                        <Text style={styles.headerTitle}>
                            {isLevel5 ? 'Manage Sub-Options' : 'Manage Options'}
                        </Text>
                    </View>
                    {!isFormVisible ? (
                        <TouchableOpacity onPress={() => { cleanupForm(); setIsFormVisible(true); }} style={styles.backBtn}>
                            <Plus size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>
            </View>

            <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
                {isFormVisible && (
                    <SubOptionForm
                        visible={isFormVisible}
                        editMode={editMode}
                        inputName={inputName}
                        editImage={editImage}
                        setInputName={setInputName}
                        pickImage={pickImage}
                        handleSave={handleSave}
                        closeForm={() => { setIsFormVisible(false); cleanupForm(); }}
                        suggestions={isLevel5 ? ['Deep', 'High', 'Regular'] : ['Silk', 'Cotton', 'Linen']}
                    />
                )}
            </View>

            <FlatList
                data={currentItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={!isFormVisible ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Layers size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>No Items Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Add {isLevel5 ? 'sub-options' : 'options'} to this selection.
                        </Text>
                    </View>
                ) : null}
            />

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
                title={`Delete ${deleteConfig?.type === 'option' ? 'Option' : 'Sub-Option'}`}
                description={`Are you sure you want to delete "${deleteConfig?.name}"?`}
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
        fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.textPrimary, backgroundColor: '#FAFCFC',
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

export default ManageSubOptionsScreen;
