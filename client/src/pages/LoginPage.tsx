import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, UserCheck, ArrowRight, Lock, User as UserIcon, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('aww_hansa');
  const [password, setPassword] = useState('khorak123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const demoAccounts = [
    {
      role: 'AWW (Frontline)',
      roleGu: 'આંગણવાડી કાર્યકર (મુખ્ય)',
      name: 'Hansaben Patel',
      username: 'aww_hansa',
      scope: 'Vavdi Buzarg AWC',
      desc: 'Stock Intake, THR & HCM distribution, Physical Counts, MPR generator',
      badge: 'Frontline User',
      color: 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60',
    },
    {
      role: 'Supervisor',
      roleGu: 'મુખ્ય સેવિકા (સુપરવાઇઝર)',
      name: 'Rekhaben Varma',
      username: 'sup_rekha',
      scope: 'Godhra Rural Sector A (25-30 AWCs)',
      desc: 'Heatmap oversight, Discrepancy approvals, Recount requests, Short deliveries',
      badge: 'Sector Oversight',
      color: 'border-amber-300 bg-amber-50/50 hover:bg-amber-100/60',
    },
    {
      role: 'CDPO (Block)',
      roleGu: 'સી.ડી.પી.ઓ. (તાલુકા કચેરી)',
      name: 'Maheshbhai Joshi',
      username: 'cdpo_mahesh',
      scope: 'Godhra Block (75-150 AWCs)',
      desc: 'Block-level quotas, Major write-offs (>= 500g), Supplier performance',
      badge: 'Block Manager',
      color: 'border-blue-300 bg-blue-50/50 hover:bg-blue-100/60',
    },
    {
      role: 'DPO (District)',
      roleGu: 'ડી.પી.ઓ. (જિલ્લા પ્રોગ્રામ અધિકારી)',
      name: 'Dr. Priyaben Dave',
      username: 'dpo_priya',
      scope: 'Panchmahal District',
      desc: 'District analytics, CAG 2024 compliance metrics, Audit-readiness reports',
      badge: 'District Analytics',
      color: 'border-purple-300 bg-purple-50/50 hover:bg-purple-100/60',
    },
    {
      role: 'Supplier (GCMMFL)',
      roleGu: 'સપ્લાયર (અમૂલ ફેડરેશન)',
      name: 'Kishorebhai Bhatt',
      username: 'supplier_amul',
      scope: 'GCMMFL / Amul Dairy Supply',
      desc: 'Create dispatches, generate challan numbers, track delivery fulfillment',
      badge: 'Supply Coordinator',
      color: 'border-saffron-300 bg-saffron-50/50 hover:bg-saffron-100/60',
    },
    {
      role: 'AWH (Helper)',
      roleGu: 'આંગણવાડી તેડાગર',
      name: 'Gitaben Parmar',
      username: 'awh_gitaben',
      scope: 'Vavdi Buzarg AWC',
      desc: 'Read-only centre stock levels and incoming delivery schedules',
      badge: 'Read-Only Frontline',
      color: 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/60',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userAcc: string) => {
    setError('');
    setLoading(true);
    try {
      await login(userAcc, 'khorak123');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FBF9F5] flex flex-col justify-start sm:justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Emblem / Brand Icon */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-forest-800 border-2 border-forest-600 shadow-xl items-center justify-center text-saffron-400 font-extrabold text-3xl mb-3">
          ખ
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900 tracking-tight font-sans">
          {t('appName')}
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-600 max-w-sm mx-auto">
          {t('appTagline')}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100/80 text-forest-800 text-xs font-bold border border-forest-200">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
          <span>Seva First Innovation Challenge 2026 · PS000052</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Login Box */}
        <div className="bg-white py-6 px-5 sm:px-8 shadow-sm rounded-2xl border border-slate-200/80 mb-6">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Username / વપરાશકર્તા નામ
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-forest-600 focus:border-forest-600 bg-white"
                  placeholder="aww_hansa"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Password / પાસવર્ડ
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-forest-600 focus:border-forest-600 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-forest-700 hover:bg-forest-800 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : `${t('login')} →`}
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('aww_hansa')}
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-3 border border-forest-300 rounded-xl text-xs font-bold text-forest-800 bg-forest-50 hover:bg-forest-100 transition active:scale-95"
            >
              🚀 આંગણવાડી કાર્યકર તરીકે સીધા પ્રવેશ કરો (Direct Enter as Hansaben)
            </button>
          </form>
        </div>

        {/* 1-Click Demo Accounts Selection */}
        <div className="bg-white py-5 px-5 sm:px-8 shadow-sm rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-saffron-500" />
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                1-Click Demo Role Switcher (Seeded Test Accounts)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Password: <code className="bg-slate-100 px-1 py-0.5 rounded text-forest-700 font-mono">khorak123</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleQuickLogin(acc.username)}
                disabled={loading}
                className={`text-left p-3 rounded-xl border transition shadow-sm flex flex-col justify-between ${acc.color} active:scale-98`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'gu' ? acc.roleGu : acc.role}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 text-slate-700 border border-slate-200">
                      {acc.badge}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-forest-800 mt-0.5">{acc.name}</div>
                  <div className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-tight">
                    {acc.desc}
                  </div>
                </div>
                <div className="mt-2.5 pt-1.5 border-t border-slate-200/40 flex items-center justify-between text-[11px] font-bold text-forest-700">
                  <span className="truncate">{acc.scope}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
