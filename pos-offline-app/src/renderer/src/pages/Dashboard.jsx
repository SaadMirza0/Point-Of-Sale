import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, cashSales: 0, onlineSales: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [pendingSync, setPendingSync] = useState(0);
  const loadData = async () => {
    const s = await window.posAPI.getDashboardStats();
    const l = await window.posAPI.getLowStock();
    setStats(s);
    setLowStock(l);
  };



  useEffect(() => {
    const checkSync = async () => {
      if (window.posAPI?.getSyncCount) {
        const count = await window.posAPI.getSyncCount();
        setPendingSync(count);
      }
    };

    checkSync();

    // Also listen for auto-sync updates here!
    const removeListener = window.posAPI.onDatabaseUpdated(() => {
      checkSync();
    });

    return () => removeListener?.();
  }, []);



  useEffect(() => { loadData(); }, []);

  const handleFullSync = async () => {
    const confirm = window.confirm("This will download all data from the Cloud. Continue?");
    if (confirm) {
      const result = await window.posAPI.fullSyncRecovery();
      if (result.success) alert("Data successfully restored from Cloud!");
      else alert("Sync Failed: " + result.error);
    }
  };
  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-6 uppercase border-b-2 border-black pb-2">Store Overview</h1>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-black text-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
          <span className="text-xs uppercase font-black opacity-70">Today's Sales</span>
          <div className="text-3xl font-black mt-1">Rs. {stats.totalSales?.toFixed(2) || "0.00"}</div>
        </div>
        <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <span className="text-xs uppercase font-black text-gray-500">Total Orders</span>
          <div className="text-3xl font-black mt-1">{stats.totalOrders || 0}</div>
        </div>
        <div className="bg-blue-600 text-white p-6 shadow-[8px_8px_0px_rgba(37,99,235,0.3)]">
          <span className="text-xs uppercase font-black opacity-80">Online vs Cash</span>
          <div className="text-lg font-bold mt-1">Online: Rs. {stats.onlineSales?.toFixed(0)}</div>
          <div className="text-lg font-bold">Cash: Rs. {stats.cashSales?.toFixed(0)}</div>
        </div>
      </div>

      {/* --- LOW STOCK ALERT --- */}
      <div className="bg-white border-2 border-black p-6">
        <h2 className="text-lg font-black uppercase mb-4 text-red-600">⚠️ Low Stock Alerts</h2>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-xs uppercase font-black">
            <tr><th className="p-3">Product</th><th className="p-3">Size</th><th className="p-3">Remaining</th></tr>
          </thead>
          <tbody>
            {lowStock.length === 0 ? (
              <tr><td colSpan="3" className="p-4 text-center italic">All stock levels are healthy.</td></tr>
            ) : (
              lowStock.map(item => (
                <tr key={item.barcode} className="border-b border-gray-200">
                  <td className="p-3 font-bold uppercase">{item.name}</td>
                  <td className="p-3">{item.size}</td>
                  <td className="p-3 text-red-600 font-black">{item.stock_quantity} {item.unit_type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pendingSync > 0 ? (
        <div className="bg-orange-500 text-white p-2 text-xs font-bold uppercase animate-pulse">
          🔄 {pendingSync} Transactions Pending Sync
        </div>
      ) : (
        <div className="bg-green-500 text-white p-2 text-xs font-bold uppercase">
          ✅ All Synced to Cloud
        </div>
      )}
      <button
        onClick={handleFullSync}
        className="bg-orange-600 text-white px-4 py-2 font-black uppercase text-xs shadow-[4px_4px_0px_rgba(0,0,0,1)]"
      >
        ☁️ Sync Everything from Cloud
      </button>

    </div>
  );
};

export default Dashboard;
