import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { revenueData, revenueMeta } from '../mockData';

export const RevenueChart: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Revenue Overview</h3>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-100 transition-colors">
                        <span>This Week</span>
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex items-end justify-between mb-8">
                <div className="flex items-end space-x-4">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total MRR</p>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{revenueMeta.totalMRR}</h2>
                            <div className="flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md text-emerald-500 bg-emerald-50">
                                <ArrowUpRight size={10} className="mr-0.5" />
                                {revenueMeta.mrrGrowth}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Run Rate (ARR)</p>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{revenueMeta.arr}</h2>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={revenueData}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl">
                                            <p className="mb-1 text-slate-400">Today</p>
                                            <p>₹{payload[0].value.toLocaleString()}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
