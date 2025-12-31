import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Users,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    PieChart,
    FileText,
    Settings,
    Calendar
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
            {/* Sidebar for Desktop - Matches Design sidebar color and style */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="flex items-center space-x-2 h-20 px-6 border-b">
                        <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">S</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">Sewvee</span>
                    </div>

                    <div className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Main Menu</div>

                    <nav className="flex-1 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-primary-50 text-primary-600 shadow-sm'
                                            : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'
                                        }`}
                                >
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile in Sidebar Bottom */}
                    <div className="p-4 border-t">
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold uppercase">
                                {auth.currentUser?.email?.charAt(0) || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">Admin User</p>
                                <p className="text-xs text-slate-500 truncate">{auth.currentUser?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-3 flex items-center justify-center space-x-2 w-full px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100"
                        >
                            <LogOut size={18} />
                            <span className="font-semibold text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header - Transparent and clean like design */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10">
                    <div className="flex items-center space-x-4">
                        <button className="lg:hidden p-2 text-slate-600 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="hidden lg:flex items-center space-x-2 text-sm text-slate-400">
                            {/* Breadcrumbs or secondary info could go here */}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 lg:space-x-6">
                        <div className="relative group">
                            {/* Search bar mockup */}
                            <div className="hidden md:flex items-center bg-gray-100 rounded-xl px-4 py-2 w-64 border border-transparent focus-within:border-primary-300 focus-within:bg-white transition-all">
                                <span className="text-slate-400 mr-2">/</span>
                                <input type="text" placeholder="Search..." className="bg-transparent text-sm w-full focus:outline-none" />
                            </div>
                        </div>

                        <button className="h-10 px-4 flex items-center space-x-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                            <Calendar size={18} />
                            <span>This Month</span>
                        </button>
                    </div>
                </header>

                {/* Page Content Scroll */}
                <main className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scroll-smooth">
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
