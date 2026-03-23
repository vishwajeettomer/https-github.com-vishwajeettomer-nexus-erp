import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { 
  Plus, 
  Search, 
  FileText, 
  Download,
  CheckCircle2,
  Clock,
  User,
  X,
  Trash2,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import GenericMaster from '../components/GenericMaster';

export default function Sales() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'sale_orders' | 'sale_schedules'>('invoices');
  const api = useApi();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [newSale, setNewSale] = useState({
    customer_id: '',
    items: [] as any[],
    total_amount: 0,
    tax_amount: 0
  });

  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchSales();
      fetchInitialData();
    }
  }, [activeTab]);

  const fetchSales = async () => {
    try {
      const data = await api.get('/sales');
      setSales(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [custData, prodData] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      setCustomers(custData);
      setProducts(prodData);
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = () => {
    setNewSale({
      ...newSale,
      items: [...newSale.items, { product_id: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...newSale.items];
    newItems.splice(index, 1);
    calculateTotals(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...newSale.items];
    newItems[index][field] = value;
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].unit_price = product.price;
      }
    }
    
    calculateTotals(newItems);
  };

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.18; // 18% GST
    setNewSale({
      ...newSale,
      items,
      total_amount: subtotal + tax,
      tax_amount: tax
    });
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSale.items.length === 0) return alert('Add at least one item');
    
    try {
      await api.post('/sales', newSale);
      setIsModalOpen(false);
      setNewSale({
        customer_id: '',
        items: [],
        total_amount: 0,
        tax_amount: 0
      });
      fetchSales();
    } catch (e) {
      console.error(e);
      alert('Failed to create sale');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Management</h1>
          <p className="text-sm text-slate-500">Manage invoices, sale orders, and schedules.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'invoices'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('sale_orders')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'sale_orders'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingCart size={18} />
          Sale Orders
        </button>
        <button
          onClick={() => setActiveTab('sale_schedules')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'sale_schedules'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar size={18} />
          Sale Schedules
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                <Download size={20} />
                Export
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
              >
                <Plus size={20} />
                New Invoice
              </button>
            </div>

            {/* New Invoice Modal */}
            <AnimatePresence>
              {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateSale} className="space-y-6">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Select Customer</label>
                        <select
                          required
                          value={newSale.customer_id}
                          onChange={(e) => setNewSale({ ...newSale, customer_id: e.target.value })}
                          className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Choose a customer...</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Invoice Items</h3>
                          <button 
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            <Plus size={16} />
                            Add Item
                          </button>
                        </div>

                        <div className="space-y-3">
                          {newSale.items.map((item, index) => (
                            <div key={index} className="flex items-end gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                              <div className="flex-1">
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Product</label>
                                <select
                                  required
                                  value={item.product_id}
                                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                  className="w-full rounded-lg border-none bg-white px-3 py-1.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="">Select...</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-24">
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Qty</label>
                                <input
                                  required
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                  className="w-full rounded-lg border-none bg-white px-3 py-1.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="w-28">
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Price</label>
                                <div className="flex h-8 items-center rounded-lg bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm">
                                  ₹{(item.quantity * item.unit_price).toLocaleString()}
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeItem(index)}
                                className="mb-1 text-slate-400 hover:text-red-500"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 border-t border-slate-100 pt-6">
                        <div className="flex w-48 justify-between text-sm text-slate-500">
                          <span>Tax (18% GST):</span>
                          <span className="font-semibold">₹{newSale.tax_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex w-48 justify-between text-lg font-bold text-slate-900">
                          <span>Total:</span>
                          <span className="font-bold">₹{newSale.total_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
                        >
                          Create Invoice
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Sales Table */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">Loading sales...</td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No sales records found.</td></tr>
                  ) : sales.map((sale) => (
                    <tr key={sale.id} className="group hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <FileText size={18} />
                          </div>
                          <span className="font-mono font-semibold text-slate-900">#INV-{sale.id.toString().padStart(4, '0')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span className="font-medium text-slate-900">{sale.customer_name || 'Guest Customer'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {format(new Date(sale.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">₹{sale.total_amount.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">Tax: ₹{sale.tax_amount}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          sale.status === 'Completed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {sale.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sale_orders' && (
          <GenericMaster 
            endpoint="sale_orders" 
            title="Sale Order" 
            fields={[
              { name: 'order_no', label: 'Order No', type: 'text', required: true },
              { name: 'date', label: 'Date', type: 'date', required: true },
              { name: 'customer_id', label: 'Customer', type: 'select', optionsEndpoint: '/customers', required: true, displayField: 'customer_name' },
              { name: 'total_amount', label: 'Total Amount (₹)', type: 'number' },
              { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Confirmed', 'Shipped', 'Delivered'] }
            ]} 
          />
        )}

        {activeTab === 'sale_schedules' && (
          <GenericMaster 
            endpoint="sale_schedules" 
            title="Sale Schedule" 
            fields={[
              { name: 'sale_order_id', label: 'Sale Order', type: 'select', optionsEndpoint: '/sale_orders', required: true, displayField: 'order_no' },
              { name: 'product_id', label: 'Product', type: 'select', optionsEndpoint: '/products', required: true, displayField: 'product_name' },
              { name: 'scheduled_date', label: 'Scheduled Date', type: 'date', required: true },
              { name: 'quantity', label: 'Quantity', type: 'number', required: true },
              { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'In Transit', 'Delivered'] }
            ]} 
          />
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
