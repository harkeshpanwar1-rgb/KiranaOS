import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Supplier,
  Customer,
  Transaction,
  PurchaseOrder,
  StockAdjustment,
  ReturnRecord,
  AuditLog,
  User,
  StoreProfile,
  ActiveTab,
  CartItem,
  PaymentMethod,
  SplitPayment,
} from '../types';
import {
  initialStoreProfile,
  initialUsers,
  initialSuppliers,
  initialCustomers,
  initialProducts,
  initialTransactions,
  initialPurchaseOrders,
} from '../data/seedData';
import { translations, Language } from '../locales/translations';

interface StoreContextType {
  // Navigation & Auth
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  loginAsRole: (role: User['role']) => void;
  isAuthenticated: boolean;
  logout: () => void;
  users: User[];
  
  // Store info
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  
  // Entities
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  purchaseOrders: PurchaseOrder[];
  stockAdjustments: StockAdjustment[];
  returnRecords: ReturnRecord[];
  auditLogs: AuditLog[];
  
  // Actions - Products & Inventory
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message: string; product?: Product };
  updateProduct: (id: string, updates: Partial<Product>) => { success: boolean; message: string };
  deleteProduct: (id: string) => { success: boolean; message: string };
  adjustStock: (productId: string, quantity: number, type: 'add' | 'remove', reason: StockAdjustment['reason'], notes: string) => { success: boolean; message: string };
  
  // Actions - POS Billing & Sales
  createSale: (params: {
    items: CartItem[];
    paymentMethod: PaymentMethod;
    splitPayment?: SplitPayment;
    customerId?: string;
    notes?: string;
  }) => { success: boolean; message: string; transaction?: Transaction };
  processReturn: (params: {
    originalBillNumber: string;
    transactionId: string;
    productId: string;
    quantity: number;
    refundAmount: number;
    refundMethod: 'cash' | 'upi' | 'credit';
    reason: ReturnRecord['reason'];
  }) => { success: boolean; message: string };
  
  // Actions - Purchases (Receiving Stock)
  receivePurchase: (order: Omit<PurchaseOrder, 'id'>) => { success: boolean; message: string };
  
  // Actions - Customers & Udhaar
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance' | 'createdAt' | 'ledger'>) => Customer;
  recordCustomerPayment: (customerId: string, amount: number, notes?: string) => { success: boolean; message: string };
  
  // Actions - Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'amountPaid' | 'amountPayable' | 'ledger'>) => Supplier;
  recordSupplierPayment: (supplierId: string, amount: number, notes?: string) => { success: boolean; message: string };
  
  // Scanner helper
  findProductByCode: (code: string) => Product | undefined;
  
  // System Tools
  resetDatabase: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => { success: boolean; message: string };
}

const STORAGE_KEY = 'kirana_os_db_v1';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('kirana_os_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kirana_os_lang', lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Initialize DB from local storage or seeds
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_profile');
    return saved ? JSON.parse(saved) : initialStoreProfile;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    return users[0] || initialUsers[0];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_purchases');
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_adjustments');
    return saved ? JSON.parse(saved) : [];
  });

  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_audit');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'aud-init',
        timestamp: new Date().toISOString(),
        userName: 'Rajesh Kumar (Owner)',
        userRole: 'owner',
        action: 'System Boot',
        entity: 'System',
        details: 'KiranaOS database initialized with 22 FMCG catalog items.',
      },
    ];
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_profile', JSON.stringify(storeProfile));
  }, [storeProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_purchases', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_adjustments', JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_returns', JSON.stringify(returnRecords));
  }, [returnRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper: Log audit action
  const logAudit = (action: string, entity: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entity,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Auth / Role switcher
  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    logAudit('User Switch', 'Auth', `Switched active user to ${user.name} (${user.role})`);
  };

  const loginAsRole = (role: User['role']) => {
    const matched = users.find((u) => u.role === role) || users[0];
    setCurrentUserState(matched);
    setIsAuthenticated(true);
    logAudit('Login', 'Auth', `Logged in as ${matched.name} (${matched.role})`);
  };

  const logout = () => {
    logAudit('Logout', 'Auth', `Logged out user ${currentUser.name}`);
    setIsAuthenticated(false);
  };

  const updateStoreProfile = (profile: Partial<StoreProfile>) => {
    setStoreProfile((prev) => ({ ...prev, ...profile }));
    logAudit('Update Store Profile', 'Settings', 'Updated store business contact / tax details');
  };

  // Find product by barcode, qrCode, sku or exact name
  const findProductByCode = (query: string): Product | undefined => {
    if (!query) return undefined;
    const clean = query.trim().toLowerCase();
    return products.find(
      (p) =>
        p.barcode.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        (p.qrCode && p.qrCode.toLowerCase() === clean) ||
        p.name.toLowerCase() === clean
    );
  };

  // Add product
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Check duplicate barcode
    if (products.some((p) => p.barcode === productData.barcode.trim())) {
      return { success: false, message: `Barcode "${productData.barcode}" already exists for another product!` };
    }
    // Check duplicate SKU
    if (products.some((p) => p.sku === productData.sku.trim())) {
      return { success: false, message: `SKU "${productData.sku}" already exists!` };
    }

    const newProduct: Product = {
      ...productData,
      id: `p-${Date.now()}`,
      barcode: productData.barcode.trim(),
      sku: productData.sku.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);
    logAudit(
      'Create Product',
      'Inventory',
      `Added product ${newProduct.name} (SKU: ${newProduct.sku}, Opening Stock: ${newProduct.currentStock})`
    );
    return { success: true, message: 'Product added successfully!', product: newProduct };
  };

  // Update product
  const updateProduct = (id: string, updates: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return { success: false, message: 'Product not found!' };

    // Barcode uniqueness check
    if (updates.barcode && updates.barcode !== existing.barcode) {
      if (products.some((p) => p.id !== id && p.barcode === updates.barcode?.trim())) {
        return { success: false, message: `Barcode "${updates.barcode}" is used by another product!` };
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    logAudit('Update Product', 'Inventory', `Updated product ${existing.name} (ID: ${id})`);
    return { success: true, message: 'Product updated successfully!' };
  };

  // Delete product
  const deleteProduct = (id: string) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return { success: false, message: 'Product not found!' };

    setProducts((prev) => prev.filter((p) => p.id !== id));
    logAudit('Delete Product', 'Inventory', `Removed product ${existing.name} (ID: ${id})`);
    return { success: true, message: 'Product deleted from catalog.' };
  };

  // Stock Adjustment (Damaged, Expired, Spoiled, Lost, Manual Correction)
  const adjustStock = (
    productId: string,
    quantity: number,
    type: 'add' | 'remove',
    reason: StockAdjustment['reason'],
    notes: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, message: 'Product not found' };

    if (quantity <= 0) return { success: false, message: 'Adjustment quantity must be greater than 0' };

    if (type === 'remove' && product.currentStock < quantity) {
      return {
        success: false,
        message: `Cannot remove ${quantity} ${product.unit}. Current stock is only ${product.currentStock}.`,
      };
    }

    const newStock = type === 'add' ? product.currentStock + quantity : product.currentStock - quantity;

    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, currentStock: newStock } : p)));

    const adjustmentRecord: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId,
      productName: product.name,
      type,
      quantity,
      reason,
      notes: notes || 'Stock manual adjustment',
      staffName: currentUser.name,
      date: new Date().toISOString(),
    };

    setStockAdjustments((prev) => [adjustmentRecord, ...prev]);
    logAudit(
      'Stock Adjustment',
      'Inventory',
      `${type === 'add' ? 'Added' : 'Removed'} ${quantity} ${product.unit} of ${product.name} (Reason: ${reason}). New Stock: ${newStock}`
    );

    return { success: true, message: `Stock adjusted successfully. Current stock is now ${newStock}.` };
  };

  // POS Sale creation
  const createSale = (params: {
    items: CartItem[];
    paymentMethod: PaymentMethod;
    splitPayment?: SplitPayment;
    customerId?: string;
    notes?: string;
  }) => {
    const { items, paymentMethod, splitPayment, customerId, notes } = params;

    if (!items || items.length === 0) {
      return { success: false, message: 'Cannot generate bill with empty cart!' };
    }

    // Business rule: Validate available stock
    for (const item of items) {
      const liveProduct = products.find((p) => p.id === item.product.id);
      if (!liveProduct) {
        return { success: false, message: `Product ${item.product.name} no longer exists!` };
      }
      if (liveProduct.currentStock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${liveProduct.name}". Available: ${liveProduct.currentStock}, Requested: ${item.quantity}`,
        };
      }
    }

    // Calculate totals
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let totalProfit = 0;

    const transactionItems = items.map((item) => {
      const lineTotal = item.total;
      const unitMrp = item.product.mrp;
      const lineMrpTotal = unitMrp * item.quantity;
      const lineDiscount = Math.max(0, lineMrpTotal - lineTotal);
      
      // Profit: Selling Price - Purchase Price
      const itemProfit = (item.sellingPrice - item.product.purchasePrice) * item.quantity;

      subtotal += lineTotal;
      discountTotal += lineDiscount;
      taxTotal += item.taxAmount;
      totalProfit += itemProfit;

      return {
        productId: item.product.id,
        name: item.product.name,
        unit: item.product.unit,
        qty: item.quantity,
        mrp: item.product.mrp,
        sellingPrice: item.sellingPrice,
        discount: lineDiscount,
        taxRate: item.product.gstRate,
        total: lineTotal,
        purchasePrice: item.product.purchasePrice,
      };
    });

    const grandTotal = Math.round(subtotal);

    // Bill Number formatting: INV-2026-XXXX
    const nextNum = transactions.length + 101;
    const billNumber = `INV-2026-${String(nextNum).padStart(4, '0')}`;

    let customerObj = customerId ? customers.find((c) => c.id === customerId) : undefined;

    // Udhaar validation
    if (paymentMethod === 'udhaar' && !customerObj) {
      return { success: false, message: 'Please select a customer for Udhaar / Credit billing.' };
    }

    // Deduct stock from products
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = items.find((item) => item.product.id === p.id);
        if (cartMatch) {
          const updatedStock = Math.max(0, p.currentStock - cartMatch.quantity);
          return { ...p, currentStock: updatedStock, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    // Update customer Udhaar balance if applicable
    if (customerObj) {
      let udhaarAmount = 0;
      if (paymentMethod === 'udhaar') {
        udhaarAmount = grandTotal;
      } else if (paymentMethod === 'split' && splitPayment?.udhaar) {
        udhaarAmount = splitPayment.udhaar;
      }

      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customerObj?.id) {
            const newTotalPurchases = c.totalPurchases + grandTotal;
            const newOutstanding = c.outstandingBalance + udhaarAmount;
            const newLedger = [...c.ledger];

            if (udhaarAmount > 0) {
              newLedger.push({
                id: `cl-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'debit',
                amount: udhaarAmount,
                balanceAfter: newOutstanding,
                referenceId: billNumber,
                notes: `Purchased goods on bill #${billNumber}`,
              });
            }

            return {
              ...c,
              totalPurchases: newTotalPurchases,
              outstandingBalance: newOutstanding,
              ledger: newLedger,
            };
          }
          return c;
        })
      );
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      billNumber,
      date: new Date().toISOString(),
      items: transactionItems,
      subtotal,
      discountTotal,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal,
      totalProfit: Math.round(totalProfit),
      paymentMethod,
      splitPayment,
      customerId: customerObj?.id,
      customerName: customerObj?.name,
      customerPhone: customerObj?.phone,
      cashierName: currentUser.name,
      status: 'completed',
      notes,
    };

    setTransactions((prev) => [newTx, ...prev]);

    logAudit(
      'Sale Created',
      'POS',
      `Bill #${billNumber} for ₹${grandTotal} (${paymentMethod.toUpperCase()}). Staff: ${currentUser.name}`
    );

    return { success: true, message: `Bill #${billNumber} generated successfully!`, transaction: newTx };
  };

  // Customer Return process
  const processReturn = (params: {
    originalBillNumber: string;
    transactionId: string;
    productId: string;
    quantity: number;
    refundAmount: number;
    refundMethod: 'cash' | 'upi' | 'credit';
    reason: ReturnRecord['reason'];
  }) => {
    const { originalBillNumber, transactionId, productId, quantity, refundAmount, refundMethod, reason } = params;

    const originalTx = transactions.find((t) => t.id === transactionId || t.billNumber === originalBillNumber);
    if (!originalTx) return { success: false, message: 'Original invoice not found!' };

    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, message: 'Product not found!' };

    // Restore stock
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentStock: p.currentStock + quantity } : p))
    );

    // Record return record
    const returnRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      originalBillNumber,
      transactionId: originalTx.id,
      date: new Date().toISOString(),
      productId,
      productName: product.name,
      quantity,
      refundAmount,
      refundMethod,
      reason,
      processedBy: currentUser.name,
    };

    setReturnRecords((prev) => [returnRecord, ...prev]);

    // Mark transaction status
    setTransactions((prev) =>
      prev.map((t) => (t.id === originalTx.id ? { ...t, status: 'returned' } : t))
    );

    // If customer Udhaar return, reduce customer balance
    if (refundMethod === 'credit' && originalTx.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === originalTx.customerId) {
            const newBal = Math.max(0, c.outstandingBalance - refundAmount);
            return {
              ...c,
              outstandingBalance: newBal,
              ledger: [
                ...c.ledger,
                {
                  id: `cl-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  type: 'credit',
                  amount: refundAmount,
                  balanceAfter: newBal,
                  referenceId: `RET-${originalBillNumber}`,
                  notes: `Return refund for ${product.name} (${quantity} units)`,
                },
              ],
            };
          }
          return c;
        })
      );
    }

    logAudit(
      'Process Return',
      'Returns',
      `Processed return of ${quantity} ${product.unit} of ${product.name} against Bill #${originalBillNumber}. Refunded: ₹${refundAmount}`
    );

    return { success: true, message: `Return processed. Stock restored for ${product.name}.` };
  };

  // Receive stock / Purchase from supplier
  const receivePurchase = (orderData: Omit<PurchaseOrder, 'id'>) => {
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: `po-${Date.now()}`,
    };

    // Increase product inventory & update purchase price and batch
    setProducts((prev) =>
      prev.map((p) => {
        const itemMatch = newOrder.items.find((item) => item.productId === p.id);
        if (itemMatch) {
          return {
            ...p,
            currentStock: p.currentStock + itemMatch.qty,
            purchasePrice: itemMatch.purchasePrice,
            batchNumber: itemMatch.batchNumber || p.batchNumber,
            expiryDate: itemMatch.expiryDate || p.expiryDate,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // Update supplier payable balance
    const unpaidAmount = newOrder.totalAmount - newOrder.paidAmount;
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === newOrder.supplierId) {
          const newTotalPurchases = s.totalPurchases + newOrder.totalAmount;
          const newAmountPaid = s.amountPaid + newOrder.paidAmount;
          const newPayable = s.amountPayable + unpaidAmount;

          const newLedger = [...s.ledger];
          newLedger.push({
            id: `sup-leg-${Date.now()}`,
            date: newOrder.date,
            type: 'purchase',
            amount: newOrder.totalAmount,
            balanceAfter: newPayable,
            invoiceNo: newOrder.invoiceNumber,
            notes: `Stock receiving order with ${newOrder.items.length} items`,
          });

          if (newOrder.paidAmount > 0) {
            newLedger.push({
              id: `sup-leg-pay-${Date.now()}`,
              date: newOrder.date,
              type: 'payment',
              amount: newOrder.paidAmount,
              balanceAfter: newPayable,
              invoiceNo: `PAY-${newOrder.invoiceNumber}`,
              notes: 'Immediate payment against delivery',
            });
          }

          return {
            ...s,
            totalPurchases: newTotalPurchases,
            amountPaid: newAmountPaid,
            amountPayable: newPayable,
            ledger: newLedger,
          };
        }
        return s;
      })
    );

    setPurchaseOrders((prev) => [newOrder, ...prev]);

    logAudit(
      'Receive Stock',
      'Purchases',
      `Received stock from ${newOrder.supplierName} (Invoice: ${newOrder.invoiceNumber}, Total: ₹${newOrder.totalAmount})`
    );

    return { success: true, message: `Stock received successfully for invoice #${newOrder.invoiceNumber}.` };
  };

  // Customer Udhaar Payment
  const recordCustomerPayment = (customerId: string, amount: number, notes?: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return { success: false, message: 'Customer not found' };
    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than 0' };

    const newOutstanding = Math.max(0, customer.outstandingBalance - amount);
    const newTotalPaid = customer.totalPaid + amount;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            outstandingBalance: newOutstanding,
            totalPaid: newTotalPaid,
            ledger: [
              ...c.ledger,
              {
                id: `cl-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'credit',
                amount,
                balanceAfter: newOutstanding,
                referenceId: `REC-${Date.now().toString().slice(-4)}`,
                notes: notes || 'Cash/UPI Udhaar settlement payment',
              },
            ],
          };
        }
        return c;
      })
    );

    logAudit(
      'Udhaar Payment',
      'Customers',
      `Recorded payment of ₹${amount} from customer ${customer.name}. Remaining Balance: ₹${newOutstanding}`
    );

    return { success: true, message: `Payment of ₹${amount} recorded for ${customer.name}.` };
  };

  // Supplier Payment
  const recordSupplierPayment = (supplierId: string, amount: number, notes?: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return { success: false, message: 'Supplier not found' };
    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than 0' };

    const newPayable = Math.max(0, supplier.amountPayable - amount);
    const newPaid = supplier.amountPaid + amount;

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          return {
            ...s,
            amountPayable: newPayable,
            amountPaid: newPaid,
            ledger: [
              ...s.ledger,
              {
                id: `sup-leg-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'payment',
                amount,
                balanceAfter: newPayable,
                invoiceNo: `PAY-${Date.now().toString().slice(-4)}`,
                notes: notes || 'Supplier payment clearance',
              },
            ],
          };
        }
        return s;
      })
    );

    logAudit(
      'Supplier Payment',
      'Suppliers',
      `Paid ₹${amount} to ${supplier.name}. Balance payable: ₹${newPayable}`
    );

    return { success: true, message: `Payment of ₹${amount} recorded for ${supplier.name}.` };
  };

  // Add new customer
  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance' | 'createdAt' | 'ledger'>): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: `c-${Date.now()}`,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
      ledger: [],
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit('Add Customer', 'Customers', `Created new customer profile: ${newCust.name} (${newCust.phone})`);
    return newCust;
  };

  // Add new supplier
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'totalPurchases' | 'amountPaid' | 'amountPayable' | 'ledger'>): Supplier => {
    const newSup: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      totalPurchases: 0,
      amountPaid: 0,
      amountPayable: 0,
      ledger: [],
    };
    setSuppliers((prev) => [newSup, ...prev]);
    logAudit('Add Supplier', 'Suppliers', `Created new supplier: ${newSup.name} (${newSup.contactPerson})`);
    return newSup;
  };

  // Database Reset
  const resetDatabase = () => {
    setStoreProfile(initialStoreProfile);
    setUsers(initialUsers);
    setCurrentUserState(initialUsers[0]);
    setProducts(initialProducts);
    setSuppliers(initialSuppliers);
    setCustomers(initialCustomers);
    setTransactions(initialTransactions);
    setPurchaseOrders(initialPurchaseOrders);
    setStockAdjustments([]);
    setReturnRecords([]);
    setAuditLogs([
      {
        id: `aud-reset-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: 'Rajesh Kumar (Owner)',
        userRole: 'owner',
        action: 'Database Reset',
        entity: 'System',
        details: 'System restored to fresh factory seed state.',
      },
    ]);
  };

  // Export database JSON
  const exportDatabaseJSON = (): string => {
    const backup = {
      storeProfile,
      users,
      products,
      suppliers,
      customers,
      transactions,
      purchaseOrders,
      stockAdjustments,
      returnRecords,
      auditLogs,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  };

  // Import database JSON
  const importDatabaseJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.products || !Array.isArray(data.products)) {
        return { success: false, message: 'Invalid backup file format: missing products array.' };
      }
      if (data.storeProfile) setStoreProfile(data.storeProfile);
      if (data.products) setProducts(data.products);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.customers) setCustomers(data.customers);
      if (data.transactions) setTransactions(data.transactions);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.stockAdjustments) setStockAdjustments(data.stockAdjustments);
      if (data.returnRecords) setReturnRecords(data.returnRecords);
      logAudit('Database Import', 'System', 'Imported data from external backup JSON file.');
      return { success: true, message: 'Database imported successfully!' };
    } catch {
      return { success: false, message: 'Failed to parse JSON file. Please check syntax.' };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        t,
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        loginAsRole,
        isAuthenticated,
        logout,
        users,
        storeProfile,
        updateStoreProfile,
        products,
        suppliers,
        customers,
        transactions,
        purchaseOrders,
        stockAdjustments,
        returnRecords,
        auditLogs,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        createSale,
        processReturn,
        receivePurchase,
        addCustomer,
        recordCustomerPayment,
        addSupplier,
        recordSupplierPayment,
        findProductByCode,
        resetDatabase,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
