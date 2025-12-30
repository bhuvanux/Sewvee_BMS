import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    Modal,
    Image,
    StatusBar,
    Animated,
    Easing,
    LayoutAnimation
} from 'react-native';
import {
    ChevronLeft,
    Info,
    ArrowLeft,
    Check,
    ArrowRight,
    Camera,
    Image as ImageIcon, // This is the placeholder icon
    Mic,
    X,
    Plus,
    Edit2,
    Trash2,
    Play,
    Pause,
    ChevronDown,
    ChevronRight,
    SquarePen,
    User,
    Upload,
    PenTool,
    Square,
    Search,
    AlertTriangle,
    Pen,
    Eraser,
    Undo2,
    Calendar,
    History,
    Flame
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order, OutfitItem, MeasurementProfile, MeasurementHistoryItem } from '../types';
import { formatDate, getCurrentDate, getCurrentTime, parseDate } from '../utils/dateUtils';
import AlertModal from '../components/AlertModal';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import SignatureScreen from 'react-native-signature-canvas';
import { generateInvoicePDF, generateTailorCopyPDF, generateCustomerCopyPDF, getCustomerCopyHTML, printHTML } from '../services/pdfService';
import PDFPreviewModal from '../components/PDFPreviewModal';
import { transcribeAudioWithWhisper } from '../services/openaiService';
import { useNavigation } from '@react-navigation/native';
// Skia drawing temporarily disabled due to version compatibility



import CustomerSelectionModal from '../components/CustomerSelectionModal';
import OrderSuccessModal from '../components/OrderSuccessModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';
import ReusableBottomDrawer from '../components/ReusableBottomDrawer';

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

const CalendarModal = ({ visible, onClose, onSelect, initialDate, disablePastDates = true }: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
            const cellDate = new Date(currentYear, currentMonth, i);
            cellDate.setHours(0, 0, 0, 0);

            // Check if date is in the past
            const isPast = disablePastDates && cellDate < today;

            // Highlight if matches initialDate
            const isSelected = initialDate === dateStr;
            const isToday = todayStr === dateStr && !isSelected;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isToday && styles.calendarDayToday,
                        isPast && styles.calendarDayDisabled
                    ]}
                    onPress={() => !isPast && handleDateClick(i)}
                    disabled={isPast}
                >
                    <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && styles.calendarDayTextToday,
                        isPast && styles.calendarDayTextDisabled
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
const Step1BasicInfo = ({ state, onChange, customers, outfits, openCustomerModal, editItemIndex, onShowAlert }: any) => {
    // Local State for Modals
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [dateField, setDateField] = useState<'trialDate' | 'deliveryDate' | null>(null);
    const [outfitDrawerVisible, setOutfitDrawerVisible] = useState(false);

    const handleDateSelect = (date: string) => {
        if (dateField) {
            onChange({
                [dateField]: date,
                currentOutfit: { ...state.currentOutfit, [dateField]: date }
            });
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
        // Reset measurements when type changes to prevent cross-contamination
        onChange({
            currentOutfit: { ...state.currentOutfit, type: typeName, measurements: {} }
        });
    };

    // Customer Display logic
    const displayCustomerName = state.customerName || (state.selectedCustomer ? state.selectedCustomer.name : 'Select Customer');
    const displayCustomerMobile = state.customerMobile || (state.selectedCustomer ? state.selectedCustomer.mobile : '');
    const isCustomerSelected = !!state.customerName || !!state.selectedCustomer;

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 28 }}>

            {/* 1. Customer Section - Modern Card */}
            <View>
                <Text style={styles.newSectionTitle}>Customer</Text>
                <TouchableOpacity
                    style={[styles.customerCleanArea, editItemIndex !== undefined && { opacity: 0.6 }]}
                    onPress={editItemIndex === undefined ? openCustomerModal : () => onShowAlert('Editing Restricted', 'Cannot change customer while editing an item.')}
                    disabled={editItemIndex !== undefined}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={styles.customerAvatarClean}>
                            <User size={22} color={isCustomerSelected ? Colors.primary : "#94A3B8"} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.customerNameMain, !isCustomerSelected && { color: '#94A3B8', fontFamily: 'Inter-Regular' }]}>
                                {displayCustomerName}
                            </Text>
                            {isCustomerSelected && !!displayCustomerMobile && (
                                <Text style={styles.customerSubText}>
                                    {displayCustomerMobile}
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* 2. Outfit Details - Type & Qty */}
            <View style={{ gap: 24 }}>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.modernLabel}>Outfit Type</Text>
                        <TouchableOpacity
                            style={[styles.modernDropdown, editItemIndex !== undefined && { opacity: 0.6, backgroundColor: '#F8FAFC' }]}
                            onPress={editItemIndex === undefined ? () => setOutfitDrawerVisible(true) : () => onShowAlert('Editing Restricted', 'Cannot change outfit type while editing an item.')}
                            disabled={editItemIndex !== undefined}
                        >
                            <Text style={styles.modernDropdownText}>{state.currentOutfit.type}</Text>
                            {editItemIndex === undefined && <ChevronDown size={20} color="#64748B" />}
                        </TouchableOpacity>
                    </View>

                    <View style={{ width: 130 }}>
                        <Text style={styles.modernLabel}>Quantity</Text>
                        <QuantityStepper
                            value={state.currentOutfit.quantity || 1}
                            onChange={handleQuantityChange}
                        />
                    </View>
                </View>

                {/* 3. Order Type Section */}
                <View>
                    <Text style={styles.modernLabel}>Order Type</Text>
                    <View style={styles.chipGroup}>
                        {['Stitching', 'Alteration'].map((t) => {
                            const isSelected = state.orderType === t;
                            return (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                                    onPress={() => onChange({
                                        orderType: t,
                                        currentOutfit: { ...state.currentOutfit, orderType: t }
                                    })}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                        {t}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* 4. Urgency */}
                <View>
                    <Text style={styles.modernLabel}>Order Urgency</Text>
                    <View style={styles.chipGroup}>
                        {['Normal', 'Urgent'].map((u) => {
                            const isSelected = state.urgency === u;
                            return (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                                    onPress={() => onChange({
                                        urgency: u,
                                        currentOutfit: { ...state.currentOutfit, urgency: u }
                                    })}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                        {u}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* 5. Fabric Source */}
                <View>
                    <Text style={styles.modernLabel}>Fabric Source</Text>
                    <View style={styles.chipGroup}>
                        {['Customer', 'Boutique'].map((s) => {
                            const isSelected = state.currentOutfit.fabricSource === s;
                            return (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                                    onPress={() => onChange({ currentOutfit: { ...state.currentOutfit, fabricSource: s } })}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* 6. Dates Section - Modern Card Grid */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity
                        style={styles.dateModernCard}
                        onPress={() => openCalendar('trialDate')}
                    >
                        <Text style={styles.modernLabel}>Trial Date</Text>
                        <Text style={[styles.modernDateText, !state.trialDate && { color: '#94A3B8' }]}>
                            {state.trialDate || 'Set Date'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateModernCard}
                        onPress={() => openCalendar('deliveryDate')}
                    >
                        <Text style={styles.modernLabel}>Delivery Date</Text>
                        <Text style={[styles.modernDateText, !state.deliveryDate && { color: '#94A3B8' }]}>
                            {state.deliveryDate || 'Set Date'}
                        </Text>
                    </TouchableOpacity>
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
                outfits={outfits.filter((o: any) => o.isVisible !== false)}
                onSelect={handleTypeSelect}
                currentType={state.currentOutfit.type}
            />
        </ScrollView >
    );
};

// Measurement Configurations
const OUTFIT_MEASUREMENTS: any = {
    'Blouse': ['Length', 'Shoulder', 'Bust', 'Waist', 'Sleeve Length', 'Sleeve Round', 'Arm Hole', 'Front Neck', 'Back Neck'],
    'Chudithar': ['Top Length', 'Shoulder', 'Bust', 'Waist', 'Hip', 'Sleeve Length', 'Sleeve Round', 'Pant Length', 'Pant Waist', 'Bottom Round'],
    'Lehanga': ['Blouse Length', 'Bust', 'Waist', 'Skirt Length', 'Skirt Waist', 'Hip'],
    'Others': ['Notes']
};

import { DEFAULT_OUTFITS } from '../context/DataContext';

const StepStitching = ({ state, onChange, outfits }: any) => {
    let selectedOutfitType = outfits.find((o: any) => o.name === state.currentOutfit.type);

    // Auto-sync: Merge Default structure (for code updates) with DB data (for images/customizations)
    const defaultDef = DEFAULT_OUTFITS.find(d => d.name === state.currentOutfit.type);

    // Deep merge function
    const mergeCategories = (defaults: any[], dbCats: any[]) => {
        // 1. Start with DB categories to ensure custom ones are preserved
        const result = (dbCats || []).map(dbCat => {
            const defCat = (defaults || []).find(d => d.name === dbCat.name || d.id === dbCat.id);

            // Merge sub-categories
            const mergedSubCats = (dbCat.subCategories || []).map((dbSub: any) => {
                const defSub = (defCat?.subCategories || []).find((s: any) => s.name === dbSub.name || s.id === dbSub.id);

                // Merge options
                const mergedOptions = (dbSub.options || []).map((dbOpt: any) => {
                    const defOpt = (defSub?.options || []).find((o: any) => o.name === dbOpt.name || o.id === dbOpt.id);
                    return {
                        ...(defOpt || {}),
                        ...dbOpt,
                        image: dbOpt.image || defOpt?.image // Prioritize DB image
                    };
                });

                // Add missing options from defaults
                // REMOVED: To respect user deletions in Manage Outfits.
                /*
                if (defSub?.options) {
                    defSub.options.forEach((defOpt: any) => {
                        if (!mergedOptions.find((o: any) => o.name === defOpt.name || o.id === defOpt.id)) {
                            mergedOptions.push(defOpt);
                        }
                    });
                }
                */

                return {
                    ...(defSub || {}),
                    ...dbSub,
                    image: dbSub.image || defSub?.image,
                    options: mergedOptions
                };
            });

            // Add missing sub-categories from defaults
            // REMOVED: To respect user deletions in Manage Outfits.
            /*
            if (defCat?.subCategories) {
                defCat.subCategories.forEach((defSub: any) => {
                    if (!mergedSubCats.find((s: any) => s.name === defSub.name || s.id === defSub.id)) {
                        mergedSubCats.push(defSub);
                    }
                });
            }
            */

            return {
                ...(defCat || {}),
                ...dbCat,
                image: dbCat.image || defCat?.image,
                subCategories: mergedSubCats
            };
        });

        // 2. Add missing categories from defaults (in case of app updates)
        // REMOVED: User reported that this overrides their custom configuration (e.g. 5 categories vs 7).
        // if (dbCats && dbCats.length > 0) { ... } -> Skip this step.
        // Only inject defaults if the DB has absolutely no categories? 
        // No, if DB has an outfit entry, we trust its structure.
        /*
        (defaults || []).forEach(defCat => {
            if (!result.find(c => c.name === defCat.name || c.id === defCat.id)) {
                result.push(defCat);
            }
        });
        */

        return result;
    };

    if (defaultDef && selectedOutfitType) {
        // Merge to keep DB images but use Default structure
        selectedOutfitType = {
            ...selectedOutfitType,
            categories: mergeCategories(defaultDef.categories || [], selectedOutfitType.categories || [])
        };
    } else if (defaultDef && !selectedOutfitType) {
        selectedOutfitType = defaultDef;
    }

    const categories: any[] = selectedOutfitType?.categories || [];

    // State for currently selected category in the sidebar
    // Default to first category if available
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    // State for drilling down into a sub-category
    const [viewingSubCategoryId, setViewingSubCategoryId] = useState<string | null>(null);

    useEffect(() => {
        if (categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categories[0].id);
            setViewingSubCategoryId(null);
        }
    }, [categories]);

    // Reset drill-down when category changes
    const onSelectCategory = (id: string) => {
        setSelectedCategoryId(id);
        setViewingSubCategoryId(null);
    };

    const activeCategory = categories.find(c => c.id === selectedCategoryId);
    const activeSubCategory = activeCategory?.subCategories?.find((s: any) => s.id === viewingSubCategoryId);

    const updateMeasurement = (key: string, val: string) => {
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                measurements: { ...state.currentOutfit.measurements, [key]: val }
            }
        });
    };

    const hasSelection = (catName: string) => {
        return !!state.currentOutfit.measurements?.[catName];
    };

    const handleOptionPress = (opt: any) => {
        // Check if this option has nested options
        if (opt.options && opt.options.length > 0) {
            // Drill down
            setViewingSubCategoryId(opt.id);
        } else {
            // Leaf node selection (Level 2)
            // If we are already in Level 3, this is called for the Option item
            updateMeasurement(activeCategory.name, opt.name);
        }
    };

    const handleLevel3Selection = (subCatName: string, optionName: string) => {
        // Save as "Paan - Deep"
        const finalValue = `${subCatName} - ${optionName}`;
        updateMeasurement(activeCategory.name, finalValue);
    };

    const renderSidebarItem = (cat: any) => {
        const isActive = selectedCategoryId === cat.id;
        const isCompleted = hasSelection(cat.name);

        return (
            <TouchableOpacity
                key={cat.id}
                style={[
                    styles.sidebarItem,
                    isActive && styles.sidebarItemActive
                ]}
                onPress={() => onSelectCategory(cat.id)}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[
                        styles.sidebarItemText,
                        isActive && styles.sidebarItemTextActive
                    ]}>
                        {cat.name}
                    </Text>
                </View>
                {isCompleted && (
                    <View style={styles.sidebarCheckBadge}>
                        <Check size={10} color={Colors.white} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderOptionGrid = () => {
        if (!activeCategory) return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: Colors.textSecondary }}>Select a category</Text>
            </View>
        );

        // LEVEL 3: Viewing Options for a SubCategory
        if (viewingSubCategoryId && activeSubCategory) {
            const nestedOptions = activeSubCategory.options || [];
            const selectedValue = state.currentOutfit.measurements?.[activeCategory.name];

            return (
                <View style={{ flex: 1 }}>
                    {/* Header with Back Button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                        <TouchableOpacity onPress={() => setViewingSubCategoryId(null)} style={{ padding: 4, marginRight: 8 }}>
                            <ArrowLeft size={20} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerSubtitle}>{activeCategory.name}</Text>
                            <Text style={styles.sectionTitle}>{activeSubCategory.name}</Text>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                        <View style={{ gap: 12 }}>
                            {nestedOptions.map((opt: any) => {
                                const fullValue = `${activeSubCategory.name} - ${opt.name}`;
                                const isSelected = selectedValue === fullValue;

                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.optionListItem,
                                            isSelected && styles.optionListItemSelected
                                        ]}
                                        onPress={() => handleLevel3Selection(activeSubCategory.name, opt.name)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                            {/* Image or Icon */}
                                            <View style={styles.optionListImageContainer}>
                                                {opt.image ? (
                                                    <Image source={{ uri: opt.image }} style={styles.optionListImage} />
                                                ) : (
                                                    <ImageIcon size={20} color={Colors.textSecondary} opacity={0.5} />
                                                )}
                                            </View>

                                            {/* Text */}
                                            <Text
                                                style={[
                                                    styles.optionListText,
                                                    isSelected && styles.optionListTextSelected
                                                ]}
                                            >
                                                {opt.name}
                                            </Text>
                                        </View>

                                        {/* Right Side: Radio/Check */}
                                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            );
        }

        // LEVEL 2: Viewing SubCategories (Standard)
        const options = activeCategory.subCategories || [];
        const selectedValue = state.currentOutfit.measurements?.[activeCategory.name]; // e.g., "Paan - Deep" or "Round"

        if (options.length === 0) return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>No options available for this category.</Text>
            </View>
        );

        return (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ gap: 12 }}>
                    {options.map((opt: any) => {
                        // Check if selected value STARTS with this option name (for composite values like "Paan - Deep")
                        // OR equals the option name directly (leaf node selection)
                        const isSelected = selectedValue && (selectedValue === opt.name || selectedValue.startsWith(opt.name + ' - '));
                        const hasChildren = opt.options && opt.options.length > 0;

                        return (
                            <TouchableOpacity
                                key={opt.id}
                                style={[
                                    styles.optionListItem,
                                    isSelected && styles.optionListItemSelected
                                ]}
                                onPress={() => handleOptionPress(opt)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                    {/* Image or Icon */}
                                    <View style={styles.optionListImageContainer}>
                                        {opt.image ? (
                                            <Image source={{ uri: opt.image }} style={styles.optionListImage} />
                                        ) : (
                                            <ImageIcon size={20} color={Colors.textSecondary} opacity={0.5} />
                                        )}
                                    </View>

                                    {/* Text */}
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.optionListText,
                                                isSelected && styles.optionListTextSelected
                                            ]}
                                        >
                                            {opt.name}
                                        </Text>
                                        {/* Show selected child if drill-down */}
                                        {isSelected && hasChildren && selectedValue.includes(' - ') && (
                                            <Text style={{ fontSize: 11, color: Colors.primary, fontFamily: 'Inter-Medium', marginTop: 2 }}>
                                                {selectedValue.split(' - ')[1]}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Right Side: Chevron or Check */}
                                {hasChildren ? (
                                    <ChevronRight size={18} color={Colors.textSecondary} />
                                ) : (
                                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    // If no categories, show empty state
    if (categories.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: Colors.textSecondary }}>No stitching options available for this outfit type.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F9FAFB' }}>
            {/* Sidebar */}
            <View style={styles.sidebarContainer}>
                <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
                    {categories.filter((c: any) => c.isVisible).map(renderSidebarItem)}
                </ScrollView>
            </View>

            {/* Content Area */}
            <View style={styles.contentContainer}>
                {renderOptionGrid()}
            </View>
        </View>
    );
};

const StepMeasurements = ({ state, onChange, outfits }: any) => {
    const [historyVisible, setHistoryVisible] = useState(false);
    const { updateCustomer } = useData();
    const { showToast } = useToast();

    // Use actual customer history or empty
    const historyData = state.selectedCustomer?.measurementHistory || [];

    // Filter by measurement type relevant to current outfit
    // Filter by measurement type relevant to current outfit
    const sortedHistory = historyData.filter((item: any) => item.type === state.currentOutfit.type);

    const applyHistory = (data: any) => {
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                measurements: { ...state.currentOutfit.measurements, ...data }
            }
        });
        setHistoryVisible(false);
    };

    const deleteHistoryItem = async (historyId: string) => {
        if (!state.selectedCustomer) return;

        Alert.alert(
            "Delete History",
            "Are you sure you want to delete this measurement entry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const currentHistory = state.selectedCustomer.measurementHistory || [];
                        const updatedHistory = currentHistory.filter((h: any) => h.id !== historyId);

                        try {
                            await updateCustomer(state.selectedCustomer.id, { measurementHistory: updatedHistory });
                            onChange({
                                selectedCustomer: { ...state.selectedCustomer, measurementHistory: updatedHistory }
                            });
                            showToast('History entry deleted', 'success');
                        } catch (e) {
                            console.error("Failed to delete history item", e);
                            showToast('Failed to delete history', 'error');
                        }
                    }
                }
            ]
        );
    };

    const updateMeasurement = (key: string, val: string) => {
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                measurements: { ...state.currentOutfit.measurements, [key]: val }
            }
        });
    };

    const toggleOptional = (key: string) => {
        const currentVal = state.currentOutfit.measurements?.[key] === 'Yes';
        updateMeasurement(key, currentVal ? '' : 'Yes');
    };

    // Measurement Configuration
    const SECTIONS = [
        {
            title: "Body",
            fields: ["Height", "Upper Chest", "Middle Chest", "Waist", "Hip"]
        },
        {
            title: "Shoulder & Neck",
            fields: ["Shoulder Back", "Shoulder Front", "Front Neck Depth", "Back Neck Depth"]
        },
        {
            title: "Sleeve",
            fields: ["Sleeve Length", "Sleeve Breadth"]
        },
        {
            title: "Others",
            fields: ["Arm Length", "Arm Round", "Points", "Slit", "Seat"]
        },
        {
            title: "Pant",
            fields: ["Pant Length", "Pant Breadth"]
        }
    ];

    const OPTIONAL_ITEMS = ["Piping", "Tassels", "Right-side Hook", "Saree Mudi"];

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 300, gap: 24 }} keyboardShouldPersistTaps="handled">

                {/* Header / History Link */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -8 }}>
                    <Text style={styles.sectionTitle}>Measurements</Text>
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#EFF6FF', // Light blue bg
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: '#BFDBFE',
                            gap: 6
                        }}
                        onPress={() => {
                            if (historyData.length > 0) {
                                setHistoryVisible(true);
                            } else {
                                Alert.alert('No History', 'No previous measurement history found for this customer.');
                            }
                        }}
                    >
                        <History size={14} color={Colors.primary} />
                        <Text style={{ color: Colors.primary, fontFamily: 'Inter-SemiBold', fontSize: 13 }}>
                            View History
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Auto-save Hint */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#ECFDF5',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    marginTop: 4,
                    marginBottom: 4
                }}>
                    <Info size={14} color={Colors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 12, color: '#047857', fontFamily: 'Inter-Medium', flex: 1 }}>
                        Measurements entered here will be saved to this customer's profile for future use.
                    </Text>
                </View>

                {/* Sections Loop */}
                {SECTIONS.map((section, idx) => (
                    <View key={idx}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                <Text style={{ color: 'white', fontSize: 12, fontFamily: 'Inter-Bold' }}>{idx + 1}</Text>
                            </View>
                            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.textPrimary }}>{section.title}</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB', marginLeft: 12 }} />
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {section.fields.map((m) => (
                                <View key={m} style={{ width: '48%' }}>
                                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>{m}</Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                        borderRadius: 8,
                                        backgroundColor: 'white',
                                        height: 44,
                                        paddingHorizontal: 12
                                    }}>
                                        <TextInput
                                            style={{ flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.textPrimary }}
                                            keyboardType="numeric"
                                            value={state.currentOutfit.measurements?.[m] || ''}
                                            onChangeText={(val) => updateMeasurement(m, val)}
                                        />
                                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.textSecondary }}>in</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Optional Section */}
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.textPrimary }}>Optional</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB', marginLeft: 12 }} />
                    </View>

                    <View style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 16
                    }}>
                        {OPTIONAL_ITEMS.map((item) => {
                            const isChecked = state.currentOutfit.measurements?.[item] === 'Yes';
                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={{
                                        width: '45%',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 10,
                                        opacity: 1 // Always fully opaque
                                    }}
                                    onPress={() => toggleOptional(item)}
                                >
                                    <View style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 6,
                                        borderWidth: 2,
                                        borderColor: isChecked ? Colors.primary : '#D1D5DB',
                                        backgroundColor: isChecked ? Colors.primary : 'white',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {isChecked && <Check size={16} color="white" strokeWidth={3} />}
                                    </View>
                                    <Text style={{
                                        fontFamily: isChecked ? 'Inter-SemiBold' : 'Inter-Medium',
                                        fontSize: 15,
                                        color: isChecked ? Colors.textPrimary : Colors.textSecondary
                                    }}>{item}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* History Bottom Sheet */}
            <Modal
                visible={historyVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setHistoryVisible(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => setHistoryVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{
                            backgroundColor: Colors.white,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingBottom: 40,
                            maxHeight: '60%',
                            width: '100%',
                            ...Shadow.large
                        }}
                    >
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                            <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 12 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary }}>Measurement History</Text>
                                <TouchableOpacity onPress={() => setHistoryVisible(false)} style={{ padding: 4 }}>
                                    <X size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ padding: 16 }}>
                            <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 }}>
                                <Text style={[styles.tableHeadText, { flex: 1 }]}>Date</Text>
                                <Text style={[styles.tableHeadText, { flex: 1 }]}>Type</Text>
                                <Text style={[styles.tableHeadText, { width: 60, textAlign: 'center' }]}>Action</Text>
                            </View>

                            <ScrollView style={{ maxHeight: 300 }}>
                                {sortedHistory.length > 0 ? (
                                    sortedHistory.map((item: any) => (
                                        <View key={item.id} style={styles.tableRow}>
                                            <View style={{ flex: 1.2 }}>
                                                <Text style={styles.tableCellDate}>{item.date}</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={styles.tableCellText}>{item.type}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <TouchableOpacity
                                                    style={{
                                                        padding: 8,
                                                        backgroundColor: '#FEF2F2',
                                                        borderRadius: 8,
                                                        borderWidth: 1,
                                                        borderColor: '#FEE2E2'
                                                    }}
                                                    onPress={() => deleteHistoryItem(item.id)}
                                                >
                                                    <Trash2 size={14} color={Colors.danger} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.applyBtn}
                                                    onPress={() => applyHistory(item.data)}
                                                >
                                                    <Text style={styles.applyBtnText}>Apply</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: Colors.textSecondary }}>No history available.</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};// --- New Components ---

const AudioPlayer = ({ uri, compact = false, onShowAlert }: { uri: string, compact?: boolean, onShowAlert?: (title: string, message: string) => void }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initial load and status subscription

    // Cleanup when sound changes
    useEffect(() => {
        return () => {
            sound?.unloadAsync();
        };
    }, [sound]);

    const playSound = async () => {
        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    // State update handled by listener, but optimistic update helps UI responsiveness
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true }
                );

                // Attach listener BEFORE setting state to ensure we catch updates
                newSound.setOnPlaybackStatusUpdate(async (status) => {
                    if (status.isLoaded) {
                        // Sync state with reality
                        setIsPlaying(status.isPlaying);

                        if (status.didJustFinish) {
                            setIsPlaying(false);
                            await newSound.stopAsync();
                            await newSound.setPositionAsync(0);
                        }
                    }
                });

                setSound(newSound);
                setIsPlaying(true);
            }
        } catch (error) {

            if (onShowAlert) onShowAlert("Error", "Could not play audio.");
        }
    };

    return (
        <TouchableOpacity
            onPress={playSound}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: compact ? '#ecfdf5' : '#e0e7ff',
                paddingVertical: compact ? 4 : 8,
                paddingHorizontal: compact ? 8 : 12,
                borderRadius: 20,
                alignSelf: 'flex-start',
                gap: 6
            }}
        >
            {isPlaying ? (
                <Pause size={compact ? 14 : 18} color={compact ? '#059669' : Colors.primary} fill={compact ? '#059669' : Colors.primary} />
            ) : (
                <Play size={compact ? 14 : 18} color={compact ? '#059669' : Colors.primary} fill={compact ? '#059669' : Colors.primary} />
            )}
            <Text style={{
                fontFamily: 'Inter-Medium',
                fontSize: compact ? 12 : 14,
                color: compact ? '#059669' : Colors.primary
            }}>
                {isPlaying ? 'Playing...' : 'Play Audio'}
            </Text>
        </TouchableOpacity>
    );
};

const StitchDetailsModal = ({ visible, title, content, onClose }: any) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.historyModalContent, { maxHeight: 400 }]} // Recycle history modal styles
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ padding: 16 }}>
                        {content && content.length > 0 ? (
                            content.map((line: string, i: number) => (
                                <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                                    <Text style={{ fontFamily: 'Inter-Medium', color: Colors.textPrimary, fontSize: 14 }}>{line}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: Colors.textSecondary }}>No specific measurements available.</Text>
                        )}
                    </ScrollView>
                    <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
                            <Text style={styles.primaryBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const Step3Media = ({ state, onChange, onShowAlert }: any) => {
    const insets = useSafeAreaInsets();
    const [viewerVisible, setViewerVisible] = useState(false);
    const [editorVisible, setEditorVisible] = useState(false);
    const [sketchModalVisible, setSketchModalVisible] = useState(false); // New Modal state
    const [penWidth, setPenWidth] = useState({ min: 2, max: 4 });
    const [penColor, setPenColor] = useState('#000000');
    const [editingSketchIndex, setEditingSketchIndex] = useState<number | null>(null);
    const [sketches, setSketches] = useState<string[]>([]);
    // Explicit UI doesn't need picker state
    const [initialSketchData, setInitialSketchData] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
    const signatureRef = useRef<any>(null);
    const { showToast } = useToast();
    // const canvasRef = useRef<any>(null); // Skia drawing temporarily disabled
    const [calendarVisible, setCalendarVisible] = useState(false);

    const handleDateSelect = (date: string) => {
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                deliveryDate: date
            }
        });
        setCalendarVisible(false); // Close after select (CalendarModal might handle close too but this is safe)
    };

    const pickImage = async () => {
        // 1. Multiple Selection Enabled (Editing disabled to allow multiple)
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

            if (onShowAlert) onShowAlert("Error", "Could not load image for editing");
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

            if (onShowAlert) onShowAlert("Error", "Could not save edit");
        }
    };
    /* DESIGN SKETCH LOGIC - Replacing Canvas with SignatureScreen */
    const handleSketchOK = async (signature: string) => {
        // signature is base64
        const path = FileSystem.cacheDirectory + `sketch_${Date.now()}.png`;
        try {
            // Strip the header to get raw base64
            const base64Code = signature.replace('data:image/png;base64,', '');
            await FileSystem.writeAsStringAsync(path, base64Code, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (editingSketchIndex !== null) {
                // Update existing
                const updatedSketches = [...(state.currentOutfit.sketches || [])];
                updatedSketches[editingSketchIndex] = path;
                onChange({
                    currentOutfit: {
                        ...state.currentOutfit,
                        sketches: updatedSketches
                    }
                });
                showToast('Sketch updated!', 'success');
            } else {
                // Add new
                const newSketches = [...(state.currentOutfit.sketches || []), path];
                onChange({
                    currentOutfit: {
                        ...state.currentOutfit,
                        sketches: newSketches
                    }
                });
                showToast('Sketch saved!', 'success');
            }

            setSketchModalVisible(false);
            setEditingSketchIndex(null); // Reset
            setInitialSketchData(null);
        } catch (error) {
            console.error('Error saving sketch:', error);
            Alert.alert('Error', 'Failed to save sketch');
        }
    };

    const handleEditSketch = async (uri: string, index: number) => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) {
                Alert.alert("Error", "Sketch file not found. It may have been deleted.");
                return;
            }
            // Read file to get base64
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            setInitialSketchData(`data:image/png;base64,${base64}`);
            setEditingSketchIndex(index);
            setSketchModalVisible(true);
        } catch (e) {
            console.error("Failed to load sketch for editing", e);
            Alert.alert("Error", "Could not load sketch for editing");
        }
    };

    const handleDeleteSketch = (index: number) => {
        const currentSketches = [...(state.currentOutfit.sketches || [])];
        currentSketches.splice(index, 1);
        onChange({
            currentOutfit: {
                ...state.currentOutfit,
                sketches: currentSketches,
                sketchUri: currentSketches.length > 0 ? currentSketches[currentSketches.length - 1] : undefined
            }
        });
    };

    const handleSketchClear = () => {
        signatureRef.current?.clearSignature();
    };

    const handleSketchUndo = () => {
        signatureRef.current?.undo();
    };

    const handleColorChange = (color: string) => {
        setPenColor(color);
        signatureRef.current?.changePenColor(color);
    };

    const handleWidthChange = (min: number, max: number) => {
        setPenWidth({ min, max });
        // Use component API if available to avoid reload
        if (signatureRef.current) {
            // @ts-ignore - method exists on wrapper but might not be in types
            if (typeof signatureRef.current.changePenSize === 'function') {
                // @ts-ignore
                signatureRef.current.changePenSize(min, max);
            } else {
                // Fallback to JS injection if wrapper method not found
                // This method might clear canvas depending on implementation, 
                // but it is the backup. 
                // The 'changePenSize' is standard in recent versions.
                const js = `
                    if (window.signaturePad) {
                        window.signaturePad.minWidth = ${min};
                        window.signaturePad.maxWidth = ${max};
                    }
                `;
                signatureRef.current.webview?.injectJavaScript(js);
            }
        }
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 16 }}>


            {/* Reference Images */}
            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.subLabel}>Reference Images</Text>
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

                    {/* Logic: If empty -> Big Box. If has images -> Small Add Button in Grid */}
                    {(!state.currentOutfit.images || state.currentOutfit.images.length === 0) ? (
                        <TouchableOpacity style={styles.emptyUploadBox} onPress={pickImage}>
                            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload size={28} color={Colors.primary} />
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.primary, fontSize: 15 }}>Click to Upload</Text>
                                <Text style={{ fontFamily: 'Inter-Regular', color: Colors.textSecondary, fontSize: 13, marginTop: 4 }}>Select multiple photos</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                            <Plus size={24} color={Colors.primary} />
                            <Text style={styles.addImageText}>Add</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Design Sketch Area - MOVED TO MODAL */}
            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.subLabel}>Design Sketch</Text>
                </View>

                {/* Sketch Gallery */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 12 }}>
                    {(state.currentOutfit.sketches || []).map((uri: string, index: number) => (
                        <View key={index} style={{ width: 120, height: 120, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', position: 'relative' }}>
                            <TouchableOpacity
                                style={{ width: 120, height: 120, borderRadius: 12, borderWidth: 1, borderColor: '#ccc', marginRight: 10, overflow: 'hidden', backgroundColor: '#fff' }}
                                onPress={() => handleEditSketch(uri, index)}
                            >
                                <Image
                                    source={{ uri }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="contain" // Changed to contain to show full sketch
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 4 }}
                                onPress={() => handleDeleteSketch(index)}
                            >
                                <Trash2 size={14} color={Colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Add New Sketch Button */}
                    <TouchableOpacity
                        style={{ width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}
                        onPress={() => {
                            setEditingSketchIndex(null);
                            setInitialSketchData(null);
                            setSketchModalVisible(true);
                        }}
                    >
                        <Pen size={32} color={Colors.primary} />
                        <Text style={{ marginTop: 8, fontFamily: 'Inter-Medium', color: Colors.primary, fontSize: 12 }}>Draw Sketch</Text>
                    </TouchableOpacity>
                </ScrollView>

                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
                    * Tap to open the full-screen drawing canvas.
                </Text>
            </View>

            {/* SKETCH MODAL */}
            <Modal visible={sketchModalVisible} animationType="slide" onRequestClose={() => setSketchModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setSketchModalVisible(false)} style={{ padding: 8 }}>
                            <X size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{editingSketchIndex !== null ? 'Edit Sketch' : 'New Sketch'}</Text>
                        <TouchableOpacity onPress={() => signatureRef.current?.readSignature()} style={{ padding: 8 }}>
                            <Check size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1, backgroundColor: '#fff', position: 'relative' }}>
                        <SignatureScreen
                            ref={signatureRef}
                            onOK={(sig) => {
                                handleSketchOK(sig);
                            }}
                            onEmpty={() => { }}
                            descriptionText="Sketch here"
                            clearText=""
                            confirmText=""
                            webStyle={`
                                .m-signature-pad--footer { display: none; margin: 0px; } 
                                body,html { width: 100%; height: 100%; background-color: #fff; }
                                .m-signature-pad { box-shadow: none; border: none; } 
                                .m-signature-pad--body { border: none; }
                            `}
                            autoClear={false}
                            imageType="image/png"
                            trimWhitespace={false}
                            dataURL={initialSketchData || undefined}
                        />

                        {/* EXPLICIT TOOLBAR (2 Rows) */}
                        <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 20) + 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 16 }}>

                            {/* Row 1: Tools (Colors & Sizes) */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Colors */}
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {['#000000', '#EF4444', '#3B82F6', '#10B981'].map(color => (
                                        <TouchableOpacity
                                            key={color}
                                            onPress={() => handleColorChange(color)}
                                            style={{
                                                width: 32, height: 32, borderRadius: 16, backgroundColor: color,
                                                borderWidth: penColor === color ? 3 : 1, borderColor: penColor === color ? '#e5e5e5' : '#fff',
                                                shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
                                                transform: [{ scale: penColor === color ? 1.1 : 1 }]
                                            }}
                                        />
                                    ))}
                                </View>

                                {/* Divider */}
                                <View style={{ width: 1, height: 24, backgroundColor: '#eee' }} />

                                {/* Sizes */}
                                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#F9FAFB', padding: 6, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' }}>
                                    <TouchableOpacity onPress={() => handleWidthChange(0.5, 2.5)} style={{ padding: 8, backgroundColor: penWidth.min === 0.5 ? '#fff' : 'transparent', borderRadius: 8, ...penWidth.min === 0.5 ? Shadow.subtle : {} }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'black', opacity: penWidth.min === 0.5 ? 1 : 0.3 }} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleWidthChange(4, 6)} style={{ padding: 8, backgroundColor: penWidth.min === 4 ? '#fff' : 'transparent', borderRadius: 8, ...penWidth.min === 4 ? Shadow.subtle : {} }}>
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'black', opacity: penWidth.min === 4 ? 1 : 0.3 }} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleWidthChange(10, 14)} style={{ padding: 8, backgroundColor: penWidth.min === 10 ? '#fff' : 'transparent', borderRadius: 8, ...penWidth.min === 10 ? Shadow.subtle : {} }}>
                                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'black', opacity: penWidth.min === 10 ? 1 : 0.3 }} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Row 2: Actions */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity onPress={handleSketchUndo} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                                        <Undo2 size={18} color={Colors.textPrimary} />
                                        <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: Colors.textPrimary }}>Undo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSketchClear} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                                        <Trash2 size={18} color={Colors.danger} />
                                        <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: Colors.danger }}>Clear</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={() => signatureRef.current?.readSignature()}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 8, ...Shadow.medium }}
                                >
                                    <Check size={18} color={Colors.white} />
                                    <Text style={{ fontSize: 14, fontFamily: 'Inter-SemiBold', color: Colors.white }}>Save Sketch</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Voice Note & Transcription Status */}
            {(state.currentOutfit.audioUri || state.currentOutfit.isTranscribing) && (
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={styles.subLabel}>Voice Note Attached</Text>
                        {state.currentOutfit.isTranscribing && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Transcribing...</Text>
                            </View>
                        )}
                    </View>

                    {/* Mini Player */}
                    {state.currentOutfit.audioUri && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8 }}>
                            <AudioPlayer uri={state.currentOutfit.audioUri} onShowAlert={onShowAlert} />
                            <TouchableOpacity
                                onPress={() => onChange({
                                    currentOutfit: { ...state.currentOutfit, audioUri: null, audioDuration: 0 }
                                })}
                            >
                                <Trash2 size={18} color={Colors.danger} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Notes / Audio Transcription */}
            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.subLabel}>Customer Notes</Text>
                </View>
                <TextInput
                    style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
                    multiline
                    placeholder="Add specific instructions, preferences, or details..."
                    value={state.currentOutfit.notes}
                    onChangeText={(val) => onChange({
                        currentOutfit: { ...state.currentOutfit, notes: val }
                    })}
                />
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                    * Dictated/Typed notes will appear in the Tailor Copy PDF.
                </Text>
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
                                onEmpty={() => { }}
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
        </ScrollView>
    );
};
const Step4Billing = ({ state, onChange, onAddAnother, onDeleteItem, confirmDeleteItem, onEditItem, onShowAlert, onGoToStep, editItemIndex, editOrderId }: any) => {
    // Merge cart and current item for unified display logic
    const currentItem = { ...state.currentOutfit, id: 'current', isCurrent: true };
    const allItems = [...state.cart.map((i: any, idx: number) => ({ ...i, cartIndex: idx, isCurrent: false }))]
        .filter((item) => item.cartIndex !== editItemIndex); // Filter out the item being edited to avoid duplication
    // Only show currentItem if it has a Type
    if (state.currentOutfit.type) {
        allItems.push(currentItem);
    }

    const [linkModal, setLinkModal] = useState({ visible: false, title: '', content: [] as string[] });
    const [expandedIndex, setExpandedIndex] = useState<number | null>(allItems.length > 0 ? allItems.length - 1 : 0); // Initialize LAST item as expanded

    // Date Logic Helper
    const getDaysRemaining = (dateString: string | undefined) => {
        if (!dateString) return 999;
        try {
            const targetDate = parseDate(dateString);
            if (isNaN(targetDate.getTime())) return 999;

            const today = new Date();
            targetDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            const diffTime = targetDate.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch {
            return 999;
        }
    };

    const calculateTotal = () => {
        const cartTotal = state.cart.reduce((sum: number, item: any, index: number) => {
            // If we are currently editing this item (and it's in the cart), don't count it from the cart
            // because it's being counted via state.currentOutfit below.
            if (index === editItemIndex) return sum;
            // Exclude cancelled items from total
            if (item.status === 'Cancelled') return sum;
            return sum + (Number(item.totalCost) || 0);
        }, 0);
        const currentTotal = (state.currentOutfit.status === 'Cancelled') ? 0 : (Number(state.currentOutfit.totalCost) || 0);
        return cartTotal + currentTotal;
    };

    const total = calculateTotal();
    const balance = total - (Number(state.advance) || 0);

    const toggleAccordion = (index: number | null) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const stepTitles = [
        "Outfit Details",
        "Stitching & Measurements",
        "Photos & Notes",
        "Payment summary"
    ];

    const updateItemCost = (item: any, newCost: string) => {
        const cost = parseFloat(newCost) || 0;
        if (item.isCurrent) {
            onChange({ currentOutfit: { ...state.currentOutfit, totalCost: cost } });
        } else {
            const newCart = [...state.cart];
            newCart[item.cartIndex] = { ...newCart[item.cartIndex], totalCost: cost };
            onChange({ cart: newCart });
        }
    };

    const getSelectedOptions = (measurements: any) => {
        if (!measurements) return [];
        return Object.entries(measurements)
            .filter(([key, val]) => isNaN(Number(val)) && typeof val === 'string' && val.length > 0)
            .map(([key, val]) => `${key}: ${val}`);
    };

    // --- Styles for Price Input ---
    // Fix for "Number not visible fully"
    const priceInputStyle: any = {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        borderWidth: 1,
        borderColor: Colors.border,
        width: 120
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 16 }}>

            {/* Accordion List */}
            {allItems.map((item: any, index: number) => {
                const stitchOptions = getSelectedOptions(item.measurements);
                const isExpanded = expandedIndex === index;

                const deliveryDate = item.deliveryDate || state.deliveryDate;
                const daysLeft = getDaysRemaining(deliveryDate);
                const isUrgent = (state.urgency === 'Urgent' || state.urgency === 'Emergency' || item.urgency === 'Urgent' || item.urgency === 'High');
                // Days Left <= 3 and positive
                const isNearing = daysLeft <= 3 && daysLeft >= 0;

                return (
                    <View key={index} style={{
                        backgroundColor: isNearing ? '#FEF2F2' : Colors.white,
                        borderRadius: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: isNearing ? '#FECACA' : Colors.border,
                        overflow: 'hidden',
                        ...Shadow.subtle
                    }}>
                        {/* Card Header (Click to Expand logic moved to internal view to allow buttons to work? No, entire card can toggle, but buttons stop prop) */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => toggleAccordion(index)}
                            style={{ padding: 16 }}
                        >
                            {/* Top Row: Name and Price */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary }}>{item.type}</Text>
                                    {item.isCurrent && (!item.id || item.id.toString().startsWith('current_')) && (
                                        <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 10, color: '#166534', fontFamily: 'Inter-Bold' }}>NEW</Text>
                                        </View>
                                    )}

                                    <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: Colors.textSecondary }}>x{item.quantity || 1}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary }}>₹{item.totalCost || 0}</Text>
                                    <ChevronRight
                                        size={20}
                                        color={Colors.textSecondary}
                                        style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                                    />
                                </View>
                            </View>

                            {/* Middle Row: Delivery Date (Prominent) */}
                            {deliveryDate && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: isUrgent ? 12 : 0 }}>
                                    <View style={{
                                        backgroundColor: isNearing ? '#FEE2E2' : '#EFF6FF',
                                        padding: 8,
                                        borderRadius: 8
                                    }}>
                                        <Calendar size={18} color={isNearing ? Colors.danger : Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.textSecondary, marginBottom: 2 }}>Expected Delivery</Text>
                                        <Text style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter-Bold',
                                            color: isNearing ? Colors.danger : Colors.textPrimary
                                        }}>
                                            {formatDate(deliveryDate)}
                                            {isNearing && daysLeft >= 0 && (
                                                <Text style={{ color: Colors.danger, fontSize: 14 }}>  ({daysLeft === 0 ? 'Today' : `${daysLeft}d left`})</Text>
                                            )}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Urgency Badge */}
                            {isUrgent && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', alignSelf: 'flex-start' }}>
                                    <Flame size={14} color={Colors.danger} fill={Colors.danger} />
                                    <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: Colors.danger, textTransform: 'uppercase' }}>Urgent</Text>
                                </View>
                            )}

                        </TouchableOpacity>

                        {/* Card Content (Visible when Expanded) */}
                        {isExpanded && (
                            <View style={styles.accordionContent}>
                                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 }} />

                                {/* Falls & Lining Section */}
                                {/* Cost Breakdown Section (UX Enhanced) */}
                                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 13, fontFamily: 'Inter-SemiBold', color: Colors.textSecondary, flex: 1 }}>Service</Text>
                                        <Text style={{ fontSize: 13, fontFamily: 'Inter-SemiBold', color: Colors.textSecondary, width: 100, textAlign: 'center' }}>Amount (₹)</Text>
                                    </View>

                                    {/* Stitching Cost */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 14, color: Colors.textPrimary, fontFamily: 'Inter-Medium', flex: 1 }}>Stitching</Text>
                                        <View style={priceInputStyle}>
                                            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginRight: 2 }}>₹</Text>
                                            <TextInput
                                                style={{ flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary, textAlign: 'center', paddingRight: 4, height: '100%' }}
                                                value={item.stitchingCost?.toString()}
                                                onChangeText={(val) => {
                                                    const sCost = parseFloat(val) || 0;
                                                    const fCost = item.fallsCost || 0;
                                                    const lCost = item.liningCost || 0;
                                                    const newTotal = sCost + fCost + lCost;

                                                    if (item.isCurrent) {
                                                        onChange({
                                                            currentOutfit: {
                                                                ...state.currentOutfit,
                                                                stitchingCost: sCost,
                                                                totalCost: newTotal
                                                            }
                                                        });
                                                    } else {
                                                        const newCart = [...state.cart];
                                                        newCart[item.cartIndex] = {
                                                            ...newCart[item.cartIndex],
                                                            stitchingCost: sCost,
                                                            totalCost: newTotal
                                                        };
                                                        onChange({ cart: newCart });
                                                    }
                                                }}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={Colors.textSecondary}
                                            />
                                        </View>
                                    </View>

                                    {/* Lining Cost */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 14, color: Colors.textPrimary, fontFamily: 'Inter-Medium', flex: 1 }}>Lining</Text>
                                        <View style={priceInputStyle}>
                                            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginRight: 2 }}>₹</Text>
                                            <TextInput
                                                style={{ flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary, textAlign: 'center', paddingRight: 4, height: '100%' }}
                                                value={item.liningCost?.toString()}
                                                onChangeText={(val) => {
                                                    const lCost = parseFloat(val) || 0;
                                                    const sCost = item.stitchingCost || 0;
                                                    const fCost = item.fallsCost || 0;
                                                    const newTotal = sCost + fCost + lCost;

                                                    if (item.isCurrent) {
                                                        onChange({
                                                            currentOutfit: {
                                                                ...state.currentOutfit,
                                                                liningCost: lCost,
                                                                lining: lCost > 0, // Auto-enable constraint if needed, or just track cost
                                                                totalCost: newTotal
                                                            }
                                                        });
                                                    } else {
                                                        const newCart = [...state.cart];
                                                        newCart[item.cartIndex] = {
                                                            ...newCart[item.cartIndex],
                                                            liningCost: lCost,
                                                            lining: lCost > 0,
                                                            totalCost: newTotal
                                                        };
                                                        onChange({ cart: newCart });
                                                    }
                                                }}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={Colors.textSecondary}
                                            />
                                        </View>
                                    </View>

                                    {/* Falls Cost */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 14, color: Colors.textPrimary, fontFamily: 'Inter-Medium', flex: 1 }}>Falls</Text>
                                        <View style={priceInputStyle}>
                                            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginRight: 2 }}>₹</Text>
                                            <TextInput
                                                style={{ flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.textPrimary, textAlign: 'center', paddingRight: 4, height: '100%' }}
                                                value={item.fallsCost?.toString()}
                                                onChangeText={(val) => {
                                                    const fCost = parseFloat(val) || 0;
                                                    const sCost = item.stitchingCost || 0;
                                                    const lCost = item.liningCost || 0;
                                                    const newTotal = sCost + fCost + lCost;

                                                    if (item.isCurrent) {
                                                        onChange({
                                                            currentOutfit: {
                                                                ...state.currentOutfit,
                                                                fallsCost: fCost,
                                                                falls: fCost > 0,
                                                                totalCost: newTotal
                                                            }
                                                        });
                                                    } else {
                                                        const newCart = [...state.cart];
                                                        newCart[item.cartIndex] = {
                                                            ...newCart[item.cartIndex],
                                                            fallsCost: fCost,
                                                            falls: fCost > 0,
                                                            totalCost: newTotal
                                                        };
                                                        onChange({ cart: newCart });
                                                    }
                                                }}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={Colors.textSecondary}
                                            />
                                        </View>
                                    </View>

                                    {/* Divider */}
                                    <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />

                                    {/* Total Item Cost */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 15, color: Colors.textPrimary, fontFamily: 'Inter-Bold' }}>Total Item Price</Text>
                                        <Text style={{ fontSize: 16, color: Colors.primary, fontFamily: 'Inter-Bold' }}>₹{item.totalCost || 0}</Text>
                                    </View>
                                </View>


                                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View>
                                            {item.audioUri ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <AudioPlayer uri={item.audioUri} compact onShowAlert={onShowAlert} />
                                                </View>
                                            ) : (
                                                <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter-Regular' }}>No audio note</Text>
                                            )}
                                        </View>
                                        {item.sketchUri && (
                                            <View style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#F3F4F6', overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
                                                <Image source={{ uri: item.sketchUri }} style={{ flex: 1 }} resizeMode="contain" />
                                            </View>
                                        )}
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {/* Delete Icon Logic */}
                                            {/* Hide if Edit Mode AND Item is Existing (from DB) */}
                                            {/* Show if New Order OR (Edit Mode AND Item is New/Local) */}
                                            {(!editOrderId || !item.isExisting) && (
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                                    onPress={() => item.isCurrent ? onChange({ currentOutfit: { ...state.currentOutfit, type: '', quantity: 1, measurements: {}, images: [], notes: '', audioUri: null, totalCost: 0 } }) : confirmDeleteItem(item.cartIndex)}
                                                >
                                                    <Trash2 size={16} color={Colors.danger} />
                                                    <Text style={{ fontSize: 13, color: Colors.danger, fontFamily: 'Inter-SemiBold' }}>Delete</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 16 }}
                                                onPress={() => item.isCurrent ? onGoToStep(0) : onEditItem(item.cartIndex)}
                                            >
                                                <Edit2 size={16} color={Colors.primary} />
                                                <Text style={{ fontSize: 13, color: Colors.primary, fontFamily: 'Inter-SemiBold' }}>Edit</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                );
            })}

            {/* Add Another Outfit Button */}
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: Colors.primary,
                    borderRadius: 8,
                    borderStyle: 'dashed',
                    marginBottom: 16,
                    backgroundColor: '#F0FDF4'
                }}
                onPress={onAddAnother}
            >
                <Plus size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ color: Colors.primary, fontFamily: 'Inter-SemiBold', fontSize: 14 }}>Add Another Outfit</Text>
            </TouchableOpacity>


            {/* Advance Payment Section */}
            <View style={{ marginBottom: 16, marginTop: 10 }}>
                {Number(state.existingAdvance) > 0 && (
                    <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#ECFDF5', borderRadius: 10, borderWidth: 1, borderColor: '#6EE7B7' }}>
                        <Text style={{ fontFamily: 'Inter-Medium', color: '#047857', fontSize: 13 }}>Previously Paid</Text>
                        <Text style={{ fontFamily: 'Inter-Bold', color: '#065F46', fontSize: 18 }}>₹{state.existingAdvance}</Text>
                    </View>
                )}

                <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>
                    {Number(state.existingAdvance) > 0 ? "Add Payment" : "Advance Payment"}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Payment Mode Toggle */}
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: '#F3F4F6',
                        borderRadius: 8,
                        padding: 4,
                        marginRight: 12,
                        height: 48,
                        alignItems: 'center'
                    }}>
                        <TouchableOpacity
                            onPress={() => onChange({ paymentMode: 'Cash' })}
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                backgroundColor: (!state.paymentMode || state.paymentMode === 'Cash') ? Colors.primary : 'transparent',
                                borderRadius: 6,
                                height: 40,
                                justifyContent: 'center'
                            }}
                        >
                            <Text style={{
                                fontFamily: 'Inter-SemiBold',
                                color: (!state.paymentMode || state.paymentMode === 'Cash') ? Colors.white : Colors.textSecondary,
                                fontSize: 13
                            }}>Cash</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onChange({ paymentMode: 'UPI' })}
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                backgroundColor: (state.paymentMode === 'UPI' || state.paymentMode === 'Online') ? Colors.primary : 'transparent',
                                borderRadius: 6,
                                height: 40,
                                justifyContent: 'center'
                            }}
                        >
                            <Text style={{
                                fontFamily: 'Inter-SemiBold',
                                color: (state.paymentMode === 'UPI' || state.paymentMode === 'Online') ? Colors.white : Colors.textSecondary,
                                fontSize: 13
                            }}>UPI</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Input */}
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        height: 48,
                        backgroundColor: Colors.white
                    }}>
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.textSecondary, marginRight: 8, fontSize: 16 }}>₹</Text>
                        <TextInput
                            style={{ flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.textPrimary }}
                            placeholder="0"
                            placeholderTextColor={Colors.textSecondary}
                            keyboardType="numeric"
                            value={state.paymentInput} // Bind to paymentInput
                            onChangeText={(t) => onChange({ paymentInput: t })} // Update paymentInput
                        />
                    </View>
                </View>
            </View>

            {/* Grand Total Section */}
            <View style={{ marginTop: 8, padding: 18, backgroundColor: Colors.primary + '08', borderRadius: 16, borderWidth: 1, borderColor: Colors.primary + '15' }}>
                <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.textSecondary, fontSize: 14 }}>Subtotal</Text>
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.textPrimary, fontSize: 16 }}>₹{total}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.textSecondary, fontSize: 14 }}>Advance Paid</Text>
                        {/* Show Total Advance (Existing + New Input) */}
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.success, fontSize: 16 }}>- ₹{(Number(state.existingAdvance) || 0) + (Number(state.paymentInput) || 0)}</Text>
                    </View>

                    <View style={{ height: 1, backgroundColor: Colors.primary + '20', marginVertical: 4 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 18, color: Colors.textPrimary }}>Total Balance</Text>
                            <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter-SemiBold', marginTop: 2 }}>To be collected on delivery</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 26, color: Colors.primary }}>₹{(total - ((Number(state.existingAdvance) || 0) + (Number(state.paymentInput) || 0))).toFixed(0)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Reused Modal for Stitch Details */}
            <StitchDetailsModal
                visible={linkModal.visible}
                title={linkModal.title}
                content={linkModal.content}
                onClose={() => setLinkModal({ ...linkModal, visible: false })}
            />
        </ScrollView >
    );
};

// ... existing code ...

const Step4BillingWrapper = ({ state, onChange, onAddAnother, onDeleteItem, confirmDeleteItem, onEditItem, onShowAlert, onGoToStep, editItemIndex }: any) => {
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <Step4Billing state={state} onChange={onChange} onAddAnother={onAddAnother} onDeleteItem={onDeleteItem} confirmDeleteItem={confirmDeleteItem} onEditItem={onEditItem} onShowAlert={onShowAlert} onGoToStep={onGoToStep} editItemIndex={editItemIndex} editOrderId={editOrderId} />
        </KeyboardAvoidingView>
    );
};


const FloatingAudioRecorder = ({ onRecordingComplete, onShowAlert }: { onRecordingComplete?: (uri: string, duration: number) => void, onShowAlert?: (title: string, message: string) => void }) => {
    const navigation = useNavigation<any>();
    const { showToast } = useToast();
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [duration, setDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Permission check
    useEffect(() => {
        (async () => {
            await Audio.requestPermissionsAsync();
        })();
    }, []);

    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsExpanded(true);

            // Start Timer
            setDuration(0);
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording', err);
            if (onShowAlert) onShowAlert("Permission Error", "Could not start recording.");
        }
    }

    const stopRecording = async () => {
        if (!recording) return;
        try {
            setRecording(null);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setIsExpanded(false);
            if (uri) {
                showToast("Audio memo saved!", "success");
                if (onRecordingComplete) onRecordingComplete(uri, duration);
            }
        } catch (e) {
            // Silent error handling for navigation abort
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    if (!isExpanded) {
        return (
            <TouchableOpacity style={styles.floatingMicBtn} onPress={startRecording}>
                <Mic size={24} color="white" />
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.floatingRecorderExpanded}>
            <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontFamily: 'Inter-SemiBold' }}>Recording...</Text>
                <Text style={{ color: 'white', opacity: 0.8 }}>{formatTime(duration)}</Text>
            </View>
            <TouchableOpacity onPress={stopRecording} style={{ padding: 8 }}>
                <Square size={20} color="white" fill="white" />
            </TouchableOpacity>
        </View>
    );
};

const CreateOrderFlowScreen = ({ navigation, route }: any) => {
    const { customers, outfits, addOrder, updateOrder, addPayment, addCustomer, updateCustomer, orders } = useData();
    const { user, company } = useAuth();
    const { showToast } = useToast();

    const editOrderId = route.params?.editOrderId;
    // Define editItemIndex here at the top
    const editItemIndex = route.params?.editItemIndex;

    // State
    const [currentStep, setCurrentStep] = useState(0);
    const [state, setState] = useState<any>({
        customerName: '',
        customerMobile: '',
        selectedCustomer: null,
        trialDate: null,
        deliveryDate: null,
        urgency: 'Normal', // Normal, Urgent
        orderType: 'Stitching', // Stitching, Alteration

        // Cart and Current Item
        cart: [],
        currentOutfit: {
            id: '1',
            type: '',
            quantity: 1,
            measurements: {},
            images: [],
            notes: '',
            audioUri: null,
            fabricSource: 'Customer',
            totalCost: 0
        },

        paymentMode: 'Cash',
        advance: ''
    });

    // EFFECT: Set default outfit to first visible if "Blouse" (default) is hidden
    useEffect(() => {
        if (outfits.length > 0) {
            const visibleOutfits = outfits.filter((o: any) => o.isVisible !== false);
            const firstVisible = visibleOutfits[0]?.name;

            // If current type is not in visible list, or is strictly default 'Blouse' but Blouse is hidden
            const currentIsVisible = visibleOutfits.find((o: any) => o.name === state.currentOutfit.type);

            if (!currentIsVisible && firstVisible) {
                setState((prev: any) => ({
                    ...prev,
                    currentOutfit: {
                        ...prev.currentOutfit,
                        type: firstVisible
                    }
                }));
            }
        }
    }, [outfits]);

    const [alert, setAlert] = useState<{ visible: boolean, title: string, message: string, type: 'info' | 'success' | 'error' | 'warning', onConfirm?: () => void }>({ visible: false, title: '', message: '', type: 'info', onConfirm: undefined });
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [discardDrawerVisible, setDiscardDrawerVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<any>(null);
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    // Delete Confirmation State
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
    const [deleteSheetConfig, setDeleteSheetConfig] = useState({
        title: "Delete Item",
        description: "Are you sure you want to delete this item?",
        confirmText: "Delete",
        isDiscard: false
    });
    const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');

    const handlePrintOrder = async () => {
        if (!createdOrder) return;

        try {
            // Use the authoritative company profile if available, otherwise fallback to user details
            const companyData = company ? {
                name: company.name,
                address: company.address,
                phone: company.phone,
                gstin: company.gstin,
                email: company.email
            } : {
                name: user?.boutiqueName || user?.name || 'My Boutique',
                address: user?.address || 'Your Address Here',
                phone: user?.mobile || user?.phone || 'Your Phone Here',
                gstin: user?.gstin || ''
            };
            // Enrich Order with Customer Display ID
            const customer = customers.find(c => c.id === createdOrder.customerId);
            const enrichedOrder = {
                ...createdOrder,
                customerDisplayId: customer?.displayId
            };

            const html = getCustomerCopyHTML(enrichedOrder, companyData);
            setPreviewHtml(html);
            setPreviewVisible(true);
        } catch (error) {

            showAlert('Error', 'Could not generate preview.');
        }
    };

    const handleActualPrint = async () => {
        try {
            await printHTML(previewHtml);
        } catch (error) {
            showAlert('Error', 'Failed to print PDF');
        }
    };

    const handleActualShare = async () => {
        if (!createdOrder) return;
        try {
            const companyData = {
                name: user?.boutiqueName || user?.name || 'My Boutique',
                address: user?.address || 'Your Address Here',
                phone: user?.mobile || user?.phone || 'Your Phone Here',
                gstin: user?.gstin || ''
            };

            // Enrich Order with Customer Display ID
            const customer = customers.find(c => c.id === createdOrder.customerId);
            const enrichedOrder = {
                ...createdOrder,
                customerDisplayId: customer?.displayId
            };

            await generateCustomerCopyPDF(enrichedOrder, companyData);
        } catch (error) {
            showAlert('Error', 'Failed to share PDF');
        }
    };

    const handleConfirmDelete = () => {
        if (itemToDeleteIndex !== null) {
            handleDeleteItem(itemToDeleteIndex);
            setDeleteSheetVisible(false);
            setItemToDeleteIndex(null);
        }
    };

    const confirmDeleteItem = (index: number) => {
        // Check if this is the last item (New Order mode only)
        const newCart = state.cart;
        // Total active items = cart length + currentOutfit (if active)
        // Actually, if we are in Step 4, we see a list.
        // If we delete an item, checks remaining.
        // If cart has 1 item and no current outfit, it's the last one.
        const isLastItem = newCart.length === 1 && !state.currentOutfit.type;

        if (isLastItem && !editOrderId) {
            setItemToDeleteIndex(index);
            // Change sheet content dynamically
            // Requires state for Sheet Title/Desc or passing it
            // Assuming Sheet uses hardcoded props in render? 
            // We need to update the state variable for the sheet? 
            // Or use a state object for sheet config.

            // Let's create a temp state for sheet config if not exists
            setDeleteSheetVisible(true);
            return;
        }

        setItemToDeleteIndex(index);
        setDeleteSheetVisible(true);
    };

    // Exit Warning Logic
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            // If we are just navigating between steps in the stack (internal), don't block?
            // React Navigation 'beforeRemove' is triggered only when "leaving" the screen (pop).

            // Check if we have unsaved changes
            const hasItems = state.cart.length > 0;
            // Check if current outfit has ANY modified data (type is default 'Blouse', but check if other fields have data)
            const hasData = (state.currentOutfit.type !== 'Blouse') ||
                (Object.keys(state.currentOutfit.measurements || {}).length > 0) ||
                !!state.currentOutfit.notes ||
                (state.currentOutfit.images && state.currentOutfit.images.length > 0);

            // If we are on Step 0 and everything is empty, don't block
            if (!hasItems && !hasData && !loading) {
                return;
            }

            // If success modal is visible, safe to leave (order created)
            if (successModalVisible) {
                return;
            }

            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // Set pending action and show the drawer
            setPendingAction(e.data.action);
            setDiscardDrawerVisible(true);
        });

        return unsubscribe;
    }, [navigation, state.cart, state.currentOutfit, successModalVisible, loading]);



    useEffect(() => {
        // Configure Audio for playback and recording
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
            } catch (e) {
                console.error("Audio config error:", e);
            }
        };
        configureAudio();
    }, []);

    const initializedOrderId = useRef<string | null>(null);

    useEffect(() => {
        if (editOrderId && orders.length > 0) {
            // Guard: Prevent re-initialization if already loaded for this order ID
            // This prevents overwriting local state (cart modifications, etc.) 
            // when navigation params (like editItemIndex) change.
            if (initializedOrderId.current === editOrderId) {
                return;
            }

            const order = orders.find(o => o.id === editOrderId);
            if (order) {
                // Determine items to load into cart
                // Fix: Normalize BOTH outfits and items to ensure defaults (like fabricSource) are always present
                const sourceItems = order.outfits || order.items || [];
                const initialCart = sourceItems.map((it: any) => ({
                    ...it, // Keep existing props
                    id: it.id || Date.now().toString() + Math.random(),
                    type: it.type || it.name || 'Blouse',
                    quantity: it.quantity || it.qty || 1,
                    measurements: it.measurements || {},
                    images: it.images || [],
                    notes: it.description || it.notes || '',
                    audioUri: it.audioUri || null,
                    fabricSource: it.fabricSource || 'Customer',
                    totalCost: it.totalCost || it.rate || it.amount || 0,
                    // Fix: Persist existing item date/urgency, fallback to order values
                    deliveryDate: it.deliveryDate || order.deliveryDate,
                    trialDate: it.trialDate || order.trialDate,
                    urgency: it.urgency || (order as any).urgency || 'Normal',
                    isExisting: true // Mark as existing from DB
                }));

                const selectedCust = customers.find(c => c.id === order.customerId) || null;

                // Handle item editing specifically if index is passed
                let itemToEdit = null;
                if (editItemIndex !== undefined && editItemIndex >= 0 && editItemIndex < initialCart.length) {
                    itemToEdit = initialCart[editItemIndex];
                }

                setState({
                    customerName: order.customerName || '',
                    customerMobile: order.customerMobile || '',
                    selectedCustomer: selectedCust,
                    // Fix: Prioritize item-level dates and urgency when editing
                    trialDate: itemToEdit ? (itemToEdit.trialDate || null) : null,
                    deliveryDate: itemToEdit ? (itemToEdit.deliveryDate || null) : null,
                    urgency: itemToEdit ? (itemToEdit.urgency || 'Normal') : ((order as any).urgency || 'Normal'),
                    orderType: itemToEdit ? (itemToEdit.orderType || (order as any).orderType || 'Stitching') : ((order as any).orderType || 'Stitching'),
                    cart: initialCart,
                    // If editing an item, pre-fill currentOutfit with that item's data
                    // Otherwise start fresh
                    currentOutfit: itemToEdit ? { ...itemToEdit } : {
                        id: 'current_' + Date.now(),
                        type: 'Blouse',
                        quantity: 1,
                        measurements: {},
                        images: [],
                        notes: '',
                        audioUri: null,
                        fabricSource: 'Customer',
                        totalCost: 0
                    },
                    advance: order.advance?.toString() || '',
                    existingAdvance: order.advance || 0, // Store existing advance from DB
                    paymentInput: '', // Input is empty for adding NEW payment
                    paymentMode: (order as any).advanceMode || (order as any).paymentMode || 'Cash'
                });

                initializedOrderId.current = editOrderId;
            }
        }
    }, [editOrderId, orders.length, editItemIndex]);

    // Handlers
    const updateState = (updates: any) => setState((prev: any) => ({ ...prev, ...updates }));

    const showAlert = (title: string, message: string) => setAlert({ visible: true, title, message, type: 'info', onConfirm: undefined });

    const validateStep = (step: number) => {
        if (step === 0) {
            if (!state.selectedCustomer && !state.customerName) {
                showToast('Please select a customer', 'warning');
                return false;
            }
            if (!state.currentOutfit.type) {
                showToast('Please select an outfit type', 'warning');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 4) setCurrentStep(c => c + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
        else navigation.goBack();
    };

    const saveMeasurementHistory = async (outfit: any) => {
        if (!state.selectedCustomer || !outfit.measurements || Object.keys(outfit.measurements).length === 0) return;

        // Filter out empty values
        const validMeasurements = Object.fromEntries(
            Object.entries(outfit.measurements).filter(([_, v]) => v && String(v).trim() !== '')
        );

        if (Object.keys(validMeasurements).length === 0) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const newHistoryItem: MeasurementHistoryItem = {
            id: Date.now().toString(),
            date: `${dateStr}, ${timeStr}`,
            type: outfit.type,
            data: validMeasurements as MeasurementProfile,
            timestamp: now.getTime()
        };

        const currentHistory = state.selectedCustomer.measurementHistory || [];

        // Check against latest history entry for this outfit type
        const latestEntry = currentHistory.find((h: any) => h.type === outfit.type);
        if (latestEntry) {
            const newKeys = Object.keys(validMeasurements);
            const oldKeys = Object.keys(latestEntry.data || {});

            if (newKeys.length === oldKeys.length) {
                const isIdentical = newKeys.every(key => validMeasurements[key] === latestEntry.data[key]);
                if (isIdentical) {
                    console.log("Measurements identical to last history. Skipping save.");
                    return;
                }
            }
        }

        const updatedHistory = [newHistoryItem, ...currentHistory];

        try {
            // Update Backend
            await updateCustomer(state.selectedCustomer.id, { measurementHistory: updatedHistory });

            // Update Local State
            updateState({
                selectedCustomer: { ...state.selectedCustomer, measurementHistory: updatedHistory }
            });
        } catch (e) {
            console.error("Failed to save measurement history", e);
        }
    };


    const handleAddAnother = async () => {
        // Auto-save measurements to history
        await saveMeasurementHistory(state.currentOutfit);

        // EDIT MODE: If we are editing a specific item index, update it directly
        if (editItemIndex !== undefined && editItemIndex !== null && editItemIndex >= 0) {
            const newCart = [...state.cart];
            newCart[editItemIndex] = {
                ...state.currentOutfit,
                // Ensure we keep the original ID if valid
                id: state.currentOutfit.id || newCart[editItemIndex].id
            };

            updateState({ cart: newCart });

            // Clear the edit param so subsequent adds are new items? 
            // In this flow, usually 'Add Another' means 'Save & Close' or 'Save & Add New'.
            // Given the UI, this acts as "Save Current Item".
            // We should probably clear the route param or handle navigation, but modifying the cart is the key fix.
            navigation.setParams({ editItemIndex: undefined });
        }
        else {
            // NORMAL ADD MODE
            // Smart Grouping Logic
            // Check if an identical item exists in the cart (Type, Measurements, Notes)
            const cartIndex = state.cart.findIndex((item: any) => {
                const isTypeMatch = item.type === state.currentOutfit.type;
                const isMeasurementsMatch = JSON.stringify(item.measurements) === JSON.stringify(state.currentOutfit.measurements);
                const isNotesMatch = (item.notes || '').trim() === (state.currentOutfit.notes || '').trim();
                // We ignore images/audio for grouping? User said "measurements and stitching options". 
                // Let's be strict: if notes differ, it's different.

                return isTypeMatch && isMeasurementsMatch && isNotesMatch;
            });

            if (cartIndex !== -1) {
                // Match found! Increment quantity
                const newCart = [...state.cart];
                newCart[cartIndex].quantity += (state.currentOutfit.quantity || 1);
                // Update total cost? Usually rate * qty. 
                // If rate is per item, we should sum it up.
                // Assuming totalCost held the total for that row.
                // Let's verify how totalCost is calculated. If it's manual input, we differ.
                // If manual price input, we probably shouldn't merge automatically if prices differ?
                // "if all options are same". Price is usually derived or same.
                // Let's assume price per unit is `item.totalCost / item.quantity`.
                // User manually inputs "Total Price" for the row in Step 4.
                // If merging, we should probably add the costs?
                // "Price" input in UI is for the row.

                // Safer to just add the cost of currentOutfit to the existing item's cost
                newCart[cartIndex].totalCost = (Number(newCart[cartIndex].totalCost) || 0) + (Number(state.currentOutfit.totalCost) || 0);

                updateState({ cart: newCart });
            } else {
                // No match, add as new item
                const cartItem = {
                    ...state.currentOutfit,
                    // Preserve ID if it exists and is not a temp "current_" ID (meaning it's an existing item from DB)
                    // Otherwise generate a new temp ID
                    id: (state.currentOutfit.id && !state.currentOutfit.id.startsWith('current_'))
                        ? state.currentOutfit.id
                        : Date.now().toString(),
                    // Fix: Explicitly save the current selected date to this item
                    deliveryDate: state.deliveryDate,
                };
                updateState({
                    cart: [...state.cart, cartItem],
                });
            }
        }

        // Reset current outfit
        const newOutfit = {
            id: `current_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: outfits.filter((o: any) => o.isVisible !== false)[0]?.name || 'Blouse',
            quantity: 1,
            measurements: {},
            images: [],
            notes: '',
            audioUri: null,
            fabricSource: 'Customer',
            totalCost: 0
        };

        updateState({
            currentOutfit: {
                ...newOutfit,
                sketchUri: null
            }
        });
        setCurrentStep(0);
    };

    const handleDeleteItem = (index: number) => {
        // Special Case: If this is the LAST item in the list
        // Calculate effective total items (cart items + current item if active)
        // Actually, handleDeleteItem is called on cart items.
        // If we are deleting a cart item, and it's the only one (and no current item active?)
        // Let's rely on cart length.

        const newCart = [...state.cart];

        // CHECK: Is this the last item?
        // Logic: If we are in "New Order" mode (no editOrderId) AND cart has 1 item AND we are deleting it.
        // Also check if currentOutfit is empty/inactive.
        const isLastItem = newCart.length === 1 && !state.currentOutfit.type;

        if (isLastItem && !editOrderId) {
            // Trigger Discard Order Warning relative to the Sheet calling this?
            // But wait, the sheet is already closed when this executes? 
            // No, confirmDeleteItem sets the index, then confirms.
            // We should have intercepted this BEFORE calling handleDeleteItem ideally, or inside here we navigte back.
            // But handleDeleteItem is called AFTER confirmation in the current code structure?
            // Let's look at `handleConfirmDelete` -> calls `handleDeleteItem`.
            // We need to change the CONFIRMATION text logic mainly.
            // But if we are here, surely we proceed? 
            // Wait, user requirement: "warn it in the drawer and close that page".
            // So we need to change what logic happens in `confirmDeleteItem` or `handleConfirmDelete`.
        }

        newCart.splice(index, 1);

        let newUpdates: any = { cart: newCart };

        // If we represent the 'Current Item' as the one being edited, we must shift the index
        // if an item BEFORE it is deleted.
        if (editItemIndex !== undefined && editItemIndex !== null) {
            if (index < editItemIndex) {
                navigation.setParams({ editItemIndex: editItemIndex - 1 });
            } else if (index === editItemIndex) {
                // Should not happen if UI hides it, but safety:
                navigation.setParams({ editItemIndex: undefined });
                // Also reset current outfit if we deleted the source
                newUpdates.currentOutfit = {
                    id: `current_${Date.now()}`,
                    type: 'Blouse',
                    quantity: 1,
                    measurements: {},
                    images: [],
                    notes: '',
                    totalCost: 0
                };
            }
        }
        updateState(newUpdates);

        // If we just deleted the last item and it was a new order (and we didn't just bail), 
        // we might end up with empty screen. 
        // Logic moved to `confirmDeleteItem` to handle the "Discard" flow BEFORE this.
    };

    const handleEditItem = (index: number) => {
        const itemToEdit = state.cart[index];
        if (!itemToEdit) return; // Safety check

        const newCart = [...state.cart];
        newCart.splice(index, 1);

        // Restore to currentOutfit and go to Step 0 (Basic Info) or Step 1 (Measurements)?
        // Let's go to Step 1 (Measurements) as that's where most edits happen, 
        // but user might want to change Type (Step 0). Step 0 is safer.
        updateState({
            cart: newCart,
            currentOutfit: { ...itemToEdit, isCurrent: true, id: itemToEdit.id || Date.now().toString() },
            // Fix: Populate Date & Urgency from item being edited
            trialDate: itemToEdit.trialDate || state.trialDate,
            deliveryDate: itemToEdit.deliveryDate || state.deliveryDate,
            urgency: itemToEdit.urgency || state.urgency,
            orderType: itemToEdit.orderType || state.orderType,
        });
        setCurrentStep(0); // Go to start of flow
    };

    const handleRecordingSave = async (uri: string, duration: number) => {
        // Save to current outfit immediately with loading state
        updateState({
            currentOutfit: {
                ...state.currentOutfit,
                audioUri: uri,
                audioDuration: duration,
                isTranscribing: true
            }
        });

        let text = "";

        try {
            text = await transcribeAudioWithWhisper(uri);
        } catch (whisperError: any) {
            console.error("OpenAI Whisper failed:", whisperError);
            if (showAlert) showAlert("Transcription Failed", `OpenAI Error: ${whisperError.message}`);
            text = ""; // Continue even if transcription fails, don't crash the save
        }




        // Append to existing notes
        const currentNotes = state.currentOutfit.notes || '';
        const newNotes = text ? (currentNotes ? `${currentNotes}\n\n[Transcript]: ${text}` : `[Transcript]: ${text}`) : currentNotes;

        updateState({
            currentOutfit: {
                ...state.currentOutfit,
                audioUri: uri,
                audioDuration: duration,
                notes: newNotes,
                isTranscribing: false
            }
        });

    };

    const handleCreateOrder = async () => {
        setLoading(true);
        try {
            // Prepare Order Data
            // Combine cart + currentOutfit (if valid?)
            // Usually "Create Order" means everything is final.
            // If currentOutfit is partially filled, should we add it?
            // "Current Item" in accordion indicates it is part of the order.

            if (!state.selectedCustomer && !state.customerName) {
                // showAlert('Missing Customer', 'Please select or add a customer before creating an order.');
                if (!state.selectedCustomer) {
                    showToast('This order does not have a customer attached. Please select or add a customer.', 'warning');
                    return;
                }
                setLoading(false);
                return;
            }

            const finalItems = [...state.cart];
            // Only add currentOutfit if it has a type selected, implying it's a valid item in progress
            if (state.currentOutfit.type) {
                // Auto-save measurements for this final item too
                await saveMeasurementHistory(state.currentOutfit);

                // Fix: Preserve existing ID if editing, otherwise generate new
                // This prevents duplicate items when updating an order (backend upsert logic)
                const itemId = state.currentOutfit.id && !state.currentOutfit.id.startsWith('current_')
                    ? state.currentOutfit.id
                    : `final_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Fix: Explicitly save metadata for the final item being added
                const itemToSave = {
                    ...state.currentOutfit,
                    id: itemId,
                    deliveryDate: state.deliveryDate, // Persist date
                    trialDate: state.trialDate, // Persist trial date
                    urgency: state.urgency // Persist urgency
                };

                // LOGIC TO PREVENT DUPLICATES:
                // 1. Check if item with same ID exists in cart (Priority)
                const existingIndexById = finalItems.findIndex((i: any) => i.id === itemId);

                if (existingIndexById !== -1) {
                    // Replace existing item found by ID
                    finalItems[existingIndexById] = itemToSave;
                }
                // 2. Fallback: If editItemIndex passed via route param matches a position in cart
                // (Only if we haven't matched by ID already)
                else if (editItemIndex !== undefined && editItemIndex !== null && editItemIndex >= 0 && editItemIndex < finalItems.length) {
                    finalItems[editItemIndex] = itemToSave;
                }
                else {
                    // 3. New Item -> Push
                    finalItems.push(itemToSave);
                }
            }

            // Validate: check if prices are set? (Exclude Cancelled)
            const totalValue = finalItems.reduce((sum: number, item: any) => {
                if (item.status === 'Cancelled') return sum;
                return sum + (Number(item.totalCost) || 0);
            }, 0);

            if (finalItems.length === 0) {
                showToast('Please add at least one item to the order.', 'warning');
                setLoading(false);
                return;
            }

            if (totalValue <= 0) {
                showToast('Total order value cannot be zero.', 'warning');
                setLoading(false);
                return;
            }

            const currentInputAdvance = Number(state.paymentInput) || 0;
            const existingAdvanceVal = Number(state.existingAdvance) || 0;
            // For New Order: Total = Input
            // For Edit Order: Total = Existing + Input (Additive)
            // But wait, if we are in New Order mode, existingAdvance is 0. So logic holds.
            const totalAdvance = existingAdvanceVal + currentInputAdvance;

            const newOrderData: Partial<Order> = {
                customerId: state.selectedCustomer?.id,
                customerName: state.customerName || state.selectedCustomer?.name,
                customerMobile: state.customerMobile || state.selectedCustomer?.mobile,
                items: finalItems.map(i => ({ ...i, status: i.status || 'Pending' })), // Ensure items have status
                outfits: finalItems.map(i => ({ ...i, status: i.status || 'Pending' })), // Ensure outfits have status
                status: editOrderId && orders.find(o => o.id === editOrderId)?.status ? orders.find(o => o.id === editOrderId)?.status! : 'Pending', // Preserve status on edit
                paymentStatus: totalAdvance >= totalValue ? 'Paid' : (totalAdvance > 0 ? 'Partial' : 'Pending'),
                total: totalValue,
                advance: totalAdvance,
                balance: totalValue - totalAdvance,
                notes: state.currentOutfit.notes,
                deliveryDate: state.deliveryDate,
                trialDate: state.trialDate,
                // Fix: Save Urgency and Order Type
                urgency: state.urgency,
                orderType: state.orderType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editOrderId) {
                const existingOrder = orders.find(o => o.id === editOrderId);

                // PAYMENT RECONCILIATION:
                // If user added a payment (paymentInput > 0), record it.
                if (currentInputAdvance > 0) {
                    await addPayment({
                        orderId: editOrderId,
                        customerId: existingOrder?.customerId,
                        amount: currentInputAdvance,
                        date: new Date().toISOString(),
                        mode: (state.paymentMode || 'Cash') as any
                    });
                }

                await updateOrder(editOrderId, newOrderData);
                setCreatedOrder({ ...existingOrder, ...newOrderData, id: editOrderId } as Order);
                setSuccessModalVisible(true);
            } else {
                const result = await addOrder(newOrderData);
                if (result && result.id) {
                    setCreatedOrder(result);
                    setSuccessModalVisible(true);
                } else {
                    showAlert('Error', 'Failed to create order. Please try again.');
                }
            }
        } catch (e: any) {
            showAlert('Error', e.message || 'An unexpected error occurred.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();

    const renderHeader = () => {
        if (!editOrderId) {
            return (
                <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                        <ArrowLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{editOrderId ? 'Edit Order' : 'New Order'}</Text>
                    <View style={{ width: 32 }} />
                </View>
            );
        }
        return null;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />


            {/* Header with Tabs */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editOrderId ? 'Edit Order' : 'New Order'}</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Tab Bar ScrollView */}
            <View style={{ backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {[
                        { id: 0, title: 'Outfit' },
                        { id: 1, title: 'Stitching' },
                        { id: 2, title: 'Measurements' },
                        { id: 3, title: 'Photos' },
                        { id: 4, title: 'Summary' }
                    ].map((tab) => {
                        const isActive = currentStep === tab.id;
                        const isCompleted = currentStep > tab.id;

                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={{
                                    paddingVertical: 12,
                                    marginRight: 24,
                                    borderBottomWidth: 2,
                                    borderBottomColor: isActive ? Colors.primary : 'transparent'
                                }}
                                onPress={() => {
                                    if (tab.id <= currentStep || validateStep(currentStep)) {
                                        setCurrentStep(tab.id);
                                    }
                                }}
                            >
                                <Text style={{
                                    fontFamily: isActive ? 'Inter-SemiBold' : 'Inter-Medium',
                                    fontSize: 14,
                                    color: isActive ? Colors.primary : (isCompleted ? Colors.textPrimary : Colors.textSecondary)
                                }}>
                                    {tab.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content */}
            {/* Content Area */}
            {/* Content Area */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <View style={{ flex: 1 }}>
                    {currentStep === 0 && <Step1BasicInfo state={state} onChange={updateState} customers={customers} outfits={outfits} openCustomerModal={() => setCustomerModalVisible(true)} editItemIndex={editItemIndex} onShowAlert={showAlert} />}
                    {currentStep === 1 && <StepStitching state={state} onChange={updateState} outfits={outfits} />}
                    {currentStep === 2 && <StepMeasurements state={state} onChange={updateState} />}
                    {currentStep === 3 && <Step3Media state={state} onChange={updateState} onShowAlert={showAlert} />}
                    {currentStep === 4 && <Step4BillingWrapper state={state} onChange={updateState} onAddAnother={handleAddAnother} onDeleteItem={handleDeleteItem} confirmDeleteItem={confirmDeleteItem} onEditItem={handleEditItem} onShowAlert={showAlert} onGoToStep={setCurrentStep} editItemIndex={editItemIndex} />}
                </View>
            </KeyboardAvoidingView>

            {/* Footer Buttons */}
            {/* Footer Buttons */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 60 : 24) }]}>
                {currentStep > 0 && currentStep < 4 && (
                    <TouchableOpacity style={styles.outlineBtn} onPress={handleBack}>
                        <ArrowLeft size={20} color={Colors.textPrimary} />
                        <Text style={styles.outlineBtnText}>Back</Text>
                    </TouchableOpacity>
                )}

                {currentStep < 4 ? (
                    <TouchableOpacity style={[styles.nextBtn, currentStep === 0 && { flex: 1 }]} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Next</Text>
                        <ArrowRight size={20} color={Colors.white} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                        <TouchableOpacity style={styles.outlineBtn} onPress={handleBack}>
                            <Text style={styles.outlineBtnText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleCreateOrder} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>{editOrderId ? 'Update Order' : 'Create Order'}</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Modals */}
            <AlertModal
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
                onConfirm={alert.onConfirm}
            />
            <CustomerSelectionModal
                visible={customerModalVisible}
                onClose={() => setCustomerModalVisible(false)}
                onSelect={async (cust: any) => {
                    if (cust.isNew) {
                        setLoading(true);
                        try {
                            const newCust = await addCustomer({
                                name: cust.name,
                                mobile: cust.mobile,
                                location: cust.location
                            });
                            updateState({ selectedCustomer: newCust, customerName: newCust.name, customerMobile: newCust.mobile });
                        } catch (e) {
                            console.error(e);
                            showAlert('Error', 'Failed to save new customer. Process continued correctly but customer might not be saved in directory.');
                            // Fallback to local state just in case
                            updateState({ selectedCustomer: cust, customerName: cust.name, customerMobile: cust.mobile });
                        } finally {
                            setLoading(false);
                        }
                    } else {
                        updateState({ selectedCustomer: cust, customerName: cust.name, customerMobile: cust.mobile });
                    }
                    setCustomerModalVisible(false);
                }}
                customers={customers}
            />



            {successModalVisible && (
                <OrderSuccessModal
                    visible={successModalVisible}
                    order={createdOrder}
                    onPrint={handlePrintOrder}
                    onWhatsapp={() => { }}
                    onClose={() => {
                        setSuccessModalVisible(false);
                        navigation.goBack();
                    }}
                />
            )}
            {currentStep <= 3 && (
                <FloatingAudioRecorder onRecordingComplete={handleRecordingSave} onShowAlert={showAlert} />
            )}

            <BottomConfirmationSheet
                visible={deleteSheetVisible}
                onClose={() => setDeleteSheetVisible(false)}
                onConfirm={handleConfirmDelete}
                title={deleteSheetConfig.title}
                description={deleteSheetConfig.description}
                confirmText={deleteSheetConfig.confirmText}
                type="danger"
            />

            <PDFPreviewModal
                visible={previewVisible}
                html={previewHtml}
                title="Customer Copy"
                onClose={() => setPreviewVisible(false)}
                onPrint={handleActualPrint}
                onShare={handleActualShare}
            />

            <ReusableBottomDrawer
                visible={discardDrawerVisible}
                onClose={() => setDiscardDrawerVisible(false)}
                height="auto"
            >
                <View style={{ padding: 20 }}>
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                            <AlertTriangle size={28} color={Colors.danger} />
                        </View>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.textPrimary, marginBottom: 8 }}>Discard changes?</Text>
                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                            You have unsaved changes. Are you sure you want to discard them and leave?
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.outlineBtn, { flex: 1 }]}
                            onPress={() => setDiscardDrawerVisible(false)}
                        >
                            <Text style={styles.outlineBtnText}>Don't leave</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { flex: 1, backgroundColor: Colors.danger }]}
                            onPress={() => {
                                setDiscardDrawerVisible(false);
                                if (pendingAction) {
                                    navigation.dispatch(pendingAction);
                                }
                            }}
                        >
                            <Text style={styles.primaryBtnText}>Discard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ReusableBottomDrawer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Lighter background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 50,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    // Styles for Visual Options
    optionCard: {
        width: '30%',
        paddingVertical: 12, // Allow height to grow with content
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        position: 'relative',
        minHeight: 100 // Ensure minimum height
    },
    optionCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FDF4',
        borderWidth: 2
    },
    optionCardSplitSelected: {
        borderColor: Colors.primary,
        borderWidth: 2,
        backgroundColor: '#F0F9FF',
    },
    sketchContainer: {
        height: 300,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        ...Shadow.small
    },
    sketchToolBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center'
    },
    sketchToolText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textPrimary
    },
    saveSketchBtn: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        ...Shadow.medium
    },
    saveSketchText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.white
    },
    optionImage: {
        width: 48, // Fixed size square
        height: 48,
        resizeMode: 'contain',
        marginBottom: 8
    },
    optionPlaceholder: {
        width: 48, // Fixed size square
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8 // Soft rounded corners like the card
    },
    optionText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13, // Increased font size
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18
    },
    optionTextSelected: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold'
    },
    checkBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: Colors.primary,
        borderRadius: 6,
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    // ... existing generic styles
    footer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12
    },
    nextBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#0F172A', // Darker theme to differentiate better
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...Shadow.medium
    },
    nextBtnText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16
    },
    outlineBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        height: 50,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    outlineBtnText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter-Medium',
        fontSize: 16
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.medium
    },
    primaryBtnText: {
        color: Colors.white,
        fontFamily: 'Inter-Bold',
        fontSize: 16
    },

    // Step Container
    stepContainer: {
        flex: 1,
        padding: 16,
    },

    // Compact Card Styles
    card: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        ...Shadow.small
    },
    cardTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: '#111827',
        marginBottom: 12
    },
    fieldLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4
    },

    // Inputs
    dateInputDisplay: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        height: 44,
        justifyContent: 'center',
        paddingHorizontal: 12
    },
    dateInputText: {
        fontFamily: 'Inter-Medium',
        color: '#111827',
        fontSize: 14
    },
    dropdownDisplay: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12
    },
    dropdownText: {
        fontFamily: 'Inter-Medium',
        color: '#111827',
        fontSize: 14
    },

    // Type Toggles
    typeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6
    },
    typeBtnActive: {
        backgroundColor: Colors.white,
        ...Shadow.small
    },
    typeBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#6B7280'
    },
    typeBtnTextActive: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold'
    },

    // Customer Card specific
    subLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
        marginLeft: 4
    },
    valueText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: '#111827'
    },

    // Step 4 Accordion
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 0,
        marginBottom: 20,
        ...Shadow.small,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    accordionCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 0,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        ...Shadow.small,
        overflow: 'hidden'
    },
    accordionCardExpanded: {
        borderColor: Colors.primary + '30',
        backgroundColor: '#FCFCFD',
        ...Shadow.medium
    },
    cardHeaderRow: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FCFCFD'
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        minHeight: 56
    },
    accordionContent: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: Colors.white
    },
    accordionBody: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: '#F8FAFC'
    },
    itemNameText: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: '#1F2937'
    },
    itemQtyText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#6B7280'
    },
    itemPriceText: {
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        color: '#1F2937'
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 16
    },
    draftBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12
    },
    draftBadgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: '#166534'
    },
    smallInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        backgroundColor: Colors.white
    },
    smallCurrencyInput: {
        flex: 1,
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#1F2937'
    },
    currencyPrefixSmall: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: '#9CA3AF',
        marginRight: 4
    },
    fieldLabelSmall: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#4B5563',
        marginBottom: 4,
        width: 80
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    textDeleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    textDeleteBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.danger
    },
    addAnotherBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0F9FF',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        borderStyle: 'dashed',
        marginBottom: 24
    },
    addAnotherText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.primary
    },
    // Bill Summary
    advanceRow: {
        flexDirection: 'row',
        gap: 12
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: '#F9FAFB'
    },
    currencyInput: {
        flex: 1,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: '#1F2937'
    },
    currencyPrefix: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: '#9CA3AF',
        marginRight: 4
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
        height: 48,
        alignItems: 'center'
    },
    modeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        height: '100%',
        justifyContent: 'center'
    },
    modeBtnActive: {
        backgroundColor: Colors.white,
        ...Shadow.small
    },
    modeBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#6B7280'
    },
    modeBtnTextActive: {
        fontFamily: 'Inter-SemiBold',
        color: Colors.textPrimary
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    summaryLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: '#4B5563'
    },
    summaryValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#111827'
    },
    totalLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#111827'
    },
    totalValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.primary
    },
    // Restored Missing Styles
    section: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
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
        width: '100%',
        paddingVertical: 32,
        paddingHorizontal: 24,
        gap: 16,
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
        flexDirection: 'column',
        backgroundColor: Colors.white,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
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


    calendarContainer: {
        backgroundColor: Colors.white,
        margin: 20,
        borderRadius: 24,
        padding: 24,
        ...Shadow.large,
        width: '90%',
        maxWidth: 360
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    calendarTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: '#0F172A'
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
    // --- Step 1 Refactor Styles ---
    newSectionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    customerCleanArea: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadow.subtle,
    },
    customerAvatarClean: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    customerNameMain: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 17,
        color: Colors.textPrimary,
    },
    customerSubText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    dateModernCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadow.subtle,
    },
    modernLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    modernDateText: {
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        color: Colors.textPrimary,
    },
    modernDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        ...Shadow.subtle,
    },
    modernDropdownText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    chipGroup: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    chipBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: '#64748B',
    },
    chipTextActive: {
        color: Colors.white,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        height: 56,
        paddingHorizontal: 8,
        ...Shadow.subtle,
    },
    stepperBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        ...Shadow.small,
    },
    stepperBtnText: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: Colors.primary,
    },
    stepperValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
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
    calendarDayDisabled: {
        opacity: 0.25
    },
    calendarDayTextDisabled: {
        color: Colors.textSecondary,
        fontFamily: 'Inter-Regular'
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



    // Floating Recorder
    floatingMicBtn: {
        position: 'absolute',
        bottom: 110, // Elevated further to ensure clearance above the taller footer
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
        zIndex: 9999
    },
    floatingRecorderExpanded: {
        position: 'absolute',
        bottom: 110, // Elevated further to ensure clearance above the taller footer
        right: 16,
        left: 16,
        backgroundColor: Colors.primary,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 56,
        ...Shadow.medium,
        zIndex: 9999
    },
    // Stitching Split View
    sidebarContainer: {
        flex: 1,
        maxWidth: '35%',
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        backgroundColor: '#FFFFFF'
    },
    contentContainer: {
        flex: 2,
        backgroundColor: '#F9FAFB'
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderLeftWidth: 3,
        borderLeftColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    sidebarItemActive: {
        backgroundColor: '#F0F9FF',
        borderLeftColor: Colors.primary
    },
    sidebarItemText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18
    },
    sidebarItemTextActive: {
        fontFamily: 'Inter-SemiBold',
        color: Colors.primary
    },
    sidebarCheckBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4
    },
    contentTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 4,
        marginTop: 4
    },
    optionCardSplit: {
        width: '47%', // 2 per row
        aspectRatio: 0.9,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Shadow.small
    },
    optionImageSplit: {
        width: 50,
        height: 50,
        marginBottom: 8,
        resizeMode: 'contain'
    },
    optionPlaceholderSplit: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionListImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // List Styles for Options
    optionListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border, // Using border color
        marginBottom: 0,
        ...Shadow.small,
    },
    optionListItemSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FDF9', // Very light green
    },
    optionListImageContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    optionListText: {
        fontSize: 15,
        fontFamily: 'Inter-Medium',
        color: Colors.textPrimary,
    },
    optionListTextSelected: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    optionTextSplit: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 18
    },
});

export default CreateOrderFlowScreen;
