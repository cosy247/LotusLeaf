const { app, shell, Tray, Menu, BrowserWindow, Notification, powerMonitor } = require('electron');
const fs = require('fs');
const path = require('path');
const package = require('./package.json');

// ----------------- 浮动窗口控制 ----------------- //
// 窗口集合
let winMap = {};
// 创建窗口
function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 600,
    transparent: true,
    resizable: false,
    frame: false,
    icon: './clock_dark/clock.png',
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enablemotemodule: true,
    },
  });
  win.loadFile('./clock_dark/clock_dark.html');
  winMap[win.id] = win;
}
// 关闭全部窗口
function closeAll() {
  Object.values(winMap).forEach((win) => win.close());
  winMap = {};
}

// ----------------- 设置窗口控制 ----------------- //
let settingWin = null;
function showSettingWindow() {
  if (!settingWin) {
    settingWin = new BrowserWindow({
      width: 600,
      height: 600,
      transparent: true,
      resizable: false,
      frame: false,
      icon: './clock_dark/clock.png',
      webPreferences: {
        devTools: false,
        nodeIntegration: true,
        enablemotemodule: true,
      },
    });
    settingWin.loadFile('./clock_dark/clock_dark.html');
  }
}

// 定义托盘
function initTray() {
  // const isOpenAtLogin = app.getLoginItemSettings().openAtLogin;
  const tray = new Tray(path.resolve(__dirname, './icon.png'));
  tray.addListener('click', showSettingWindow);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      // { type: 'separator' },
      { label: '关闭全部', click: closeAll },
      { label: '退出', role: 'quit' },
    ])
  );
}

// 单一运行
if (app.requestSingleInstanceLock({ myKey: 'myValue' })) {
  app.setAppUserModelId(package.name);
  app.on('ready', () => {
    initTray();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') app.quit();
  });
} else {
  app.quit();
}
