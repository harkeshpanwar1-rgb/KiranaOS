import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, AdjustmentReason } from '../types';
import { X, AlertTriangle, Check } from 'lucide-react';

interface StockAdjustmentModalProps {
  initialProduct?: Product | null;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  initialProduct,
  onClose,
}) => {
  const { products, adjustStock, currentUser } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  const [type, setType] = useState<'add' | 'remove'>('remove');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<AdjustmentReason>('damaged');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const targetProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetProduct) {
      setErrorMsg('Please select a product.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }
    if (type === 'remove' && targetProduct.currentStock < quantity) {
      setErrorMsg(`Cannot remove ${quantity}. Current stock is only ${targetProduct.currentStock}.`);
      return;
    }
    if (!notes.trim()) {
      setErrorMsg('Please provide a mandatory explanation note for audit compliance.');
      return;
    }

    const res = adjustStock(selectedProductId, quantity, type, reason, notes.trim());
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const reasons: { value: AdjustmentReason; label: string }[] = [
    { value: 'damaged', label: 'Damaged during transit / handling (टूटा-फूटा)' },
    { value: 'expired', label: 'Expired stock write-off (एक्सपायर माल)' },
    { value: 'spoiled', label: 'Spoiled / Wet / Rat bite (खराब / चूहे द्वारा)' },
    { value: 'lost', label: 'Lost / Inventory Discrepancy (गायब / गिनती में कमी)' },
    { value: 'returned_to_supplier', label: 'Returned to Supplier (सप्लायर को वापस)' },
    { value: 'manual_correction', label: 'Manual Correction / Audit count (फिजिकल गिनती सुधार)' },
    { value: 'other', label: 'Other Reason (अन्य)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <div>
            <h3 className="font-bold text-sm text-neutral-900">Stock Adjustment & Write-off</h3>
            <p className="text-[11px] text-neutral-500">
              Audit recorded under {currentUser.name} ({currentUser.role})
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Product selector */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Type: Add or Remove */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Adjustment Action *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('remove')}
                className={`py-2 px-3 rounded-lg font-semibold border text-center transition-colors ${
                  type === 'remove'
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                - Deduct / Write Off
              </button>
              <button
                type="button"
                onClick={() => setType('add')}
                className={`py-2 px-3 rounded-lg font-semibold border text-center transition-colors ${
                  type === 'add'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                + Add / Stock Found
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-neutral-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Current Stock:</label>
              <div className="p-2 bg-neutral-100 rounded-lg font-mono font-semibold text-neutral-800">
                {targetProduct?.currentStock} {targetProduct?.unit}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Reason for Adjustment *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50"
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Audit Notes */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Audit Notes & Explanation *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Found leaking oil packet on shelf, batch expired, or physical count discrepancy"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-lg"
            ></textarea>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Record Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
