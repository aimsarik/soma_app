const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { SerialPort } = require('serialport');
const port = new SerialPort({ path: 'COM4', baudRate: 9600 });

function createWindow () {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    // titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      // devTools: false,
    }
  })

  win.loadURL("http://chamnan.local/front_end/gym/");
  win.setIcon(path.join(__dirname, "/src/assets/home_screen.png"));
  win.maximize();
  win.webContents.openDevTools();

  ipcMain.on("open_door", (event, arg) => {
    port.write("1");
  });
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
