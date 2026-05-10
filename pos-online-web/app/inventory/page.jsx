"use client";
import { useState, useEffect, useRef } from 'react';
import { getProducts, saveProduct, deleteProduct } from '@/lib/actions';

export default function WebInventory() {
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. ALL REFS (Matching Electron for Enter Key Flow)
  const barcodeRef = useRef(null);
  const nameRef = useRef(null);
  const brandRef = useRef(null);
  const categoryRef = useRef(null);
  const sizeRef = useRef(null);
  const unitRef = useRef(null);
  const priceRef = useRef(null);
  const stockRef = useRef(null);

  const [formData, setFormData] = useState({
    barcode: '', name: '', brand: '', category: '', size: '', unit: '', price: 0, stock: 0
  });

  const loadData = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    barcodeRef.current?.focus();
  }, []);

  const handleKeyDown = (e, nextFieldRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextFieldRef?.current?.focus();
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const result = await saveProduct(formData, isEditing);
    if (result.success) {
      setFormData({ barcode: '', name: '', brand: '', category: '', size: '', unit: '', price: 0, stock: 0 });
      setIsEditing(false);
      loadData();
      barcodeRef.current?.focus();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalValue = products.reduce((acc, p) => acc + (p.sale_price * p.stock_quantity), 0);
  const lowStockCount = products.filter(p => p.stock_quantity < 10).length;

  if (loading && products.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-primary animate-pulse uppercase tracking-widest text-xs">Loading Catalog...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary mb-1">Inventory Management</h1>
          <p className="text-sm text-on-surface-variant font-medium">Manage your product catalog and stock levels.</p>
        </div>
        <div className="flex gap-4">
         
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({ barcode: '', name: '', brand: '', category: '', size: '', unit: '', price: 0, stock: 0 });
              barcodeRef.current?.focus();
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">inventory</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Inventory List (Main Area) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Inventory Value</p>
                <h3 className="text-2xl font-black text-primary mt-1">Rs. {totalValue.toLocaleString()}</h3>
              </div>
              <div className="flex items-center gap-1 text-secondary font-bold text-[10px]">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Active Stock Value</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Stock Items</p>
                <h3 className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-error' : 'text-secondary'}`}>
                  {lowStockCount}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Requires Attention</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catalog Items</p>
                <h3 className="text-2xl font-black text-primary-container mt-1">{products.length}</h3>
              </div>
              <div className="flex items-center gap-1 text-secondary font-bold text-[10px]">
                <span className="material-symbols-outlined text-[14px]">category</span>
                <span>Unique Products</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex-1">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Filter by Name, Brand, or Barcode..."
                  type="text"
                />
              </div>
            </div>
            <div className="overflow-x-auto h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-outline-variant">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Stock</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.barcode} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary border border-outline-variant group-hover:bg-white transition-colors">
                            <span className="material-symbols-outlined text-xl">inventory_2</span>
                          </div>
                          <div>
                            <p className="font-bold text-primary text-sm">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.brand} • {p.barcode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary text-[10px] font-black uppercase tracking-tighter border border-secondary-container/10">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-sm text-primary">
                        Rs. {p.sale_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-sm font-black ${p.stock_quantity < 10 ? 'text-error' : 'text-primary'}`}>
                            {p.stock_quantity} {p.unit_type}
                          </span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all ${p.stock_quantity < 10 ? 'bg-error' : 'bg-secondary'}`}
                              style={{ width: `${Math.min((p.stock_quantity / 100) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setFormData({ barcode: p.barcode, name: p.name, brand: p.brand, category: p.category, size: p.size, unit: p.unit_type, price: p.sale_price, stock: p.stock_quantity });
                              setIsEditing(true);
                              nameRef.current?.focus();
                            }}
                            className="p-2 bg-surface-container hover:bg- rounded-lg text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete ${p.name}?`)) { await deleteProduct(p.barcode); loadData(); }
                            }}
                            className="p-2 bg-surface-container rounded-lg text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-outline-variant">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Showing {filteredProducts.length} of {products.length} catalog items
              </span>
            </div>
          </div>
        </div>

        {/* Quick Add/Edit Form (Side Area) */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white p-8 rounded-xl border border-outline-variant shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-primary uppercase tracking-wider">
                {isEditing ? 'Edit Product' : 'Quick Add'}
              </h2>
              <span className="material-symbols-outlined text-slate-300">
                {isEditing ? 'edit_note' : 'barcode_scanner'}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Barcode</label>
                <input
                  ref={barcodeRef}
                  disabled={isEditing}
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, nameRef)}
                  className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 px-4 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="Scan or type barcode..."
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Product Name</label>
                <input
                  ref={nameRef}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, brandRef)}
                  className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 px-4 outline-none transition-all"
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Brand</label>
                  <input
                    ref={brandRef}
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    onKeyDown={e => handleKeyDown(e, categoryRef)}
                    className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 px-4 outline-none transition-all"
                    type="text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Category</label>
                  <input
                    ref={categoryRef}
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    onKeyDown={e => handleKeyDown(e, sizeRef)}
                    className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 px-4 outline-none transition-all"
                    placeholder="e.g. Beverages"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Size</label>
                  <input
                    ref={sizeRef}
                    value={formData.size}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    onKeyDown={e => handleKeyDown(e, unitRef)}
                    className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 px-4 outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Unit</label>
                  <select
                    ref={unitRef}
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    onKeyDown={e => handleKeyDown(e, priceRef)}
                    className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 px-4 outline-none transition-all bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="pcs">pcs</option>
                    <option value="Bag">Bag</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Sale Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">Rs.</span>
                    <input
                      ref={priceRef}
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      onKeyDown={e => handleKeyDown(e, stockRef)}
                      className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 pl-10 pr-4 outline-none transition-all"
                      type="number"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.1em]">Stock Qty</label>
                  <input
                    ref={stockRef}
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm py-2.5 px-4 outline-none transition-all"
                    type="number"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ barcode: '', name: '', brand: '', category: '', size: '', unit: '', price: 0, stock: 0 });
                    }}
                    className="flex-1 border border-outline-variant text-slate-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">{isEditing ? 'save' : 'cloud_upload'}</span>
                  <span>{isEditing ? 'Update Item' : 'Add to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
