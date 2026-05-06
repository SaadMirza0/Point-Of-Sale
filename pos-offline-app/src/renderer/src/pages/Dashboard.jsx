import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, cashSales: 0, onlineSales: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [pendingSync, setPendingSync] = useState(0);

  const [trend, setTrend] = useState({ value: 0, isUp: true });

  const loadData = async () => {
    try {
      const s = await window.posAPI.getDashboardStats();
      const l = await window.posAPI.getLowStock();
      const history = await window.posAPI.getSalesHistory('today');

      // Calculate trend vs yesterday
      const yesterdaySales = await window.posAPI.getSalesHistory('yesterday');
      const yesterdayTotal = yesterdaySales?.reduce((acc, sale) => acc + (sale.total || 0), 0) || 0;
      const todayTotal = s?.totalSales || 0;

      if (yesterdayTotal > 0) {
        const diff = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
        setTrend({ value: Math.abs(diff).toFixed(1), isUp: diff >= 0 });
      } else {
        setTrend({ value: todayTotal > 0 ? 100 : 0, isUp: true });
      }

      setStats(s || { totalSales: 0, totalOrders: 0, cashSales: 0, onlineSales: 0 });
      setLowStock(l || []);
      setRecentSales(history?.slice(0, 5) || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  useEffect(() => {
    const checkSync = async () => {
      if (window.posAPI?.getSyncCount) {
        const count = await window.posAPI.getSyncCount();
        setPendingSync(count);
      }
    };

    checkSync();

    const removeListener = window.posAPI.onDatabaseUpdated(() => {
      checkSync();
      loadData();
    });

    loadData();

    return () => removeListener?.();
  }, []);

  const handleFullSync = async () => {
    const confirm = window.confirm("This will download all data from the Cloud. Continue?");
    if (confirm) {
      const result = await window.posAPI.fullSyncRecovery();
      if (result.success) {
        alert("Data successfully restored from Cloud!");
        loadData();
      } else {
        alert("Sync Failed: " + result.error);
      }
    }
  };

  const totalSalesValue = stats.totalSales || 0;
  const cashSalesValue = stats.cashSales || 0;
  const onlineSalesValue = stats.onlineSales || 0;
  const totalForSplit = cashSalesValue + onlineSalesValue;

  const cashPercent = totalForSplit > 0 ? Math.round((cashSalesValue / totalForSplit) * 100) : 0;
  const onlinePercent = totalForSplit > 0 ? Math.round((onlineSalesValue / totalForSplit) * 100) : 0;

  return (
    <main className="min-h-screen bg-surface">
      <header className="flex justify-between items-center h-16 px-8 w-full sticky top-0 bg-white border-b border-outline-variant z-30 shadow-none">
        <div className="flex items-center flex-1">
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary-container transition-colors"
              placeholder="Search orders, items, or customers..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={loadData}
              className="material-symbols-outlined text-outline hover:text-primary-container transition-colors"
              title="Sync Data"
            >
              sync
            </button>
            <div className="relative">
              <button className="material-symbols-outlined text-outline hover:text-primary-container transition-colors">notifications</button>
              {pendingSync > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
              )}
            </div>
            <button className="material-symbols-outlined text-outline hover:text-primary-container transition-colors">help</button>
          </div>
          <button
            onClick={() => navigate('/sell')}
            className="bg-primary-container text-white px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary-container/20"
          >
            New Sale
          </button>
        </div>
      </header>

      {/* Dashboard Canvas */}
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-headline-xl font-bold text-primary mb-1">Operational Analytics</h2>
            <p className="text-body-md text-on-surface-variant">Real-time performance metrics for Station #01</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingSync > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-error-container text-error rounded-lg animate-pulse">
                <span className="material-symbols-outlined text-[16px]">sync_problem</span>
                <span className="text-label-sm font-black uppercase">{pendingSync} Pending</span>
              </div>
            )}
            <button
              onClick={handleFullSync}
              className="text-label-sm text-primary-container font-black uppercase hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">cloud_download</span>
              Cloud Recovery
            </button>
          </div>
        </div>

        {/* Bento Layout Grid */}
        <div className="grid grid-cols-12 gap-gutter">

          {/* Primary Metric: Total Sales */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl p-8 relative overflow-hidden shadow-sm group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-[0.2em] font-bold mb-1">Total Daily Sales</p>
                <h3 className="text-[56px] font-black text-primary leading-tight tracking-tight">
                  Rs. {totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="bg-primary-container text-white p-4 rounded-2xl shadow-lg shadow-primary-container/20 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 z-10 relative">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold ${trend.isUp ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'}`}>
                <span className="material-symbols-outlined text-[18px]">
                  {trend.isUp ? 'trending_up' : 'trending_down'}
                </span>
                <span className="text-body-md">{trend.isUp ? '+' : '-'}{trend.value}%</span>
              </div>
              <span className="text-body-md text-outline font-medium">vs yesterday (Rs. {(totalSalesValue / (1 + (trend.isUp ? (trend.value / 100) : -(trend.value / 100)))).toLocaleString()})</span>
            </div>

            {/* Decorative Sparkline Background */}
            <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                <path
                  d="M0 80 Q 50 20, 100 70 T 200 40 T 300 60 T 400 30"
                  fill="none"
                  stroke="#0F4C5C"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Secondary Metric: Customers Served */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 flex flex-col justify-between shadow-sm hover:border-primary-container transition-colors">
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">Customers Served</p>
                <span className="material-symbols-outlined text-outline-variant text-3xl">group</span>
              </div>
              <h3 className="text-[42px] font-black text-primary leading-none">{stats.totalOrders}</h3>
              <p className="text-body-md text-outline mt-3">Peak hours observed: 12:00 PM - 02:00 PM</p>
            </div>
            <div className="mt-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-label-sm font-black text-primary-container uppercase tracking-tighter">Performance Progress</span>
                <span className="text-label-sm font-black text-primary">{Math.min(100, Math.round((stats.totalOrders / 200) * 100))}%</span>
              </div>
              <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (stats.totalOrders / 200) * 100)}%` }}
                ></div>
              </div>
              <p className="text-label-sm text-outline mt-3 text-right font-medium italic">Target: 200 daily orders</p>
            </div>
          </div>

          {/* Payment Split Visualization */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
            <h4 className="text-headline-md font-bold text-primary mb-8 border-b border-outline-variant pb-2">Payment Volume Split</h4>

            <div className="flex items-end justify-between h-48 px-6 mb-8">
              <div className="flex flex-col items-center space-y-4 w-[40%] group">
                <div
                  className="w-full bg-primary-container rounded-t-2xl transition-all duration-700 shadow-lg shadow-primary-container/10 group-hover:brightness-110"
                  style={{ height: `${cashPercent || 5}%` }}
                ></div>
                <p className="text-label-sm text-primary-container font-black uppercase tracking-widest">{cashPercent}% CASH</p>
              </div>
              <div className="flex flex-col items-center space-y-4 w-[40%] group">
                <div
                  className="w-full bg-secondary-container rounded-t-2xl transition-all duration-700 shadow-lg shadow-secondary-container/10 group-hover:brightness-110"
                  style={{ height: `${onlinePercent || 5}%` }}
                ></div>
                <p className="text-label-sm text-secondary font-black uppercase tracking-widest">{onlinePercent}% ONLINE</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                <span className="text-label-sm font-bold text-primary-container uppercase tracking-tight">Cash flow</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                <span className="w-3 h-3 rounded-full bg-secondary-container"></span>
                <span className="text-label-sm font-bold text-secondary uppercase tracking-tight">Online gate</span>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-headline-md font-bold text-primary border-b border-outline-variant pb-2 flex-1">Inventory Alerts</h4>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ml-4 ${lowStock.length > 0 ? 'bg-error-container text-error' : 'bg-secondary-container text-secondary'}`}>
                {lowStock.length > 3 ? 'CRITICAL' : 'HEALTHY'}
              </span>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {lowStock.length === 0 ? (
                <div className="text-center py-12 text-outline italic text-body-md bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                  No inventory alerts at this time.
                </div>
              ) : (
                lowStock.slice(0, 5).map(item => (
                  <div key={item.barcode} className="flex items-center justify-between p-3 rounded-xl border-l-4 border-error bg-surface-container-low hover:bg-white transition-colors border border-outline-variant/30">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-error text-[20px]">inventory</span>
                      <div>
                        <p className="text-body-md font-bold text-primary truncate max-w-[120px]">{item.name}</p>
                        <p className="text-[10px] text-outline font-data-mono">{item.barcode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-body-md font-black text-error">{item.stock_quantity} units</p>
                      <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Min: 10</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="w-full mt-8 py-3 text-label-sm text-primary-container font-black border border-primary-container rounded-xl hover:bg-primary-container hover:text-white transition-all uppercase tracking-widest"
            >
              Manage Stock Engine
            </button>
          </div>

          {/* Recent Activity */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
            <h4 className="text-headline-md font-bold text-primary mb-8 border-b border-outline-variant pb-2">Operational Log</h4>
            <div className="space-y-6 max-h-[320px] overflow-y-auto custom-scrollbar pr-2 relative">
              {recentSales.length === 0 ? (
                <div className="text-center py-12 text-outline italic text-body-md">No activity recorded today.</div>
              ) : (
                recentSales.map((sale, idx) => {
                  const saleTime = new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={sale.id} className="relative pl-6 pb-6 last:pb-0">
                      {/* Timeline Line */}
                      {idx !== recentSales.length - 1 && (
                        <div className="absolute left-[3px] top-4 bottom-0 w-[2px] bg-outline-variant"></div>
                      )}
                      {/* Timeline Dot */}
                      <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${sale.method === 'CASH' ? 'bg-primary-container' : 'bg-secondary'}`}></div>

                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-body-md font-bold text-primary">Sale #{sale.id.toString().slice(-6).toUpperCase()}</p>
                          <p className="text-body-md text-on-surface-variant mt-1">Total: Rs. {sale.total?.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter ${sale.method === 'CASH' ? 'bg-primary-container/10 text-primary-container' : 'bg-secondary/10 text-secondary'}`}>
                              {sale.method}
                            </span>
                          </div>
                        </div>
                        <span className="text-label-sm text-outline font-medium">{saleTime}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="w-full mt-8 py-3 text-label-sm text-outline font-black border border-outline-variant rounded-xl hover:bg-surface-container transition-all uppercase tracking-widest"
            >
              Full Transaction Audit
            </button>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Dashboard;
