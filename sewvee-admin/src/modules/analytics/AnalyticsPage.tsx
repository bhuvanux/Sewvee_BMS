import React from 'react';
import {
    Filter,
    Download
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { StatCard } from '../../components/StatCard';
import { analyticsKPIs, productInterestData, demographicData, trafficSourceData } from '../dashboard/mockData';
import { cn } from '../../utils';

export const AnalyticsPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pt-4">
            {/* Page Header */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Deep dive into platform performance and user cohorts</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-white rounded-xl border border-gray-200 p-1">
                        {['7D', '30D', '90D'].map((range, idx) => (
                            <button key={range} className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                                idx === 1 ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-slate-500 hover:text-slate-900"
                            )}>
                                {range}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                        <Filter size={16} />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {analyticsKPIs.map((kpi, index) => (
                    <StatCard
                        key={index}
                        label={kpi.title}
                        value={kpi.value}
                        icon={kpi.icon as any}
                        trend={kpi.trend ? { value: kpi.trend, isUp: kpi.trendIsPositive || false } : undefined}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Interest (Pie Chart) */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-2">Popular Products</h3>
                    <p className="text-xs text-slate-400 mb-6">User interest by category</p>

                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={productInterestData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {productInterestData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-bold text-slate-800">Top</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Categories</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {productInterestData.map((item, idx) => (
                            <div key={idx} className="flex items-center text-xs">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                <span className="font-bold text-slate-600 flex-1">{item.name}</span>
                                <span className="font-bold text-slate-800">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cohort Analysis (Bar Chart) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800">Customer Age Demographics</h3>
                            <p className="text-xs text-slate-400 mt-1">Distribution across age groups</p>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demographicData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="age"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="percentage" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40}>
                                    {demographicData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'][index % 4]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Traffic Sources Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Traffic Sources</h3>
                        <p className="text-xs text-slate-400 mt-1">Where are your users coming from?</p>
                    </div>
                    <button className="text-xs font-bold text-primary-600 hover:text-primary-700">View Full Report</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8FAFC]">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Source</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Visitors</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Bounce Rate</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Conversion</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {trafficSourceData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{item.source}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.visitors}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.bounceRate}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.conversion}</td>
                                    <td className="px-6 py-4 text-xs font-bold">
                                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                                        </div>
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
