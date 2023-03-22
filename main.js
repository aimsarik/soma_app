const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require("electron-updater");
const isDev = require("electron-is-dev");
const ProgressBar = require('electron-progressbar');
const path = require('path');
const Alert = require("electron-alert");    
const { SerialPort } = require('serialport');
const sound = require("sound-play");
// Soma gym use COM4
// check port path is available or not
const port = new SerialPort({path: 'COM4', baudRate: 9600 }, (err) => {
  if (err) {
    return console.log('Error: ', err.message);
  }else {
    console.log('port is open');
  }
});

// const log = require('electron-log');
// log.transports.file.resolvePath = () => path.join('C:/xampp/htdocs/app.soma/soma_electron_app', 'logs/main.log');
let alert = new Alert();
function createWindow () {
  // check app is running or not
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    let swalOptions = {
      title: "កំហុស",
      text: "មានកម្មវិធីកំពុងដំណើរការ សូមបិទកម្មវិធីចាស់ជាមុនសិន",
      icon: "error"
    }; 
    const filePath_dev = path.join(__dirname, "/src/assets/alarm_1.mp3");
    const filePath_build = path.dirname(__dirname) + '/src/assets/alarm_1.mp3';
    let wheel_sound = '';
    if (isDev) {
      wheel_sound = filePath_dev;
      console.log("dev");
    }else{
      wheel_sound = filePath_build;
    }
    const volume = 1;
    sound.play(wheel_sound, volume);

    // alert.fireFrameless with sound
    /* let promise = alert.fireFrameless(swalOptions, null, true, false, {
          freq: "1109",
          type: "square",
          duration: "6"
        }, false); */
    let promise = alert.fireFrameless(swalOptions, null, true, false);
    promise.then((result) => {
      if (result.value) {
        // confirmed 
        app.quit();
      } else if (result.dismiss === Alert.DismissReason.cancel) {
        // canceled
      }
    });
  }else {
    const win = new BrowserWindow({
      width: 1920,
      height: 1080,
      // titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        // enable devtools for production build
        devTools: false,
      }
    })    
    win.loadURL("https://soma.aimsarik.com/");
    win.setIcon(path.join(__dirname, "/src/assets/home_screen.png"));
    
    if (!isDev) {
      autoUpdater.checkForUpdates();
    };
  
    win.maximize();
    // disable devtools for production build
    // win.webContents.openDevTools();
  
    ipcMain.on("open_door", (event, arg) => {
      port.write("1");
      
    });
    // wait and show progress bar
    setTimeout(() => {
      var progressBar = new ProgressBar({
        text: 'កំពុងទាញទិន្នន័យ...',
        detail: 'សូមរង់ចាំ...'
      });
      progressBar
        .on('completed', function() {
          console.info(`completed...`);
          progressBar.detail = 'Task completed. Exiting...';
        })
        .on('aborted', function() {
          console.info(`aborted...`);
        });
        win.webContents.on('did-finish-load',WindowsReady);
  
        function WindowsReady() {
            console.log('Ready');
            progressBar.setCompleted();
        }
    }, 1000);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});
autoUpdater.on("checking-for-update", () => {
});
autoUpdater.on("update-available", () => {
  // progresbar with percentage
  var progressBarPer = new ProgressBar({
    indeterminate: false,
    text: 'កំពុងរៀបចំទិន្នន័យ ដើម្បីធ្វើបច្ចុប្បន្នភាព...',
    detail: 'សូមរង់ចាំ...'
  });

  progressBarPer
    .on('completed', function() {
      console.info(`completed...`);
      progressBarPer.detail = 'Task completed. Exiting...';
    })
    .on('aborted', function(value) {
      console.info(`aborted... ${value}`);
    })
    .on('progress', function(value) {
      progressBarPer.detail = `Value ${value} out of ${progressBarPer.getOptions().maxValue}...`;
    });

  autoUpdater.on("download-progress", (processTrack) => {
    if (processTrack.percent > 0) {
      progressBarPer.value = processTrack.percent;
    }
  });
});

autoUpdater.on("update-not-available", () => {
});

autoUpdater.on("error", (error) => {
});

autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
  // restart the app and install the update
  const {session} = require('electron');
  session.defaultSession.clearCache();
  autoUpdater.quitAndInstall();
});
// ipcMain clear cache
ipcMain.on("clear-cache", (event, arg) => {
  const {session} = require('electron');
  session.defaultSession.clearCache();
  let swalOptions = {
    icon: "info",
    title: `<span style="font-family: 'Battambang'">ធ្វើបច្ចុប្បន្នភាព</span>`,
    html: `<div style="font-family: 'Battambang'">
          កម្មវិធីត្រូវការធ្វើបច្ចុប្បន្នភាព <b style="color: #dc3545;">ក្នុងរយៈពេល 10នាទី</b><br>
          សូមរក្សាទុកទិន្នន័យរបស់អ្នកអោយបានរួចរាល់</div>`,
    showConfirmButton: false,
    showCancelButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false
  };    
  // alert.fireFrameless(swalOptions, null, true, false);
  let promise = alert.fireWithFrame(swalOptions, null, true, false, {
        freq: "1109",
        type: "square",
        duration: "6"
      }, false);

  promise.then(() => {
    // wait 15 minutes and restart the app
    setTimeout(() => {
      let swalOptions = {
        position: "top-end",
        title: `<span style="font-family: 'Battambang'">ជោគជ័យ</span>`,
        icon: "success",
        showConfirmButton: false,
        timer: 6000
      };
      
      Alert.fireToast(swalOptions, {
        freq: "1109",
        type: "square",
        duration: "6"
      });
      setTimeout(() => {
        app.quit();
        app.relaunch();
      }, 6000);
    }, 540000);
  });
});