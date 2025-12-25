import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, Dimensions, ActivityIndicator, KeyboardAvoidingView, Linking } from 'react-native';
import { Colors, Spacing, Shadow, Typography } from '../constants/theme';
import {
    ChevronDown, Printer, Share2, HelpCircle, ArrowLeft, Trash2, Edit2, ChevronRight,
    Calculator, Calendar, Receipt, User, Smartphone, CreditCard, Banknote, Clock,
    CheckCircle2, AlertCircle, X, Info, Phone, Mail, MapPin, Download, FileText,
    PlayCircle, StopCircle, PlusCircle, ReceiptIndianRupee, PenTool, Check
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { formatDate, getCurrentDate } from '../utils/dateUtils';
import { Share, Platform } from 'react-native';
import ReusableBottomDrawer from '../components/ReusableBottomDrawer';
import { generateInvoicePDF, generateTailorCopyPDF, generateCustomerCopyPDF, normalizeItems } from '../services/pdfService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';
import { useToast } from '../context/ToastContext';

const { width } = Dimensions.get('window');

const OrderDetailScreen = ({ route, navigation }: any) => {
    const { orderId } = route.params;
    const { orders, deleteOrder, updateOrder, addPayment, updatePayment, deletePayment, payments, customers } = useData();
    const { company } = useAuth();
    const insets = useSafeAreaInsets();
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [printOptionsModalVisible, setPrintOptionsModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'items' | 'payments'>('details');
    const scrollRef = useRef<ScrollView>(null);
    const [editingPayment, setEditingPayment] = useState<any>(null);

    const handleEditPayment = (payment: any) => {
        setEditingPayment(payment);
        setPaymentAmount(payment.amount.toString());
        setPaymentMode(payment.mode);
        setPaymentModalVisible(true);
    };

    const handleDeletePayment = (payment: any) => {
        Alert.alert(
            "Delete Payment",
            "Are you sure you want to delete this payment?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Verify context has deletePayment. If not, this will error.
                            // Assuming Step 616 successfully updated useData destructuring.
                            if (deletePayment) {
                                await deletePayment(payment.id);
                                showToast("Payment deleted", "success");
                            } else {
                                console.error("deletePayment function missing from context");
                            }
                        } catch (error: any) {
                            setAlertConfig({ title: 'Error', message: error.message });
                            setAlertVisible(true);
                        }
                    }
                }
            ]
        );
    };

    const handleTabPress = (tab: 'details' | 'items' | 'payments') => {
        let index = 0;
        if (tab === 'items') index = 1;
        if (tab === 'payments') index = 2;

        setActiveTab(tab);
        scrollRef.current?.scrollTo({
            x: index * width,
            animated: true
        });
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        const tabs: ('details' | 'items' | 'payments')[] = ['details', 'items', 'payments'];
        const newTab = tabs[index];
        if (newTab && newTab !== activeTab) {
            setActiveTab(newTab);
        }
    };



    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    // Delete Item State
    const [deleteItemSheetVisible, setDeleteItemSheetVisible] = useState(false);
    const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);

    // Audio Playback
    const [playingUri, setPlayingUri] = useState<string | null>(null);
    const soundRef = React.useRef<Audio.Sound | null>(null);

    const handlePlayAudio = async (uri: string) => {
        try {
            if (playingUri === uri) {
                // Stop if currently playing this
                if (soundRef.current) {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }
                setPlayingUri(null);
                return;
            }

            // Stop any other sound
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            const { sound } = await Audio.Sound.createAsync({ uri });
            soundRef.current = sound;
            setPlayingUri(uri);
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    if (status.didJustFinish) {
                        setPlayingUri(null);
                        soundRef.current?.unloadAsync();
                        soundRef.current = null;
                    }
                }
            });
        } catch (error) {
            console.log('Audio Error:', error);
            setAlertConfig({ title: 'Error', message: 'Could not play audio note' });
            setAlertVisible(true);
        }
    };

    // Cleanup audio on unmount
    React.useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);





    // Use orderId to find the order in the global state
    const order = orders.find(o => o.id === orderId);
    const { showToast } = useToast();

    if (!order) {
        return (
            <View style={styles.center}>
                <Text style={Typography.bodyMedium}>Order not found</Text>
                <TouchableOpacity
                    style={{ marginTop: 20, padding: 10, backgroundColor: Colors.primary, borderRadius: 8 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: Colors.white }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const billPayments = payments.filter(p => p.orderId === order.id);
    const totalPaid = billPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = (order.total || 0) - totalPaid;

    const displayItems = normalizeItems(order);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', { screen: 'Dashboard' })}
                    style={{ padding: 8, marginLeft: -8 }}
                >
                    <ArrowLeft size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
            ),
            headerRight: () => null
        });
    }, [navigation, order]);

    const handleWhatsAppShare = async () => {
        const customer = customers.find(c => c.id === order.customerId);
        let mobile = order.customerMobile || customer?.mobile || '';

        // Basic cleaning
        mobile = mobile.replace(/\s+/g, '').replace(/-/g, '');
        if (!mobile) {
            setAlertConfig({ title: 'No Mobile', message: 'Customer mobile number is missing.' });
            setAlertVisible(true);
            return;
        }

        // Append country code if missing (Basic assumption for India, can be improved)
        if (!mobile.startsWith('+') && mobile.length === 10) {
            mobile = '+91' + mobile; // Assuming India for now based on currency
        }

        const balance = order.total - order.advance;
        const status = balance > 0 ? 'Pending' : 'Paid';
        const link = `whatsapp://send?phone=${mobile}&text=Hello ${order.customerName}, Here is your order details for Order #${order.billNo}. Total: ₹${order.total}, Paid: ₹${order.advance}, Balance: ₹${balance}. Status: ${status}. Thank you for your business!`;

        try {
            const supported = await Linking.canOpenURL(link);
            if (supported) {
                await Linking.openURL(link);
            } else {
                setAlertConfig({ title: 'WhatsApp Not Found', message: 'Could not open WhatsApp. Please check if it is installed.' });
                setAlertVisible(true);
            }
        } catch (err) {
            setAlertConfig({ title: 'Error', message: 'An error occurred while trying to open WhatsApp.' });
            setAlertVisible(true);
        }
    };

    const handleDeleteItem = (index: number) => {
        setItemToDeleteIndex(index);
        setDeleteItemSheetVisible(true);
    };

    const confirmDeleteItem = async () => {
        if (itemToDeleteIndex === null) return;

        const newItems = [...order.items];
        newItems.splice(itemToDeleteIndex, 1);

        // Recalculate totals
        const newTotal = newItems.reduce((sum: number, i: any) => sum + (Number(i.amount) || Number(i.rate) * Number(i.qty) || 0), 0);
        const newBalance = newTotal - (order.advance || 0);

        await updateOrder(order.id, {
            items: newItems,
            total: newTotal,
            balance: newBalance,
            updatedAt: new Date().toISOString()
        });
        setDeleteItemSheetVisible(false);
        setItemToDeleteIndex(null);
    };

    const handlePrint = async () => {
        if (isPrinting) return;
        setPrintOptionsModalVisible(true);
    };
    const [deleteSheetVisible, setDeleteSheetVisible] = React.useState(false);

    const handleDelete = () => {
        setDeleteSheetVisible(true);
    };

    const confirmDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await deleteOrder(order.id);
            navigation.goBack();
        } catch (e: any) {
            setDeleteSheetVisible(false); // Close sheet on error
            setAlertConfig({ title: 'Delete Failed', message: e.message || 'Could not delete bill' });
            setAlertVisible(true);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSavePayment = async () => {
        const amount = parseFloat(paymentAmount);

        // If editing, add back the old amount to balance for validation
        const effectiveBalance = editingPayment
            ? currentBalance + (editingPayment.amount || 0)
            : currentBalance;

        if (isNaN(amount) || amount <= 0) {
            setAlertConfig({ title: 'Invalid Amount', message: 'Please enter a valid payment amount.' });
            setAlertVisible(true);
            return;
        }

        if (amount > effectiveBalance) {
            setAlertConfig({ title: 'Excess Amount', message: 'Payment cannot be greater than the balance due.' });
            setAlertVisible(true);
            return;
        }

        try {
            if (editingPayment) {
                // Check if context has updatePayment
                if (updatePayment) {
                    await updatePayment(editingPayment.id, {
                        amount,
                        mode: paymentMode,
                    });
                    showToast(`Payment updated!`, 'success');
                } else {
                    console.error("updatePayment missing");
                }
            } else {
                await addPayment({
                    orderId: order.id,
                    customerId: order.customerId,
                    amount: amount,
                    mode: paymentMode,
                    date: order.date || getCurrentDate(),
                });
                showToast(`₹${amount} added successfully!`, 'success');
            }

            setPaymentModalVisible(false);
            setPaymentAmount('');
            setEditingPayment(null);
        } catch (error: any) {
            console.error('Payment Error:', error);
            setAlertConfig({ title: 'Payment Failed', message: error.message || 'Could not save payment' });
            setAlertVisible(true);
        }
    };

    const handleTailorCopy = async () => {
        if (isPrinting) return;
        setIsPrinting(true);
        try {
            showToast("Printing PDF...", "info");
            const customer = customers.find(c => c.id === order.customerId);
            const companyData = {
                name: company?.name || 'My Boutique',
                address: company?.address || 'Your Address Here',
                phone: company?.phone || 'Your Phone Here',
            };

            const orderWithCustomerInfo = {
                ...order,
                customerDisplayId: customer?.displayId || '---'
            };

            await generateTailorCopyPDF(orderWithCustomerInfo, companyData);
        } catch (error: any) {
            setAlertConfig({ title: 'Failed', message: error.message || 'Could not generate Tailor Copy' });
            setAlertVisible(true);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleCustomerCopy = async () => {
        if (isPrinting) return;
        setIsPrinting(true);
        try {
            showToast("Printing PDF...", "info");
            const companyData = {
                name: company?.name || 'My Boutique',
                address: company?.address || 'Your Address Here',
                phone: company?.phone || 'Your Phone Here',
            };
            const customer = customers.find(c => c.id === order.customerId);
            const enrichedOrder = {
                ...order,
                customerDisplayId: customer?.displayId || '---'
            };
            await generateCustomerCopyPDF(enrichedOrder, companyData);
        } catch (error: any) {
            setAlertConfig({ title: 'Failed', message: error.message || 'Could not generate Customer Copy' });
            setAlertVisible(true);
        } finally {
            setIsPrinting(false);
        }
    };

    // billPayments definition moved up for dynamic calculation

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {['details', 'items', 'payments'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                    onPress={() => handleTabPress(tab as any)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderOrderDetails = () => {
        const customer = customers.find(c => c.id === order.customerId);

        const DetailRow = ({ label, value, isStatus = false }: { label: string, value: string | React.ReactNode, isStatus?: boolean }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.textSecondary }}>{label}</Text>
                {isStatus ? (
                    value
                ) : (
                    <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: 16 }}>{value || '-'}</Text>
                )}
            </View>
        );

        return (
            <View style={{ gap: 24, paddingVertical: 8 }}>
                <View>
                    <DetailRow
                        label="Order Status"
                        isStatus
                        value={
                            <TouchableOpacity onPress={() => setStatusModalVisible(true)}>
                                <View style={{
                                    backgroundColor: getStatusColor(order.status || 'Pending') + '15',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: getStatusColor(order.status || 'Pending') + '30',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4
                                }}>
                                    <Text style={{
                                        color: getStatusColor(order.status || 'Pending'),
                                        fontFamily: 'Inter-Bold',
                                        fontSize: 12,
                                        textTransform: 'uppercase'
                                    }}>
                                        {order.status || 'Pending'}
                                    </Text>
                                    <ChevronDown size={14} color={getStatusColor(order.status || 'Pending')} />
                                </View>
                            </TouchableOpacity>
                        }
                    />
                    <DetailRow label="Order ID" value={`#${order.billNo}`} />
                    <DetailRow label="Time" value={order.time || '10:00 AM'} />
                    <DetailRow label="Customer ID" value={customer?.displayId || '-'} />
                    <DetailRow label="Name" value={order.customerName} />
                    <DetailRow label="Whatsapp Number" value={order.customerMobile} />
                    <DetailRow label="Ordered Date" value={formatDate(order.date || order.createdAt || new Date())} />

                    {/* Item Count */}
                    <DetailRow label="Total Items" value={displayItems.length.toString()} />

                    {/* Item Breakdown with Delivery Date */}
                    {displayItems.map((item: any, index: number) => (
                        <DetailRow
                            key={index}
                            label={`${item.name} (${item.qty})`}
                            value={order.deliveryDate ? formatDate(order.deliveryDate) : '-'}
                        />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.secondaryBtn, { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }, isPrinting && { opacity: 0.7 }]}
                        onPress={() => setPrintOptionsModalVisible(true)}
                        disabled={isPrinting || isSharing}
                    >
                        {isPrinting ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <>
                                <Printer size={20} color={Colors.primary} />
                                <Text style={styles.secondaryBtnText}>Print / Share</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { flex: 1 }, isSharing && { opacity: 0.7 }]}
                        onPress={handleWhatsAppShare}
                        disabled={isPrinting || isSharing}
                    >
                        {isSharing ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Share2 size={20} color={Colors.white} />
                                <Text style={styles.primaryBtnText}>WhatsApp</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderOrderItems = () => (
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>Items ({displayItems.length})</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreateOrderFlow', { editOrderId: order.id, addNewItem: true })}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
                >
                    <PlusCircle size={16} color={Colors.primary} style={{ marginRight: 4 }} />
                    <Text style={{ color: Colors.primary, fontFamily: 'Inter-SemiBold', fontSize: 13 }}>Add Item</Text>
                </TouchableOpacity>
            </View>

            {displayItems.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: Colors.textSecondary, fontFamily: 'Inter-Medium' }}>No items added yet</Text>
                </View>
            ) : (
                <View style={{ gap: 12 }}>
                    {displayItems.map((item: any, index: any) => (
                        <View key={index} style={{ backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, ...Shadow.subtle }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textPrimary }}>{item.name}</Text>
                                        <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', color: Colors.textSecondary }}>x{item.qty}</Text>
                                        </View>
                                    </View>
                                    {/* Description hidden in list view */}
                                </View>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textPrimary }}>₹{item.amount}</Text>
                            </View>

                            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', gap: 16 }}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('ItemDetail', { item, orderId: order.id, itemIndex: index })}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    >
                                        <Text style={{ fontSize: 13, color: Colors.primary, fontFamily: 'Inter-SemiBold' }}>View Details</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 16 }}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('CreateOrderFlow', { editOrderId: order.id, editItemIndex: index })}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    >
                                        <Edit2 size={16} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteItem(index)}>
                                        <Trash2 size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ marginTop: 24, padding: 16, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border }}>
                <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: 'Inter-Regular', color: Colors.textSecondary }}>Total Amount</Text>
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.textPrimary }}>₹{order.total.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: 'Inter-Regular', color: Colors.textSecondary }}>Paid Amount</Text>
                        <Text style={{ fontFamily: 'Inter-SemiBold', color: Colors.success }}>₹{totalPaid.toLocaleString()}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: Colors.border }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textPrimary }}>Balance Due</Text>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: currentBalance > 0 ? Colors.danger : Colors.success }}>
                            ₹{currentBalance.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderPaymentHistory = () => (
        <View style={{ flex: 1 }}>
            {/* Payment Summary Card */}
            <View style={{ backgroundColor: Colors.white, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.border, ...Shadow.subtle }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>Total</Text>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.textPrimary }}>₹{order.total.toLocaleString()}</Text>
                    </View>
                    <View style={{ width: 1, height: '80%', backgroundColor: Colors.border, alignSelf: 'center' }} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>Paid</Text>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: Colors.success }}>₹{totalPaid.toLocaleString()}</Text>
                    </View>
                    <View style={{ width: 1, height: '80%', backgroundColor: Colors.border, alignSelf: 'center' }} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>Balance</Text>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: currentBalance > 0 ? Colors.danger : Colors.success }}>₹{currentBalance.toLocaleString()}</Text>
                    </View>
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>History ({billPayments.length})</Text>
                <TouchableOpacity
                    onPress={() => {
                        setEditingPayment(null);
                        setPaymentAmount('');
                        setPaymentMode('Cash');
                        setPaymentModalVisible(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
                >
                    <PlusCircle size={16} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#059669', fontFamily: 'Inter-SemiBold', fontSize: 13 }}>Add Payment</Text>
                </TouchableOpacity>
            </View>

            {billPayments.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.border }}>
                    <ReceiptIndianRupee size={32} color={Colors.textSecondary} style={{ marginBottom: 8, opacity: 0.5 }} />
                    <Text style={{ color: Colors.textSecondary, fontFamily: 'Inter-Medium' }}>No payments recorded yet</Text>
                </View>
            ) : (
                <View style={{ gap: 12 }}>
                    {billPayments.map((p, index) => (
                        <View key={index} style={{ backgroundColor: Colors.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, ...Shadow.subtle }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <ReceiptIndianRupee size={20} color="#059669" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.textPrimary }}>Payment Received</Text>
                                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
                                        {formatDate(p.date)} • {p.mode}
                                    </Text>
                                </View>
                                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#059669' }}>+ ₹{p.amount}</Text>
                            </View>

                            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => handleEditPayment(p)}
                                    style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 }}
                                >
                                    <Edit2 size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', color: Colors.textPrimary }}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDeletePayment(p)}
                                    style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 }}
                                >
                                    <Trash2 size={14} color={Colors.danger} style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', color: Colors.danger }}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {renderTabs()}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={{ flex: 1 }}
            >
                <ScrollView style={{ width }} contentContainerStyle={styles.scrollContent}>
                    {renderOrderDetails()}
                </ScrollView>
                <ScrollView style={{ width }} contentContainerStyle={styles.scrollContent}>
                    {renderOrderItems()}
                </ScrollView>
                <ScrollView style={{ width }} contentContainerStyle={styles.scrollContent}>
                    {renderPaymentHistory()}
                </ScrollView>
            </ScrollView>



            <Modal
                animationType="slide"
                transparent={true}
                visible={paymentModalVisible}
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={[Typography.h2, { marginBottom: Spacing.lg }]}>{editingPayment ? 'Edit Payment' : 'Add Payment'}</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Amount Received (Balance: ₹{currentBalance})</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholderTextColor={Colors.textSecondary}
                                        placeholder="₹ 0.00"
                                        keyboardType="numeric"
                                        value={paymentAmount}
                                        onChangeText={setPaymentAmount}
                                        autoFocus
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Payment Mode</Text>
                                    <View style={styles.modeRow}>
                                        {['Cash', 'UPI', 'GPay', 'Card'].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[styles.modeBtn, paymentMode === m && styles.modeBtnActive]}
                                                onPress={() => setPaymentMode(m)}
                                            >
                                                <Text style={[styles.modeBtnText, paymentMode === m && styles.modeBtnTextActive]}>{m}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                                        setPaymentModalVisible(false);
                                        setEditingPayment(null);
                                        setPaymentAmount('');
                                    }}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleSavePayment}>
                                        <Text style={styles.saveBtnText}>{editingPayment ? 'Update Payment' : 'Add Payment'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={printOptionsModalVisible}
                onRequestClose={() => setPrintOptionsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setPrintOptionsModalVisible(false)}
                    />
                    <View style={styles.bottomSheet}>
                        <View style={styles.bottomSheetHeader}>
                            <Text style={styles.bottomSheetTitle}>Select Copy to Print</Text>
                            <TouchableOpacity onPress={() => setPrintOptionsModalVisible(false)}>
                                <Text style={{ color: Colors.primary, fontFamily: 'Inter-SemiBold' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                setPrintOptionsModalVisible(false);
                                handleCustomerCopy();
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F0F9FF' }]}>
                                <User size={20} color="#0284C7" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.optionLabel}>Customer Copy</Text>
                                <Text style={styles.optionDesc}>Original bill with full pricing details</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, { borderBottomWidth: 0 }]}
                            onPress={() => {
                                setPrintOptionsModalVisible(false);
                                handleTailorCopy();
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#FFF7ED' }]}>
                                <PenTool size={20} color="#EA580C" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.optionLabel}>Tailor Copy</Text>
                                <Text style={styles.optionDesc}>Measurements, photos & notes (no prices)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modals and Sheets */}

            <BottomConfirmationSheet
                visible={deleteSheetVisible}
                onClose={() => setDeleteSheetVisible(false)}
                onConfirm={confirmDelete}
                title="Delete Order"
                description="Are you sure you want to delete this order? This action cannot be undone."
                confirmText="Delete Order"
                type="danger"
            />

            <BottomConfirmationSheet
                visible={deleteItemSheetVisible}
                onClose={() => setDeleteItemSheetVisible(false)}
                onConfirm={confirmDeleteItem}
                title="Delete Item"
                description="Are you sure you want to delete this item?"
                confirmText="Delete Item"
                type="danger"
            />

            <AlertModal
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />
            {/* Status Selection Modal */}
            <ReusableBottomDrawer
                visible={statusModalVisible}
                onClose={() => setStatusModalVisible(false)}
                title="Update Status"
            >
                <View>
                    {['Pending', 'In Progress', 'Trial', 'Completed', 'Overdue', 'Cancelled'].map((statusOption) => {
                        const isSelected = order.status === statusOption;
                        const activeColor = getStatusColor(statusOption);
                        return (
                            <TouchableOpacity
                                key={statusOption}
                                onPress={async () => {
                                    setStatusModalVisible(false);
                                    await updateOrder(order.id, { status: statusOption as any });
                                }}
                                style={{
                                    paddingVertical: 16,
                                    paddingHorizontal: 24,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#F3F4F6',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isSelected ? activeColor + '10' : 'transparent',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: activeColor,
                                        shadowColor: activeColor,
                                        shadowOpacity: 0.5,
                                        shadowRadius: 4,
                                        elevation: 2
                                    }} />
                                    <Text style={{
                                        fontFamily: isSelected ? 'Inter-Bold' : 'Inter-Medium',
                                        fontSize: 16,
                                        color: isSelected ? Colors.textPrimary : Colors.textSecondary
                                    }}>
                                        {statusOption}
                                    </Text>
                                </View>
                                {isSelected && (
                                    <View style={{
                                        backgroundColor: activeColor + '20',
                                        borderRadius: 12,
                                        padding: 4
                                    }}>
                                        <Check size={16} color={activeColor} strokeWidth={3} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ReusableBottomDrawer>
            {/* Item Detail Modal */}
            <Modal
                visible={!!selectedItem}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedItem(null)} />
                    <View style={[styles.bottomSheet, { maxHeight: '85%' }]}>
                        <View style={styles.bottomSheetHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.bottomSheetTitle}>{selectedItem?.name}</Text>
                                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Detailed Specifications</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                <X size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                            {/* Images */}
                            {selectedItem?.images && selectedItem.images.length > 0 && (
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Photos / Designs</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                        {selectedItem.images.map((img: string, i: number) => (
                                            <TouchableOpacity key={i} onPress={() => setPreviewImageUri(img)} style={{ width: '48%', aspectRatio: 1 }}>
                                                <Image source={{ uri: img }} style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Separating Measurements and Stitching Options */}
                            {(() => {
                                const measurements = selectedItem?.measurements || {};
                                const numericMeasurements: any = {};
                                const stitchingOptions: any = {};

                                Object.entries(measurements).forEach(([key, val]) => {
                                    if (!isNaN(Number(val)) && String(val).trim() !== '') {
                                        numericMeasurements[key] = val;
                                    } else if (val && String(val).trim() !== '') {
                                        stitchingOptions[key] = val;
                                    }
                                });

                                return (
                                    <>
                                        {Object.keys(numericMeasurements).length > 0 && (
                                            <View style={{ marginBottom: 24 }}>
                                                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Measurements</Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                                    {Object.entries(numericMeasurements).map(([key, val]: any) => (
                                                        <View key={key} style={{ width: '48%', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
                                                            <Text style={{ fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize', marginBottom: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                                                            <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: Colors.textPrimary }}>{String(val)}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {Object.keys(stitchingOptions).length > 0 && (
                                            <View style={{ marginBottom: 24 }}>
                                                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Stitching Options</Text>
                                                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 }}>
                                                    {Object.entries(stitchingOptions).map(([key, val]: any) => (
                                                        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Text style={{ fontSize: 14, color: Colors.textSecondary, fontFamily: 'Inter-Medium', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                                                            <Text style={{ fontSize: 14, fontFamily: 'Inter-SemiBold', color: Colors.textPrimary, flex: 1, textAlign: 'right', marginLeft: 16 }}>{String(val)}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </>
                                );
                            })()}

                            {/* Notes */}
                            {selectedItem?.notes ? (
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</Text>
                                    <View style={{ backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FEF3C7' }}>
                                        <Text style={{ fontSize: 14, color: '#92400E', fontFamily: 'Inter-Medium', lineHeight: 20 }}>{selectedItem.notes}</Text>
                                    </View>
                                </View>
                            ) : null}

                            {/* Audio Note */}
                            {selectedItem?.audioUri && (
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Audio Note</Text>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, padding: 16, borderRadius: 12, ...Shadow.subtle }}
                                        onPress={() => handlePlayAudio(selectedItem.audioUri)}
                                    >
                                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                            {playingUri === selectedItem.audioUri ? <StopCircle size={24} color={Colors.white} /> : <PlayCircle size={24} color={Colors.white} />}
                                        </View>
                                        <View>
                                            <Text style={{ color: Colors.white, fontFamily: 'Inter-SemiBold', fontSize: 15 }}>
                                                {playingUri === selectedItem.audioUri ? 'Stop Playback' : 'Play Voice Note'}
                                            </Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>Tap to listen per instructions</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Image Preview Modal */}
            <Modal visible={!!previewImageUri} transparent={true} animationType="fade" onRequestClose={() => setPreviewImageUri(null)}>
                <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }} onPress={() => setPreviewImageUri(null)}>
                        <X size={30} color="white" />
                    </TouchableOpacity>
                    {previewImageUri && (
                        <Image source={{ uri: previewImageUri }} style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.8 }} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View >
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Completed': return Colors.success;
        case 'Paid': return Colors.success;
        case 'In Progress': return '#3B82F6';
        case 'Trial': return '#8B5CF6';
        case 'Overdue': return Colors.danger;
        case 'Cancelled': return '#6B7280';
        case 'Due': return Colors.danger;
        case 'Pending': return '#F59E0B';
        case 'Partial': return '#F59E0B';
        default: return Colors.textSecondary;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    billNoLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    billNoValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 24, // Increased
        color: Colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    infoGrid: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12, // Increased slightly
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoValue: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 17, // Increased
        color: Colors.textPrimary,
    },
    section: {
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemsCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tableHeaderText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    itemTextBold: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    summaryLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    dividerSmall: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: Spacing.sm,
    },
    totalLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    totalValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.primary,
    },
    amountGrid: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'space-between',
    },
    amountBox: {
        flex: 1,
        alignItems: 'center',
    },
    amountLabel: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    amountValueMain: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionBtn: {
        flex: 1, // Balanced 3-column
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textPrimary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        // paddingBottom set dynamically via inline style
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadow.medium,
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        height: 52,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 17,
        color: Colors.white,
    },
    secondaryBtn: {
        flex: 1,
        backgroundColor: Colors.white,
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    secondaryBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        paddingBottom: Spacing.xl + (Platform.OS === 'ios' ? 24 : 0),
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    bottomSheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 0, // Removed padding to let children handle it
        paddingBottom: 40, // Increased bottom padding for the drawer
        ...Shadow.large,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    bottomSheetTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 16,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    optionDesc: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    label: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        height: 56,
        paddingHorizontal: Spacing.md,
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    modeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    modeBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    modeBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: '#EEF2FF',
    },
    modeBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    modeBtnTextActive: {
        color: Colors.primary,
        fontFamily: 'Inter-Bold',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    cancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    saveBtn: {
        flex: 2,
        height: 56,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.white,
    },
    closeBtn: {
        borderColor: Colors.border,
        backgroundColor: Colors.white
    }
});



export default OrderDetailScreen;
