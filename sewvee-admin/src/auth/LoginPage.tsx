import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../firebase';
import { Mail, Lock, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid));

            if (userDoc.exists() && userDoc.data().role === 'super_admin') {
                navigate('/dashboard');
            } else {
                await auth.signOut();
                setError('Unauthorized access. Only super admins are permitted.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] font-sans p-6 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 pointer-events-none">
                <Sparkles size={600} className="text-primary-600" />
            </div>
            <div className="absolute bottom-0 left-0 p-20 opacity-[0.03] -rotate-12 pointer-events-none">
                <Sparkles size={400} className="text-primary-600" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20 mb-6 group">
                        <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform">S</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Sewvee Admin</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Super Admin Platform v1.0</p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-slate-200/50 p-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
                                    placeholder="admin@sewvee.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in shake duration-500">
                                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                                <p className="text-xs font-bold text-rose-600 line-clamp-2">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
                            ) : (
                                <>
                                    <span className="tracking-wide">Sign In to Dashboard</span>
                                    <LogIn size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Internal Access Only</p>
                    </div>
                </div>

                <p className="text-center mt-8 text-xs text-slate-400 font-bold">
                    © 2024 Sewvee Technologies. All rights reserved.
                </p>
            </div>
        </div>
    );
};
