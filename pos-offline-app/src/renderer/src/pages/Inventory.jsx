import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePrice, validateStock } from '../utils/validation';

const Inventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalValue: 0, lowStockCount: 0, soldToday: 0 });

  const barcodeRef = useRef(null);
  const nameRef = useRef(null);
  const brandRef = useRef(null);
  const categoryRef = useRef(null);
  const sizeRef = useRef(null);
  const unitRef = useRef(null);
  const priceRef = useRef(null);
  const stockRef = useRef(null);

  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    brand: '',
    category: '',
    size: '',
    unit: '',
    price: 0,
    stock: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProducts = async () => {
    if (!window.posAPI) return;
    try {
      const data = await window.posAPI.getAllProducts();
      const dashboard = await window.posAPI.getDashboardStats();
      
      const productsData = data || [];
      setProducts(productsData);

      // Calculate stats
      const totalVal = productsData.reduce((acc, p) => acc + (p.sale_price * p.stock_quantity), 0);
      const lowStock = productsData.filter(p => p.stock_quantity < 10).length;
      
      setStats({
        totalValue: totalVal,
        lowStockCount: lowStock,
        soldToday: dashboard?.totalOrders || 0
      });
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    loadProducts();
    const removeListener = window.posAPI.onDatabaseUpdated(() => {
      loadProducts();
    });
    return () => removeListener?.();
  }, []);

  const handleKeyDown = (e, target) => {
    if (e.key === 'Enter') {
      if (target && target.current) {
        e.preventDefault();
        target.current.focus();
      } else if (typeof target === 'function') {
        e.preventDefault();
        target(e);
      }
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'price') value = validatePrice(value);
    else if (field === 'stock') value = validateStock(value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.barcode || !formData.name) {
        alert("Please fill in all required fields");
        return;
      }

      const result = isEditing 
        ? await window.posAPI.updateProduct(formData)
        : await window.posAPI.addProduct(formData);

      if (result.success) {
        setFormData({ barcode: '', name: '', brand: '', category: '', size: '', unit: '', price: 0, stock: 0 });
        setIsEditing(false);
        setIsModalOpen(false);
        loadProducts();
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      category: product.category,
      size: product.size,
      unit: product.unit_type,
      price: product.sale_price,
      stock: product.stock_quantity
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (barcode) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const result = await window.posAPI.deleteProduct(barcode);
      if (result.success) loadProducts();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-surface flex flex-col">
      {/* TopAppBar */}
      <header className="flex justify-between items-center h-16 px-8 w-full sticky top-0 bg-white border-b border-outline-variant z-30 antialiased shadow-none">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md w-full group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-container">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary-container text-body-md transition-all" 
              placeholder="Search by Barcode or Name..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-6">

          <div className="h-8 w-[1px] bg-outline-variant"></div>
          <button 
            onClick={() => navigate('/sell')}
            className="flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Sale</span>
          </button>
        </div>
      </header>

      <div className="flex-1 p-margin space-y-lg overflow-y-auto custom-scrollbar">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-headline-xl font-bold text-primary-container">Inventory Management</h1>
            <p className="text-body-lg text-on-surface-variant">Manage your product catalog and stock levels.</p>
          </div>
          <div className="flex gap-sm">
         
            <button 
              onClick={() => {
                setIsEditing(false);
                setFormData({ barcode: '', name: '', brand: '', category: '', size: '', unit: '', price: 0, stock: 0 });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded-lg font-semibold hover:opacity-95 transition-colors shadow-lg shadow-primary-container/20"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Inventory Stats */}
        <div className="grid grid-cols-3 gap-gutter mb-gutter">
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">Total Value</p>
              <h3 className="text-headline-xl font-bold text-primary mt-1">Rs. {stats.totalValue.toLocaleString()}</h3>
            </div>
            <div className="flex items-center gap-1 text-secondary font-bold text-xs uppercase tracking-tighter">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Real-time estimate</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">Low Stock</p>
              <h3 className={`text-headline-xl font-bold mt-1 ${stats.lowStockCount > 0 ? 'text-error' : 'text-secondary'}`}>
                {stats.lowStockCount} Items
              </h3>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs uppercase tracking-tighter">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>Needs attention</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">Items Sold</p>
              <h3 className="text-headline-xl font-bold text-primary-container mt-1">{stats.soldToday} Today</h3>
            </div>
            <div className="flex items-center gap-1 text-secondary font-bold text-xs uppercase tracking-tighter">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Sync complete</span>
            </div>
          </div>
        </div>

        {/* Full Width Product Table */}
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="w-[25%] px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider">Product Name & Barcode</th>
                  <th className="w-[15%] px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider">Brand</th>
                  <th className="w-[15%] px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider">Category</th>
                  <th className="w-[12%] px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Size/Unit</th>
                  <th className="w-[12%] px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Price</th>
                  <th className="w-[10%] px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Stock</th>
                  <th className="w-[11%] px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-on-surface-variant italic">No products found. Click "Add Product" to start.</td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.barcode} className="hover:bg-surface-container-low transition-colors h-14">
                      <td className="px-6 py-3">
                        <p className="font-bold text-primary-container truncate" title={p.name}>{p.name}</p>
                        <p className="text-[11px] text-outline font-data-mono tracking-tighter">{p.barcode}</p>
                      </td>
                      <td className="px-6 py-3 text-body-md text-on-surface truncate">{p.brand || '---'}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded bg-secondary-container/20 text-secondary text-[10px] font-black uppercase">
                          {p.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-data-mono">{p.size} {p.unit_type}</td>
                      <td className="px-6 py-3 text-right text-data-mono text-primary-container font-black">Rs. {p.sale_price.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-data-mono font-bold ${p.stock_quantity < 10 ? 'text-error' : 'text-on-surface'}`}>
                            {p.stock_quantity}
                          </span>
                          <div className="w-12 h-1 bg-surface-container rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${p.stock_quantity < 10 ? 'bg-error' : 'bg-secondary'}`} 
                              style={{ width: `${Math.min(100, (p.stock_quantity / 100) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => handleEditClick(p)}
                            className="p-2 hover:bg-primary-container hover:text-white rounded-lg text-primary-container transition-all"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(p.barcode)}
                            className="p-2 hover:bg-error hover:text-white rounded-lg text-error transition-all"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant">
            <span className="text-sm text-on-surface-variant font-medium">Total: {products.length} Products</span>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg border border-outline-variant hover:bg-white text-outline disabled:opacity-30" disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-sm font-bold px-3">Page 1</span>
              <button className="p-1.5 rounded-lg border border-outline-variant hover:bg-white text-outline disabled:opacity-30" disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="bg-primary-container p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-headline-md font-bold">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                <p className="text-xs opacity-70 uppercase tracking-widest mt-1">Product Details Entry</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1">
                  <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Barcode (Primary Key)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">barcode_scanner</span>
                    <input 
                      ref={barcodeRef}
                      required
                      autoFocus
                      className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 pl-11 pr-4 border outline-none transition-all" 
                      placeholder="Scan product barcode..." 
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, nameRef)}
                      readOnly={isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Product Name</label>
                  <input 
                    ref={nameRef}
                    required
                    className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 px-4 border outline-none transition-all" 
                    placeholder="Enter full product name..."
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, brandRef)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Brand</label>
                    <input 
                      ref={brandRef}
                      className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 px-4 border outline-none" 
                      placeholder="e.g. Nestle"
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, categoryRef)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Category</label>
                    <input 
                      ref={categoryRef}
                      className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 px-4 border outline-none" 
                      placeholder="e.g. Beverages"
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, sizeRef)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Size</label>
                    <input 
                      ref={sizeRef}
                      className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 px-4 border outline-none" 
                      placeholder="e.g. 500"
                      type="text"
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, unitRef)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Unit Type</label>
                    <input 
                      ref={unitRef}
                      className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 px-4 border outline-none" 
                      placeholder="e.g. ml, kg, pcs"
                      type="text"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, priceRef)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Sale Price (PKR)</label>
                    <input 
                      ref={priceRef}
                      required
                      className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 px-4 border outline-none font-bold text-primary-container" 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, stockRef)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant block uppercase tracking-tight font-bold">Current Stock</label>
                    <input 
                      ref={stockRef}
                      required
                      className="w-full border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md py-3 px-4 border outline-none font-bold" 
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleSave)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3.5 rounded-xl border border-outline text-primary-container font-bold hover:bg-surface-container transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] px-6 py-3.5 bg-primary-container text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20"
                >
                  <span className="material-symbols-outlined">{isEditing ? 'published_with_changes' : 'save_as'}</span>
                  <span>{isEditing ? 'Update Product' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Inventory;

