import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { 
  Plus, 
  Factory, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  Calendar,
  X,
  ClipboardList,
  LayoutDashboard
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import GenericMaster from '../components/GenericMaster';

export default function Production() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'control' | 'entry'>('control');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  const [newOrder, setNewOrder] = useState({
    product_id: '',
    quantity: 1,
    start_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (activeTab === 'control') {
      fetchOrders();
      fetchProducts();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const data = await api.get('/production');
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production', newOrder);
      setIsModalOpen(false);
      setNewOrder({
        product_id: '',
        quantity: 1,
        start_date: format(new Date(), 'yyyy-MM-dd')
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert('Failed to create production order');
    }
  };

  const tabs = [
    { id: 'control', label: 'Production Control', icon: LayoutDashboard },
    { id: 'entry', label: 'Production Entry', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Management</h1>
          <p className="text-sm text-slate-500">Monitor manufacturing orders and record production entries.</p>
        </div>
        {activeTab === 'control' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
          >
            <Plus size={20} />
            New Production Order
          </button>
        )}
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

      {activeTab === 'control' ? (
        <>
          {/* New Production Order Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">New Production Order</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateOrder} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Select Product</label>
                      <select
                        required
                        value={newOrder.product_id}
                        onChange={(e) => setNewOrder({ ...newOrder, product_id: e.target.value })}
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Choose a product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
                        <input
                          required
                          type="number"
                          min="1"
                          value={newOrder.quantity}
                          onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })}
                          className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
                        <input
                          required
                          type="date"
                          value={newOrder.start_date}
                          onChange={(e) => setNewOrder({ ...newOrder, start_date: e.target.value })}
                          className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
                      >
                        Create Order
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Production Orders Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {['Pending', 'In-Progress', 'Completed'].map((status) => (
              <div key={status} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      status === 'Pending' ? "bg-slate-400" : status === 'In-Progress' ? "bg-blue-500" : "bg-emerald-500"
                    )}></span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{status}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                    {orders.filter(o => o.status === status).length}
                  </span>
                </div>

                <div className="space-y-4">
                  {orders.filter(o => o.status === status).map((order) => (
                    <div key={order.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Factory size={20} />
                        </div>
                        <span className="text-xs font-mono text-slate-400">#PO-{order.id.toString().padStart(4, '0')}</span>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-bold text-slate-900">{order.product_name}</h4>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Layers size={14} />
                            Qty: {order.quantity}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {order.start_date ? format(new Date(order.start_date), 'MMM dd') : 'Not set'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                        <div className="flex -space-x-2">
                          {[1, 2].map(i => (
                            <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200">
                              <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} 
                                alt="worker" 
                                className="h-full w-full rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.status === status).length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-xs text-slate-400">
                      No orders in this stage
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <GenericMaster
          endpoint="/production_entries"
          title="Production Entry"
          fields={[
            { name: 'entry_no', label: 'Entry No', type: 'text', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'production_order_id', label: 'Production Order', type: 'select', required: true, optionsEndpoint: '/production' },
            { name: 'product_id', label: 'Product', type: 'select', required: true, optionsEndpoint: '/products' },
            { name: 'quantity_produced', label: 'Quantity Produced', type: 'number', required: true },
            { name: 'operator_name', label: 'Operator Name', type: 'text' }
          ]}
        />
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
