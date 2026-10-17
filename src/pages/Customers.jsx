import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Award, History, Phone, Mail, Download } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function Customers() {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerGroup: 'REGULAR',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers', { params: { search, limit: 100 } });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', customerGroup: 'REGULAR' });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      customerGroup: c.customerGroup || 'REGULAR',
    });
    setModalOpen(true);
  };

  const viewCustomerDetails = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomerDetail(res.data.customer);
        setDetailModalOpen(true);
      }
    } catch (err) {
      error('Failed to load customer profile.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        success('Customer profile updated.');
      } else {
        await api.post('/customers', formData);
        success('Customer registered.');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save customer.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      success('Customer deleted.');
      fetchCustomers();
    } catch (err) {
      error(err.response?.data?.message || 'Cannot delete customer.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer CRM & Loyalty Points
          </h1>
          <p className="text-xs text-slate-500">
            Track customer spend, loyalty reward points, and purchase history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              window.open(`${api.defaults.baseURL}/customers/export/csv`, '_blank');
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Group</th>
                <th className="px-4 py-3.5">Loyalty Points</th>
                <th className="px-4 py-3.5">Total Spent</th>
                <th className="px-4 py-3.5">Orders Count</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-400">{c.address || 'No address'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      <div>{c.phone || '—'}</div>
                      <div className="text-[10px] text-slate-400">{c.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={c.customerGroup === 'VIP' ? 'warning' : 'default'}>
                        {c.customerGroup}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {c.loyaltyPoints} pts
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      ${c.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{c._count?.sales || 0}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => viewCustomerDetails(c.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
                          title="View History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'New Customer'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Group</label>
            <select
              value={formData.customerGroup}
              onChange={(e) => setFormData({ ...formData, customerGroup: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="REGULAR">Regular Customer</option>
              <option value="VIP">VIP Tier</option>
              <option value="WHOLESALE">Wholesale Buyer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
          >
            Save Customer
          </button>
        </form>
      </Modal>

      {/* DETAIL / LOYALTY HISTORY MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Customer Profile: ${customerDetail?.name}`}
        maxWidth="max-w-xl"
      >
        {customerDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Spent</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  ${customerDetail.totalSpent.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Loyalty Points</span>
                <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  {customerDetail.loyaltyPoints} pts
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Tier</span>
                <p className="text-base font-extrabold text-amber-600">{customerDetail.customerGroup}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Recent Orders</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {customerDetail.sales?.length === 0 ? (
                  <p className="text-xs text-slate-400">No orders recorded yet.</p>
                ) : (
                  customerDetail.sales.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold">{s.invoiceNumber}</span>
                        <span className="text-slate-400 block text-[10px]">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-extrabold text-indigo-600">${s.total.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Loyalty Points Ledger</h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {customerDetail.loyaltyTransactions?.length === 0 ? (
                  <p className="text-xs text-slate-400">No points ledger records yet.</p>
                ) : (
                  customerDetail.loyaltyTransactions.map((lt) => (
                    <div
                      key={lt.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-[11px]"
                    >
                      <div>
                        <span className="font-semibold">{lt.reason}</span>
                        <span className="text-slate-400 block text-[9px]">
                          {new Date(lt.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          lt.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {lt.points > 0 ? `+${lt.points}` : lt.points} pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
