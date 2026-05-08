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

  if (loading || !data) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-primary animate-pulse uppercase tracking-widest text-xs">Syncing Live Data...</p>
      </div>
    );
  }

  const cashPercent = data.stats.total_sales > 0 
    ? Math.round((data.stats.cash_total / data.stats.total_sales) * 100) 
    : 0;
  const onlinePercent = data.stats.total_sales > 0 
    ? 100 - cashPercent 
    : 0;

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-primary mb-1">Operational Analytics</h2>
          <p className="text-sm text-on-surface-variant font-medium">Real-time performance metrics for Station #01</p>
        </div>
        <button 
          onClick={refreshData}
          className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Primary Metric: Total Sales */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl p-8 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1">Total Daily Sales</p>
              <h3 className="text-5xl font-black text-primary leading-tight">
                Rs. {Number(data.stats.total_sales).toLocaleString()}
              </h3>
            </div>
            <div className="bg-secondary-container/20 text-secondary p-4 rounded-2xl">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-secondary text-sm font-bold">trending_up</span>
            <span className="text-sm font-bold text-secondary">+12.4%</span>
            <span className="text-sm text-slate-400 font-medium">vs yesterday (Rs. 126,850)</span>
          </div>
          
          {/* Decorative Chart Path */}
          <div className="absolute bottom-0 left-0 right-0 h-24 opacity-5 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path d="M0 80 Q 50 20, 100 70 T 200 40 T 300 60 T 400 30" fill="none" stroke="#003441" strokeWidth="4"></path>
            </svg>
          </div>
        </div>

        {/* Secondary Metric: Customers Served */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Orders Processed</p>
              <span className="material-symbols-outlined text-slate-300">shopping_cart</span>
            </div>
            <h3 className="text-5xl font-black text-primary">{data.stats.total_orders}</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium">Peak hours: 12:00 PM - 02:00 PM</p>
          </div>
          <div className="mt-8">
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-container rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min((data.stats.total_orders / 200) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Station Capacity</p>
              <p className="text-[10px] font-black text-primary uppercase">{Math.round((data.stats.total_orders / 200) * 100)}% of daily target</p>
            </div>
          </div>
        </div>

        {/* Payment Split */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
          <h4 className="text-lg font-bold text-primary mb-8 uppercase tracking-wider">Payment Revenue Split</h4>
          <div className="flex items-end justify-around h-48 px-4 mb-8">
            <div className="flex flex-col items-center space-y-4 w-1/3 group">
              <div 
                className="w-full bg-primary rounded-t-lg transition-all duration-700 delay-100 relative" 
                style={{ height: `${cashPercent}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white text-[10px] px-2 py-1 rounded">Rs. {data.stats.cash_total}</div>
              </div>
              <p className="text-xs font-black text-primary">{cashPercent}%</p>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Cash</p>
            </div>
            <div className="flex flex-col items-center space-y-4 w-1/3 group">
              <div 
                className="w-full bg-secondary-container rounded-t-lg transition-all duration-700 delay-300 relative" 
                style={{ height: `${onlinePercent}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white text-[10px] px-2 py-1 rounded">Rs. {data.stats.online_total}</div>
              </div>
              <p className="text-xs font-black text-secondary">{onlinePercent}%</p>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Online</p>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
             <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-xs font-semibold text-slate-600">Cash Flow</span>
             </div>
             <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="text-xs font-semibold text-slate-600">Digital</span>
             </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-bold text-primary uppercase tracking-wider">Low Stock Alerts</h4>
            <span className="text-[10px] font-black px-3 py-1 bg-error-container text-error rounded-full uppercase tracking-wider">
              {data.products.low_stock_count} CRITICAL
            </span>
          </div>
          <div className="space-y-4">
            {data.lowStock.length > 0 ? data.lowStock.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl border-l-4 border-error bg-slate-50 hover:bg-white transition-colors border border-transparent hover:border-outline-variant group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-error border border-error-container group-hover:bg-error group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-xl">inventory</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{product.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">SKU: {product.barcode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-error">{product.stock_quantity} units</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Min: 10</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-4xl text-secondary opacity-20">check_circle</span>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Inventory is Healthy</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-xs font-bold text-primary uppercase tracking-widest border border-primary rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95">
            Manage Inventory
          </button>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
          <h4 className="text-lg font-bold text-primary mb-8 uppercase tracking-wider">Recent Activity</h4>
          <div className="space-y-6">
            {data.recentSales.map((sale, idx) => (
              <div key={idx} className="flex items-start space-x-4 relative">
                {idx !== data.recentSales.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-100"></div>
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  sale.method === 'CASH' ? 'bg-primary' : 'bg-secondary'
                }`}>
                  <span className="material-symbols-outlined text-white text-[12px]">
                    {sale.method === 'CASH' ? 'payments' : 'credit_card'}
                  </span>
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-primary">Sale #{sale.id}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Total: Rs. {Number(sale.total).toLocaleString()} ({sale.method})
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all">
            Full Audit Log
          </button>
        </div>

      </div>
    </div>
  );
}
