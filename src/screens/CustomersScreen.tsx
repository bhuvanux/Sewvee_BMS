import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Dimensions
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import { Plus, Search, ChevronRight, User, Phone, ShoppingBag } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent } from '../config/firebase';

const { width } = Dimensions.get('window');

const CustomersScreen = ({ navigation }: any) => {
    const { customers } = useData();
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.mobile.includes(search)
    ).sort((a, b) => a.name.localeCompare(b.name));

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.customerCard}
            onPress={() => navigation.navigate('CustomerDetail', { customer: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <View style={styles.mobileRow}>
                        <Phone size={12} color={Colors.textSecondary} />
                        <Text style={styles.customerMobile}>{item.mobile}</Text>
                    </View>
                </View>
                <View style={[styles.badgeContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={styles.badgeText}>{(item.displayId || item.id).replace(/^#/, '')}</Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.statsContainer}>
                    <ShoppingBag size={14} color={Colors.primary} />
                    <Text style={styles.statsText}>{item.totalOrders || 0} Orders</Text>
                </View>
                <ChevronRight size={18} color={Colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <Text style={styles.screenTitle}>Clients</Text>
                    <Text style={styles.headerSub}>{customers.length} total customers</Text>
                </View>

                <View style={styles.searchBar}>
                    <Search size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholderTextColor={Colors.textSecondary}
                        placeholder="Search Clients..."
                        value={search}
                        onChangeText={(text) => {
                            setSearch(text);
                            if (text.length > 2) {
                                logEvent('customer_search', { query: text });
                            }
                        }}
                    />
                </View>
            </View>

            <FlatList
                data={filteredCustomers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <User size={60} color={Colors.border} />
                        <Text style={styles.emptyText}>No customers found</Text>
                        <Text style={styles.emptySub}>Try searching with a different name or number</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    logEvent('add_customer_click');
                    navigation.navigate('AddCustomer');
                }}
            >
                <Plus size={24} color={Colors.white} />
                <Text style={styles.fabText}>Add Client</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xs,
        backgroundColor: Colors.white,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    screenTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
    },
    headerSub: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 50,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 120,
    },
    customerCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    headerLeft: {
        flex: 1,
    },
    customerName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    mobileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    customerMobile: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    badgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.primary,
    },
    fab: {
        position: 'absolute',
        bottom: 110,
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
        paddingVertical: 100,
        gap: 16,
    },
    emptyText: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textSecondary,
    },
    emptySub: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    }
});

export default CustomersScreen;
