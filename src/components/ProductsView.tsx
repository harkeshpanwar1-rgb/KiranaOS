import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { formatINR, formatDate, getStockStatus } from '../utils';
import { ProductModal } from './ProductModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertTriangle,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, deleteProduct, t } = useStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'sp' | 'value' | 'expiry'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering
  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);

    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;

    const { status } = getStockStatus(p);
    const matchStatus =
      stockStatusFilter === 'All' ||
      (stockStatusFilter === 'in_stock' && status === 'in_stock') ||
      (stockStatusFilter === 'low_stock' && status === 'low_stock') ||
      (stockStatusFilter === 'out_of_stock' && status === 'out_of_stock') ||
      (stockStatusFilter === 'expiring_soon' && status === 'expiring_soon') ||
      (stockStatusFilter === 'expired' && status === 'expired');

    return matchSearch && matchCat && matchStatus;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'stock') cmp = a.currentStock - b.currentStock;
    else if (sortBy === 'sp') cmp = a.sellingPrice - b.sellingPrice;
    else if (sortBy === 'value')
      cmp = a.currentStock * a.purchasePrice - b.currentStock * b.purchasePrice;
    else if (sortBy === 'expiry') cmp = a.expiryDate.localeCompare(b.expiryDate);

    return sortAsc ? cmp : -cmp;
  });

  // Pagination slice
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from inventory catalog?`)) {
      const res = deleteProduct(id);
      if (!res.success) alert(res.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Product Catalog & Inventory Master</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            {products.length} registered products · Filter by category, barcode, stock status, and expiry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, brand, SKU, barcode..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Stock Statuses</option>
              <option value="in_stock">🟢 In Stock</option>
              <option value="low_stock">🟠 Low Stock (Restock)</option>
              <option value="out_of_stock">🔴 Out of Stock</option>
              <option value="expiring_soon">⚠️ Expiring Soon (30d)</option>
              <option value="expired">⛔ Expired</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock Qty</option>
              <option value="sp">Sort by Selling Price</option>
              <option value="value">Sort by Stock Value</option>
              <option value="expiry">Sort by Expiry Date</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              title="Toggle sort direction"
              className="p-2 border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Table (Prompt items: Product image, name, brand, category, SKU, barcode, stock, unit, purchase price, MRP, selling price, stock value, expiry, status) */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Product & Brand</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">SKU / Barcode</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-right">Purchase (₹)</th>
                <th className="py-3 px-3 text-right">MRP (₹)</th>
                <th className="py-3 px-3 text-right">Selling (₹)</th>
                <th className="py-3 px-3 text-right">Stock Value (₹)</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginated.map((product) => {
                const { status, label, color } = getStockStatus(product);
                const stockVal = product.currentStock * product.purchasePrice;

                return (
                  <tr key={product.id} className="hover:bg-neutral-50/80 transition-colors">
                    {/* Name & Brand */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="font-semibold text-neutral-900 leading-snug">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-neutral-600">{product.brand}</span>
                        {product.hindiName && (
                          <>
                            <span className="text-neutral-300">·</span>
                            <span className="text-neutral-400">{product.hindiName}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                      {product.category}
                    </td>

                    {/* SKU & Barcode */}
                    <td className="py-3 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      <div>{product.sku}</div>
                      <div className="text-neutral-400">{product.barcode}</div>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums">
                      <span
                        className={`font-bold ${
                          product.currentStock <= 0
                            ? 'text-rose-600'
                            : product.currentStock <= product.minStockLevel
                            ? 'text-orange-600'
                            : 'text-neutral-900'
                        }`}
                      >
                        {product.currentStock} {product.unit}
                      </span>
                    </td>

                    {/* Purchase Price */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-600">
                      ₹{product.purchasePrice}
                    </td>

                    {/* MRP */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-500">
                      ₹{product.mrp}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-indigo-600">
                      ₹{product.sellingPrice}
                    </td>

                    {/* Total Stock Value */}
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-neutral-900">
                      {formatINR(stockVal)}
                    </td>

                    {/* Expiry Date */}
                    <td className="py-3 px-3 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                      {formatDate(product.expiryDate)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${color}`}>
                        {label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingProduct(product)}
                          title="Edit Product"
                          className="p-1 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          title="Delete Product"
                          className="p-1 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginated.length === 0 && (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No products found matching filters.
            </div>
          )}
        </div>

        {/* Pagination footer */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} products
          </div>
          <div className="flex items-center gap-1 font-mono">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-2.5 py-1 bg-white border border-neutral-200 rounded disabled:opacity-40 hover:bg-neutral-100 cursor-pointer"
            >
              Prev
            </button>
            <span className="px-2 font-bold text-neutral-800">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2.5 py-1 bg-white border border-neutral-200 rounded disabled:opacity-40 hover:bg-neutral-100 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};
