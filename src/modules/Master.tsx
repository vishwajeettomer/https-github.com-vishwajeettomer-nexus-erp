import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import GenericMaster from '../components/GenericMaster';
import { 
  Plus, 
  Search, 
  Package, 
  Layers,
  Save,
  Trash2,
  Edit2,
  Eye,
  X,
  AlertCircle,
  ChevronRight,
  Globe,
  MapPin,
  Building2,
  Percent,
  Scale,
  Wallet,
  IndianRupee,
  Users,
  Truck
} from 'lucide-react';

type MasterType = 'items' | 'bom' | 'customers' | 'suppliers' | 'accounts' | 'taxes' | 'countries' | 'states' | 'cities' | 'units';

export default function Master() {
  const [activeSubTab, setActiveSubTab] = useState<MasterType>('items');

  const tabs: { id: MasterType; label: string; icon: any }[] = [
    { id: 'items', label: 'Items', icon: Package },
    { id: 'bom', label: 'BOM', icon: Layers },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'taxes', label: 'Taxes', icon: Percent },
    { id: 'units', label: 'Units', icon: Scale },
    { id: 'countries', label: 'Country', icon: Globe },
    { id: 'states', label: 'State', icon: MapPin },
    { id: 'cities', label: 'City', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Data Management</h1>
          <p className="text-sm text-slate-500">Configure your core ERP data and business masters.</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeSubTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeSubTab === 'items' && <ItemMaster />}
        {activeSubTab === 'bom' && <BOMMaster />}
        {activeSubTab === 'customers' && <GenericMaster endpoint="/customers" title="Customer" fields={[
          { name: 'name', label: 'Customer Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'text' },
          { name: 'address', label: 'Address', type: 'text' }
        ]} />}
        {activeSubTab === 'suppliers' && <GenericMaster endpoint="/suppliers" title="Supplier" fields={[
          { name: 'name', label: 'Supplier Name', type: 'text', required: true },
          { name: 'contact_person', label: 'Contact Person', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'text' }
        ]} />}
        {activeSubTab === 'accounts' && <GenericMaster endpoint="/accounts" title="Account" fields={[
          { name: 'name', label: 'Account Name', type: 'text', required: true },
          { name: 'type', label: 'Account Type', type: 'select', options: [
            { id: 'Asset', name: 'Asset' },
            { id: 'Liability', name: 'Liability' },
            { id: 'Equity', name: 'Equity' },
            { id: 'Revenue', name: 'Revenue' },
            { id: 'Expense', name: 'Expense' }
          ], required: true },
          { name: 'balance', label: 'Opening Balance', type: 'number' }
        ]} />}
        {activeSubTab === 'taxes' && <GenericMaster endpoint="/taxes" title="Tax" fields={[
          { name: 'name', label: 'Tax Name', type: 'text', required: true },
          { name: 'rate', label: 'Tax Rate (%)', type: 'number', required: true },
          { name: 'description', label: 'Description', type: 'text' }
        ]} />}
        {activeSubTab === 'units' && <GenericMaster endpoint="/units" title="Unit" fields={[
          { name: 'name', label: 'Unit Name', type: 'text', required: true },
          { name: 'short_name', label: 'Short Name', type: 'text', required: true }
        ]} />}
        {activeSubTab === 'countries' && <GenericMaster endpoint="/countries" title="Country" fields={[
          { name: 'name', label: 'Country Name', type: 'text', required: true },
          { name: 'code', label: 'Country Code', type: 'text', required: true }
        ]} />}
        {activeSubTab === 'states' && <GenericMaster endpoint="/states" title="State" fields={[
          { name: 'name', label: 'State Name', type: 'text', required: true },
          { name: 'country_id', label: 'Country', type: 'select', optionsEndpoint: '/countries', required: true }
        ]} />}
        {activeSubTab === 'cities' && <GenericMaster endpoint="/cities" title="City" fields={[
          { name: 'name', label: 'City Name', type: 'text', required: true },
          { name: 'state_id', label: 'State', type: 'select', optionsEndpoint: '/states', required: true }
        ]} />}
      </div>
    </div>
  );
}

// --- Specialized Item Master ---

function ItemMaster() {
  const api = useApi();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    name: '', sku: '', category: 'Raw Material', unit: 'pcs', price: 0, stock: 0, min_stock: 10
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/products');
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/products', formData);
      } else {
        await api.put(`/products/${selectedItem.id}`, formData);
      }
      setModalMode(null);
      fetchProducts();
    } catch (e: any) {
      alert(e.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (e) {
      alert('Error deleting product');
    }
  };

  const openModal = (mode: 'add' | 'edit' | 'view', item?: any) => {
    setModalMode(mode);
    setSelectedItem(item || null);
    setFormData(item || { name: '', sku: '', category: 'Raw Material', unit: 'pcs', price: 0, stock: 0, min_stock: 10 });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={() => openModal('add')}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">Loading...</td></tr>
            ) : products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{product.name}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{product.sku}</td>
                <td className="px-6 py-4">{product.category}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">₹{product.price}</td>
                <td className="px-6 py-4 text-slate-600">{product.stock} {product.unit}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal('view', product)} className="p-1 text-slate-400 hover:text-indigo-600"><Eye size={18} /></button>
                    <button onClick={() => openModal('edit', product)} className="p-1 text-slate-400 hover:text-amber-600"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(product.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {modalMode === 'add' ? 'Add Product' : modalMode === 'edit' ? 'Edit Product' : 'View Product'}
              </h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Product Name</label>
                <input
                  disabled={modalMode === 'view'}
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">SKU</label>
                <input
                  disabled={modalMode === 'view'}
                  required
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Category</label>
                <select
                  disabled={modalMode === 'view'}
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                >
                  <option>Raw Material</option>
                  <option>Finished Good</option>
                  <option>Machinery</option>
                  <option>Electronics</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Unit</label>
                <input
                  disabled={modalMode === 'view'}
                  type="text"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Price (₹)</label>
                <input
                  disabled={modalMode === 'view'}
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Stock</label>
                <input
                  disabled={modalMode === 'view'}
                  type="number"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Min Stock Alert</label>
                <input
                  disabled={modalMode === 'view'}
                  type="number"
                  value={formData.min_stock}
                  onChange={e => setFormData({...formData, min_stock: Number(e.target.value)})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
              <div className="col-span-full mt-4">
                {modalMode !== 'view' && (
                  <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700">
                    {modalMode === 'add' ? 'Create' : 'Update'} Product
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Specialized BOM Master ---

function BOMMaster() {
  const api = useApi();
  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    finished_product_id: '', raw_material_id: '', quantity_required: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bomData, productData] = await Promise.all([
        api.get('/bom'),
        api.get('/products')
      ]);
      setBoms(bomData);
      setProducts(productData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/bom', formData);
      } else {
        await api.put(`/bom/${selectedItem.id}`, formData);
      }
      setModalMode(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Error saving BOM entry');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this BOM entry?')) return;
    try {
      await api.delete(`/bom/${id}`);
      fetchData();
    } catch (e) {
      alert('Error deleting BOM');
    }
  };

  const openModal = (mode: 'add' | 'edit' | 'view', item?: any) => {
    setModalMode(mode);
    setSelectedItem(item || null);
    setFormData(item || { finished_product_id: '', raw_material_id: '', quantity_required: 1 });
  };

  const finishedProducts = products.filter(p => p.category === 'Finished Good' || p.category === 'Machinery');
  const rawMaterials = products.filter(p => p.category === 'Raw Material' || p.category === 'Electronics');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={() => openModal('add')}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={18} />
          Define BOM
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Finished Product</th>
              <th className="px-6 py-4">Raw Material</th>
              <th className="px-6 py-4">Quantity Required</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading...</td></tr>
            ) : boms.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No BOM entries defined.</td></tr>
            ) : boms.map(bom => (
              <tr key={bom.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{bom.finished_product_name}</td>
                <td className="px-6 py-4 text-slate-700">{bom.raw_material_name}</td>
                <td className="px-6 py-4 font-mono text-indigo-600 font-semibold">{bom.quantity_required}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal('view', bom)} className="p-1 text-slate-400 hover:text-indigo-600"><Eye size={18} /></button>
                    <button onClick={() => openModal('edit', bom)} className="p-1 text-slate-400 hover:text-amber-600"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(bom.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {modalMode === 'add' ? 'Define BOM' : modalMode === 'edit' ? 'Edit BOM' : 'View BOM'}
              </h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Finished Product</label>
                <select
                  disabled={modalMode === 'view'}
                  required
                  value={formData.finished_product_id}
                  onChange={e => setFormData({...formData, finished_product_id: e.target.value})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                >
                  <option value="">Select Product</option>
                  {finishedProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Raw Material / Component</label>
                <select
                  disabled={modalMode === 'view'}
                  required
                  value={formData.raw_material_id}
                  onChange={e => setFormData({...formData, raw_material_id: e.target.value})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                >
                  <option value="">Select Material</option>
                  {rawMaterials.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Quantity Required</label>
                <input
                  disabled={modalMode === 'view'}
                  required
                  type="number"
                  step="0.01"
                  value={formData.quantity_required}
                  onChange={e => setFormData({...formData, quantity_required: Number(e.target.value)})}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
              {modalMode !== 'view' && (
                <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700">
                  {modalMode === 'add' ? 'Create' : 'Update'} BOM Entry
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
