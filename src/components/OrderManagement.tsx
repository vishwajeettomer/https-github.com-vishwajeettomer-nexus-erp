import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, X, Save, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../services/api';

interface OrderItem {
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  hsn_sac: string;
  unit?: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  amount: number;
}

interface Order {
  id?: string;
  order_no: string;
  date: string;
  customer_id?: string;
  supplier_id?: string;
  customer_name?: string;
  supplier_name?: string;
  customer_state_id?: number;
  supplier_state_id?: number;
  items: OrderItem[];
  total_amount: number;
  discount_total: number;
  tax_total: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  grand_total: number;
  order_effective_from?: string;
  order_effective_till?: string;
  amendment_date?: string;
  amendment_effective_date?: string;
  status: string;
}

interface OrderManagementProps {
  type: 'sale' | 'purchase';
  onClose?: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ type, onClose }) => {
  const api = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]); // Customers or Suppliers
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const initialOrderState: Order = {
    order_no: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    total_amount: 0,
    discount_total: 0,
    tax_total: 0,
    cgst_total: 0,
    sgst_total: 0,
    igst_total: 0,
    grand_total: 0,
    order_effective_from: '',
    order_effective_till: '',
    amendment_date: '',
    amendment_effective_date: '',
    status: 'Pending'
  };

  const [newOrder, setNewOrder] = useState<Order>(initialOrderState);

  useEffect(() => {
    fetchData();
  }, [type]);

  const resetForm = () => {
    setNewOrder(initialOrderState);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, entitiesData, settingsData] = await Promise.all([
        api.get(type === 'sale' ? '/sale_orders' : '/purchase_orders'),
        api.get('/products'),
        api.get(type === 'sale' ? '/customers' : '/suppliers'),
        api.get('/settings')
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setEntities(entitiesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: OrderItem[], entityId: string) => {
    const entity = entities.find(e => e.id.toString() === entityId);
    const companyStateId = parseInt(settings.company_state_id || '1');
    const entityStateId = entity ? entity.state_id : companyStateId;
    const isLocal = entityStateId === companyStateId;

    let total_amount = 0;
    let discount_total = 0;
    let cgst_total = 0;
    let sgst_total = 0;
    let igst_total = 0;

    const updatedItems = items.map(item => {
      const product = products.find(p => p.id.toString() === item.product_id);
      const taxRate = 18; // Default 18% for now, can be dynamic from product/tax master
      
      const lineTotal = item.quantity * item.unit_price;
      const lineDiscount = (lineTotal * item.discount) / 100;
      const taxableAmount = lineTotal - lineDiscount;
      
      let cgst_rate = 0, sgst_rate = 0, igst_rate = 0;
      let cgst_amount = 0, sgst_amount = 0, igst_amount = 0;

      if (isLocal) {
        cgst_rate = taxRate / 2;
        sgst_rate = taxRate / 2;
        cgst_amount = (taxableAmount * cgst_rate) / 100;
        sgst_amount = (taxableAmount * sgst_rate) / 100;
      } else {
        igst_rate = taxRate;
        igst_amount = (taxableAmount * igst_rate) / 100;
      }

      const amount = taxableAmount + cgst_amount + sgst_amount + igst_amount;

      total_amount += taxableAmount;
      discount_total += lineDiscount;
      cgst_total += cgst_amount;
      sgst_total += sgst_amount;
      igst_total += igst_amount;

      return {
        ...item,
        hsn_sac: product?.hsn_sac || '',
        unit: product?.unit || '',
        cgst_rate, sgst_rate, igst_rate,
        cgst_amount, sgst_amount, igst_amount,
        amount
      };
    });

    const tax_total = cgst_total + sgst_total + igst_total;
    const grand_total = total_amount + tax_total;

    return {
      items: updatedItems,
      total_amount,
      discount_total,
      tax_total,
      cgst_total,
      sgst_total,
      igst_total,
      grand_total
    };
  };

  const addItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: '',
        quantity: 1,
        unit_price: 0,
        discount: 0,
        hsn_sac: '',
        unit: '',
        cgst_rate: 0, sgst_rate: 0, igst_rate: 0,
        cgst_amount: 0, sgst_amount: 0, igst_amount: 0,
        amount: 0
      }]
    }));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'product_id') {
      const product = products.find(p => p.id.toString() === value);
      if (product) {
        updatedItems[index].unit_price = product.price;
        updatedItems[index].hsn_sac = product.hsn_sac || '';
        updatedItems[index].unit = product.unit || '';
      }
    }

    const totals = calculateTotals(updatedItems, type === 'sale' ? newOrder.customer_id || '' : newOrder.supplier_id || '');
    setNewOrder(prev => ({ ...prev, ...totals }));
  };

  const removeItem = (index: number) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    const totals = calculateTotals(updatedItems, type === 'sale' ? newOrder.customer_id || '' : newOrder.supplier_id || '');
    setNewOrder(prev => ({ ...prev, ...totals }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = type === 'sale' ? '/sale_orders' : '/purchase_orders';
      if (newOrder.id) {
        await api.put(`${endpoint}/${newOrder.id}`, newOrder);
      } else {
        await api.post(endpoint, newOrder);
      }
      setIsModalOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleEdit = (order: Order) => {
    setNewOrder({ ...order });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await api.delete(`${type === 'sale' ? '/sale_orders' : '/purchase_orders'}/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handlePrint = (order: Order) => {
    setSelectedOrder(order);
    setIsPrintModalOpen(true);
  };

  const selectedEntity = entities.find(e => e.id.toString() === (type === 'sale' ? newOrder.customer_id : newOrder.supplier_id));

  if (loading) return <div className="p-8 text-center text-slate-500">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 capitalize">{type} Orders</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
        >
          <Plus size={20} />
          New {type === 'sale' ? 'Sale' : 'Purchase'} Order
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Order No</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">{type === 'sale' ? 'Customer' : 'Supplier'}</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{order.order_no}</td>
                <td className="px-6 py-4 text-slate-600">{order.date}</td>
                <td className="px-6 py-4 text-slate-600">{type === 'sale' ? order.customer_name : order.supplier_name}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">₹{order.grand_total.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handlePrint(order)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Print Report"
                    >
                      <Printer size={18} />
                    </button>
                    <button 
                      onClick={() => handleEdit(order)}
                      className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                      title="Edit Order"
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      onClick={() => order.id && handleDelete(order.id.toString())}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl rounded-2xl bg-white p-8 shadow-xl my-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {newOrder.id ? 'Edit' : 'New'} {type === 'sale' ? 'Sale' : 'Purchase'} Order
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Order No</label>
                    <input
                      required
                      type="text"
                      value={newOrder.order_no}
                      onChange={(e) => setNewOrder({ ...newOrder, order_no: e.target.value })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. SO-001"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                    <input
                      required
                      type="date"
                      value={newOrder.date}
                      onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Select {type === 'sale' ? 'Customer' : 'Supplier'}</label>
                    <select
                      required
                      value={type === 'sale' ? newOrder.customer_id : newOrder.supplier_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        const key = type === 'sale' ? 'customer_id' : 'supplier_id';
                        const totals = calculateTotals(newOrder.items, val);
                        setNewOrder({ ...newOrder, [key]: val, ...totals });
                      }}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose...</option>
                      {entities.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
                    <div className="w-full rounded-xl border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-600 min-h-[42px]">
                      {selectedEntity?.address || 'Select entity to see address'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Effective From</label>
                    <input
                      type="date"
                      value={newOrder.order_effective_from}
                      onChange={(e) => setNewOrder({ ...newOrder, order_effective_from: e.target.value })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Effective Till</label>
                    <input
                      type="date"
                      value={newOrder.order_effective_till}
                      onChange={(e) => setNewOrder({ ...newOrder, order_effective_till: e.target.value })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Amendment Date</label>
                    <input
                      type="date"
                      value={newOrder.amendment_date}
                      onChange={(e) => setNewOrder({ ...newOrder, amendment_date: e.target.value })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Amd. Effective Date</label>
                    <input
                      type="date"
                      value={newOrder.amendment_effective_date}
                      onChange={(e) => setNewOrder({ ...newOrder, amendment_effective_date: e.target.value })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Order Items</h3>
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
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="col-span-3">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Product</label>
                          <select
                            required
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            className="w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Unit</label>
                          <input
                            readOnly
                            type="text"
                            value={item.unit}
                            className="w-full rounded-lg border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Qty</label>
                          <input
                            required
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            className="w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Price</label>
                          <input
                            required
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                            className="w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Disc%</label>
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value))}
                            className="w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">HSN/SAC</label>
                          <input
                            readOnly
                            type="text"
                            value={item.hsn_sac}
                            className="w-full rounded-lg border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Amount</label>
                          <div className="h-9 flex items-center px-3 text-sm font-bold text-slate-700">
                            ₹{item.amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button 
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Notes / Remarks</label>
                    <textarea 
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Add any additional information..."
                    ></textarea>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">₹{newOrder.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Discount:</span>
                      <span className="font-semibold text-red-600">-₹{newOrder.discount_total.toFixed(2)}</span>
                    </div>
                    {newOrder.cgst_total > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>CGST:</span>
                        <span className="font-semibold">₹{newOrder.cgst_total.toFixed(2)}</span>
                      </div>
                    )}
                    {newOrder.sgst_total > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>SGST:</span>
                        <span className="font-semibold">₹{newOrder.sgst_total.toFixed(2)}</span>
                      </div>
                    )}
                    {newOrder.igst_total > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>IGST:</span>
                        <span className="font-semibold">₹{newOrder.igst_total.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-3">
                      <span>Grand Total:</span>
                      <span>₹{newOrder.grand_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700"
                  >
                    Save Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Report Modal */}
      <AnimatePresence>
        {isPrintModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-slate-100 px-8 py-4">
                <h2 className="text-lg font-bold text-slate-900">Print Preview</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={() => window.print()} 
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Printer size={18} />
                    Print
                  </button>
                  <button onClick={() => setIsPrintModalOpen(false)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div id="printable-report" className="p-12 text-slate-900 bg-white">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-indigo-600 mb-2">{settings.company_name || 'ERP SYSTEM'}</h1>
                    <p className="text-sm text-slate-600 max-w-xs">{settings.company_address}</p>
                    <p className="text-sm font-bold mt-2">GSTIN: <span className="font-mono">{settings.company_gstin}</span></p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-4xl font-black uppercase text-slate-200 mb-4">{type === 'sale' ? 'TAX INVOICE' : 'PURCHASE ORDER'}</h2>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-bold text-slate-400 uppercase text-[10px]">Order No:</span> <span className="font-bold">{selectedOrder.order_no}</span></p>
                      <p className="text-sm"><span className="font-bold text-slate-400 uppercase text-[10px]">Date:</span> <span className="font-bold">{selectedOrder.date}</span></p>
                    </div>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Bill To:</h3>
                    <div className="space-y-1">
                      <p className="text-lg font-bold">{type === 'sale' ? selectedOrder.customer_name : selectedOrder.supplier_name}</p>
                      <p className="text-sm text-slate-600">{entities.find(e => e.id === (type === 'sale' ? selectedOrder.customer_id : selectedOrder.supplier_id))?.address || 'Address not available'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Order Details:</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {selectedOrder.order_effective_from && (
                        <>
                          <span className="text-slate-400 uppercase font-bold text-[9px]">Effective From:</span>
                          <span className="font-bold">{selectedOrder.order_effective_from}</span>
                        </>
                      )}
                      {selectedOrder.order_effective_till && (
                        <>
                          <span className="text-slate-400 uppercase font-bold text-[9px]">Effective Till:</span>
                          <span className="font-bold">{selectedOrder.order_effective_till}</span>
                        </>
                      )}
                      {selectedOrder.amendment_date && (
                        <>
                          <span className="text-slate-400 uppercase font-bold text-[9px]">Amd. Date:</span>
                          <span className="font-bold">{selectedOrder.amendment_date}</span>
                        </>
                      )}
                      {selectedOrder.amendment_effective_date && (
                        <>
                          <span className="text-slate-400 uppercase font-bold text-[9px]">Amd. Eff. Date:</span>
                          <span className="font-bold">{selectedOrder.amendment_effective_date}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-12">
                  <thead>
                    <tr className="border-y-2 border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-4 text-left">#</th>
                      <th className="py-4 text-left">Item Description</th>
                      <th className="py-4 text-left">HSN/SAC</th>
                      <th className="py-4 text-right">Qty</th>
                      <th className="py-4 text-right">Rate</th>
                      <th className="py-4 text-right">Disc%</th>
                      <th className="py-4 text-right">Taxable</th>
                      <th className="py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => {
                      const taxable = (item.quantity * item.unit_price) * (1 - item.discount/100);
                      return (
                        <tr key={idx} className="text-sm">
                          <td className="py-4 text-slate-400">{idx + 1}</td>
                          <td className="py-4">
                            <p className="font-bold text-slate-900">{item.product_name}</p>
                            <p className="text-[10px] text-slate-400">{item.product_sku}</p>
                          </td>
                          <td className="py-4 font-mono text-xs">{item.hsn_sac}</td>
                          <td className="py-4 text-right">{item.quantity} {item.product_unit}</td>
                          <td className="py-4 text-right">₹{item.unit_price.toFixed(2)}</td>
                          <td className="py-4 text-right">{item.discount}%</td>
                          <td className="py-4 text-right">₹{taxable.toFixed(2)}</td>
                          <td className="py-4 text-right font-bold">₹{item.amount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taxable Value:</span>
                      <span className="font-bold">₹{selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                    {selectedOrder.cgst_total > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">CGST Total:</span>
                        <span className="font-bold">₹{selectedOrder.cgst_total.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.sgst_total > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">SGST Total:</span>
                        <span className="font-bold">₹{selectedOrder.sgst_total.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.igst_total > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">IGST Total:</span>
                        <span className="font-bold">₹{selectedOrder.igst_total.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black border-t-2 border-slate-900 pt-4 mt-4">
                      <span>Total:</span>
                      <span className="text-indigo-600">₹{selectedOrder.grand_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-24 grid grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4">Terms & Conditions:</h4>
                    <ul className="text-[10px] text-slate-500 list-disc pl-4 space-y-1">
                      <li>Goods once sold will not be taken back.</li>
                      <li>Interest @ 18% p.a. will be charged if payment is not made within due date.</li>
                      <li>Subject to local jurisdiction.</li>
                    </ul>
                  </div>
                  <div className="text-right border-t border-slate-200 pt-8">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-12">Authorized Signatory</p>
                    <div className="h-0.5 w-48 bg-slate-200 ml-auto"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .fixed {
            position: relative !important;
            background: white !important;
            padding: 0 !important;
          }
          .backdrop-blur-md {
            backdrop-filter: none !important;
            background: white !important;
          }
          .shadow-2xl {
            box-shadow: none !important;
          }
          .rounded-2xl {
            border-radius: 0 !important;
          }
          button, .sticky {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};
