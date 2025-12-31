import React from 'react';
import { AreaChart, BarChart2, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { StatCard } from '../../components/StatCard';

export const AnalyticsPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1">Deep dive into platform performance and user cohorts</p>
                </div>
                <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm text-xs font-bold uppercase tracking-widest">
                    <button className="px-4 py-2 text-slate-400 hover:text-slate-900 transition-colors">7D</button>
                    <button className="px-4 py-2 text-slate-400 hover:text-slate-900 transition-colors">30D</button>
                    <button className="px-6 py-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">90D</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="User Retention" value="42%" icon={AreaChart} trend={{ value: '1.2%', isUp: true }} />
                <StatCard label="Churn Rate" value="3.4%" icon={PieChart} trend={{ value: '0.5%', isUp: false }} />
                <StatCard label="Platform Growth" value="+24%" icon={TrendingUp} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-80 flex flex-col items-center justify-center text-slate-300">
                    <BarChart2 size={48} className="mb-4 opacity-50 transition-transform group-hover:scale-110" />
                    <h3 className="text-lg font-bold text-slate-800">Retention Cohorts</h3>
                    <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest">Advanced visualization in development</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-80 flex flex-col items-center justify-center text-slate-300">
                    <TrendingUp size={48} className="mb-4 opacity-50 transition-transform group-hover:scale-110" />
                    <h3 className="text-lg font-bold text-slate-800">Growth Projection</h3>
                    <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest">ML Insights coming soon</p>
                </div>
            </div>

            {/* Analytics Placeholder Section */}
            <div className="bg-indigo-900 rounded-3xl p-12 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp size={240} />
                </div>
                <div className="relative z-10 max-w-xl">
                    <h2 className="text-3xl font-black mb-4">Precision Intelligence</h2>
                    <p className="text-indigo-200 font-medium mb-8">We are connecting the Sewvee Action Engine to provide real-time boutique health scores and automated optimization suggestions.</p>
                    <div className="flex items-center space-x-4">
                        <button className="py-3 px-8 bg-white text-indigo-900 rounded-2xl font-bold text-sm shadow-xl shadow-black/20 hover:bg-white/90 transition-all active:scale-95">Explore Roadmap</button>
                        <button className="py-3 px-8 bg-white/10 text-white rounded-2xl font-bold text-sm border border-white/20 hover:bg-white/20 transition-all flex items-center space-x-2">
                            <Calendar size={18} />
                            <span>Schedule Presentation</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
