import React, { useState } from 'react';
import {
    Search,
    Filter,
    CreditCard,
    Download,
    MoreVertical,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { paymentsKPIs, paymentMethodsData, recentTransactions, revenueOverTimeData } from '../dashboard/mockData';
import { cn } from '../../utils';

export const PaymentsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All transactions');

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pt-4">
            {/* Page Header */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payments</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Manage and track all platform revenue</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                        <Calendar size={16} />
                        <span>This Month</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 bg-slate-900 border-none text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                        <Download size={16} />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {paymentsKPIs.map((kpi, index) => (
                    <StatCard
                        key={index}
                        label={kpi.title}
                        value={kpi.value}
                        icon={kpi.icon as any}
                        trend={kpi.trend ? { value: kpi.trend, isUp: kpi.trendIsPositive || false } : undefined}
                    />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800">Revenue Overview</h3>
                            <p className="text-xs text-slate-400 mt-1">Monthly recurring revenue (MRR) growth</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg">
                            {['12M', '30D', '7D'].map((range) => (
                                <button key={range} className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", range === '12M' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}>
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueOverTimeData}>
                                <defs>
                                    <linearGradient id="colorRevenuePayment" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1E293B', fontWeight: 'bold', fontSize: '12px' }}
                                    cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenuePayment)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-2">Payment Methods</h3>
                    <p className="text-xs text-slate-400 mb-6">Distribution by transaction volume</p>

                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {paymentMethodsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-bold text-slate-800">100%</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Volume</p>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        {paymentMethodsData.map((method, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }}></div>
                                    <span className="font-bold text-slate-600">{method.name}</span>
                                </div>
                                <span className="font-bold text-slate-800">{method.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transactions Table Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recent Transactions</h2>
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-xs font-medium w-64 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none text-slate-600 placeholder:text-slate-400"
                                />
                            </div>
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-50 transition-all">
                                <Filter size={14} />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center space-x-6 border-b border-gray-50">
                        {['All transactions', 'Success', 'Pending', 'Failed', 'Refunded'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "pb-3 text-xs font-bold transition-all relative",
                                    activeTab === tab
                                        ? "text-[#FF5C00]"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF5C00] rounded-t-full"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8FAFC]">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Transaction ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Client</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Method</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentTransactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5 align-middle">
                                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{txn.id}</span>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <p className="font-bold text-sm text-slate-900">{txn.client}</p>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <p className="font-bold text-sm text-slate-900">{txn.amount}</p>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <p className="text-xs font-bold text-slate-500">{txn.date}</p>
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <StatusBadge status={txn.status} />
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                                            <span>{txn.method === 'Credit Card' ? <CreditCard size={14} /> : txn.method === 'UPI' ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownLeft size={14} className="text-orange-500" />}</span>
                                            <span>{txn.method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-middle text-right">
                                        <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100 shadow-sm opacity-50 group-hover:opacity-100">
                                            <MoreVertical size={16} className="text-slate-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
