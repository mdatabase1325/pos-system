import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  QrCode,
  PauseCircle,
  PlayCircle,
  Printer,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  Percent,
  Keyboard,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function POSCheckout() {
  const { user, activeBranch } = useAuth();
  const { success, error, info } = useToast();

  // Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(8.25);
  const [customer, setCustomer] = useState(null);
  const [customersList, setCustomersList] = useState([]);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Held Sales State
  const [heldSales, setHeldSales] = useState([]);
  const [heldDrawerOpen, setHeldDrawerOpen] = useState(false);

  // Modals & Payment State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitCardAmount, setSplitCardAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt Modal State
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Customer Create Modal State
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '' });

  const barcodeInputRef = useRef(null);

  // Load catalog, categories, customers, and business settings
  const loadData = async () => {
    try {
      setLoadingProducts(true);
      const [prodRes, catRes, custRes, setRes, heldRes] = await Promise.all([
        api.get('/products', { params: { limit: 100 } }),
        api.get('/categories'),
        api.get('/customers'),
        api.get('/settings'),
        api.get('/sales/held/list'),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (custRes.data.success) setCustomersList(custRes.data.customers);
      if (setRes.data.success && setRes.data.settings.TAX_RATE) {
        setTaxRate(parseFloat(setRes.data.settings.TAX_RATE));
      }
      if (heldRes.data.success) setHeldSales(heldRes.data.heldSales);
    } catch (err) {
      console.error('Failed to initialize POS data:', err);
      error('Failed to load catalog data.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Shortcuts Help Modal State
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Web Audio API synthesized scan beep
  const playScanTone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignored if sound is restricted by browser policy
    }
  };

  // Keyboard shortcut listener (F2: barcode search, F4: pay, F8: hold, F9: clear, ?: help, Esc: close)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) setPaymentModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) handleHoldSale();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setCart([]);
        setCustomer(null);
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cart]);

  // Barcode / Search Enter handler
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim().toLowerCase();
      const match = products.find(
        (p) =>
          p.barcode?.toLowerCase() === code ||
          p.sku?.toLowerCase() === code ||
          p.name.toLowerCase() === code
      );

      if (match) {
        addToCart(match);
        setSearchQuery('');
        success(`Scanned: ${match.name}`);
      } else {
        info(`No product found matching barcode "${searchQuery}"`);
      }
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      error(`"${product.name}" is currently OUT OF STOCK.`);
      return;
    }

    playScanTone();

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          error(`Cannot add more. Available stock is ${product.stock}.`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.sellingPrice,
          costPrice: product.costPrice,
          image: product.image,
          stock: product.stock,
          unit: product.unit,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  };

  // Update item quantity
  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && newQty > product.stock) {
      error(`Cannot exceed current stock of ${product.stock}.`);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Cart calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price * item.quantity - (item.discount || 0)),
    0
  );

  const loyaltyDiscount =
    redeemPoints && customer?.loyaltyPoints > 0
      ? customer.loyaltyPoints * 0.10 // $0.10 per point
      : 0;

  const totalDiscount = orderDiscount + loyaltyDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Change calculation
  const cashGiven = parseFloat(cashReceived || 0);
  const changeDue = Math.max(0, cashGiven - grandTotal);

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Hold Sale
  const handleHoldSale = async () => {
    if (cart.length === 0) return;
    try {
      const res = await api.post('/sales/hold', {
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        customerId: customer?.id || null,
        holdRef: `Parked at ${new Date().toLocaleTimeString()}`,
      });
      if (res.data.success) {
        success('Sale parked on hold.');
        setCart([]);
        setCustomer(null);
        // Refresh held sales
        const heldRes = await api.get('/sales/held/list');
        setHeldSales(heldRes.data.heldSales);
      }
    } catch (err) {
      error('Failed to park sale.');
    }
  };

  // Resume Held Sale
  const resumeHeldSale = async (heldSale) => {
    try {
      const items = heldSale.items.map((it) => {
        const prod = products.find((p) => p.id === it.productId);
        return {
          productId: it.productId,
          name: it.productName,
          sku: it.sku,
          price: it.unitPrice,
          costPrice: prod?.costPrice || 0,
          image: prod?.image || null,
          stock: prod?.stock || 50,
          unit: prod?.unit || 'pcs',
          quantity: it.quantity,
          discount: 0,
        };
      });

      setCart(items);
      if (heldSale.customerId) {
        const cust = customersList.find((c) => c.id === heldSale.customerId);
        if (cust) setCustomer(cust);
      }

      await api.delete(`/sales/held/${heldSale.id}`);
      setHeldSales((prev) => prev.filter((h) => h.id !== heldSale.id));
      setHeldDrawerOpen(false);
      success('Held sale retrieved to cart.');
    } catch (err) {
      error('Failed to restore held sale.');
    }
  };

  // Complete Checkout
  const handleCompleteCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && cashGiven < grandTotal) {
      error(`Cash received ($${cashGiven.toFixed(2)}) is less than total ($${grandTotal.toFixed(2)}).`);
      return;
    }

    setIsProcessing(true);
    try {
      let payments = [];
      if (paymentMethod === 'SPLIT') {
        const splitCash = parseFloat(splitCashAmount || 0);
        const splitCard = parseFloat(splitCardAmount || 0);
        if (splitCash + splitCard < grandTotal) {
          error('Split payment total does not cover the grand total.');
          setIsProcessing(false);
          return;
        }
        payments = [
          { method: 'CASH', amount: splitCash, reference: 'SPLIT-CASH' },
          { method: 'CARD', amount: splitCard, reference: 'SPLIT-CARD' },
        ];
      } else {
        payments = [
          {
            method: paymentMethod,
            amount: grandTotal,
            reference: paymentMethod === 'CASH' ? 'CASH-TILL' : 'EFT-POS',
          },
        ];
      }

      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discount: i.discount || 0,
        })),
        customerId: customer?.id || null,
        discount: orderDiscount,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashGiven : grandTotal,
        payments,
        branchId: activeBranch?.id,
        pointsRedeemed: redeemPoints ? customer?.loyaltyPoints || 0 : 0,
      };

      const res = await api.post('/sales', payload);
      if (res.data.success) {
        success(`Transaction completed! Invoice: ${res.data.sale.invoiceNumber}`);
        setCompletedSale(res.data.sale);
        setPaymentModalOpen(false);
        setReceiptModalOpen(true);
        // Reset Cart
        setCart([]);
        setCustomer(null);
        setOrderDiscount(0);
        setCashReceived('');
        setRedeemPoints(false);
        // Refresh product stock
        loadData();
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Checkout failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Quick Customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', newCustomerForm);
      if (res.data.success) {
        success('Customer registered.');
        setCustomersList((prev) => [...prev, res.data.customer]);
        setCustomer(res.data.customer);
        setNewCustomerModal(false);
        setNewCustomerForm({ name: '', phone: '', email: '' });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create customer.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-6.5rem)]">
      {/* LEFT SECTION: Catalog & Touch Items (65% width) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Search & Barcode Scan Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleBarcodeScan}
              placeholder="Search by name, SKU, or scan barcode (Press Enter or [F2])..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300">
              <Barcode className="w-3 h-3" />
              <span>F2</span>
            </div>
          </div>

          {/* Shortcuts Help Button */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0"
            title="Keyboard Shortcuts [?]"
          >
            <Keyboard className="w-4 h-4 text-indigo-500" />
            <span className="hidden md:inline">Shortcuts</span>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">?</span>
          </button>

          {/* Parked Sales Counter Button */}
          <button
            onClick={() => setHeldDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0"
          >
            <PauseCircle className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Held</span>
            {heldSales.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                {heldSales.length}
              </span>
            )}
          </button>
        </div>

        {/* Categories Pills Bar */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start">
          {loadingProducts ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-slate-400">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold">No products found</p>
              <p className="text-xs text-slate-500">Try adjusting your category or search query.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const inStock = p.stock > 0;
              const isLow = p.stock <= p.minStock && inStock;

              return (
                <div
                  key={p.id}
                  onClick={() => inStock && addToCart(p)}
                  className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all duration-200 text-left cursor-pointer overflow-hidden ${
                    inStock
                      ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-lg dark:hover:bg-slate-800 active:scale-98'
                      : 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Product Image / Fallback */}
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700/50 mb-2 relative">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                        No Photo
                      </div>
                    )}
                    {/* Stock status pill */}
                    <div className="absolute top-1.5 right-1.5">
                      {!inStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow">
                          Out
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow">
                          {p.stock} left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow">
                          {p.stock} {p.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{p.sku}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      ${p.sellingPrice.toFixed(2)}
                    </span>
                    <button
                      disabled={!inStock}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart, Customer, Calculations & Pay (35% width) */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Customer Selector Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2 overflow-hidden">
            <User className="w-4 h-4 text-indigo-500 shrink-0" />
            {customer ? (
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {customer.name}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {customer.loyaltyPoints} loyalty points available
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-500">Walk-in Customer</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {customer ? (
              <button
                onClick={() => {
                  setCustomer(null);
                  setRedeemPoints(false);
                }}
                className="text-[11px] text-rose-500 hover:underline px-1.5 py-0.5"
              >
                Clear
              </button>
            ) : (
              <>
                <select
                  value={customer?.id || ''}
                  onChange={(e) => {
                    const found = customersList.find((c) => c.id === e.target.value);
                    setCustomer(found || null);
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 max-w-[110px]"
                >
                  <option value="">Select...</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setNewCustomerModal(true)}
                  className="p-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs"
                  title="Add Customer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Loyalty Points Redemption Banner */}
        {customer && customer.loyaltyPoints > 0 && (
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Redeem {customer.loyaltyPoints} pts (-${(customer.loyaltyPoints * 0.1).toFixed(2)})</span>
            </div>
            <input
              type="checkbox"
              checked={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
              <ShoppingBag className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Cart is empty</p>
              <p className="text-[11px] text-slate-400">Scan barcode or touch items from the catalog.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">(${item.price.toFixed(2)} ea)</span>
                  </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-500 flex items-center justify-center ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 space-y-2">
          {/* Discount & Clear Actions */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <Percent className="w-3.5 h-3.5" />
              <span>Order Discount ($):</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={orderDiscount || ''}
              onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-16 px-2 py-0.5 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
            />
          </div>

          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Total Discounts:</span>
                <span>-${totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Tax ({taxRate}%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Grand Total:</span>
              <span className="text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons: Hold, Clear, Pay */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => {
                setCart([]);
                setCustomer(null);
                setOrderDiscount(0);
              }}
              disabled={cart.length === 0}
              className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={handleHoldSale}
              disabled={cart.length === 0}
              className="py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Hold</span>
            </button>

            <button
              onClick={() => setPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold disabled:opacity-40 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1"
            >
              <span>Pay [F4]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Complete Checkout"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          {/* Amount Due Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Amount Due</span>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ${grandTotal.toFixed(2)}
              </h3>
            </div>
            {customer && (
              <div className="text-right">
                <span className="text-xs text-slate-500">Points to Earn</span>
                <p className="text-sm font-bold text-emerald-600">+{Math.floor(grandTotal / 10)} pts</p>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'CASH', name: 'Cash', icon: Banknote },
                { id: 'CARD', name: 'Card', icon: CreditCard },
                { id: 'DIGITAL', name: 'Digital', icon: QrCode },
                { id: 'SPLIT', name: 'Split', icon: Percent },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Received & Fast Cash Pills */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Cash Received ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'Exact', val: grandTotal },
                  { label: '$10', val: 10 },
                  { label: '$20', val: 20 },
                  { label: '$50', val: 50 },
                  { label: '$100', val: 100 },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setCashReceived(q.val.toString())}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Change Due Display */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Change Due:</span>
                <span
                  className={`text-lg font-black ${
                    cashGiven >= grandTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Split Payment Inputs */}
          {paymentMethod === 'SPLIT' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cash Portion ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={splitCashAmount}
                  onChange={(e) => setSplitCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Card Portion ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={splitCardAmount}
                  onChange={(e) => setSplitCardAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleCompleteCheckout}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-101"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isProcessing ? 'Processing Transaction...' : 'Complete Sale & Issue Receipt'}</span>
          </button>
        </div>
      </Modal>

      {/* PRINTABLE RECEIPT MODAL (80mm standard format) */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Payment Successful"
        maxWidth="max-w-md"
      >
        {completedSale && (
          <div className="space-y-4">
            {/* Printable Receipt Paper Container */}
            <div
              id="printable-receipt"
              className="p-5 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-inner font-mono text-xs leading-relaxed"
            >
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-extrabold text-base tracking-wider uppercase">Apex POS & Retail</h3>
                <p className="text-[10px] text-slate-600">742 Evergreen Terrace, Springfield, OR</p>
                <p className="text-[10px] text-slate-600">Tel: +1 (555) 019-2834</p>
                <p className="text-[11px] font-bold mt-1">Invoice: {completedSale.invoiceNumber}</p>
                <p className="text-[9px] text-slate-500">
                  {new Date(completedSale.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span className="font-bold">{completedSale.cashier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedSale.customer?.name || 'Walk-in'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
                {completedSale.items?.map((it) => (
                  <div key={it.id} className="flex justify-between items-start text-[11px]">
                    <div className="max-w-[180px]">
                      <p className="font-semibold">{it.productName}</p>
                      <p className="text-[9px] text-slate-500">
                        {it.quantity} x ${it.unitPrice?.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold">${it.total?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${completedSale.subtotal?.toFixed(2)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-${completedSale.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>${completedSale.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-900">
                  <span>GRAND TOTAL:</span>
                  <span>${completedSale.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Payment ({completedSale.paymentMethod}):</span>
                  <span>${completedSale.cashReceived ? completedSale.cashReceived.toFixed(2) : completedSale.total.toFixed(2)}</span>
                </div>
                {completedSale.changeAmount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Change:</span>
                    <span>${completedSale.changeAmount?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-500">
                <p>Thank you for shopping with us!</p>
                <p>Returns accepted within 14 days with receipt.</p>
                <div className="mt-2 text-center text-xs font-mono font-bold tracking-widest">
                  * {completedSale.invoiceNumber} *
                </div>
              </div>
            </div>

            {/* Print and Done actions */}
            <div className="flex items-center gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                New Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* HELD SALES DRAWER */}
      <Modal
        isOpen={heldDrawerOpen}
        onClose={() => setHeldDrawerOpen(false)}
        title="Parked / Held Sales"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          {heldSales.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No sales currently parked on hold.</p>
          ) : (
            heldSales.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{h.holdRef}</h5>
                  <p className="text-[10px] text-slate-400">
                    {h.items?.length || 0} items • ${h.total?.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => resumeHeldSale(h)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* QUICK NEW CUSTOMER MODAL */}
      <Modal
        isOpen={newCustomerModal}
        onClose={() => setNewCustomerModal(false)}
        title="Register New Customer"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
          >
            Save Customer & Attach to Order
          </button>
        </form>
      </Modal>

      {/* KEYBOARD SHORTCUTS MODAL */}
      <Modal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        title="Cashier Keyboard Shortcuts"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Speed up cashier checkout operations with direct keyboard actions:
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Focus Barcode / SKU Input</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                F2
              </kbd>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Open Payment & Checkout Modal</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                F4
              </kbd>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Park / Hold Current Sale</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-amber-500 border border-slate-200 dark:border-slate-700">
                F8
              </kbd>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Clear Shopping Cart</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-rose-500 border border-slate-200 dark:border-slate-700">
                F9
              </kbd>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Close Open Modal / Dialog</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                Esc
              </kbd>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Open Keyboard Shortcuts Cheat Sheet</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-indigo-500 border border-slate-200 dark:border-slate-700">
                ?
              </kbd>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
