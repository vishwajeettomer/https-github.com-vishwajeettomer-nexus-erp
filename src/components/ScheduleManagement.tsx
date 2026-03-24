import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Calendar, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../services/api';
import { format } from 'date-fns';

interface ScheduleItem {
  id?: number;
  order_id: string;
  product_id: string;
  product_name?: string;
  scheduled_date: string;
  quantity: number;
  status: string;
}

interface ScheduleManagementProps {
  type: 'sale' | 'purchase';
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ type }) => {
  const api = useApi();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const initialScheduleState = {
    order_id: '',
    product_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    quantity: 0,
    status: 'Scheduled'
  };

  const [formData, setFormData] = useState<any>(initialScheduleState);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedulesData, ordersData] = await Promise.all([
        api.get(type === 'sale' ? '/sale_schedules' : '/purchase_schedules'),
        api.get(type === 'sale' ? '/sale_orders' : '/purchase_orders')
      ]);
      setSchedules(schedulesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id.toString() === orderId);
    setFormData({ ...formData, order_id: orderId, product_id: '' });
    if (order && order.items) {
      setSelectedOrderItems(order.items);
    } else {
      setSelectedOrderItems([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = type === 'sale' ? '/sale_schedules' : '/purchase_schedules';
      const payload = {
        [type === 'sale' ? 'sale_order_id' : 'purchase_order_id']: formData.order_id,
        product_id: formData.product_id,
        delivery_date: formData.delivery_date,
        quantity: formData.quantity,
        status: formData.status
      };

      if (formData.id) {
        await api.put(`${endpoint}/${formData.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      
      setIsModalOpen(false);
      fetchData();
      setFormData(initialScheduleState);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule');
    }
  };

  const handleEdit = (schedule: any) => {
    const orderId = type === 'sale' ? schedule.sale_order_id : schedule.purchase_order_id;
    setFormData({
      id: schedule.id,
      order_id: orderId.toString(),
      product_id: schedule.product_id.toString(),
      delivery_date: schedule.delivery_date,
      quantity: schedule.quantity,
      status: schedule.status
    });
    handleOrderChange(orderId.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const endpoint = type === 'sale' ? '/sale_schedules' : '/purchase_schedules';
      await api.delete(`${endpoint}/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading schedules...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 capitalize">{type} Schedules</h2>
        <button
          onClick={() => {
            setFormData(initialScheduleState);
            setSelectedOrderItems([]);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
        >
          <Plus size={20} />
          New {type === 'sale' ? 'Sale' : 'Purchase'} Schedule
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Order No</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Delivery Date</th>
              <th className="px-6 py-4 text-right">Quantity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{schedule.order_no}</td>
                <td className="px-6 py-4 text-slate-600">{schedule.product_name}</td>
                <td className="px-6 py-4 text-slate-600">{schedule.delivery_date}</td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">{schedule.quantity}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    schedule.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                    schedule.status === 'In Transit' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {schedule.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(schedule)}
                      className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                      title="Edit Schedule"
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Schedule"
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

      {/* Schedule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {formData.id ? 'Edit' : 'New'} {type === 'sale' ? 'Sale' : 'Purchase'} Schedule
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Select Order</label>
                  <select
                    required
                    value={formData.order_id}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose Order...</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.order_no}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Select Product</label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Product...</option>
                    {selectedOrderItems.map(item => (
                      <option key={item.product_id} value={item.product_id}>{item.product_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Date</label>
                    <input
                      required
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700"
                  >
                    {formData.id ? 'Update' : 'Create'} Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
