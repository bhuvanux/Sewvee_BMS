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
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import ForgotPinScreen from '../screens/ForgotPinScreen';
import ResetPinScreen from '../screens/ResetPinScreen';


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

const SettingsStack = createNativeStackNavigator();
function SettingsNavigator() {
    return (
        <SettingsStack.Navigator screenOptions={{
            headerShown: false
        }}>
            <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
            <SettingsStack.Screen name="EditBusinessProfile" component={EditBusinessProfileScreen} />
            <SettingsStack.Screen name="BillSettings" component={BillSettingsScreen} />

        </SettingsStack.Navigator>
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
                    position: 'absolute',
                    backgroundColor: '#121212',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 90 : (60 + (insets.bottom > 0 ? insets.bottom - 10 : 0)),
                    marginHorizontal: 16,
                    marginBottom: Platform.OS === 'ios' ? 30 : (insets.bottom > 0 ? insets.bottom : 16),
                    borderRadius: 25,
                    paddingBottom: Platform.OS === 'ios' ? 25 : (insets.bottom > 0 ? 10 : 10),
                    paddingTop: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.25,
                    shadowRadius: 20,
                    elevation: 10,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 12,
                    marginTop: 2,
                    marginBottom: Platform.OS === 'ios' ? 0 : 5,
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
                        <View style={focused ? styles.activeTabContainer : styles.tabIconContainer}>
                            <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={[styles.activeDot, { backgroundColor: '#FFFFFF' }]} />}
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
                        <View style={focused ? styles.activeTabContainer : styles.tabIconContainer}>
                            <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={[styles.activeDot, { backgroundColor: '#FFFFFF' }]} />}
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
                        <View style={focused ? styles.activeTabContainer : styles.tabIconContainer}>
                            <ShoppingBag size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={[styles.activeDot, { backgroundColor: '#FFFFFF' }]} />}
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
                        <View style={focused ? styles.activeTabContainer : styles.tabIconContainer}>
                            <CreditCard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={[styles.activeDot, { backgroundColor: '#FFFFFF' }]} />}
                        </View>
                    ),
                    headerShown: false,
                    headerTitle: 'Payments'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsNavigator}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeTabContainer : styles.tabIconContainer}>
                            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                            {focused && <View style={[styles.activeDot, { backgroundColor: '#FFFFFF' }]} />}
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
    },
    activeTabContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 2,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginTop: 4,
    }
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
                    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: true, title: 'Bill Details' }} />
                    <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ headerShown: true, title: 'New Bill' }} />
                    <Stack.Screen name="CreateOrderFlow" component={CreateOrderFlowScreen} options={{ headerShown: true, title: 'Create New Order' }} />
                    <Stack.Screen name="ManageOutfits" component={ManageOutfitsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="OutfitCategories" component={OutfitCategoriesScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="EditCategory" component={EditCategoryScreen} options={{ headerShown: false }} />
                </>
            )}
        </Stack.Navigator>
    );
}
