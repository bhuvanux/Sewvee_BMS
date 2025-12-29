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

    // Idempotent Seeding: Creates V2 defaults only if collection is empty
    const seedDefaultOutfits = async (uid: string) => {
        const db = getFirestore();
        const batch = writeBatch(db);
        DEFAULT_OUTFITS.forEach((outfit, index) => {
            const ref = doc(collection(db, COLLECTIONS.OUTFITS));
            batch.set(ref, {
                ...outfit,
                ownerId: uid,
                createdAt: new Date().toISOString(),
                order: index
            });
        });
        try {
            await batch.commit();
            console.log('[Seeding] Applied V2 Defaults.');
        } catch (error) {
            console.error('[Seeding] Failed:', error);
        }
    };

    // --- RESET LOGIC (STAGING ONLY) ---
    const resetEnvironment = async () => {
        if (!IS_STAGING) {
            throw new Error("Reset allowed ONLY in Staging Environment");
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
                    // SEEDING CHECK
                    if (snapshot.empty && user.uid) {
                        seedDefaultOutfits(user.uid); // Trigger Seeding
                    }

                    const data = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as Outfit));
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
        runInBackground(updateDoc(doc(getFirestore(), COLLECTIONS.CUSTOMERS, id), customer), 'updateCustomer');
    };

    const deleteCustomer = async (id: string) => {
        runInBackground(deleteDoc(doc(getFirestore(), COLLECTIONS.CUSTOMERS, id)), 'deleteCustomer');
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
        runInBackground(batch.commit(), 'addOrder');
        return newItem as Order;
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
        runInBackground(setDoc(docRef, updates, { merge: true }), 'updateOrder');
    };

    const deleteOrder = async (id: string) => {
        runInBackground((async () => {
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
        })(), 'deleteOrder');
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
        runInBackground(batch.commit(), 'addPayment');
    };

    const updatePayment = async (id: string, updates: Partial<Payment>) => {
        runInBackground((async () => {
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
        })(), 'updatePayment');
    };

    const deletePayment = async (id: string) => {
        runInBackground((async () => {
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
        })(), 'deletePayment');
    };

    const addOutfit = async (outfit: Partial<Outfit>) => {
        if (!user?.uid) throw new Error('Not authenticated');
        const minOrder = outfits.length > 0 ? Math.min(...outfits.map(o => o.order || 0)) : 0;
        const newOrder = minOrder - 1;
        const newOutfit = { ...outfit, ownerId: user.uid, createdAt: new Date().toISOString(), order: newOrder };
        runInBackground(addDoc(collection(getFirestore(), COLLECTIONS.OUTFITS), newOutfit), 'addOutfit');
    };

    const updateOutfit = async (id: string, outfit: Partial<Outfit>) => {
        runInBackground(updateDoc(doc(getFirestore(), COLLECTIONS.OUTFITS, id), outfit), 'updateOutfit');
    };

    const deleteOutfit = async (id: string) => { return deleteDoc(doc(getFirestore(), COLLECTIONS.OUTFITS, id)); };

    const reorderOutfits = async (reorderedOutfits: Outfit[]) => {
        const db = getFirestore();
        const batch = writeBatch(db);
        reorderedOutfits.forEach((outfit, index) => {
            const ref = doc(db, COLLECTIONS.OUTFITS, outfit.id);
            batch.update(ref, { order: index });
        });
        runInBackground(batch.commit(), 'reorderOutfits');
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
