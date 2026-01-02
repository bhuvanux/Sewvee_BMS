
import React from 'react';
import {
    Edit, Phone, Mail, MapPin, TrendingUp, Users, Calendar, Zap, ExternalLink, BarChart2, Paperclip, Send, Eye, Mail as MailIcon, Trash2, Lightbulb, Activity, ShoppingCart, ShoppingBag, CreditCard, UserPlus, CheckCircle, XCircle, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { clientDetailData } from '../dashboard/mockData';
import { cn } from '../../utils';

export const ClientDetailPage: React.FC = () => {
    // In a real app, use useParams to fetch data
    // const { id } = useParams();
    const data = clientDetailData;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <Link to="/clients" className="hover:text-slate-800 transition-colors">Clients</Link>
                    <span>/</span>
                    <span className="text-slate-800 font-medium">ID : 29271739ss2134</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 uppercase">
                            {data.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{data.name}</h1>
                                <StatusBadge status={data.status} />
                            </div>
                            <div className="flex items-center space-x-3 mt-1 text-sm text-slate-500">
                                <span className="flex items-center"><MapPin size={14} className="mr-1" /> {data.location}</span>
                                <span className="flex items-center space-x-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold uppercase"><CrownIcon size={12} className="mr-1" /> {data.plan}</span>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold uppercase">New Boutique</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right mr-4">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mobile No</p>
                            <p className="text-lg font-bold text-slate-900">{data.phone}</p>
                        </div>
                        <div className="flex flex-col items-end mr-6">
                            <div className="flex items-center space-x-2">
                                <div className="h-10 w-10 rounded-full border-4 border-emerald-100 flex items-center justify-center bg-white text-xs font-bold text-emerald-600">87%</div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Health Score</p>
                                    <p className="text-sm font-bold text-emerald-500">Healthy</p>
                                </div>
                            </div>
                        </div>

                        <button className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center">
                            <Edit size={16} className="mr-2" /> Edit
                        </button>
                        <button className="px-4 py-2 bg-[#FF5C00] hover:bg-[#E65200] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center">
                            <BarChart2 size={16} className="mr-2" /> View Analytics
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.stats.map((stat, idx) => (
                    <StatCard
                        key={idx}
                        label={stat.title}
                        value={stat.value}
                        trend={stat.trend ? { value: stat.trend, isUp: stat.trendIsPositive } : undefined}
                        icon={getIcon(stat.icon)}
                    />
                ))}
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1: Boutique Details & Setup */}
                <div className="space-y-6">
                    {/* Boutique Details */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800">Boutique Details</h3>
                            <button><Edit size={16} className="text-blue-500" /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 bg-gray-100 rounded-full"></div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{data.name}</h4>
                                    <p className="text-xs text-slate-500">{data.location}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Mobile No</p>
                                    <p className="text-sm font-bold text-slate-800 flex items-center mt-1">
                                        <Phone size={14} className="mr-2 text-slate-400" /> {data.phone}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                                    <p className="text-sm font-bold text-slate-800 flex items-center mt-1">
                                        <Mail size={14} className="mr-2 text-slate-400" /> {data.email}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Account Status</p>
                                    <div className="mt-1"><StatusBadge status={data.status} /></div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Member Since</p>
                                    <p className="text-sm font-bold text-slate-800 mt-1">{data.memberSince}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Plan Type</p>
                                    <p className="text-sm font-bold text-slate-800 mt-1">{data.plan} ({data.planPrice})</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Next Billing</p>
                                    <p className="text-sm font-bold text-slate-800 mt-1">{data.nextBilling}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Setup Completion */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Boutique Setup Completion</h3>

                        <div className="mb-4">
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-slate-500">Completion</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
                                <div className="h-full bg-emerald-500 w-[89%]"></div>
                            </div>
                            <span className="text-sm font-bold text-emerald-500">89% Complete</span>
                        </div>

                        <div className="space-y-3">
                            {[
                                { label: 'Uploaded logo', done: true },
                                { label: 'Set shop name', done: true },
                                { label: 'Added products', done: true },
                                { label: 'Completed profile', done: true },
                                { label: 'Payment Integration', done: true },
                                { label: 'Added WhatsApp catalog', done: false },
                            ].map((step, idx) => (
                                <div key={idx} className="flex items-center space-x-2 text-sm">
                                    {step.done ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-400" />}
                                    <span className={cn("font-medium", step.done ? "text-slate-700" : "text-slate-400")}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2: Performance & Financials */}
                <div className="space-y-6">
                    {/* Performance Overview */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800">Boutique Performance Overview</h3>
                            <button className="text-xs font-bold text-slate-500 bg-gray-50 px-2 py-1 rounded-lg">This Week ▼</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Lifetime Revenue</p>
                                <p className="text-xl font-bold text-slate-900 tracking-tight">{data.performance.totalLifetimeRevenue}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">This Week Revenue</p>
                                <p className="text-xl font-bold text-slate-900 tracking-tight">{data.performance.thisWeekRevenue}</p>
                                <p className="text-xs font-bold text-emerald-500 flex items-center">
                                    <TrendingUp size={12} className="mr-1" /> {data.performance.weekTrend} <span className="text-slate-400 font-semibold ml-1">vs last week</span>
                                </p>
                            </div>
                        </div>

                        <div className="h-40 w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.performance.chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF5C00" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#FF5C00" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1E293B', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#FF5C00" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 px-2 mt-2">
                                {data.performance.chartData.map(d => <span key={d.day}>{d.day}</span>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Repeat Customer %</p>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-lg font-bold text-slate-900">30%</span>
                                    <span className="text-[10px] font-bold text-emerald-500">▲ 2%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Average Order Value</p>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-lg font-bold text-slate-900">₹1,250</span>
                                    <span className="text-[10px] font-bold text-emerald-500">▲ 8%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Overview */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800">Financial Overview</h3>
                        </div>

                        <div className="flex justify-between text-xs mb-4">
                            <div>
                                <span className="text-slate-400 font-bold uppercase block mb-1">Subscription Plan</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase inline-block mr-2">Professional</span>
                                <span className="font-bold text-slate-600">(₹900/month)</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 font-bold uppercase block mb-1">Next Billing</span>
                                <span className="font-bold text-slate-800 flex items-center justify-end"><Calendar size={12} className="mr-1 text-slate-400" /> December 31, 2025</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Past Invoices</h4>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#F8FAFC]">
                                        <tr>
                                            <th className="p-3 text-slate-500 font-bold">Invoice ID</th>
                                            <th className="p-3 text-slate-500 font-bold">Date</th>
                                            <th className="p-3 text-slate-500 font-bold">Amount</th>
                                            <th className="p-3 text-slate-500 font-bold">Status</th>
                                            <th className="p-3 text-slate-500 font-bold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.financials.invoices.map((inv, i) => (
                                            <tr key={i}>
                                                <td className="p-3 font-bold text-slate-800">{inv.id}</td>
                                                <td className="p-3 text-slate-600 font-medium">{inv.date}</td>
                                                <td className="p-3 font-bold text-slate-800">{inv.amount}</td>
                                                <td className="p-3"><span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{inv.status}</span></td>
                                                <td className="p-3 text-right"><button className="text-slate-400 hover:text-slate-600"><Download size={14} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-[#FF5C00] hover:bg-[#E65200] text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all">Upgrade</button>
                            <button className="flex-1 bg-white border border-gray-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Cancel Subscription</button>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Internal Notes</h3>

                        <div className="space-y-4 mb-4">
                            <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-800">
                                <p className="font-bold mb-1">Client called to inquire about new marketing features. Sent documentation.</p>
                                <p className="text-yellow-600/70">Added by Admin A on 12/28/2024, 10:30:00 AM</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-slate-600">
                                <p className="font-bold mb-1">Followed up on incomplete WhatsApp Catalog setup. Client requested a demo.</p>
                                <p className="text-slate-400">Added by Admin B on 11/15/2024, 2:15:00 PM</p>
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none min-h-[80px]"
                                placeholder="Add a new internal note..."
                            ></textarea>
                            <button className="absolute bottom-3 right-3 text-slate-400 hover:text-slate-600 flex items-center text-xs font-bold">
                                <Paperclip size={12} className="mr-1" /> Attach File
                            </button>
                        </div>
                        <button className="w-full mt-3 bg-[#FF5C00] hover:bg-[#E65200] text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all">Add Note</button>
                    </div>
                </div>

                {/* Column 3: Timeline & Intelligence */}
                <div className="space-y-6">
                    {/* Recent Timeline */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800">Recent Timeline</h3>
                        </div>

                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            {['All', 'Orders', 'Payments', 'Customers', 'Profile Updates'].map(filter => (
                                <button key={filter} className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap border",
                                    filter === 'All' ? "bg-[#FF5C00] text-white border-[#FF5C00]" : "bg-white text-slate-500 border-gray-200"
                                )}>
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <div className="relative pl-4 border-l border-dashed border-gray-200 space-y-8">
                            {data.timeline.map((item, idx) => {
                                const ItemIcon = getIcon(item.icon);
                                return (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-[21px] top-0 bg-white p-1 rounded-full border border-gray-100">
                                            <div className="bg-gray-100 p-1 rounded-full text-slate-500">
                                                <ItemIcon size={12} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 leading-snug">{item.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</p>
                                            {item.amount && <p className="text-xs font-bold text-slate-900 mt-1">{item.amount}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-bold text-slate-700">
                                <span className="flex items-center"><ExternalLink size={16} className="mr-3 text-slate-400" /> Login as Boutique</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-bold text-slate-700">
                                <span className="flex items-center"><Send size={16} className="mr-3 text-slate-400" /> Send WhatsApp Promo</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-bold text-slate-700">
                                <span className="flex items-center"><Eye size={16} className="mr-3 text-slate-400" /> View Catalog</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-bold text-slate-700">
                                <span className="flex items-center"><MailIcon size={16} className="mr-3 text-slate-400" /> Resend Onboarding Email</span>
                            </button>
                            <button className="w-full flex items-center justify-center p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors text-sm font-bold mt-4">
                                <span className="flex items-center"><Trash2 size={16} className="mr-2" /> Deactivate Account</span>
                            </button>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4">AI Insights & Predictions</h3>
                        <div className="space-y-4">
                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-start space-x-3">
                                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Zap size={14} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Optimize Product Descriptions</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">Improve SEO and conversion by adding more keywords.</p>
                                </div>
                            </div>
                            <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 flex items-start space-x-3">
                                <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600"><Lightbulb size={14} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Run a Flash Sale Campaign</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">Engage dormant customers within limited-time discount.</p>
                                </div>
                            </div>
                            <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 flex items-start space-x-3">
                                <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><MailIcon size={14} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Segment Email List</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">Create targeted campaigns for high-value vs new customers.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Next 30 Day Revenue</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">₹80,000</p>
                            </div>
                            <div className="text-center border-l border-gray-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Churn Risk</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">15% <span className="text-red-500 text-xs">▼</span></p>
                            </div>
                            <div className="text-center border-l border-gray-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Growth</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">+250 <span className="text-emerald-500 text-xs">▲</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper for icon mapping
const CrownIcon = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" />
    </svg>
);

const getIcon = (name: string) => {
    switch (name) {
        case 'Users': return Users;
        case 'TrendingUp': return TrendingUp;
        case 'Activity': return Activity;
        case 'ShoppingBag': return ShoppingBag;
        case 'ShoppingCart': return ShoppingCart;
        case 'CreditCard': return CreditCard;
        case 'UserPlus': return UserPlus;
        case 'Edit': return Edit;
        default: return Activity;
    }
};
