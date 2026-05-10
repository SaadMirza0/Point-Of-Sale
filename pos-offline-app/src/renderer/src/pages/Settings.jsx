import React, { useState, useEffect } from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { validateTaxRate, validateStockThreshold } from '../utils/validation';

const Settings = () => {
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_contact: '',
    store_email: 'saadmirzapak@gmail.com',
    tax_rate: 0,
    currency_symbol: 'Rs.',
    low_stock_threshold: 10,
  });
 
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

 

    loadAllSettings();
    
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
             
              </div>
            </div>
            
          <div className="w-full overflow-hidden border border-outline-variant/30 rounded-2xl bg-surface shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[600px]">
      <thead className="bg-surface-container-low/50 border-b border-outline-variant">
        <tr>
          <th className="px-6 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black">Parameter Detail</th>
          <th className="px-6 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black">Value Configuration</th>
          <th className="px-6 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black">System Scope</th>
          <th className="px-6 py-4 text-[10px] text-outline uppercase tracking-[0.2em] font-black text-right">Settings</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/20">
        {/* Row 1: Standard GST */}
        <tr className="hover:bg-primary-container/5 transition-all duration-200 group">
          <td className="px-6 py-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-primary font-black text-sm tracking-tight">Standard GST</span>
              <span className="text-[10px] text-outline font-bold uppercase tracking-wider opacity-60">Sales Tax Rate</span>
            </div>
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center group/input w-fit">
              <input 
                type="number" 
                className="bg-surface-container-highest/30 border border-outline-variant/50 rounded-l-xl px-4 py-2 w-24 text-sm font-data-mono outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                value={settings.tax_rate}
                onChange={(e) => handleSettingChange('tax_rate', validateTaxRate(e.target.value))}
              />
              <span className="bg-surface-container border border-l-0 border-outline-variant/50 rounded-r-xl px-3 py-2 text-outline text-[11px] font-black tracking-tighter">
                %
              </span>
            </div>
          </td>
          <td className="px-6 py-5">
            <span className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-secondary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Global Applied
            </span>
          </td>
          <td className="px-6 py-5 text-right">
            <button className="p-2 hover:bg-surface-container-high rounded-xl transition-all text-outline hover:text-primary active:scale-90">
              <svg xmlns="http://w3.org" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </td>
        </tr>

        {/* Row 2: Low Stock Threshold */}
        <tr className="hover:bg-primary-container/5 transition-all duration-200 group">
          <td className="px-6 py-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-primary font-black text-sm tracking-tight">Low Stock Threshold</span>
              <span className="text-[10px] text-outline font-bold uppercase tracking-wider opacity-60">Inventory Warning</span>
            </div>
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center group/input w-fit">
              <input 
                type="number" 
                className="bg-surface-container-highest/30 border border-outline-variant/50 rounded-l-xl px-4 py-2 w-24 text-sm font-data-mono outline-none focus:ring-2 focus:ring-error/20 focus:border-error text-error transition-all"
                value={settings.low_stock_threshold}
                onChange={(e) => handleSettingChange('low_stock_threshold', validateStockThreshold(e.target.value))}
              />
              <span className="bg-surface-container border border-l-0 border-outline-variant/50 rounded-r-xl px-3 py-2 text-outline text-[11px] font-black tracking-tighter">
                Units
              </span>
            </div>
          </td>
          <td className="px-6 py-5">
            <span className="inline-flex items-center gap-2 bg-error-container/10 text-error px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-error/20">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              System Alert
            </span>
          </td>
          <td className="px-6 py-5 text-right">
            <button className="p-2 hover:bg-surface-container-high rounded-xl transition-all text-outline hover:text-primary active:scale-90">
              <svg xmlns="http://w3.org" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

          </div>
        </section>

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
              <p className="text-body-md text-white/70 mb-10 leading-relaxed font-medium">Last full mirror sync completed 1 minute ago all transactional data is securely backed up.</p>
             
            </div>
            {/* Background Decoration */}
          
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

