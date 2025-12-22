import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform
} from 'react-native';
import { Colors, Spacing, Typography, Shadow } from '../constants/theme';
import {
    Building2,
    ChevronRight,
    LogOut,
    Info,
    HelpCircle,
    Share2,
    Phone,
    Mail,
    User,
    Edit3,
    ReceiptIndianRupee,
    Scissors,
    ShieldCheck
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logEvent } from '../config/firebase';

const SettingsScreen = ({ navigation }: any) => {
    const { company, user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [logoutVisible, setLogoutVisible] = React.useState(false);

    const handleLogout = () => {
        logEvent('logout_initiated');
        setLogoutVisible(true);
    };

    const SettingItem = ({ icon: Icon, title, value, onPress, isLast = false, color = Colors.primary }: any) => (
        <TouchableOpacity
            style={[styles.item, isLast && styles.itemLast]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                    <Icon size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    {value && <Text style={styles.itemValue} numberOfLines={1}>{value}</Text>}
                </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <View style={styles.profileSection}>
                <View style={styles.profileCard}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>{company?.name?.substring(0, 2).toUpperCase() || 'BT'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editBadge}
                            onPress={() => {
                                logEvent('settings_profile_edit_click');
                                navigation.navigate('EditBusinessProfile');
                            }}
                        >
                            <Edit3 size={14} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={Typography.h2}>{company?.name || 'My Boutique'}</Text>
                        <Text style={styles.userMobile}>{company?.phone || user?.mobile || 'No Mobile'}</Text>
                        {company?.email && <Text style={styles.userEmail}>{company.email}</Text>}
                    </View>
                    <TouchableOpacity
                        style={styles.editProfileBtn}
                        onPress={() => navigation.navigate('EditBusinessProfile')}
                    >
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Company Profile</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon={Building2}
                        title="Business Details"
                        value={company?.address || 'Set Address'}
                        onPress={() => navigation.navigate('EditBusinessProfile')}
                    />
                    <SettingItem
                        icon={ReceiptIndianRupee}
                        title="Bill Settings"
                        value="Terms, Signature & more"
                        onPress={() => navigation.navigate('BillSettings')}
                        isLast={true}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Outfit Management</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon={Scissors}
                        title="Manage Outfits"
                        value="Add, Edit, Types"
                        onPress={() => navigation.navigate('ManageOutfits')}
                        color="#EC4899"
                        isLast={true}
                    />
                </View>
            </View>



            <View style={styles.section}>
                <Text style={styles.sectionLabel}>App Settings</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon={Share2}
                        title="Share App"
                        color="#8B5CF6"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon={HelpCircle}
                        title="Help & Support"
                        color="#F59E0B"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon={Info}
                        title="About Sewvee Mini"
                        color="#6B7280"
                        value="v1.0.2"
                        onPress={() => { }}
                        isLast={true}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={20} color={Colors.danger} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Handcrafted for Boutiques</Text>
                <Text style={styles.versionText}>Powered by Sewvee</Text>
            </View>

            <View style={{ height: 40 }} />

            <SuccessModal
                visible={logoutVisible}
                onClose={() => setLogoutVisible(false)}
                title="Logout"
                description="Are you sure you want to logout? You will need to log in again to access your data."
                type="warning"
                confirmText="Logout"
                onConfirm={logout}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        backgroundColor: Colors.white,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
    },
    profileSection: {
        padding: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    logoContainer: {
        position: 'relative',
    },
    logoPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: Colors.primaryDark,
    },
    editBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: Colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    profileInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    userMobile: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    userEmail: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    editProfileBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    editProfileText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.primary,
    },
    section: {
        padding: Spacing.md,
        marginTop: Spacing.xs,
    },
    sectionLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 10,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        ...Shadow.subtle,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemLast: {
        borderBottomWidth: 0,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    itemValue: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        margin: Spacing.md,
        marginTop: Spacing.lg,
        height: 54,
        borderRadius: 16,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.danger + '30',
    },
    logoutText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.danger,
    },
    footer: {
        alignItems: 'center',
        marginTop: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    footerText: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    versionText: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 4,
        opacity: 0.7,
    }
});

export default SettingsScreen;
