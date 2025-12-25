import React, { useState, useLayoutEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Phone, ReceiptIndianRupee, ChevronRight, MapPin, Edit3, Trash2, X, Save, Wallet, ShoppingBag, User, Smartphone, Calendar, Hash, IdCard } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import AlertModal from '../components/AlertModal';
import BottomConfirmationSheet from '../components/BottomConfirmationSheet';
import { validatePhone } from '../utils/validation';
import { formatDate } from '../utils/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CustomerDetailScreen = ({ route, navigation }: any) => {
    const { customer: initialCustomer } = route.params;
    const { orders: allOrders, customers, updateCustomer, deleteCustomer } = useData();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    // Get fresh customer data from context
    const customer = customers.find(c => c.id === initialCustomer.id) || initialCustomer;
    const customerOrders = allOrders.filter(o => o.customerId === customer.id);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editName, setEditName] = useState(customer.name);
    const [editMobile, setEditMobile] = useState(customer.mobile);
    const [editLocation, setEditLocation] = useState(customer.location || '');
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
    const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: customer.name,
            headerStyle: { backgroundColor: Colors.white, shadowColor: 'transparent', elevation: 0 },
            headerTitleStyle: { fontFamily: 'Inter-SemiBold', fontSize: 18, color: Colors.textPrimary },
            headerTintColor: Colors.textPrimary,
            headerRight: () => (
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={styles.headerIconButton}>
                        <Edit3 size={20} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeleteSheetVisible(true)} style={[styles.headerIconButton, { marginLeft: 12 }]}>
                        <Trash2 size={20} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, customer]);

    const handleTabPress = (tab: 'profile' | 'orders') => {
        setActiveTab(tab);
        scrollRef.current?.scrollTo({
            x: tab === 'profile' ? 0 : SCREEN_WIDTH,
            animated: true
        });
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        const newTab = index === 0 ? 'profile' : 'orders';
        if (newTab !== activeTab) {
            setActiveTab(newTab);
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteCustomer(customer.id);
            setDeleteSheetVisible(false);
            navigation.goBack();
        } catch (e) {
            setDeleteSheetVisible(false);
            setAlertConfig({ title: 'Error', message: 'Failed to delete customer.' });
            setAlertVisible(true);
        }
    };

    const handleUpdate = async () => {
        if (!editName.trim() || editMobile.length !== 10) {
            setAlertConfig({ title: 'Invalid Input', message: 'Name and valid 10-digit Phone Number are required.' });
            setAlertVisible(true);
            return;
        }
        await updateCustomer(customer.id, { name: editName, mobile: editMobile, location: editLocation });
        setIsEditModalVisible(false);
        setAlertConfig({ title: 'Customer Updated', message: 'The customer details have been successfully updated.' });
        setAlertVisible(true);
    };

    const DetailRow = ({ label, value, icon: Icon }: any) => (
        <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
                {Icon && <Icon size={16} color={Colors.textSecondary} style={{ marginRight: 8 }} />}
                <Text style={styles.detailLabel}>{label}</Text>
            </View>
            <Text style={styles.detailValue}>{value || '-'}</Text>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
                onPress={() => handleTabPress('profile')}
            >
                <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
                onPress={() => handleTabPress('orders')}
            >
                <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
            </TouchableOpacity>
        </View>
    );

    const renderProfileTab = () => {
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        return (
            <ScrollView style={styles.tabContentScroll} contentContainerStyle={{ padding: 16 }}>
                <View style={styles.listSection}>
                    <DetailRow label="Customer Name" value={customer.name} icon={User} />
                    <DetailRow label="Customer ID" value={customer.displayId ? `#${customer.displayId}` : '-'} icon={Hash} />
                    <DetailRow label="Phone Number" value={customer.mobile} icon={Smartphone} />
                    {customer.location && (
                        <DetailRow label="Location" value={customer.location} icon={MapPin} />
                    )}
                </View>

                {/* Stats Section in Order-Detail Style */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <View style={styles.statIconContainer}>
                            <ShoppingBag size={20} color="#16A34A" />
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Total Orders</Text>
                            <Text style={[styles.statValue, { color: '#16A34A' }]}>{customerOrders.length}</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <View style={styles.statIconContainer}>
                            <Wallet size={20} color="#2563EB" />
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Total Spent</Text>
                            <Text style={[styles.statValue, { color: '#2563EB' }]}>₹{totalSpent.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderOrdersTab = () => (
        <ScrollView style={styles.tabContentScroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {customerOrders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No orders yet</Text>
                </View>
            ) : (
                customerOrders.map(order => (
                    <TouchableOpacity
                        key={order.id}
                        style={styles.orderCard}
                        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                    >
                        <View style={styles.orderHeader}>
                            <View>
                                <Text style={styles.orderId}>#{order.billNo}</Text>
                                <Text style={styles.orderDate}>{formatDate(order.date || order.createdAt)}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                            </View>
                        </View>
                        <View style={styles.dividerSmall} />
                        <View style={styles.orderFooter}>
                            <Text style={styles.orderItems}>{order.items?.length || 0} Items</Text>
                            <View style={styles.orderRight}>
                                <Text style={styles.orderAmount}>₹{order.total}</Text>
                                <ChevronRight size={18} color={Colors.textSecondary} />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
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
                style={styles.pager}
            >
                <View style={{ width: SCREEN_WIDTH }}>
                    {renderProfileTab()}
                </View>
                <View style={{ width: SCREEN_WIDTH }}>
                    {renderOrdersTab()}
                </View>
            </ScrollView>

            {/* Modals */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={Typography.h3}>Edit Customer</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                <X size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Customer Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Enter customer name"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={editMobile}
                                onChangeText={(val) => setEditMobile(val.replace(/[^0-9]/g, '').slice(0, 10))}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={styles.input}
                                value={editLocation}
                                onChangeText={setEditLocation}
                                placeholderTextColor={Colors.textSecondary}
                                placeholder="Enter city or area"
                            />
                        </View>
                        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
                            <Save size={20} color={Colors.white} />
                            <Text style={styles.saveButtonText}>Update Customer</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

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
                title="Delete Customer"
                description="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText="Delete Customer"
                type="danger"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    pager: {
        flex: 1,
    },
    tabContentScroll: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
    },
    headerIconButton: {
        padding: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 15,
        fontFamily: 'Inter-Medium',
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold',
    },
    // Detail Row Style (Order-Detail Copy)
    listSection: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.textPrimary,
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 11,
        color: Colors.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    statValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
    },
    // Orders Card Style
    orderCard: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderId: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    orderDate: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontFamily: 'Inter-Bold',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    dividerSmall: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderItems: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    orderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    orderAmount: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter-Medium',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: Spacing.md,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        borderRadius: 12,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: Spacing.md,
        ...Shadow.medium,
    },
    saveButtonText: {
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
});

const getStatusColor = (status: string) => {
    switch (status) {
        case 'In Progress': return '#3B82F6';
        case 'Trial': return '#8B5CF6';
        case 'Overdue': return Colors.danger;
        case 'Cancelled': return '#6B7280';
        case 'Completed': return Colors.success;
        case 'Paid': return Colors.success;
        case 'Partial': return '#F59E0B';
        case 'Pending': return '#F59E0B';
        case 'Due': return Colors.danger;
        default: return '#6B7280';
    }
};

export default CustomerDetailScreen;
