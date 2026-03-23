import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { 
  Users, 
  Truck, 
  Package, 
  Plus, 
  Search,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export default function MasterData() {
  const api = useApi();
  const [activeSubTab, setActiveSubTab] = useState('customers');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeSubTab === 'customers' ? '/customers' : '/suppliers';
      const result = await api.get(endpoint);
      setData(result);
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Master Data Management</h1>
          <p className="text-slate-500">Manage your business partners and entities.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">
          <Plus size={18} />
          Add {activeSubTab === 'customers' ? 'Customer' : 'Supplier'}
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
            activeSubTab === 'customers' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={18} />
          Customers
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
            activeSubTab === 'suppliers' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck size={18} />
          Suppliers
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeSubTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border-none bg-slate-50 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200"></div>
          ))
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div 
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-indigo-200"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {activeSubTab === 'customers' ? <Users size={24} /> : <Truck size={24} />}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
                    {activeSubTab === 'customers' ? 'Customer' : 'Supplier'} ID: #{item.id.toString().padStart(4, '0')}
                  </p>
                </div>

                <div className="space-y-2">
                  {item.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{item.email}</span>
                    </div>
                  )}
                  {item.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={14} className="text-slate-400" />
                      <span>{item.phone}</span>
                    </div>
                  )}
                  {item.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="truncate">{item.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                <span className="text-xs font-medium text-indigo-600">View Details</span>
                <ChevronRight size={16} className="text-indigo-600 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <div className="mb-4 rounded-full bg-slate-50 p-4">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No {activeSubTab} found</h3>
            <p className="text-slate-500">Try adjusting your search or add a new entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
