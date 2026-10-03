import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatINR, formatDate } from '../utils';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  TrendingUp,
  Package,
  CreditCard,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

type ReportCategory =
  | 'sales'
  | 'profit'
  | 'purchases'
  | 'stock_valuation'
  | 'best_selling'
  | 'slow_moving'
  | 'udhaar'
  | 'suppliers';

export const ReportsView: React.FC = () => {
  const { products, transactions, purchaseOrders, customers, suppliers } = useStore();

  const [activeReport, setActiveReport] = useState<ReportCategory>('sales');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Compute metrics
  const totalRevenue = transactions.reduce((acc, t) => acc + t.grandTotal, 0);
  const totalProfit = transactions.reduce((acc, t) => acc + t.totalProfit, 0);
  const totalPurchases = purchaseOrders.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalStockCost = products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
  const totalStockRetail = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const totalOutstandingUdhaar = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const totalSupplierPayable = suppliers.reduce((acc, s) => acc + s.amountPayable, 0);

  // Cash vs UPI collection
  let totalCash = 0;
  let totalUpi = 0;
  transactions.forEach((tx) => {
    if (tx.paymentMethod === 'cash') totalCash += tx.grandTotal;
    else if (tx.paymentMethod === 'upi') totalUpi += tx.grandTotal;
    else if (tx.paymentMethod === 'split' && tx.splitPayment) {
      totalCash += tx.splitPayment.cash || 0;
      totalUpi += tx.splitPayment.upi || 0;
    }
  });

  // Product sales mapping
  const productSalesMap: Record<string, { product: any; unitsSold: number; revenue: number; profit: number }> = {};
  products.forEach((p) => {
    productSalesMap[p.id] = { product: p, unitsSold: 0, revenue: 0, profit: 0 };
  });

  transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].unitsSold += item.qty;
        productSalesMap[item.productId].revenue += item.total;
        productSalesMap[item.productId].profit += (item.sellingPrice - item.purchasePrice) * item.qty;
      }
    });
  });

  const productStats = Object.values(productSalesMap);
  const bestSellers = [...productStats].sort((a, b) => b.unitsSold - a.unitsSold);
  const slowMovers = [...productStats].sort((a, b) => a.unitsSold - b.unitsSold);

  // CSV Export utility
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeReport === 'sales') {
      csvContent += 'Bill Number,Date,Customer,Payment Method,Grand Total (INR),Profit (INR)\n';
      transactions.forEach((tx) => {
        csvContent += `"${tx.billNumber}","${tx.date}","${tx.customerName || 'Walk-in'}","${tx.paymentMethod}",${tx.grandTotal},${tx.totalProfit}\n`;
      });
    } else if (activeReport === 'stock_valuation') {
      csvContent += 'Product,Brand,Category,Stock,Unit,Purchase Price (INR),Selling Price (INR),Total Cost Value (INR)\n';
      products.forEach((p) => {
        csvContent += `"${p.name}","${p.brand}","${p.category}",${p.currentStock},"${p.unit}",${p.purchasePrice},${p.sellingPrice},${p.currentStock * p.purchasePrice}\n`;
      });
    } else if (activeReport === 'udhaar') {
      csvContent += 'Customer Name,Phone,Address,Outstanding Udhaar (INR),Total Purchases (INR),Total Paid (INR)\n';
      customers.forEach((c) => {
        csvContent += `"${c.name}","${c.phone}","${c.address}",${c.outstandingBalance},${c.totalPurchases},${c.totalPaid}\n`;
      });
    } else {
      csvContent += 'Item,Category,Units Sold,Revenue (INR),Profit (INR)\n';
      bestSellers.forEach((s) => {
        csvContent += `"${s.product.name}","${s.product.category}",${s.unitsSold},${s.revenue},${s.profit}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KiranaOS_Report_${activeReport}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const reportNavs: { id: ReportCategory; label: string }[] = [
    { id: 'sales', label: 'Sales & Revenue' },
    { id: 'profit', label: 'Gross Profit Analysis' },
    { id: 'stock_valuation', label: 'Stock Valuation Master' },
    { id: 'best_selling', label: 'Fast Moving (Bestsellers)' },
    { id: 'slow_moving', label: 'Slow Moving Products' },
    { id: 'purchases', label: 'Supplier Purchases' },
    { id: 'udhaar', label: 'Customer Udhaar Register' },
    { id: 'suppliers', label: 'Supplier Payables Ledger' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Reports, Profit Margins & Commercial Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Export GST registers, evaluate profitability, and monitor distributor payables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg border border-neutral-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Revenue</span>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatINR(totalRevenue)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">{transactions.length} bills</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Gross Profit</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {formatINR(totalProfit)}
          </div>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            Avg Margin: {totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Cash vs UPI Split</span>
          <div className="text-sm font-bold font-mono text-neutral-800 mt-1">
            Cash: {formatINR(totalCash)}
          </div>
          <div className="text-sm font-bold font-mono text-blue-600">
            UPI: {formatINR(totalUpi)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Outstanding Udhaar Due</span>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {formatINR(totalOutstandingUdhaar)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Receivable from customers</span>
        </div>
      </div>

      {/* Report Category Switcher Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {reportNavs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer shrink-0 ${
              activeReport === tab.id
                ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Report Table Content */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        {/* Report 1: Sales & Revenue */}
        {activeReport === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Bill No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Discount</th>
                  <th className="py-3 px-3 text-right">Tax (GST)</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{tx.billNumber}</td>
                    <td className="py-3 px-3 text-neutral-600 font-mono whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-3 font-medium text-neutral-800">
                      {tx.customerName || <span className="text-neutral-400">Walk-in</span>}
                    </td>
                    <td className="py-3 px-3 uppercase font-semibold text-neutral-700">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{formatINR(tx.subtotal)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-500">
                      {tx.discountTotal > 0 ? `₹${tx.discountTotal}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-500">
                      {formatINR(tx.taxTotal, true)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-neutral-900">
                      {formatINR(tx.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-600">
                      +{formatINR(tx.totalProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 2: Gross Profit */}
        {activeReport === 'profit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Units Sold</th>
                  <th className="py-3 px-3 text-right">Purchase Price (₹)</th>
                  <th className="py-3 px-3 text-right">Selling Price (₹)</th>
                  <th className="py-3 px-3 text-right">Gross Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {productStats
                  .filter((s) => s.unitsSold > 0)
                  .map((stat) => (
                    <tr key={stat.product.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-neutral-900">{stat.product.name}</td>
                      <td className="py-3 px-3 text-neutral-600">{stat.product.category}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{stat.unitsSold}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{stat.product.purchasePrice}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-600">
                        ₹{stat.product.sellingPrice}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                        {formatINR(stat.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        +{formatINR(stat.profit)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 3: Stock Valuation */}
        {activeReport === 'stock_valuation' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center">In-Stock Qty</th>
                  <th className="py-3 px-3 text-right">Cost Rate (₹)</th>
                  <th className="py-3 px-3 text-right">Retail Rate (₹)</th>
                  <th className="py-3 px-3 text-right">Total Cost Value</th>
                  <th className="py-3 px-4 text-right">Total Retail Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-neutral-500">{p.sku}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {p.currentStock} {p.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">₹{p.purchasePrice}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-600">
                      ₹{p.sellingPrice}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatINR(p.currentStock * p.purchasePrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatINR(p.currentStock * p.sellingPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 4: Fast Moving / Bestsellers */}
        {(activeReport === 'best_selling' || activeReport === 'slow_moving') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Units Sold</th>
                  <th className="py-3 px-3 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Current Warehouse Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(activeReport === 'best_selling' ? bestSellers : slowMovers).map((stat, i) => (
                  <tr key={stat.product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-400">#{i + 1}</td>
                    <td className="py-3 px-3 font-semibold text-neutral-900">{stat.product.name}</td>
                    <td className="py-3 px-3 text-neutral-600">{stat.product.category}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600">
                      {stat.unitsSold} units
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatINR(stat.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {stat.product.currentStock} {stat.product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 5: Customer Udhaar */}
        {activeReport === 'udhaar' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3 text-right">Total Purchased</th>
                  <th className="py-3 px-3 text-right">Total Paid Back</th>
                  <th className="py-3 px-4 text-right">Outstanding Udhaar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">{c.name}</td>
                    <td className="py-3 px-3 font-mono text-neutral-500">{c.phone}</td>
                    <td className="py-3 px-3 text-neutral-600">{c.address}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatINR(c.totalPurchases)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">
                      {formatINR(c.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                      {formatINR(c.outstandingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 6: Supplier Payables */}
        {activeReport === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Supplier Firm</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3 text-right">Total Purchases</th>
                  <th className="py-3 px-3 text-right">Amount Cleared</th>
                  <th className="py-3 px-4 text-right">Payable Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">{s.name}</td>
                    <td className="py-3 px-3 text-neutral-600">{s.contactPerson} ({s.phone})</td>
                    <td className="py-3 px-3 font-mono text-neutral-500">{s.gstin}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatINR(s.totalPurchases)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">
                      {formatINR(s.amountPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatINR(s.amountPayable)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 7: Purchases */}
        {activeReport === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-right">Paid Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{po.invoiceNumber}</td>
                    <td className="py-3 px-3 text-neutral-600 font-mono">{formatDate(po.date)}</td>
                    <td className="py-3 px-3 font-semibold text-neutral-800">{po.supplierName}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">{formatINR(po.totalAmount)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">{formatINR(po.paidAmount)}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-neutral-700">
                      {po.paymentStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
