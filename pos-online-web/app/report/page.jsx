"use client";
import { useState, useEffect, useMemo } from 'react';
import { getSalesHistory, getSaleItems } from '@/lib/actions';

export default function WebReports() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
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
      setIsDetailLoading(true);
      setSelectedSale(sale);
      const items = await getSaleItems(sale.local_id || sale.id);
      setSelectedItems(items || []);
    } catch (error) {
      alert("Error loading item details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 3. Client-side Search (Receipt ID or Method)
  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.id.toString().includes(searchTerm) || 
      s.method.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  // 4. Financial Calculations for the Header Cards
  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + Number(s.total || 0), 0), [filteredSales]);
  const transactionCount = filteredSales.length;
  const avgTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const cashTotal = filteredSales.filter(s => s.method === 'CASH').reduce((acc, s) => acc + Number(s.total || 0), 0);
  const onlineTotal = filteredSales.filter(s => s.method === 'ONLINE').reduce((acc, s) => acc + Number(s.total || 0), 0);

  return (
    <div className="p-8 space-y-8 min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex items-center gap-2 text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">
            <span className="cursor-pointer hover:text-primary">RETAILOS</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-slate-300">SALES HISTORY</span>
          </nav>
          <h1 className="text-3xl font-black text-primary mb-1">Sales History</h1>
          <p className="text-sm text-on-surface-variant font-medium">Analyze past transactions and manage receipt records.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white border border-outline-variant px-4 py-2 flex items-center gap-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-widest rounded-lg">
            <span className="material-symbols-outlined text-sm">download</span>
            EXPORT CSV
          </button>
          <button className="bg-primary text-white px-4 py-2 flex items-center gap-2 text-[10px] font-black hover:opacity-90 transition-opacity uppercase tracking-widest rounded-lg">
            <span className="material-symbols-outlined text-sm">print</span>
            BATCH PRINT
          </button>
        </div>
      </div>

      {/* Filters & Navigation */}
      <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm space-y-6">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 lg:col-span-4">
            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Search Transaction</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">receipt</span>
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary transition-all font-bold placeholder:font-medium placeholder:text-slate-300" 
                placeholder="Bill No. or Method..." 
                type="text"
              />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8 flex justify-end">
            <div className="flex bg-slate-50 p-1 rounded-xl border border-outline-variant">
              {['today', 'yesterday', 'month', 'all'].map((t) => (
                <button 
                  key={t}
                  onClick={() => loadSales(t)}
                  className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === t ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Period Revenue</span>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-1.5 rounded-lg text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div className="text-2xl font-black text-primary">Rs. {totalRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-secondary mt-2 text-[10px] font-black uppercase tracking-tight">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>Based on {filter} filters</span>
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transactions</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
          </div>
          <div className="text-2xl font-black text-primary">{transactionCount} Sales</div>
          <div className="flex items-center gap-1 text-slate-400 mt-2 text-[10px] font-black uppercase tracking-tight">
            <span className="material-symbols-outlined text-sm">history</span>
            <span>{filter.toUpperCase()} Record</span>
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg. Ticket</span>
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-1.5 rounded-lg text-xl">analytics</span>
          </div>
          <div className="text-2xl font-black text-primary">Rs. {avgTicket.toFixed(0).toLocaleString()}</div>
          <div className="flex items-center gap-1 text-slate-400 mt-2 text-[10px] font-black uppercase tracking-tight">
            <span>Per Customer Avg</span>
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Collection Mix</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cash:</span>
              <span className="text-xs font-black text-secondary">Rs. {cashTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Online:</span>
              <span className="text-xs font-black text-primary">Rs. {onlineTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-outline-variant z-10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-black text-primary animate-pulse uppercase tracking-widest text-[10px]">Syncing Records...</p>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200 block mb-2">inbox</span>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Transactions Found</p>
                  </td>
                </tr>
              ) : filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-primary text-sm tracking-tight">#INV-{s.id}</td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-600">{new Date(s.sale_date).toLocaleDateString()}</div>
                    <div className="text-[10px] font-medium text-slate-400">{new Date(s.sale_date).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${s.method === 'CASH' ? 'bg-secondary/5 text-secondary border-secondary/10' : 'bg-primary/5 text-primary border-primary/10'}`}>
                      {s.method}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-primary text-sm">
                    Rs. {Number(s.total).toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-teal-50 text-teal-700 text-[10px] font-black tracking-tight border border-teal-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
                      COMPLETED
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleViewDetails(s)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                        title="View Receipt"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Print Copy">
                        <span className="material-symbols-outlined text-[18px]">print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-outline-variant flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {filteredSales.length} Transactions found for {filter}
          </span>
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-outline-variant w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-primary uppercase tracking-tight">Receipt #INV-{selectedSale.id}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(selectedSale.sale_date).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => { setSelectedSale(null); setSelectedItems([]); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-8 py-4 space-y-4">
              <div className="border-t border-b border-dashed border-slate-200 py-6 my-4">
                <p className="text-[10px] font-black uppercase mb-4 text-slate-300 tracking-[0.2em]">Items Purchased</p>
                
                {isDetailLoading ? (
                  <div className="py-10 text-center">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-[10px] font-bold text-secondary uppercase animate-pulse">Fetching Details...</p>
                  </div>
                ) : selectedItems.length === 0 ? (
                  <p className="text-xs italic text-slate-400 py-4">No item breakdown available for this record.</p>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-black text-primary uppercase">{item.product_name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Unit Price: Rs. {Number(item.price || 0).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-primary">Rs. {Number(item.total).toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-secondary uppercase">Qty: {item.qty}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-outline-variant">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>Payment Method:</span>
                  <span className="text-primary">{selectedSale.method}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>Received:</span>
                  <span className="text-primary font-black">Rs. {Number(selectedSale.received || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-error">
                  <span>Change Given:</span>
                  <span className="font-black">Rs. {Number(selectedSale.change_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-primary text-xl uppercase pt-4 mt-2 border-t border-dashed border-slate-200">
                  <span>Grand Total</span>
                  <span>Rs. {Number(selectedSale.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4">
              <button 
                onClick={() => { setSelectedSale(null); setSelectedItems([]); }}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Print Duplicate Receipt
              </button>
            </div>
          </div>
        </div>
      )} 
    </div>
  );
}
