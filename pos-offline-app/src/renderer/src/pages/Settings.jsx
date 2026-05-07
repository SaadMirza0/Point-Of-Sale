import React, { useState, useEffect } from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { validateTaxRate, validateStockThreshold } from '../utils/validation';

const Settings = () => {
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_contact: '',
    store_email: 'ops@retailos.com',
    tax_rate: 0,
    currency_symbol: 'Rs.',
    low_stock_threshold: 10,
    auto_print: true,
    ui_density: 'Comfortable',
    selected_printer: ''
  });
  const [printers, setPrinters] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAllSettings = async () => {
      const keys = Object.keys(settings);
      const loadedSettings = {};
      for (const key of keys) {
        const val = await window.posAPI.getSetting(key);
        if (key === 'tax_rate' || key === 'low_stock_threshold') {
          loadedSettings[key] = val ? parseFloat(val) : settings[key];
        } else if (key === 'auto_print') {
          loadedSettings[key] = val === 'true';
        } else {
          loadedSettings[key] = val || settings[key];
        }
      }
      setSettings(prev => ({ ...prev, ...loadedSettings }));
    };

    const loadPrinters = async () => {
      try {
        const list = await window.posAPI.getPrinters();
        setPrinters(list || []);
      } catch (err) {
        console.error("Printer load error");
      }
    };

    loadAllSettings();
    loadPrinters();
  }, []);

  const saveSettingAsync = async (key, value) => {
    try {
      setError('');
      const stringValue = typeof value === 'boolean' ? value.toString() : value;
      const result = await window.posAPI.saveSetting(key, stringValue);
      if (result.success) {
        setStatus(`Saved ${key.replace('_', ' ')}!`);
        setTimeout(() => setStatus(''), 2000);
      } else {
        setError(`Failed to save ${key.replace('_', ' ')}`);
      }
    } catch (err) {
      setError(`Error saving ${key.replace('_', ' ')}: ${err.message}`);
    }
  };

  const debouncedSave = useDebouncedCallback(saveSettingAsync, 1200);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    debouncedSave(key, value);
  };

  const handleTestPrint = async () => {
    try {
      const selectedPrinter = await window.posAPI.getSetting('selected_printer');
      window.posAPI.printReceipt({
        items: [{ name: 'Test Transaction', qty: 1, sale_price: 0 }],
        total: 0,
        method: 'TEST PRINT',
        storeName: settings.store_name || 'My Store',
        storeAddress: settings.store_address,
        storeContact: settings.store_contact,
        taxAmount: 0,
        discount: 0,
        selectedPrinter
      });
      setStatus("Test print signal sent!");
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setError("Failed to communicate with printer");
    }
  };

  return (
    <main className="flex-1 p-margin bg-surface overflow-y-auto custom-scrollbar">
      
      {/* Notifications */}
      {status && (
        <div className="fixed top-8 right-8 z-[100] bg-secondary-container text-secondary px-6 py-4 rounded-2xl shadow-xl border border-secondary/20 flex items-center gap-3 animate-in fade-in slide-in-from-right duration-300">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-black uppercase text-[10px] tracking-widest">{status}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-8 right-8 z-[100] bg-error-container text-error px-6 py-4 rounded-2xl shadow-xl border border-error/20 flex items-center gap-3 animate-in fade-in slide-in-from-right duration-300">
          <span className="material-symbols-outlined">error</span>
          <span className="font-black uppercase text-[10px] tracking-widest">{error}</span>
        </div>
      )}

      <header className="mb-lg max-w-[1400px] mx-auto">
        <h1 className="text-headline-xl text-primary-container mb-xs uppercase tracking-tight">Settings & Profile</h1>
        <p className="text-body-lg text-on-surface-variant font-medium">Manage your retail environment, hardware, and operational parameters.</p>
      </header>

      <div className="grid grid-cols-12 gap-gutter max-w-[1400px] mx-auto">
        
        {/* Profile & Store Info Card */}
        <section className="col-span-12 lg:col-span-8 space-y-lg">
          <div className="bg-white border border-outline-variant p-lg rounded-3xl shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container/10"></div>
            
            <div className="flex items-center gap-lg mb-xl">
            
              <div>
                <h2 className="text-headline-md text-primary-container uppercase tracking-tight font-black">Store Information</h2>
                <p className="text-body-md text-outline font-medium">Update your public profile and store contact details.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="col-span-2">
                <label className="block text-label-sm text-outline mb-2 uppercase font-black tracking-widest">Store Name</label>
                <input 
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container/20 focus:bg-white rounded-2xl px-md py-4 text-body-md font-bold text-primary-container outline-none transition-all" 
                  type="text" 
                  value={settings.store_name}
                  onChange={(e) => handleSettingChange('store_name', e.target.value)}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-label-sm text-outline mb-2 uppercase font-black tracking-widest">Contact Phone</label>
                <input 
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container/20 focus:bg-white rounded-2xl px-md py-4 text-body-md font-bold text-primary-container outline-none transition-all" 
                  type="tel" 
                  value={settings.store_contact}
                  onChange={(e) => handleSettingChange('store_contact', e.target.value)}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-label-sm text-outline mb-2 uppercase font-black tracking-widest">Support Email</label>
                <input 
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container/20 focus:bg-white rounded-2xl px-md py-4 text-body-md font-bold text-primary-container outline-none transition-all" 
                  type="email" 
                  value={settings.store_email}
                  onChange={(e) => handleSettingChange('store_email', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-label-sm text-outline mb-2 uppercase font-black tracking-widest">Physical Address</label>
                <textarea 
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container/20 focus:bg-white rounded-2xl px-md py-4 text-body-md font-bold text-primary-container outline-none transition-all resize-none" 
                  rows="3"
                  value={settings.store_address}
                  onChange={(e) => handleSettingChange('store_address', e.target.value)}
                ></textarea>
              </div>
              <div className="col-span-2 flex justify-between items-center pt-md border-t border-outline-variant/30 mt-4">
                <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">All changes are saved automatically</p>
                <button className="bg-primary-container text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary-container/20">
                  REFRESH PROFILE
                </button>
              </div>
            </div>
          </div>

          {/* Tax Rates Configuration */}
          <div className="bg-white border border-outline-variant p-lg rounded-3xl shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
            <div className="flex items-center justify-between mb-lg">
              <div>
                <h2 className="text-headline-md text-primary-container uppercase tracking-tight font-black">Tax & Financials</h2>
                <p className="text-body-md text-outline font-medium">Configure regional GST and tax percentages.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center bg-surface-container-low rounded-xl px-4 py-2 border border-outline-variant/30">
                  <span className="text-[10px] font-black text-outline uppercase mr-3">Currency</span>
                  <input 
                    type="text"
                    className="bg-transparent font-black text-primary-container w-12 outline-none text-center"
                    value={settings.currency_symbol}
                    onChange={(e) => handleSettingChange('currency_symbol', e.target.value)}
                  />
                </div>
                <button className="flex items-center gap-2 text-secondary font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform bg-secondary-container/10 px-4 py-2 rounded-xl border border-secondary/20">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  ADD NEW RULE
                </button>
              </div>
            </div>
            
            <div className="overflow-hidden border border-outline-variant/50 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-4 text-label-sm text-outline uppercase tracking-widest font-black">Tax Parameter</th>
                    <th className="px-6 py-4 text-label-sm text-outline uppercase tracking-widest font-black">Percentage</th>
                    <th className="px-6 py-4 text-label-sm text-outline uppercase tracking-widest font-black">Scope</th>
                    <th className="px-6 py-4 text-label-sm text-outline uppercase tracking-widest font-black text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-bold">
                  <tr className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-5 text-primary-container">Standard GST</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="bg-white border border-outline-variant/50 rounded-lg px-3 py-1.5 w-20 text-center font-data-mono outline-none focus:border-secondary"
                          value={settings.tax_rate}
                          onChange={(e) => handleSettingChange('tax_rate', validateTaxRate(e.target.value))}
                        />
                        <span className="text-outline text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-secondary/20">Global Applied</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-outline hover:text-primary-container transition-colors group-hover:scale-110 transform duration-300">
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-5 text-primary-container">Low Stock Threshold</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="bg-white border border-outline-variant/50 rounded-lg px-3 py-1.5 w-20 text-center font-data-mono outline-none focus:border-error text-error"
                          value={settings.low_stock_threshold}
                          onChange={(e) => handleSettingChange('low_stock_threshold', validateStockThreshold(e.target.value))}
                        />
                        <span className="text-outline text-xs">Units</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-error-container/10 text-error px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-error/20">System Alert</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-outline hover:text-primary-container transition-colors group-hover:scale-110 transform duration-300">
                        <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sidebar Settings (Printer & Sync) */}
        <aside className="col-span-12 lg:col-span-4 space-y-lg">
          
          {/* Online Sync Status */}
          <div className="bg-primary-container p-10 rounded-[2.5rem] text-white shadow-2xl shadow-primary-container/30 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Cloud Connectivity</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-secondary-container uppercase tracking-widest">Connected</span>
                  <span className="flex h-2 w-2 rounded-full bg-secondary-container animate-pulse shadow-[0_0_8px_rgba(109,245,225,1)]"></span>
                </div>
              </div>
              <h3 className="text-headline-md font-black uppercase mb-2">Real-Time Sync</h3>
              <p className="text-body-md text-white/70 mb-10 leading-relaxed font-medium">Last full mirror sync completed 2 minutes ago. All transactional data is securely backed up.</p>
              <button className="w-full bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[20px] animate-spin-slow">sync</span>
                Force Cloud Refresh
              </button>
            </div>
            {/* Background Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          </div>

          {/* Printer Configuration */}
          <div className="bg-white border border-outline-variant p-lg rounded-3xl shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container/10"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-2xl">print</span>
              </div>
              <div>
                <h3 className="text-headline-md text-primary-container uppercase tracking-tight font-black leading-none">Hardware</h3>
                <p className="text-[10px] text-outline font-black uppercase tracking-widest mt-1">Peripheral Mgmt</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-label-sm text-outline mb-3 uppercase font-black tracking-widest">Receipt Printer</label>
                <div className="relative group">
                  <select 
                    value={settings.selected_printer}
                    onChange={(e) => handleSettingChange('selected_printer', e.target.value)}
                    className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary-container/20 rounded-2xl px-md py-4 text-body-md font-bold text-primary-container outline-none appearance-none transition-all"
                  >
                    <option value="">Default System Printer</option>
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none group-focus-within:rotate-180 transition-transform">expand_more</span>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-outline uppercase tracking-widest">Status</span>
                  <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-secondary/20">READY</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleTestPrint}
                    className="flex-1 text-[10px] font-black py-3 border border-outline-variant/50 rounded-xl bg-white hover:bg-primary-container hover:text-white transition-all uppercase tracking-widest shadow-sm"
                  >
                    Test Print
                  </button>
                  <button className="flex-1 text-[10px] font-black py-3 border border-outline-variant/50 rounded-xl bg-white hover:bg-primary-container hover:text-white transition-all uppercase tracking-widest shadow-sm">Identify</button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-body-md font-black text-primary-container uppercase tracking-tight">Auto-print Receipts</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.auto_print}
                    onChange={(e) => handleSettingChange('auto_print', e.target.checked)}
                  />
                  <div className="w-14 h-8 bg-surface-container rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-outline-variant/20 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* UI Performance Card */}
          <div className="bg-surface-container-high/40 border-2 border-dashed border-outline-variant p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-headline-md font-black text-primary-container uppercase mb-2">Display Density</h3>
              <p className="text-body-md text-outline font-medium mb-8 leading-relaxed">Optimize the interface for your screen resolution and scanner speed.</p>
              <div className="flex bg-white/50 p-1.5 rounded-2xl border border-outline-variant/30 backdrop-blur-sm">
                {['Comfortable', 'Compact'].map((density) => (
                  <button 
                    key={density}
                    onClick={() => handleSettingChange('ui_density', density)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      settings.ui_density === density 
                      ? 'bg-primary-container text-white shadow-lg' 
                      : 'text-outline hover:text-primary-container'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
            <span className="material-symbols-outlined absolute -bottom-8 -right-8 text-[140px] text-primary-container/5 select-none pointer-events-none group-hover:scale-110 transition-transform duration-1000">grid_view</span>
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 52, 65, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 52, 65, 0.2); }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </main>
  );
};

export default Settings;

