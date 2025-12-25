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
    KeyboardAvoidingView
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronRight, Image as ImageIcon, MoreVertical, X, Camera, Shirt } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit } from '../types';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';
import BottomActionSheet from '../components/BottomActionSheet';
import ReusableBottomDrawer from '../components/ReusableBottomDrawer';

const ManageOutfitsScreen = ({ navigation }: any) => {
    const { outfits, addOutfit, updateOutfit, deleteOutfit } = useData();
    const insets = useSafeAreaInsets();

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
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

    const openAddModal = () => {
        setEditId(null);
        setEditName('');
        setEditImage(null);
        setModalVisible(true);
    };

    const openEditModal = (outfit: Outfit) => {
        setEditId(outfit.id);
        setEditName(outfit.name);
        setEditImage(outfit.image || null);
        setModalVisible(true);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1, // High quality input, we compress later
            });

            if (!result.canceled && result.assets[0].uri) {
                // Resize and compress for DB storage (max 512px, 0.7 quality)
                const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 512 } }],
                    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );

                if (manipResult.base64) {
                    const base64Image = `data:image/jpeg;base64,${manipResult.base64}`;
                    setEditImage(base64Image);
                }
            }
        } catch (error) {
            console.error('Image processing error:', error);
            setAlertConfig({ title: 'Image Error', message: 'Failed to process image. Please try again.' });
            setAlertVisible(true);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            setAlertConfig({ title: 'Missing Information', message: 'Please enter an outfit name.' });
            setAlertVisible(true);
            return;
        }

        try {
            const outfitData = {
                name: editName.trim(),
                isVisible: true,
                image: editImage || null
            };

            if (editId) {
                await updateOutfit(editId, { name: editName.trim(), image: editImage || null });
            } else {
                await addOutfit(outfitData);
            }
            setModalVisible(false);
        } catch (error) {
            console.error('Save Outfit Error:', error);
            setAlertConfig({ title: 'Error', message: 'Failed to save outfit. Please try again.' });
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
                {item.image && typeof item.image === 'string' && item.image.startsWith('file://') ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} onError={() => console.log('Failed to load image:', item.image)} />
                ) : (
                    // Default to icon if no image or if web URL (until remote image loading is fully verified)
                    // You can enhance this to support 'http' but handle onError
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
                    <Text style={styles.helperText}>
                        Manage the types of outfits you create orders for. Toggle visibility to hide them from the selection list.
                    </Text>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Shirt size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>No Outfits Added</Text>
                        <Text style={styles.emptySubtitle}>
                            Add your first outfit type (e.g. Blouse, Kurta) to get started with orders.
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { bottom: 24 + (insets.bottom || 0), zIndex: 9999 }]}
                onPress={openAddModal}
            >
                <Plus size={24} color={Colors.white} />
                <Text style={styles.fabText}>Add Outfit</Text>
            </TouchableOpacity>

            {/* Edit/Add Modal */}
            <ReusableBottomDrawer
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={editId ? 'Edit Outfit' : 'Add New Outfit'}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ paddingHorizontal: 20 }}
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

                        <Text style={styles.label}>Outfit Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholderTextColor={Colors.textSecondary}
                            placeholder="e.g. Blouse, Kurta, Lehenga"
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </ReusableBottomDrawer>

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
                            if (selectedItem) openEditModal(selectedItem);
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
