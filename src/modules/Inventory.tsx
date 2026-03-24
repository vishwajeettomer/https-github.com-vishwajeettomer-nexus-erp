import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  AlertCircle,
  Package,
  ArrowUpDown,
  X,
  Truck,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GenericMaster from '../components/GenericMaster';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<'products' | 'gate_entry' | 'mrn'>('products');
  const api = useApi();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'General',
    unit: 'pcs',
    price: 0,
    stock: 0,
    min_stock: 10,
    hsn_sac: ''
  });

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', newProduct);
      setIsModalOpen(false);
      setNewProduct({
        name: '',
        sku: '',
        category: 'General',
        unit: 'pcs',
        price: 0,
        stock: 0,
        min_stock: 10,
        hsn_sac: ''
      });
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert('Failed to add product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500">Manage your products, gate entries, and material receipts.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'products'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package size={18} />
          Products
        </button>
        <button
          onClick={() => setActiveTab('gate_entry')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'gate_entry'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck size={18} />
          Gate Entry
        </button>
        <button
          onClick={() => setActiveTab('mrn')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'mrn'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck size={18} />
          MRN
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>

            {/* Add Product Modal */}
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
                      <h2 className="text-xl font-bold text-slate-900">Add New Product</h2>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="col-span-2">
                          <label className="mb-1 block text-sm font-medium text-slate-700">Product Name</label>
                          <input
                            required
                            type="text"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">SKU</label>
                          <input
                            required
                            type="text"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          >
                            <option>General</option>
                            <option>Raw Material</option>
                            <option>Machinery</option>
                            <option>Electronics</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Price (₹)</label>
                          <input
                            required
                            type="number"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Initial Stock</label>
                          <input
                            required
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
                          <input
                            required
                            type="text"
                            value={newProduct.unit}
                            onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">HSN/SAC</label>
                          <input
                            type="text"
                            value={newProduct.hsn_sac}
                            onChange={(e) => setNewProduct({ ...newProduct, hsn_sac: e.target.value })}
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
                          Save Product
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
                  <Filter size={18} />
                  Category
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
                  <ArrowUpDown size={18} />
                  Sort
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500">Loading products...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500">No products found.</td></tr>
                  ) : filteredProducts.map((product) => (
                    <tr key={product.id} className="group hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Package size={20} />
                          </div>
                          <span className="font-semibold text-slate-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{product.sku}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold",
                            product.stock <= product.min_stock ? "text-amber-600" : "text-slate-900"
                          )}>
                            {product.stock} {product.unit}
                          </span>
                          {product.stock <= product.min_stock && (
                            <AlertCircle size={14} className="text-amber-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">₹{product.price}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gate_entry' && (
          <GenericMaster 
            endpoint="gate_entries" 
            title="Gate Entry" 
            fields={[
              { name: 'entry_no', label: 'Entry No', type: 'text', required: true },
              { name: 'date', label: 'Date', type: 'date', required: true },
              { name: 'vehicle_no', label: 'Vehicle No', type: 'text' },
              { name: 'supplier_id', label: 'Supplier', type: 'select', optionsEndpoint: '/suppliers', required: true, displayField: 'supplier_name' },
              { name: 'item_description', label: 'Item Description', type: 'text' },
              { name: 'quantity', label: 'Quantity', type: 'number' },
              { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Inspected', 'Rejected'] }
            ]} 
          />
        )}

        {activeTab === 'mrn' && (
          <GenericMaster 
            endpoint="mrn" 
            title="MRN" 
            fields={[
              { name: 'mrn_no', label: 'MRN No', type: 'text', required: true },
              { name: 'date', label: 'Date', type: 'date', required: true },
              { name: 'gate_entry_id', label: 'Gate Entry', type: 'select', optionsEndpoint: '/gate_entries', required: true, displayField: 'gate_entry_no' },
              { name: 'supplier_id', label: 'Supplier', type: 'select', optionsEndpoint: '/suppliers', required: true, displayField: 'supplier_name' },
              { name: 'product_id', label: 'Product', type: 'select', optionsEndpoint: '/products', required: true, displayField: 'product_name' },
              { name: 'quantity_received', label: 'Qty Received', type: 'number', required: true },
              { name: 'quantity_accepted', label: 'Qty Accepted', type: 'number', required: true },
              { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Verified', 'Rejected'] }
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
