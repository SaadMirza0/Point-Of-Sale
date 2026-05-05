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

  // Logic Identical to Electron
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.sale_price * item.qty), 0), [cart]);
  const taxAmount = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
  const grandTotal = useMemo(() => Math.max(0, (subtotal + taxAmount - discount) || 0), [subtotal, taxAmount, discount]);
  const change = useMemo(() => received > 0 ? Math.max(0, received - grandTotal) : 0, [received, grandTotal]);

const handleCheckout = async (method) => {
  if (cart.length === 0) return alert("Cart is empty!");
  
  // 1. Prepare the data exactly how the Server Action expects it
  const checkoutData = { 
    total: grandTotal, 
    received, 
    change, 
    method,
    items: cart // <--- THIS WAS MISSING
  };

  try {
    setIsProcessing(true);
    // 2. Call the action
    const result = await saveSaleAction(checkoutData);
    
    if (result.success) {
      alert("Sale Recorded Successfully on Cloud!");
      setCart([]);
      setReceived(0);
    }
  } catch (err) {
    console.error(err);
    alert("Checkout Failed");
  } finally {
    setIsProcessing(false);
  }
};


  return (
    <div className={`flex flex-col h-screen bg-gray-50 text-black overflow-hidden ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      
      {/* 1. TOP BAR (Scanner) */}
      <div className="p-4 bg-white border-b-2 border-black">
        <input ref={scanRef} onKeyDown={handleScan} placeholder="SCAN BARCODE (WEB TERMINAL)..." className="w-full p-4 border-2 border-black text-2xl outline-none focus:bg-yellow-50 font-black" />
      </div>

      {/* 2. MIDDLE AREA (Detailed Product List) */}
      <div className="flex-1 overflow-y-auto p-4 pb-48">
        <table className="w-full bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <thead className="bg-black text-white uppercase text-sm">
            <tr><th className="p-3 text-left">Product Details</th><th className="p-3 text-center">Price</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.barcode} className="border-b border-gray-300 font-medium">
                <td className="p-3 uppercase">
                   <span className="block font-black text-lg">{item.name}</span>
                   <span className="text-xs text-gray-500">{item.brand} | {item.size}</span>
                </td>
                <td className="p-3 text-center">Rs. {item.sale_price}</td>
                <td className="p-3 text-center font-black text-blue-600 text-xl">{item.qty}</td>
                <td className="p-3 text-right font-black">Rs. {(item.sale_price * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. FIXED BOTTOM SUMMARY (Horizontal Layout) */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t-4 border-black p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-6">
          <div className="flex gap-6 text-xs font-black uppercase">
            <div>Subtotal<br/><span className="text-xl">Rs.{subtotal.toFixed(2)}</span></div>
            <div>Tax({taxRate}%)<br/><span className="text-xl text-red-600">Rs.{taxAmount.toFixed(2)}</span></div>
            <div>Discount<br/>
              <input type="number" className="w-20 border-2 border-black p-1 text-right" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex-1 text-center border-x-2 border-gray-200 px-4">
            <span className="text-xs font-black uppercase text-gray-400">Net Payable</span>
            <div className="text-4xl font-black text-blue-700 underline decoration-black">Rs. {grandTotal.toFixed(2)}</div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase">Received</label>
              <input type="number" className="w-28 border-2 border-black p-2 text-xl font-bold" value={received} onChange={e => setReceived(Number(e.target.value))} />
            </div>
            <div className="bg-green-600 text-white p-2 px-4 rounded shadow-md">
              <span className="text-[10px] font-black uppercase block">Change</span>
              <span className="text-xl font-black">Rs. {change.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => handleCheckout('CASH')} className="bg-black text-white px-6 py-4 font-black uppercase hover:bg-gray-800 active:scale-95">Cash</button>
            <button onClick={() => handleCheckout('ONLINE')} className="bg-blue-600 text-white px-6 py-4 font-black uppercase hover:bg-blue-700 active:scale-95">Online</button>
          </div>
        </div>
      </div>
    </div>
  );
}
