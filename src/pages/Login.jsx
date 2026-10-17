import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('admin@pos.com');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      success('Welcome back to Apex POS!');
      navigate('/');
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoUser = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/30 mb-3">
            A
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Apex POS</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise Point of Sale & Retail Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Roles
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoUser('admin@pos.com')}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-indigo-950/40 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Super Admin</div>
                  <div className="text-[10px] text-slate-500">Full Access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('manager@pos.com')}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-indigo-950/40 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Manager</div>
                  <div className="text-[10px] text-slate-500">Store Mgmt</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('cashier@pos.com')}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-indigo-950/40 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Cashier</div>
                  <div className="text-[10px] text-slate-500">POS Checkout</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('inventory@pos.com')}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-indigo-950/40 hover:border-indigo-500/40 text-left transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Inventory</div>
                  <div className="text-[10px] text-slate-500">Stock & POs</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
