import {
    Users,
    CreditCard,
    Activity,
    TrendingUp,
    DollarSign,
    UserCheck,
    UserX
} from 'lucide-react';

export const kpiData = [
    { title: 'Total Clients', value: '1,250', trend: '3.8%', trendIsPositive: true, icon: Users },
    { title: 'Active Clients', value: '980', trend: '3.8%', trendIsPositive: true, icon: UserCheck },
    { title: 'Paid Clients', value: '850', trend: '3.8%', trendIsPositive: true, icon: DollarSign },
    { title: 'DAU / MAU', value: '1.2k / 8.9k', trend: '', trendIsPositive: true, icon: Activity },
    { title: 'Avg Users per Boutique', value: '7.2%', trend: '3.8%', trendIsPositive: true, icon: Users },
    { title: 'NRR', value: '112%', trend: '2.5%', trendIsPositive: true, icon: TrendingUp },
    { title: 'New MRR', value: '₹18,200', trend: '', trendIsPositive: true, icon: CreditCard }, // No trend shown in valid mock
    { title: 'Churn Rate (Client or MRR)', value: '2.1%', trend: '0.6%', trendIsPositive: false, icon: UserX },
];

export const revenueData = [
    { name: 'MON', value: 8000 },
    { name: 'TUE', value: 6000 },
    { name: 'WED', value: 13000 },
    { name: 'THU', value: 11000 },
    { name: 'FRI', value: 7000 },
    { name: 'SAT', value: 13000 },
    { name: 'SUN', value: 10000 },
];

export const revenueMeta = {
    totalMRR: '₹1,56,543.00',
    mrrGrowth: '12.5%',
    arr: '₹1.51M'
};

export const clientSegmentationData = [
    { name: 'Professional', value: 850, color: '#0E9F8A' }, // Primary Green
    { name: 'Trial', value: 200, color: '#A855F7' }, // Purple
    { name: 'Churned', value: 50, color: '#FF5C00' }, // Orange
];

export const activationFunnelData = [
    { name: 'Boutique Onboarded', value: 221, color: '#D8B4FE' }, // Light Purple
    { name: 'First Client Added', value: 123, color: '#C084FC' }, // Medium Purple
    { name: 'First Order Created', value: 91, color: '#A855F7' }, // Purple
    { name: 'First Campaign Sent', value: 65, color: '#9333EA' }, // Dark Purple
];

export const clientAdoptionData = [
    { city: 'Chennai', value: 423 },
    { city: 'Hyderabad', value: 365 },
    { city: 'Delhi', value: 456 },
    { city: 'Noida', value: 189 },
    { city: 'Kochi', value: 321 },
    { city: 'Mumbai', value: 453 },
];

export const topClientsData = [
    { name: 'Chic Couture', plan: 'Professional', mrr: '₹499', newUsers: 32, activeUsers: 152, orders: 78, health: 90, paymentReliability: '98%' },
    { name: 'Modern Threads', plan: 'Professional', mrr: '₹199', newUsers: 23, activeUsers: 85, orders: 65, health: 70, paymentReliability: '92%' },
    { name: 'The Dapper Den', plan: 'Professional', mrr: '₹199', newUsers: 17, activeUsers: 60, orders: 45, health: 80, paymentReliability: '88%' },
    { name: 'Velvet Vogue', plan: 'Trial', mrr: '₹49', newUsers: 8, activeUsers: 25, orders: 18, health: 40, paymentReliability: '80%' },
];

export const topOutfitsData = [
    { name: "Men's Suit", value: 2789, percentage: '35%', color: '#FCD34D' }, // Yellow
    { name: 'Kurta Pajama', value: 1795, percentage: '30%', color: '#A855F7' }, // Purple
    { name: 'Pants', value: 790, percentage: '25%', color: '#FF5C00' }, // Orange
    { name: 'Kurta', value: 687, percentage: '10%', color: '#0E9F8A' }, // Green
];

export const reportsData = [
    { id: 'RPT-001', name: 'Monthly Financial Summary', type: 'Finance', date: 'Oct 01, 2024', status: 'Ready', size: '2.4 MB' },
    { id: 'RPT-002', name: 'User Engagement Report', type: 'Analytics', date: 'Sep 28, 2024', status: 'Ready', size: '1.8 MB' },
    { id: 'RPT-003', name: 'Q3 Sales Performance', type: 'Sales', date: 'Sep 25, 2024', status: 'Processing', size: '-' },
    { id: 'RPT-004', name: 'Inventory Status', type: 'Inventory', date: 'Sep 20, 2024', status: 'Ready', size: '3.1 MB' },
    { id: 'RPT-005', name: 'Customer Churn Analysis', type: 'Analytics', date: 'Sep 15, 2024', status: 'Failed', size: '-' },
];

export const analyticsKPIs = [
    { title: 'Total Visits', value: '1.2M', icon: 'Eye', trend: '8%', trendIsPositive: true },
    { title: 'Avg. Session Duration', value: '4m 32s', icon: 'Clock', trend: '12%', trendIsPositive: true },
    { title: 'Bounce Rate', value: '42%', icon: 'Activity', trend: '5%', trendIsPositive: true }, // lower bounce rate is good, so "positive" trend implies improvement (down)? Or visually green. Let's assume green.
    { title: 'Conversion Rate', value: '3.2%', icon: 'TrendingUp', trend: '0.4%', trendIsPositive: true },
];

export const productInterestData = [
    { name: 'Saree', value: 45, color: '#FF5C00' },
    { name: 'Kurta', value: 30, color: '#10B981' },
    { name: 'Lehenga', value: 15, color: '#3B82F6' },
    { name: 'Blouse', value: 10, color: '#F59E0B' },
];

export const trafficSourceData = [
    { source: 'Direct', visitors: '450k', bounceRate: '35%', conversion: '4.5%' },
    { source: 'Social Media', visitors: '320k', bounceRate: '45%', conversion: '2.8%' },
    { source: 'Organic Search', visitors: '280k', bounceRate: '38%', conversion: '3.9%' },
    { source: 'Referral', visitors: '150k', bounceRate: '25%', conversion: '6.2%' },
];

export const demographicData = [
    { age: '18-24', percentage: 15 },
    { age: '25-34', percentage: 45 },
    { age: '35-44', percentage: 25 },
    { age: '45+', percentage: 15 },
];

export const paymentsKPIs = [
    { title: 'Total Revenue', value: '₹12.5M', icon: 'TrendingUp', trend: '12%', trendIsPositive: true },
    { title: 'Active Subscriptions', value: '234', icon: 'Repeat', trend: '5%', trendIsPositive: true },
    { title: 'Pending Refunds', value: '₹12,450', icon: 'RotateCcw', trend: null, trendIsPositive: true },
    { title: 'Failed Transactions', value: '12', icon: 'AlertCircle', trend: '2%', trendIsPositive: false },
];

export const paymentMethodsData = [
    { name: 'Credit Card', value: 65, color: '#3B82F6' },
    { name: 'UPI', value: 25, color: '#10B981' },
    { name: 'Net Banking', value: 10, color: '#F59E0B' },
];

export const recentTransactions = [
    { id: 'TXN-1001', client: 'Chic Boutique', amount: '₹9,000', date: 'Oct 24, 2024', status: 'Success', method: 'UPI' },
    { id: 'TXN-1002', client: 'Urban Style', amount: '₹12,500', date: 'Oct 24, 2024', status: 'Pending', method: 'Credit Card' },
    { id: 'TXN-1003', client: 'Fashion Hub', amount: '₹4,500', date: 'Oct 23, 2024', status: 'Failed', method: 'Net Banking' },
    { id: 'TXN-1004', client: 'Trend Setter', amount: '₹8,000', date: 'Oct 23, 2024', status: 'Success', method: 'UPI' },
    { id: 'TXN-1005', client: 'Elite Wear', amount: '₹15,000', date: 'Oct 22, 2024', status: 'Success', method: 'Credit Card' },
    { id: 'TXN-1006', client: 'Style Icon', amount: '₹6,200', date: 'Oct 22, 2024', status: 'Refunded', method: 'UPI' },
];

export const revenueOverTimeData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
];

export const clientDetailData = {
    id: '1',
    name: 'Chic Boutique',
    location: 'Koramangala, Bengaluru - 560095',
    isPremium: true,
    plan: 'Professional',
    planPrice: '₹900/month',
    memberSince: 'January 1, 2025',
    nextBilling: 'December 31, 2025',
    phone: '+91-63452 67132',
    email: 'chicboutique@gmail.com',
    status: 'Active',
    stats: [
        { title: 'Total Staff', value: '22', trend: '23%', trendIsPositive: true, icon: 'Users' },
        { title: 'Order Growth', value: '650', trend: '12%', trendIsPositive: true, icon: 'TrendingUp' }, // Using TrendingUp for Order Growth
        { title: 'Active Customers', value: '120', trend: '0.6%', trendIsPositive: true, icon: 'Activity' },
        { title: 'Total Orders', value: '8,765', trend: null, trendIsPositive: true, icon: 'ShoppingBag' }
    ],
    performance: {
        totalLifetimeRevenue: '₹1,250,000',
        thisWeekRevenue: '₹4,540',
        weekTrend: '16%',
        chartData: [
            { day: 'MON', value: 800 },
            { day: 'TUE', value: 1200 },
            { day: 'WED', value: 900 },
            { day: 'THU', value: 1500 },
            { day: 'FRI', value: 1300 },
            { day: 'SAT', value: 998 },
            { day: 'SUN', value: 1100 },
        ]
    },
    financials: {
        invoices: [
            { id: '#INV-1014', date: '01-01-2024', amount: '₹10,800', status: 'Paid' },
            { id: '#INV-1013', date: '01-01-2023', amount: '₹900', status: 'Paid' },
            { id: '#INV-1012', date: '01-02-2022', amount: '₹900', status: 'Paid' },
            { id: '#INV-1011', date: '01-01-2022', amount: '₹900', status: 'Paid' },
        ]
    },
    timeline: [
        { title: 'New Order #2024005 placed by Jane Doe', subtitle: 'Order - 2024-07-28 11:45 PM', amount: '₹1,120', icon: 'ShoppingCart' },
        { title: 'New customer John Smith registered', subtitle: 'Customer - 2024-07-28 10:10 AM', icon: 'UserPlus' },
        { title: 'Payment received for Order #2024004', subtitle: 'Payment - 2024-07-27 02:20 PM', amount: '₹75,00', icon: 'CreditCard' },
        { title: 'Boutique \'Fashion Forward\' updated contact information', subtitle: 'Profile Update - 2024-07-27 10:30 AM', icon: 'Edit' },
        { title: 'New customer Gowtham registered', subtitle: 'Profile Update - 2024-07-27 10:30 AM', icon: 'UserPlus' },
    ]
};

export const clientsData = [
    {
        id: '1',
        name: 'Chic Boutique',
        isPremium: true,
        address: 'Koramangala, Bengaluru',
        phone: '+91-13624 76543',
        email: 'tanujaabhil@gmail.com',
        lastActive: '5hrs ago',
        activeUsers: 120,
        totalOrders: '8,765',
        staff: 22,
        ordersThisMonth: 143,
        health: 92,
        status: 'Active'
    },
    {
        id: '2',
        name: 'Ayushdhyan',
        isPremium: true,
        address: 'Koramangala, Bengaluru',
        phone: '+91-10906 89012',
        email: 'ayushdhyan@gmail.com',
        lastActive: '5hrs ago',
        activeUsers: 6,
        totalOrders: '234',
        staff: 1,
        ordersThisMonth: 2,
        health: 45,
        status: 'Active'
    },
    {
        id: '3',
        name: 'Surya Kala',
        isPremium: true,
        address: 'Koramangala, Bengaluru',
        phone: '+91-52346 87654',
        email: 'alice.j@gmail.com',
        lastActive: '5hrs ago',
        activeUsers: 8,
        totalOrders: '85',
        staff: 5,
        ordersThisMonth: 32,
        health: 88,
        status: 'Active'
    },
    {
        id: '4',
        name: 'Lekha D',
        isPremium: false,
        address: 'Koramangala, Bengaluru',
        phone: '+91-35162 32109',
        email: 'suryakala@gmail.com',
        lastActive: '1 week ago',
        activeUsers: 1,
        totalOrders: '0',
        staff: 1,
        ordersThisMonth: 0,
        health: 12,
        status: 'Inactive'
    },
    {
        id: '5',
        name: 'Sham Kumar',
        isPremium: true,
        address: 'Koramangala, Bengaluru',
        phone: '+91-32109 01234',
        email: 'sham@gmail.com',
        lastActive: '1 day ago',
        activeUsers: 9,
        totalOrders: '14',
        staff: 2,
        ordersThisMonth: 15,
        health: 78,
        status: 'Active'
    },
    {
        id: '6',
        name: 'Sumit Bose',
        isPremium: true,
        address: 'Koramangala, Bengaluru',
        phone: '+91-31345 67890',
        email: 'sumitbose@gmail.com',
        lastActive: '1hrs ago',
        activeUsers: 12,
        totalOrders: '123',
        staff: 4,
        ordersThisMonth: 24,
        health: 65,
        status: 'Active'
    },
    {
        id: '7',
        name: 'Vignesh',
        isPremium: true,
        address: 'Koramangala, Bengaluru',
        phone: '+91-41123 12345',
        email: 'vignesh@gmail.com',
        lastActive: '1hrs ago',
        activeUsers: 8,
        totalOrders: '124',
        staff: 4,
        ordersThisMonth: 18,
        health: 82,
        status: 'Active'
    },
    {
        id: '8',
        name: 'Jeevan Das',
        isPremium: false,
        address: 'Koramangala, Bengaluru',
        phone: '+91-24136 54321',
        email: 'jeevandas@gmail.com',
        lastActive: '12hrs ago',
        activeUsers: 2,
        totalOrders: '234',
        staff: 2,
        ordersThisMonth: 1,
        health: 30,
        status: 'Active'
    }
];

export const clientKPIs = [
    { title: 'Total Clients', value: '243', icon: 'Users', trend: null, trendIsPositive: true },
    { title: 'Active Clients', value: '143', icon: 'Activity', trend: '3%', trendIsPositive: false, suffix: 'vs last month' },
    { title: 'Pending Onboarding', value: '43', icon: 'Clock', trend: null, trendIsPositive: true },
    { title: 'New Clients This Month', value: '23', icon: 'UserPlus', trend: '2%', trendIsPositive: true, suffix: 'vs last month' },
];

export const onboardingDropoffData = [
    { stage: 'Campaign Setup', value: 29, color: '#FF5C00' },
    { stage: 'Staff Added', value: 41, color: '#A855F7' },
    { stage: 'Payments Setup', value: 52, color: '#3B82F6' },
    { stage: 'Catalog', value: 68, color: '#0E9F8A' },
];
