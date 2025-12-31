import React, { useEffect, useState } from 'react';
import {
    Users,
    Activity,
    Clock,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Plus
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../firebase';
import { StatCard } from '../../components/StatCard';
import { AISummaryBanner } from '../../components/AISummaryBanner';
import { Link } from 'react-router-dom';
import { cn } from '../../utils';

export const ClientsPage: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    const tabs = ['All', 'Active', 'Inactive', 'Trial', 'New (last 7 days)', 'At Risk'];

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'), limit(50));
                const snap = await getDocs(q);
                setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clients</h1>
                    <p className="text-slate-500 text-sm mt-1">All boutique clients who signed up</p>
                </div>
                <button className="bg-[#FF5C00] hover:bg-[#E65200] text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                    <Plus size={20} />
                    <span>Add new Client</span>
                </button>
            </div>

            {/* AI Summary Banner */}
            <AISummaryBanner
                summaries={[
                    "12 clients haven't set their shop name yet.",
                    "5 clients have not logged in for 14 days.",
                    "Top performing boutique: Urban Chic"
                ]}
            />

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Clients"
                    value={loading ? '...' : clients.length}
                    icon={Users}
                />
                <StatCard
                    label="Active Clients"
                    value="143"
                    trend={{ value: '3%', isUp: false }}
                    icon={Activity}
                />
                <StatCard
                    label="Pending Onboarding"
                    value="43"
                    icon={Clock}
                />
                <StatCard
                    label="New Clients This Month"
                    value="23"
                    trend={{ value: '2%', isUp: true }}
                    icon={UserPlus}
                />
            </div>

            {/* Client List Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Client List</h2>
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search clients by name, email, phone, shop..."
                                    className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm w-72 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <button className="flex items-center space-x-2 px-4 py-2.5 border rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all">
                                <Filter size={18} />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                                    activeTab === tab
                                        ? "bg-[#FF5C00] text-white shadow-md shadow-orange-500/20"
                                        : "text-slate-500 hover:bg-gray-50 bg-gray-100/50"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8FAFC]">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Client Name ↓</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Phone & Email ↑</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Last Active ↓</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Users & Orders ↓</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Boutique Size ↓</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Health Score ↓</th>
                                <th className="px-6 py-4 text-[10px) font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Status ↓</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
                                        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">Loading Platform Data...</p>
                                    </td>
                                </tr>
                            ) : clients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <Link to={`/clients/${client.id}`} className="flex items-center space-x-3">
                                            <div className="h-10 w-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-600 uppercase overflow-hidden">
                                                {client.profileImage ? (
                                                    <img src={client.profileImage} alt={client.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span>{client.name?.charAt(0) || '?'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-1">
                                                    <span className="font-bold text-slate-900 leading-none group-hover:text-primary-600 transition-colors">{client.name || 'Untitled Boutique'}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 flex items-center mt-1">
                                                    <span className="mr-1">📍</span> {client.location || 'Not Set'}
                                                </p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs space-y-1">
                                            <p className="font-bold text-slate-700">{client.phone}</p>
                                            <p className="text-slate-400">{client.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-slate-700">Recent</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs">
                                            <p className="font-bold text-slate-700">{client.totalUsers || '0'} Users</p>
                                            <p className="text-slate-400">{client.totalOrders || '0'} Total Orders</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs">
                                            <p className="font-bold text-slate-700">--</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full w-4/5 bg-emerald-500"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                                            <span>Active</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100 shadow-sm opacity-0 group-hover:opacity-100">
                                            <MoreVertical size={16} className="text-slate-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Showing 1 to {clients.length} of {clients.length} results</p>
                    <div className="flex items-center space-x-1">
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft size={18} /></button>
                        <button className="w-8 h-8 rounded-lg text-xs font-bold bg-[#FF5C00] text-white shadow-md shadow-orange-500/20">1</button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
