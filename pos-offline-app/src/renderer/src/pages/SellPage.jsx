import React, { useState, useEffect, useRef, useMemo } from 'react';
import { validateDiscount, validateReceivedAmount } from '../utils/validation';

const SellPage = () => {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [received, setReceived] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => {
    const focusScanner = () => scanRef.current?.focus();
    focusScanner();
    loadTaxRate();

    // Global click listener to refocus scanner, common in POS systems
    const handleGlobalClick = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        focusScanner();
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const loadTaxRate = async () => {
    try {
      const rate = await window.posAPI.getSetting('tax_rate');
      setTaxRate(parseFloat(rate) || 0);
    } catch (e) {
      console.error("Setting load failed");
    }
  };

  const handleScan = async (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      const barcode = e.target.value.trim();
      if (!barcode) return;
      
      try {
        const product = await window.posAPI.getProduct(barcode);
        if (product) {
          addToCart(product);
        } else {
          // Play error sound or subtle shake
          console.warn("Product not found!");
        }
        e.target.value = "";
      } catch (err) {
        console.error("Scan error:", err);
      }
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.barcode === product.barcode);
      if (existing) {
        return prev.map(item =>
          item.barcode === product.barcode ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQuantity = (barcode, delta) => {
    setCart(prev => prev.map(item => {
      if (item.barcode === barcode) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (barcode) => {
    setCart(prev => prev.filter(item => item.barcode !== barcode));
  };

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + (item.sale_price * item.qty), 0),
    [cart]
  );

  const taxAmount = useMemo(
    () => (subtotal * taxRate) / 100,
    [subtotal, taxRate]
  );

  const grandTotal = useMemo(
    () => Math.max(0, (subtotal + taxAmount - discount) || 0),
    [subtotal, taxAmount, discount]
  );

  const change = useMemo(
    () => received > 0 && !isNaN(grandTotal) ? Math.max(0, received - grandTotal) : 0,
    [received, grandTotal]
  );

  const handleCheckout = async (method) => {
    if (cart.length === 0) return;

    if (method === 'CASH' && (received === 0 || received < grandTotal)) {
      alert("Insufficient amount received.");
      return;
    }

    setIsProcessing(true);
    const checkoutData = {
      total: grandTotal,
      received: method === 'ONLINE' ? grandTotal : received,
      change: method === 'ONLINE' ? 0 : change,
      method,
      items: cart
    };

    try {
      const result = await window.posAPI.saveSale(checkoutData);
      if (result?.success) {
        await window.posAPI.printReceipt({ ...checkoutData, items: cart });
        setCart([]);
        setReceived(0);
        setDiscount(0);
      } else {
        alert("Checkout failed: " + (result?.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Checkout crash:", error);
    } finally {
      setIsProcessing(false);
      setTimeout(() => scanRef.current?.focus(), 100);
    }
  };

  return (
    <main className={`flex flex-col h-screen bg-surface transition-all duration-500 ${isProcessing ? 'blur-sm pointer-events-none' : ''}`}>
      
      {/* Top Bar / Header */}
      <header className="h-16 bg-white border-b border-outline-variant flex items-center justify-between px-6 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary-container/20">
            <span className="material-symbols-outlined text-white">point_of_sale</span>
          </div>
          <div>
            <h1 className="text-body-lg font-black text-primary-container uppercase tracking-tighter leading-none">Antigravity POS</h1>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Active Station • Terminal 01</p>
          </div>
        </div>

        {/* Real-time Scanner Indicator */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary-container/10 border border-secondary-container/30 rounded-full">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-[11px] font-black text-secondary uppercase tracking-widest">Scanner Ready</span>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant"></div>
          <div className="text-right">
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Current Session</p>
            <p className="text-body-md font-black text-primary-container">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Section: Active Transaction (8 Columns) */}
        <section className="lg:col-span-8 flex flex-col border-r border-outline-variant bg-surface-container-lowest">
          
          {/* Enhanced Scanning Zone */}
          <div className="p-6 bg-white border-b border-outline-variant">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary-container text-3xl font-light group-focus-within:scale-110 transition-transform">
                barcode_scanner
              </span>
              <input
                ref={scanRef}
                autoFocus
                disabled={isProcessing}
                onKeyDown={handleScan}
                className="w-full pl-16 pr-32 py-6 bg-surface-container-low border-2 border-transparent focus:border-primary-container/30 focus:bg-white rounded-2xl text-headline-md font-data-mono outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder:text-outline-variant"
                placeholder="SCAN PRODUCT OR ENTER BARCODE..."
                type="text"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[10px] font-black text-outline uppercase tracking-widest mr-2">Quick Add:</span>
                <kbd className="px-2 py-1 bg-white border border-outline-variant rounded-md text-[10px] font-black text-primary-container shadow-sm">ENTER</kbd>
              </div>
            </div>
          </div>

          {/* Active Transaction Table */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-body-lg font-black text-primary-container flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                ACTIVE TRANSACTION
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-outline font-bold uppercase tracking-widest">Total Units:</span>
                <span className="bg-primary-container text-white px-3 py-1 rounded-full text-xs font-black">
                  {cart.reduce((acc, i) => acc + i.qty, 0)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 bg-surface-container-low/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-outline-variant">
                    <th className="px-6 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black w-[35%]">Product Details</th>
                    <th className="px-4 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black w-[15%] text-center">Category</th>
                    <th className="px-4 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black w-[15%] text-center">Brand</th>
                    <th className="px-4 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black w-[15%] text-center">Quantity</th>
                    <th className="px-4 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black w-[20%] text-right">Price / Total</th>
                    <th className="px-6 py-4 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <span className="material-symbols-outlined text-8xl mb-4">shopping_cart_checkout</span>
                          <p className="text-headline-md font-black uppercase tracking-widest">No Items Scanned</p>
                          <p className="text-body-md font-bold mt-2">Ready for first transaction...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.barcode} className="hover:bg-primary-container/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-black text-primary-container text-body-md truncate uppercase">{item.name}</div>
                          <div className="text-[10px] text-outline font-data-mono tracking-tighter mt-1">
                            SKU: {item.barcode} | {item.size} {item.unit_type}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-lg bg-surface-container-high text-primary-container font-black text-[10px] uppercase tracking-widest border border-outline-variant/30">
                            {item.category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-body-md font-bold text-on-surface-variant italic">
                          {item.brand || 'N/A'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.barcode, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-error hover:text-white hover:border-error transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <div className="w-12 text-center">
                              <span className="text-body-lg font-black text-primary-container font-data-mono">{item.qty}</span>
                            </div>
                            <button
                              onClick={() => updateQuantity(item.barcode, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-secondary hover:text-white hover:border-secondary transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="text-[11px] text-outline font-bold">Rs. {item.sale_price.toLocaleString()}</div>
                          <div className="text-body-md font-black text-primary-container font-data-mono">
                            Rs. {(item.sale_price * item.qty).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => removeFromCart(item.barcode)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-outline-variant hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Section: Checkout & Summary (4 Columns) */}
        <aside className="lg:col-span-4 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] flex flex-col z-20">
          
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-body-lg font-black text-primary-container uppercase tracking-widest border-l-4 border-secondary pl-3">
                Order Summary
              </h2>
              <button 
                onClick={() => { if(window.confirm("Void Transaction?")) setCart([]); }}
                className="text-[10px] font-black text-error uppercase tracking-widest hover:underline"
              >
                Void (Esc)
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-body-md font-bold text-on-surface-variant">Subtotal</span>
                <span className="text-body-md font-black text-primary-container font-data-mono">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-md font-bold text-on-surface-variant flex items-center gap-2">
                  Tax <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded text-outline">{taxRate}%</span>
                </span>
                <span className="text-body-md font-black text-primary-container font-data-mono">+Rs. {taxAmount.toLocaleString()}</span>
              </div>
              
              {/* Discount Section */}
              <div className="pt-4 border-t border-outline-variant/30">
                <label className="block text-[10px] text-outline font-black uppercase tracking-widest mb-3">Discount Adjustments</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline font-black text-xs">Rs.</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(validateDiscount(e.target.value))}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-transparent focus:border-primary-container/30 rounded-xl font-black text-primary-container outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="bg-primary-container p-8 rounded-3xl text-white shadow-2xl shadow-primary-container/30 relative overflow-hidden group mb-8">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                <span className="material-symbols-outlined text-8xl">payments</span>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Net Amount Payable</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-headline-md opacity-70">Rs.</span>
                  <span className="text-[48px] font-black leading-none tracking-tight">
                    {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Inputs */}
            <div className="space-y-6">
              <div className="p-5 bg-secondary-container/5 border border-secondary-container/20 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Amount Received</label>
                  <span className="material-symbols-outlined text-secondary text-lg">input_circle</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-black text-lg">Rs.</span>
                  <input
                    type="number"
                    value={received}
                    onChange={(e) => setReceived(validateReceivedAmount(e.target.value))}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-secondary-container rounded-xl font-headline-md text-secondary font-black outline-none shadow-sm focus:ring-4 focus:ring-secondary/10 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-6 bg-surface-container rounded-2xl border border-outline-variant/30">
                <div>
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Balance Return</p>
                  <p className="text-headline-xl font-black text-primary-container font-data-mono">
                    Rs. {change.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary-container shadow-sm">
                  <span className="material-symbols-outlined text-3xl">currency_exchange</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8 bg-surface-container-low border-t border-outline-variant">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleCheckout('CASH')}
                className="flex flex-col items-center justify-center gap-3 py-6 bg-secondary text-white rounded-2xl hover:bg-secondary/90 transition-all active:scale-95 shadow-lg shadow-secondary/20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                <span className="font-black text-sm tracking-widest">F1: CASH</span>
              </button>
              <button
                onClick={() => handleCheckout('ONLINE')}
                className="flex flex-col items-center justify-center gap-3 py-6 bg-primary-container text-white rounded-2xl hover:bg-primary-container/90 transition-all active:scale-95 shadow-lg shadow-primary-container/20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="material-symbols-outlined text-3xl">contactless</span>
                <span className="font-black text-sm tracking-widest">F2: ONLINE</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Operational Footer - Fixed Bottom */}
      <footer className="h-14 bg-inverse-surface flex items-center px-6 gap-6 z-30">
        {[
          { key: 'F4', label: 'SEARCH' },
          { key: 'F5', label: 'CUSTOMER' },
          { key: 'F6', label: 'SUSPEND' },
          { key: 'F12', label: 'DRAWER' }
        ].map(shortcut => (
          <div key={shortcut.key} className="flex items-center gap-2 group cursor-pointer">
            <kbd className="px-2 py-0.5 bg-white/10 text-white rounded text-[10px] font-black group-hover:bg-secondary transition-colors">{shortcut.key}</kbd>
            <span className="text-[10px] text-white/60 font-black uppercase tracking-widest group-hover:text-white transition-colors">{shortcut.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3 text-white/40">
          <span className="material-symbols-outlined text-sm">wifi</span>
          <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
        </div>
      </footer>

      {/* Internal Scrollbar Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 52, 65, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 52, 65, 0.2); }
      `}} />
    </main>
  );
};

export default SellPage;

