
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { Colors, Spacing, Shadow, Typography } from '../constants/theme';
import { ChevronLeft, Edit2, Trash2, PlayCircle, StopCircle, User, PenTool, X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateInvoicePDF, generateTailorCopyPDF, generateCustomerCopyPDF, normalizeItems } from '../services/pdfService';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';

const { width } = Dimensions.get('window');

const ItemDetailScreen = ({ route, navigation }: any) => {
    const { item, orderId, itemIndex } = route.params;
    const { orders, updateOrder } = useData();
    const insets = useSafeAreaInsets();

    // Local state for audio
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingUri, setPlayingUri] = useState<string | null>(null);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    // Delete State
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);

    // Get latest item data in case it changes
    const order = orders.find((o: any) => o.id === orderId);

    // If order or item is missing (deleted), go back
    if (!order) {
        navigation.goBack();
        return null;
    }

    // Normalize items to ensure consistent property access (qty, amount, etc)
    const displayItems = normalizeItems(order);
    const currentItem = (itemIndex !== undefined && displayItems[itemIndex]) ? displayItems[itemIndex] : item;

    if (!currentItem) return null;

    const handlePlayAudio = async (uri: string) => {
        try {
            if (playingUri === uri) {
                if (sound) {
                    await sound.stopAsync();
                    await sound.unloadAsync();
                    setSound(null);
                }
                setPlayingUri(null);
                return;
            }

            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync({ uri });
            setSound(newSound);
            setPlayingUri(uri);
            await newSound.playAsync();

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded) {
                    if (status.didJustFinish) {
                        setPlayingUri(null);
                        newSound.unloadAsync();
                        setSound(null);
                    }
                }
            });
        } catch (error) {
            setAlertConfig({ title: 'Error', message: 'Could not play audio note.' });
            setAlertVisible(true);
        }
    };

    useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, [sound]);

    const handleDeleteItem = () => {
        setDeleteSheetVisible(true);
    };

    const confirmDelete = async () => {
        if (!order) return;

        const newItems = [...order.items];
        newItems.splice(itemIndex, 1);

        // Recalculate totals
        const newTotal = newItems.reduce((sum: number, i: any) => sum + (Number(i.amount) || Number(i.rate) * Number(i.qty) || 0), 0);
        const newBalance = newTotal - (order.advance || 0);

        await updateOrder(orderId, {
            items: newItems,
            total: newTotal,
            balance: newBalance,
            updatedAt: new Date().toISOString()
        });
        setDeleteSheetVisible(false);
        navigation.goBack();
    };

    const handleEditItem = () => {
        // Navigate to CreateOrderFlow with edit mode
        navigation.navigate('CreateOrderFlow', { editOrderId: orderId, editItemIndex: itemIndex });
    };

    // Prepare measurements split
    const measurements = currentItem.measurements || {};
    const numericMeasurements: any = {};
    const stitchingOptions: any = {};

    Object.entries(measurements).forEach(([key, val]: any) => {
        if (!isNaN(Number(val)) && String(val).trim() !== '') {
            numericMeasurements[key] = val;
        } else if (val && String(val).trim() !== '') {
            stitchingOptions[key] = val;
        }
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{currentItem.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Images */}
                {currentItem.images && currentItem.images.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Photos / Designs</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {currentItem.images.map((img: string, i: number) => (
                                <TouchableOpacity key={i} onPress={() => setPreviewImageUri(img)} style={{ width: (width - 44) / 2, aspectRatio: 1 }}>
                                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Design Sketches */}
                {currentItem.sketches && currentItem.sketches.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Design Sketches</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {currentItem.sketches.map((img: string, i: number) => (
                                <TouchableOpacity key={i} onPress={() => setPreviewImageUri(img)} style={{ width: (width - 44) / 2, aspectRatio: 1 }}>
                                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }} resizeMode="contain" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Info Card: Name, Price, Qty */}
                <View style={styles.infoCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={styles.itemName}>{currentItem.name}</Text>
                            <View style={styles.qtyBadge}>
                                <Text style={styles.qtyText}>Qty: {currentItem.qty}</Text>
                            </View>
                        </View>
                        <Text style={styles.itemPrice}>₹{currentItem.amount}</Text>
                    </View>
                    {currentItem.description ? (
                        <Text style={styles.itemDesc}>{currentItem.description}</Text>
                    ) : null}
                </View>

                {/* Measurements Grid */}
                {Object.keys(numericMeasurements).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Measurements</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {Object.entries(numericMeasurements).map(([key, val]: any) => (
                                <View key={key} style={[styles.measurementBox, { backgroundColor: Colors.white, borderColor: Colors.border }]}>
                                    <Text style={styles.measurementLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                                    <Text style={styles.measurementValue}>{String(val)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Stitching Options List */}
                {Object.keys(stitchingOptions).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Stitching Options</Text>
                        <View style={[styles.optionsList, { backgroundColor: Colors.white, borderColor: Colors.border }]}>
                            {Object.entries(stitchingOptions).map(([key, val]: any) => (
                                <View key={key} style={styles.optionRow}>
                                    <Text style={styles.optionLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                                    <Text style={styles.optionValue}>{String(val)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Notes */}
                {currentItem.notes ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <View style={styles.noteBox}>
                            <Text style={styles.noteText}>{currentItem.notes}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Audio */}
                {currentItem.audioUri && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Audio Note</Text>
                        <TouchableOpacity
                            style={styles.audioBtn}
                            onPress={() => handlePlayAudio(currentItem.audioUri)}
                        >
                            <View style={styles.audioIconBox}>
                                {playingUri === currentItem.audioUri ? <StopCircle size={24} color={Colors.white} /> : <PlayCircle size={24} color={Colors.white} />}
                            </View>
                            <View>
                                <Text style={styles.audioBtnText}>
                                    {playingUri === currentItem.audioUri ? 'Stop Playback' : 'Play Voice Note'}
                                </Text>
                                <Text style={styles.audioBtnSubtext}>Tap to listen</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteItem}>
                    <Trash2 size={20} color={Colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={handleEditItem}>
                    <Edit2 size={20} color={Colors.white} />
                    <Text style={styles.editBtnText}>Edit Item</Text>
                </TouchableOpacity>
            </View>

            {/* Image Preview Modal */}
            {previewImageUri && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
                    <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 1010, padding: 10 }} onPress={() => setPreviewImageUri(null)}>
                        <X size={30} color="white" />
                    </TouchableOpacity>
                    <Image source={{ uri: previewImageUri }} style={{ width: width, height: '80%' }} resizeMode="contain" />
                </View>
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
                title="Delete Item"
                description="Are you sure you want to delete this item from the order?"
                confirmText="Delete Item"
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 24,
        ...Shadow.subtle
    },
    itemName: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    itemPrice: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.primary,
    },
    qtyBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    qtyText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    itemDesc: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    measurementBox: {
        width: '48%',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    measurementLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    measurementValue: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: Colors.textPrimary,
    },
    optionsList: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    optionLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontFamily: 'Inter-Medium',
        textTransform: 'capitalize',
    },
    optionValue: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: Colors.textPrimary,
        flex: 1,
        textAlign: 'right',
        marginLeft: 16,
    },
    noteBox: {
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    noteText: {
        fontSize: 14,
        color: '#92400E',
        fontFamily: 'Inter-Medium',
        lineHeight: 20,
    },
    audioBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        ...Shadow.subtle,
    },
    audioIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    audioBtnText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
    },
    audioBtnSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: 16,
        flexDirection: 'row',
        gap: 16,
        ...Shadow.medium,
    },
    deleteBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    deleteBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.danger,
    },
    editBtn: {
        flex: 2,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    editBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.white,
    },
});

export default ItemDetailScreen;
