import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutGrid, Users, ReceiptIndianRupee, CreditCard, Settings, User, ShoppingBag } from 'lucide-react-native';
import { View, Text, ActivityIndicator, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';

const PlaceholderScreen = (name: string) => () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{name} Screen</Text>
    </View>
);

// Screens

import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CustomersScreen from '../screens/CustomersScreen';
import AddCustomerScreen from '../screens/AddCustomerScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import CreateOrderFlowScreen from '../screens/CreateOrderFlowScreen';
import OrdersListScreen from '../screens/OrdersListScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditBusinessProfileScreen from '../screens/EditBusinessProfileScreen';
import BillSettingsScreen from '../screens/BillSettingsScreen';
import ManageOutfitsScreen from '../screens/ManageOutfitsScreen';
import OutfitCategoriesScreen from '../screens/OutfitCategoriesScreen';
import EditCategoryScreen from '../screens/EditCategoryScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import ForgotPinScreen from '../screens/ForgotPinScreen';
import ResetPinScreen from '../screens/ResetPinScreen';
import ShareAppScreen from '../screens/ShareAppScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutScreen from '../screens/AboutScreen';
import DevSettingsScreen from '../screens/DevSettingsScreen';


const CustomerStack = createNativeStackNavigator();
function CustomerNavigator() {
    return (
        <CustomerStack.Navigator screenOptions={{
            headerStyle: { backgroundColor: Colors.white },
            headerTitleStyle: { fontFamily: 'Inter-SemiBold', fontSize: 18 }
        }}>
            <CustomerStack.Screen name="CustomerList" component={CustomersScreen} options={{ headerShown: false, title: 'Customers' }} />
            <CustomerStack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: 'Add Customer' }} />
        </CustomerStack.Navigator>
    );
}

// Navigator imports
import OrderDetailScreen from '../screens/OrderDetailScreen';

const OrderStack = createNativeStackNavigator();
function OrderNavigator() {
    return (
        <OrderStack.Navigator screenOptions={{
            headerStyle: { backgroundColor: Colors.white },
            headerTitleStyle: { fontFamily: 'Inter-SemiBold', fontSize: 18 }
        }}>
            <OrderStack.Screen name="OrderList" component={OrdersListScreen} options={{ headerShown: false, title: 'Orders' }} />
        </OrderStack.Navigator>
    );
}



const AuthStack = createNativeStackNavigator();
function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Signup" component={SignupScreen} />
            <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
            <AuthStack.Screen name="ForgotPin" component={ForgotPinScreen} />
            <AuthStack.Screen name="ResetPin" component={ResetPinScreen} />
        </AuthStack.Navigator>
    );
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    backgroundColor: '#1E293B',
                    borderTopWidth: 1,
                    borderTopColor: '#334155',
                    height: 65 + insets.bottom,
                    paddingTop: 12,
                    paddingBottom: insets.bottom + 4,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Inter-Medium',
                    fontSize: 11,
                    marginTop: 4,
                },
                headerShown: false
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.tabIconContainer, focused && styles.activeTabBg]}>
                            <LayoutGrid size={24} color={focused ? '#FFF' : color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Customers"
                component={CustomerNavigator}
                options={{
                    tabBarLabel: 'Clients',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.tabIconContainer, focused && styles.activeTabBg]}>
                            <Users size={24} color={focused ? '#FFF' : color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrderNavigator}
                options={{
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.tabIconContainer, focused && styles.activeTabBg]}>
                            <ShoppingBag size={24} color={focused ? '#FFF' : color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Payments"
                component={PaymentsScreen}
                options={{
                    tabBarLabel: 'Payment',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.tabIconContainer, focused && styles.activeTabBg]}>
                            <CreditCard size={24} color={focused ? '#FFF' : color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                    headerShown: false,
                    headerTitle: 'Payments'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.tabIconContainer, focused && styles.activeTabBg]}>
                            <User size={24} color={focused ? '#FFF' : color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    activeTabBg: {
        backgroundColor: Colors.primary,
    },
});

import { useAuth } from '../context/AuthContext';

export default function RootNavigator() {
    const { user, company, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Auth" component={AuthNavigator} />
            ) : !user.isPhoneVerified ? (
                <Stack.Screen
                    name="VerifyPhone"
                    component={VerifyOtpScreen}
                    initialParams={{ phone: user.phone, type: 'signup' }}
                />
            ) : !company ? (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
                <>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ headerShown: true, title: 'Client Details' }} />
                    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: true, title: 'Order Details' }} />
                    <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ headerShown: true, title: 'New Order' }} />
                    <Stack.Screen name="CreateOrderFlow" component={CreateOrderFlowScreen} options={{ headerShown: false, title: 'Create New Order' }} />
                    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ManageOutfits" component={ManageOutfitsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="OutfitCategories" component={OutfitCategoriesScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="EditCategory" component={EditCategoryScreen} options={{ headerShown: false }} />

                    {/* Settings Screens */}
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="EditBusinessProfile" component={EditBusinessProfileScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="BillSettings" component={BillSettingsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ShareApp" component={ShareAppScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="DevSettings" component={DevSettingsScreen} options={{ headerShown: false }} />
                </>
            )}
        </Stack.Navigator>
    );
}
