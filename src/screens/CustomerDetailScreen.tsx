import React, { useState, useLayoutEffect } from 'react';
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
    Platform
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Phone, ReceiptIndianRupee, ChevronRight, MapPin, Edit3, Trash2, X, Save, Wallet, ShoppingBag } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import SuccessModal from '../components/SuccessModal';

const CustomerDetailScreen = ({ route, navigation }: any) => {
    const { customer: initialCustomer } = route.params;
    const { orders: allOrders, customers, updateCustomer, deleteCustomer } = useData();

    // Get fresh customer data from context
    const customer = customers.find(c => c.id === initialCustomer.id) || initialCustomer;
    const customerOrders = allOrders.filter(o => o.customerId === customer.id);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editName, setEditName] = useState(customer.name);
    const [editMobile, setEditMobile] = useState(customer.mobile);
    const [successVisible, setSuccessVisible] = useState(false);
    const [successTitle, setSuccessTitle] = useState('');
    const [successDesc, setSuccessDesc] = useState('');
    const [successType, setSuccessType] = useState<'success' | 'warning' | 'info' | 'error'>('success');
    const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => { });
    const [isDeleting, setIsDeleting] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={styles.headerIconButton}>
                        <Edit3 size={20} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteConfirm} style={[styles.headerIconButton, { marginLeft: 12 }]}>
                        <Trash2 size={20} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, customer]);

    const handleDeleteConfirm = () => {
        setSuccessTitle('Delete Customer');
        setSuccessDesc('Are you sure you want to delete this customer? This action cannot be undone.');
        setSuccessType('error');
        setIsDeleting(true);
        setSuccessVisible(true);
        setOnConfirmAction(() => async () => {
            await deleteCustomer(customer.id);
            setIsDeleting(false);
            setSuccessTitle('Customer Deleted');
            setSuccessDesc('The customer profile has been permanently removed.');
            setSuccessType('success');
            setSuccessVisible(true);
        });
    };

    const handleUpdate = async () => {
        if (!editName.trim() || editMobile.length !== 10) {
            setSuccessTitle('Invalid Input');
            setSuccessDesc('Name and valid 10-digit Phone Number are required.');
            setSuccessType('warning');
            setSuccessVisible(true);
            return;
        }
        await updateCustomer(customer.id, { name: editName, mobile: editMobile });
        setIsEditModalVisible(false);
        setSuccessTitle('Customer Updated');
        setSuccessDesc('The customer details have been successfully updated.');
        setSuccessType('success');
        setSuccessVisible(true);
    };

    const handleSuccessDone = () => {
        setSuccessVisible(false);
        if (successTitle === 'Customer Deleted') {
            navigation.goBack();
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{customer.name.substring(0, 1).toUpperCase()}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.customerNameTitle}>{customer.name}</Text>
                                <View style={styles.idBadge}>
                                    <Text style={styles.idBadgeText}>#{customer.id}</Text>
                                </View>
                            </View>

                            <View style={styles.contactRow}>
                                <View style={styles.contactItem}>
                                    <Phone size={14} color={Colors.textSecondary} />
                                    <Text style={styles.phoneText}>{customer.mobile}</Text>
                                </View>
                                {customer.location && (
                                    <>
                                        <View style={styles.dotSeparator} />
                                        <View style={styles.contactItem}>
                                            <MapPin size={14} color={Colors.textSecondary} />
                                            <Text style={styles.phoneText}>{customer.location}</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

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
                            <Text style={[styles.statValue, { color: '#2563EB' }]}>₹{customerOrders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Order History</Text>
                    {customerOrders.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text style={{ color: Colors.textSecondary }}>No orders yet</Text>
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
                                        <Text style={styles.orderDate}>{order.date}</Text>
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
                </View>
            </ScrollView>

            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

                        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
                            <Save size={20} color={Colors.white} />
                            <Text style={styles.saveButtonText}>Update Customer</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <SuccessModal
                visible={successVisible}
                onClose={handleSuccessDone}
                title={successTitle}
                description={successDesc}
                type={successType}
                onConfirm={isDeleting ? onConfirmAction : undefined}
                confirmText={isDeleting ? 'Delete' : 'Done'}
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
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    avatarText: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: '#16A34A',
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    customerNameTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
    },
    idBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    idBadgeText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: Colors.textSecondary,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
    },
    statsRow: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    statValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
    },
    section: {
        padding: Spacing.md,
    },
    orderCard: {
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: 16,
        marginBottom: Spacing.sm,
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
    },
    headerIconButton: {
        padding: 4,
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
        case 'In Progress': return '#3B82F6'; // Blue
        case 'Trial': return '#8B5CF6'; // Purple
        case 'Overdue': return Colors.danger;
        case 'Cancelled': return '#6B7280'; // Gray
        case 'Completed': return Colors.success;
        case 'Paid': return Colors.success;
        case 'Partial': return '#F59E0B'; // Amber
        case 'Pending': return '#F59E0B'; // Amber
        case 'Due': return Colors.danger;
        default: return '#6B7280';
    }
};

export default CustomerDetailScreen;
