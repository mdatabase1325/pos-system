import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, Search, Building2, PackageCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function Purchasing() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'suppliers'
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [poNotes, setPoNotes] = useState('');

  // Supplier Modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes, prRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products', { params: { limit: 100 } }),
      ]);
      if (pRes.data.success) setPurchases(pRes.data.purchases);
      if (sRes.data.success) setSuppliers(sRes.data.suppliers);
      if (prRes.data.success) setProducts(prRes.data.products);
    } catch (err) {
      error('Failed to load purchasing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewPoModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setPoItems([
      {
        productId: products[0]?.id || '',
        quantity: 10,
        costPrice: products[0]?.costPrice || 1.0,
      },
    ]);
    setPoNotes('');
    setPoModalOpen(true);
  };

  const addPoItemRow = () => {
    setPoItems((prev) => [
      ...prev,
      {
        productId: products[0]?.id || '',
        quantity: 10,
        costPrice: products[0]?.costPrice || 1.0,
      },
    ]);
  };

  const removePoItemRow = (index) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePoItemRow = (index, field, value) => {
    setPoItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'productId') {
          const prod = products.find((p) => p.id === value);
          return {
            ...item,
            productId: value,
            costPrice: prod?.costPrice || 1.0,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) {
      error('Please select supplier and at least one item.');
      return;
    }
    try {
      await api.post('/purchases', {
        supplierId: selectedSupplierId,
        items: poItems,
        notes: poNotes,
      });
      success('Purchase order created.');
      setPoModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create PO.');
    }
  };

  const handleReceivePo = async (id) => {
    if (!confirm('Confirm receiving this delivery? Product stock balances will be increased immediately.')) return;
    try {
      await api.post(`/purchases/${id}/receive`);
      success('Goods received! Inventory stock updated.');
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to receive purchase order.');
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', supplierForm);
      success('Supplier registered.');
      setSupplierModalOpen(false);
      setSupplierForm({ name: '', company: '', email: '', phone: '', address: '' });
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save supplier.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Purchasing & Supplier Management
          </h1>
          <p className="text-xs text-slate-500">
            Create purchase orders, receive shipments, and update stock balances automatically
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'orders' ? (
            <button
              onClick={openNewPoModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          ) : (
            <button
              onClick={() => setSupplierModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Orders ({purchases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Suppliers Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* PURCHASE ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">PO Number</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total Cost</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {po.poNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                        {po.supplier?.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {po.items?.length || 0} line items
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        ${po.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={po.status === 'RECEIVED' ? 'success' : 'warning'}>
                          {po.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {po.status === 'ORDERED' ? (
                          <button
                            onClick={() => handleReceivePo(po.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive Goods</span>
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Stock Ingested</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{s.name}</h3>
                <Badge variant="primary">{s.company || 'Direct'}</Badge>
              </div>
              <div className="space-y-1 text-xs text-slate-500 mt-2">
                <p>Phone: {s.phone || '—'}</p>
                <p>Email: {s.email || '—'}</p>
                <p className="truncate">Address: {s.address || '—'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Account Balance</span>
                <span className="font-bold text-slate-900 dark:text-white">${s.balance.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW PO MODAL */}
      <Modal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        title="Create New Purchase Order"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Supplier *</label>
            <select
              required
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400">Order Items</label>
              <button
                type="button"
                onClick={addPoItemRow}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {poItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.productId}
                    onChange={(e) => updatePoItemRow(idx, 'productId', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updatePoItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Cost"
                    value={item.costPrice}
                    onChange={(e) => updatePoItemRow(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  {poItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePoItemRow(idx)}
                      className="text-rose-500 p-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Instructions</label>
            <textarea
              rows="2"
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Submit Purchase Order
          </button>
        </form>
      </Modal>

      {/* NEW SUPPLIER MODAL */}
      <Modal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title="Add New Supplier"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Supplier / Contact Name *</label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Entity Name</label>
            <input
              type="text"
              value={supplierForm.company}
              onChange={(e) => setSupplierForm({ ...supplierForm, company: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
            <textarea
              rows="2"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Save Supplier
          </button>
        </form>
      </Modal>
    </div>
  );
}
