import React, { useState, useEffect } from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]); // State for items

  const loadSales = async (type) => {
    try {
      setFilter(type);
      setSearchTerm('');
      setIsSearching(true);
      const data = await window.posAPI.getSalesHistory(type);
      setSales(data || []);
    } catch (err) {
      console.error("Load sales error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchAsync = async (term) => {
    try {
      setIsSearching(true);
      const data = term.length > 0
        ? await window.posAPI.searchSales(term)
        : await window.posAPI.getSalesHistory(filter);
      setSales(data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to fetch and show items when "View Items" is clicked
  const handleViewItems = async (sale) => {
    try {
      const items = await window.posAPI.getSaleItems(sale.id);
      setSelectedItems(items || []);
      setSelectedSale(sale);
    } catch (err) {
      alert("Error loading items");
    }
  };

  const debouncedSearch = useDebouncedCallback(handleSearchAsync, 600);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  // 1. Change the initial load to 'all' to see if data is actually there
  useEffect(() => {
    loadSales('today'); // Change 'today' to 'all' to verify cloud data is visible
  }, []);

  // 2. Optimized Listener: Only refresh if no one is currently searching
  useEffect(() => {
    const removeListener = window.posAPI.onDatabaseUpdated(() => {
      if (!searchTerm) {
        loadSales(filter);
      }
    });
    return () => removeListener?.();
  }, [filter, searchTerm]);


  return (
    <div className="p-8 bg-white min-h-screen text-black font-sans relative">
      <h1 className="text-2xl font-bold border-b-4 border-black pb-2 mb-6 uppercase tracking-tighter">
        📜 Transaction Records
      </h1>

      {/* --- FILTERS & SEARCH --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-black uppercase block mb-1">Search ID or Payment Method</label>
          <input
            type="text"
            className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-50 font-bold"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex bg-gray-100 p-1 border-2 border-black">
          {['today', 'yesterday', 'month', 'all'].map((type) => (
            <button
              key={type}
              onClick={() => loadSales(type)}
              className={`px-6 py-2 font-black uppercase text-[10px] transition-all ${filter === type ? 'bg-black text-white' : 'hover:bg-white'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* --- SALES TABLE --- */}
      <div className="border-2 border-black overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white uppercase text-[10px] font-black">
              <th className="p-4 border-r border-gray-800">Bill ID</th>
              <th className="p-4 border-r border-gray-800">Date/Time</th>
              <th className="p-4 border-r border-gray-800">Payment</th>
              <th className="p-4 text-right border-r border-gray-800">Total</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b-2 border-black hover:bg-gray-50 transition-colors">
                <td className="p-4 font-black">#00{s.id}</td>
                <td className="p-4 text-xs font-bold text-gray-500">{new Date(s.sale_date).toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${s.method === 'CASH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {s.method}
                  </span>
                </td>
                <td className="p-4 text-right font-black text-lg">Rs. {s.total.toFixed(2)}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleViewItems(s)}
                    className="bg-black text-white px-4 py-1 text-[10px] font-black uppercase hover:bg-blue-600"
                  >
                    View Items
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- SALE DETAIL MODAL --- */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black w-full max-w-md p-6 shadow-[12px_12px_0px_rgba(37,99,235,1)] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black uppercase">Receipt #00{selectedSale.id}</h2>
                <p className="text-xs font-bold text-gray-500">{new Date(selectedSale.sale_date).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-2xl font-black">×</button>
            </div>

            {/* NEW: Items Purchased List */}
            <div className="mt-4 border-t-2 border-black pt-4">
              <p className="text-[10px] font-black uppercase mb-2">Items Purchased:</p>
              <div className="max-h-48 overflow-y-auto pr-2">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-bold border-b border-gray-100 py-2">
                    <span className="uppercase">{item.product_name} <span className="text-blue-600">x{item.qty}</span></span>
                    <span>Rs. {item.total}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-y-2 border-black py-4 my-4 space-y-2">
              <div className="flex justify-between font-bold"><span>Payment Method:</span><span>{selectedSale.method}</span></div>
              <div className="flex justify-between font-bold"><span>Amount Received:</span><span>Rs. {selectedSale.received}</span></div>
              <div className="flex justify-between font-bold text-red-600"><span>Change Given:</span><span>Rs. {selectedSale.change_amount}</span></div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-black uppercase text-gray-400">Net Total</span>
              <span className="text-3xl font-black text-blue-700">Rs. {selectedSale.total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setSelectedSale(null)}
              className="w-full mt-6 bg-black text-white py-3 font-black uppercase text-sm hover:bg-gray-800"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
