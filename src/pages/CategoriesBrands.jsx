import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, Trash2, Layers, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function CategoriesBrands() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('categories'); // categories or brands
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#4F46E5' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, bRes] = await Promise.all([api.get('/categories'), api.get('/brands')]);
      if (cRes.data.success) setCategories(cRes.data.categories);
      if (bRes.data.success) setBrands(bRes.data.brands);
    } catch (err) {
      error('Failed to load categories and brands.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', color: '#4F46E5' });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      color: item.color || '#4F46E5',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'categories' ? '/categories' : '/brands';
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem.id}`, formData);
        success(`${activeTab === 'categories' ? 'Category' : 'Brand'} updated.`);
      } else {
        await api.post(endpoint, formData);
        success(`${activeTab === 'categories' ? 'Category' : 'Brand'} created.`);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save item.');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      const endpoint = activeTab === 'categories' ? '/categories' : '/brands';
      await api.delete(`${endpoint}/${item.id}`);
      success('Deleted successfully.');
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Cannot delete item with existing products.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Categories & Brands
          </h1>
          <p className="text-xs text-slate-500">
            Structure your catalog grouping and product classifications
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New {activeTab === 'categories' ? 'Category' : 'Brand'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'brands'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Brands & Makers ({brands.length})</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">Loading catalog taxonomy...</div>
        ) : (activeTab === 'categories' ? categories : brands).length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No {activeTab} defined yet. Click Add to create one.
          </div>
        ) : (
          (activeTab === 'categories' ? categories : brands).map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {activeTab === 'categories' && (
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: item.color || '#4F46E5' }}
                      />
                    )}
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{item.name}</h3>
                  </div>
                  <Badge variant="primary">{item._count?.products || 0} Products</Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-rose-500"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Edit ${activeTab === 'categories' ? 'Category' : 'Brand'}` : `New ${activeTab === 'categories' ? 'Category' : 'Brand'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {activeTab === 'categories' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tag Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs font-mono text-slate-500">{formData.color}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
