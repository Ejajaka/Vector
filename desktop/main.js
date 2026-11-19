const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !app.isPackaged;
const devUrl = process.env.VECTOR_DEV_URL || 'http://localhost:3000';

/** The web build ships as an extraResource so the packaged app works offline. */
function resolveAppEntry() {
  const candidates = [
    path.join(process.resourcesPath || '', 'app', 'index.html'),
    path.join(__dirname, '..', 'ui', 'web-app', 'dist', 'index.html'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#F6F4EC',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // External links open in the user's browser, never inside the app shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    const internal = url.startsWith(devUrl) || target.protocol === 'file:';
    if (!internal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    win.loadURL(devUrl).catch(() => {
      const entry = resolveAppEntry();
      if (entry) win.loadFile(entry);
    });
  } else {
    const entry = resolveAppEntry();
    if (entry) {
      win.loadFile(entry);
    } else {
      dialog.showErrorBox(
        'Vector could not start',
        'The web build was not found. Run "npm run build" in ui/web-app, then rebuild the desktop app.'
      );
    }
  }

  return win;
}

function buildMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [{ role: 'appMenu' }]
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'New project', accelerator: 'CmdOrCtrl+N', click: () => sendNav('projects') },
        { type: 'separator' },
        { role: process.platform === 'darwin' ? 'close' : 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => sendNav('dashboard') },
        { label: 'Projects', accelerator: 'CmdOrCtrl+2', click: () => sendNav('projects') },
        { label: 'Templates', accelerator: 'CmdOrCtrl+3', click: () => sendNav('templates') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'help',
      submenu: [
        { label: 'Learn', click: () => sendNav('learn') },
        { label: 'Plans and pricing', click: () => sendNav('pricing') },
        { type: 'separator' },
        { label: 'Vector website', click: () => shell.openExternal('https://vector.is-a.dev') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function sendNav(tab) {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  win?.webContents.send('vector:navigate', tab);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    buildMenu();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
