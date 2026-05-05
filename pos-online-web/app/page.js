"use client";
import { useState, useEffect } from 'react';
import { getDashboardData } from '@/lib/actions';

export default function WebDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    const result = await getDashboardData();
    setData(result);
    setLoading(false);
  };

  useEffect(() => { refreshData(); }, []);

  if (loading || !data) return <div className="p-10 font-black animate-pulse uppercase">Syncing Live Data...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Admin <span className="text-blue-600">Control</span></h1>
        <button onClick={refreshData} className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-blue-600 transition-all">
          🔄 Refresh Live
        </button>
      </div>

      {/* --- ROW 1: FINANCIAL CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-black text-white p-6 shadow-[8px_8px_0px_rgba(37,99,235,1)]">
          <p className="text-[10px] font-black uppercase opacity-60">Today's Revenue</p>
          <p className="text-3xl font-black">Rs. {data.stats.total_sales}</p>
        </div>
        <div className="bg-white border-2 border-black p-6">
          <p className="text-[10px] font-black uppercase text-gray-400">Total Bills</p>
          <p className="text-3xl font-black">{data.stats.total_orders}</p>
        </div>
        <div className="bg-white border-2 border-black p-6 border-l-8 border-l-green-600">
          <p className="text-[10px] font-black uppercase text-gray-400">Cash in Hand</p>
          <p className="text-3xl font-black">Rs. {data.stats.cash_total}</p>
        </div>
        <div className="bg-white border-2 border-black p-6 border-l-8 border-l-blue-600">
          <p className="text-[10px] font-black uppercase text-gray-500">Bank/Online</p>
          <p className="text-3xl font-black">Rs. {data.stats.online_total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- LEFT: SYNC & STOCK MONITOR --- */}
        <div className="space-y-6">
          <div className="bg-yellow-50 border-2 border-black p-6 relative overflow-hidden">
             <div className="absolute right-[-20px] top-[-10px] text-8xl opacity-5 font-black uppercase">Sync</div>
             <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
               📡 Cloud Sync Monitor
             </h2>
             <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-black/10">
                    <p className="text-xs font-bold text-gray-500 uppercase">Total Items in Cloud</p>
                    <p className="text-2xl font-black">{data.products.total_products}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Inventory Health</p>
                    <p className={`text-2xl font-black ${data.products.low_stock_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {data.products.low_stock_count > 0 ? `${data.products.low_stock_count} Low Stock` : 'Healthy'}
                    </p>
                </div>
             </div>
             <p className="mt-4 text-[10px] italic font-bold text-gray-400 uppercase">※ PC App auto-pulls updates every 2 minutes</p>
          </div>

          <div className="bg-white border-2 border-black p-6">
             <h2 className="text-lg font-black uppercase mb-4">Recent Sales</h2>
             <div className="space-y-2">
                {data.recentSales.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-2 border-b border-gray-100 hover:bg-gray-50">
                        <span className="font-bold text-xs">#00{s.id} - {s.method}</span>
                        <span className="font-black text-sm">Rs. {s.total}</span>
                    </div>
                ))}
             </div>
          </div>
        </div>

  
     
      </div>
    </div>
  );
}
