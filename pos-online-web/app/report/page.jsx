"use client";
import { useState, useEffect } from 'react';
import { getSalesHistory, getSaleItems } from '@/lib/actions'; // Ensure these are exported from actions.js

export default function WebReports() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  
  // 1. Load Sales List from Neon Cloud
  const loadSales = async (type) => {
    setLoading(true);
    setFilter(type);
    try {
      const data = await getSalesHistory(type);
      setSales(data || []);
    } catch (error) {
      console.error("Cloud Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales('today');
  }, []);

  // 2. Fetch specific bill details (Items)
  const handleViewDetails = async (sale) => {
    try {
      // It uses local_id to match what was sent from Electron
      const items = await getSaleItems(sale.local_id || sale.id);
      setSelectedItems(items || []);
      setSelectedSale(sale);
    } catch (error) {
      alert("Error loading item details from cloud.");
    }
  };

  // 3. Client-side Search (Receipt ID or Method)
  const filteredSales = sales.filter(s => 
    s.id.toString().includes(searchTerm) || 
    s.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Financial Calculations for the Header Cards
  const totalRevenue = filteredSales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  const totalCash = filteredSales
    .filter(s => s.method === 'CASH')
    .reduce((acc, s) => acc + Number(s.total || 0), 0);
  const totalOnline = filteredSales
    .filter(s => s.method === 'ONLINE')
    .reduce((acc, s) => acc + Number(s.total || 0), 0);

  return (
    <div className="p-8 bg-white min-h-screen text-black font-sans">
      <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-6 uppercase">Web Sales History</h1>

      {/* --- REVENUE CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-black text-white p-4 border-2 border-black shadow-[4px_4px_0px_rgba(37,99,235,1)]">
          <p className="text-[10px] uppercase font-bold opacity-60 text-blue-400">Total Revenue ({filter})</p>
          <p className="text-2xl font-black">Rs. {Number(totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] uppercase font-bold text-gray-500">Cash Collection</p>
          <p className="text-2xl font-black text-green-600">Rs. {totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] uppercase font-bold text-gray-500">Online Transfers</p>
          <p className="text-2xl font-black text-blue-600">Rs. {totalOnline.toFixed(2)}</p>
        </div>
      </div>

      {/* --- SEARCH & FILTERS --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-black uppercase mb-1 block">Search Receipt ID</label>
          <input 
            type="text" 
            placeholder="Search #ID..." 
            className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 border-2 border-black">
          {['today', 'yesterday', 'month', 'all'].map((t) => (
            <button 
              key={t}
              onClick={() => loadSales(t)}
              className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${filter === t ? 'bg-black text-white' : 'hover:bg-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* --- SALES TABLE --- */}
      <div className="border-2 border-black overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-black text-white uppercase font-black">
              <th className="p-4 border-r border-gray-800">ID</th>
              <th className="p-4 border-r border-gray-700">Date & Time</th>
              <th className="p-4 border-r border-gray-700">Method</th>
              <th className="p-4 text-right">Total Bill</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center font-bold animate-pulse uppercase tracking-widest">Syncing Cloud...</td></tr>
            ) : filteredSales.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center italic text-gray-400 uppercase">No transactions found.</td></tr>
            ) : (
              filteredSales.map((s) => (
                <tr key={s.id} className="border-b-2 border-black hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-black">#00{s.id}</td>
                  <td className="p-4 font-bold text-gray-600">{new Date(s.sale_date).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${s.method === 'CASH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {s.method}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-xl">Rs. {Number(s.total).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleViewDetails(s)}
                      className="bg-black text-white px-4 py-1 text-[10px] font-black uppercase hover:bg-blue-600 transition-all"
                    >
                      View Items
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- BILL DETAIL MODAL --- */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black w-full max-w-md p-6 shadow-[12px_12px_0px_rgba(37,99,235,1)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black uppercase">Receipt #00{selectedSale.id}</h2>
                <p className="text-xs font-bold text-gray-500">{new Date(selectedSale.sale_date).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-2xl font-black hover:text-red-600 transition-colors">×</button>
            </div>

            {/* Scrollable Item List */}
            <div className="border-t-2 border-black pt-4 max-h-60 overflow-y-auto pr-2">
              <p className="text-[10px] font-black uppercase mb-2 text-gray-400">Items Purchased:</p>
              {selectedItems.length === 0 ? (
                <p className="text-xs italic text-gray-400">No item details stored for this record.</p>
              ) : (
                selectedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-bold border-b border-gray-100 py-3">
                    <span className="uppercase">{item.product_name} <span className="text-blue-600 ml-1">x{item.qty}</span></span>
                    <span>Rs. {Number(item.total).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Financial Summary */}
            <div className="border-y-2 border-black py-4 my-4 space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase text-gray-500"><span>Method:</span><span>{selectedSale.method}</span></div>
              <div className="flex justify-between text-xs font-bold uppercase text-gray-500"><span>Received:</span><span>Rs. {Number(selectedSale.received).toFixed(2)}</span></div>
              <div className="flex justify-between text-xs font-bold uppercase text-red-600"><span>Change:</span><span>Rs. {Number(selectedSale.change_amount).toFixed(2)}</span></div>
              <div className="flex justify-between font-black text-blue-700 text-2xl uppercase pt-2 border-t-2 border-dashed border-gray-200">
                <span>Total</span>
                <span>Rs. {Number(selectedSale.total).toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedSale(null)} 
              className="w-full bg-black text-white py-4 font-black uppercase text-sm hover:bg-gray-800 transition-all active:scale-95"
            >
              Close Record
            </button>
          </div>
        </div>
      )} 
    </div>
  );
}
