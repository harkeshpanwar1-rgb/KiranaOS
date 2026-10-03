import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import {
  Store,
  ShoppingCart,
  Scan,
  User as UserIcon,
  Globe,
  Bell,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { getDaysUntilExpiry } from '../utils';

export const Header: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    currentUser,
    users,
    setCurrentUser,
    activeTab,
    setActiveTab,
    storeProfile,
    products,
    logout,
  } = useStore();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Compute urgent alerts
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockLevel).length;
  const expiringCount = products.filter((p) => {
    const days = getDaysUntilExpiry(p.expiryDate);
    return days >= 0 && days <= 7;
  }).length;
  const expiredCount = products.filter((p) => getDaysUntilExpiry(p.expiryDate) < 0).length;

  const totalAlerts = lowStockCount + expiringCount + expiredCount;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-neutral-200">
      {/* Zone 1: Single Brand Wordmark according to Top Bar Contract */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-neutral-900 block leading-tight">
              {t('appName')}
            </span>
            <span className="text-[11px] text-neutral-500 hidden sm:block leading-none">
              {storeProfile.storeName}
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-600">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`transition-colors hover:text-neutral-900 ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          {t('dashboard')}
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`transition-colors hover:text-neutral-900 flex items-center gap-1.5 ${
            activeTab === 'pos' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          <span>{t('pos')}</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`transition-colors hover:text-neutral-900 ${
            activeTab === 'products' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          {t('products')}
        </button>
        <button
          onClick={() => setActiveTab('udhaar')}
          className={`transition-colors hover:text-neutral-900 ${
            activeTab === 'udhaar' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          {t('udhaar')}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`transition-colors hover:text-neutral-900 ${
            activeTab === 'reports' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          {t('reports')}
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick POS Sale Button */}
        <button
          onClick={() => setActiveTab('pos')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('newSale')}</span>
          <span className="sm:hidden">POS</span>
        </button>

        {/* Quick Camera Barcode Scan */}
        <button
          onClick={() => setActiveTab('scan')}
          title="Open Barcode & QR Scanner"
          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200 cursor-pointer"
        >
          <Scan className="w-4 h-4" />
        </button>

        {/* Alerts dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="relative p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {totalAlerts}
              </span>
            )}
          </button>

          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">Inventory Alerts</span>
                <span className="text-[11px] text-neutral-500">{totalAlerts} issues</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-neutral-50">
                {lowStockCount > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('inventory');
                      setShowNotificationDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50/50 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-neutral-800">
                        {lowStockCount} items below minimum stock
                      </div>
                      <div className="text-[11px] text-neutral-500">Click to view & restock</div>
                    </div>
                  </button>
                )}
                {(expiringCount > 0 || expiredCount > 0) && (
                  <button
                    onClick={() => {
                      setActiveTab('expiry');
                      setShowNotificationDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50/50 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-neutral-800">
                        {expiredCount > 0 ? `${expiredCount} expired, ` : ''}
                        {expiringCount} expiring within 7 days
                      </div>
                      <div className="text-[11px] text-neutral-500">Check expiry management tab</div>
                    </div>
                  </button>
                )}
                {totalAlerts === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-neutral-500">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    All stock levels and expiry dates are optimal!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bilingual Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-neutral-500" />
          <span className="font-semibold">{language === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>

        {/* Current User & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 p-1 pl-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] overflow-hidden">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="text-left hidden md:block">
              <span className="block font-semibold text-neutral-900 leading-tight">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="block text-[10px] text-neutral-500 capitalize leading-none">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-neutral-100">
                <span className="text-xs text-neutral-500 block">Logged in as</span>
                <span className="text-xs font-semibold text-neutral-900 block truncate">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-indigo-600 font-medium capitalize">
                  Role: {currentUser.role.replace('_', ' ')}
                </span>
              </div>

              <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Switch Role / Staff
              </div>

              <div className="space-y-0.5 px-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      u.id === currentUser.id
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-[10px] text-neutral-500 capitalize">{u.role.replace('_', ' ')}</div>
                    </div>
                    {u.id === currentUser.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-1 pt-1 border-t border-neutral-100 px-1">
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
