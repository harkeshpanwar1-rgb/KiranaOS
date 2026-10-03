import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Customer } from '../types';
import { formatINR, formatDate, createWhatsAppUrl } from '../utils';
import {
  CreditCard,
  Plus,
  Share2,
  Printer,
  Search,
  CheckCircle,
  AlertCircle,
  Receipt,
  UserCheck,
  X,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const UdhaarView: React.FC = () => {
  const { customers, recordCustomerPayment, addCustomer, storeProfile, t } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('Cash deposit towards ledger balance');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);

  const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const customersWithUdhaar = customers.filter((c) => c.outstandingBalance > 0);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q);
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    const res = recordCustomerPayment(selectedCustomer.id, paymentAmount, paymentNotes);
    if (res.success) {
      setShowPaymentModal(false);
      // Refresh current customer
      const updated = customers.find((c) => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
    } else {
      alert(res.message);
    }
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Customer Name and Phone are required.');
      return;
    }
    const created = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Local Customer',
      creditLimit: Number(creditLimit),
    });
    setSelectedCustomer(created);
    setShowAddCustomerModal(false);
    setName('');
    setPhone('');
    setAddress('');
  };

  // WhatsApp Reminder message
  const handleSendWhatsAppReminder = (c: Customer) => {
    const message = `Namaste ${c.name} ji,\nThis is a friendly reminder from *${storeProfile.storeName}*.\nYour current outstanding Udhaar balance is *₹${c.outstandingBalance}*.\nKindly clear it at your earliest convenience via Cash or UPI at ${storeProfile.upiId}.\nThank you!\n-${storeProfile.storeName} (${storeProfile.phone})`;
    const url = createWhatsAppUrl(c.phone, message);
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-600" />
            <span>Udhaar (Customer Credit) & Khata Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Track customer balances, log cash/UPI deposits, and send WhatsApp payment reminders
          </p>
        </div>

        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer Account</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Outstanding Udhaar</span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {formatINR(totalOutstanding)}
          </div>
          <span className="text-[11px] text-amber-800 mt-0.5 block">
            Across {customersWithUdhaar.length} credit accounts
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Lifetime Credit Given</span>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatINR(customers.reduce((a, b) => a + b.totalPurchases, 0))}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Lifetime retail purchases</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Credit Recovered / Paid</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {formatINR(customers.reduce((a, b) => a + b.totalPaid, 0))}
          </div>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Settled via Cash & UPI</span>
        </div>
      </div>

      {/* Grid: Customers List & Detailed Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer by name or phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-3 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-amber-50/70 border-l-4 border-amber-600' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-neutral-900 truncate">{c.name}</div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{c.phone}</div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">{c.address}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold text-xs sm:text-sm ${
                        c.outstandingBalance > 0 ? 'text-amber-700' : 'text-neutral-400'
                      }`}
                    >
                      {formatINR(c.outstandingBalance)}
                    </div>
                    {c.outstandingBalance > 0 && (
                      <span className="text-[10px] text-amber-700 font-medium block">Due</span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-xs text-neutral-400">
                No matching customer accounts found.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Ledger View (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col h-[600px]">
              {/* Ledger Header */}
              <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">{selectedCustomer.name}</h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Phone: {selectedCustomer.phone} · {selectedCustomer.address}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendWhatsAppReminder(selectedCustomer)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp Reminder</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentAmount(selectedCustomer.outstandingBalance);
                      setShowPaymentModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>+ Record Payment</span>
                  </button>
                </div>
              </div>

              {/* Outstanding Highlight Card */}
              <div className="p-4 bg-amber-50/50 border-b border-neutral-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Outstanding Due</span>
                  <span className="text-2xl font-bold font-mono text-amber-700">
                    {formatINR(selectedCustomer.outstandingBalance)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-neutral-500 font-mono">
                  <div>Credit Limit: {formatINR(selectedCustomer.creditLimit)}</div>
                  <div>Total Settled: {formatINR(selectedCustomer.totalPaid)}</div>
                </div>
              </div>

              {/* Transactions / Ledger Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Ref / Bill No.</th>
                      <th className="py-2.5 px-3 text-right">Debit (+)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-)</th>
                      <th className="py-2.5 px-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedCustomer.ledger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-neutral-600 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              entry.type === 'debit'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {entry.type === 'debit' ? 'PURCHASE' : 'PAYMENT'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          <div>{entry.referenceId}</div>
                          {entry.notes && (
                            <div className="text-[10px] text-neutral-400 font-sans">{entry.notes}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold">
                          {entry.type === 'debit' ? `+${formatINR(entry.amount)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                          {entry.type === 'credit' ? `-${formatINR(entry.amount)}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-neutral-900">
                          {formatINR(entry.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {selectedCustomer.ledger.length === 0 && (
                  <div className="py-16 text-center text-neutral-400 text-xs">
                    No ledger entries yet for this customer.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-400 text-xs flex flex-col items-center justify-center h-[600px]">
              <UserCheck className="w-12 h-12 text-neutral-300 mb-2 stroke-1" />
              <p className="font-semibold text-neutral-800 text-sm">Select a Customer Account</p>
              <p className="text-neutral-500 mt-1 max-w-xs">
                Click any customer on the left to inspect their Khata ledger statement, record deposits, or send payment reminders.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Record Customer Payment</h3>
                <p className="text-[11px] text-neutral-500">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1">Current Balance Due:</label>
                <div className="text-lg font-bold font-mono text-amber-700">
                  {formatINR(selectedCustomer.outstandingBalance)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Amount Received (₹) *
                </label>
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
                <label className="block font-semibold text-neutral-700 mb-1">Payment Mode / Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cash payment or GPay reference"
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
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Record Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-bold text-sm text-neutral-900">Create Customer Profile</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Bhai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="Street / Shop / Colony"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="500"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-xl text-neutral-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
