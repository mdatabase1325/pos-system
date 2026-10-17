import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  RotateCcw,
  Eye,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function SalesHistory() {
  const { user, hasRole, activeBranch } = useAuth();
  const { success, error } = useToast();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Sale for Detail / Reprint
  const [selectedSale, setSelectedSale] = useState(null);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundSale, setRefundSale] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer Return');
  const [restockInventory, setRestockInventory] = useState(true);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales', {
        params: {
          search,
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          branchId: activeBranch?.id,
          limit: 100,
        },
      });
      if (res.data.success) {
        setSales(res.data.sales);
      }
    } catch (err) {
      error('Failed to load sales history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, status, startDate, endDate, activeBranch]);

  const openRefundModal = (sale) => {
    setRefundSale(sale);
    setRefundReason('Customer Return');
    setRestockInventory(true);
    setRefundModalOpen(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundSale) return;
    try {
      const itemsToRefund = refundSale.items.map((i) => ({
        saleItemId: i.id,
        productId: i.productId,
        quantity: i.quantity,
        amount: i.total,
      }));

      const res = await api.post(`/sales/${refundSale.id}/refund`, {
        amount: refundSale.total,
        reason: refundReason,
        restock: restockInventory,
        items: itemsToRefund,
      });

      if (res.data.success) {
        success('Refund processed successfully.');
        setRefundModalOpen(false);
        fetchSales();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Refund processing failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Sales & Orders History
          </h1>
          <p className="text-xs text-slate-500">
            View completed transactions, reprint receipts, and process customer returns & refunds
          </p>
        </div>

        <button
          onClick={() => {
            window.open(`${api.defaults.baseURL}/sales/export/csv`, '_blank');
          }}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Filter and Date Range Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="PARTIAL_REFUNDED">Partially Refunded</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Cashier</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {s.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {s.customer?.name || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{s.cashier?.name}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="primary">{s.paymentMethod}</Badge>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                      ${s.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          s.status === 'COMPLETED'
                            ? 'success'
                            : s.status === 'REFUNDED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSale(s)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
                          title="View Details & Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {s.status === 'COMPLETED' && hasRole('SUPER_ADMIN', 'ADMIN', 'MANAGER') && (
                          <button
                            onClick={() => openRefundModal(s)}
                            className="p-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-600 hover:bg-amber-50"
                            title="Process Refund"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SALE DETAIL / RECEIPT MODAL */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Invoice ${selectedSale?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div id="printable-receipt" className="p-4 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono text-xs">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h4 className="font-extrabold text-sm uppercase">Apex POS & Retail</h4>
                <p className="text-[10px] text-slate-500">Invoice: {selectedSale.invoiceNumber}</p>
                <p className="text-[9px] text-slate-400">{new Date(selectedSale.createdAt).toLocaleString()}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                {selectedSale.items?.map((it) => (
                  <div key={it.id} className="flex justify-between items-center text-[10px]">
                    <div>
                      <p className="font-bold">{it.productName}</p>
                      <p className="text-[9px] text-slate-500">{it.quantity} x ${it.unitPrice.toFixed(2)}</p>
                    </div>
                    <span className="font-bold">${it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedSale.subtotal.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-${selectedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${selectedSale.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-900">
                  <span>Grand Total:</span>
                  <span>${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* REFUND MODAL */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title={`Process Refund: ${refundSale?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleProcessRefund} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Refunding will mark this invoice as refunded and return funds.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Refund Amount ($)</label>
            <input
              type="text"
              disabled
              value={`$${refundSale?.total.toFixed(2)}`}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Return</label>
            <input
              type="text"
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={restockInventory}
              onChange={(e) => setRestockInventory(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Restock returned items into active inventory</span>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
          >
            Confirm & Issue Refund
          </button>
        </form>
      </Modal>
    </div>
  );
}
