import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { X, Search, User, Plus, Check, Phone, MapPin } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomerSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (customer: any) => void;
    customers: any[];
}

const CustomerSelectionModal = ({ visible, onClose, onSelect, customers }: CustomerSelectionModalProps) => {
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [search, setSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState(customers);

    // New Customer State
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        mobile: '',
        location: ''
    });

    useEffect(() => {
        if (search) {
            setFilteredCustomers(customers.filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.mobile.includes(search)
            ));
        } else {
            setFilteredCustomers(customers);
        }
    }, [search, customers]);

    const handleConfirmNew = () => {
        if (!newCustomer.name || !newCustomer.mobile) return;

        onSelect({
            id: 'NEW_' + Date.now(), // Temporary ID logic, will be handled by parent or backend
            ...newCustomer,
            isNew: true
        });
        resetForm();
    };

    const resetForm = () => {
        setMode('existing');
        setSearch('');
        setNewCustomer({ name: '', mobile: '', location: '' });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.container}
                >
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Select Customer</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'existing' && styles.activeTab]}
                            onPress={() => setMode('existing')}
                        >
                            <Text style={[styles.tabText, mode === 'existing' && styles.activeTabText]}>Existing</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'new' && styles.activeTab]}
                            onPress={() => setMode('new')}
                        >
                            <Text style={[styles.tabText, mode === 'new' && styles.activeTabText]}>New Customer</Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'existing' ? (
                        <View style={styles.content}>
                            <View style={styles.searchBar}>
                                <Search size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search name or mobile..."
                                    value={search}
                                    onChangeText={setSearch}
                                    autoFocus={false}
                                />
                            </View>

                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={item => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.customerItem}
                                        onPress={() => {
                                            onSelect(item);
                                            resetForm();
                                        }}
                                    >
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.customerName}>{item.name}</Text>
                                            <Text style={styles.customerMobile}>{item.mobile}</Text>
                                        </View>
                                        <View style={styles.selectBtn}>
                                            <Text style={styles.selectBtnText}>Select</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyText}>No customers found.</Text>
                                        <TouchableOpacity onPress={() => setMode('new')}>
                                            <Text style={styles.linkText}>Create New Customer</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            />
                        </View>
                    ) : (
                        <View style={styles.content}>
                            <View style={styles.formGroup}>
                                <View style={styles.inputRow}>
                                    <User size={20} color={Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Customer Name"
                                        value={newCustomer.name}
                                        onChangeText={val => setNewCustomer(prev => ({ ...prev, name: val }))}
                                    />
                                </View>
                                <View style={styles.inputRow}>
                                    <Phone size={20} color={Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mobile Number"
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        value={newCustomer.mobile}
                                        onChangeText={val => setNewCustomer(prev => ({ ...prev, mobile: val }))}
                                    />
                                </View>
                                <View style={styles.inputRow}>
                                    <MapPin size={20} color={Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Location (Optional)"
                                        value={newCustomer.location}
                                        onChangeText={val => setNewCustomer(prev => ({ ...prev, location: val }))}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.confirmBtn,
                                    (!newCustomer.name || !newCustomer.mobile) && styles.disabledBtn
                                ]}
                                disabled={!newCustomer.name || !newCustomer.mobile}
                                onPress={handleConfirmNew}
                            >
                                <Text style={styles.confirmBtnText}>Add & Select Customer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: SCREEN_HEIGHT * 0.75, // Takes up 75% of screen
        ...Shadow.large
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary
    },
    closeBtn: {
        padding: 4
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        marginRight: Spacing.xl,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: Colors.primary
    },
    tabText: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textSecondary
    },
    activeTabText: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold'
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 50,
        marginBottom: Spacing.md
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary
    },
    customerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.primary
    },
    customerName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary
    },
    customerMobile: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2
    },
    selectBtn: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    selectBtnText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textPrimary
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 40
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 8
    },
    linkText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: Colors.primary
    },
    formGroup: {
        gap: Spacing.md
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 54
    },
    input: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary
    },
    confirmBtn: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
        ...Shadow.medium
    },
    disabledBtn: {
        backgroundColor: '#E5E7EB',
        elevation: 0,
        shadowOpacity: 0
    },
    confirmBtnText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.white
    }
});

export default CustomerSelectionModal;
