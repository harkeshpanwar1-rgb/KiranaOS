import QRCode from 'qrcode';
import { Product, StockStatus } from '../types';

// Format Indian Currency: ₹ 1,25,450.00
export const formatINR = (amount: number, showDecimals: boolean = false): string => {
  const rounded = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = rounded.split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `₹${formattedInt}${parts[1] ? '.' + parts[1] : ''}`;
};

// Format Date & Time for India
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Compute days until expiry from 2026-10-03
export const getDaysUntilExpiry = (expiryDateStr: string): number => {
  if (!expiryDateStr) return 999;
  const target = new Date(expiryDateStr);
  const today = new Date('2026-10-03');
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Compute Stock Status
export const getStockStatus = (product: Product): { status: StockStatus; label: string; color: string } => {
  const days = getDaysUntilExpiry(product.expiryDate);
  
  if (days < 0) {
    return { status: 'expired', label: 'Expired', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (product.currentStock <= 0) {
    return { status: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-50 text-red-700 border-red-200' };
  }
  if (days <= 7) {
    return { status: 'expiring_soon', label: 'Expiring Soon', color: 'bg-amber-50 text-amber-800 border-amber-300' };
  }
  if (product.currentStock <= product.minStockLevel) {
    return { status: 'low_stock', label: 'Low Stock', color: 'bg-orange-50 text-orange-700 border-orange-200' };
  }
  return { status: 'in_stock', label: 'In Stock', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
};

// Generate QR Code data URL
export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
};

// Generate UPI Payment String
export const generateUPIString = (upiId: string, name: string, amount: number, note: string): string => {
  const encodedName = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(note);
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount.toFixed(2)}&cu=INR&tn=${encodedNote}`;
};

// Create WhatsApp Message URL
export const createWhatsAppUrl = (phone: string, message: string): string => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const finalPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned.slice(-10)}`;
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};
