"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { getProductByBarcode, saveSaleAction, getSetting } from '@/lib/actions';

export default function WebSellPage() {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [received, setReceived] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanRef = useRef(null);

  // Initialize: Load Tax and Focus
  useEffect(() => {
    const init = async () => {
      const rate = await getSetting('tax_rate');
      setTaxRate(parseFloat(rate) || 0);
      scanRef.current?.focus();
    };
    init();

    // Global listener to ensure scanner is always focused unless an input is active
    const handleGlobalClick = () => {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        scanRef.current?.focus();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleScan = async (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      const barcode = e.target.value.trim();
      if (!barcode) return;

      const product = await getProductByBarcode(barcode);
      if (product) {
        setCart(prev => {
          const existing = prev.find(item => item.barcode === product.barcode);
          if (existing) {
            return prev.map(item => item.barcode === product.barcode ? { ...item, qty: item.qty + 1 } : item);
          }
          return [...prev, { ...product, qty: 1 }];
        });
      } else {
        alert("Product not found in Cloud Database!");
      }
      e.target.value = "";
    }
  };

  const updateQty = (barcode, delta) => {
    setCart(prev => prev.map(item => {
      if (item.barcode === barcode) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (barcode) => {
    setCart(prev => prev.filter(item => item.barcode !== barcode));
  };

  // Logic Identical to Electron
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.sale_price * item.qty), 0), [cart]);
  const taxAmount = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
  const grandTotal = useMemo(() => Math.max(0, (subtotal + taxAmount - discount) || 0), [subtotal, taxAmount, discount]);
  const change = useMemo(() => received > 0 ? Math.max(0, received - grandTotal) : 0, [received, grandTotal]);

  const handleCheckout = async (method) => {
    if (cart.length === 0) return alert("Cart is empty!");

    if (method === 'CASH') {
      if (!received || received <= 0) {
        if (grandTotal > 0) return alert("Please enter the received amount!");
      }
      if (received < grandTotal) {
        return alert("Received amount is lower than the total amount!");
      }
    }

    const checkoutData = {
      total: grandTotal,
      received,
      change,
      method,
      items: cart
    };

    try {
      setIsProcessing(true);
      const result = await saveSaleAction(checkoutData);

      if (result.success) {
        alert("Sale Recorded Successfully!");
        setCart([]);
        setReceived(0);
        setDiscount(0);
        scanRef.current?.focus();
      }
    } catch (err) {
      console.error(err);
      alert("Checkout Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-8 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">

        {/* Left Section: Scanning & Cart */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Scanning Zone */}
          <div className="bg-white p-6 border border-outline-variant rounded-xl shadow-sm">
            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">Transaction Engine • Scanning Zone</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-3xl font-light">barcode_scanner</span>
              <input
                ref={scanRef}
                onKeyDown={handleScan}
                autoFocus
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-outline-variant focus:border-primary focus:bg-white rounded-xl text-2xl font-bold outline-none transition-all shadow-inner placeholder:text-slate-300"
                placeholder="Scan Barcode or Enter SKU..."
                type="text"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <kbd className="px-2 py-1 bg-white border border-outline-variant rounded text-[10px] text-slate-400 font-black">ENT</kbd>
              </div>
            </div>
          </div>

          {/* Cart Table Card */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="bg-slate-50 border-b border-outline-variant px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-black text-primary flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                Active Transaction
              </h3>
              <span className="text-[10px] font-black bg-primary text-white px-3 py-1 rounded-full uppercase tracking-widest">
                {cart.reduce((acc, i) => acc + i.qty, 0)} Items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b border-outline-variant">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Description</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-24">Size</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Quantity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-32">Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-32">Total</th>
                    <th className="px-6 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4">shopping_basket</span>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Your cart is empty</p>
                      </td>
                    </tr>
                  ) : cart.map(item => (
                    <tr key={item.barcode} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary text-sm">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">SKU: {item.barcode}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded lowercase">{item.size}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQty(item.barcode, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-slate-400 hover:bg-slate-100 transition-colors"
                          >-</button>
                          <span className="w-10 text-center font-black text-primary text-sm">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.barcode, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-slate-400 hover:bg-slate-100 transition-colors"
                          >+</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-500 text-sm">Rs. {item.sale_price}</td>
                      <td className="px-6 py-4 text-right font-black text-primary text-sm">Rs. {(item.sale_price * item.qty).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeItem(item.barcode)}
                          className="text-slate-300 hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section: Checkout Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-8 flex flex-col sticky top-24">

            <div className="mb-8 space-y-4">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Order Summary</h2>

              <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                <span>Subtotal</span>
                <span className="text-primary font-black">Rs. {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                <span>Tax ({taxRate}%)</span>
                <span className="text-error font-black">Rs. {taxAmount.toLocaleString()}</span>
              </div>

              {/* Discount Box */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DISCOUNT / ADJUSTMENT</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rs.</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none font-black text-sm text-primary"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Grand Total Section */}
            <div className="bg-primary p-6 rounded-xl text-white mb-8 shadow-lg shadow-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">Grand Total</span>
                <span className="material-symbols-outlined opacity-50">payments</span>
              </div>
              <div className="text-4xl font-black text-right tracking-tight">
                Rs. {grandTotal.toLocaleString()}
              </div>
            </div>

            {/* Change Calculator */}
            <div className="space-y-6 mb-8">
              <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Amount Received</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">Rs.</span>
                  <input
                    type="number"
                    value={received}
                    onChange={e => setReceived(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-4 border-2 border-primary/20 rounded-xl text-2xl font-black text-primary bg-white focus:outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className={`flex justify-between items-center px-6 py-6 border-2 rounded-xl transition-all ${received > grandTotal ? 'bg-secondary/5 border-secondary' : 'bg-slate-50 border-outline-variant opacity-50'}`}>
                <div className="text-[10px] font-black text-secondary uppercase tracking-widest">Return Amount</div>
                <div className="text-3xl font-black text-secondary">Rs. {change.toLocaleString()}</div>
              </div>
            </div>

            {/* Large Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleCheckout('CASH')}
                className="flex flex-col items-center justify-center gap-3 py-8 bg-secondary text-white rounded-xl hover:brightness-95 transition-all relative overflow-hidden active:scale-95 shadow-lg shadow-secondary/20"
              >
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                <span className="font-black text-sm uppercase tracking-widest text-center">F1: CASH PAY</span>
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/10 rounded text-[8px] font-black">FAST</div>
              </button>

              <button
                onClick={() => handleCheckout('ONLINE')}
                className="flex flex-col items-center justify-center gap-3 py-8 bg-primary text-white rounded-xl hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-4xl">contactless</span>
                <span className="font-black text-sm uppercase tracking-widest text-center">F2: ONLINE</span>
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/10 rounded text-[8px] font-black">DIGITAL</div>
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm("Discard active transaction?")) {
                  setCart([]);
                  setReceived(0);
                  setDiscount(0);
                  scanRef.current?.focus();
                }
              }}
              className="w-full mt-4 py-4 border border-outline-variant text-slate-400 rounded-xl font-bold hover:bg-slate-50 transition-colors uppercase tracking-[0.2em] text-[10px]"
            >
              Cancel Transaction (Esc)
            </button>
          </div>
        </div>
      </div>



    </div>
  );
}
