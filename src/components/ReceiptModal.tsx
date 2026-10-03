import React, { useEffect, useState } from 'react';
import { Transaction, StoreProfile } from '../types';
import { formatINR, formatDateTime, generateQRCodeDataURL, createWhatsAppUrl } from '../utils';
import { Printer, Share2, X, CheckCircle, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptModalProps {
  transaction: Transaction;
  storeProfile: StoreProfile;
  onClose: () => void;
  triggerConfetti?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  storeProfile,
  onClose,
  triggerConfetti = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (triggerConfetti) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    const payload = `Bill: ${transaction.billNumber}\nStore: ${storeProfile.storeName}\nTotal: Rs.${transaction.grandTotal}\nDate: ${transaction.date}`;
    generateQRCodeDataURL(payload).then(setQrCodeUrl);
  }, [transaction, storeProfile, triggerConfetti]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = transaction.customerPhone || storeProfile.phone;
    let message = `🧾 *${storeProfile.storeName}*\n`;
    message += `Bill No: *${transaction.billNumber}*\n`;
    message += `Date: ${formatDateTime(transaction.date)}\n`;
    message += `----------------------------\n`;
    transaction.items.forEach((item) => {
      message += `${item.name} (${item.qty} ${item.unit}) : ₹${item.total}\n`;
    });
    message += `----------------------------\n`;
    message += `*Grand Total: ₹${transaction.grandTotal}*\n`;
    message += `Payment Mode: ${transaction.paymentMethod.toUpperCase()}\n`;
    if (transaction.discountTotal > 0) {
      message += `🎉 You saved: ₹${transaction.discountTotal}!\n`;
    }
    message += `\n${storeProfile.receiptFooterMessage}`;

    const url = createWhatsAppUrl(phone, message);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Sale Completed · Bill Generated</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-2 p-3 bg-neutral-100 border-b border-neutral-200">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal (80mm)</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Printable Thermal Receipt Paper Container */}
        <div className="p-6 bg-white overflow-y-auto max-h-[60vh] font-mono text-xs">
          <div id="printable-receipt" className="border border-neutral-200 p-4 rounded-lg bg-neutral-50/50 shadow-inner">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-300">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                {storeProfile.storeName}
              </h2>
              <p className="text-[11px] text-neutral-600 mt-0.5">{storeProfile.tagline}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                {storeProfile.address}, {storeProfile.city} - {storeProfile.pincode}
              </p>
              <p className="text-[10px] text-neutral-500">Ph: {storeProfile.phone}</p>
              {storeProfile.gstin && (
                <p className="text-[10px] text-neutral-500 font-semibold">
                  GSTIN: {storeProfile.gstin}
                </p>
              )}
            </div>

            {/* Bill Info */}
            <div className="py-2 border-b border-dashed border-neutral-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Bill No:</span>
                <span className="font-bold text-neutral-900">{transaction.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDateTime(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{transaction.cashierName.split(' ')[0]}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium text-neutral-900">{transaction.customerName}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-neutral-300">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="pb-1 text-left">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Rate</th>
                    <th className="pb-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1 pr-1 font-sans text-neutral-800">
                        <div className="font-medium">{item.name}</div>
                        {item.discount > 0 && (
                          <div className="text-[10px] text-emerald-600">Saved ₹{item.discount}</div>
                        )}
                      </td>
                      <td className="py-1 text-center tabular-nums whitespace-nowrap">
                        {item.qty} {item.unit}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        ₹{item.sellingPrice}
                      </td>
                      <td className="py-1 text-right tabular-nums font-semibold text-neutral-900">
                        ₹{item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculation Totals */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="tabular-nums">{formatINR(transaction.subtotal)}</span>
              </div>
              {transaction.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Savings:</span>
                  <span className="tabular-nums">- {formatINR(transaction.discountTotal)}</span>
                </div>
              )}
              {transaction.taxTotal > 0 && (
                <div className="flex justify-between text-neutral-500 text-[10px]">
                  <span>GST Included (Total Tax):</span>
                  <span className="tabular-nums">{formatINR(transaction.taxTotal, true)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                <span>Grand Total:</span>
                <span className="tabular-nums">{formatINR(transaction.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-600 pt-0.5">
                <span>Payment Mode:</span>
                <span className="font-semibold uppercase text-neutral-800">
                  {transaction.paymentMethod === 'udhaar'
                    ? 'Udhaar (खाता)'
                    : transaction.paymentMethod}
                </span>
              </div>
            </div>

            {/* QR Code & Footer */}
            <div className="pt-3 text-center space-y-2">
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="Digital Bill QR"
                    className="w-24 h-24 border border-neutral-200 rounded p-1 bg-white"
                  />
                </div>
              )}
              <p className="text-[10px] text-neutral-600 leading-tight">
                Scan to verify bill & digital invoice
              </p>
              <p className="text-[11px] font-medium text-neutral-800 italic pt-1">
                {storeProfile.receiptFooterMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Start Next Bill (F2)
          </button>
        </div>
      </div>
    </div>
  );
};
