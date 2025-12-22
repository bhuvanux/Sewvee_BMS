import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    Image,
    Modal,
    StatusBar,
    SafeAreaView,
    Animated,
    Easing
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { ArrowLeft, ArrowRight, Save, Check, Plus, Trash2, Mic, Image as ImageIcon, ChevronDown, User, Search, MapPin, Phone, X, ChevronRight, Upload, PenTool, Highlighter, Edit2 } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Order, OutfitItem, MeasurementProfile } from '../types';
import { formatDate, getCurrentDate, getCurrentTime } from '../utils/dateUtils';
import AlertModal from '../components/AlertModal';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import SignatureScreen from 'react-native-signature-canvas';

import CustomerSelectionModal from '../components/CustomerSelectionModal';
import OrderSuccessModal from '../components/OrderSuccessModal';

// Liquid Progress Component
const LiquidProgress = ({ current, total }: { current: number, total: number }) => {
    const fillAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fillAnim, {
            toValue: (current + 1) / total,
            duration: 500,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.ease)
        }).start();
    }, [current]);

    const heightInterpolate = fillAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.liquidContainer}>
            <Animated.View style={[styles.liquidFill, { height: heightInterpolate }]} />
            <Text style={styles.liquidText}>{current + 1}/{total}</Text>
        </View>
    );
};

// --- New UI Components for Step 1 ---

const QuantityStepper = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
    return (
        <View style={styles.stepperContainer}>
            <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onChange(Math.max(1, value - 1))}
            >
                <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{value}</Text>
            <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onChange(value + 1)}
            >
                <Plus size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
        </View>
    );
};

const CalendarModal = ({ visible, onClose, onSelect, initialDate }: any) => {
    const today = new Date();
    // Parse initialDate (DD/MM/YYYY) if exists, else today
    let startMonth = today.getMonth();
    let startYear = today.getFullYear();

    if (initialDate && initialDate.includes('/')) {
        const parts = initialDate.split('/');
        if (parts.length === 3) {
            startMonth = parseInt(parts[1]) - 1;
            startYear = parseInt(parts[2]);
        }
    }

    const [currentMonth, setCurrentMonth] = useState(startMonth);
    const [currentYear, setCurrentYear] = useState(startYear);

    // Update state when visible or initialDate changes
    useEffect(() => {
        if (visible) {
            let m = today.getMonth();
            let y = today.getFullYear();
            if (initialDate && initialDate.includes('/')) {
                const parts = initialDate.split('/');
                if (parts.length === 3) {
                    m = parseInt(parts[1]) - 1;
                    y = parseInt(parts[2]);
                }
            }
            setCurrentMonth(m);
            setCurrentYear(y);
        }
    }, [visible, initialDate]);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDateClick = (day: number) => {
        const d = String(day).padStart(2, '0');
        const m = String(currentMonth + 1).padStart(2, '0');
        const y = currentYear;
        onSelect(`${d}/${m}/${y}`);
        onClose();
    };

    const renderDays = () => {
        const days = [];
        const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${String(i).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
            // Highlight if matches initialDate
            const isSelected = initialDate === dateStr;
            const isToday = todayStr === dateStr && !isSelected;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isToday && styles.calendarDayToday
                    ]}
                    onPress={() => handleDateClick(i)}
                >
                    <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && styles.calendarDayTextToday
                    ]}>{i}</Text>
                </TouchableOpacity>
            );
        }
        return days;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
                            <ChevronDown size={20} color={Colors.textPrimary} style={{ transform: [{ rotate: '90deg' }] }} />
                        </TouchableOpacity>
                        <Text style={styles.calendarTitle}>{monthNames[currentMonth]} {currentYear}</Text>
                        <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
                            <ChevronDown size={20} color={Colors.textPrimary} style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.weekRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={styles.weekDayText}>{d}</Text>
                        ))}
                    </View>
                    <View style={styles.daysGrid}>
                        {renderDays()}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const OutfitDrawer = ({ visible, onClose, outfits, onSelect, currentType }: any) => {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.bottomSheet, { height: '50%' }]}>
                    <View style={styles.bottomSheetHeader}>
                        <Text style={styles.bottomSheetTitle}>Select Outfit Type</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                        {outfits.map((o: any) => (
                            <TouchableOpacity
                                key={o.id}
                                style={[styles.outfitOption, currentType === o.name && styles.outfitOptionSelected]}
                                onPress={() => { onSelect(o.name); onClose(); }}
                            >
                                <Text style={[styles.outfitOptionText, currentType === o.name && styles.outfitOptionTextSelected]}>{o.name}</Text>
                                {currentType === o.name && <Check size={20} color={Colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

// Step Components
const Step1BasicInfo = ({ state, onChange, customers, outfits, openCustomerModal }: any) => {
    // Local State for Modals
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [dateField, setDateField] = useState<'trialDate' | 'deliveryDate' | null>(null);
    const [outfitDrawerVisible, setOutfitDrawerVisible] = useState(false);

    const handleDateSelect = (date: string) => {
        if (dateField) {
            onChange({ [dateField]: date });
        }
    };

    const openCalendar = (field: 'trialDate' | 'deliveryDate') => {
        setDateField(field);
        setCalendarVisible(true);
    };

    const handleQuantityChange = (val: number) => {
        onChange({
            currentOutfit: { ...state.currentOutfit, quantity: val }
        });
    };

    const handleTypeSelect = (typeName: string) => {
        onChange({
            currentOutfit: { ...state.currentOutfit, type: typeName }
        });
    };

    // Customer Display logic
    const displayCustomerName = state.customerName || (state.selectedCustomer ? state.selectedCustomer.name : 'Select Customer');
    const displayCustomerMobile = state.customerMobile || (state.selectedCustomer ? state.selectedCustomer.mobile : '');
    const isCustomerSelected = !!state.customerName || !!state.selectedCustomer;

    return (
        <View style={styles.stepContainer}>

            {/* Customer Section - Contact Card Style */}
            <TouchableOpacity
                style={styles.card}
                onPress={openCustomerModal}
            >
                <View style={{ marginBottom: 4 }}>
                    <Text style={styles.subLabel}>Customer</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        {/* Icon: Updated Background Color and Icon Color */}
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={24} color="#374151" strokeWidth={2} />
                        </View>
                        <View>
                            {/* Name: Larger and Darker */}
                            <Text style={[styles.valueText, !isCustomerSelected && { color: Colors.textSecondary, fontFamily: 'Inter-Regular' }, { fontSize: 18, fontFamily: 'Inter-Bold', color: '#111827' }]}>
                                {displayCustomerName}
                            </Text>
                            {isCustomerSelected && !!displayCustomerMobile && (
                                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: '#6B7280', marginTop: 3 }}>
                                    {displayCustomerMobile}
                                </Text>
                            )}
                        </View>
                    </View>
                    <ChevronRight size={20} color={Colors.textSecondary} />
                </View>
            </TouchableOpacity>

            {/* Dates Section - Card Style */}
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => openCalendar('trialDate')}
                    >
                        <Text style={styles.fieldLabel}>Trial Date</Text>
                        <View style={styles.dateInputDisplay}>
                            <Text style={[styles.dateInputText, !state.trialDate && { color: Colors.textSecondary }]}>
                                {state.trialDate || 'DD/MM/YYYY'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => openCalendar('deliveryDate')}
                    >
                        <Text style={styles.fieldLabel}>Delivery Date</Text>
                        <View style={styles.dateInputDisplay}>
                            <Text style={[styles.dateInputText, !state.deliveryDate && { color: Colors.textSecondary }]}>
                                {state.deliveryDate || 'DD/MM/YYYY'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Outfit Details - Card Style */}
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    {/* Type Selector */}
                    <View style={{ flex: 2 }}>
                        <Text style={styles.fieldLabel}>Type</Text>
                        <TouchableOpacity
                            style={styles.dropdownDisplay}
                            onPress={() => setOutfitDrawerVisible(true)}
                        >
                            <Text style={styles.dropdownText}>{state.currentOutfit.type}</Text>
                            <ChevronDown size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Quantity Stepper */}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Qty</Text>
                        <QuantityStepper
                            value={state.currentOutfit.quantity || 1}
                            onChange={handleQuantityChange}
                        />
                    </View>
                </View>

                <View style={{ marginTop: 24 }}>
                    <Text style={styles.fieldLabel}>Urgency</Text>
                    <View style={styles.typeToggle}>
                        {['Normal', 'Urgent'].map((u) => {
                            const isSelected = state.urgency === u;
                            return (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                                    onPress={() => onChange({ urgency: u })}
                                >
                                    <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextActive]}>
                                        {u}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Fabric Source */}
                <View style={{ marginTop: 24 }}>
                    <Text style={styles.fieldLabel}>Fabric Source</Text>
                    <View style={styles.typeToggle}>
                        {['Customer', 'Boutique'].map((source) => {
                            const currentSource = state.currentOutfit.fabricSource || 'Customer';
                            const active = currentSource === source;

                            return (
                                <TouchableOpacity
                                    key={source}
                                    style={[styles.typeBtn, active && styles.typeBtnActive]}
                                    onPress={() => onChange({
                                        currentOutfit: { ...state.currentOutfit, fabricSource: source }
                                    })}
                                >
                                    <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>
                                        {source}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            <CalendarModal
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
                onSelect={handleDateSelect}
                initialDate={dateField === 'trialDate' ? state.trialDate : state.deliveryDate}
            />

            <OutfitDrawer
                visible={outfitDrawerVisible}
                onClose={() => setOutfitDrawerVisible(false)}
                outfits={outfits}
                onSelect={handleTypeSelect}
                currentType={state.currentOutfit.type}
            />
        </View>
    );
};

// Measurement Configurations
const OUTFIT_MEASUREMENTS: any = {
    'Blouse': ['Length', 'Shoulder', 'Bust', 'Waist', 'Sleeve Length', 'Sleeve Round', 'Arm Hole', 'Front Neck', 'Back Neck'],
    'Chudithar': ['Top Length', 'Shoulder', 'Bust', 'Waist', 'Hip', 'Sleeve Length', 'Sleeve Round', 'Pant Length', 'Pant Waist', 'Bottom Round'],
    'Lehanga': ['Blouse Length', 'Bust', 'Waist', 'Skirt Length', 'Skirt Waist', 'Hip'],
    'Others': ['Notes']
};

const Step2Measurements = ({ state, onChange, outfits }: any) => {
    const [historyVisible, setHistoryVisible] = useState(false);

    // 1. Get configuration
    const selectedOutfitType = outfits.find((o: any) => o.name === state.currentOutfit.type);
    const categories: any[] = selectedOutfitType?.categories || [];

    // 2. Mock History Data
    const historyData = [
        { id: '1', date: '22 Oct 2024', type: state.currentOutfit.type, data: { Length: '40', Waist: '32', Bust: '36' } },
        { id: '2', date: '10 Sep 2024', type: state.currentOutfit.type, data: { Length: '38', Waist: '30', Bust: '34' } },
        { id: '3', date: '05 Aug 2024', type: state.currentOutfit.type, data: { Length: '39', Waist: '31', Bust: '35' } },
    ];

    const applyHistory = (data: any) => {
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                measurements: { ...state.currentOutfit.measurements, ...data }
            }
        });
        setHistoryVisible(false);
        // Optional: Show toast or small feedback
    };

    const updateMeasurement = (key: string, val: string) => {
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                measurements: { ...state.currentOutfit.measurements, [key]: val }
            }
        });
    };

    const renderOptionChips = (cat: any) => {
        const selectedValue = state.currentOutfit.measurements?.[cat.name];
        const options = cat.subCategories || [];
        if (options.length === 0) return null;

        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {options.map((opt: any) => {
                    const isSelected = selectedValue === opt.name;
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            style={[
                                styles.chip,
                                isSelected && styles.chipActive
                            ]}
                            onPress={() => updateMeasurement(cat.name, opt.name)}
                        >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                {opt.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.stepContainer}>

            {/* Config Card - Redesigned with Separators */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Stitching Options</Text>
                {categories.filter((c: any) => c.isVisible).map((cat: any, index: number, arr: any[]) => (
                    <View key={cat.id} style={{
                        paddingVertical: 8, // Reduced from 12
                        borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                        borderBottomColor: '#F3F4F6'
                    }}>
                        <Text style={[styles.subLabel, { marginBottom: 4 }]}>{cat.name}</Text>
                        {renderOptionChips(cat)}
                    </View>
                ))}
                {categories.length === 0 && <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>No options available.</Text>}
            </View>

            {/* Measurements Card - History Inside Header */}
            <View style={[styles.card, { paddingBottom: 24 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Measurements</Text>
                    <TouchableOpacity onPress={() => setHistoryVisible(true)}>
                        <Text style={{ color: Colors.primary, fontFamily: 'Inter-SemiBold', fontSize: 13 }}>
                            View History
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.measurementsGrid}>
                    {['Height', 'Waist', 'Seat', 'Thigh', 'Knee', 'Bottom', 'Zip Length', 'Total Round'].map((m) => (
                        <View key={m} style={styles.measurementField}>
                            <Text style={styles.fieldLabel}>{m}</Text>
                            <View style={styles.measurementInputWrapper}>
                                <TextInput
                                    style={styles.measurementInput}
                                    keyboardType="numeric"
                                    value={state.currentOutfit.measurements?.[m] || ''}
                                    onChangeText={(val) => updateMeasurement(m, val)}
                                />
                                <Text style={styles.unitSuffix}>in</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* History Modal */}
            <Modal
                visible={historyVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setHistoryVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setHistoryVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.historyModalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Measurement History</Text>
                            <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                                <X size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeadText, { flex: 1 }]}>Date</Text>
                            <Text style={[styles.tableHeadText, { flex: 1 }]}>Type</Text>
                            <Text style={[styles.tableHeadText, { width: 60, textAlign: 'center' }]}>Action</Text>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }}>
                            {historyData.map((item) => (
                                <View key={item.id} style={styles.tableRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.tableCellDate}>{item.date}</Text>
                                        {/* Removed redundant "X measurements" subtitle */}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.tableCellText}>{item.type}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.applyBtn}
                                        onPress={() => applyHistory(item.data)}
                                    >
                                        <Text style={styles.applyBtnText}>Apply</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const Step3Media = ({ state, onChange }: any) => {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [editorVisible, setEditorVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
    const signatureRef = useRef<any>(null);

    const pickImage = async () => {
        // 1. Multiple Selection Enabled (Editing disabled to allow multiple)
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled && result.assets) {
            const newImages: string[] = [];

            // Process all selected images
            for (const asset of result.assets) {
                try {
                    const manipResult = await ImageManipulator.manipulateAsync(
                        asset.uri,
                        [{ resize: { width: 1080 } }],
                        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    newImages.push(manipResult.uri);
                } catch (e) {
                    newImages.push(asset.uri);
                }
            }

            const currentImages = state.currentOutfit.images || [];
            onChange({
                currentOutfit: {
                    ...state.currentOutfit,
                    images: [...currentImages, ...newImages]
                }
            });
        }
    };

    const removeImage = (index: number) => {
        const currentImages = [...(state.currentOutfit.images || [])];
        currentImages.splice(index, 1);
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                images: currentImages
            }
        });
    };

    const openViewer = (uri: string) => {
        setSelectedImage(uri);
        setViewerVisible(true);
    };

    const handleEditStart = async () => {
        if (!selectedImage) return;
        try {
            // Read file as Base64 for Canvas Background
            const base64 = await FileSystem.readAsStringAsync(selectedImage, { encoding: 'base64' });
            // Prefix needed for webview
            setEditImageBase64(`data:image/jpeg;base64,${base64}`);
            setEditorVisible(true);
            setViewerVisible(false); // Close viewer, open editor
        } catch (error) {
            console.log("Error reading image for edit:", error);
            Alert.alert("Error", "Could not load image for editing");
        }
    };

    const handleEditSave = async (signature: string) => {
        // signature is the base64 string of the result
        try {
            // Save to temp file
            const filename = `${(FileSystem as any).documentDirectory}edited_${Date.now()}.jpg`;
            const base64Data = signature.replace('data:image/png;base64,', '').replace('data:image/jpeg;base64,', '');

            await FileSystem.writeAsStringAsync(filename, base64Data, {
                encoding: 'base64',
            });

            // Replace the currently selected image in the list
            const currentImages = [...(state.currentOutfit.images || [])];
            const idx = currentImages.indexOf(selectedImage!);
            if (idx !== -1) {
                currentImages[idx] = filename;
                onChange({
                    currentOutfit: {
                        ...state.currentOutfit,
                        images: currentImages
                    }
                });
            }

            setEditorVisible(false);
            setSelectedImage(null);
        } catch (error) {
            console.log("Error saving edited image:", error);
            Alert.alert("Error", "Could not save edit");
        }
    };

    return (
        <View style={styles.stepContainer}>
            {/* Reference Images */}
            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.subLabel}>Reference Images</Text>
                    <TouchableOpacity onPress={pickImage} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Upload size={16} color={Colors.primary} />
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.primary, fontSize: 14 }}>Upload Photos</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.imageGrid}>
                    {(state.currentOutfit.images || []).map((uri: string, index: number) => (
                        <View key={index} style={styles.imagePreview}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => openViewer(uri)}>
                                <Image source={{ uri: uri }} style={{ flex: 1, borderRadius: 8 }} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => removeImage(index)}
                            >
                                <Trash2 size={14} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Big Upload Button if Empty */}
                    {(!state.currentOutfit.images || state.currentOutfit.images.length === 0) && (
                        <TouchableOpacity style={styles.emptyUploadBox} onPress={pickImage}>
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                <Upload size={24} color={Colors.primary} />
                            </View>
                            <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.primary, fontSize: 14 }}>Click to Upload</Text>
                            <Text style={{ fontFamily: 'Inter-Regular', color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>Select multiple photos</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Voice Note */}
            <View style={styles.section}>
                <Text style={styles.subLabel}>Voice Note</Text>
                <TouchableOpacity style={styles.voiceNoteCard}>
                    <View style={[styles.micCircle, { width: 40, height: 40 }]}>
                        <Mic size={20} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.voiceTitle}>Record Instructions</Text>
                        <Text style={styles.voiceSub}>Tap to record (Coming Soon)</Text>
                    </View>
                    <ChevronRight size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.section}>
                <Text style={styles.subLabel}>Additional Notes</Text>
                <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    multiline
                    placeholder="Add specific instructions for this outfit..."
                    value={state.currentOutfit.notes}
                    onChangeText={(val) => onChange({
                        currentOutfit: { ...state.currentOutfit, notes: val }
                    })}
                />
            </View>

            {/* Image Viewer Modal */}
            <Modal transparent={true} visible={viewerVisible} onRequestClose={() => setViewerVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 999, padding: 8 }}
                        onPress={() => setViewerVisible(false)}
                    >
                        <X size={32} color={Colors.white} />
                    </TouchableOpacity>

                    {selectedImage && (
                        <>
                            <Image
                                source={{ uri: selectedImage }}
                                style={{ width: '100%', height: '70%', resizeMode: 'contain' }}
                            />

                            {/* Editor Toolbar */}
                            <View style={{ position: 'absolute', bottom: 40, flexDirection: 'row', gap: 20 }}>
                                <TouchableOpacity
                                    style={styles.editorBtn}
                                    onPress={handleEditStart}
                                >
                                    <PenTool size={20} color={Colors.white} />
                                    <Text style={styles.editorBtnText}>Draw / Highlight</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </Modal>

            {/* Canvas Editor Modal */}
            <Modal visible={editorVisible} animationType="slide" onRequestClose={() => setEditorVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                    <View style={{ height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
                        <TouchableOpacity onPress={() => setEditorVisible(false)}>
                            <Text style={{ color: 'white', fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Draw / Highlight</Text>
                        <TouchableOpacity onPress={() => signatureRef.current?.readSignature()}>
                            <Text style={{ color: Colors.primary, fontSize: 16, fontWeight: 'bold' }}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    {editImageBase64 && (
                        <View style={{ flex: 1 }}>
                            <SignatureScreen
                                ref={signatureRef}
                                onOK={handleEditSave}
                                onEmpty={() => console.log("Empty signature")}
                                descriptionText="Draw to highlight"
                                clearText="Clear"
                                confirmText="Save"
                                webStyle={`.m-signature-pad--footer { display: none; margin: 0px; } body,html { width: 100%; height: 100%; }`}
                                bgSrc={editImageBase64}
                                bgWidth={350}
                                bgHeight={500}
                            />
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};
const Step4Billing = ({ state, onChange, onAddAnother, onEditItem, onDeleteItem }: any) => {
    const cartItems = state.cart;
    const currentItem = { ...state.currentOutfit, id: 'current' };

    const calculateTotal = () => {
        const cartTotal = state.cart.reduce((sum: number, item: any) => sum + (item.totalCost || 0), 0);
        const currentTotal = state.currentOutfit.totalCost || 0;
        return cartTotal + currentTotal;
    };

    const total = calculateTotal();
    const balance = total - (parseFloat(state.advance) || 0);

    return (
        <View style={styles.stepContainer}>
            {/* Order Items Card */}
            <View style={styles.summaryCard}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>Order Items ({cartItems.length + 1})</Text>
                </View>

                {/* Cart Items (Completed) */}
                {cartItems.map((item: any, index: number) => (
                    <View key={index}>
                        <View style={styles.itemRow}>
                            {/* Item Details */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemNameText}>{item.type}</Text>
                                <Text style={styles.itemQtyText}>Qty: {item.qty}  •  Status: Ready</Text>
                            </View>

                            {/* Price & Actions */}
                            <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                <Text style={styles.itemPriceText}>₹{item.totalCost}</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity onPress={() => onEditItem(index)} style={styles.actionIconBtn}>
                                        <Edit2 size={16} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => onDeleteItem(index)} style={styles.actionIconBtn}>
                                        <Trash2 size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        {/* Divider between items */}
                        <View style={styles.itemDivider} />
                    </View>
                ))}

                {/* Current Item (Draft) */}
                <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.itemNameText}>{currentItem.type}</Text>
                            <View style={styles.draftBadge}>
                                <Text style={styles.draftBadgeText}>Current</Text>
                            </View>
                        </View>
                        <Text style={styles.itemQtyText}>Qty: {currentItem.qty}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.itemPriceText}>₹{currentItem.totalCost || 0}</Text>
                        {/* No direct delete for current, it's just 'in progress' */}
                    </View>
                </View>
            </View>

            {/* Add Another Outfit Button */}
            <TouchableOpacity style={styles.addAnotherBtn} onPress={onAddAnother}>
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.addAnotherText}>Add Another Outfit</Text>
            </TouchableOpacity>

            {/* Payment Details Card */}
            <View style={[styles.summaryCard, { backgroundColor: Colors.white }]}>
                <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Payment Details</Text>

                {/* Total Input */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.fieldLabel}>Cost for Current Item ({state.currentOutfit.type})</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                            style={styles.currencyInput}
                            keyboardType="numeric"
                            placeholder="0.00"
                            value={state.currentOutfit.totalCost?.toString()}
                            onChangeText={(val) => onChange({
                                currentOutfit: { ...state.currentOutfit, totalCost: parseFloat(val) || 0 }
                            })}
                        />
                    </View>
                </View>

                {/* Advance Input */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.fieldLabel}>Advance Paid</Text>
                    <View style={styles.advanceRow}>
                        <View style={[styles.inputWrapper, { flex: 1 }]}>
                            <Text style={styles.currencyPrefix}>₹</Text>
                            <TextInput
                                style={styles.currencyInput}
                                keyboardType="numeric"
                                placeholder="0.00"
                                value={state.advance}
                                onChangeText={(val) => onChange({ advance: val })}
                            />
                        </View>
                        {/* Mode Toggle */}
                        <View style={styles.modeToggle}>
                            {['Cash', 'UPI'].map(mode => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.modeBtn, state.advanceMode === mode && styles.modeBtnActive]}
                                    onPress={() => onChange({ advanceMode: mode })}
                                >
                                    <Text style={[styles.modeBtnText, state.advanceMode === mode && styles.modeBtnTextActive]}>
                                        {mode}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Grand Total Display */}
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Order Value</Text>
                    <Text style={styles.summaryValue}>₹{total}</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: 8 }]}>
                    <Text style={styles.totalLabel}>Balance Due</Text>
                    <Text style={styles.totalValue}>₹{balance.toFixed(2)}</Text>
                </View>
            </View>
        </View>
    );
};

const MAX_STEPS = 4; // 0 to 3

const CreateOrderFlowScreen = ({ navigation }: any) => {
    const { addOrder, customers, outfits } = useData();
    const { company } = useAuth();

    // UI State
    const [currentStep, setCurrentStep] = useState(0);
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('Auto-saved');

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, []);

    const [orderState, setOrderState] = useState({
        customerType: 'new' as 'new' | 'existing',
        selectedCustomer: null as any,
        customerName: '',
        customerMobile: '',
        customerLocation: '',
        cart: [] as OutfitItem[], // COMPLETED items
        currentOutfit: {
            id: '1',
            type: outfits.length > 0 ? outfits[0].name : 'Blouse',
            qty: 1,
            deliveryDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 7))),
            trialDate: '',
            measurements: {},
            notes: '',
            images: [],
            fabricSource: 'Customer',
            status: 'Pending',
            totalCost: 0
        } as Partial<OutfitItem>,
        advance: '',
        advanceMode: 'Cash' as 'Cash' | 'UPI'
    });

    // Mock Auto-save simulation
    useEffect(() => {
        setAutoSaveStatus('Saving...');
        const timer = setTimeout(() => setAutoSaveStatus('Auto-saved'), 1000);
        return () => clearTimeout(timer);
    }, [orderState]);

    const handleCustomerSelect = (customer: any) => {
        setOrderState(prev => ({
            ...prev,
            selectedCustomer: customer,
            customerName: customer.name,
            customerMobile: customer.mobile,
            customerLocation: customer.location || '',
            customerType: customer.isNew ? 'new' : 'existing'
        }));
        setCustomerModalVisible(false);
    };

    const handleNext = () => {
        if (currentStep < MAX_STEPS - 1) {
            setCurrentStep(curr => curr + 1);
        } else {
            handleSave();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(curr => curr - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleAddAnotherOutfit = () => {
        // Validation: Verify current outfit has type
        if (!orderState.currentOutfit.type) {
            Alert.alert("Required", "Please select outfit type.");
            return;
        }

        // Push current outfit to cart
        const completedOutfit = {
            id: Date.now().toString(),
            ...orderState.currentOutfit,
            // Ensure defaults
            qty: orderState.currentOutfit.qty || 1,
            totalCost: orderState.currentOutfit.totalCost || 0,
            costItems: [],
            images: orderState.currentOutfit.images || [],
            measurements: orderState.currentOutfit.measurements || {}
        } as OutfitItem;

        setOrderState(prev => ({
            ...prev,
            cart: [...prev.cart, completedOutfit],
            // Reset current outfit, but keep dates?
            currentOutfit: {
                id: (Date.now() + 1).toString(),
                type: outfits.length > 0 ? outfits[0].name : 'Blouse',
                qty: 1,
                deliveryDate: prev.currentOutfit.deliveryDate, // Keep same delivery date
                trialDate: prev.currentOutfit.trialDate,
                measurements: {},
                notes: '',
                images: [],
                fabricSource: 'Customer',
                status: 'Pending',
                totalCost: 0
            }
        }));

        // Loop back to Step 1 (or Step 2?) - User requirement: "choose multioutfit option... while choosing blouse... at end... add another"
        // Going back to Step 1 lets them choose Type again.
        setCurrentStep(0);
        Alert.alert("Added", "Outfit added to cart. Add details for the next item.");
    };

    const handleDeleteCartItem = (index: number) => {
        Alert.alert(
            "Delete Item",
            "Are you sure you want to remove this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const newCart = [...orderState.cart];
                        newCart.splice(index, 1);
                        setOrderState(prev => ({ ...prev, cart: newCart }));
                    }
                }
            ]
        );
    };

    const handleEditCartItem = (index: number) => {
        Alert.alert(
            "Edit Item",
            "This will move the item back to the form for editing. The current pending item (if any) will be saved to cart to avoid loss.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Edit",
                    onPress: () => {
                        // 1. If current item has meaningful data, push it to cart first?
                        // For simplicity: Just swap them. Or push current to cart.
                        // Let's assume user wants to pause current and edit that one.
                        // Pushing current to cart might be annoying if it's empty.

                        // Better logic: Move 'item to edit' into 'currentOutfit'.
                        // If 'currentOutfit' is not empty/default, push it to 'cart' end.

                        setOrderState(prev => {
                            const itemToEdit = prev.cart[index];
                            const newCart = [...prev.cart];
                            newCart.splice(index, 1); // Remove from cart

                            let updatedCart = newCart;
                            // Check if current outfit has changes (simple check: totalCost > 0 or has images)
                            const isCurrentDirty = prev.currentOutfit.totalCost || (prev.currentOutfit.images && prev.currentOutfit.images.length > 0);

                            if (isCurrentDirty) {
                                // Save current pending work to cart
                                // We need to cast it properly
                                updatedCart.push({
                                    ...prev.currentOutfit,
                                    id: Date.now().toString(),
                                    qty: prev.currentOutfit.qty || 1,
                                    totalCost: prev.currentOutfit.totalCost || 0,
                                    // Ensure other fields
                                } as OutfitItem);
                            }

                            return {
                                ...prev,
                                cart: updatedCart,
                                currentOutfit: itemToEdit // Load into edit
                            };
                        });

                        // Go to step 1
                        setCurrentStep(0);
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!orderState.customerName || !orderState.customerMobile) {
                Alert.alert("Required", "Please select or add a customer.");
                setCurrentStep(0);
                return;
            }

            // Combine Cart + Current
            // NOTE: Only if current outfit has data? Or assume Step 4 implies verify current?
            // User might be just reviewing cart. BUT Step 4 asks for cost of current.

            const currentOutfitFinal = {
                id: Date.now().toString(),
                ...orderState.currentOutfit,
                qty: orderState.currentOutfit.qty || 1,
                totalCost: orderState.currentOutfit.totalCost || 0,
                costItems: [],
                images: orderState.currentOutfit.images || [],
                measurements: orderState.currentOutfit.measurements || {}
            } as OutfitItem;

            const allOutfits = [...orderState.cart, currentOutfitFinal];

            const total = allOutfits.reduce((sum, item) => sum + item.totalCost, 0);
            const advance = parseFloat(orderState.advance) || 0;
            const balance = total - advance;

            // Handle Customer
            let customerId = orderState.selectedCustomer?.id;
            if (orderState.customerType === 'new' || !customerId) {
                // If ID is fake 'NEW_..' or null, treat as walkin/new
                // In a real app we would create customer first.
                // For now using fallback
                customerId = 'WALKIN';
            }

            const orderData: any = {
                id: Date.now().toString(),
                billNo: `ORD-${Date.now().toString().slice(-6)}`,
                date: getCurrentDate(),
                time: getCurrentTime(),
                customerId: customerId,
                customerName: orderState.customerName,
                customerMobile: orderState.customerMobile,
                companyId: company?.id || 'default',
                items: [],
                outfits: allOutfits,
                subtotal: total,
                advance: advance,
                total: total,
                balance: balance,
                status: balance <= 0 ? 'Paid' : (advance > 0 ? 'Partial' : 'Due')
            };

            await addOrder(orderData);

            Alert.alert("Success", "Order created successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);

        } catch (error: any) {
            console.error("Save Error:", error);
            Alert.alert("Error", "Failed to save order: " + error.message);
        }
    };

    const CurrentStepComponent = [
        Step1BasicInfo,
        Step2Measurements,
        Step3Media,
        Step4Billing
    ][currentStep];

    const stepTitles = [
        "Outfit & Order Info",
        "Stitching & Measurements",
        "Photos & References",
        "Billing and Overview"
    ];

    const orderIdDisplay = `ORD-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-001`;

    return (
        <View style={styles.container}>
            {/* Unified Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={handleBack} style={{ padding: 4 }}>
                        <ArrowLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
                        <Text style={styles.headerSubtitle}>Step {currentStep + 1} of {MAX_STEPS}</Text>
                    </View>
                </View>

                {/* Liquid Progress */}
                <LiquidProgress current={currentStep} total={MAX_STEPS} />
            </View>

            {/* Order Status Bar */}
            <View style={styles.orderStatusBar}>
                <Text style={styles.orderIdText}>{orderIdDisplay}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Check size={12} color={Colors.primary} />
                    <Text style={styles.autoSaveText}>{autoSaveStatus}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <CurrentStepComponent
                    state={orderState}
                    onChange={(updates: any) => setOrderState(prev => ({ ...prev, ...updates }))}
                    customers={customers}
                    outfits={outfits}
                    openCustomerModal={() => setCustomerModalVisible(true)}
                    onAddAnother={handleAddAnotherOutfit}
                    onEditItem={handleEditCartItem}
                    onDeleteItem={handleDeleteCartItem}
                />
            </ScrollView>

            <View style={styles.footer}>
                {currentStep > 0 ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backBtnFooter}>
                        <ArrowLeft size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 48 }} />
                )}

                <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                    <Text style={styles.nextBtnText}>
                        {currentStep === MAX_STEPS - 1 ? 'Save Order' : 'Next'}
                    </Text>
                    {currentStep === MAX_STEPS - 1 ? (
                        <Check size={20} color={Colors.white} />
                    ) : (
                        <ArrowRight size={20} color={Colors.white} />
                    )}
                </TouchableOpacity>
            </View>

            <CustomerSelectionModal
                visible={customerModalVisible}
                onClose={() => setCustomerModalVisible(false)}
                onSelect={handleCustomerSelect}
                customers={customers}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Distinct off-white for contrast
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60, // Safe area
        backgroundColor: Colors.white, // Ensure header is white
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        // Remove progressBarBg styles from here if any
    },
    headerTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary
    },
    headerSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2
    },
    circularProgress: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0FDF9', // Light green bg
        borderWidth: 2,
        borderColor: Colors.primary,
        overflow: 'hidden'
    },
    progressText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.primary
    },
    circleBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent'
    },
    circleFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(16, 185, 129, 0.1)' // Very subtle fill if needed, or just rely on text
        // Actually, for a ring effect we need SVG. For "Circle fill", maybe just text is enough as requested "compact as circle fill". 
        // Let's stick to the ring border + Text 2/4.
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 80
    },


    stepContainer: {
        gap: Spacing.md,
    },
    stepTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        height: 48,
        borderRadius: 24,
        gap: 8,
        ...Shadow.medium,
    },
    nextBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.white,
    },
    // Step component styles
    section: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    subLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 50,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    // Customer Selection Styles
    selectCustomerBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: Spacing.md,
        height: 56,
        ...Shadow.subtle
    },
    selectCustomerText: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textSecondary
    },
    selectedCustomerCard: {
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        borderRadius: 12,
        padding: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: '#0369A1',
    },
    customerMobile: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#075985',
        marginTop: 2,
    },
    changeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.primary,
    },
    addAnotherBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 24,
        height: 48,
        marginVertical: Spacing.lg,
        gap: 8,
        borderStyle: 'dashed'
    },
    addAnotherText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.primary,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginTop: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: Colors.white,
        ...Shadow.subtle,
    },
    toggleBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    toggleBtnTextActive: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold',
    },
    // Measurement Styles
    measurementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    measurementField: {
        width: '50%',
        paddingHorizontal: 8,
        marginBottom: Spacing.md,
    },
    fieldLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    fieldInput: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 48,
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    infoBox: {
        backgroundColor: '#F3F4F6',
        padding: Spacing.md,
        borderRadius: 12,
    },
    infoText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    // Media Styles
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary
    },
    // New Billing UI Styles
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.md,
        ...Shadow.subtle,
        borderWidth: 1,
        borderColor: Colors.border
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },

    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        alignItems: 'flex-start'
    },
    itemNameText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
        marginBottom: 4
    },
    itemQtyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary
    },
    itemPriceText: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: Colors.textPrimary,
        marginBottom: 8
    },
    actionIconBtn: {
        padding: 4
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 8
    },
    draftBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    draftBadgeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 10,
        color: '#D97706'
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 48,
        backgroundColor: '#F9FAFB',
    },
    currencyPrefix: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
        marginRight: 8,
    },
    currencyInput: {
        flex: 1,
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    advanceRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        width: 110,
    },
    modeBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    modeBtnActive: {
        backgroundColor: Colors.white,
        ...Shadow.subtle,
    },
    modeBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    modeBtnTextActive: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold',
    },
    totalLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    totalValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.primary,
    },

    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        ...Shadow.subtle,
    },
    removeImageBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: Colors.danger,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    addImageBtn: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#86EFAC',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    emptyUploadBox: {
        height: 160,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        marginBottom: 16
    },
    addImageText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.primary,
    },
    voiceNoteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    micCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.subtle,
    },
    voiceTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    voiceSub: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    // New Styles for Step 1 Refactor
    typeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12, // Increased radius
        padding: 4,
        marginTop: 8,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    typeBtnActive: {
        backgroundColor: Colors.white,
        ...Shadow.subtle,
    },
    typeBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    typeBtnTextActive: {
        fontFamily: 'Inter-Bold',
        color: Colors.primary,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 12,
        backgroundColor: Colors.white,
        height: 50,
        gap: 8,
    },
    customerInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
        height: '100%',
    },
    suggestionsContainer: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        marginTop: -8,
        marginBottom: 16,
        maxHeight: 200,
        ...Shadow.medium,
        zIndex: 10, // Ensure it floats above
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    suggestionName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    suggestionMobile: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    suggestionLocation: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    dropdownInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        backgroundColor: Colors.white,
    },
    dropdownInputText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    pickerModalContent: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        ...Shadow.medium,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pickerItemText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Measurement Input Styles
    measurementInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 48,
    },
    measurementInput: {
        flex: 1,
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
        height: '100%'
    },
    unitSuffix: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 4
    },
    // Liquid Progress
    liquidContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    liquidFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#34D399', // A nice liquid green
        opacity: 0.8
    },
    liquidText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.textPrimary,
        zIndex: 10
    },
    // Order Status Bar
    orderStatusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    orderIdText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textPrimary,
    },
    autoSaveText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.success,
    },
    // New Card Styles
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...Shadow.small
    },
    cardTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 12
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        marginBottom: 8
    },
    chipActive: {
        backgroundColor: Colors.primary
    },
    chipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textPrimary
    },
    chipTextActive: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold'
    },
    // Footer Back Btn
    backBtnFooter: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // History Modal
    historyModalContent: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxHeight: '80%',
        ...Shadow.large,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 8
    },
    tableHeadText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center'
    },
    tableCellDate: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary
    },
    tableCellSub: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary
    },
    tableCellText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary
    },
    applyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 8
    },
    applyBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: Colors.primary
    },

    // --- Step 1 Refactor Styles ---
    customerSelectBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8
    },
    dateInputDisplay: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    dateInputText: {
        fontFamily: 'Inter-SemiBold', // Strengthened from Medium
        fontSize: 14,
        color: Colors.textPrimary
    },
    dropdownDisplay: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 50
    },
    dropdownText: {
        fontFamily: 'Inter-SemiBold', // Strengthened from Medium
        fontSize: 14,
        color: Colors.textPrimary
    },

    // Stepper
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
        height: 50,
        paddingHorizontal: 4
    },
    stepperBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 8,
        ...Shadow.subtle
    },
    stepperBtnText: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
        lineHeight: 20
    },
    stepperValue: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary
    },

    // Calendar Modal
    calendarContainer: {
        backgroundColor: Colors.white,
        margin: 20,
        borderRadius: 20,
        padding: 20,
        ...Shadow.large,
        width: '90%',
        maxWidth: 360
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    calendarTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    weekDayText: {
        width: '14.2%', // 100/7
        textAlign: 'center',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: Colors.textSecondary
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start'
    },
    calendarDay: {
        width: '14.2%', // Ensure 7 items fit
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        borderRadius: 20 // Circular-ish
    },
    calendarDayEmpty: {
        width: '14.2%',
        aspectRatio: 1,
        marginBottom: 4
    },
    calendarDaySelected: {
        backgroundColor: Colors.primary,
        borderRadius: 999
    },
    calendarDayToday: {
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 999
    },
    calendarDayText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary
    },
    calendarDayTextSelected: {
        color: Colors.white,
        fontFamily: 'Inter-Bold'
    },
    calendarDayTextToday: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold'
    },

    // Bottom Sheet (Outfit Drawer)
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...Shadow.large
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    bottomSheetTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary
    },
    outfitOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    outfitOptionSelected: {
        backgroundColor: '#F0F9FF', // Light primary
    },
    outfitOptionText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary
    },
    outfitOptionTextSelected: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold'
    },
    editorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 8,
        ...Shadow.subtle
    },
    editorBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary
    },
    valueText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary
    }
});

export default CreateOrderFlowScreen;
