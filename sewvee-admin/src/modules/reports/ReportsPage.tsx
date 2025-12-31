import React from 'react';
import { FileText, Download, Filter, Search, FileDown } from 'lucide-react';
import { cn } from '../../utils';

export const ReportsPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports</h1>
                    <p className="text-slate-500 text-sm mt-1">Export data and schedule automated platform summaries</p>
                </div>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                    <FileText size={20} />
                    <span>Generate New Report</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Revenue Report', size: '2.4MB', icon: FileText },
                    { label: 'Client Growth', size: '1.8MB', icon: FileDown },
                    { label: 'Platform Audit', size: '4.2MB', icon: FileDown },
                    { label: 'Custom Export', size: '--', icon: FileText },
                ].map((report, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:border-primary-100 transition-all cursor-pointer">
                        <div className="h-12 w-12 rounded-2xl bg-gray-50 text-slate-400 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-all mb-4">
                            <report.icon size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 tracking-tight">{report.label}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{report.size} • PDF/CSV</p>
                        <div className="mt-6 flex items-center justify-between">
                            <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">Download</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-gray-50 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Report History</h2>
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search history..."
                                    className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary-500/20 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <button className="p-2 border rounded-xl text-slate-400 hover:text-slate-900 hover:bg-gray-50 transition-all">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {[
                        { name: 'Monthly Financial Summary - Apr 2024', date: 'Apr 30, 2024', type: 'PDF', status: 'Generated' },
                        { name: 'Weekly Client Onboarding List', date: 'Apr 28, 2024', type: 'CSV', status: 'Scheduled' },
                        { name: 'Custom Performance Audit - Q1', date: 'Apr 25, 2024', type: 'PDF', status: 'Generated' },
                        { name: 'Yearly Projection v2', date: 'Apr 20, 2024', type: 'PDF', status: 'Generated' },
                    ].map((item, idx) => (
                        <div key={idx} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group border-transparent">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                                    {item.type}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    item.status === 'Generated' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                )}>
                                    {item.status}
                                </span>
                                <button className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 opacity-0 group-hover:opacity-100">
                                    <Download size={16} className="text-slate-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
