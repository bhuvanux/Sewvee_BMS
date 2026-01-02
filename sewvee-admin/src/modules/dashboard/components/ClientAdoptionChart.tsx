import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { clientAdoptionData } from '../mockData';

export const ClientAdoptionChart: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Client Adoption by City</h3>
                <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-slate-600">
                    This Month
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={clientAdoptionData}
                        margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                        barSize={32}
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
                        <XAxis
                            dataKey="city"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                            interval={0}
                            dy={10}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <Bar
                            dataKey="value"
                            fill="#3B82F6"
                            radius={[6, 6, 6, 6]}
                            background={{ fill: '#F8FAFC', radius: 6 }}
                            label={{ position: 'top', fill: '#1E293B', fontSize: 10, fontWeight: 800 }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
