import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { clientSegmentationData } from '../mockData';

export const ClientSegmentationChart: React.FC = () => {
    // Calculate total for percentage
    const total = clientSegmentationData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Client Segmentation</h3>
                <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-slate-600">
                    This Month
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
                <div className="w-full h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={clientSegmentationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                cornerRadius={10}
                                paddingAngle={5}
                            >
                                {clientSegmentationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Text mimicking the design roughly, though distinct parts make it hard to center perfectly without custom svg logic or absolute positioning overlay */}
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {clientSegmentationData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="font-bold text-slate-600">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-900">{item.value}</span>
                            <span className="font-bold text-slate-400 w-8 text-right">{Math.round((item.value / total) * 100)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
