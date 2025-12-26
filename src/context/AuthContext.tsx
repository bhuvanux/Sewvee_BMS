import React, { createContext, useState, useContext, useEffect } from 'react';
import { COLLECTIONS, getAuthPassword } from '../config/firebase';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc } from '@react-native-firebase/firestore';

interface AuthContextType {
    user: any;
    company: any;
    loading: boolean;
    logout: () => void;
    saveCompany: (companyData: any) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    loginWithPhone: (phone: string, pin: string) => Promise<void>;
    signup: (email: string, pass: string, name: string, phone: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    sendOtp: (phone: string) => Promise<string>;
    confirmOtp: (verificationId: string, code: string) => Promise<boolean>;
    resetPinWithPhone: (phone: string, newPin: string) => Promise<void>;
    changePin: (oldPin: string, newPin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Using Fast2SMS WhatsApp API for OTP
const USE_MOCK_OTP = false;
const FAST2SMS_KEY = "aW4IYGcD1SM7Fdxtfo3uzRJErP6KHZLl9QisCwONphv2TAm5XnFwXAdLNrzasBWoP6ic0Uhf8y3JZxEQ";
const PHONE_NUMBER_ID = "869402806263415";
const MESSAGE_ID = "9213";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeOtp, setActiveOtp] = useState<string | null>(null);

    // We use a constant Master Password for Firebase Auth to keep sessions separate 
    // from the user's 4-digit PIN stored in Firestore.
    const MASTER_AUTH_PASS = "Sewvee_Auth_Secure_2025";
    const getAuthPassword = (email: string) => MASTER_AUTH_PASS;
    const OLD_PIN_SUFFIX = "_SV2025";

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

            if (firebaseUser) {
                try {
                    const db = getFirestore();
                    // Fetch user profile from Firestore
                    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
                    const userData = userDoc.exists() ? userDoc.data() : null;

                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        ...(userData || {}),
                        isPhoneVerified: userData?.isPhoneVerified || false
                    });

                    // Fetch company data
                    const q = query(
                        collection(db, COLLECTIONS.COMPANIES),
                        where('ownerId', '==', firebaseUser.uid)
                    );
                    const companySnapshot = await getDocs(q);

                    if (!companySnapshot.empty) {
                        setCompany({
                            id: companySnapshot.docs[0].id,
                            ...companySnapshot.docs[0].data()
                        });
                    } else {
                        setCompany(null);
                    }
                } catch (error) {
                    console.error("AuthContext Error:", error);
                }
            } else {
                setUser(null);
                setCompany(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, pass: string) => {
        const auth = getAuth();
        try {
            // Try standard login first
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            // Fallback for legacy email/password accounts that had the suffix
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                await signInWithEmailAndPassword(auth, email, pass + OLD_PIN_SUFFIX);
            } else {
                throw error;
            }
        }
    };

    const loginWithPhone = async (phone: string, pin: string) => {
        const db = getFirestore();
        const userSnapshot = await getDocs(query(
            collection(db, COLLECTIONS.USERS),
            where('phone', '==', phone)
        ));

        if (userSnapshot.empty) {
            throw new Error('User not found with this phone number');
        }

        const userData = userSnapshot.docs[0].data();
        const email = userData.email;
        const storedPin = userData.pin;

        if (!email) {
            throw new Error('Internal error: Email not associated with this phone');
        }


        // 1. First Verify if the PIN matches our Firestore record (if it exists)
        // This is the source of truth for the user's intended 4-digit code.
        if (storedPin && storedPin !== pin) {
            throw new Error('Incorrect PIN');
        }

        // 1. Authenticate with Firebase Auth using the Universal Master Password
        let authenticated = false;
        const auth = getAuth();
        try {
            await signInWithEmailAndPassword(auth, email, MASTER_AUTH_PASS);
            authenticated = true;
        } catch (error: any) {

            // Only try legacy if it's a password related error
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                const legacyAttempts = [
                    pin + OLD_PIN_SUFFIX,
                    pin
                ];

                for (const attemptPass of legacyAttempts) {
                    try {
                        await signInWithEmailAndPassword(auth, email, attemptPass);
                        const userObj = auth.currentUser;
                        if (userObj) {
                            await updatePassword(userObj, MASTER_AUTH_PASS);
                            authenticated = true;
                            break;
                        }
                    } catch (e) {
                    }
                }
            } else {
                throw error;
            }
        }

        if (!authenticated) {
            throw new Error('Incorrect credentials');
        }

        // 2. Once Auth is successful, verify the 4-digit PIN against Firestore
        // This is now the ONLY dynamic check for 'Universal' PIN logic.
        if (storedPin !== pin) {
            throw new Error('Incorrect PIN');
        }

        // Migration check: Ensure Firestore has the PIN (for users created before this field existed)
        if (!storedPin) {
            await updateDoc(doc(getFirestore(), COLLECTIONS.USERS, userSnapshot.docs[0].id), { pin });
        }
    };

    const signup = async (email: string, pass: string, name: string, phone: string) => {
        // Use deterministic password for Auth, store plain PIN in Firestore
        const auth = getAuth();
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, getAuthPassword(email));
        if (newUser) {
            await setDoc(doc(getFirestore(), COLLECTIONS.USERS, newUser.uid), {
                name,
                email,
                phone,
                pin: pass, // Store the 4-digit PIN
                isPhoneVerified: false,
                createdAt: new Date().toISOString()
            });

            // Manually set user state to avoid race condition with onAuthStateChanged
            // The listener might fire before Firestore write completes or before we fetch it back
            setUser({
                uid: newUser.uid,
                email,
                name,
                phone,
                isPhoneVerified: false
            });
        }
    };

    const sendOtp = async (phone: string) => {
        // Generate a 6-digit random code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        if (USE_MOCK_OTP) {
            setActiveOtp('123456'); // Keep 123456 for manual testing if mock is on
            return "MOCK_VERIFICATION_ID";
        }

        if (!phone) {
            throw new Error("Phone number is invalid or missing.");
        }

        try {
            // Clean phone number (remove +, keep only digits)
            const cleanPhone = phone.replace(/\D/g, '');
            const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

            const url = `https://www.fast2sms.com/dev/whatsapp/v24.0/${PHONE_NUMBER_ID}/messages`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'authorization': FAST2SMS_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: finalPhone,
                    type: "template",
                    template: {
                        name: "otp_template",
                        language: { code: "en" },
                        components: [
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", text: otpCode }
                                ]
                            },
                            {
                                type: "button",
                                sub_type: "url",
                                index: "0",
                                parameters: [
                                    { type: "text", text: otpCode }
                                ]
                            }
                        ]
                    }
                })
            });

            const result = await response.json();

            // Meta API returns messages array on success
            if (result.messages && result.messages.length > 0) {
                setActiveOtp(otpCode);
                return "SMS_SENT_SUCCESS";
            } else {
                const errorMsg = result.message ||
                    (result.error ? result.error.message : null) ||
                    'Failed to send WhatsApp message';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Send OTP Error:', error);
            throw error;
        }
    };

    const confirmOtp = async (verificationId: string, code: string) => {
        if (code === activeOtp || (USE_MOCK_OTP && code === '123456')) {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (currentUser) {
                await updateDoc(doc(getFirestore(), COLLECTIONS.USERS, currentUser.uid), {
                    isPhoneVerified: true
                });
                setUser((prev: any) => ({ ...prev, isPhoneVerified: true }));
            }
            return true;
        }
        throw new Error('Invalid verification code');
    };

    const resetPinWithPhone = async (phone: string, newPin: string) => {
        const db = getFirestore();
        const userSnapshot = await getDocs(query(
            collection(db, COLLECTIONS.USERS),
            where('phone', '==', phone)
        ));

        if (userSnapshot.empty) {
            throw new Error('User not found');
        }

        const userId = userSnapshot.docs[0].id;
        const email = userSnapshot.docs[0].data().email;

        // 1. Update the PIN in Firestore (Primary source of truth for the 4-digit code)
        try {
            await updateDoc(doc(getFirestore(), COLLECTIONS.USERS, userId), {
                pin: newPin
            });
        } catch (err: any) {
            console.error('ResetPIN: Firestore update FAILED', err);
            throw new Error('Could not update PIN. Please try again.');
        }
    };



    const changePin = async (oldPin: string, newPin: string) => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        const userDoc = await getDoc(doc(getFirestore(), COLLECTIONS.USERS, currentUser.uid));
        const storedPin = userDoc.data()?.pin;

        // If a PIN is set, verify it. If not set (migration), allow setting it without old PIN (or maybe require standard auth?). 
        // For security, if pin exists, oldPin MUST match.
        if (storedPin && storedPin !== oldPin) {
            throw new Error('Incorrect old PIN');
        }

        await updateDoc(doc(getFirestore(), COLLECTIONS.USERS, currentUser.uid), {
            pin: newPin
        });
    };

    const resetPassword = async (email: string) => {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    const saveCompany = async (companyData: any) => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        try {
            const companyWithId = {
                ...companyData,
                ownerId: currentUser.uid,
                updatedAt: new Date().toISOString()
            };

            if (company?.id) {
                await setDoc(doc(getFirestore(), COLLECTIONS.COMPANIES, company.id), companyWithId, { merge: true });
                setCompany((prev: any) => ({ ...prev, ...companyWithId }));
            } else {
                const newCompanyRef = await addDoc(collection(getFirestore(), COLLECTIONS.COMPANIES), companyWithId);
                setCompany({ id: newCompanyRef.id, ...companyWithId });
            }
        } catch (error) {
            console.error('Save Company Error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            company,
            loading,
            logout,
            saveCompany,
            login,
            loginWithPhone,
            signup,
            resetPassword,
            sendOtp,
            confirmOtp,
            resetPinWithPhone,
            changePin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
