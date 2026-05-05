import React, { useState, useEffect } from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { validateTaxRate, validateStockThreshold } from '../utils/validation';

const Settings = () => {
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_contact: '',
    tax_rate: 0,
    currency_symbol: 'Rs.',
    low_stock_threshold: 10
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
        } else {
          loadedSettings[key] = val || settings[key];
        }
      }
      setSettings(loadedSettings);
    };
    loadAllSettings();
  }, []);

  const saveSettingAsync = async (key, value) => {
    try {
      setError('');
      const result = await window.posAPI.saveSetting(key, value);
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
    <div className="p-8 bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-6 uppercase">System Settings</h1>

      {status && (
        <div className="fixed top-4 right-4 bg-black text-white px-6 py-2 font-bold animate-bounce">
          {status}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-2 font-bold animate-bounce">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* --- SECTION 1: STORE IDENTITY --- */}
        <section className="space-y-6">
          <h2 className="text-lg font-black uppercase border-l-4 border-black pl-3">Store Details</h2>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase text-gray-500">Store Name (Shows on Bills)</label>
            <input
              type="text"
              className="border-2 border-black p-2 mt-1 outline-none focus:bg-yellow-50"
              value={settings.store_name}
              onChange={(e) => handleSettingChange('store_name', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase text-gray-500">Store Address</label>
            <textarea
              className="border-2 border-black p-2 mt-1 outline-none focus:bg-yellow-50 h-20"
              value={settings.store_address}
              onChange={(e) => handleSettingChange('store_address', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase text-gray-500">Contact Number</label>
            <input
              type="text"
              className="border-2 border-black p-2 mt-1 outline-none"
              value={settings.store_contact}
              onChange={(e) => handleSettingChange('store_contact', e.target.value)}
            />
          </div>
        </section>

        {/* --- SECTION 2: FINANCIALS & APP LOGIC --- */}
        <section className="space-y-6">
          <h2 className="text-lg font-black uppercase border-l-4 border-blue-600 pl-3">Financials & Logic</h2>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase text-gray-500">Tax Rate (%) - Applies to Sell Page</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="border-2 border-black p-2 mt-1 outline-none w-24"
                min="0"
                max="100"
                step="0.01"
                value={settings.tax_rate}
                onChange={(e) => handleSettingChange('tax_rate', validateTaxRate(e.target.value))}
              />
              <span className="font-bold">%</span>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase text-gray-500">Currency Symbol</label>
            <input
              type="text"
              className="border-2 border-black p-2 mt-1 outline-none w-24"
              placeholder="Rs. or $"
              value={settings.currency_symbol}
              onChange={(e) => handleSettingChange('currency_symbol', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase text-gray-500">Low Stock Warning Threshold</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="border-2 border-black p-2 mt-1 outline-none w-24 text-red-600 font-bold"
                min="0"
                step="1"
                value={settings.low_stock_threshold}
                onChange={(e) => handleSettingChange('low_stock_threshold', validateStockThreshold(e.target.value))}
              />
              <span className="text-xs font-bold italic">Units (Items below this show as "Low Stock" on Dashboard)</span>
            </div>
          </div>
        </section>

      </div>

      <div className="mt-12 p-4 bg-gray-100 border-2 border-dashed border-gray-400 text-center text-xs font-bold uppercase text-gray-500">
        Changes are saved automatically to your local SQLite Database.
      </div>
    </div>
  );
};

export default Settings;
