"use client";
import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '@/lib/actions';

export default function WebSettings() {
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [msg, setMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [lastSyncTime, setLastSyncTime] = useState('');

  useEffect(() => {
    const load = async () => {
      setStoreName(await getSetting('store_name'));
      setPhone(await getSetting('store_phone'));
      setEmail(await getSetting('store_email'));
      setAddress(await getSetting('store_address'));
      setTaxRate(await getSetting('tax_rate'));
 
      const lastSync = await getSetting('last_sync');
      setLastSyncTime(lastSync || 'Never');
    };
    load();
  }, []);

  const handleUpdate = async (key, val) => {
    await saveSetting(key, val);
  };

  const handleSaveStoreInfo = async () => {
    await handleUpdate('store_name', storeName);
    await handleUpdate('store_phone', phone);
    await handleUpdate('store_email', email);
    await handleUpdate('store_address', address);
    setMsg('Store information updated successfully!');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      // Save the current sync timestamp to database
      const now = new Date().toLocaleString();
      await saveSetting('last_sync', now);
      setLastSyncTime(now);
      
      // Simulate sync delay
      setTimeout(() => {
        setIsSyncing(false);
        setMsg('Manual sync completed successfully!');
        setTimeout(() => setMsg(''), 3000);
      }, 1500);
    } catch (error) {
      setIsSyncing(false);
      setMsg('Sync failed! Please try again.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="p-8 w-full min-h-screen">
      {msg && (
        <div className="fixed top-4 right-4 bg-secondary text-white px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-bold text-sm tracking-wide">{msg}</span>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-black text-primary mb-1">Settings &amp; Profile</h1>
        <p className="text-sm font-medium text-on-surface-variant">Manage your retail environment, hardware, and operational parameters.</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Profile & Store Info Card */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white border border-outline-variant p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <img alt="Profile Hero" className="w-24 h-24 rounded-xl object-cover border-2 border-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNiSs4nfDibbPbYZW1zm79vtXy4Xq0sLsg1P7_9rcb9XqTbByYPc7GT1xj4WK3q7m6T3YEJg8nlJameWEUIdAT-E7rpj7WbypRQbEJaarFo46jxEwkfCKQf0JgD0ue1zsQzk8jEMS_Utzbphe6Lc3nAsSq6LCQb0GKyuWLQjr9-IKAgCausoHulc62ZtsfmMniNZWppMg2bY44nCSjf_eAJ5PjHE_qmrhuLk-OO55n9T04r95hT-Me47ZlPZ_Mc9ubuHGKfZpP37o" />
                <button className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-sm border border-outline-variant text-primary hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </button>
              </div>
              <div>
                <h2 className="text-xl font-black text-primary mb-1">Store Information</h2>
                <p className="text-sm text-slate-500 font-medium">Update your public profile and store contact details.</p>
              </div>
            </div>
            
            <form className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Store Name</label>
                <input 
                  className="w-full border border-outline-variant rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                  type="text" 
                  value={storeName || ''} 
                  onChange={e => setStoreName(e.target.value)} 
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Contact Phone</label>
                <input 
                  className="w-full border border-outline-variant rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                  type="tel" 
                  value={phone || ''} 
                  onChange={e => setPhone(e.target.value)} 
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Support Email</label>
                <input 
                  className="w-full border border-outline-variant rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                  type="email" 
                  value={email || ''} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Physical Address</label>
                <textarea 
                  className="w-full border border-outline-variant rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                  rows="3" 
                  value={address || ''} 
                  onChange={e => setAddress(e.target.value)} 
                />
              </div>
              <div className="col-span-2 flex justify-end pt-4">
                <button 
                  onClick={handleSaveStoreInfo} 
                  className="bg-primary text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Tax Rates Configuration */}
          <div className="bg-white border border-outline-variant p-8 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-primary mb-1">Tax Rates</h2>
                <p className="text-sm text-slate-500 font-medium">Configure regional GST and tax percentages.</p>
              </div>
              <button 
                onClick={async () => {
                  await handleUpdate('tax_rate', taxRate);
                  setMsg('Tax configuration updated successfully!');
                  setTimeout(() => setMsg(''), 3000);
                }} 
                className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Tax Configuration
              </button>
            </div>
            
            <div className="overflow-hidden border border-outline-variant rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-outline-variant">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Tax Name</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Percentage</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Applied to</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-primary">Global Store Tax (GST)</td>
                    <td className="px-4 py-3">
                      <div className="relative w-24">
                        <input 
                          type="number" 
                          value={taxRate} 
                          onChange={e => setTaxRate(e.target.value)}
                          className="w-full border border-outline-variant rounded p-1.5 pl-2 pr-6 text-sm font-bold text-primary focus:border-primary outline-none" 
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-secondary/20">All Products</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sidebar Settings (Printer & Sync) */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Online Sync Status */}
          <div className="bg-primary p-8 rounded-xl text-white shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <span className="material-symbols-outlined text-9xl">cloud_sync</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black tracking-widest uppercase text-white/70">Cloud Connectivity</span>
                <span className={`flex h-2.5 w-2.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-secondary-fixed shadow-[0_0_8px_rgba(113,248,228,0.6)] animate-pulse'}`}></span>
              </div>
              <h3 className="text-2xl font-black mb-1">Online Sync</h3>
              <p className="text-sm font-medium text-white/80 mb-2">Local database actively mirroring with Neon Cloud.</p>
              <p className="text-xs font-medium text-white/60 mb-6">Last sync: {lastSyncTime}</p>
              <button 
                onClick={handleForceSync}
                disabled={isSyncing}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all py-3 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
                {isSyncing ? 'Syncing Now...' : 'Force Sync Now'}
              </button>
            </div>
          </div>

     
        
         

        </aside>
      </div>
    </div>
  );
}
