import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreProfile } from '../types';
import {
  Settings,
  Save,
  Globe,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Store,
  QrCode,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    language,
    setLanguage,
    resetDatabase,
    exportDatabaseJSON,
    importDatabaseJSON,
    t,
  } = useStore();

  const [formData, setFormData] = useState<StoreProfile>(storeProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KiranaOS_Store_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseJSON(content);
      if (res.success) {
        setImportSuccess(res.message);
        setImportError('');
        setTimeout(() => setImportSuccess(''), 4000);
      } else {
        setImportError(res.message);
        setImportSuccess('');
      }
    };
    reader.readAsText(file);
  };

  const handleResetFactory = () => {
    if (
      window.confirm(
        'Warning: This will reset all products, customers, suppliers, and sales to default initial seed data. Are you sure?'
      )
    ) {
      resetDatabase();
      alert('Database restored to initial state.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Store Configuration & Business Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Configure retail store headers, tax credentials, UPI ID for QR payments, and system backups
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Store profile settings saved successfully!</span>
        </div>
      )}

      {importSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{importSuccess}</span>
        </div>
      )}

      {importError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Store Profile Form (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Store className="w-4 h-4 text-indigo-600" />
            <span>Retail Store Identity & Tax Info (Printed on Thermal Bills)</span>
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Store / Shop Name *</label>
                <input
                  type="text"
                  required
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Owner / Proprietor Name</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Primary Store Phone *</label>
                <input
                  type="text"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-neutral-700 mb-1">Store Street Address *</label>
                <input
                  type="text"
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">State & Pincode</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-2 border border-neutral-300 rounded-lg"
                  />
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">FSSAI License No.</label>
                <input
                  type="text"
                  name="fssaiNumber"
                  value={formData.fssaiNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-neutral-700 mb-1">
                  UPI VPA ID (For Instant GPay/PhonePe Payment QR codes) *
                </label>
                <input
                  type="text"
                  required
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="merchant@okaxis or your-mobile@paytm"
                  className="w-full p-2 border border-neutral-300 rounded-lg font-mono font-bold text-indigo-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-neutral-700 mb-1">
                  Receipt Thermal Footer Message
                </label>
                <textarea
                  rows={2}
                  name="receiptFooterMessage"
                  value={formData.receiptFooterMessage}
                  onChange={handleChange}
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Store Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Language, Backup & Restore (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Language Selection Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Language / भाषा प्राथमिकता</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Select your preferred language interface for POS and inventory.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-lg font-semibold border transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`py-2 px-3 rounded-lg font-semibold border transition-colors cursor-pointer ${
                  language === 'hi'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Database Backup & Restore</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Download complete store snapshot (products, customers, udhaar, purchases) as JSON.
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={handleExport}
                className="w-full py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-neutral-600" />
                <span>Export Database JSON</span>
              </button>

              <label className="w-full py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-neutral-600" />
                <span>Restore Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone: Factory Reset */}
          <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-4 space-y-2">
            <h3 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Reset Demo Seed Data</span>
            </h3>
            <p className="text-[11px] text-rose-700">
              Restore the original 22 Indian grocery FMCG products, customers, and test invoices.
            </p>
            <button
              onClick={handleResetFactory}
              className="w-full py-2 px-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset to Factory Seed State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
