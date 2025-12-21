'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { WebSocketProvider } from '@/lib/context/WebSocketContext';
import { useProtectedRoute } from '@/lib/hooks/useProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Video, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { loading } = useProtectedRoute();
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/dashboard/interviews', label: 'Interviews', icon: Video },
        { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
        { href: '/dashboard/profile', label: 'Profile', icon: User },
    ];

    return (
        <WebSocketProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={clsx(
                        'fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-200',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    )}
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold text-gradient">RANKEDterview</h1>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={clsx(
                                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-primary-100 text-primary-700 font-medium'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        )}
                                    >
                                        <Icon size={20} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-8 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium">{user?.name}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="lg:ml-64">
                    {/* Top Bar */}
                    <header className="bg-white dark:bg-gray-800 shadow-sm">
                        <div className="px-4 py-4 flex items-center justify-between">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu size={24} />
                            </button>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">
                                    Welcome back, <strong>{user?.name}</strong>!
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="p-6">{children}</main>
                </div>
            </div>
        </WebSocketProvider>
    );
}
