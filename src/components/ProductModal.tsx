import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, ProductUnit } from '../types';
import { generateQRCodeDataURL } from '../utils';
import { X, Sparkles, AlertCircle, Check } from 'lucide-react';

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved?: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onSaved,
}) => {
  const { suppliers, addProduct, updateProduct } = useStore();

  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [hindiName, setHindiName] = useState(product?.hindiName || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [category, setCategory] = useState(product?.category || 'Atta & Flour');
  const [sku, setSku] = useState(product?.sku || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit || 'packet');
  const [currentStock, setCurrentStock] = useState<number>(product?.currentStock ?? 10);
  const [minStockLevel, setMinStockLevel] = useState<number>(product?.minStockLevel ?? 5);
  const [purchasePrice, setPurchasePrice] = useState<number>(product?.purchasePrice ?? 50);
  const [mrp, setMrp] = useState<number>(product?.mrp ?? 70);
  const [sellingPrice, setSellingPrice] = useState<number>(product?.sellingPrice ?? 65);
  const [gstRate, setGstRate] = useState<number>(product?.gstRate ?? 5);
  const [expiryDate, setExpiryDate] = useState<string>(product?.expiryDate || '2027-06-30');
  const [batchNumber, setBatchNumber] = useState<string>(product?.batchNumber || 'BAT-2026-01');
  const [supplierId, setSupplierId] = useState<string>(
    product?.supplierId || (suppliers[0]?.id ?? '')
  );

  const [errorMsg, setErrorMsg] = useState('');
  const [qrPreview, setQrPreview] = useState('');

  // Auto generate SKU and Barcode if empty
  const generateSkuAndBarcode = () => {
    const cleanBrand = (brand || 'GEN').substring(0, 3).toUpperCase();
    const cleanCat = (category || 'ITM').substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newSku = `${cleanCat}-${cleanBrand}-${randomSuffix}`;
    const newBarcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    setSku(newSku);
    setBarcode(newBarcode);
  };

  useEffect(() => {
    if (!isEditing && (!sku || !barcode)) {
      generateSkuAndBarcode();
    }
  }, [category, brand]);

  // Update QR preview
  useEffect(() => {
    const code = barcode || sku || name;
    if (code) {
      generateQRCodeDataURL(code).then(setQrPreview);
    }
  }, [barcode, sku, name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    if (!brand.trim()) {
      setErrorMsg('Brand name is required.');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('SKU code is required.');
      return;
    }
    if (!barcode.trim()) {
      setErrorMsg('Barcode is required.');
      return;
    }
    if (sellingPrice < purchasePrice) {
      if (!window.confirm('Selling Price is lower than Purchase Price! Do you want to proceed with a negative margin?')) {
        return;
      }
    }
    if (sellingPrice > mrp) {
      setErrorMsg('Selling Price cannot exceed MRP (Indian legal requirement).');
      return;
    }

    const matchedSupplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = matchedSupplier?.name || 'Local Direct';

    if (isEditing && product) {
      const res = updateProduct(product.id, {
        name: name.trim(),
        hindiName: hindiName.trim() || undefined,
        brand: brand.trim(),
        category,
        sku: sku.trim(),
        barcode: barcode.trim(),
        unit,
        currentStock: Number(currentStock),
        minStockLevel: Number(minStockLevel),
        purchasePrice: Number(purchasePrice),
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        gstRate: Number(gstRate),
        expiryDate,
        batchNumber: batchNumber.trim(),
        supplierId,
        supplierName,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = addProduct({
        name: name.trim(),
        hindiName: hindiName.trim() || undefined,
        brand: brand.trim(),
        category,
        sku: sku.trim(),
        barcode: barcode.trim(),
        qrCode: `KOS-${sku.trim()}`,
        unit,
        currentStock: Number(currentStock),
        minStockLevel: Number(minStockLevel),
        purchasePrice: Number(purchasePrice),
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        gstRate: Number(gstRate),
        expiryDate,
        batchNumber: batchNumber.trim(),
        supplierId,
        supplierName,
      });

      if (res.success && res.product) {
        if (onSaved) onSaved(res.product);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const categories = [
    'Atta & Flour',
    'Dal & Pulses',
    'Rice & Grains',
    'Oil & Ghee',
    'Masala & Spices',
    'Dairy & Bakery',
    'Snacks & Biscuits',
    'Beverages & Tea',
    'Personal Care',
    'Household & Cleaning',
  ];

  const units: ProductUnit[] = ['packet', 'kg', 'g', 'L', 'ml', 'piece', 'box', 'bag'];
  const gstSlabs = [0, 5, 12, 18, 28];

  const marginPct =
    sellingPrice > 0 ? Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">
              {isEditing ? 'Edit Product Details' : 'Add New Inventory Product'}
            </h3>
            <p className="text-xs text-neutral-400">
              Indian Retail POS & FMCG compliant catalog entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 mb-1">
                Product Name (English) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tata Tea Gold 500g"
                className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 mb-1">
                Product Name in Hindi (वैकल्पिक हिन्दी नाम)
              </label>
              <input
                type="text"
                value={hindiName}
                onChange={(e) => setHindiName(e.target.value)}
                placeholder="उदा. टाटा टी गोल्ड 500 ग्रा"
                className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Brand *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Tata, Amul, Parle"
                className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Codes & QR */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800">Barcode & SKU Management</span>
              <button
                type="button"
                onClick={generateSkuAndBarcode}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Generate Codes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 mb-1">SKU / Item Code *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Barcode (EAN-13) *</label>
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono"
                />
              </div>
            </div>

            {qrPreview && (
              <div className="flex items-center gap-3 pt-1">
                <img src={qrPreview} alt="QR" className="w-12 h-12 p-0.5 bg-white border rounded" />
                <span className="text-[11px] text-neutral-500">
                  Ready for scanning & shelf price tags.
                </span>
              </div>
            )}
          </div>

          {/* Section: Pricing & Margins */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Purchase Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono font-bold text-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">MRP (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={mrp}
                onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">GST Slab</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseInt(e.target.value))}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
              >
                {gstSlabs.map((s) => (
                  <option key={s} value={s}>
                    {s}% GST
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 bg-neutral-100 p-2 rounded-lg flex items-center justify-between font-mono">
            <span>Calculated Gross Margin:</span>
            <span className={`font-bold ${marginPct >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {marginPct}% (Profit ₹{sellingPrice - purchasePrice} / unit)
            </span>
          </div>

          {/* Section: Stock Levels & Units */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full p-2 border border-neutral-300 rounded-lg cursor-pointer"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Opening Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Min Alert Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Section: Expiry, Batch & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Batch Number</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. BAT-901"
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-lg cursor-pointer"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Update Product' : 'Add to Inventory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
