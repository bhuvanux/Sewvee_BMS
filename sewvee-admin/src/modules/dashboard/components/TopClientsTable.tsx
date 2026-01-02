import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { topClientsData } from '../mockData';
import { cn } from '../../../utils';

export const TopClientsTable: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Top Performing Clients</h3>
                <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-slate-600">
                    This Month
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            {[
                                'Boutique Name', 'Plan', 'MRR', 'New Users', 'Active Users', 'Orders', 'Health', 'Payment Reliability Score'
                            ].map((header, idx) => (
                                <th key={idx} className="pb-4 text-left">
                                    <div className="flex items-center space-x-1 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600">
                                        <span>{header}</span>
                                        <ArrowUpDown size={10} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {topClientsData.map((client, idx) => (
                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pr-4">
                                    <span className="text-sm font-bold text-slate-800">{client.name}</span>
                                </td>
                                <td className="py-4 pr-4">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
                                        client.plan === 'Professional' ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-orange-600"
                                    )}>
                                        {client.plan}
                                    </span>
                                </td>
                                <td className="py-4 pr-4 text-sm font-bold text-slate-900">{client.mrr}</td>
                                <td className="py-4 pr-4 text-sm font-semibold text-slate-600">{client.newUsers}</td>
                                <td className="py-4 pr-4 text-sm font-semibold text-slate-600">{client.activeUsers}</td>
                                <td className="py-4 pr-4 text-sm font-semibold text-slate-600">{client.orders}</td>
                                <td className="py-4 pr-4 w-32">
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full",
                                                client.health > 80 ? "bg-emerald-500" :
                                                    client.health > 50 ? "bg-blue-500" : "bg-orange-500"
                                            )}
                                            style={{ width: `${client.health}%` }}
                                        ></div>
                                    </div>
                                </td>
                                <td className="py-4 pr-4 text-sm font-bold text-slate-800">{client.paymentReliability}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
