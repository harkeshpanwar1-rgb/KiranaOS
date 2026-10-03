import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginAsRole, t, storeProfile } = useStore();

  const [identifier, setIdentifier] = useState('rajesh@kiranaos.in');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsRole('owner');
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden relative z-10">
        {/* Brand Header */}
        <div className="p-8 pb-6 text-center border-b border-neutral-100">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">KiranaOS</h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Smart Store Management · {storeProfile.storeName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Email Address or Mobile Number
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@store.com or 9876543210"
                className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-neutral-700">Password</label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-sm"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="remember" className="ml-2 block text-neutral-600 cursor-pointer">
              Remember me on this terminal
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Sign In to Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Staff Logins */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Quick 1-Click Role Login:
            </span>
            <span className="text-[10px] text-neutral-400">Demo Testing</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => loginAsRole('owner')}
              className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-neutral-200 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-neutral-900">Owner</div>
              <div className="text-[10px] text-neutral-500">Rajesh Kumar</div>
            </button>

            <button
              type="button"
              onClick={() => loginAsRole('manager')}
              className="p-2 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-neutral-200 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-neutral-900">Store Manager</div>
              <div className="text-[10px] text-neutral-500">Vikas Sharma</div>
            </button>

            <button
              type="button"
              onClick={() => loginAsRole('cashier')}
              className="p-2 bg-white hover:bg-blue-50 hover:text-blue-700 border border-neutral-200 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-neutral-900">Billing Cashier</div>
              <div className="text-[10px] text-neutral-500">Amit Verma</div>
            </button>

            <button
              type="button"
              onClick={() => loginAsRole('stock_manager')}
              className="p-2 bg-white hover:bg-orange-50 hover:text-orange-700 border border-neutral-200 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-neutral-900">Stock Manager</div>
              <div className="text-[10px] text-neutral-500">Sunil Yadav</div>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-500">
        KiranaOS &copy; 2026 · Retail ERP & POS System for Indian Groceries
      </div>
    </div>
  );
};
