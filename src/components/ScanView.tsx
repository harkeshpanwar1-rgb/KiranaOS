import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { formatINR, formatDate, getStockStatus, generateQRCodeDataURL } from '../utils';
import {
  Scan,
  Camera,
  Search,
  ShoppingCart,
  PlusCircle,
  MinusCircle,
  Eye,
  History,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';

export const ScanView: React.FC = () => {
  const {
    products,
    findProductByCode,
    adjustStock,
    setActiveTab,
    auditLogs,
  } = useStore();

  const [scannedCode, setScannedCode] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showPrintLabelModal, setShowPrintLabelModal] = useState<boolean>(false);
  const [labelQrUrl, setLabelQrUrl] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize with the first product or low stock item for immediate review
  useEffect(() => {
    if (!activeProduct && products.length > 0) {
      setActiveProduct(products[0]);
      setScannedCode(products[0].barcode);
    }
  }, [products, activeProduct]);

  // Handle code search
  const handleCodeLookup = (code: string) => {
    setScannedCode(code);
    const found = findProductByCode(code);
    if (found) {
      setActiveProduct(found);
      setActionSuccessMessage(`Scanned: ${found.name}`);
      setTimeout(() => setActionSuccessMessage(''), 3000);
    } else {
      setActiveProduct(null);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('Camera access not granted or not supported in this frame. Use manual scanner or test barcode buttons below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Generate QR for shelf label when opening modal
  useEffect(() => {
    if (activeProduct && showPrintLabelModal) {
      const codeToRender = activeProduct.barcode || activeProduct.sku;
      generateQRCodeDataURL(codeToRender).then(setLabelQrUrl);
    }
  }, [activeProduct, showPrintLabelModal]);

  // Quick Stock Adjustment from Scanner
  const handleQuickStock = (type: 'add' | 'remove', qty: number) => {
    if (!activeProduct) return;
    const reason = type === 'add' ? 'manual_correction' : 'damaged';
    const res = adjustStock(
      activeProduct.id,
      qty,
      type,
      reason,
      `Quick adjustment via Scanner console (+${qty})`
    );
    if (res.success) {
      setActionSuccessMessage(res.message);
      // Refresh active product
      const updated = products.find((p) => p.id === activeProduct.id);
      if (updated) setActiveProduct(updated);
      setTimeout(() => setActionSuccessMessage(''), 3000);
    } else {
      alert(res.message);
    }
  };

  // Audit history for this product
  const productAuditHistory = auditLogs.filter(
    (log) => activeProduct && (log.details.includes(activeProduct.name) || log.details.includes(activeProduct.sku))
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Scan className="w-6 h-6 text-indigo-600" />
            <span>Barcode & QR Scanner Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Identify products, view current stock & MRP, perform instant stock adjustments, or print shelf labels
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Open Camera Scanner</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Grid: Scanner Input & Product Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera & Scanner Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Camera Viewport */}
          {cameraActive && (
            <div className="relative bg-neutral-900 rounded-2xl overflow-hidden aspect-4/3 border border-neutral-800 shadow-md">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-indigo-500/60 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-48 h-32 border-2 border-dashed border-emerald-400 rounded-lg animate-pulse"></div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-white/80 bg-black/60 py-1 rounded">
                Align barcode or QR code inside the box
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Barcode Search / Laser Gun Input */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
            <label className="block text-xs font-semibold text-neutral-800">
              Manual Barcode / QR Code Entry:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => handleCodeLookup(e.target.value)}
                  placeholder="Type or scan 890... barcode"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleCodeLookup(scannedCode)}
                className="px-3 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Scan
              </button>
            </div>
          </div>

          {/* Rapid Test Barcode Simulator */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800">
                Quick Test Retail Barcodes:
              </span>
              <span className="text-[10px] text-neutral-400">Click to simulate scan</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-100">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleCodeLookup(p.barcode)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    activeProduct?.id === p.id
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{p.barcode}</div>
                  </div>
                  <span className="font-mono text-xs shrink-0 font-bold">
                    {formatINR(p.sellingPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Identified Product Information & Quick Actions (7 cols) */}
        <div className="lg:col-span-7">
          {activeProduct ? (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden space-y-6 p-5">
              {/* Product Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      {activeProduct.brand}
                    </span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-xs text-neutral-500">{activeProduct.category}</span>
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">
                    {activeProduct.name}
                  </h2>
                  {activeProduct.hindiName && (
                    <p className="text-xs text-neutral-500 mt-0.5">{activeProduct.hindiName}</p>
                  )}
                </div>

                {/* Stock Status Badge */}
                <div>
                  {(() => {
                    const { label, color } = getStockStatus(activeProduct);
                    return (
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${color}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Product Data Matrix (Prompt items: Stock, Selling Price, MRP, Expiry Date) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Current Stock</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">
                    {activeProduct.currentStock} {activeProduct.unit}
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Min alert: {activeProduct.minStockLevel}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Selling Price (SP)</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-indigo-600">
                    {formatINR(activeProduct.sellingPrice)}
                  </div>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    Margin: {Math.round(((activeProduct.sellingPrice - activeProduct.purchasePrice) / activeProduct.sellingPrice) * 100)}%
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">MRP</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-neutral-700">
                    {formatINR(activeProduct.mrp)}
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Discount: ₹{activeProduct.mrp - activeProduct.sellingPrice}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Expiry Date</span>
                  <div className="text-sm font-bold font-mono text-neutral-900">
                    {formatDate(activeProduct.expiryDate)}
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-0.5 font-mono">
                    Batch: {activeProduct.batchNumber}
                  </span>
                </div>
              </div>

              {/* Codes & Supplier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs p-3 bg-neutral-50 rounded-xl border border-neutral-200 font-mono">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Barcode:</span>
                  <span className="font-semibold text-neutral-800">{activeProduct.barcode}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">SKU:</span>
                  <span className="font-semibold text-neutral-800">{activeProduct.sku}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Supplier:</span>
                  <span className="font-sans font-medium text-neutral-800 truncate block">
                    {activeProduct.supplierName}
                  </span>
                </div>
              </div>

              {/* Quick Actions (Prompt item 3: Add to Bill, Add Stock, Remove Stock, View Product, View History) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-800 block">
                  Quick Actions for this item:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Action 1: Add to Bill */}
                  <button
                    onClick={() => {
                      setActiveTab('pos');
                    }}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Bill</span>
                  </button>

                  {/* Action 2: Add Stock */}
                  <button
                    onClick={() => handleQuickStock('add', 5)}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>+5 Restock</span>
                  </button>

                  {/* Action 3: Remove Stock */}
                  <button
                    onClick={() => handleQuickStock('remove', 1)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <MinusCircle className="w-4 h-4 text-rose-600" />
                    <span>-1 Damaged</span>
                  </button>

                  {/* Action 4: View History */}
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4 text-neutral-600" />
                    <span>Audit Log</span>
                  </button>
                </div>

                {/* Printable Shelf Label button */}
                <button
                  onClick={() => setShowPrintLabelModal(true)}
                  className="w-full mt-2 py-2.5 px-4 bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-neutral-600" />
                  <span>Generate Printable Shelf Label / Price Tag</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-400 text-xs">
              <Scan className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-semibold text-neutral-700 text-sm">No product identified</p>
              <p className="text-neutral-500 mt-1 max-w-sm mx-auto">
                Scan any retail barcode or pick a sample product from the simulator list on the left to inspect its live stock & details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Printable Shelf Label Modal */}
      {showPrintLabelModal && activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <span className="font-bold text-sm text-neutral-900">Printable Shelf Label</span>
              <button
                onClick={() => setShowPrintLabelModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shelf Label Preview (Standard Indian Supermarket Price Tag) */}
            <div className="border-2 border-dashed border-neutral-300 p-4 rounded-xl bg-white text-center font-mono space-y-2">
              <div className="text-xs font-bold text-neutral-900 truncate">
                {activeProduct.name}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase">
                {activeProduct.brand} · SKU: {activeProduct.sku}
              </div>

              {/* Big Price */}
              <div className="py-1">
                <span className="text-2xl font-black text-neutral-900">
                  {formatINR(activeProduct.sellingPrice)}
                </span>
                {activeProduct.mrp > activeProduct.sellingPrice && (
                  <span className="text-xs text-neutral-400 line-through ml-2">
                    MRP: ₹{activeProduct.mrp}
                  </span>
                )}
              </div>

              {/* Barcode / QR display */}
              {labelQrUrl && (
                <div className="flex flex-col items-center justify-center pt-1">
                  <img src={labelQrUrl} alt="QR" className="w-24 h-24" />
                  <span className="text-[10px] text-neutral-600 font-mono tracking-widest mt-1">
                    {activeProduct.barcode}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPrintLabelModal(false)}
                className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-semibold text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div>
                <span className="font-bold text-sm text-neutral-900 block">Product Audit History</span>
                <span className="text-xs text-neutral-500">{activeProduct.name}</span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {productAuditHistory.length > 0 ? (
                productAuditHistory.map((log) => (
                  <div key={log.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                    <div className="flex justify-between text-neutral-500 text-[10px] font-mono">
                      <span>{log.userName} ({log.userRole})</span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="font-semibold text-neutral-800">{log.action}</div>
                    <div className="text-neutral-600">{log.details}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No specific audit events recorded yet for this item.
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
