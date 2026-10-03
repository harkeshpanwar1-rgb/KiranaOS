import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { ScanView } from './components/ScanView';
import { PurchasesView } from './components/PurchasesView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { ReturnsView } from './components/ReturnsView';
import { CustomersView } from './components/CustomersView';
import { UdhaarView } from './components/UdhaarView';
import { SuppliersView } from './components/SuppliersView';
import { ExpiryView } from './components/ExpiryView';
import { ReportsView } from './components/ReportsView';
import { UsersView } from './components/UsersView';
import { SettingsView } from './components/SettingsView';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, activeTab } = useStore();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <POSView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'scan':
        return <ScanView />;
      case 'purchases':
        return <PurchasesView />;
      case 'sales':
        return <SalesHistoryView />;
      case 'returns':
        return <ReturnsView />;
      case 'customers':
        return <CustomersView />;
      case 'udhaar':
        return <UdhaarView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'expiry':
        return <ExpiryView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans antialiased text-neutral-900">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          {renderActiveView()}
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}
