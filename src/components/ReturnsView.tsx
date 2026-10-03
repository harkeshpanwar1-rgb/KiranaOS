import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Transaction, ReturnRecord } from '../types';
import { formatINR, formatDate, formatDateTime } from '../utils';
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertCircle,
  Package,
  Receipt,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

export const ReturnsView: React.FC = () => {
  const { transactions, returnRecords, processReturn, products } = useStore();

  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<ReturnRecord['reason']>('customer_choice');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'upi' | 'credit'>('cash');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle invoice search
  const handleSearchBill = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!billSearchQuery.trim()) return;

    const clean = billSearchQuery.trim().toLowerCase();
    const found = transactions.find(
      (t) =>
        t.billNumber.toLowerCase() === clean ||
        (t.customerPhone && t.customerPhone.includes(clean)) ||
        (t.customerName && t.customerName.toLowerCase().includes(clean))
    );

    if (found) {
      setSelectedTx(found);
      if (found.items.length > 0) {
        setSelectedProductId(found.items[0].productId);
        setReturnQty(1);
      }
    } else {
      setErrorMsg(`No invoice found for query "${billSearchQuery}". Please check the Bill Number.`);
      setSelectedTx(null);
    }
  };

  const selectedItem = selectedTx?.items.find((i) => i.productId === selectedProductId);

  const refundAmount = selectedItem ? selectedItem.sellingPrice * returnQty : 0;

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTx || !selectedItem) {
      setErrorMsg('Please select an invoice and item to return.');
      return;
    }

    if (returnQty <= 0) {
      setErrorMsg('Return quantity must be greater than zero.');
      return;
    }

    if (returnQty > selectedItem.qty) {
      setErrorMsg(`Cannot return ${returnQty} items. Only ${selectedItem.qty} was purchased on this bill.`);
      return;
    }

    const res = processReturn({
      originalBillNumber: selectedTx.billNumber,
      transactionId: selectedTx.id,
      productId: selectedItem.productId,
      quantity: returnQty,
      refundAmount,
      refundMethod,
      reason: returnReason,
    });

    if (res.success) {
      setSuccessMsg(`Return approved! Restored ${returnQty} units of ${selectedItem.name} to inventory. Refund of ${formatINR(refundAmount)} issued via ${refundMethod.toUpperCase()}.`);
      setSelectedTx(null);
      setBillSearchQuery('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const reasons = [
    { value: 'customer_choice', label: 'Customer changed mind / unopened packet' },
    { value: 'damaged', label: 'Damaged / Seal broken packaging' },
    { value: 'expired', label: 'Expired or quality issue' },
    { value: 'wrong_item', label: 'Wrong item purchased' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-indigo-600" />
            <span>Customer & Product Returns Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Verify original bill, inspect purchased items, restock inventory & issue refunds
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workflow: Step 1 Search Original Bill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Invoice Lookup Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
            <h2 className="text-sm font-bold text-neutral-900">Step 1: Search Original Bill</h2>
            <p className="text-xs text-neutral-500">
              Enter the bill number printed on customer's receipt (e.g. INV-2026-0098) or customer mobile.
            </p>

            <form onSubmit={handleSearchBill} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={billSearchQuery}
                  onChange={(e) => setBillSearchQuery(e.target.value)}
                  placeholder="e.g. INV-2026-0098"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Find Bill
              </button>
            </form>

            {/* Quick Suggestions for testing */}
            <div className="pt-2 border-t border-neutral-100">
              <span className="text-[11px] text-neutral-400 block mb-1.5 font-medium">
                Recent Sample Bills for Testing:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {transactions.slice(0, 3).map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      setBillSearchQuery(tx.billNumber);
                      setSelectedTx(tx);
                      if (tx.items.length > 0) {
                        setSelectedProductId(tx.items[0].productId);
                        setReturnQty(1);
                      }
                    }}
                    className="px-2 py-1 bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-[11px] font-mono text-neutral-700 transition-colors"
                  >
                    {tx.billNumber} ({formatINR(tx.grandTotal)})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Return Policy Notice */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-1 text-indigo-900">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Kirana Store Return Policy</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Standard FMCG grocery items can be returned within 7 days of purchase with original receipt. Stock is automatically incremented in warehouse once return is validated.
            </p>
          </div>
        </div>

        {/* Right Side: Return Processing Form (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTx ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-5 animate-in fade-in">
              <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-neutral-900">
                      Original Bill: {selectedTx.billNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      Verified
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Billed on {formatDateTime(selectedTx.date)} · Cashier: {selectedTx.cashierName}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-neutral-500 block">Total Paid:</span>
                  <span className="text-lg font-bold text-neutral-900">
                    {formatINR(selectedTx.grandTotal)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
                {/* Select Item to Return */}
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1.5">
                    Select Purchased Product to Return:
                  </label>
                  <div className="space-y-2">
                    {selectedTx.items.map((item) => (
                      <div
                        key={item.productId}
                        onClick={() => {
                          setSelectedProductId(item.productId);
                          setReturnQty(1);
                        }}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          selectedProductId === item.productId
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div>
                          <div className="text-xs">{item.name}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            Purchased: {item.qty} {item.unit} @ ₹{item.sellingPrice}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-neutral-900">
                            {formatINR(item.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedItem && (
                  <>
                    {/* Return Quantity & Refund Calculation */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          Quantity to Return (Max {selectedItem.qty}):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedItem.qty}
                          value={returnQty}
                          onChange={(e) =>
                            setReturnQty(
                              Math.min(selectedItem.qty, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-500 mb-1">Total Refund Amount:</label>
                        <div className="text-xl font-bold font-mono text-emerald-600 pt-1">
                          {formatINR(refundAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Return Reason */}
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Reason for Customer Return *
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value as any)}
                        className="w-full p-2 border border-neutral-300 rounded-lg bg-white"
                      >
                        {reasons.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Refund Method */}
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Refund Method *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setRefundMethod('cash')}
                          className={`py-2 px-3 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                            refundMethod === 'cash'
                              ? 'bg-teal-50 border-teal-500 text-teal-800'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          Cash Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefundMethod('upi')}
                          className={`py-2 px-3 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                            refundMethod === 'upi'
                              ? 'bg-blue-50 border-blue-500 text-blue-800'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          UPI Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefundMethod('credit')}
                          className={`py-2 px-3 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                            refundMethod === 'credit'
                              ? 'bg-amber-50 border-amber-500 text-amber-800'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          Store Credit (खाता)
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Authorize Return & Restock Product</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-400 text-xs flex flex-col items-center justify-center h-[340px]">
              <Receipt className="w-12 h-12 text-neutral-300 mb-2 stroke-1" />
              <p className="font-semibold text-neutral-800 text-sm">No Invoice Selected</p>
              <p className="text-neutral-500 mt-1 max-w-xs">
                Search an invoice number on the left to review purchased items and process customer return.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Return Records History Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-sm font-bold text-neutral-900">Historical Return Log</h2>
          <p className="text-xs text-neutral-500">
            Immutable audit trail of customer returns and refunded amounts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Original Bill</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3 text-center">Returned Qty</th>
                <th className="py-3 px-3 text-right">Refund Amount</th>
                <th className="py-3 px-3">Refund Mode</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-4">Processed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {returnRecords.map((ret) => (
                <tr key={ret.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 text-neutral-500 font-mono whitespace-nowrap">
                    {formatDate(ret.date)}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-indigo-600">
                    {ret.originalBillNumber}
                  </td>
                  <td className="py-3 px-3 font-semibold text-neutral-900">{ret.productName}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">
                    -{ret.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                    {formatINR(ret.refundAmount)}
                  </td>
                  <td className="py-3 px-3 uppercase font-medium text-neutral-700">
                    {ret.refundMethod}
                  </td>
                  <td className="py-3 px-3 capitalize text-neutral-600">
                    {ret.reason.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">{ret.processedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {returnRecords.length === 0 && (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No returns recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
