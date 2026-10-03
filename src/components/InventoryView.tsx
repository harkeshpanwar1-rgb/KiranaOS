import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { formatINR, formatDate, getStockStatus } from '../utils';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import {
  Boxes,
  AlertTriangle,
  PlusCircle,
  SlidersHorizontal,
  History,
  TrendingDown,
  ArrowRight,
  Search,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { products, stockAdjustments, setActiveTab } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'levels' | 'history'>('levels');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Metrics
  const totalPurchaseValue = products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
  const totalRetailValue = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStockLevel);
  const outOfStockItems = products.filter((p) => p.currentStock <= 0);

  const displayedProducts = products.filter((p) => {
    if (filterLowStockOnly && p.currentStock > p.minStockLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            <span>Inventory Valuation & Stock Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Monitor real-time warehouse counts, minimum stock alerts, and adjustment audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdjustingProduct(products[0])}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Stock Adjustment / Write-Off</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Stock Valuation (Cost)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatINR(totalPurchaseValue)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Purchase basis</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Stock Realization (Retail SP)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 mt-1 tabular-nums">
            {formatINR(totalRetailValue)}
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            Potential Profit: {formatINR(totalRetailValue - totalPurchaseValue)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium block">Total Warehouse Units</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {totalUnits.toLocaleString('en-IN')} Units
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">Across {products.length} SKUs</span>
        </div>

        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`p-4 rounded-xl border transition-colors cursor-pointer ${
            filterLowStockOnly
              ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400'
              : 'bg-white border-neutral-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-orange-800">Low & Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-orange-600 mt-1 tabular-nums">
            {lowStockItems.length} Items
          </div>
          <span className="text-[11px] text-orange-700 mt-0.5 block">
            {filterLowStockOnly ? 'Showing low stock only (Click to reset)' : 'Click to filter'}
          </span>
        </div>
      </div>

      {/* Tab bar: Stock Levels vs Adjustment History */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-1 text-xs">
        <button
          onClick={() => setActiveSubTab('levels')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'levels'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200'
          }`}
        >
          Active Stock Levels ({products.length})
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Adjustment Logs ({stockAdjustments.length})</span>
        </button>
      </div>

      {activeSubTab === 'levels' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter stock by name, SKU or barcode..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {filterLowStockOnly && (
              <button
                onClick={() => setFilterLowStockOnly(false)}
                className="text-xs text-orange-600 font-semibold px-2.5 py-1 bg-orange-50 rounded-lg hover:bg-orange-100"
              >
                Clear Low Stock Filter
              </button>
            )}
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Current Stock</th>
                    <th className="py-3 px-3 text-center">Min Alert</th>
                    <th className="py-3 px-3 text-right">Cost Value</th>
                    <th className="py-3 px-3 text-right">Retail Value</th>
                    <th className="py-3 px-3">Condition</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {displayedProducts.map((p) => {
                    const { status, label, color } = getStockStatus(p);
                    const costVal = p.currentStock * p.purchasePrice;
                    const retailVal = p.currentStock * p.sellingPrice;

                    return (
                      <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{p.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            {p.sku} · {p.barcode}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-neutral-600">{p.category}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">
                          <span
                            className={
                              p.currentStock <= 0
                                ? 'text-rose-600'
                                : p.currentStock <= p.minStockLevel
                                ? 'text-orange-600'
                                : 'text-neutral-900'
                            }
                          >
                            {p.currentStock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-500">
                          {p.minStockLevel} {p.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700">
                          {formatINR(costVal)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-neutral-900">
                          {formatINR(retailVal)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${color}`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setAdjustingProduct(p)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stock Adjustments History */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Audit Log of Stock Adjustments</h2>
              <p className="text-xs text-neutral-500">
                Mandatory tracking of damages, spoilage, corrections, and write-offs
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-center">Quantity</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-4">Audited Notes</th>
                  <th className="py-3 px-3">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stockAdjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 font-mono whitespace-nowrap">
                      {formatDate(adj.date)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-neutral-900">{adj.productName}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          adj.type === 'add'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {adj.type === 'add' ? '+ ADD' : '- DEDUCT'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{adj.quantity}</td>
                    <td className="py-3 px-3 capitalize text-neutral-700">
                      {adj.reason.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 max-w-xs truncate">{adj.notes}</td>
                    <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">{adj.staffName}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {stockAdjustments.length === 0 && (
              <div className="py-12 text-center text-neutral-400 text-xs">
                No manual adjustments recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {adjustingProduct && (
        <StockAdjustmentModal
          initialProduct={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
        />
      )}
    </div>
  );
};
