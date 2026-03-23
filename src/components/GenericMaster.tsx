import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { 
  Plus, 
  Search, 
  Save,
  Trash2,
  Edit2,
  Eye,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  options?: (string | { id: string | number; name: string })[];
  optionsEndpoint?: string;
  required?: boolean;
  displayField?: string; // Field to display from the joined data
}

export default function GenericMaster({ endpoint, title, fields }: { endpoint: string; title: string; fields: Field[] }) {
  const api = useApi();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [optionsData, setOptionsData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [endpoint]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const res = await api.get(cleanEndpoint);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    const opts: any = {};
    for (const field of fields) {
      if (field.optionsEndpoint) {
        try {
          const cleanOptEndpoint = field.optionsEndpoint.startsWith('/') 
            ? field.optionsEndpoint 
            : `/${field.optionsEndpoint}`;
          opts[field.name] = await api.get(cleanOptEndpoint);
        } catch (e) {
          console.error(e);
        }
      }
    }
    setOptionsData(opts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      if (modalMode === 'add') {
        await api.post(cleanEndpoint, formData);
      } else if (modalMode === 'edit') {
        await api.put(`${cleanEndpoint}/${selectedItem.id}`, formData);
      }
      setModalMode(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || `Error saving ${title}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${title}?`)) return;
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      await api.delete(`${cleanEndpoint}/${id}`);
      fetchData();
    } catch (e) {
      alert(`Error deleting ${title}`);
    }
  };

  const openModal = (mode: 'add' | 'edit' | 'view', item?: any) => {
    setModalMode(mode);
    setSelectedItem(item || null);
    setFormData(item || {});
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${title}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button 
          onClick={() => openModal('add')}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md transition-all"
        >
          <Plus size={18} />
          Add {title}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                {fields.map(f => <th key={f.name} className="px-6 py-4 whitespace-nowrap">{f.label}</th>)}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={fields.length + 1} className="px-6 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={fields.length + 1} className="px-6 py-10 text-center text-slate-500">No {title}s found.</td></tr>
              ) : filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  {fields.map(f => (
                    <td key={f.name} className="px-6 py-4 whitespace-nowrap">
                      {f.displayField && item[f.displayField] 
                        ? item[f.displayField]
                        : f.optionsEndpoint 
                          ? (optionsData[f.name]?.find((o: any) => o.id === item[f.name])?.name || item[f.name])
                          : f.options
                            ? (() => {
                                const opt = f.options.find(o => typeof o === 'object' ? o.id === item[f.name] : o === item[f.name]);
                                return typeof opt === 'object' ? opt.name : opt || item[f.name];
                              })()
                            : item[f.name]}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal('view', item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye size={18} /></button>
                      <button onClick={() => openModal('edit', item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {modalMode === 'add' ? `Add ${title}` : modalMode === 'edit' ? `Edit ${title}` : `View ${title}`}
              </h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                {fields.map(field => (
                  <div key={field.name} className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-500">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        disabled={modalMode === 'view'}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition-all"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options ? field.options.map(o => (
                          <option key={typeof o === 'object' ? o.id : o} value={typeof o === 'object' ? o.id : o}>
                            {typeof o === 'object' ? o.name : o}
                          </option>
                        )) : null}
                        {field.optionsEndpoint ? optionsData[field.name]?.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>) : null}
                      </select>
                    ) : (
                      <input
                        disabled={modalMode === 'view'}
                        required={field.required}
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
              {modalMode !== 'view' && (
                <button type="submit" className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 shadow-md transition-all">
                  {modalMode === 'add' ? 'Create' : 'Update'} {title}
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Simple motion mock if not available, but we have it in package.json
// import { motion } from 'motion/react';
