import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { topOutfitsData } from '../mockData';

export const TopOutfitsChart: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Top Performing Outfits</h3>
                <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-slate-600">
                    This Month
                </div>
            </div>

            <div className="flex-1 flex items-center">
                <div className="w-1/2 h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={topOutfitsData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                            >
                                {topOutfitsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-1/2 space-y-4 pl-4">
                    {topOutfitsData.map((item, index) => (
                        <div key={index} className="flex flex-col">
                            <div className="flex items-center space-x-2 mb-1">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-xs font-bold text-slate-500">{item.name}</span>
                            </div>
                            <div className="flex items-baseline space-x-2 pl-4">
                                <span className="text-sm font-bold text-slate-900">{item.value.toLocaleString()} Orders</span>
                                <span className="text-[10px] font-bold text-slate-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.percentage}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
