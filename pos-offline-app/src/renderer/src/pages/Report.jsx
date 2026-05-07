import React, { useState, useEffect, useMemo } from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

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

  useEffect(() => {
    loadSales('today');
  }, []);

  useEffect(() => {
    const removeListener = window.posAPI.onDatabaseUpdated(() => {
      if (!searchTerm) {
        loadSales(filter);
      }
    });
    return () => removeListener?.();
  }, [filter, searchTerm]);

  // --- STATS CALCULATIONS ---
  const stats = useMemo(() => {
    const revenue = sales.reduce((acc, s) => acc + s.total, 0);
    const count = sales.length;
    const avg = count > 0 ? revenue / count : 0;
    return {
      revenue: revenue.toLocaleString(),
      count,
      avg: avg.toFixed(2).toLocaleString()
    };
  }, [sales]);

  return (
    <main className="flex-1 p-margin bg-surface overflow-y-auto custom-scrollbar">
      <div className="max-w-[1600px] mx-auto">

        {/* Page Header & Stats */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <nav className="flex items-center gap-2 text-label-sm text-outline mb-2 font-label-sm uppercase tracking-widest">
              <span className="cursor-pointer hover:text-primary transition-colors">RETAILOS</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-outline-variant">SALES HISTORY</span>
            </nav>
            <h1 className="text-headline-xl text-primary-container uppercase tracking-tight">Sales History</h1>
            <p className="text-body-md text-on-surface-variant font-medium">Analyze past transactions and manage receipt records.</p>
          </div>

          <div className="flex gap-4">
            <button className="bg-white border border-outline-variant px-6 py-3 flex items-center gap-2 text-label-sm text-primary-container font-black hover:bg-surface-container-low transition-all rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-lg">download</span>
              EXPORT CSV
            </button>
            <button className="bg-primary-container text-white px-6 py-3 flex items-center gap-2 text-label-sm font-black hover:brightness-110 transition-all rounded-xl shadow-lg shadow-primary-container/20">
              <span className="material-symbols-outlined text-lg">print</span>
              BATCH PRINT
            </button>
          </div>
        </div>

        {/* Filters Bento Grid */}
        <div className="bg-white border border-outline-variant p-8 mb-8 rounded-2xl shadow-sm">
          <div className="grid grid-cols-12 gap-gutter items-end">
            <div className="col-span-4">
              <label className="block text-label-sm text-outline mb-3 uppercase font-black tracking-widest">Search Transaction</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary-container group-focus-within:scale-110 transition-transform">receipt</span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary-container/20 focus:bg-white rounded-xl text-body-md font-bold text-primary-container outline-none transition-all"
                  placeholder="Bill No. or Method..."
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>

            <div className="col-span-5">
              <label className="block text-label-sm text-outline mb-3 uppercase font-black tracking-widest">Filter By Period</label>
              <div className="flex bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/30">
                {['today', 'yesterday', 'month', 'all'].map((type) => (
                  <button
                    key={type}
                    onClick={() => loadSales(type)}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all ${filter === type
                      ? 'bg-primary-container text-white shadow-md'
                      : 'text-outline hover:text-primary-container hover:bg-white'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>


          </div>
        </div>

        {/* Sales Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-8">
          <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm hover:border-primary-container/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-label-sm text-outline uppercase tracking-widest font-black">Revenue ({filter})</span>
              <div className="w-10 h-10 bg-secondary-container/10 text-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">payments</span>
              </div>
            </div>
            <div className="text-headline-xl text-primary-container font-black tracking-tighter">Rs. {stats.revenue}</div>
            <div className="flex items-center gap-1 text-secondary mt-3 text-label-sm font-black">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>LIVE DATA</span>
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm hover:border-primary-container/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-label-sm text-outline uppercase tracking-widest font-black">Total Transactions</span>
              <div className="w-10 h-10 bg-primary-container/5 text-primary-container rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">shopping_cart</span>
              </div>
            </div>
            <div className="text-headline-xl text-primary-container font-black tracking-tighter">{stats.count}</div>
            <div className="flex items-center gap-1 text-outline mt-3 text-label-sm font-bold">
              <span>Updated just now</span>
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm hover:border-primary-container/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-label-sm text-outline uppercase tracking-widest font-black">Avg. Ticket Value</span>
              <div className="w-10 h-10 bg-tertiary-container/10 text-on-tertiary-container rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">analytics</span>
              </div>
            </div>
            <div className="text-headline-xl text-primary-container font-black tracking-tighter">Rs. {stats.avg}</div>
            <div className="flex items-center gap-1 text-tertiary mt-3 text-label-sm font-black uppercase tracking-widest">
              <span>Performance</span>
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm hover:border-primary-container/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-label-sm text-outline uppercase tracking-widest font-black">Refunds Issued</span>
              <div className="w-10 h-10 bg-error-container/10 text-error rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">undo</span>
              </div>
            </div>
            <div className="text-headline-xl text-primary-container font-black tracking-tighter">0</div>
            <div className="flex items-center gap-1 text-secondary mt-3 text-label-sm font-black">
              <span>Stable Ops</span>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-5 text-label-sm text-outline uppercase tracking-[0.2em] font-black">Transaction ID</th>
                  <th className="px-6 py-5 text-label-sm text-outline uppercase tracking-[0.2em] font-black">Timestamp</th>
                  <th className="px-6 py-5 text-label-sm text-outline uppercase tracking-[0.2em] font-black">Payment</th>
                  <th className="px-6 py-5 text-label-sm text-outline uppercase tracking-[0.2em] font-black text-right">Amount</th>
                  <th className="px-6 py-5 text-label-sm text-outline uppercase tracking-[0.2em] font-black text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-outline italic font-medium">
                      {isSearching ? 'Scanning database...' : 'No transactions found for this period.'}
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-primary-container/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-black text-primary-container font-data-mono uppercase tracking-tight">#INV-{s.id.toString()}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-body-md font-bold text-on-surface-variant italic">
                          {new Date(s.sale_date).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest ${s.method === 'CASH'
                          ? 'bg-secondary-container/20 text-secondary'
                          : 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${s.method === 'CASH' ? 'bg-secondary' : 'bg-primary-container'}`}></span>
                          {s.method}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-primary-container font-data-mono text-body-lg">
                        Rs. {s.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewItems(s)}
                            className="p-2.5 bg-surface-container text-primary-container rounded-lg hover:bg-primary-container hover:text-white transition-all shadow-sm"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            className="p-2.5 bg-surface-container text-primary-container rounded-lg hover:bg-secondary hover:text-white transition-all shadow-sm"
                            title="Reprint Receipt"
                          >
                            <span className="material-symbols-outlined text-lg">print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Mockup */}
          <div className="px-8 py-6 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
            <span className="text-label-sm text-outline font-bold">Showing {sales.length} transactions</span>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-outline-variant text-outline hover:bg-white disabled:opacity-30 transition-all">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-lg bg-primary-container text-white text-xs font-black shadow-md">1</button>
              <button className="p-2 rounded-lg border border-outline-variant text-outline hover:bg-white transition-all">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Receipt Detail Overlay (Modal) */}
        {selectedSale && (
          <div className="fixed inset-0 bg-primary-container/40 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter max-w-6xl w-full animate-in fade-in zoom-in duration-300">

              {/* Receipt Visual */}
              <div className="lg:col-span-1 bg-white p-10 rounded-3xl shadow-2xl relative overflow-hidden border-4 border-white">
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-outline">close</span>
                </button>

                <div className="text-center mb-8 pt-4">
                  <h2 className="text-headline-md font-black uppercase tracking-tighter text-primary-container">RetailOS Store</h2>
                  <p className="text-[10px] text-outline font-black uppercase tracking-widest mt-1">Operational Station 01</p>
                </div>

                <div className="border-y border-dashed border-outline-variant py-5 my-6 space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-outline uppercase tracking-widest">
                    <span>BILL NO:</span>
                    <span className="text-primary-container">#INV-{selectedSale.id.toString().padStart(5, '0')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-outline uppercase tracking-widest">
                    <span>DATE:</span>
                    <span className="text-primary-container">{new Date(selectedSale.sale_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-outline uppercase tracking-widest">
                    <span>PAYMENT:</span>
                    <span className="text-secondary">{selectedSale.method}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-body-md font-black text-primary-container uppercase leading-tight">{item.product_name}</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Qty: {item.qty} @ Rs. {item.unit_price}</p>
                      </div>
                      <span className="text-body-md font-black text-primary-container font-data-mono">Rs. {item.total}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-outline pt-6 space-y-2">
                  <div className="flex justify-between items-center text-headline-md font-black text-primary-container">
                    <span className="text-label-sm text-outline">TOTAL AMOUNT</span>
                    <span className="font-data-mono">Rs. {selectedSale.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-outline-variant uppercase tracking-widest">
                    <span>Change Return</span>
                    <span>Rs. {selectedSale.change_amount}</span>
                  </div>
                </div>

                <div className="mt-10">
                  <button className="w-full bg-primary-container text-white py-4 rounded-2xl text-label-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:brightness-110 shadow-lg shadow-primary-container/20 transition-all">
                    <span className="material-symbols-outlined">print</span>
                    REPRINT RECEIPT
                  </button>
                </div>
              </div>

              {/* Analytics Context */}
              <div className="lg:col-span-2 bg-primary-container rounded-[40px] p-12 text-white relative overflow-hidden flex flex-col justify-center shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-[48px] font-black mb-6 leading-none tracking-tight">Operational<br />Intelligence</h3>
                  <p className="text-on-primary-container text-body-lg font-medium max-w-md mb-12 opacity-80">
                    Quickly spot trends, identify high-volume sales windows, and manage returns with our integrated reporting engine.
                  </p>

                  <div className="flex gap-6">
                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl flex-1 border border-white/10">
                      <p className="text-[10px] font-black text-secondary-container uppercase tracking-[0.2em] mb-3">Transaction Health</p>
                      <p className="text-3xl font-black">100% SECURE</p>
                      <div className="mt-4 flex items-center gap-2 text-secondary-container">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified by Audit</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl flex-1 border border-white/10">
                      <p className="text-[10px] font-black text-secondary-container uppercase tracking-[0.2em] mb-3">Cloud Sync Status</p>
                      <p className="text-3xl font-black">SYNCED</p>
                      <div className="mt-4 flex items-center gap-2 text-secondary-container">
                        <span className="material-symbols-outlined text-sm">cloud_done</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Up to date</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Background */}
                <div className="absolute right-0 top-0 w-full h-full opacity-20 pointer-events-none mix-blend-overlay">
                  <img
                    alt="Data Visualization"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWF_oSvm8G6VYQbfu4g6acXbnW74smmHhXK1zhlAkHauXUK9YA8dPnqkuHCbOQB72e98MSaD34VK39d1bvwML3a8DK41WqC6WmAAdQqRNywS-2rB4aoxkvtDpk0l9GA3o3HoRv7UDbWapsVKwIBGKToHWvYjH54ryAagyClhVeS-3lO0WIgLq4PDDgDtJXkDCdsNgO_LfKBqlPNfD_UK4LHIjnh-4_axM4wGZTd9G6DThm-gwsHsQ9omLXgXftErbpD3T15S76RTs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 52, 65, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 52, 65, 0.2); }
      `}} />
    </main>
  );
};

export default Reports;

