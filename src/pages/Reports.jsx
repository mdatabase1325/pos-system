import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Download,
  Calendar,
  Percent,
  ShoppingCart,
  Boxes,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/ui/Badge';

export default function Reports() {
  const { activeBranch } = useAuth();
  const { error } = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [anaRes, dashRes] = await Promise.all([
        api.get('/reports/sales-analytics', {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            branchId: activeBranch?.id,
          },
        }),
        api.get('/reports/dashboard', {
          params: { branchId: activeBranch?.id },
        }),
      ]);

      if (anaRes.data.success) setAnalytics(anaRes.data.summary);
      if (dashRes.data.success) setDashboardMetrics(dashRes.data);
    } catch (err) {
      error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [startDate, endDate, activeBranch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Reports & Business Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Financial reporting, gross profits, cost of goods sold (COGS), and sales breakdowns
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
          <button
            onClick={() => {
              window.open(`${api.defaults.baseURL}/reports/export/csv`, '_blank');
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ${analytics?.totalRevenue?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{analytics?.totalOrders || 0} completed orders</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Gross Profit</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${analytics?.grossProfit?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Margin: {analytics?.grossProfitMargin || '0%'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Cost of Goods Sold (COGS)</span>
          <div className="mt-2 text-2xl font-black text-slate-700 dark:text-slate-300">
            ${analytics?.totalCogs?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Direct product costs</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Order Value</span>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            ${analytics?.averageOrderValue?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average per customer checkout</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Sales Performance</h2>
              <p className="text-xs text-slate-500">Gross revenue trend over current cycle</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardMetrics?.salesTrend || []}>
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
                  formatter={(val) => [`$${val}`, 'Sales']}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods and Channel Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Payment Channels
            </h2>
            <p className="text-xs text-slate-500 mb-4">Breakdown by cash vs electronic</p>

            <div className="space-y-3">
              {dashboardMetrics?.paymentMethods?.map((pm) => (
                <div
                  key={pm.method}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{pm.method}</span>
                    <span className="text-[10px] text-slate-400 block">{pm.count} transactions</span>
                  </div>
                  <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                    ${pm.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Tax Collected:</span>
              <span className="font-bold">${analytics?.totalTax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Discounts Given:</span>
              <span className="font-bold text-rose-500">-${analytics?.totalDiscount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
