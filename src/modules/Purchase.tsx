import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Calendar,
  ClipboardList,
  Plus
} from 'lucide-react';
import { OrderManagement } from '../components/OrderManagement';
import { ScheduleManagement } from '../components/ScheduleManagement';

export default function Purchase() {
  const [activeTab, setActiveTab] = useState<'orders' | 'schedules'>('orders');

  const tabs = [
    { id: 'orders', label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'schedules', label: 'Purchase Schedules', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Management</h1>
          <p className="text-sm text-slate-500">Manage procurement orders and delivery schedules.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.id 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' ? (
        <OrderManagement type="purchase" />
      ) : (
        <ScheduleManagement type="purchase" />
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
