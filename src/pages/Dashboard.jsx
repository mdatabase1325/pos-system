import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CreditCard,
  ShoppingCart,
  Calendar,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

export default function Dashboard() {
  const { activeBranch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/dashboard', {
          params: { branchId: activeBranch?.id },
        });
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [activeBranch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading live metrics...</p>
        </div>
      </div>
    );
  }

  const { metrics, salesTrend, topProducts, recentTransactions, paymentMethods } = data || {
    metrics: {},
    salesTrend: [],
    topProducts: [],
    recentTransactions: [],
    paymentMethods: [],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Business Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time sales, inventory alerts, and performance metrics for{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {activeBranch?.name || 'All Branches'}
            </span>
          </p>
        </div>
        <NavLink
          to="/pos"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-102 self-start sm:self-auto"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Launch POS Terminal</span>
        </NavLink>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${metrics?.todayTotalRevenue?.toFixed(2) || '0.00'}
            </span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{metrics?.todayTransactions || 0} completed orders today</span>
          </p>
        </div>

        {/* Gross Profit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit (Est.)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${metrics?.todayGrossProfit?.toFixed(2) || '0.00'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Net after recorded product cost snapshot
          </p>
        </div>

        {/* Units Sold */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Products Sold</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.todayProductsSold || 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Items processed across checkout
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metrics?.lowStockCount || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">Low Stock</span>
            {metrics?.outOfStockCount > 0 && (
              <span className="text-xs font-bold text-rose-500 ml-1">
                ({metrics.outOfStockCount} Out of Stock)
              </span>
            )}
          </div>
          <NavLink
            to="/inventory"
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2 block hover:underline"
          >
            Review inventory movements →
          </NavLink>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sales Trend (Last 7 Days)</h2>
              <p className="text-xs text-slate-500">Daily gross sales volume and orders</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Revenue ($)</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Top Selling Items</h2>
              <NavLink to="/products" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </NavLink>
            </div>
            <div className="space-y-3.5">
              {topProducts?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No sales data recorded yet.</p>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="max-w-[130px] truncate">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.totalSold} sold</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ${p.totalRevenue?.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment breakdown pill */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Payment Methods Breakdown</p>
            <div className="flex items-center gap-2 flex-wrap">
              {paymentMethods.map((pm) => (
                <Badge key={pm.method} variant="default" className="text-[10px]">
                  {pm.method}: ${pm.total?.toFixed(2)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Completed Orders</h2>
            <p className="text-xs text-slate-500">Live invoices synced with database</p>
          </div>
          <NavLink to="/sales" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Full Sales History →
          </NavLink>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                      {tx.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {tx.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{tx.cashier?.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={tx.paymentMethod === 'CASH' ? 'success' : 'primary'}>
                        {tx.paymentMethod}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      ${tx.total?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSale(tx)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        title="View Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick View Receipt Modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Invoice ${selectedSale?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Apex POS Retail</h4>
              <p className="text-xs text-slate-500">{selectedSale.invoiceNumber}</p>
              <p className="text-[11px] text-slate-400">{new Date(selectedSale.createdAt).toLocaleString()}</p>
            </div>

            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {selectedSale.customer?.name || 'Walk-in Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedSale.cashier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedSale.paymentMethod}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${selectedSale.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${selectedSale.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
                <span>Total:</span>
                <span>${selectedSale.total?.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
