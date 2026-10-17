import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, Tag, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function Expenses() {
  const { activeBranch } = useAuth();
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCat, setSelectedCat] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    categoryId: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  const [categoryName, setCategoryName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        api.get('/expenses', {
          params: {
            categoryId: selectedCat || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            branchId: activeBranch?.id,
          },
        }),
        api.get('/expenses/categories'),
      ]);

      if (expRes.data.success) {
        setExpenses(expRes.data.expenses);
        setTotalExpense(expRes.data.totalExpense);
      }
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      error('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCat, startDate, endDate, activeBranch]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...formData,
        branchId: activeBranch?.id,
      });
      success('Expense recorded.');
      setExpenseModalOpen(false);
      setFormData({ title: '', amount: '', categoryId: '', paymentMethod: 'CASH', notes: '' });
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save expense.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses/categories', { name: categoryName });
      success('Expense category added.');
      setCategoryModalOpen(false);
      setCategoryName('');
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add category.');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      success('Expense deleted.');
      loadData();
    } catch (err) {
      error('Failed to delete expense.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Store & Operating Expenses
          </h1>
          <p className="text-xs text-slate-500">
            Log store maintenance, utility bills, packaging, and miscellaneous payouts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold"
          >
            Add Category
          </button>
          <button
            onClick={() => {
              setFormData({
                title: '',
                amount: '',
                categoryId: categories[0]?.id || '',
                paymentMethod: 'CASH',
                notes: '',
              });
              setExpenseModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Logged Expenses
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${totalExpense.toFixed(2)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="w-full md:w-56 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
        >
          <option value="">All Expense Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full md:w-40 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full md:w-40 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Expense Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {e.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="primary">{e.category?.name}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {e.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-rose-600 dark:text-rose-400">
                      ${e.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 truncate max-w-xs">
                      {e.notes || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Record Business Expense"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Expense Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Electric bill, Coffee cup lids"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Category *</label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="CASH">Cash (From Drawer)</option>
              <option value="CARD">Company Card</option>
              <option value="TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Record Expense
          </button>
        </form>
      </Modal>

      {/* CREATE CATEGORY MODAL */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="New Expense Category"
        maxWidth="max-w-xs"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
          >
            Save Category
          </button>
        </form>
      </Modal>
    </div>
  );
}
