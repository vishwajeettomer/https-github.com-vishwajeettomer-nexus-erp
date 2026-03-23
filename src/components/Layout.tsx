import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ShoppingBag,
  Factory, 
  BarChart3,
  Users, 
  Settings, 
  Database,
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'purchase', label: 'Purchase', icon: ShoppingBag },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'master', label: 'Master', icon: Database },
    { id: 'admin', label: 'Admin Panel', icon: Users, roles: ['Admin'] },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    (!item.roles || (user && item.roles.includes(user.role))) &&
    (!user || !user.permissions || user.permissions.includes(item.id))
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="relative flex flex-col border-r border-slate-200 bg-white shadow-sm"
      >
        <div className="flex h-16 items-center justify-between px-6">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.span
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold tracking-tight text-indigo-600"
              >
                NEXUS ERP
              </motion.span>
            ) : (
              <motion.span
                key="logo-short"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold text-indigo-600"
              >
                N
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-1.5 hover:bg-slate-100"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {isSidebarOpen && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search anything..."
                className="h-10 w-64 rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-slate-900">
              <Bell size={22} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs font-medium text-slate-500">{user?.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 p-0.5 ring-2 ring-indigo-50">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                  alt="avatar"
                  className="h-full w-full rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
