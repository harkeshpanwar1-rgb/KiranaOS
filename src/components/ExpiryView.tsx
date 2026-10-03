import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { formatINR, formatDate, getDaysUntilExpiry } from '../utils';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import {
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle2,
  Calendar,
  Filter,
  Trash2,
  Tag,
  Boxes,
} from 'lucide-react';

export const ExpiryView: React.FC = () => {
  const { products, updateProduct, suppliers } = useStore();

  const [activeTab, setActiveTabState] = useState<'expired' | '7days' | '30days'>('7days');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Group products by expiry
  const expiredItems = products.filter((p) => getDaysUntilExpiry(p.expiryDate) < 0);
  const expiring7Days = products.filter((p) => {
    const d = getDaysUntilExpiry(p.expiryDate);
    return d >= 0 && d <= 7;
  });
  const expiring30Days = products.filter((p) => {
    const d = getDaysUntilExpiry(p.expiryDate);
    return d > 7 && d <= 30;
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const currentList =
    activeTab === 'expired'
      ? expiredItems
      : activeTab === '7days'
      ? expiring7Days
      : expiring30Days;

  const filtered = currentList.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSup = selectedSupplier === 'All' || p.supplierId === selectedSupplier;
    return matchCat && matchSup;
  });

  // Apply clearance discount (e.g. 20% discount on selling price)
  const handleApplyClearanceDiscount = (p: Product) => {
    const newPrice = Math.round(p.sellingPrice * 0.8);
    updateProduct(p.id, { sellingPrice: newPrice });
    alert(`Clearance price updated for "${p.name}". New Selling Price: ₹${newPrice} (20% off).`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-rose-600" />
            <span>Expiry Management & Loss Prevention</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Monitor approaching expiration dates, write-off expired stock, or run clearance discounts
          </p>
        </div>
      </div>

      {/* Expiry Segmented Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Expired Tab */}
        <button
          onClick={() => setActiveTabState('expired')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'expired'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">⛔ Expired Stock</span>
            <Ban className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {expiredItems.length} Products
          </div>
          <p className="text-[11px] text-rose-700 mt-0.5">Immediate write-off required</p>
        </button>

        {/* 7 Days Tab */}
        <button
          onClick={() => setActiveTabState('7days')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === '7days'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">⚠️ Expiring in 7 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {expiring7Days.length} Products
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">Urgent clearance or return to supplier</p>
        </button>

        {/* 30 Days Tab */}
        <button
          onClick={() => setActiveTabState('30days')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === '30days'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">📅 Expiring in 30 Days</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {expiring30Days.length} Products
          </div>
          <p className="text-[11px] text-blue-700 mt-0.5">Upcoming batch rotations</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-neutral-500">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700 cursor-pointer"
        >
          <option value="All">All Categories</option>
          {categories.filter((c) => c !== 'All').map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="p-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700 cursor-pointer"
        >
          <option value="All">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <span className="ml-auto text-neutral-500 font-mono text-[11px]">
          Showing {filtered.length} products
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Batch & Supplier</th>
                <th className="py-3 px-3 text-center">Remaining Stock</th>
                <th className="py-3 px-3 text-right">At-Risk Value (₹)</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Days Remaining</th>
                <th className="py-3 px-4 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((product) => {
                const days = getDaysUntilExpiry(product.expiryDate);
                const atRiskVal = product.currentStock * product.purchasePrice;

                return (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900 max-w-[200px] truncate">
                      {product.name}
                    </td>
                    <td className="py-3 px-3 text-neutral-600">{product.category}</td>
                    <td className="py-3 px-3 text-[11px] text-neutral-500 font-mono">
                      <div>Batch: {product.batchNumber}</div>
                      <div className="text-neutral-400 font-sans">{product.supplierName}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {product.currentStock} {product.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatINR(atRiskVal)}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-neutral-800 whitespace-nowrap">
                      {formatDate(product.expiryDate)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {days < 0 ? (
                        <span className="text-rose-600">Expired {Math.abs(days)}d ago</span>
                      ) : (
                        <span className={days <= 7 ? 'text-amber-600' : 'text-neutral-700'}>
                          {days} days left
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {days >= 0 && (
                          <button
                            onClick={() => handleApplyClearanceDiscount(product)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            <span>Discount 20%</span>
                          </button>
                        )}
                        <button
                          onClick={() => setAdjustingProduct(product)}
                          className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Write-Off</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-neutral-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No products found in this expiry range.
            </div>
          )}
        </div>
      </div>

      {adjustingProduct && (
        <StockAdjustmentModal
          initialProduct={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
        />
      )}
    </div>
  );
};
