export type UserRole = 'owner' | 'manager' | 'cashier' | 'stock_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export type ProductUnit = 'kg' | 'g' | 'L' | 'ml' | 'packet' | 'piece' | 'box' | 'bag';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';

export interface Product {
  id: string;
  name: string;
  hindiName?: string;
  brand: string;
  category: string;
  sku: string;
  barcode: string;
  qrCode?: string;
  unit: ProductUnit;
  currentStock: number;
  minStockLevel: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstRate: number; // 0, 5, 12, 18, 28
  expiryDate: string; // YYYY-MM-DD
  batchNumber: string;
  supplierId: string;
  supplierName: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  sellingPrice: number;
  discount: number; // per unit discount in Rs
  taxAmount: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'udhaar' | 'split';

export interface SplitPayment {
  cash: number;
  upi: number;
  card: number;
  udhaar: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  unit: ProductUnit;
  qty: number;
  mrp: number;
  sellingPrice: number;
  discount: number;
  taxRate: number;
  total: number;
  purchasePrice: number; // to calculate profit accurately
}

export interface Transaction {
  id: string;
  billNumber: string;
  date: string;
  items: TransactionItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  splitPayment?: SplitPayment;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  status: 'completed' | 'returned' | 'partially_returned';
  notes?: string;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'debit' | 'credit'; // debit = purchase/udhaar increased, credit = payment received
  amount: number;
  balanceAfter: number;
  referenceId: string; // bill number or payment receipt
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  creditLimit: number;
  createdAt: string;
  ledger: CustomerLedgerEntry[];
}

export interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'purchase' | 'payment';
  amount: number;
  balanceAfter: number;
  invoiceNo: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  gstin: string;
  productsSupplied: string[];
  totalPurchases: number;
  amountPaid: number;
  amountPayable: number;
  ledger: SupplierLedgerEntry[];
}

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  qty: number;
  purchasePrice: number;
  batchNumber: string;
  expiryDate: string;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  receivedBy: string;
}

export type AdjustmentReason =
  | 'damaged'
  | 'expired'
  | 'spoiled'
  | 'lost'
  | 'returned_to_supplier'
  | 'manual_correction'
  | 'other';

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  type: 'add' | 'remove';
  quantity: number;
  reason: AdjustmentReason;
  notes: string;
  staffName: string;
  date: string;
}

export interface ReturnRecord {
  id: string;
  originalBillNumber: string;
  transactionId: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  refundAmount: number;
  refundMethod: 'cash' | 'upi' | 'credit';
  reason: 'damaged' | 'expired' | 'wrong_item' | 'customer_choice' | 'other';
  processedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  details: string;
}

export interface StoreProfile {
  storeName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  gstin: string;
  fssaiNumber: string;
  upiId: string;
  receiptFooterMessage: string;
  currencySymbol: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'scan'
  | 'purchases'
  | 'sales'
  | 'returns'
  | 'customers'
  | 'udhaar'
  | 'suppliers'
  | 'expiry'
  | 'reports'
  | 'users'
  | 'settings';
