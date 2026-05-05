"use client";
import { useState, useEffect, useRef } from 'react';
import { getProducts, saveProduct, deleteProduct } from '@/lib/actions';

export default function WebInventory() {
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    const data = await getProducts();
    setProducts(data || []);
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
    e.preventDefault();
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

  return (
    <div className="p-8 bg-white min-h-screen text-black font-sans">
      <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-6 uppercase">Web Inventory Manager</h1>

      {/* --- FORM (All 8 Fields like Electron) --- */}
      <form onSubmit={handleSave} className="mb-10 border-2 border-black p-6 bg-gray-50 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <h2 className="text-lg font-bold mb-4 uppercase">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input ref={barcodeRef} placeholder="Barcode" className="border-2 border-black p-2 outline-none" value={formData.barcode} disabled={isEditing} onChange={e => setFormData({...formData, barcode: e.target.value})} onKeyDown={e => handleKeyDown(e, nameRef)} />
          <input ref={nameRef} placeholder="Product Name" className="border-2 border-black p-2 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} onKeyDown={e => handleKeyDown(e, brandRef)} />
          <input ref={brandRef} placeholder="Brand" className="border-2 border-black p-2 outline-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} onKeyDown={e => handleKeyDown(e, categoryRef)} />
          <input ref={categoryRef} placeholder="Category" className="border-2 border-black p-2 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} onKeyDown={e => handleKeyDown(e, sizeRef)} />
          <input ref={sizeRef} placeholder="Size (e.g. 10KG)" className="border-2 border-black p-2 outline-none" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} onKeyDown={e => handleKeyDown(e, unitRef)} />
          <input ref={unitRef} placeholder="Unit (e.g. Bag)" className="border-2 border-black p-2 outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} onKeyDown={e => handleKeyDown(e, priceRef)} />
          <input ref={priceRef} type="number" placeholder="Retail Price" className="border-2 border-black p-2 outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} onKeyDown={e => handleKeyDown(e, stockRef)} />
          <input ref={stockRef} type="number" placeholder="Stock Qty" className="border-2 border-black p-2 outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
        </div>
        <button type="submit" className="mt-6 bg-blue-600 text-white px-8 py-3 font-black uppercase hover:bg-black transition-all">
          {isEditing ? 'Update Cloud Data' : 'Upload to Cloud'}
        </button>
      </form>

      {/* --- SEARCH --- */}
      <input placeholder="Search Inventory..." className="w-full border-2 border-black p-4 mb-8 text-xl outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      {/* --- TABLE (Matching Electron Design) --- */}
      <div className="border-2 border-black overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-black text-white uppercase">
            <tr>
              <th className="p-3">Barcode</th>
              <th className="p-3">Product Details</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.barcode} className="border-b-2 border-black hover:bg-yellow-50">
                <td className="p-3 font-mono">{p.barcode}</td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-base uppercase">{p.name}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{p.brand} | {p.size}</span>
                  </div>
                </td>
                <td className="p-3 uppercase text-gray-600">{p.category}</td>
                <td className="p-3 font-black">Rs. {p.sale_price}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded font-bold ${p.stock_quantity < 10 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {p.stock_quantity} {p.unit_type}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => {
                        setFormData({ barcode: p.barcode, name: p.name, brand: p.brand, category: p.category, size: p.size, unit: p.unit_type, price: p.sale_price, stock: p.stock_quantity });
                        setIsEditing(true); window.scrollTo(0,0);
                    }} className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase">Edit</button>
                    <button onClick={async () => {
                        if(confirm("Delete?")) { await deleteProduct(p.barcode); loadData(); }
                    }} className="border-2 border-black px-3 py-1 text-[10px] font-black uppercase">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
