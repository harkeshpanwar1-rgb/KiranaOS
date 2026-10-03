import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CartItem, PaymentMethod, SplitPayment, Customer } from '../types';
import { formatINR, generateQRCodeDataURL, generateUPIString } from '../utils';
import { ReceiptModal } from './ReceiptModal';
import {
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  ArrowRight,
  UserCheck,
  UserPlus,
  AlertCircle,
  Sparkles,
  Printer,
  X,
} from 'lucide-react';

export const POSView: React.FC = () => {
  const {
    t,
    products,
    customers,
    createSale,
    addCustomer,
    storeProfile,
    setActiveTab,
  } = useStore();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [splitDetails, setSplitDetails] = useState<SplitPayment>({
    cash: 0,
    upi: 0,
    card: 0,
    udhaar: 0,
  });
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');

  // Completed Receipt Modal State
  const [completedTx, setCompletedTx] = useState<any>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount and on 'F2'
  useEffect(() => {
    barcodeInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
      p.barcode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Add product to cart
  const addToCart = (product: Product, qty: number = 1) => {
    if (product.currentStock <= 0) {
      alert(`Cannot add "${product.name}". Product is currently Out of Stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + qty;
        if (nextQty > product.currentStock) {
          alert(`Only ${product.currentStock} ${product.unit} available in stock!`);
          return prev;
        }
        const lineTotal = nextQty * existing.sellingPrice;
        const taxRate = existing.product.gstRate || 0;
        const taxAmount = (lineTotal * taxRate) / (100 + taxRate);

        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: nextQty, total: lineTotal, taxAmount }
            : item
        );
      } else {
        const lineTotal = qty * product.sellingPrice;
        const taxRate = product.gstRate || 0;
        const taxAmount = (lineTotal * taxRate) / (100 + taxRate);

        return [
          ...prev,
          {
            product,
            quantity: qty,
            sellingPrice: product.sellingPrice,
            discount: Math.max(0, product.mrp - product.sellingPrice),
            taxAmount,
            total: lineTotal,
          },
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (newQty > prod.currentStock) {
      alert(`Only ${prod.currentStock} ${prod.unit} available in inventory.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const lineTotal = newQty * item.sellingPrice;
          const taxRate = item.product.gstRate || 0;
          const taxAmount = (lineTotal * taxRate) / (100 + taxRate);
          return {
            ...item,
            quantity: newQty,
            total: lineTotal,
            taxAmount,
          };
        }
        return item;
      })
    );
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Quick Barcode Keypress submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check exact match
    const clean = searchQuery.trim().toLowerCase();
    const exact = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        (p.qrCode && p.qrCode.toLowerCase() === clean) ||
        p.name.toLowerCase() === clean
    );

    if (exact) {
      addToCart(exact, 1);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0], 1);
      setSearchQuery('');
    }
  };

  // Calculate cart summaries
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const totalMrp = cart.reduce((acc, item) => acc + item.product.mrp * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - subtotal);
  const totalTax = cart.reduce((acc, item) => acc + item.taxAmount, 0);
  const grandTotal = Math.round(subtotal);

  // Generate UPI QR when opening payment modal or method is UPI
  useEffect(() => {
    if (showPaymentModal && grandTotal > 0) {
      const note = `Bill payment at ${storeProfile.storeName}`;
      const upiUrl = generateUPIString(storeProfile.upiId, storeProfile.storeName, grandTotal, note);
      generateQRCodeDataURL(upiUrl).then(setUpiQrUrl);
      setCashReceived(grandTotal.toString());
      setSplitDetails({ cash: grandTotal, upi: 0, card: 0, udhaar: 0 });
    }
  }, [showPaymentModal, grandTotal, storeProfile]);

  // Handle final checkout
  const handleCheckout = () => {
    setPaymentError('');

    if (cart.length === 0) {
      setPaymentError('Cart is empty!');
      return;
    }

    if (paymentMethod === 'udhaar' && !selectedCustomer) {
      setPaymentError('Please select or add a Customer for Udhaar (Credit) billing!');
      return;
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < grandTotal) {
        setPaymentError(`Cash received must be at least ${formatINR(grandTotal)}`);
        return;
      }
    }

    if (paymentMethod === 'split') {
      const sum = (splitDetails.cash || 0) + (splitDetails.upi || 0) + (splitDetails.card || 0) + (splitDetails.udhaar || 0);
      if (Math.round(sum) !== grandTotal) {
        setPaymentError(`Split sum (${formatINR(sum)}) does not equal Grand Total (${formatINR(grandTotal)})`);
        return;
      }
      if (splitDetails.udhaar > 0 && !selectedCustomer) {
        setPaymentError('Customer is required when Split Payment includes Udhaar.');
        return;
      }
    }

    const res = createSale({
      items: cart,
      paymentMethod,
      splitPayment: paymentMethod === 'split' ? splitDetails : undefined,
      customerId: selectedCustomer?.id,
      notes: paymentMethod === 'udhaar' ? `Udhaar issued to ${selectedCustomer?.name}` : undefined,
    });

    if (res.success && res.transaction) {
      setCompletedTx(res.transaction);
      setCart([]);
      setShowPaymentModal(false);
      setSelectedCustomer(null);
    } else {
      setPaymentError(res.message);
    }
  };

  // Add new customer inline
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      alert('Customer Name and Phone are required.');
      return;
    }
    const created = addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      address: newCustomerAddress.trim() || 'Local Area',
      creditLimit: 5000,
    });
    setSelectedCustomer(created);
    setShowNewCustomerModal(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
  };

  const parsedCash = parseFloat(cashReceived) || 0;
  const changeDue = Math.max(0, parsedCash - grandTotal);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden bg-neutral-100">
      {/* Left Column: Product Selection & Catalog (60% width on Desktop) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-neutral-200">
        {/* Search & Barcode Header */}
        <div className="p-3 sm:p-4 border-b border-neutral-200 bg-neutral-50/60 space-y-3">
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode (EAN-13/QR) or type item name, SKU (F2)..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            >
              Add Item
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              title="Open Camera Scanner"
              className="p-2 border border-neutral-300 bg-white rounded-lg text-neutral-700 hover:text-indigo-600 hover:border-indigo-500 transition-colors shrink-0 cursor-pointer"
            >
              <Scan className="w-5 h-5" />
            </button>
          </form>

          {/* Category Tabs (Segmented interactive buttons as allowed in skill) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isLowStock = product.currentStock <= product.minStockLevel && product.currentStock > 0;
              const isOutOfStock = product.currentStock <= 0;
              const cartItem = cart.find((item) => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, 1)}
                  className={`flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none bg-white relative ${
                    isOutOfStock
                      ? 'opacity-60 border-neutral-200 bg-neutral-50 cursor-not-allowed'
                      : 'border-neutral-200 hover:border-indigo-400 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Brand and Stock count */}
                    <div className="flex items-center justify-between text-[11px] mb-1 text-neutral-500">
                      <span className="font-medium text-neutral-600 truncate">{product.brand}</span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-orange-600'
                            : 'text-neutral-500'
                        }`}
                      >
                        {isOutOfStock ? '0 in stock' : `${product.currentStock} ${product.unit}`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-xs font-semibold text-neutral-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-bold font-mono text-neutral-900">
                        {formatINR(product.sellingPrice)}
                      </div>
                      {product.mrp > product.sellingPrice && (
                        <div className="text-[10px] text-neutral-400 line-through font-mono">
                          MRP: ₹{product.mrp}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      {cartItem ? (
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shadow-xs">
                          {cartItem.quantity}
                        </span>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-neutral-100 group-hover:bg-indigo-50 text-neutral-600 flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-16 text-center text-neutral-400 text-xs">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              No matching products found. Try scanning barcode or clear filters.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Bill & Cart Summary (40% width on Desktop) */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-neutral-200 h-full">
        {/* Cart Header: Customer Selection */}
        <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex-1 mr-2">
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-neutral-900 truncate">
                    {selectedCustomer.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    ({selectedCustomer.phone.slice(-5)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-neutral-400 hover:text-rose-500 ml-1 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  value=""
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c) setSelectedCustomer(c);
                  }}
                  className="w-full text-xs py-1.5 px-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">Select Customer (for Udhaar/Bill)...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Udhaar: ₹{c.outstandingBalance}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(true)}
                  title="Add New Customer"
                  className="p-1.5 bg-white border border-neutral-300 hover:border-indigo-500 rounded-lg text-neutral-600 hover:text-indigo-600 transition-colors shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium whitespace-nowrap p-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-neutral-100">
          {cart.map((item) => (
            <div key={item.product.id} className="py-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-neutral-900 truncate">
                  {item.product.name}
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5 font-mono tabular-nums">
                  <span>₹{item.sellingPrice} / {item.product.unit}</span>
                  {item.discount > 0 && (
                    <span className="text-emerald-600">Saved ₹{item.discount * item.quantity}</span>
                  )}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white text-neutral-700 hover:bg-neutral-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="w-7 text-center font-mono font-bold text-xs text-neutral-900">
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white text-neutral-700 hover:bg-neutral-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Item Line Total */}
              <div className="text-right min-w-[60px] shrink-0 font-mono">
                <div className="font-bold text-neutral-900 text-xs sm:text-sm">
                  {formatINR(item.total)}
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-neutral-400 hover:text-rose-500 text-[10px]"
                >
                  <Trash2 className="w-3 h-3 ml-auto mt-0.5" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center text-neutral-400 text-xs">
              <ShoppingCart className="w-10 h-10 text-neutral-300 mb-2 stroke-1" />
              <p className="font-medium text-neutral-700">{t('cartEmpty')}</p>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-[220px]">
                Click items on the left or scan product barcodes to begin billing.
              </p>
            </div>
          )}
        </div>

        {/* Cart Calculation & Checkout Area */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/80 space-y-2">
          {/* Summary Lines */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>{t('subtotal')} ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
            </div>

            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Customer Savings</span>
                <span className="font-mono tabular-nums">- {formatINR(totalSavings)}</span>
              </div>
            )}

            {totalTax > 0 && (
              <div className="flex justify-between text-neutral-500 text-[11px]">
                <span>Tax Breakdown (GST)</span>
                <span className="font-mono tabular-nums">{formatINR(totalTax, true)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 text-neutral-900">
              <span className="text-sm font-bold">{t('grandTotal')}</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 tabular-nums">
                {formatINR(grandTotal)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              cart.length === 0
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <span>{t('payAndPrint')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Complete Payment</h3>
                <p className="text-xs text-neutral-400">Total Due: {formatINR(grandTotal)}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Payment Method Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-colors cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-2xs'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash (नकद)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-colors cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-colors cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card / POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('udhaar')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-colors cursor-pointer ${
                      paymentMethod === 'udhaar'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-2xs'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Udhaar (उधार)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('split')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-colors cursor-pointer ${
                      paymentMethod === 'split'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-2xs'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Split</span>
                  </button>
                </div>
              </div>

              {/* Conditional Method Inputs */}
              {paymentMethod === 'cash' && (
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800">
                      Cash Received from Customer:
                    </label>
                    <div className="flex gap-1.5">
                      {[100, 200, 500, 2000].map((note) => (
                        <button
                          key={note}
                          type="button"
                          onClick={() => setCashReceived(note.toString())}
                          className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white border border-neutral-300 rounded hover:bg-neutral-100 cursor-pointer"
                        >
                          +₹{note}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 text-base font-bold font-mono bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-neutral-200 text-xs">
                    <span className="text-neutral-600">Change Due to Customer:</span>
                    <span className="text-base font-bold font-mono text-emerald-600">
                      {formatINR(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-center space-y-3">
                  <div className="text-xs text-neutral-700 font-semibold">
                    Scan using Google Pay, PhonePe, Paytm, or BHIM
                  </div>
                  {upiQrUrl && (
                    <div className="flex justify-center">
                      <img
                        src={upiQrUrl}
                        alt="UPI QR Code"
                        className="w-44 h-44 p-2 bg-white rounded-xl border border-neutral-300 shadow-sm"
                      />
                    </div>
                  )}
                  <div className="text-xs font-mono text-neutral-600">
                    UPI ID: <span className="font-semibold text-neutral-900">{storeProfile.upiId}</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'udhaar' && (
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Customer Credit / Khata Transaction</span>
                  </div>

                  {selectedCustomer ? (
                    <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-neutral-900">
                        <span>{selectedCustomer.name}</span>
                        <span className="text-neutral-500 font-mono">{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>Current Outstanding:</span>
                        <span className="font-mono text-amber-700 font-bold">
                          {formatINR(selectedCustomer.outstandingBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-600 pt-1 border-t border-neutral-100">
                        <span>New Balance after this Bill:</span>
                        <span className="font-mono text-rose-600 font-bold">
                          {formatINR(selectedCustomer.outstandingBalance + grandTotal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-900">
                      Please select a customer from the top bar or create a new profile below to issue Udhaar.
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'split' && (
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-600">Cash Amount (₹):</label>
                      <input
                        type="number"
                        value={splitDetails.cash || ''}
                        onChange={(e) =>
                          setSplitDetails((prev) => ({ ...prev, cash: parseFloat(e.target.value) || 0 }))
                        }
                        className="w-full p-2 bg-white border rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-600">UPI Amount (₹):</label>
                      <input
                        type="number"
                        value={splitDetails.upi || ''}
                        onChange={(e) =>
                          setSplitDetails((prev) => ({ ...prev, upi: parseFloat(e.target.value) || 0 }))
                        }
                        className="w-full p-2 bg-white border rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-600">Card Amount (₹):</label>
                      <input
                        type="number"
                        value={splitDetails.card || ''}
                        onChange={(e) =>
                          setSplitDetails((prev) => ({ ...prev, card: parseFloat(e.target.value) || 0 }))
                        }
                        className="w-full p-2 bg-white border rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-600">Udhaar Amount (₹):</label>
                      <input
                        type="number"
                        value={splitDetails.udhaar || ''}
                        onChange={(e) =>
                          setSplitDetails((prev) => ({ ...prev, udhaar: parseFloat(e.target.value) || 0 }))
                        }
                        className="w-full p-2 bg-white border rounded font-mono"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-between font-mono font-bold text-xs">
                    <span>Total Split:</span>
                    <span>
                      {formatINR(
                        (splitDetails.cash || 0) +
                          (splitDetails.upi || 0) +
                          (splitDetails.card || 0) +
                          (splitDetails.udhaar || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="flex-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Confirm & Print Bill (Enter)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in">
            <h3 className="font-bold text-sm text-neutral-900 mb-3">Add Customer Profile</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="Flat No, Street, Colony"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="flex-1 py-2 bg-neutral-100 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Sale Receipt Modal */}
      {completedTx && (
        <ReceiptModal
          transaction={completedTx}
          storeProfile={storeProfile}
          onClose={() => setCompletedTx(null)}
        />
      )}
    </div>
  );
};
