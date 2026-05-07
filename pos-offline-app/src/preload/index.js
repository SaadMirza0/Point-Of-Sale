const { contextBridge, ipcRenderer } = require('electron');

// Secure Bridge between React (Frontend) and SQLite (Backend)
contextBridge.exposeInMainWorld('posAPI', {
  
// DASHBOARD ANALYTICS
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
getLowStock: () => ipcRenderer.invoke('get-low-stock'),

  //  PRODUCT MANAGEMENT
  addProduct: (productData) => ipcRenderer.invoke('add-product', productData),
  getProduct: (barcode) => ipcRenderer.invoke('get-product', barcode),
  getAllProducts: () => ipcRenderer.invoke('get-all-products'),
deleteProduct: (barcode) => ipcRenderer.invoke('delete-product', barcode),
updateProduct: (productData) => ipcRenderer.invoke('update-product', productData),

  // SALES & HISTORY
  saveSale: (saleData) => ipcRenderer.invoke('save-sale', saleData),
  getSalesHistory: (filter) => ipcRenderer.invoke('get-sales-history', filter),
  searchSales: (term) => ipcRenderer.invoke('search-sales', term),

  //  SETTINGS & HARDWARE 
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printReceipt: (data) => ipcRenderer.send('print-receipt',data ),
saveSetting: (key, value) => ipcRenderer.invoke('save-setting', { key, value }),

  //SYNC & UTILITIES 
  onSyncStatus: (callback) => ipcRenderer.on('sync-status', (event, status) => callback(status)),
  getSyncCount: () => ipcRenderer.invoke('get-sync-count'),

 onDatabaseUpdated: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('database-updated', subscription);
    return () => ipcRenderer.removeListener('database-updated', subscription);
  },
getSaleItems: (saleId) => ipcRenderer.invoke('get-sale-items', saleId),


});

console.log("✅ Professional POS Bridge: Fully Loaded");
