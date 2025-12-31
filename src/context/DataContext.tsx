import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { COLLECTIONS, IS_STAGING } from '../config/firebase';
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    setDoc,
    addDoc,
    deleteDoc,
    writeBatch,
    increment,
    serverTimestamp
} from '@react-native-firebase/firestore';
import { getCurrentDate } from '../utils/dateUtils';
import { Customer, Order, Payment, Outfit } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
    customers: Customer[];
    orders: Order[];
    payments: Payment[];
    outfits: Outfit[];
    loading: boolean;
    addCustomer: (customer: Partial<Customer>) => Promise<Customer>;
    updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    addOrder: (order: Partial<Order>) => Promise<Order>;
    updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    addPayment: (payment: Partial<Payment>) => Promise<void>;
    updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;
    addOutfit: (outfit: Partial<Outfit>) => Promise<void>;
    updateOutfit: (id: string, outfit: Partial<Outfit>) => Promise<void>;
    deleteOutfit: (id: string) => Promise<void>;
    reorderOutfits: (outfits: Outfit[]) => Promise<void>;
    getCustomerOrders: (customerId: string) => Order[];
    cancelItem: (orderId: string, itemIndex: number) => Promise<void>;
    refreshData: () => Promise<void>;
    resetEnvironment: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

// --- NEW DEFAULT OUTFITS (V2) - APPROVED STRUCTURE ---
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
const createOption = (name: string) => ({ id: generateId('opt'), name });
const createSubCat = (name: string, options: string[] = []) => ({
    id: generateId('sub'),
    name,
    options: options.map(o => createOption(o))
});
const createCat = (name: string, subCats: { name: string, options?: string[] }[]) => ({
    id: generateId('cat'),
    name,
    isVisible: true,
    subCategories: subCats.map(sc => createSubCat(sc.name, sc.options))
});

export const DEFAULT_OUTFITS = [
    // 1. CHUDI
    {
        name: 'Chudi',
        category: 'Stitching',
        basePrice: 0,
        isVisible: true,
        categories: [
            createCat('Top', [
                { name: 'Side slit top' },
                { name: 'Side slit chudi top' },
                { name: 'A-line top' },
                { name: 'Pumrod top' },
                { name: 'Umbrella top' }
            ]),
            createCat('Pant', [
                { name: 'Straight cut pant' },
                { name: 'Semi patiyala pant' },
                { name: 'Gathering pant' },
                { name: 'Normal cut pant' }
            ])
        ]
    },
    // 2. LEHENGA
    {
        name: 'Lehenga',
        category: 'Stitching',
        basePrice: 0,
        isVisible: true,
        categories: [
            createCat('Top', [
                { name: 'Dussut top', options: ['Front neck', 'Back neck', 'Sleeve', 'Hook'] },
                { name: 'Normal top', options: ['Front neck', 'Back neck', 'Sleeve', 'Hook'] }
            ]),
            createCat('Skirt', [
                { name: 'Umbrella cut', options: ['Zip', 'Hook', 'Rope'] },
                { name: 'Box pleat', options: ['Zip', 'Hook', 'Rope'] },
                { name: 'Panel cut', options: ['Zip', 'Hook', 'Rope'] },
                { name: 'Pleat one side', options: ['Zip', 'Hook', 'Rope'] }
            ])
        ]
    },
    // 3. BLOUSE
    {
        name: 'Blouse',
        category: 'Stitching',
        basePrice: 0,
        isVisible: true,
        categories: [
            createCat('Back', [
                { name: 'Boat', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'Normal', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'Close neck', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'High neck', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'Collar neck', options: ['Shirt collar', 'Chinese collar', 'High collar', 'Sleek collar', 'Scallop collar', 'Half collar'] },
                { name: 'Semi boat', options: ['Scallop', 'Balls', 'Shapes'] }
            ]),
            createCat('Front', [
                { name: 'Boat', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'Normal', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'Close neck', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'High neck', options: ['Scallop', 'Balls', 'Shapes'] },
                { name: 'V neck', options: ['Scallop', 'Balls', 'Shapes'] }
            ]),
            createCat('Sleeve', [
                { name: 'Elbow', options: ['Net', 'Cloth contrast', 'Border', 'Butterfly sleeve', 'Petal sleeve', 'Flat pleat sleeve', 'Pindix sleeve', 'Puff sleeve', 'Layer sleeve', 'Balloon sleeve'] },
                { name: 'Short', options: ['Net', 'Cloth contrast', 'Border', 'Butterfly sleeve', 'Petal sleeve', 'Flat pleat sleeve', 'Pindix sleeve', 'Puff sleeve', 'Layer sleeve', 'Balloon sleeve'] },
                { name: '3/4th', options: ['Net', 'Cloth contrast', 'Border', 'Butterfly sleeve', 'Petal sleeve', 'Flat pleat sleeve', 'Pindix sleeve', 'Puff sleeve', 'Layer sleeve', 'Balloon sleeve'] },
                { name: 'Full sleeve', options: ['Net', 'Cloth contrast', 'Border', 'Butterfly sleeve', 'Petal sleeve', 'Flat pleat sleeve', 'Pindix sleeve', 'Puff sleeve', 'Layer sleeve', 'Balloon sleeve'] }
            ]),
            createCat('Hook', [
                { name: 'Front' },
                { name: 'Back' },
                { name: 'Zip' }
            ])
        ]
    }
];

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, company } = useAuth();

    // --- PROD: ENSURE DEFAULTS EXIST (IDEMPOTENT) ---
    // Checks for each default outfit by name. If missing, adds it.
    // DOES NOT duplicate if already present. Does NOT rely on collection being empty.
    const ensureProductionDefaults = async (uid: string, existingOutfits: Outfit[]) => {
        const db = getFirestore();
        const batch = writeBatch(db);
        let hasUpdates = false;

        DEFAULT_OUTFITS.forEach((defOutfit) => {
            // Check if user already has an outfit with this name (case-insensitive check for robustness)
            const exists = existingOutfits.some(o => (o.name || '').toLowerCase() === defOutfit.name.toLowerCase());

            if (!exists) {
                console.log(`[Seeding] Missing default: ${defOutfit.name}. Adding...`);
                // Calculate next order index
                const maxOrder = existingOutfits.length > 0 ? Math.max(...existingOutfits.map(o => o.order || 0)) : -1;
                // We append to the end or start? Requirement says "Default presence". 
                // Let's add them with a new ref. Order is less critical than presence, but let's try to append.
                const newRef = doc(collection(db, COLLECTIONS.OUTFITS));
                batch.set(newRef, {
                    ...defOutfit,
                    ownerId: uid,
                    createdAt: new Date().toISOString(),
                    order: maxOrder + 1 // Simply append
                });
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            try {
                await batch.commit();
                console.log('[Seeding] Production defaults checked and applied where missing.');
            } catch (error) {
                console.error('[Seeding] Failed to apply defaults:', error);
            }
        } else {
            console.log('[Seeding] All production defaults already present.');
        }
    };

    // --- RESET LOGIC (STAGING ONLY) ---
    const resetEnvironment = async () => {
        if (!IS_STAGING) {
            console.error("⛔ RESET BLOCKED: Attempted reset in PRODUCTION");
            return;
        }
        if (!user?.uid) return;

        console.log('[Reset] Starting Factory Reset...');
        const db = getFirestore();

        const deleteQueryBatch = async (collectionName: string) => {
            const q = query(collection(db, collectionName), where('ownerId', '==', user.uid));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return;
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            console.log(`[Reset] Wiped ${collectionName}`);
        };

        try {
            await Promise.all([
                deleteQueryBatch(COLLECTIONS.CUSTOMERS),
                deleteQueryBatch(COLLECTIONS.ORDERS),
                deleteQueryBatch(COLLECTIONS.PAYMENTS),
                deleteQueryBatch(COLLECTIONS.OUTFITS)
            ]);
            console.log('[Reset] Factory Reset Complete.');
        } catch (error) {
            console.error('[Reset] Failed:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const db = getFirestore();

        const unsubCustomers = onSnapshot(
            query(collection(db, COLLECTIONS.CUSTOMERS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {
                    const data = snapshot.docs.map((docSnap: any) => ({ id: docSnap.id, ...docSnap.data() } as Customer));
                    data.sort((a: any, b: any) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
                    setCustomers(data);
                }
            }, error => console.error('Customers listener error:', error));

        const unsubOrders = onSnapshot(
            query(collection(db, COLLECTIONS.ORDERS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {
                    const data = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as Order));
                    data.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                    setOrders(data);
                }
            }, error => console.error('Orders listener error:', error));

        const unsubPayments = onSnapshot(
            query(collection(db, COLLECTIONS.PAYMENTS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {
                    const data = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as Payment));
                    data.sort((a: any, b: any) => ((b as any).date || '').localeCompare((a as any).date || ''));
                    setPayments(data);
                }
            }, error => console.error('Payments listener error:', error));

        const unsubOutfits = onSnapshot(
            query(collection(db, COLLECTIONS.OUTFITS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {

                    const data = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as Outfit));

                    // SEEDING CHECK (Run once if loaded)
                    if (user.uid) {
                        ensureProductionDefaults(user.uid, data);
                    }
                    data.sort((a: any, b: any) => {
                        const orderA = a.order ?? 0;
                        const orderB = b.order ?? 0;
                        if (orderA !== orderB) return orderA - orderB;
                        if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
                        return (a.name || '').localeCompare(b.name || '');
                    });
                    setOutfits(data);
                }
                setLoading(false);
            }, error => {
                console.error('Outfits listener error:', error);
                setLoading(false);
            });

        return () => {
            if (unsubCustomers) unsubCustomers();
            if (unsubOrders) unsubOrders();
            if (unsubPayments) unsubPayments();
            if (unsubOutfits) unsubOutfits();
        };
    }, [user?.uid]);

    // Helpers
    const runInBackground = (promise: Promise<any>, context: string) => {
        promise.catch(err => {
            console.error(`[DataContext] ${context} failed (background):`, err);
            Alert.alert(`Sync Error (${context})`, err.message);
        });
    };

    // CRUD Functions (Preserved)
    const addCustomer = async (customer: Partial<Customer>) => {
        if (!user?.uid) throw new Error('Not authenticated');

        const existingIds = customers
            .map(c => c.displayId ? parseInt(c.displayId.replace(/\D/g, '')) : 0)
            .filter(n => !isNaN(n) && n > 0);
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const nextId = maxId + 1;
        const prefix = company?.name ? company.name.substring(0, 2).toUpperCase() : 'CU';
        const nextDisplayId = `${prefix}-${String(nextId).padStart(5, '0')}`;

        const newItem = {
            ...customer,
            ownerId: user.uid,
            totalOrders: 0,
            totalSpent: 0,
            createdAt: new Date().toISOString(),
            displayId: nextDisplayId
        };
        const ref = doc(collection(getFirestore(), COLLECTIONS.CUSTOMERS));
        const finalItem = { id: ref.id, ...newItem } as Customer;
        runInBackground(setDoc(ref, newItem), 'addCustomer');
        return finalItem;
    };

    const updateCustomer = async (id: string, customer: Partial<Customer>) => {
        try {
            await updateDoc(doc(getFirestore(), COLLECTIONS.CUSTOMERS, id), customer);
        } catch (error: any) {
            console.error('[DataContext] updateCustomer failed:', error);
            throw error;
        }
    };

    const deleteCustomer = async (id: string) => {
        try {
            await deleteDoc(doc(getFirestore(), COLLECTIONS.CUSTOMERS, id));
        } catch (error: any) {
            console.error('[DataContext] deleteCustomer failed:', error);
            throw error;
        }
    };

    const addOrder = async (order: Partial<Order>) => {
        if (!user?.uid) throw new Error('Not authenticated');
        const currentYear = new Date().getFullYear().toString();
        const existingOrders = orders.filter(o => o.billNo?.startsWith(currentYear));
        const maxSeq = existingOrders.reduce((max, o) => {
            const parts = o.billNo?.split('/');
            if (parts?.length === 2 && parts[0] === currentYear) {
                const seq = parseInt(parts[1], 10);
                return !isNaN(seq) && seq > max ? seq : max;
            }
            return max;
        }, 0);
        const nextSeq = maxSeq + 1;
        const newBillNo = `${currentYear}/${String(nextSeq).padStart(5, '0')}`;
        const db = getFirestore();
        const orderRef = doc(collection(db, COLLECTIONS.ORDERS));
        const newItem = {
            ...order,
            id: orderRef.id,
            billNo: newBillNo,
            ownerId: user.uid,
            createdAt: new Date().toISOString(),
            time: order.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            status: 'Pending',
            paymentStatus: (order.advance || 0) >= (order.total || 0) ? 'Paid' : (order.advance ? 'Partially Paid' : 'Unpaid'),
            balance: (order.total || 0) - (order.advance || 0)
        };
        const batch = writeBatch(db);
        batch.set(orderRef, newItem);
        if (newItem.customerId) {
            const customerRef = doc(db, COLLECTIONS.CUSTOMERS, newItem.customerId);
            batch.set(customerRef, {
                totalOrders: increment(1),
                totalSpent: increment(newItem.advance || 0),
                lastOrderDate: newItem.createdAt
            }, { merge: true });
        }
        if (newItem.advance && newItem.advance > 0) {
            const paymentRef = doc(collection(db, COLLECTIONS.PAYMENTS));
            batch.set(paymentRef, {
                id: paymentRef.id,
                orderId: orderRef.id,
                billNo: newBillNo,
                customerId: newItem.customerId,
                amount: newItem.advance,
                date: newItem.date || getCurrentDate(),
                time: newItem.time,
                mode: (order as any).advanceMode || 'Cash',
                type: 'Advance',
                ownerId: user.uid
            });
        }
        try {
            await batch.commit();
            return newItem as Order;
        } catch (error: any) {
            console.error('[DataContext] addOrder failed:', error);
            throw error;
        }
    };

    const updateOrder = async (id: string, orderData: Partial<Order>) => {
        let updates: any = { ...orderData };
        const db = getFirestore();
        const docRef = doc(db, COLLECTIONS.ORDERS, id);
        const current = orders.find(o => o.id === id) || {} as Order;
        if (updates.total !== undefined || updates.advance !== undefined) {
            const total = updates.total ?? current.total ?? 0;
            const advance = updates.advance ?? current.advance ?? 0;
            updates.balance = total - advance;
            updates.paymentStatus = advance >= total ? 'Paid' : (advance > 0 ? 'Partially Paid' : 'Unpaid');
        }
        if (!updates.ownerId && user?.uid) updates.ownerId = user.uid;
        if (!updates.createdAt && !current.createdAt) updates.createdAt = new Date().toISOString();

        try {
            await setDoc(docRef, updates, { merge: true });
        } catch (error: any) {
            console.error('[DataContext] updateOrder failed:', error);
            Alert.alert('Sync Error (updateOrder)', error.message);
            throw error;
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            const db = getFirestore();
            const orderRef = doc(db, COLLECTIONS.ORDERS, id);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists) return;
            const orderData = orderSnap.data();
            const batch = writeBatch(db);
            batch.delete(orderRef);
            const q = query(collection(db, COLLECTIONS.PAYMENTS), where('orderId', '==', id));
            const pSnap = await getDocs(q);
            let totalPaidForOrder = 0;
            pSnap.forEach((docSnap: any) => {
                const pData = docSnap.data();
                totalPaidForOrder += (pData.amount || 0);
                batch.delete(docSnap.ref);
            });
            if (orderData?.customerId) {
                const custRef = doc(db, COLLECTIONS.CUSTOMERS, orderData.customerId);
                batch.set(custRef, {
                    totalOrders: increment(-1),
                    totalSpent: increment(-totalPaidForOrder)
                }, { merge: true });
            }
            await batch.commit();
        } catch (error: any) {
            console.error('[DataContext] deleteOrder failed:', error);
            throw error;
        }
    };

    const addPayment = async (payment: Partial<Payment>) => {
        if (!user?.uid) throw new Error('Not authenticated');
        const db = getFirestore();
        const batch = writeBatch(db);
        const paymentRef = doc(collection(db, COLLECTIONS.PAYMENTS));
        const newPayment = { ...payment, ownerId: user.uid, date: new Date().toISOString() };
        batch.set(paymentRef, newPayment);
        if (payment.orderId) {
            const orderRef = doc(db, COLLECTIONS.ORDERS, payment.orderId);
            batch.set(orderRef, { advance: increment(payment.amount || 0), balance: increment(-(payment.amount || 0)) }, { merge: true });
        }
        if (payment.customerId) {
            const custRef = doc(db, COLLECTIONS.CUSTOMERS, payment.customerId);
            batch.set(custRef, { totalSpent: increment(payment.amount || 0) }, { merge: true });
        }
        try {
            await batch.commit();
        } catch (error: any) {
            console.error('[DataContext] addPayment failed:', error);
            throw error;
        }
    };

    const updatePayment = async (id: string, updates: Partial<Payment>) => {
        try {
            const db = getFirestore();
            const paymentDocRef = doc(db, COLLECTIONS.PAYMENTS, id);
            const paymentDocSnap = await getDoc(paymentDocRef);
            if (!paymentDocSnap.exists) return;
            const oldPayment = { id: paymentDocSnap.id, ...paymentDocSnap.data() } as Payment;
            const batch = writeBatch(db);
            batch.update(paymentDocRef, updates);
            if (updates.amount !== undefined && updates.amount !== oldPayment.amount) {
                const newAmount = Number(updates.amount) || 0;
                const oldAmount = Number(oldPayment.amount) || 0;
                const delta = newAmount - oldAmount;
                if (oldPayment.orderId) {
                    const orderRef = doc(db, COLLECTIONS.ORDERS, oldPayment.orderId);
                    batch.set(orderRef, { advance: increment(delta), balance: increment(-delta) }, { merge: true });
                }
                if (oldPayment.customerId) {
                    const custRef = doc(db, COLLECTIONS.CUSTOMERS, oldPayment.customerId);
                    batch.set(custRef, { totalSpent: increment(delta) }, { merge: true });
                }
            }
            await batch.commit();
        } catch (error: any) {
            console.error('[DataContext] updatePayment failed:', error);
            throw error;
        }
    };

    const deletePayment = async (id: string) => {
        try {
            const db = getFirestore();
            const paymentDocRef = doc(db, COLLECTIONS.PAYMENTS, id);
            const paymentDocSnap = await getDoc(paymentDocRef);
            const payment = paymentDocSnap.data() as Payment;
            if (payment && payment.orderId) {
                const batch = writeBatch(db);
                batch.delete(paymentDocRef);
                const orderRef = doc(db, COLLECTIONS.ORDERS, payment.orderId);
                batch.set(orderRef, { advance: increment(-(Number(payment.amount) || 0)), balance: increment(Number(payment.amount) || 0) }, { merge: true });
                if (payment.customerId) {
                    const custRef = doc(db, COLLECTIONS.CUSTOMERS, payment.customerId);
                    batch.set(custRef, { totalSpent: increment(-(Number(payment.amount) || 0)) }, { merge: true });
                }
                await batch.commit();
            } else {
                await deleteDoc(paymentDocRef);
            }
        } catch (error: any) {
            console.error('[DataContext] deletePayment failed:', error);
            throw error;
        }
    };

    const addOutfit = async (outfit: Partial<Outfit>) => {
        if (!user?.uid) throw new Error('Not authenticated');
        const minOrder = outfits.length > 0 ? Math.min(...outfits.map(o => o.order || 0)) : 0;
        const newOrder = minOrder - 1;
        const newOutfit = { ...outfit, ownerId: user.uid, createdAt: new Date().toISOString(), order: newOrder };
        try {
            await addDoc(collection(getFirestore(), COLLECTIONS.OUTFITS), newOutfit);
        } catch (error: any) {
            console.error('[DataContext] addOutfit failed:', error);
            throw error;
        }
    };

    const updateOutfit = async (id: string, outfit: Partial<Outfit>) => {
        try {
            await updateDoc(doc(getFirestore(), COLLECTIONS.OUTFITS, id), outfit);
        } catch (error: any) {
            console.error('[DataContext] updateOutfit failed:', error);
            throw error;
        }
    };

    const deleteOutfit = async (id: string) => { return deleteDoc(doc(getFirestore(), COLLECTIONS.OUTFITS, id)); };

    const reorderOutfits = async (reorderedOutfits: Outfit[]) => {
        const db = getFirestore();
        const batch = writeBatch(db);
        reorderedOutfits.forEach((outfit, index) => {
            const ref = doc(db, COLLECTIONS.OUTFITS, outfit.id);
            batch.update(ref, { order: index });
        });
        try {
            await batch.commit();
        } catch (error: any) {
            console.error('[DataContext] reorderOutfits failed:', error);
            throw error;
        }
    };

    const getCustomerOrders = (customerId: string) => { return orders.filter(o => o.customerId === customerId); };

    const cancelItem = async (orderId: string, itemIndex: number) => {
        const db = getFirestore();
        const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists) throw new Error("Order not found");

        const orderData = orderSnap.data() as Order;
        const newItems = [...orderData.items];

        if (itemIndex < 0 || itemIndex >= newItems.length) throw new Error("Item index out of bounds");

        // Set status to Cancelled
        newItems[itemIndex].status = 'Cancelled';

        // Recalculate Total (Active items only)
        // Check for 'totalCost' (OutfitItem) or 'amount' (Legacy OrderItem)
        const activeItems = newItems.filter(i => i.status !== 'Cancelled');
        const newTotal = activeItems.reduce((sum, i: any) => sum + (Number(i.totalCost) || Number(i.amount) || 0), 0);

        // Recalculate Balance
        // Balance = Total - (Advance + All Payments)
        const paymentsQuery = query(collection(db, COLLECTIONS.PAYMENTS), where('orderId', '==', orderId));
        const paymentsSnap = await getDocs(paymentsQuery);
        let totalPaid = orderData.advance || 0;

        // If advance is recorded as a payment, don't double count (handled by checking payment type usually, 
        // but here we just sum all payments and assume order.advance is initialized correctly or separate.
        // In existing logic, 'totalPaid' usually includes order.advance. 
        // Let's stick to the logic: Balance = NewTotal - (TotalCollected).
        // TotalCollected = Advance (Initial) + Payments (Additional).
        // However, sometimes Advance is also a Payment record. 
        // Safe bet: Fetch all payments for this order.
        const currentTotalPayments = paymentsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

        // Logic from OrderDetailScreen:
        // const hasAdvanceRecord = billPayments.some(p => p.type === 'Advance');
        // const totalPaid = totalPaymentsRecord + (hasAdvanceRecord ? 0 : (order.advance || 0));

        const hasAdvanceRecord = paymentsSnap.docs.some(doc => doc.data().type === 'Advance');
        const totalCollected = currentTotalPayments + (hasAdvanceRecord ? 0 : (orderData.advance || 0));

        const newBalance = newTotal - totalCollected;

        // Determine Order Status
        const allCancelled = newItems.every(i => i.status === 'Cancelled');
        let newOrderStatus = orderData.status;
        if (allCancelled) {
            newOrderStatus = 'Cancelled';
        } else if (orderData.status === 'Cancelled') {
            // If it was cancelled but now we have active items (unlikely path for cancelItem, but good for safety)
            newOrderStatus = 'In Progress';
        }

        await updateDoc(orderRef, {
            items: newItems,
            outfits: newItems, // Sync
            total: newTotal,
            balance: newBalance,
            status: newOrderStatus,
            updatedAt: new Date().toISOString()
        });
    };

    const refreshData = async () => { };

    return (
        <DataContext.Provider value={{
            customers, orders, payments, outfits, loading,
            addCustomer, updateCustomer, deleteCustomer,
            addOrder, updateOrder, deleteOrder,
            addPayment, updatePayment, deletePayment,
            addOutfit, updateOutfit, deleteOutfit, reorderOutfits,
            getCustomerOrders, cancelItem, refreshData, resetEnvironment
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
