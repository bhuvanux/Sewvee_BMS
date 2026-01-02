import React, { useState } from 'react';
import { FileText, Download, Filter, Search, FileDown } from 'lucide-react';
import { cn } from '../../utils';
import { reportsData } from '../dashboard/mockData';

export const ReportsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReports = reportsData.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pt-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Export data and schedule automated platform summaries</p>
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
                <div className="p-6 border-b border-gray-50 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Report History</h2>
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search history..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-xs font-medium w-64 focus:ring-2 focus:ring-primary-500/20 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-600"
                                />
                            </div>
                            <button className="p-2 border border-gray-200 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-gray-50 transition-all">
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filteredReports.length > 0 ? filteredReports.map((item, idx) => (
                        <div key={idx} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group border-transparent">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                                    {item.type === 'Finance' ? 'PDF' : 'CSV'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.date} • {item.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    item.status === 'Ready' || item.status === 'Generated' ? 'bg-emerald-50 text-emerald-600' :
                                        item.status === 'Failed' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                )}>
                                    {item.status}
                                </span>
                                <button className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 opacity-0 group-hover:opacity-100 shadow-sm">
                                    <Download size={16} className="text-slate-400" />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center text-slate-500 italic text-sm">No reports found matching your search.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
