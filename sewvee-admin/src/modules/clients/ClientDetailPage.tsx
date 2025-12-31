import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    MoreVertical,
    Edit3,
    ExternalLink,
    ShoppingBag,
    Users as UsersIcon,
    CreditCard,
    Heart,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Zap
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../firebase';
import { cn } from '../../utils';

export const ClientDetailPage: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            try {
                const docRef = doc(db, COLLECTIONS.USERS, clientId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setClient({ id: snap.id, ...snap.data() });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Client Not Found</h2>
                <Link to="/clients" className="text-primary-600 font-bold hover:underline mt-4 inline-block">Back to Clients</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {/* Detail Header */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="space-y-2">
                    <Link to="/clients" className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-primary-500 transition-colors">
                        <ArrowLeft size={14} className="mr-1" />
                        Back to Clients
                    </Link>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{client.name || 'Untitled Boutique'}</h1>
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                            <span>Active</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-slate-700 hover:bg-gray-50 transition-all shadow-sm">
                        <Edit3 size={18} />
                        <span>Edit Profile</span>
                    </button>
                    <button className="p-3 bg-white border border-gray-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Grid: Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Orders', value: client.totalOrders || '0', icon: ShoppingBag, color: 'blue', trend: '+12%' },
                    { label: 'Active Users', value: client.totalUsers || '0', icon: UsersIcon, color: 'orange', trend: '+5%' },
                    { label: 'Revenue Generated', value: '₹0.0L', icon: CreditCard, color: 'emerald', trend: '+0%' },
                    { label: 'Client Health', value: '100%', icon: Heart, color: 'rose', trend: '+0%' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary-100 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                    stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                        stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-rose-50 text-rose-600'
                            )}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-xl font-black text-slate-900 leading-tight">{stat.value}</p>
                            </div>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{stat.trend}</div>
                    </div>
                ))}
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-orange-100 flex items-center justify-center text-4xl font-extrabold text-orange-600 mb-6 shadow-xl shadow-orange-500/10 rotate-3 overflow-hidden">
                                {client.profileImage ? (
                                    <img src={client.profileImage} alt={client.name} className="h-full w-full object-cover" />
                                ) : (
                                    client.name?.charAt(0) || 'B'
                                )}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{client.name || 'Boutique Name'}</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center">
                                <span className="mr-1">🔗</span> {client.id.substring(0, 10)}...
                            </p>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: Mail, label: 'Email', value: client.email || 'N/A' },
                                { icon: Phone, label: 'Phone', value: client.phone || 'N/A' },
                                { icon: MapPin, label: 'Address', value: client.location || 'Not Set' },
                                { icon: Calendar, label: 'Member Since', value: new Date(client.createdAt).toLocaleDateString() },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start space-x-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-slate-400 border border-transparent group-hover:border-gray-100 transition-all">
                                        <item.icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Zap size={18} className="text-orange-500 fill-orange-500" />
                                    <span className="text-sm font-black text-slate-800">{client.plan || 'Free'} Plan</span>
                                </div>
                                <button className="text-[10px] font-bold text-primary-600 uppercase tracking-wider hover:underline">Manage</button>
                            </div>
                            <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100">
                                <div className="h-full w-3/4 bg-orange-500 rounded-full"></div>
                            </div>
                        </div>

                        <button className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-3 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]">
                            <span>Login as Boutique Owner</span>
                            <ExternalLink size={18} />
                        </button>
                    </div>
                </div>

                {/* Right Column: Performance & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Charts Area */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Monthly Performance</h3>
                            <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 text-[10px] font-extrabold uppercase tracking-wider">
                                <button className="px-3 py-1.5 rounded-lg bg-white shadow-sm text-slate-800">Sales</button>
                                <button className="px-3 py-1.5 rounded-lg text-slate-400">Activity</button>
                            </div>
                        </div>

                        <div className="h-64 w-full flex flex-col justify-center items-center text-slate-300">
                            <div className="flex items-end space-x-2 h-40">
                                {[34, 45, 23, 67, 89, 45, 67, 98, 45, 78, 90, 100].map((h, i) => (
                                    <div key={i} className="w-4 bg-primary-100 rounded-t-sm relative group" style={{ height: `${h}%` }}>
                                        <div className="absolute inset-0 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-sm"></div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] uppercase font-bold tracking-widest mt-8">Data visualization matches dashboard aesthetics</p>
                        </div>
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Activity Log</h3>
                            <button className="text-xs font-bold text-primary-600 uppercase tracking-widest hover:underline px-4 py-2 bg-primary-50 rounded-xl">View All Log</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[
                                { type: 'order', title: 'New Order Received', meta: '#ORD-123984', time: '2 mins ago', amount: '₹12,400' },
                                { type: 'user', title: 'Staff Member Added', meta: 'Riya Gupta (Tailor)', time: '1 hour ago' },
                                { type: 'payment', title: 'Subscription Renewed', meta: 'Monthly Pro Plan', time: '5 hours ago', amount: '₹1,499' },
                                { type: 'config', title: 'Boutique Settings Updated', meta: 'Working Hours', time: '12 hours ago' },
                            ].map((log, idx) => (
                                <div key={idx} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-default border-transparent">
                                    <div className="flex items-center space-x-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                                            log.type === 'order' ? 'bg-blue-50 text-blue-500' :
                                                log.type === 'user' ? 'bg-emerald-50 text-emerald-500' :
                                                    log.type === 'payment' ? 'bg-purple-50 text-purple-500' :
                                                        'bg-orange-50 text-orange-500'
                                        )}>
                                            {log.type === 'order' && <ShoppingBag size={18} />}
                                            {log.type === 'user' && <UsersIcon size={18} />}
                                            {log.type === 'payment' && <CreditCard size={18} />}
                                            {log.type === 'config' && <Calendar size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{log.title}</p>
                                            <p className="text-xs text-slate-400 font-medium">{log.meta}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-700">{log.time}</p>
                                        {log.amount && <p className="text-xs font-black text-primary-600 mt-0.5">{log.amount}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
