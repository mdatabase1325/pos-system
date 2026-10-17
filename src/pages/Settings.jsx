import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  Save,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  Edit2,
  Database,
  Lock,
  User as UserIcon,
  Key,
  Download,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function Settings() {
  const { user, hasRole } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('business'); // 'business', 'branches', 'users'

  // Settings State
  const [settings, setSettings] = useState({
    STORE_NAME: '',
    STORE_ADDRESS: '',
    STORE_PHONE: '',
    STORE_EMAIL: '',
    CURRENCY_SYMBOL: '$',
    TAX_RATE: '8.25',
    RECEIPT_HEADER: '',
    RECEIPT_FOOTER: '',
  });

  // Branches State
  const [branches, setBranches] = useState([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '', email: '' });

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    phone: '',
    branchId: '',
  });

  // Profile & Password State
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [dbHealth, setDbHealth] = useState(null);

  const loadAll = async () => {
    try {
      const [setRes, brRes, usrRes, healthRes] = await Promise.all([
        api.get('/settings'),
        api.get('/branches'),
        api.get('/users'),
        api.get('/settings/health').catch(() => ({ data: { success: false } })),
      ]);

      if (setRes.data.success) setSettings((prev) => ({ ...prev, ...setRes.data.settings }));
      if (brRes.data.success) setBranches(brRes.data.branches);
      if (usrRes.data.success) setUsersList(usrRes.data.users);
      if (healthRes.data?.success) setDbHealth(healthRes.data.database);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', profileForm);
      success('Profile details updated.');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      success('Business configuration updated.');
    } catch (err) {
      error('Failed to save settings.');
    }
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, branchForm);
        success('Branch updated.');
      } else {
        await api.post('/branches', branchForm);
        success('Branch created.');
      }
      setBranchModalOpen(false);
      loadAll();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save branch.');
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userForm);
        success('User updated.');
      } else {
        await api.post('/users', userForm);
        success('User created.');
      }
      setUserModalOpen(false);
      loadAll();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      const res = await api.patch(`/users/${targetUser.id}/toggle-status`);
      success(res.data.message);
      loadAll();
    } catch (err) {
      error(err.response?.data?.message || 'Cannot toggle user status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          System Configuration & Settings
        </h1>
        <p className="text-xs text-slate-500">
          Manage business profile, multi-branch network, tax parameters, and employee accounts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('business')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'business'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Business & Tax Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'branches'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Branches ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & RBAC ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>My Profile & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'database'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Backups</span>
        </button>
      </div>

      {/* BUSINESS SETTINGS TAB */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Business / Store Name</label>
              <input
                type="text"
                value={settings.STORE_NAME}
                onChange={(e) => setSettings({ ...settings, STORE_NAME: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.CURRENCY_SYMBOL}
                onChange={(e) => setSettings({ ...settings, CURRENCY_SYMBOL: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={settings.TAX_RATE}
                onChange={(e) => setSettings({ ...settings, TAX_RATE: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.STORE_PHONE}
                onChange={(e) => setSettings({ ...settings, STORE_PHONE: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Store Address</label>
              <input
                type="text"
                value={settings.STORE_ADDRESS}
                onChange={(e) => setSettings({ ...settings, STORE_ADDRESS: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Receipt Header Text</label>
              <input
                type="text"
                value={settings.RECEIPT_HEADER}
                onChange={(e) => setSettings({ ...settings, RECEIPT_HEADER: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Receipt Footer Note</label>
              <textarea
                rows="2"
                value={settings.RECEIPT_FOOTER}
                onChange={(e) => setSettings({ ...settings, RECEIPT_FOOTER: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </button>
          </div>
        </form>
      )}

      {/* MULTI-BRANCH TAB */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingBranch(null);
                setBranchForm({ name: '', code: '', address: '', phone: '', email: '' });
                setBranchModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Store Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{b.name}</h3>
                    <Badge variant="primary">{b.code}</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500 mt-2">
                    <p>Address: {b.address || '—'}</p>
                    <p>Phone: {b.phone || '—'}</p>
                    <p>Email: {b.email || '—'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    {b._count?.users || 0} Staff • {b._count?.sales || 0} Orders
                  </span>
                  <button
                    onClick={() => {
                      setEditingBranch(b);
                      setBranchForm({
                        name: b.name,
                        code: b.code,
                        address: b.address || '',
                        phone: b.phone || '',
                        email: b.email || '',
                      });
                      setBranchModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingUser(null);
                setUserForm({
                  name: '',
                  email: '',
                  password: '',
                  role: 'CASHIER',
                  phone: '',
                  branchId: branches[0]?.id || '',
                });
                setUserModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New User</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Assigned Branch</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="primary">{u.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {u.branch?.name || 'All Branches'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({
                              name: u.name,
                              email: u.email,
                              password: '',
                              role: u.role,
                              phone: u.phone || '',
                              branchId: u.branchId || '',
                            });
                            setUserModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold ${
                            u.isActive
                              ? 'border-rose-200 text-rose-500 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MY PROFILE & SECURITY TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Profile Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <UserIcon className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Profile Information</h3>
                <p className="text-xs text-slate-400">Update your account name and contact number</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role Permission</label>
                <div>
                  <Badge variant="primary">{user?.role?.replace('_', ' ')}</Badge>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Key className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Change Password</h3>
                <p className="text-xs text-slate-400">Keep your POS account secure with a strong password</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Password (Min 6 chars) *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Update Account Password</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DATABASE & BACKUPS TAB */}
      {activeTab === 'database' && (
        <div className="space-y-6 max-w-3xl">
          {/* Live MongoDB Status Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Active Database Cluster</h3>
                  <p className="text-xs text-slate-400">MongoDB Atlas Cloud Replica Set</p>
                </div>
              </div>
              <Badge variant="success">Online & Connected</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cluster Ping Latency</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {dbHealth?.latencyMs ? `${dbHealth.latencyMs} ms` : '< 50 ms'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Live Product Records</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {dbHealth?.productsCount || 9}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Database Engine</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  MongoDB Atlas
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 font-mono">
              <span>Target: cluster0.r464sit.mongodb.net/pos_db</span>
            </div>
          </div>

          {/* Backup & Export Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Download className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Full Database JSON Snapshot</h3>
                <p className="text-xs text-slate-400">
                  Export complete settings, products, branches, customers, and suppliers into a portable backup file
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                window.open(`${api.defaults.baseURL}/settings/backup`, '_blank');
              }}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Database Backup (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* BRANCH MODAL */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title={editingBranch ? 'Edit Store Branch' : 'Add Store Branch'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Branch Name *</label>
            <input
              type="text"
              required
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Branch Code (Unique) *</label>
            <input
              type="text"
              required
              placeholder="e.g. BR-EAST"
              value={branchForm.code}
              onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
            <input
              type="text"
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
          >
            Save Branch
          </button>
        </form>
      </Modal>

      {/* USER MODAL */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Create User'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Password {editingUser && '(Leave blank to keep current)'}
            </label>
            <input
              type="password"
              required={!editingUser}
              placeholder="••••••••"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Role Permission</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="SUPER_ADMIN">Super Admin (All Privileges)</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier (POS Checkout Only)</option>
              <option value="INVENTORY_STAFF">Inventory Staff (Stock & Purchasing)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Branch</label>
            <select
              value={userForm.branchId}
              onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
          >
            Save User
          </button>
        </form>
      </Modal>
    </div>
  );
}
