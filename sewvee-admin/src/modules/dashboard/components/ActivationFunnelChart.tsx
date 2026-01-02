import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { activationFunnelData } from '../mockData';

export const ActivationFunnelChart: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Activation Funnel</h3>
                <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-slate-600">
                    This Month
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={activationFunnelData}
                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                    >
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl">
                                            {payload[0].value}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            width={120}
                            tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }}
                        />
                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                            {activationFunnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-col space-y-4 mt-2">
                {activationFunnelData.map((_, idx) => (
                    <div key={idx} className="hidden"> {/* Using recharts for visual, but we can also build custom HTML bars if needed for exact match */}</div>
                ))}

                {/*  Replicating exact design "look" with HTML overlay if Recharts is too tricky for the labels on right */}
                <div className="absolute right-12 top-24 flex flex-col space-y-9 pt-2">
                    {activationFunnelData.map((item, idx) => (
                        <span key={idx} className="text-xs font-bold text-slate-900">{item.value}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};
