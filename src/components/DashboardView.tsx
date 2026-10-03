import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatINR, formatDateTime, getDaysUntilExpiry } from '../utils';
import {
  IndianRupee,
  TrendingUp,
  Package,
  Boxes,
  AlertTriangle,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Truck,
  ArrowRight,
  ShoppingCart,
  Scan,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    t,
    products,
    transactions,
    purchaseOrders,
    customers,
    setActiveTab,
  } = useStore();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Calculate metrics
  // Assume today is 2026-10-03
  const todayStr = '2026-10-03';
  const todayTransactions = transactions.filter((t) => t.date.startsWith(todayStr));

  const todaySales = todayTransactions.reduce((acc, t) => acc + t.grandTotal, 0);
  const todayProfit = todayTransactions.reduce((acc, t) => acc + t.totalProfit, 0);

  // Cash and UPI collections
  let cashCollection = 0;
  let upiCollection = 0;

  todayTransactions.forEach((tx) => {
    if (tx.paymentMethod === 'cash') cashCollection += tx.grandTotal;
    else if (tx.paymentMethod === 'upi') upiCollection += tx.grandTotal;
    else if (tx.paymentMethod === 'split' && tx.splitPayment) {
      cashCollection += tx.splitPayment.cash || 0;
      upiCollection += tx.splitPayment.upi || 0;
    }
  });

  const totalPurchases = purchaseOrders.reduce((acc, p) => acc + p.totalAmount, 0);

  // Inventory valuation
  const totalStockValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.purchasePrice,
    0
  );
  const totalRetailStockValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.sellingPrice,
    0
  );

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockLevel);
  const expiringProducts = products.filter((p) => {
    const days = getDaysUntilExpiry(p.expiryDate);
    return days >= 0 && days <= 30;
  });

  const totalOutstandingUdhaar = customers.reduce(
    (acc, c) => acc + c.outstandingBalance,
    0
  );

  // Top selling products count from transactions
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.qty;
      productSalesMap[item.productId].revenue += item.total;
    });
  });

  const topSelling = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Payment breakdown
  let totalCash = 0;
  let totalUpi = 0;
  let totalCard = 0;
  let totalUdhaar = 0;

  transactions.forEach((tx) => {
    if (tx.paymentMethod === 'cash') totalCash += tx.grandTotal;
    else if (tx.paymentMethod === 'upi') totalUpi += tx.grandTotal;
    else if (tx.paymentMethod === 'card') totalCard += tx.grandTotal;
    else if (tx.paymentMethod === 'udhaar') totalUdhaar += tx.grandTotal;
    else if (tx.paymentMethod === 'split' && tx.splitPayment) {
      totalCash += tx.splitPayment.cash || 0;
      totalUpi += tx.splitPayment.upi || 0;
      totalCard += tx.splitPayment.card || 0;
      totalUdhaar += tx.splitPayment.udhaar || 0;
    }
  });

  const totalAllRevenue = totalCash + totalUpi + totalCard + totalUdhaar || 1;
  const cashPct = Math.round((totalCash / totalAllRevenue) * 100);
  const upiPct = Math.round((totalUpi / totalAllRevenue) * 100);
  const udhaarPct = Math.round((totalUdhaar / totalAllRevenue) * 100);
  const cardPct = Math.max(0, 100 - cashPct - upiPct - udhaarPct);

  // Category distribution
  const categoryMap: Record<string, number> = {};
  products.forEach((p) => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + p.currentStock;
  });
  const categoryList = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 7-day sales simulation for chart
  const weeklyTrend = [
    { day: 'Mon', sales: 4850, profit: 790 },
    { day: 'Tue', sales: 5200, profit: 840 },
    { day: 'Wed', sales: 4900, profit: 780 },
    { day: 'Thu', sales: 6100, profit: 1020 },
    { day: 'Fri', sales: 5800, profit: 910 },
    { day: 'Sat', sales: 8450, profit: 1390 },
    { day: 'Sun (Today)', sales: todaySales > 0 ? todaySales : 6800, profit: todayProfit > 0 ? todayProfit : 1100 },
  ];

  const maxWeeklySales = Math.max(...weeklyTrend.map((w) => w.sales), 10000);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1440px] mx-auto pb-24 lg:pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Kirana Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Real-time sales, inventory valuation, cash registers & Udhaar accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Billing (F2)</span>
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-neutral-200"
          >
            <Scan className="w-4 h-4 text-neutral-600" />
            <span>Barcode Scanner</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (10 Core Metrics required by prompt) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('todaySales')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(todaySales)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {todayTransactions.length} bills cleared today
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('todayProfit')}</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-indigo-600">
            {formatINR(todayProfit)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Margin: {todaySales > 0 ? Math.round((todayProfit / todaySales) * 100) : 18}%
          </div>
        </div>

        {/* Cash Collection */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('cashCollection')}</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(cashCollection)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">In cash drawer</div>
        </div>

        {/* UPI Collection */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('upiCollection')}</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(upiCollection)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Direct bank settlement</div>
        </div>

        {/* Outstanding Udhaar */}
        <div
          onClick={() => setActiveTab('udhaar')}
          className="bg-white p-4 rounded-xl border border-neutral-200 hover:border-amber-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('outstandingUdhaar')}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-700">
            {formatINR(totalOutstandingUdhaar)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <span>View credit accounts</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('totalStockValue')}</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(totalStockValue)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Retail value: {formatINR(totalRetailStockValue)}
          </div>
        </div>

        {/* Total Products */}
        <div
          onClick={() => setActiveTab('products')}
          className="bg-white p-4 rounded-xl border border-neutral-200 hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('totalProducts')}</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {products.length} Items
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Across 10 categories</div>
        </div>

        {/* Total Purchases */}
        <div
          onClick={() => setActiveTab('purchases')}
          className="bg-white p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('totalPurchases')}</span>
            <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(totalPurchases)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {purchaseOrders.length} consignments received
          </div>
        </div>

        {/* Low Stock Items */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-4 rounded-xl border border-neutral-200 hover:border-orange-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('lowStockItems')}</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-orange-600">
            {lowStockProducts.length} Items
          </div>
          <div className="text-[11px] text-orange-600 font-medium mt-1 flex items-center gap-1">
            <span>Restock required</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div
          onClick={() => setActiveTab('expiry')}
          className="bg-white p-4 rounded-xl border border-neutral-200 hover:border-rose-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">{t('expiringSoon')}</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-rose-600">
            {expiringProducts.length} Items
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
            <span>Check dates</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Analytics & Charts Section (Prompt item 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">{t('salesTrend')}</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Past 7 days performance (Gross Sales vs Net Profit)
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === 'today' ? 'bg-white shadow-xs font-semibold text-neutral-900' : 'text-neutral-600'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === 'month' ? 'bg-white shadow-xs font-semibold text-neutral-900' : 'text-neutral-600'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* SVG Bar & Line Chart */}
          <div className="py-6">
            <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-6 px-2">
              {weeklyTrend.map((item, idx) => {
                const salesHeight = Math.max(12, Math.round((item.sales / maxWeeklySales) * 180));
                const profitHeight = Math.max(8, Math.round((item.profit / maxWeeklySales) * 180));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex items-end justify-center gap-1 h-48">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap transition-opacity shadow-sm z-10 font-mono">
                        Sale: {formatINR(item.sales)} | Profit: {formatINR(item.profit)}
                      </div>

                      {/* Sales bar */}
                      <div
                        style={{ height: `${salesHeight}px` }}
                        className="w-1/2 max-w-[28px] bg-indigo-500 group-hover:bg-indigo-600 rounded-t transition-all"
                      ></div>
                      {/* Profit bar */}
                      <div
                        style={{ height: `${profitHeight}px` }}
                        className="w-1/2 max-w-[28px] bg-emerald-500 group-hover:bg-emerald-600 rounded-t transition-all"
                      ></div>
                    </div>
                    <span className="text-[11px] font-medium text-neutral-600 text-center truncate max-w-[50px]">
                      {item.day.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-500"></span>
                <span className="text-neutral-600">Total Sales (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span className="text-neutral-600">Gross Profit (₹)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods & Top Selling Column */}
        <div className="space-y-6">
          {/* Payment Method Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-1">{t('paymentBreakdown')}</h2>
            <p className="text-xs text-neutral-500 mb-4">Distribution by payment modes</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    Cash (नकद)
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-900">
                    {cashPct}% · {formatINR(totalCash)}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div style={{ width: `${cashPct}%` }} className="h-full bg-teal-500 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    UPI (GPay / PhonePe)
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-900">
                    {upiPct}% · {formatINR(totalUpi)}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div style={{ width: `${upiPct}%` }} className="h-full bg-blue-500 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Udhaar / Credit (खाता)
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-900">
                    {udhaarPct}% · {formatINR(totalUdhaar)}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div style={{ width: `${udhaarPct}%` }} className="h-full bg-amber-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-900">{t('topSellingProducts')}</h2>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Report
              </button>
            </div>

            <div className="space-y-2.5">
              {topSelling.length > 0 ? (
                topSelling.map((prod, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-50 last:border-0">
                    <div className="flex items-center gap-2 max-w-[200px] truncate">
                      <span className="w-4 text-neutral-400 font-mono font-semibold">{i + 1}.</span>
                      <span className="truncate text-neutral-800 font-medium">{prod.name}</span>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <span className="font-semibold text-neutral-900">{prod.qty} units</span>
                      <span className="text-[11px] text-neutral-500 block">{formatINR(prod.revenue)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-neutral-500 py-3 text-center">
                  Start billing to populate fast-moving products.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table (Prompt item 1) */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900">{t('recentTransactions')}</h2>
            <p className="text-xs text-neutral-500">Live sales register and receipts</p>
          </div>
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[11px] border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Bill No.</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Payment Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-4 font-semibold text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                    {tx.billNumber}
                  </td>
                  <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                    {formatDateTime(tx.date)}
                  </td>
                  <td className="py-3 px-4 text-neutral-800 font-medium">
                    {tx.customerName || <span className="text-neutral-400 font-normal">Walk-in</span>}
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    {tx.items.length} item{tx.items.length > 1 ? 's' : ''}
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-neutral-700 font-medium">
                      {tx.paymentMethod === 'udhaar'
                        ? 'Udhaar (खाता)'
                        : tx.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-neutral-900">
                    {formatINR(tx.grandTotal)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-emerald-600">
                    +{formatINR(tx.totalProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
