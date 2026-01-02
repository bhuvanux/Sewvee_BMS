import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    PieChart,
    FileText,
    Settings,
    LogOut,
    Menu,
    Calendar,
    Megaphone
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Clients', path: '/clients', icon: Users },
        { name: 'Marketing', path: '/marketing', icon: Megaphone },
        { name: 'Payments', path: '/payments', icon: CreditCard },
        { name: 'Analytics', path: '/analytics', icon: PieChart },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-screen bg-[#F9FAFB] overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="flex items-center space-x-2 h-20 px-8">
                        <div className="h-8 w-8 bg-[#FF5C00] rounded-lg flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">Sewvee</span>
                    </div>

                    <div className="px-8 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">Main Menu</div>

                    <nav className="flex-1 px-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-orange-50 text-[#FF5C00]'
                                        : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'
                                        }`}
                                >
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile in Sidebar Bottom */}
                    <div className="p-6 border-t border-gray-100">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-[#FF5C00] font-bold text-lg border-2 border-white shadow-sm">
                                {auth.currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">Admin User</p>
                                <p className="text-xs text-slate-400 truncate">{auth.currentUser?.email || 'admin@sewvee.com'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-2 text-slate-400 hover:text-[#FF5C00] transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-24 flex items-center justify-between px-8 flex-shrink-0 z-10 bg-[#F9FAFB]">
                    <div className="flex items-center space-x-4">
                        <button className="lg:hidden p-2 text-slate-600 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                            <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="h-11 px-5 flex items-center space-x-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                            <Calendar size={18} />
                            <span>This Month</span>
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
                                <path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Page Content Scroll */}
                <main className="flex-1 overflow-y-auto px-8 pb-8 scroll-smooth">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};
