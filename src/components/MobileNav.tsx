import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Scan,
  CreditCard,
  Menu,
  X,
  Package,
  Boxes,
  Truck,
  Receipt,
  RotateCcw,
  Users,
  Building2,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, t } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'scan', label: 'Scan', icon: Scan },
    { id: 'udhaar', label: 'Udhaar', icon: CreditCard },
  ];

  const moreTabs: { id: ActiveTab; labelKey: string; icon: React.ElementType }[] = [
    { id: 'products', labelKey: 'products', icon: Package },
    { id: 'inventory', labelKey: 'inventory', icon: Boxes },
    { id: 'purchases', labelKey: 'purchases', icon: Truck },
    { id: 'sales', labelKey: 'sales', icon: Receipt },
    { id: 'returns', labelKey: 'returns', icon: RotateCcw },
    { id: 'customers', labelKey: 'customers', icon: Users },
    { id: 'suppliers', labelKey: 'suppliers', icon: Building2 },
    { id: 'expiry', labelKey: 'expiry', icon: AlertTriangle },
    { id: 'reports', labelKey: 'reports', icon: BarChart3 },
    { id: 'users', labelKey: 'users', icon: ShieldCheck },
    { id: 'settings', labelKey: 'settings', icon: Settings },
  ];

  return (
    <>
      {/* Bottom Sticky Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setDrawerOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                isActive ? 'text-indigo-600 font-bold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
            drawerOpen ? 'text-indigo-600 font-bold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">More</span>
        </button>
      </nav>

      {/* Drawer Overlay for Mobile Menu */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="font-bold text-base text-neutral-900">KiranaOS Menu</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-neutral-500" />
                    <span>{t(item.labelKey as any)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
