import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { 
  UserPlus, 
  Shield, 
  Trash2, 
  Mail, 
  User as UserIcon,
  Edit2,
  X,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'production', label: 'Production' },
  { id: 'reports', label: 'Reports' },
  { id: 'master', label: 'Master' },
  { id: 'admin', label: 'Admin Panel' },
  { id: 'settings', label: 'Settings' },
];

export default function Admin() {
  const api = useApi();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
        <Lock size={48} className="mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-900">Access Denied</h3>
        <p className="text-slate-500">You do not have permission to access the Admin Panel.</p>
      </div>
    );
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        permissions: user.permissions || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Staff',
        permissions: ['dashboard']
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const togglePermission = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(moduleId)
        ? prev.permissions.filter(id => id !== moduleId)
        : [...prev.permissions, moduleId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage system users and their access rights.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
        >
          <UserPlus size={20} />
          Add New User
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Rights</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                </tr>
              ))
            ) : users.map((user) => (
              <tr key={user.id} className="group hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 p-0.5 ring-2 ring-slate-50">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt="avatar"
                        className="h-full w-full rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Shield size={16} className={user.role === 'Admin' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="font-medium">{user.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.permissions?.slice(0, 3).map((p: string) => (
                      <span key={p} className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                        {p}
                      </span>
                    ))}
                    {user.permissions?.length > 3 && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        +{user.permissions.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(user)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
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

      {/* User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingUser ? 'Edit User Rights' : 'Add New User'}
                </h2>
                <button onClick={handleCloseModal} className="rounded-lg p-2 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block h-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block h-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                      </label>
                      <input
                        type="password"
                        required={!editingUser}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1 block h-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mt-1 block h-10 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">User Rights (Access Control)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MODULES.map((module) => (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => togglePermission(module.id)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                            formData.permissions.includes(module.id)
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xs font-medium">{module.label}</span>
                          {formData.permissions.includes(module.id) && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
