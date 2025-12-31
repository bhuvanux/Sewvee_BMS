import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const ProtectedRoute: React.FC = () => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-gray-600">You do not have permission to access the Super Admin platform.</p>
                <button
                    onClick={() => window.location.href = '/login'}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return <Outlet />;
};
