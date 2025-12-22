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
import { Image } from 'react-native';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Outfit } from '../types';
import SuccessModal from '../components/SuccessModal';

const ManageOutfitsScreen = ({ navigation }: any) => {
    const { outfits, addOutfit, updateOutfit, deleteOutfit } = useData();
    const insets = useSafeAreaInsets();

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Success Modal State
    const [successVisible, setSuccessVisible] = useState(false);
    const [successTitle, setSuccessTitle] = useState('');
    const [successDesc, setSuccessDesc] = useState('');
    const [successType, setSuccessType] = useState<'success' | 'warning' | 'info' | 'error'>('success');
    const [onSuccessDone, setOnSuccessDone] = useState<(() => void) | null>(null);

    // Kebab Menu State
    const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);

    const [editImage, setEditImage] = useState<string | null>(null);

    const openAddModal = () => {
        setEditId(null);
        setEditName('');
        setEditImage(null);
        setModalVisible(true);
    };

    const openEditModal = (outfit: Outfit) => {
        // Close menu if open
        setMenuVisibleId(null);
        setEditId(outfit.id);
        setEditName(outfit.name);
        setEditImage(outfit.image || null);
        setModalVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setEditImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Please enter outfit name');
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
            Alert.alert('Error', 'Failed to save outfit. Please try again.');
        }
    };

    const handleDelete = (id: string, name: string) => {
        setMenuVisibleId(null);
        setSuccessTitle('Delete Outfit');
        setSuccessDesc(`Are you sure you want to delete "${name}"?`);
        setSuccessType('error');
        setOnSuccessDone(() => () => deleteOutfit(id));
        setSuccessVisible(true);
    };

    const handleConfigure = (outfit: Outfit) => {
        // Navigate to Level 2: Categories
        navigation.navigate('OutfitCategories', {
            outfitId: outfit.id,
            outfitName: outfit.name
        });
    };

    const toggleVisibility = async (id: string, currentStatus: boolean) => {
        await updateOutfit(id, { isVisible: !currentStatus });
    };

    const renderItem = ({ item }: { item: Outfit }) => (
        <View style={[
            styles.itemRow,
            { zIndex: menuVisibleId === item.id ? 10 : 1, elevation: menuVisibleId === item.id ? 5 : 2 }
        ]}>
            {/* Left: Icon/Image */}
            <View style={styles.iconBox}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
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

                {/* Overflow Menu Trigger */}
                <TouchableOpacity
                    style={styles.menuTrigger}
                    onPress={() => setMenuVisibleId(menuVisibleId === item.id ? null : item.id)}
                >
                    <MoreVertical size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Absolute Positioned Menu */}
                {menuVisibleId === item.id && (
                    <View style={styles.overflowMenu}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => openEditModal(item)}>
                            <Edit2 size={16} color={Colors.textPrimary} />
                            <Text style={styles.menuText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuItem, styles.menuItemDelete]} onPress={() => handleDelete(item.id, item.name)}>
                            <Trash2 size={16} color={Colors.danger} />
                            <Text style={[styles.menuText, { color: Colors.danger }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
                CellRendererComponent={({ index, style, ...props }) => (
                    <View style={[style, { zIndex: outfits.length - index }]} {...props} />
                )}
                removeClippedSubviews={false}
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                {Platform.OS === 'ios' ? (
                    <KeyboardAvoidingView
                        behavior="padding"
                        style={styles.modalOverlay}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editId ? 'Edit Outfit' : 'Add New Outfit'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <X size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

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
                        </View>
                    </KeyboardAvoidingView>
                ) : (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editId ? 'Edit Outfit' : 'Add New Outfit'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <X size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

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
                        </View>
                    </View>
                )}
            </Modal>
            <SuccessModal
                visible={successVisible}
                title={successTitle}
                description={successDesc}
                type={successType}
                onConfirm={onSuccessDone || undefined}
                confirmText={successType === 'error' ? 'Delete' : 'Done'}
                onClose={() => setSuccessVisible(false)}
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
    itemMeta: { // New style for meta text
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    actions: { // Group actions
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuTrigger: {
        padding: 4,
    },
    overflowMenu: {
        position: 'absolute',
        top: 30,
        right: 0,
        backgroundColor: Colors.white,
        borderRadius: 8,
        padding: 4,
        ...Shadow.medium,
        zIndex: 10,
        minWidth: 120,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8,
    },
    menuItemDelete: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    menuText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
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
    configureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 4,
    },
    configureText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textPrimary,
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
    iconBtn: { // Existing but might need adjustments if reused
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    deleteBtn: {
        backgroundColor: '#FEF2F2',
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

export default ManageOutfitsScreen;
