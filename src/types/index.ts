export interface Company {
    id: string;
    name: string;
    address: string;
    phone: string;
    gstin?: string;
    ownerId: string;
}

export interface MeasurementHistoryItem {
    id: string;
    date: string;
    type: string;
    data: MeasurementProfile;
    timestamp?: number;
}

export interface Customer {
    id: string;
    displayId?: string;
    name: string;
    mobile: string;
    location?: string;
    companyId: string;
    totalOrders: number;
    totalSpent: number;
    createdAt: any;
    measurementHistory?: MeasurementHistoryItem[];
}

export interface OrderItem {
    id: string;
    name: string;
    qty: number;
    rate: number;
    amount: number;
    description?: string;
    deliveryDate?: string;
    status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
}

export type OrderStatus = 'Pending' | 'In Progress' | 'Trial' | 'Completed' | 'Overdue' | 'Active' | 'Cancelled' | 'Paid' | 'Partial' | 'Due';

export interface Order {
    id: string;
    billNo: string;
    customerId: string;
    customerName: string;
    customerMobile: string;
    companyId: string;
    items: OrderItem[];
    outfits?: OutfitItem[]; // New field for detailed breakdown
    subtotal: number;
    advance: number;
    total: number;
    balance: number;
    status: OrderStatus;
    paymentStatus?: string;
    notes?: string;
    deliveryDate?: any;
    trialDate?: any;
    date: any;
    time?: any;
    createdAt: any;
    updatedAt?: any;
    urgency?: string;
    orderType?: string;
}

export interface Payment {
    id: string;
    orderId: string;
    customerId: string;
    amount: number;
    mode: string;
    date: any;
    time?: any;
}

// Unified Order Flow Types
export interface MeasurementProfile {
    [key: string]: string;
}

export interface CostItem {
    id: string;
    name: string;
    cost: number;
}

export interface OutfitItem {
    id: string;
    type: string; // "Blouse", "Kurta", etc.
    subtype?: string; // "Lining", "Standard"
    qty: number;
    fabricSource: 'Customer' | 'Boutique';
    trialDate?: string;
    deliveryDate: string;
    measurements: MeasurementProfile;
    costItems: CostItem[];
    images: string[];
    voiceNote?: string;
    audioUri?: string; // Standardized URI field
    transcription?: string; // AI Transcribed text
    sketchUri?: string; // Legacy single sketch
    sketches?: string[]; // Multiple sketches support
    notes?: string;
    totalCost: number;
    status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface OutfitOption {
    id: string;
    name: string;
    image?: string;
}

export interface OutfitSubCategory {
    id: string;
    name: string;
    image?: string | null;
    options: OutfitOption[];
}

export interface OutfitCategory {
    id: string;
    name: string;
    image?: string | null;
    isVisible: boolean;
    subCategories: OutfitSubCategory[];
}

export interface Outfit {
    id: string;
    name: string;
    image?: string | null;
    isVisible: boolean;
    categories: OutfitCategory[];
    order?: number;
    createdAt?: string;
}
