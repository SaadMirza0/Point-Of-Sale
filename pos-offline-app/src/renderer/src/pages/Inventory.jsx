import React, { useState, useEffect, useRef } from 'react';
import { validatePrice, validateStock } from '../utils/validation';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
const [searchTerm, setSearchTerm] = useState('');

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

  // In Inventory.jsx and SellPage.jsx
const loadProducts = async () => {
  if (!window.posAPI) {
    console.warn("Running in browser: Database access disabled.");
    return;
  }
  try {
    const data = await window.posAPI.getAllProducts();
    setProducts(data || []);
  } catch (err) {
    console.error("Failed to load products:", err);
  }
};

useEffect(() => {
  loadProducts();
  barcodeRef.current?.focus();

  // Now 'removeListener' will be the function we defined above
  const removeListener = window.posAPI.onDatabaseUpdated(() => {
    console.log("Sync detected: Refreshing Inventory...");
    loadProducts();
  });

  return () => {
    if (typeof removeListener === 'function') {
      removeListener();
    }
  };
}, []);


  const handleKeyDown = (e, nextFieldRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextFieldRef && nextFieldRef.current) {
        nextFieldRef.current.focus();
      }
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'price') {
      value = validatePrice(value);
    } else if (field === 'stock') {
      value = validateStock(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.barcode || !formData.name || formData.price === '' || formData.stock === '') {
        alert("Please fill in all required fields");
        return;
      }

      let result;
      if (isEditing) {
        result = await window.posAPI.updateProduct(formData);
      } else {
        result = await window.posAPI.addProduct(formData);
      }

      if (result.success) {
        setFormData({ barcode: '', name: '', brand: '', category: '', size: '', unit: '', price: 0, stock: 0 });
        setIsEditing(false);
        await loadProducts();
        barcodeRef.current?.focus();
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
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = async (barcode) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const result = await window.posAPI.deleteProduct(barcode);
      if (result.success) await loadProducts();
    }
  };
const filteredProducts = products.filter(p => 
  p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
  p.barcode.includes(searchTerm) ||
  (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
);
  return (
    <div className="p-8 bg-white min-h-screen text-black font-sans">
      <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-6">Inventory Management</h1>

      <form onSubmit={handleSave} className="mb-10 border border-black p-6 bg-gray-50 shadow-md">
        <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Add New Product</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Barcode (Scan Now)</label>
            <input
              ref={barcodeRef}
              type="text"
              required
              className="border border-black p-2 outline-none focus:bg-yellow-50"
              onKeyDown={(e) => handleKeyDown(e, nameRef)}
              value={formData.barcode}
              onChange={(e) => handleInputChange('barcode', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Product Name</label>
            <input
              ref={nameRef}
              type="text"
              required
              className="border border-black p-2 outline-none focus:bg-blue-50"
              onKeyDown={(e) => handleKeyDown(e, brandRef)}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Brand</label>
            <input
              ref={brandRef}
              type="text"
              className="border border-black p-2 outline-none focus:bg-blue-50"
              onKeyDown={(e) => handleKeyDown(e, categoryRef)}
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Category</label>
            <input
              ref={categoryRef}
              type="text"
              className="border border-black p-2 outline-none focus:bg-blue-50"
              onKeyDown={(e) => handleKeyDown(e, sizeRef)}
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Size (e.g. 10KG)</label>
            <input
              ref={sizeRef}
              type="text"
              className="border border-black p-2 outline-none focus:bg-blue-50"
              onKeyDown={(e) => handleKeyDown(e, unitRef)}
              value={formData.size}
              onChange={(e) => handleInputChange('size', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Unit (e.g. Bag)</label>
            <input
              ref={unitRef}
              type="text"
              className="border border-black p-2 outline-none focus:bg-blue-50"
              onKeyDown={(e) => handleKeyDown(e, priceRef)}
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Retail Price</label>
            <input
              ref={priceRef}
              type="number"
              required
              min="0"
              step="0.01"
              className="border border-black p-2 outline-none focus:bg-blue-50"
              onKeyDown={(e) => handleKeyDown(e, stockRef)}
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Stock Quantity</label>
            <input
              ref={stockRef}
              type="number"
              required
              min="0"
              step="1"
              className="border border-black p-2 outline-none focus:bg-blue-50"
              onKeyDown={(e) => handleKeyDown(e, null)}
              value={formData.stock}
              onChange={(e) => handleInputChange('stock', e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="mt-6 bg-black text-white px-10 py-3 font-bold hover:bg-gray-800 transition-all uppercase text-sm active:scale-95">
          Save to Inventory
        </button>
      </form>


{/* ---SEARCH BAR--- */}
<div className="mb-4">
  <label className="text-xs font-black uppercase text-gray-500 block mb-1">Quick Search</label>
  <div className="relative">
    <input 
      type="text" 
      placeholder="Search by Name, Barcode, or Brand..." 
      className="w-full border-2 border-black p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <span className="absolute left-3 top-3.5 opacity-50">🔍</span>
    {searchTerm && (
      <button 
        onClick={() => setSearchTerm('')}
        className="absolute right-3 top-3.5 text-xs font-bold bg-gray-200 px-2 rounded"
      >
        CLEAR
      </button>
    )}
  </div>
</div>

      {/* --- PRODUCT LIST TABLE --- */}
      <div className="overflow-hidden border border-black shadow-sm">
        <h2 className="text-lg font-bold p-4 bg-gray-100 uppercase tracking-wider border-b border-black flex justify-between items-center">
          <span>Stored Products</span>
          <span className="text-xs font-normal bg-black text-white px-2 py-1">Total: {filteredProducts.length}</span>
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-black text-white text-left uppercase">
              <th className="p-3 border-r border-gray-800">Barcode</th>
              <th className="p-3 border-r border-gray-800">Product Details</th>
              <th className="p-3 border-r border-gray-800">Category</th>
              <th className="p-3 border-r border-gray-800">Price</th>
              <th className="p-3 border-r border-gray-800">Stock</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                  No products in database. Scan your first item to start.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.barcode} className="border-b border-gray-200 hover:bg-yellow-50 transition-colors">
                  <td className="p-3 font-mono text-xs">{p.barcode}</td>

                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-base uppercase">{p.name}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">
                        {p.brand} | {p.size}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 uppercase text-gray-600 font-semibold">{p.category}</td>

                  <td className="p-3 font-black text-gray-900">Rs. {p.sale_price}</td>

                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className={`px-2 py-1 rounded text-center font-bold text-xs ${p.stock_quantity < 10 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                        {p.stock_quantity}
                      </span>
                      <span className="text-[10px] text-center text-gray-500 mt-1 uppercase font-bold">{p.unit_type}</span>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p.barcode)}
                        className="bg-white border-2 border-black text-black px-3 py-1 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Inventory;
