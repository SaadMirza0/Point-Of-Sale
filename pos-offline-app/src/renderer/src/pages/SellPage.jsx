import React, { useState, useEffect, useRef, useMemo } from 'react';
import { validateDiscount, validateReceivedAmount, validatePositiveNumber } from '../utils/validation';

const SellPage = () => {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [received, setReceived] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => {
    scanRef.current?.focus();
    loadTaxRate();
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
          alert("Product not found!");
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
    if (cart.length === 0) return alert("Cart is empty!");

    if (method === 'CASH' && (received === 0 || received < grandTotal)) {
      return alert("Please enter valid received amount for Cash payment.");
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

      if (result && result.success) {
        const shouldPrint = window.confirm("Sale Successful! Print Receipt?");
        if (shouldPrint) {
          await window.posAPI.printReceipt({ ...checkoutData, items: cart });
        }

        setCart([]);
        setReceived(0);
        setDiscount(0);
        setTimeout(() => scanRef.current?.focus(), 100);
      } else {
        alert("Error saving sale: " + (result?.error || "Unknown Error"));
      }
    } catch (error) {
      console.error("Checkout crash:", error);
      alert("System communication error. Check your database.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-50 text-black overflow-hidden ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="p-4 bg-white border-b border-gray-300">
        <input
          ref={scanRef}
          type="text"
          placeholder={isProcessing ? "Processing..." : "SCAN BARCODE HERE..."}
          className="w-full p-4 border-2 border-black text-2xl outline-none focus:bg-yellow-50"
          onKeyDown={handleScan}
          disabled={isProcessing}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-44">
        <table className="w-full bg-white border border-gray-300 shadow-sm">
          <thead className="bg-black text-white sticky top-0">
            <tr className="uppercase text-sm">
              <th className="p-3 text-left">Product Details</th>
              <th className="p-3 text-center">Price</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.barcode} className="border-b border-gray-200">
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg uppercase">{item.name}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase">{item.brand} | {item.category}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black border border-gray-300">{item.size}</span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black border border-blue-200 uppercase">{item.unit_type}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center font-bold">Rs. {item.sale_price}</td>
                <td className="p-3 text-center font-black text-xl text-blue-600">{item.qty}</td>
                <td className="p-3 text-right font-black text-lg">Rs. {(item.sale_price * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white border-t-4 border-black p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-6">
          <div className="flex gap-8 text-sm font-bold uppercase">
            <div>Subtotal: <br /><span className="text-xl">Rs. {subtotal.toFixed(2)}</span></div>
            <div>Tax ({taxRate}%): <br /><span className="text-xl text-red-600">Rs. {taxAmount.toFixed(2)}</span></div>
            <div>Discount: <br />
              <input
                type="number"
                className="w-20 border border-black p-1 text-right mt-1 outline-none"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(validateDiscount(e.target.value))}
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="flex-1 text-center border-l border-r border-gray-300 px-4">
            <span className="text-xs font-black uppercase text-gray-500">Net Payable</span>
            <div className="text-4xl font-black text-blue-700">Rs. {grandTotal.toFixed(2)}</div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase">Received</label>
              <input
                type="number"
                className="w-32 border-2 border-black p-2 text-xl font-bold outline-none"
                min=""
                step="0"
                value={received}
                onChange={(e) => setReceived(validateReceivedAmount(e.target.value))}
                disabled={isProcessing}
              />
            </div>
            <div className="bg-green-600 text-white p-2 px-4 rounded">
              <span className="text-[10px] font-black uppercase block">Change</span>
              <span className="text-xl font-black">Rs. {change > 0 ? change.toFixed(2) : "0"}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={isProcessing}
              onClick={() => handleCheckout('CASH')}
              className="bg-black text-white px-6 py-4 font-black uppercase hover:bg-gray-800 disabled:bg-gray-400"
            >
              Cash (F1)
            </button>
            <button
              disabled={isProcessing}
              onClick={() => handleCheckout('ONLINE')}
              className="bg-blue-600 text-white px-6 py-4 font-black uppercase hover:bg-blue-700 disabled:bg-gray-400"
            >
              Online (F2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellPage;
