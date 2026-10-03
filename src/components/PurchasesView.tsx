import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, PurchaseOrderItem } from '../types';
import { formatINR, formatDate } from '../utils';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Boxes,
  Calendar,
  FileText,
  Search,
  Building2,
  X,
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const {
    suppliers,
    products,
    purchaseOrders,
    receivePurchase,
    currentUser,
    t,
  } = useStore();

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemRate, setItemRate] = useState<number>(products[0]?.purchasePrice || 50);
  const [itemBatch, setItemBatch] = useState<string>(`BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [itemExpiry, setItemExpiry] = useState<string>('2027-12-31');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // When selected product changes in add-item picker
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemRate(prod.purchasePrice);
      setItemExpiry(prod.expiryDate);
    }
  };

  // Add line item to receiving consignment
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (itemQty <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    const total = itemQty * itemRate;

    setOrderItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        qty: itemQty,
        purchasePrice: itemRate,
        batchNumber: itemBatch,
        expiryDate: itemExpiry,
        total,
      },
    ]);

    // Reset line fields
    setItemBatch(`BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalConsignmentAmount = orderItems.reduce((acc, item) => acc + item.total, 0);

  const handleReceiveStock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (orderItems.length === 0) {
      setErrorMsg('Please add at least one product item to this receiving consignment.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) {
      setErrorMsg('Please select a valid supplier.');
      return;
    }

    const paymentStatus =
      paidAmount >= totalConsignmentAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const res = receivePurchase({
      invoiceNumber: invoiceNumber.trim(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: purchaseDate,
      items: orderItems,
      totalAmount: totalConsignmentAmount,
      paidAmount,
      paymentStatus,
      receivedBy: currentUser.name,
    });

    if (res.success) {
      setShowOrderModal(false);
      setOrderItems([]);
      setPaidAmount(0);
      setInvoiceNumber(`INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            <span>Stock Receiving & Supplier Purchases</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Log supplier deliveries, update warehouse inventory counts & credit ledgers
          </p>
        </div>

        <button
          onClick={() => {
            setShowOrderModal(true);
            setPaidAmount(0);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newPurchase')}</span>
        </button>
      </div>

      {/* Past Purchases Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">Purchase Invoices Received</h2>
          <span className="text-xs text-neutral-500 font-mono">
            {purchaseOrders.length} Consignments Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3">Items Included</th>
                <th className="py-3 px-3 text-right">Invoice Amount</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-4">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                    {po.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 text-neutral-600 font-mono whitespace-nowrap">
                    {formatDate(po.date)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-neutral-800">{po.supplierName}</td>
                  <td className="py-3 px-3 text-neutral-600">
                    <span className="font-semibold text-neutral-800">{po.items.length} SKUs</span>{' '}
                    ({po.items.map((i) => `${i.qty} ${i.name.split(' ')[0]}`).slice(0, 2).join(', ')}
                    {po.items.length > 2 ? '...' : ''})
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                    {formatINR(po.totalAmount)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-600 font-semibold">
                    {formatINR(po.paidAmount)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        po.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : po.paymentStatus === 'partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {po.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">{po.receivedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in my-6">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Receive Stock Consignment</h3>
                <p className="text-xs text-neutral-400">
                  Increases stock levels, records batch numbers, and updates supplier balance
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Supplier & Invoice metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Select Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Payable: ₹{s.amountPayable})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Supplier Invoice No. *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Add item to invoice section */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <span className="text-xs font-bold text-neutral-800 block">
                  Add Received Products to Consignment:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-600 mb-1">Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Purchase Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={itemRate}
                      onChange={(e) => setItemRate(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-neutral-600 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={itemBatch}
                      onChange={(e) => setItemBatch(e.target.value)}
                      className="w-full p-1.5 bg-white border border-neutral-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={itemExpiry}
                      onChange={(e) => setItemExpiry(e.target.value)}
                      className="w-full p-1.5 bg-white border border-neutral-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Items List in current modal */}
              {orderItems.length > 0 && (
                <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-100 text-neutral-600 font-semibold border-b">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2">Batch</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {orderItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-neutral-900">{item.name}</td>
                          <td className="p-2 text-center font-mono font-bold">{item.qty}</td>
                          <td className="p-2 text-right font-mono">₹{item.purchasePrice}</td>
                          <td className="p-2 font-mono text-[11px] text-neutral-500">{item.batchNumber}</td>
                          <td className="p-2 text-right font-mono font-bold text-neutral-900">
                            {formatINR(item.total)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-neutral-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals & Payments */}
              <div className="p-4 bg-neutral-100 rounded-xl border border-neutral-200 space-y-2 text-xs">
                <div className="flex justify-between text-sm font-bold text-neutral-900">
                  <span>Total Consignment Amount:</span>
                  <span className="font-mono text-base text-indigo-600">
                    {formatINR(totalConsignmentAmount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Amount Paid Immediately (₹):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totalConsignmentAmount}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">Balance Payable to Supplier:</label>
                    <div className="p-2 bg-white border border-neutral-300 rounded-lg font-mono font-bold text-rose-600">
                      {formatINR(Math.max(0, totalConsignmentAmount - paidAmount))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderItems.length === 0}
                  className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Receive Stock & Update Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
