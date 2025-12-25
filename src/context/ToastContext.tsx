import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: () => void;
    toast: {
        visible: boolean;
        message: string;
        type: ToastType;
    };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('success');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const hideToast = useCallback(() => {
        setVisible(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const showToast = useCallback((msg: string, t: ToastType = 'success') => {
        // Clear existing timer if any
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        setMessage(msg);
        setType(t);
        setVisible(true);

        // Auto hide after 5 seconds
        timerRef.current = setTimeout(() => {
            hideToast();
        }, 5000);
    }, [hideToast]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, toast: { visible, message, type } }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
