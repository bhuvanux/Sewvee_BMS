import React, { useState } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Plus,
    Crown,
    ChevronDown
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { AISummaryBanner } from '../../components/AISummaryBanner';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { cn } from '../../utils';
import { clientsData, clientKPIs } from '../dashboard/mockData';

export const ClientsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('All');

    // Using mock data directly instead of state/useEffect for this UI implementation
    const clients = clientsData;

    const tabs = ['All', 'Active', 'Inactive', 'Trial', 'New (last 7 days)', 'At Risk'];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pt-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clients</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">All boutique clients who signed up</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="bg-white border border-gray-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-gray-50 transition-colors text-sm">
                        <span>This Month</span>
                        <ChevronDown size={16} />
                    </button>
                    <button className="bg-[#FF5C00] hover:bg-[#E65200] text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95 text-sm">
                        <Plus size={18} />
                        <span>Add new Client</span>
                    </button>
                </div>
            </div>

            {/* AI Summary Banner */}
            <AISummaryBanner
                title="AI Summary of Client Activity"
                items={[
                    "12 clients haven't set their shop name yet.",
                    "5 clients have not logged in for 14 days.",
                    "Top performing boutique: Urban Chic"
                ]}
            />

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {clientKPIs.map((kpi, index) => (
                    <StatCard
                        key={index}
                        label={kpi.title}
                        value={kpi.value}
                        icon={kpi.icon as any} // Lucide icon name mapping handled in StatCard or ignored for mock simplicity if using string
                        trend={kpi.trend ? { value: kpi.trend, isUp: kpi.trendIsPositive || false } : undefined}
                    />
                ))}
            </div>

            {/* Client List Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Client List</h2>
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search clients by name, email, phone, shop..."
                                    className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-xs font-medium w-72 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none text-slate-600 placeholder:text-slate-400"
                                />
                            </div>
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-50 transition-all">
                                <Filter size={14} />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
                                    activeTab === tab
                                        ? "bg-[#FF5C00] text-white border-[#FF5C00]"
                                        : "bg-white text-slate-500 border-gray-200 hover:border-gray-300 hover:text-slate-700"
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
                                {[
                                    'Client Name', 'Phone & Email', 'Last Active', 'Users & Orders', 'Boutique Size', 'Health Score', 'Status', 'Actions'
                                ].map((header, idx) => (
                                    <th key={idx} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50 cursor-pointer hover:text-slate-600">
                                        <div className="flex items-center space-x-1">
                                            <span>{header}</span>
                                            <ChevronDown size={10} className="text-slate-300" />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5 align-middle">
                                        <Link to={`/clients/${client.id}`} className="block">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-bold text-sm text-slate-900 leading-none group-hover:text-primary-600 transition-colors">{client.name}</span>
                                                {client.isPremium && <Crown size={12} className="text-purple-500 fill-purple-500" />}
                                            </div>
                                            <div className="flex items-center text-[10px] text-slate-400 font-medium">
                                                <span className="mr-1">location_on</span> {/* Material icon substitute or emoji if needed, using text for now or just text content */}
                                                {client.address}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="text-xs space-y-0.5">
                                            <p className="font-bold text-slate-700">{client.phone}</p>
                                            <p className="text-slate-400 font-medium">{client.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <span className="text-xs font-bold text-slate-700">{client.lastActive}</span>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="text-xs space-y-0.5">
                                            <p className="font-bold text-slate-800">{client.activeUsers} Active Users</p>
                                            <p className="text-slate-400 font-medium">{client.totalOrders} Total Orders</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="text-xs space-y-0.5">
                                            <p className="font-bold text-slate-800">{client.staff} Staff</p>
                                            <p className="text-slate-400 font-medium">{client.ordersThisMonth} Orders</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="flex items-center space-x-3 w-24">
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full",
                                                        client.health > 80 ? "bg-emerald-500" :
                                                            client.health > 50 ? "bg-orange-400" : "bg-red-400"
                                                    )}
                                                    style={{ width: `${client.health}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <StatusBadge status={client.status} />
                                    </td>
                                    <td className="px-6 py-5 text-right align-middle">
                                        <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100 shadow-sm opacity-50 group-hover:opacity-100">
                                            <MoreVertical size={16} className="text-slate-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400 tracking-wide">Showing 1 to 8 of 243 results</p>
                    <div className="flex items-center space-x-1">
                        <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-gray-200 rounded-lg">Previous</button>
                        <button className="w-7 h-7 rounded-lg text-xs font-bold bg-[#FF5C00] text-white shadow-md shadow-orange-500/20">1</button>
                        <button className="w-7 h-7 rounded-lg text-xs font-bold text-slate-500 hover:bg-gray-50">2</button>
                        <button className="w-7 h-7 rounded-lg text-xs font-bold text-slate-500 hover:bg-gray-50">3</button>
                        <button className="w-7 h-7 rounded-lg text-xs font-bold text-slate-500 hover:bg-gray-50">4</button>
                        <button className="w-7 h-7 rounded-lg text-xs font-bold text-slate-500 hover:bg-gray-50">5</button>
                        <span className="text-slate-400 text-xs px-1">...</span>
                        <button className="w-7 h-7 rounded-lg text-xs font-bold text-slate-500 hover:bg-gray-50">31</button>
                        <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-gray-200 rounded-lg">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
