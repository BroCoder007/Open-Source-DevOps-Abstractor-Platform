const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'OpenCloud Desktop',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Check if the backend is up before loading the URL
  const checkBackend = () => {
    http.get('http://localhost:8080/health', (res) => {
      if (res.statusCode === 200) {
        mainWindow.loadURL('http://localhost:8080');
      } else {
        setTimeout(checkBackend, 500);
      }
    }).on('error', () => {
      setTimeout(checkBackend, 500);
    });
  };

  // Start checking
  mainWindow.loadFile('loading.html'); // Show a simple loading screen
  checkBackend();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  // Spawn the Go binary from the parent directory
  const exePath = path.join(__dirname, '..', 'opencloud.exe');
  
  backendProcess = spawn(exePath, [], {
    cwd: path.join(__dirname, '..'), // Run from the parent dir to serve 'public'
    detached: false
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });
}

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
