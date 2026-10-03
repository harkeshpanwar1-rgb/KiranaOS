import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Transaction } from '../types';
import { formatINR, formatDateTime } from '../utils';
import { ReceiptModal } from './ReceiptModal';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  FileSpreadsheet,
  X,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { transactions, storeProfile, setActiveTab } = useStore();

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [selectedTxDetails, setSelectedTxDetails] = useState<Transaction | null>(null);

  // Filter
  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      tx.billNumber.toLowerCase().includes(q) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
      (tx.customerPhone && tx.customerPhone.includes(q)) ||
      tx.items.some((item) => item.name.toLowerCase().includes(q));

    const matchPayment = paymentFilter === 'All' || tx.paymentMethod === paymentFilter;

    return matchSearch && matchPayment;
  });

  const totalSalesAmount = filtered.reduce((acc, tx) => acc + tx.grandTotal, 0);
  const totalProfitAmount = filtered.reduce((acc, tx) => acc + tx.totalProfit, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <span>Sales & Transaction Audit Register</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Audit past bills, print thermal receipts, view GST line-items, and handle returns
          </p>
        </div>

        <button
          onClick={() => setActiveTab('returns')}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Customer Returns Portal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Filtered Sales</span>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatINR(totalSalesAmount)}
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">{filtered.length} Invoices</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Gross Retail Profit</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {formatINR(totalProfitAmount)}
          </div>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Net earnings on sold items</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Average Bill Value</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1 tabular-nums">
            {formatINR(filtered.length > 0 ? totalSalesAmount / filtered.length : 0)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Basket size per customer</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Bill No., Customer Name, Phone, or Item..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700 cursor-pointer"
        >
          <option value="All">All Payment Modes</option>
          <option value="cash">Cash (नकद)</option>
          <option value="upi">UPI (GPay / PhonePe)</option>
          <option value="card">Card / POS</option>
          <option value="udhaar">Udhaar (खाता)</option>
          <option value="split">Split Payment</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Bill No.</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-right">Profit</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                    {tx.billNumber}
                  </td>
                  <td className="py-3 px-3 text-neutral-600 font-mono whitespace-nowrap">
                    {formatDateTime(tx.date)}
                  </td>
                  <td className="py-3 px-3 font-medium text-neutral-900">
                    {tx.customerName ? (
                      <div>
                        <div>{tx.customerName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{tx.customerPhone}</div>
                      </div>
                    ) : (
                      <span className="text-neutral-400 italic">Walk-in</span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-neutral-700 capitalize">
                      {tx.paymentMethod === 'udhaar' ? 'Udhaar (खाता)' : tx.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold">
                    {tx.items.length}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-500">
                    {tx.discountTotal > 0 ? `₹${tx.discountTotal}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-neutral-900">
                    {formatINR(tx.grandTotal)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-emerald-600">
                    +{formatINR(tx.totalProfit)}
                  </td>
                  <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                    {tx.cashierName.split(' ')[0]}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTxDetails(tx)}
                        title="View Full Bill Details"
                        className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setSelectedTxForReceipt(tx)}
                        title="Print Thermal 80mm Receipt"
                        className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No matching sales transactions found.
            </div>
          )}
        </div>
      </div>

      {/* Full Bill Detail Modal */}
      {selectedTxDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="font-bold text-base text-neutral-900">
                  Invoice Details: {selectedTxDetails.billNumber}
                </h3>
                <span className="text-xs text-neutral-500">
                  {formatDateTime(selectedTxDetails.date)} · Billed by {selectedTxDetails.cashierName}
                </span>
              </div>
              <button
                onClick={() => setSelectedTxDetails(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              {/* Customer info if any */}
              {selectedTxDetails.customerName && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500 block text-[10px]">Customer:</span>
                  <span className="font-bold text-neutral-900">
                    {selectedTxDetails.customerName} ({selectedTxDetails.customerPhone})
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 text-neutral-600 font-semibold border-b">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedTxDetails.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-neutral-900">{item.name}</td>
                        <td className="p-2 text-center font-mono">
                          {item.qty} {item.unit}
                        </td>
                        <td className="p-2 text-right font-mono">₹{item.sellingPrice}</td>
                        <td className="p-2 text-right font-mono font-bold text-neutral-900">
                          {formatINR(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(selectedTxDetails.subtotal)}</span>
                </div>
                {selectedTxDetails.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- {formatINR(selectedTxDetails.discountTotal)}</span>
                  </div>
                )}
                {selectedTxDetails.taxTotal > 0 && (
                  <div className="flex justify-between text-neutral-500 text-[11px]">
                    <span>GST (Tax):</span>
                    <span>{formatINR(selectedTxDetails.taxTotal, true)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1 border-t">
                  <span>Grand Total:</span>
                  <span>{formatINR(selectedTxDetails.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 pt-1 text-[11px]">
                  <span>Payment Mode:</span>
                  <span className="font-semibold uppercase">{selectedTxDetails.paymentMethod}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setSelectedTxForReceipt(selectedTxDetails);
                  setSelectedTxDetails(null);
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal Trigger */}
      {selectedTxForReceipt && (
        <ReceiptModal
          transaction={selectedTxForReceipt}
          storeProfile={storeProfile}
          triggerConfetti={false}
          onClose={() => setSelectedTxForReceipt(null)}
        />
      )}
    </div>
  );
};
