const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initDB } = require('./database');
const { setupHandlers } = require('./ipcHandler');
const { startAutoSync } = require('./syncService');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Points to the built preload file
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.openDevTools();
mainWindow.webContents.send('database-updated');

  // SAFE CHECK: This prevents the "Not Defined" crash
  let targetURL = 'http://localhost:5173'; // Default Vite Port

  try {
    if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      targetURL = MAIN_WINDOW_VITE_DEV_SERVER_URL;
    }
  } catch (e) {
    console.log("Using fallback port 5173...");
  }

  console.log("Electron is loading:", targetURL);
  mainWindow.loadURL(targetURL);
}





// Start the "Engine"
app.whenReady().then(() => {
  initDB();         // start Sqlite
  createWindow();   // opening the window
  setupHandlers();  //ipc handlers starting
  startAutoSync();  // starting the sych service (every 2 minutes)
});
