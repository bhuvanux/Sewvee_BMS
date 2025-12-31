import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../firebase';

interface AuthContextType {
    user: User | null;
    role: 'super_admin' | 'boutique_owner' | 'staff' | null;
    loading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'super_admin' | 'boutique_owner' | 'staff' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setRole(userData.role || null);
                    } else {
                        setRole(null);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    setRole(null);
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            role,
            loading,
            isAdmin: role === 'super_admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
