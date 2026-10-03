import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Customer } from '../types';
import { formatINR, formatDate, createWhatsAppUrl } from '../utils';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  CreditCard,
  Share2,
  Receipt,
  X,
  ArrowRight,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, setActiveTab, storeProfile } = useStore();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q);
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and phone are required.');
      return;
    }

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Local Customer',
      creditLimit: Number(creditLimit),
    });

    setShowAddModal(false);
    setName('');
    setPhone('');
    setAddress('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Customer Directory & Khata Registry</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage regular grocery shoppers, residential addresses, and credit records
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone, or colony/flat..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-colors shadow-2xs"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mt-0.5">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span>{c.phone}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">Balance Due</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      c.outstandingBalance > 0 ? 'text-amber-700' : 'text-neutral-500'
                    }`}
                  >
                    {formatINR(c.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs text-neutral-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span className="truncate">{c.address}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-neutral-400 block">Lifetime Purchases</span>
                <span className="font-semibold text-neutral-800">{formatINR(c.totalPurchases)}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Credit Limit</span>
                <span className="font-semibold text-neutral-800">{formatINR(c.creditLimit)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const message = `Namaste ${c.name} ji,\nYour current outstanding balance at *${storeProfile.storeName}* is *₹${c.outstandingBalance}*.\nThank you!`;
                  window.open(createWhatsAppUrl(c.phone, message), '_blank');
                }}
                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => setActiveTab('udhaar')}
                className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Open Khata</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-400 text-xs">
          No matching customer accounts found.
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-bold text-sm text-neutral-900">Add Customer Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
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
                  placeholder="Flat No, Street, Colony"
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
                  onClick={() => setShowAddModal(false)}
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
