import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Supplier } from '../types';
import { formatINR, formatDate } from '../utils';
import {
  Building2,
  Plus,
  Receipt,
  Phone,
  MapPin,
  FileText,
  Search,
  CheckCircle,
  X,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, recordSupplierPayment, purchaseOrders } = useStore();

  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(suppliers[0] || null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('Bank RTGS / UPI settlement');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [productsSupplied, setProductsSupplied] = useState('Grocery, FMCG, Staples');

  const totalPayable = suppliers.reduce((acc, s) => acc + s.amountPayable, 0);

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase().trim();
    return !q || s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    const res = recordSupplierPayment(selectedSupplier.id, paymentAmount, paymentNotes);
    if (res.success) {
      setShowPaymentModal(false);
      const updated = suppliers.find((s) => s.id === selectedSupplier.id);
      if (updated) setSelectedSupplier(updated);
    } else {
      alert(res.message);
    }
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactPerson.trim() || !phone.trim()) {
      alert('Supplier Name, Contact Person, and Phone are required.');
      return;
    }

    const created = addSupplier({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Wholesale Mandi',
      gstin: gstin.trim() || 'Unregistered',
      productsSupplied: productsSupplied.split(',').map((p) => p.trim()),
    });

    setSelectedSupplier(created);
    setShowAddModal(false);
    setName('');
    setContactPerson('');
    setPhone('');
    setAddress('');
    setGstin('');
  };

  // Past orders for selected supplier
  const supplierOrders = purchaseOrders.filter((po) => selectedSupplier && po.supplierId === selectedSupplier.id);

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Supplier Directory & Wholesale Accounts</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage wholesale distributors, procurement invoices, and supplier payable balances
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Supplier</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Payable to Suppliers</span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
            {formatINR(totalPayable)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Outstanding balance to distributors</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Wholesale Purchases</span>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatINR(suppliers.reduce((a, b) => a + b.totalPurchases, 0))}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">All procurement consignments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Paid to Suppliers</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {formatINR(suppliers.reduce((a, b) => a + b.amountPaid, 0))}
          </div>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Cleared via Cheque / RTGS / Cash</span>
        </div>
      </div>

      {/* Two Column Layout: Suppliers & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Suppliers List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search supplier by name or contact..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {filteredSuppliers.map((s) => {
              const isSelected = selectedSupplier?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSupplier(s)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-neutral-900 truncate">{s.name}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Contact: {s.contactPerson} · {s.phone}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      GSTIN: {s.gstin}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold text-xs sm:text-sm ${
                        s.amountPayable > 0 ? 'text-rose-600' : 'text-neutral-500'
                      }`}
                    >
                      {formatINR(s.amountPayable)}
                    </div>
                    <span className="text-[10px] text-neutral-400 block">Payable</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ledger & History (7 cols) */}
        <div className="lg:col-span-7">
          {selectedSupplier ? (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col h-[600px]">
              {/* Header */}
              <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">{selectedSupplier.name}</h2>
                  <p className="text-xs text-neutral-500">
                    {selectedSupplier.contactPerson} ({selectedSupplier.phone}) · {selectedSupplier.address}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPaymentAmount(selectedSupplier.amountPayable);
                    setShowPaymentModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ Record Supplier Payment</span>
                </button>
              </div>

              {/* Status summary */}
              <div className="p-4 bg-neutral-50 border-b border-neutral-200 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Total Purchases</span>
                  <span className="text-base font-bold font-mono text-neutral-900">
                    {formatINR(selectedSupplier.totalPurchases)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Amount Paid</span>
                  <span className="text-base font-bold font-mono text-emerald-600">
                    {formatINR(selectedSupplier.amountPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Balance Payable</span>
                  <span className="text-base font-bold font-mono text-rose-600">
                    {formatINR(selectedSupplier.amountPayable)}
                  </span>
                </div>
              </div>

              {/* Ledger Entries Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Invoice / Ref</th>
                      <th className="py-2.5 px-3 text-right">Debit (+)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-)</th>
                      <th className="py-2.5 px-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedSupplier.ledger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-neutral-600 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              entry.type === 'purchase'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {entry.type === 'purchase' ? 'STOCK' : 'PAID'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          <div>{entry.invoiceNo}</div>
                          {entry.notes && (
                            <div className="text-[10px] text-neutral-400 font-sans">{entry.notes}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                          {entry.type === 'purchase' ? `+${formatINR(entry.amount)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                          {entry.type === 'payment' ? `-${formatINR(entry.amount)}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-neutral-900">
                          {formatINR(entry.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {selectedSupplier.ledger.length === 0 && (
                  <div className="py-16 text-center text-neutral-400 text-xs">
                    No transactions recorded for this supplier.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-400 text-xs flex flex-col items-center justify-center h-[600px]">
              <Building2 className="w-12 h-12 text-neutral-300 mb-2 stroke-1" />
              <p className="font-semibold text-neutral-800 text-sm">Select a Supplier</p>
              <p className="text-neutral-500 mt-1 max-w-xs">
                Inspect distributor ledgers, clear dues, and view past wholesale consignments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Pay Supplier</h3>
                <p className="text-[11px] text-neutral-500">{selectedSupplier.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1">Current Payable Amount:</label>
                <div className="text-lg font-bold font-mono text-rose-600">
                  {formatINR(selectedSupplier.amountPayable)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Amount to Pay (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-neutral-300 rounded-lg font-mono font-bold text-base focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Payment Method / Reference</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cheque No / RTGS Ref / Cash"
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl text-neutral-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Record Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-bold text-sm text-neutral-900">Add Wholesale Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Cash & Carry Wholesaler"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanjay Aggarwal"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Mobile / Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98110 22334"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="07AAACM9988D1Z2"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Address / Mandi Location</label>
                <input
                  type="text"
                  placeholder="Warehouse, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl text-neutral-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
