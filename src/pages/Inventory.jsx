import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  AlertTriangle,
  History,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function Inventory() {
  const { branches, activeBranch } = useAuth();
  const { success, error } = useToast();

  const [valuation, setValuation] = useState(null);
  const [alerts, setAlerts] = useState({ lowStock: [], outOfStock: [] });
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    productId: '',
    fromBranchId: activeBranch?.id || '',
    toBranchId: '',
    quantity: '1',
    reason: 'Store replenishment',
  });

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [valRes, alertRes, movRes, prodRes] = await Promise.all([
        api.get('/inventory/valuation'),
        api.get('/inventory/alerts'),
        api.get('/inventory/movements', { params: { limit: 50 } }),
        api.get('/products', { params: { limit: 100 } }),
      ]);

      if (valRes.data.success) setValuation(valRes.data.valuation);
      if (alertRes.data.success) setAlerts(alertRes.data);
      if (movRes.data.success) setMovements(movRes.data.movements);
      if (prodRes.data.success) setProducts(prodRes.data.products);
    } catch (err) {
      error('Failed to load inventory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, [activeBranch]);

  const handleStockTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/transfer', transferForm);
      success('Stock transfer recorded successfully.');
      setTransferModalOpen(false);
      loadInventoryData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to transfer stock.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500">
            Real-time balances, stock movement audit trail, transfers, and warehouse valuation
          </p>
        </div>

        <button
          onClick={() => {
            setTransferForm({
              productId: products[0]?.id || '',
              fromBranchId: branches[0]?.id || '',
              toBranchId: branches[1]?.id || '',
              quantity: '5',
              reason: 'Store replenishment',
            });
            setTransferModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfer Stock Between Branches</span>
        </button>
      </div>

      {/* Valuation & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Stock Units</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {valuation?.totalStockUnits?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all active items</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Cost Valuation</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ${valuation?.totalCostValuation?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Capital invested in stock</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Retail Potential Value</span>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            ${valuation?.totalRetailValuation?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Potential gross retail return</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Est. Stock Margin</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${valuation?.potentialProfit?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Retail value minus purchase cost</p>
        </div>
      </div>

      {/* Stock Alerts Section */}
      {(alerts.lowStock?.length > 0 || alerts.outOfStock?.length > 0) && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>Attention: Critical Inventory Alerts ({alerts.outOfStock.length} Out, {alerts.lowStock.length} Low)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alerts.outOfStock.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/50 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                </div>
                <Badge variant="danger">0 in stock</Badge>
              </div>
            ))}
            {alerts.lowStock.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900/50 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                </div>
                <Badge variant="warning">{p.stock} left (min: {p.minStock})</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements Audit Trail Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <span>Stock Movement Audit Logs</span>
            </h2>
            <p className="text-xs text-slate-500">Every stock in, out, sale, and adjustment is recorded</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Date & Time</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Change Qty</th>
                <th className="px-4 py-3">Balance After</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3 rounded-r-xl">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No movement records yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {m.product?.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          m.type === 'SALE'
                            ? 'default'
                            : m.type === 'IN'
                            ? 'success'
                            : m.type === 'RETURN'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {m.type}
                      </Badge>
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-bold ${
                        m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {m.newStock} {m.product?.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{m.branch?.name || 'Main'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {m.reason || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK TRANSFER MODAL */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Stock Between Branches"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStockTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Product</label>
            <select
              required
              value={transferForm.productId}
              onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Available: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">From Branch</label>
              <select
                required
                value={transferForm.fromBranchId}
                onChange={(e) => setTransferForm({ ...transferForm, fromBranchId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">To Destination</label>
              <select
                required
                value={transferForm.toBranchId}
                onChange={(e) => setTransferForm({ ...transferForm, toBranchId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="">Select Branch</option>
                {branches
                  .filter((b) => b.id !== transferForm.fromBranchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Quantity to Relocate</label>
            <input
              type="number"
              min="1"
              required
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Reason / Notes</label>
            <input
              type="text"
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
          >
            Execute Inter-Branch Transfer
          </button>
        </form>
      </Modal>
    </div>
  );
}
