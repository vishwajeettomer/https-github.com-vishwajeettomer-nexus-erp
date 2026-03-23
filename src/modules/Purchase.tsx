import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Calendar,
  ClipboardList,
  Plus
} from 'lucide-react';
import GenericMaster from '../components/GenericMaster';

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
        <GenericMaster
          endpoint="purchase_orders"
          title="Purchase Order"
          fields={[
            { name: 'order_number', label: 'PO Number', type: 'text', required: true },
            { name: 'order_date', label: 'Order Date', type: 'date', required: true },
            { name: 'supplier_id', label: 'Supplier', type: 'select', required: true, optionsEndpoint: 'suppliers' },
            { name: 'product_id', label: 'Product', type: 'select', required: true, optionsEndpoint: 'products' },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true },
            { name: 'unit_price', label: 'Unit Price (₹)', type: 'number', required: true },
            { name: 'status', label: 'Status', type: 'select', required: true, options: [
              { id: 'Draft', name: 'Draft' },
              { id: 'Sent', name: 'Sent' },
              { id: 'Received', name: 'Received' },
              { id: 'Cancelled', name: 'Cancelled' }
            ]}
          ]}
        />
      ) : (
        <GenericMaster
          endpoint="purchase_schedules"
          title="Purchase Schedule"
          fields={[
            { name: 'purchase_order_id', label: 'Purchase Order', type: 'select', required: true, optionsEndpoint: 'purchase_orders' },
            { name: 'delivery_date', label: 'Delivery Date', type: 'date', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true },
            { name: 'status', label: 'Status', type: 'select', required: true, options: [
              { id: 'Pending', name: 'Pending' },
              { id: 'Delivered', name: 'Delivered' },
              { id: 'Delayed', name: 'Delayed' }
            ]}
          ]}
        />
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
