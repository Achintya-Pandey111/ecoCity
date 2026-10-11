const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { registerIpcHandlers } = require('./ipc');

let mainWindow = null;

async function createWindow() {
  // Initialize SQLite database
  await db.initDatabase();

  mainWindow = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    title: 'EcoCity — Smart Urban Waste Management',
    backgroundColor: '#0f172a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Register all IPC handlers
  registerIpcHandlers(mainWindow);

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data: blob: http://localhost:5173 https://images.unsplash.com https://fonts.googleapis.com https://fonts.gstatic.com;"
        ]
      }
    });
  });

  const isDev = process.env.NODE_ENV === 'development';
  const distHtmlPath = path.join(__dirname, '../../dist/renderer/index.html');

  if (isDev) {
    try {
      await mainWindow.loadURL('http://localhost:5173');
    } catch (err) {
      console.warn('[EcoCity] Vite dev server at localhost:5173 not responding. Loading built bundle...');
      if (fs.existsSync(distHtmlPath)) {
        await mainWindow.loadFile(distHtmlPath);
      }
    }
  } else {
    if (fs.existsSync(distHtmlPath)) {
      await mainWindow.loadFile(distHtmlPath);
    } else {
      console.warn('[EcoCity] Built bundle not found, attempting dev server...');
      await mainWindow.loadURL('http://localhost:5173');
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
