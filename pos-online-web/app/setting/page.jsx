"use client";
import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '@/lib/actions';

export default function WebSettings() {
  const [storeName, setStoreName] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setStoreName(await getSetting('store_name'));
      setTaxRate(await getSetting('tax_rate'));
    };
    load();
  }, []);

  const handleUpdate = async (key, val) => {
    await saveSetting(key, val);
    setMsg(`Updated ${key}!`);
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div className="p-8 bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-8 uppercase">Cloud Settings</h1>
      {msg && <div className="bg-blue-600 text-white p-2 mb-4 font-bold text-center uppercase">{msg}</div>}

      <div className="max-w-md space-y-8">
        <div className="flex flex-col">
          <label className="font-black uppercase text-xs mb-1">Global Store Name</label>
          <input className="border-2 border-black p-3 font-bold" value={storeName} onChange={e => setStoreName(e.target.value)} />
          <button onClick={() => handleUpdate('store_name', storeName)} className="bg-black text-white p-2 mt-2 font-bold uppercase text-xs">Update Name</button>
        </div>

        <div className="flex flex-col">
          <label className="font-black uppercase text-xs mb-1">Global Tax Rate (%)</label>
          <input type="number" className="border-2 border-black p-3 font-bold" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
          <button onClick={() => handleUpdate('tax_rate', taxRate)} className="bg-blue-600 text-white p-2 mt-2 font-bold uppercase text-xs">Update Tax</button>
        </div>
      </div>
    </div>
  );
}
