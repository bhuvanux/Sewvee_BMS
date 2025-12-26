import React, { createContext, useState, useContext, useEffect } from 'react';
import { COLLECTIONS } from '../config/firebase';
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
    getCustomerOrders: (customerId: string) => Order[];
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

// Default Seed Data
export const DEFAULT_OUTFITS = [
    {
        name: 'Blouse',
        category: 'Stitching',
        basePrice: 500,
        isVisible: true,
        categories: [
            {
                id: 'cat_1',
                name: 'Front Neck',
                isVisible: true,
                subCategories: [
                    {
                        id: 'opt_1',
                        name: 'Paan',
                        options: [
                            { id: 'sub_1', name: 'Deep' },
                            { id: 'sub_2', name: 'Standard' }
                        ]
                    },
                    { id: 'opt_2', name: 'Round' },
                    { id: 'opt_3', name: 'Square' },
                    { id: 'opt_4', name: 'Boat' }
                ]
            },
            {
                id: 'cat_2',
                name: 'Back Neck',
                isVisible: true,
                subCategories: [{ id: 'opt_5', name: 'Deep U' }, { id: 'opt_6', name: 'Pot Logic' }, { id: 'opt_7', name: 'High Neck' }]
            },
            {
                id: 'cat_3',
                name: 'Sleeve',
                isVisible: true,
                subCategories: [{ id: 'opt_8', name: 'Half' }, { id: 'opt_9', name: 'Elbow' }, { id: 'opt_10', name: 'Full' }, { id: 'opt_11', name: 'Sleeveless' }]
            }
        ]
    },
    {
        name: 'Kurti',
        category: 'Stitching',
        basePrice: 400,
        isVisible: true,
        categories: [
            {
                id: 'cat_k1',
                name: 'Neck Design',
                isVisible: true,
                subCategories: [{ id: 'opt_k1', name: 'Collar' }, { id: 'opt_k2', name: 'V Neck' }, { id: 'opt_k3', name: 'Round' }]
            },
            {
                id: 'cat_k2',
                name: 'Bottom Style',
                isVisible: true,
                subCategories: [{ id: 'opt_k4', name: 'Straight' }, { id: 'opt_k5', name: 'A-Line' }, { id: 'opt_k6', name: 'Anarkali' }]
            }
        ]
    },
    { name: 'Lehenga', category: 'Stitching', basePrice: 1500, isVisible: true },
    { name: 'Gown', category: 'Stitching', basePrice: 1200, isVisible: true },
    { name: 'Fall & Pico', category: 'Alteration', basePrice: 50, isVisible: true },
    { name: 'Fitting', category: 'Alteration', basePrice: 100, isVisible: true },
    { name: 'Others', category: 'General', basePrice: 0, isVisible: true }
];

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, company } = useAuth();

    // Re-implement seed logic function safely
    const seedDefaultOutfits = async (uid: string) => {
        const db = getFirestore();
        const batch = writeBatch(db);
        DEFAULT_OUTFITS.forEach(outfit => {
            const ref = doc(collection(db, COLLECTIONS.OUTFITS));
            batch.set(ref, { ...outfit, ownerId: uid });
        });
        await batch.commit();
    };

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const db = getFirestore();

        // Real-time listeners WITHOUT orderBy (Client-side sorting to avoid Index requirements)
        // This solves the 'index-not-found' error without manual console intervention.

        const unsubCustomers = onSnapshot(
            query(collection(db, COLLECTIONS.CUSTOMERS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {
                    const data = snapshot.docs.map((docSnap: any) => ({ id: docSnap.id, ...docSnap.data() } as Customer));
                    // Sort A-Z by name
                    data.sort((a: any, b: any) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
                    setCustomers(data);
                }
            }, error => {
                console.error('Customers listener error:', error);
                setLoading(false);
            });

        const unsubOrders = onSnapshot(
            query(collection(db, COLLECTIONS.ORDERS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {
                    const data = snapshot.docs.map((docSnap: any) => {
                        const d = docSnap.data();
                        return { ...d, id: docSnap.id } as Order;
                    });
                    // Sort Descending by createdAt (Newest First)
                    data.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                    setOrders(data);
                }
            }, error => {
                console.error('Orders listener error:', error);
                setLoading(false);
            });

        const unsubPayments = onSnapshot(
            query(collection(db, COLLECTIONS.PAYMENTS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {
                    const data = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as Payment));
                    // Sort Descending by date (Newest First) (Assuming Payment has date field)
                    data.sort((a: any, b: any) => ((b as any).date || '').localeCompare((a as any).date || ''));
                    setPayments(data);
                }
            }, error => {
                console.error('Payments listener error:', error);
                setLoading(false);
            });

        const unsubOutfits = onSnapshot(
            query(collection(db, COLLECTIONS.OUTFITS), where('ownerId', '==', user.uid)),
            snapshot => {
                if (snapshot) {
                    if (snapshot.empty) {
                        seedDefaultOutfits(user.uid);
                    }
                    const data = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as Outfit));

                    // Inject "Others" if missing in active list (Self-healing)
                    if (data.length > 0 && !data.find((o: any) => o.name === 'Others')) {
                        const defaultOthers = DEFAULT_OUTFITS.find(d => d.name === 'Others');
                        if (defaultOthers) {
                            // Add it to DB asynchronously
                            addDoc(collection(db, COLLECTIONS.OUTFITS), { ...defaultOthers, ownerId: user.uid })
                                .catch(err => console.error('Failed to auto-inject Others outfit:', err));
                        }
                    }

                    // Sort A-Z by name
                    data.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
                    setOutfits(data);
                }
                setLoading(false);
            }, error => {
                console.error('Outfits listener error:', error);
                setLoading(false);
            });

        return () => {
            // Safe unsubscribe
            if (unsubCustomers) unsubCustomers();
            if (unsubOrders) unsubOrders();
            if (unsubPayments) unsubPayments();
            if (unsubOutfits) unsubOutfits();
        };
    }, [user?.uid]);


    const addCustomer = async (customer: Partial<Customer>) => {
        if (!user?.uid) throw new Error('Not authenticated');

        // Generate Custom ID (#0001)
        const existingIds = customers
            .map(c => c.displayId ? parseInt(c.displayId.replace(/\D/g, '')) : 0)
            .filter(n => !isNaN(n) && n > 0);

        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const nextId = maxId + 1;

        // Custom ID Logic: {First 2 letters of name}-{5-digit sequence}
        // Example: inba boutique -> IN-00001
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
        const ref = await addDoc(collection(getFirestore(), COLLECTIONS.CUSTOMERS), newItem);
        return { id: ref.id, ...newItem } as Customer;
    };

    const updateCustomer = async (id: string, customer: Partial<Customer>) => {
        await updateDoc(doc(getFirestore(), COLLECTIONS.CUSTOMERS, id), customer);
    };

    const deleteCustomer = async (id: string) => {
        await deleteDoc(doc(getFirestore(), COLLECTIONS.CUSTOMERS, id));
    };

    const addOrder = async (order: Partial<Order>) => {
        if (!user?.uid) throw new Error('Not authenticated');

        // Custom Order ID Logic: YYYY/00001
        const currentYear = new Date().getFullYear().toString();

        // 1. Get all orders for current year to determine next sequence
        // Note: For high volume, a separate counter doc is better, but for this app, client-side calc from existing list is acceptable.
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
            billNo: newBillNo, // Set the custom ID
            ownerId: user.uid,
            createdAt: new Date().toISOString(),
            time: order.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            status: 'Pending',
            paymentStatus: (order.advance || 0) >= (order.total || 0) ? 'Paid' : (order.advance ? 'Partially Paid' : 'Unpaid'),
            balance: (order.total || 0) - (order.advance || 0)
        };

        const batch = writeBatch(db);
        batch.set(orderRef, newItem);

        // Update Customer Stats
        if (newItem.customerId) {
            const customerRef = doc(db, COLLECTIONS.CUSTOMERS, newItem.customerId);
            batch.set(customerRef, {
                totalOrders: increment(1),
                totalSpent: increment(newItem.advance || 0),
                lastOrderDate: newItem.createdAt
            }, { merge: true });
        }

        // Add initial payment if advance > 0
        if (newItem.advance && newItem.advance > 0) {
            const paymentRef = doc(collection(db, COLLECTIONS.PAYMENTS));
            batch.set(paymentRef, {
                id: paymentRef.id,
                orderId: orderRef.id,
                billNo: newBillNo, // redundant but useful for searching
                customerId: newItem.customerId,
                amount: newItem.advance,
                date: newItem.date || getCurrentDate(),
                time: newItem.time,
                mode: (order as any).advanceMode || 'Cash', // Use the selected mode
                type: 'Advance',
                ownerId: user.uid
            });
        }

        await batch.commit();
        return newItem as Order;
    };

    const updateOrder = async (id: string, orderData: Partial<Order>) => {
        // Robust update handling (Upsert strategy)
        let updates: any = { ...orderData };
        const db = getFirestore();
        const docRef = doc(db, COLLECTIONS.ORDERS, id);

        try {
            const docSnap = await getDoc(docRef);
            const current = docSnap.exists() ? (docSnap.data() as Order) : {} as Order;

            // Recalculate balance only if necessary fields are changing
            if (updates.total !== undefined || updates.advance !== undefined) {
                const total = updates.total ?? current.total ?? 0;
                const advance = updates.advance ?? current.advance ?? 0;
                updates.balance = total - advance;
                updates.paymentStatus = advance >= total ? 'Paid' : (advance > 0 ? 'Partially Paid' : 'Unpaid');
            }

            // Ensure ownerId is preserved or added (in case of restoration)
            if (!updates.ownerId && user?.uid) {
                updates.ownerId = user.uid;
            }
            if (!updates.createdAt && !current.createdAt) {
                updates.createdAt = new Date().toISOString();
            }

            // Use set with merge: true to prevent "not-found" errors if doc is missing on server
            await setDoc(docRef, updates, { merge: true });
        } catch (error) {
            console.error('Update Order Failed:', error);
            throw error;
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            const db = getFirestore();
            const orderRef = doc(db, COLLECTIONS.ORDERS, id);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists) {
                console.warn('[DataContext] Order not found (already deleted?):', id);
                return; // Treat as success if already gone
            }

            const orderData = orderSnap.data();
            const batch = writeBatch(db);
            batch.delete(orderRef);

            // Cascade: Delete Payments & Calculate Total Paid
            const q = query(collection(db, COLLECTIONS.PAYMENTS), where('orderId', '==', id));
            const pSnap = await getDocs(q);

            let totalPaidForOrder = 0;
            pSnap.forEach((docSnap: any) => {
                const pData = docSnap.data();
                totalPaidForOrder += (pData.amount || 0);
                batch.delete(docSnap.ref);
            });

            // Sync: Update Customer Stats
            if (orderData?.customerId) {
                const custRef = doc(db, COLLECTIONS.CUSTOMERS, orderData.customerId);
                // We use set with merge to safely update specific fields
                batch.set(custRef, {
                    totalOrders: increment(-1),
                    totalSpent: increment(-totalPaidForOrder)
                }, { merge: true });
            }

            await batch.commit();
        } catch (error) {
            console.error('[DataContext] Delete order error:', error);
            throw new Error('Failed to delete order: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const addPayment = async (payment: Partial<Payment>) => {
        if (!user?.uid) throw new Error('Not authenticated');

        const db = getFirestore();
        const batch = writeBatch(db);
        const paymentRef = doc(collection(db, COLLECTIONS.PAYMENTS));

        const newPayment = {
            ...payment,
            ownerId: user.uid,
            date: new Date().toISOString()
        };
        batch.set(paymentRef, newPayment);

        // Update Order Balance
        if (payment.orderId) {
            const orderRef = doc(db, COLLECTIONS.ORDERS, payment.orderId);
            batch.set(orderRef, {
                advance: increment(payment.amount || 0),
                balance: increment(-(payment.amount || 0))
            }, { merge: true });
        }

        // Update Customer Stats
        if (payment.customerId) {
            const custRef = doc(db, COLLECTIONS.CUSTOMERS, payment.customerId);
            batch.set(custRef, {
                totalSpent: increment(payment.amount || 0)
            }, { merge: true });
        }

        await batch.commit();
    };

    const updatePayment = async (id: string, updates: Partial<Payment>) => {
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

            // Update Order Balance
            if (oldPayment.orderId) {
                const orderRef = doc(db, COLLECTIONS.ORDERS, oldPayment.orderId);
                batch.set(orderRef, {
                    advance: increment(delta),
                    balance: increment(-delta)
                }, { merge: true });
            }

            // Update Customer Stats
            if (oldPayment.customerId) {
                const custRef = doc(db, COLLECTIONS.CUSTOMERS, oldPayment.customerId);
                batch.set(custRef, {
                    totalSpent: increment(delta)
                }, { merge: true });
            }
        }
        await batch.commit();
    };

    const deletePayment = async (id: string) => {
        // Revert balance on order
        const db = getFirestore();
        const paymentDocRef = doc(db, COLLECTIONS.PAYMENTS, id);
        const paymentDocSnap = await getDoc(paymentDocRef);
        const payment = paymentDocSnap.data() as Payment;

        if (payment && payment.orderId) {
            const batch = writeBatch(db);
            batch.delete(paymentDocRef);
            const orderRef = doc(db, COLLECTIONS.ORDERS, payment.orderId);
            batch.set(orderRef, {
                advance: increment(-(Number(payment.amount) || 0)),
                balance: increment(Number(payment.amount) || 0)
            }, { merge: true });

            // Update Customer Stats
            if (payment.customerId) {
                const custRef = doc(db, COLLECTIONS.CUSTOMERS, payment.customerId);
                batch.set(custRef, {
                    totalSpent: increment(-(Number(payment.amount) || 0))
                }, { merge: true });
            }

            await batch.commit();
        } else {
            await deleteDoc(paymentDocRef);
        }
    };

    const addOutfit = async (outfit: Partial<Outfit>) => {
        if (!user?.uid) throw new Error('Not authenticated');
        await addDoc(collection(getFirestore(), COLLECTIONS.OUTFITS), { ...outfit, ownerId: user.uid });
    };

    const updateOutfit = async (id: string, outfit: Partial<Outfit>) => {
        await updateDoc(doc(getFirestore(), COLLECTIONS.OUTFITS, id), outfit);
    };

    const deleteOutfit = async (id: string) => {
        await deleteDoc(doc(getFirestore(), COLLECTIONS.OUTFITS, id));
    };

    const getCustomerOrders = (customerId: string) => {
        return orders.filter(o => o.customerId === customerId);
    };

    const refreshData = async () => {
        // No-op for real-time listeners
    };

    return (
        <DataContext.Provider value={{
            customers,
            orders,
            payments,
            outfits,
            loading,
            addCustomer,
            updateCustomer,
            deleteCustomer,
            addOrder,
            updateOrder,
            deleteOrder,
            addPayment,
            updatePayment,
            deletePayment,
            addOutfit,
            updateOutfit,
            deleteOutfit,
            getCustomerOrders,
            refreshData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
