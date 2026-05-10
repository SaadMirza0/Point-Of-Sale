import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupHandlers } from './ipcHandler.js';
import { startAutoSync } from './syncService.js';
import { initDB } from './database.js';



function createWindow() {

const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
  
    icon: path.join(process.cwd(), '48x48.ico'), 
    webPreferences: {
      preload: path.join(__dirname, 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
});


mainWindow.webContents.send('database-updated');

  // SAFE CHECK: This prevents the "Not Defined" crash in production
  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log("Electron is loading Development Server:", MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log("Electron is loading Production Build");
    mainWindow.loadFile(path.join(__dirname, '../renderer/main_window/index.html'));
  }
}





// Start the "Engine"
app.whenReady().then(() => {
  initDB();         // start Sqlite
  createWindow();   // opening the window
  setupHandlers();  //ipc handlers starting
  startAutoSync();  // starting the sych service (every 2 minutes)
});
