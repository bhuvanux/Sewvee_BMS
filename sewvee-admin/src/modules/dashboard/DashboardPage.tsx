import React from 'react';
import {
    Users,
    Activity,
    CreditCard,
    TrendingUp,
    Calendar,
    Layers,
    PieChart
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { cn } from '../../utils';

export const DashboardPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Platform overview and performance metrics</p>
                </div>
                <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                    <button className="px-4 py-2 font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Today</button>
                    <button className="px-4 py-2 font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Weekly</button>
                    <button className="px-6 py-2 bg-[#FF5C00] text-white rounded-[0.8rem] font-bold text-xs uppercase tracking-widest shadow-md shadow-orange-500/10">Monthly</button>
                    <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>
                    <button className="px-4 py-2 font-bold text-xs uppercase tracking-widest text-slate-900 flex items-center space-x-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Custom Range</span>
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total MRR"
                    value="₹12.45L"
                    trend={{ value: '12.5%', isUp: true }}
                    icon={CreditCard}
                />
                <StatCard
                    label="Active Clients"
                    value="1,245"
                    trend={{ value: '3.2%', isUp: true }}
                    icon={Users}
                />
                <StatCard
                    label="DAU / MAU"
                    value="64.2%"
                    trend={{ value: '1.4%', isUp: false }}
                    icon={Activity}
                    className="lg:col-span-1"
                />
                <StatCard
                    label="Avg Order Value"
                    value="₹842"
                    trend={{ value: '8.1%', isUp: true }}
                    icon={TrendingUp}
                />
            </div>

            {/* Charts Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart - 2 columns wide */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Platform Revenue</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Subscription Growth</p>
                        </div>
                        <div className="flex items-center space-x-6 text-xs font-bold uppercase tracking-widest">
                            <div className="flex items-center space-x-2">
                                <span className="h-3 w-3 rounded-full bg-primary-500"></span>
                                <span className="text-slate-700">Current</span>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-400">
                                <span className="h-3 w-3 rounded-full bg-gray-200"></span>
                                <span>Previous</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Mockup */}
                    <div className="flex-1 min-h-[300px] relative flex flex-col justify-end">
                        <div className="absolute inset-0 flex flex-col justify-between py-2 text-[10px] font-bold text-slate-300">
                            {[4, 3, 2, 1].map(n => <div key={n} className="border-t border-gray-50 flex items-center">{n}0L</div>)}
                            <div className="border-t border-gray-50 flex items-center">0L</div>
                        </div>
                        <div className="h-full w-full flex items-end justify-between px-8 z-10 pt-4">
                            {[40, 55, 45, 78, 90, 85, 95, 110, 105, 125, 130, 145].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                    <div
                                        className="w-1.5 bg-gradient-to-t from-primary-50 to-primary-500 rounded-full transition-all duration-1000 group hover:w-3"
                                        style={{ height: `${h / 2}%` }}
                                    ></div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-4 uppercase hidden md:block">
                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activation Funnel Chart */}
                <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Activation Funnel</h3>
                        <Layers size={18} className="text-slate-300" />
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'Registered', value: '2,431', percent: '100%', color: 'blue' },
                            { label: 'Shop Setup', value: '1,842', percent: '76%', color: 'indigo' },
                            { label: 'First Customer', value: '1,120', percent: '46%', color: 'violet' },
                            { label: 'Pro Plan', value: '849', percent: '35%', color: 'orange' },
                        ].map((step, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-700">{step.label}</span>
                                    <span className="text-[10px] font-black text-slate-400 bg-gray-50 px-2 py-1 rounded-lg uppercase">{step.percent}</span>
                                </div>
                                <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000",
                                            step.color === 'blue' ? 'bg-blue-500' :
                                                step.color === 'indigo' ? 'bg-indigo-500' :
                                                    step.color === 'violet' ? 'bg-violet-500' :
                                                        'bg-orange-500'
                                        )}
                                        style={{ width: step.percent }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-50 bg-gray-50/30 -mx-8 -mb-8 p-8 rounded-b-3xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onboarding Drop-off</span>
                            <span className="text-xs font-black text-rose-500">-5.2% WoW</span>
                        </div>
                        <div className="flex items-end justify-between h-8 px-2">
                            {[40, 30, 45, 20, 35, 25, 30].map((h, i) => (
                                <div key={i} className="w-1 bg-rose-200 rounded-full" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Segmentation Section */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Client Segmentation</h3>
                        <PieChart size={18} className="text-slate-300" />
                    </div>

                    <div className="flex items-center justify-around flex-1">
                        <div className="relative">
                            {/* Mock Donut Chart */}
                            <div className="h-44 w-44 rounded-full border-[20px] border-gray-50 flex items-center justify-center relative">
                                <div className="absolute inset-[-20px] rounded-full border-[20px] border-primary-500 border-t-transparent border-r-transparent rotate-12"></div>
                                <div className="absolute inset-[-20px] rounded-full border-[20px] border-indigo-500 border-l-transparent border-b-transparent -rotate-12 opacity-50"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-black text-slate-900 leading-none">82%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Healthy</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Active (Healthy)', value: '842', color: 'bg-primary-500' },
                                { label: 'Inactive (Churn Risk)', value: '143', color: 'bg-indigo-400 shadow-inner' },
                                { label: 'Trialing', value: '259', color: 'bg-blue-400' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-3">
                                    <div className={cn("h-3 w-3 rounded-full", item.color)}></div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 leading-none">{item.label}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{item.value} Clients</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Boutiques List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Top Performing Boutiques</h3>
                        <button className="text-xs font-bold text-primary-600 hover:underline uppercase tracking-widest">View All Leaderboard</button>
                    </div>

                    <div className="space-y-2">
                        {[
                            { rank: 1, name: 'Chic Boutique', orders: '4.2k', rev: '₹42L', growth: '+12%' },
                            { rank: 2, name: 'Urban Threads', orders: '3.8k', rev: '₹38L', growth: '+8%' },
                            { rank: 3, name: 'Minimalist Studio', orders: '2.9k', rev: '₹29L', growth: '+15%' },
                            { rank: 4, name: 'Retro Vibes', orders: '2.4k', rev: '₹24L', growth: '+4%' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-default border border-transparent hover:border-gray-100">
                                <div className="flex items-center space-x-4">
                                    <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs">
                                        {item.rank}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.orders} Monthly Orders</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">{item.rev}</p>
                                    <p className="text-[10px] font-bold text-emerald-500">{item.growth} Growth</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
