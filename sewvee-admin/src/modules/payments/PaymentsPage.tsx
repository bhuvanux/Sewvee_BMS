import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../firebase';
import { Search, Filter, CreditCard, ChevronDown, Download, AlertCircle, TrendingUp, MoreVertical } from 'lucide-react';
import { StatCard } from '../../components/StatCard';

export const PaymentsPage: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const q = query(
                    collection(db, COLLECTIONS.PAYMENTS),
                    orderBy('date', 'desc'),
                    limit(50)
                );
                const querySnapshot = await getDocs(q);
                const paymentsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPayments(paymentsData);
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    const filteredPayments = payments.filter(p =>
        (p.billNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.customerId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold font-display text-slate-800">Payments</h1>
                    <p className="text-slate-500">Monitor all transactions across the platform</p>
                </div>
                <button className="flex items-center justify-center space-x-2 bg-slate-900 border-none text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                    <Download size={18} />
                    <span>Export Reports</span>
                </button>
            </div>

            {/* KPI Section for Payments */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Revenue"
                    value="₹42.8L"
                    trend={{ value: '14%', isUp: true }}
                    icon={TrendingUp}
                />
                <StatCard
                    label="Subscriptions"
                    value="243"
                    trend={{ value: '8%', isUp: true }}
                    icon={CreditCard}
                />
                <StatCard
                    label="Pending Payouts"
                    value="₹2.4L"
                    icon={ChevronDown}
                />
                <StatCard
                    label="Refunds"
                    value="₹12.4k"
                    trend={{ value: '4%', isUp: false }}
                    icon={AlertCircle}
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by Bill No or Client ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border-none bg-gray-50 py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-6 py-3 border border-gray-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={18} />
                        <span>Advanced Filters</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-24 flex flex-col items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6">Fetching Database Transactions...</p>
                    </div>
                ) : filteredPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F8FAFC]">
                                <tr className="border-b border-gray-50 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                    <th className="px-8 py-5">Transaction ID</th>
                                    <th className="px-8 py-5">Bill / Ref No</th>
                                    <th className="px-8 py-5">Amount</th>
                                    <th className="px-8 py-5">Mode</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Date & Time</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-[10px] text-slate-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{p.id.substring(0, 12)}...</span>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-slate-800">{p.billNo || 'REF-842'}</td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-black text-slate-900 leading-none">₹{p.amount?.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center space-x-2">
                                                <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100 text-slate-500">
                                                    <CreditCard size={14} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{p.mode}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                                Successful
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">{new Date(p.date).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-bold text-slate-400 tracking-tight">{p.time}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 shadow-sm">
                                                <MoreVertical size={16} className="text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 italic">No payments found.</div>
                )}
            </div>
        </div>
    );
};
