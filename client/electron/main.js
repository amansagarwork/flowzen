const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startServer } = require('./server'); // Import bundled server

const isDev = process.env.NODE_ENV !== 'production';
let serverProcess; // Keep reference to server

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For MVP ease, consider security later
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the static file
        mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
        // mainWindow.webContents.openDevTools(); // Keep commented out for pure prod, or uncomment to debug
    }
}

app.whenReady().then(() => {
    serverProcess = startServer(); // Start the brain
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
