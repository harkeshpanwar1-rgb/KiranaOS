import React from 'react';
import { useStore } from '../context/StoreContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Scan,
  Truck,
  Receipt,
  RotateCcw,
  Users,
  CreditCard,
  Building2,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { getDaysUntilExpiry } from '../utils';

interface NavItem {
  id: ActiveTab;
  labelKey: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, t, products, customers } = useStore();

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockLevel).length;
  const expiringCount = products.filter((p) => {
    const days = getDaysUntilExpiry(p.expiryDate);
    return days <= 7;
  }).length;
  const udhaarCustomersCount = customers.filter((c) => c.outstandingBalance > 0).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { id: 'pos', labelKey: 'pos', icon: ShoppingCart },
    { id: 'products', labelKey: 'products', icon: Package },
    { id: 'inventory', labelKey: 'inventory', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-orange-500 text-white' },
    { id: 'scan', labelKey: 'scan', icon: Scan },
    { id: 'purchases', labelKey: 'purchases', icon: Truck },
    { id: 'sales', labelKey: 'sales', icon: Receipt },
    { id: 'returns', labelKey: 'returns', icon: RotateCcw },
    { id: 'customers', labelKey: 'customers', icon: Users },
    { id: 'udhaar', labelKey: 'udhaar', icon: CreditCard, badge: udhaarCustomersCount > 0 ? udhaarCustomersCount : undefined, badgeColor: 'bg-amber-600 text-white' },
    { id: 'suppliers', labelKey: 'suppliers', icon: Building2 },
    { id: 'expiry', labelKey: 'expiry', icon: AlertTriangle, badge: expiringCount > 0 ? expiringCount : undefined, badgeColor: 'bg-rose-500 text-white' },
    { id: 'reports', labelKey: 'reports', icon: BarChart3 },
    { id: 'users', labelKey: 'users', icon: ShieldCheck },
    { id: 'settings', labelKey: 'settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200 shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          Store Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-neutral-400 group-hover:text-neutral-700'
                  }`}
                />
                <span className="truncate">{t(item.labelKey as any)}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`ml-2 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                    item.badgeColor || 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick shortcuts info at bottom */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50/70 text-[11px] text-neutral-500">
        <div className="flex items-center justify-between font-mono">
          <span>Billing Shortcut</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px] shadow-xs">
            F2
          </kbd>
        </div>
        <div className="flex items-center justify-between font-mono mt-1">
          <span>Complete Sale</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px] shadow-xs">
            Enter
          </kbd>
        </div>
      </div>
    </aside>
  );
};
