import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Lock,
  Unlock,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function CashSessions() {
  const { user, activeBranch } = useAuth();
  const { success, error } = useToast();

  const [currentSession, setCurrentSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('200.00');
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({ type: 'CASH_IN', amount: '', reason: '' });

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const [curRes, histRes] = await Promise.all([
        api.get('/cash-sessions/current'),
        api.get('/cash-sessions'),
      ]);
      if (curRes.data.success) {
        setCurrentSession(curRes.data.session);
        setStats(curRes.data.stats);
      }
      if (histRes.data.success) {
        setHistory(histRes.data.sessions);
      }
    } catch (err) {
      error('Failed to load cash drawer session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, [activeBranch]);

  const handleOpenShift = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash-sessions/open', {
        openingFloat,
        branchId: activeBranch?.id,
        notes: `Opened by ${user?.name}`,
      });
      success('Cash drawer session opened.');
      setOpenModalOpen(false);
      loadSessionData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to open drawer session.');
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!currentSession) return;
    try {
      const res = await api.post(`/cash-sessions/${currentSession.id}/close`, {
        closingCash,
        notes: closeNotes,
      });
      success(`Shift closed! Variance: $${res.data.summary.cashVariance.toFixed(2)}`);
      setCloseModalOpen(false);
      setClosingCash('');
      loadSessionData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to close drawer session.');
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    if (!currentSession) return;
    try {
      await api.post(`/cash-sessions/${currentSession.id}/movement`, movementForm);
      success('Cash movement recorded.');
      setMovementModalOpen(false);
      setMovementForm({ type: 'CASH_IN', amount: '', reason: '' });
      loadSessionData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record movement.');
    }
  };

  const expectedTotal = stats?.expectedCash || 0;
  const countedTotal = parseFloat(closingCash || 0);
  const variancePreview = countedTotal - expectedTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Cashier Shift & Drawer Control
          </h1>
          <p className="text-xs text-slate-500">
            Shift opening floats, cash-in/cash-out tracking, cash reconciliations, and variance reports
          </p>
        </div>

        <div>
          {currentSession ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMovementModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold"
              >
                Cash In / Out
              </button>
              <button
                onClick={() => {
                  setClosingCash(stats?.expectedCash?.toFixed(2) || '0.00');
                  setCloseModalOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Shift & Drawer</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOpenModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Open New Cash Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Active Session Status Card */}
      {currentSession ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Active Cashier Shift</h3>
                <p className="text-xs text-slate-400">
                  Opened at {new Date(currentSession.openedAt).toLocaleTimeString()} by {user?.name}
                </p>
              </div>
            </div>
            <Badge variant="success">Drawer Open</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Opening Float</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                ${stats?.openingFloat?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cash Sales Today</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                +${stats?.cashSalesTotal?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cash In / Out</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                +${stats?.cashIn?.toFixed(2)} / -${stats?.cashOut?.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                Expected in Drawer
              </span>
              <p className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-1">
                ${stats?.expectedCash?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <Lock className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Cash Drawer Currently Closed</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Open a shift drawer with your initial cash float before taking cash sales at checkout.
          </p>
          <button
            onClick={() => setOpenModalOpen(true)}
            className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
          >
            <Unlock className="w-4 h-4" />
            <span>Open Shift Now</span>
          </button>
        </div>
      )}

      {/* Historical Shifts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Past Shift Reconciliations</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Cashier</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3">Opening Float</th>
                <th className="px-4 py-3">Expected Cash</th>
                <th className="px-4 py-3">Actual Count</th>
                <th className="px-4 py-3 rounded-r-xl">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400">
                    No completed shift records yet.
                  </td>
                </tr>
              ) : (
                history.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {s.cashier?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(s.openedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.closedAt ? new Date(s.closedAt).toLocaleString() : 'Currently Active'}
                    </td>
                    <td className="px-4 py-3 font-mono">${s.openingFloat.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">
                      {s.expectedCash ? `$${s.expectedCash.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {s.closingCash ? `$${s.closingCash.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.cashVariance !== null && s.cashVariance !== undefined ? (
                        <Badge
                          variant={
                            s.cashVariance === 0
                              ? 'success'
                              : s.cashVariance > 0
                              ? 'info'
                              : 'danger'
                          }
                        >
                          {s.cashVariance > 0
                            ? `+$${s.cashVariance.toFixed(2)} Over`
                            : s.cashVariance < 0
                            ? `-$${Math.abs(s.cashVariance).toFixed(2)} Short`
                            : 'Exact ($0.00)'}
                        </Badge>
                      ) : (
                        <Badge variant="warning">In Progress</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPEN SHIFT MODAL */}
      <Modal
        isOpen={openModalOpen}
        onClose={() => setOpenModalOpen(false)}
        title="Open Cashier Drawer Shift"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Starting Cash Float ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            Confirm & Open Shift
          </button>
        </form>
      </Modal>

      {/* CLOSE SHIFT MODAL */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="Close Shift Reconciliation"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Expected Cash in Till:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                ${expectedTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Physical Count Entered:</span>
              <span className="font-bold">${countedTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-indigo-200 dark:border-indigo-900">
              <span>Variance (Difference):</span>
              <span className={variancePreview >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {variancePreview >= 0 ? `+$${variancePreview.toFixed(2)}` : `-$${Math.abs(variancePreview).toFixed(2)}`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Actual Physical Cash Count ($) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Closing Notes</label>
            <textarea
              rows="2"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="e.g. End of morning shift, verified drawer"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
          >
            Reconcile & Close Shift
          </button>
        </form>
      </Modal>

      {/* CASH MOVEMENT MODAL */}
      <Modal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        title="Record Cash Drawer Movement"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleMovement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Movement Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementForm({ ...movementForm, type: 'CASH_IN' })}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  movementForm.type === 'CASH_IN'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Cash In (Deposit)
              </button>
              <button
                type="button"
                onClick={() => setMovementForm({ ...movementForm, type: 'CASH_OUT' })}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  movementForm.type === 'CASH_OUT'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Cash Out (Payout)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={movementForm.amount}
              onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Reason / Purpose *</label>
            <input
              type="text"
              required
              value={movementForm.reason}
              onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
              placeholder="e.g. Added change rolls, Milk run emergency"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Submit Movement
          </button>
        </form>
      </Modal>
    </div>
  );
}
