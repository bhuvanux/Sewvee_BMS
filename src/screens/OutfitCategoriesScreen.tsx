import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Edit2, Trash2, ChevronRight, Image as ImageIcon, X, Camera, Plus, Layers } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit, OutfitCategory } from '../types';
import ReusableBottomDrawer from '../components/ReusableBottomDrawer';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';

const OutfitCategoriesScreen = ({ navigation, route }: any) => {
    const { outfitId, outfitName } = route.params;
    const { outfits, updateOutfit } = useData();
    const insets = useSafeAreaInsets();

    const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
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

    const handleSave = async () => {
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

        let updatedCategories = [...(currentOutfit.categories || [])];

        try {
            if (editMode && categoryId) {
                updatedCategories = updatedCategories.map(c =>
                    c.id === categoryId ? { ...c, name: categoryName.trim(), image: editImage || null } : c
                );
            } else {
                const newCategory: OutfitCategory = {
                    id: Date.now().toString(),
                    name: categoryName.trim(),
                    image: editImage || null,
                    isVisible: true,
                    subCategories: []
                };
                updatedCategories.push(newCategory);
            }

            await updateOutfit(outfitId, { categories: updatedCategories });
            setModalVisible(false);
        } catch (error) {
            console.error('Save Error:', error);
            setAlertConfig({ title: 'Error', message: 'Failed to save category. Please try again.' });
            setAlertVisible(true);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setItemToDelete({ id, name });
        setDeleteSheetVisible(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete && currentOutfit) {
            const updatedCategories = (currentOutfit.categories || []).filter(c => c.id !== itemToDelete.id);
            await updateOutfit(outfitId, { categories: updatedCategories });
            setDeleteSheetVisible(false);
            setItemToDelete(null);
        }
    };

    const openAddModal = () => {
        setEditMode(false);
        setCategoryName('');
        setEditImage(null);
        setModalVisible(true);
    };

    const openEditModal = (cat: OutfitCategory) => {
        setEditMode(true);
        setCategoryId(cat.id);
        setCategoryName(cat.name);
        setEditImage(cat.image || null);
        setModalVisible(true);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets[0].uri) {
                // Resize and compress
                const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 300 } }],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );

                if (manipResult.base64) {
                    setEditImage(`data:image/jpeg;base64,${manipResult.base64}`);
                }
            }
        } catch (error) {
            console.error('Image Error:', error);
            setAlertConfig({ title: 'Image Error', message: 'Failed to process image.' });
            setAlertVisible(true);
        }
    };

    const renderItem = ({ item }: { item: OutfitCategory }) => (
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
                        <Image source={{ uri: item.image }} style={styles.itemImage} />
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
                    onPress={() => openEditModal(item)}
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
    );

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
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <FlatList
                data={currentOutfit?.categories || []}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <Text style={styles.helperText}>
                        Organize your outfit styles into categories (e.g. Back Styles, Sleeve Types).
                    </Text>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Layers size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>No Categories Added</Text>
                        <Text style={styles.emptySubtitle}>
                            Add categories to organize style variations for this outfit.
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={openAddModal}
            >
                <Plus size={24} color={Colors.white} />
                <Text style={styles.fabText}>Add Category</Text>
            </TouchableOpacity>

            <ReusableBottomDrawer
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editMode ? 'Edit Category' : 'Add New Category'}
                height={450}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.inputContainer}>
                        {/* Image Picker */}
                        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                            {editImage ? (
                                <Image source={{ uri: editImage }} style={styles.pickedImage} />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Camera size={24} color={Colors.textSecondary} />
                                    <Text style={styles.imagePickerText}>Add Image</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.label}>Category Name</Text>
                        <TextInput
                            style={styles.input}
                            value={categoryName}
                            onChangeText={setCategoryName}
                            placeholder="e.g. 3 Dot Blouse, Princess Cut"
                            placeholderTextColor={Colors.textSecondary}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </ScrollView>
            </ReusableBottomDrawer>

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
        paddingBottom: 40,
    },
    helperText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        textAlign: 'center'
    },
    // Card Styles
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: 12,
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 12, // Inner padding for the whole card
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
        resizeMode: 'cover',
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
        borderColor: '#E2E8F0'
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
});

export default OutfitCategoriesScreen;
