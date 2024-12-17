const { app, Tray, Menu, BrowserWindow, dialog } = require('electron');
const path = require('path');
const package = require('./package.json');

// 创建窗口
function showLeaf(path) {
  // 获取配置
  let winConfig = {};
  try {
    winConfig = require(`${path}/config.json`);
  } catch (error) {}

  // 创建窗口
  const width = parseInt(winConfig.width) || 500;
  const height = parseInt(winConfig.height) || 500;
  const win = new BrowserWindow({
    width,
    height,
    transparent: true,
    resizable: true,
    frame: false,
    alwaysOnTop: true,
    icon: `${path}/logo.png`,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  win.loadFile(`${path}/index.html`);
  win.setSkipTaskbar(true);

  // 滚轮缩放
  let zoomLevel = 1;
  const zoomMultiple = 0.03;
  win.hookWindowMessage(522, function (e) {
    if (Object.values(e)[3] < 127) {
      zoomLevel += zoomMultiple;
    } else {
      if (zoomLevel <= 0.2) return;
      zoomLevel -= zoomMultiple;
    }
    win.setSize(Math.floor(width * zoomLevel), Math.floor(height * zoomLevel), true);
  });

  // 右键关闭
  win.hookWindowMessage(278, function () {
    win.close();
  });

  return win;
}

// 添加荷叶
function addLeaf() {
  dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }).then((data) => {
    if (data.canceled) return;
    const filePath = data.filePaths[0];
    if (!filePath) return;
  });
}

// 定义托盘
function initTray() {
  const tray = new Tray(path.resolve(__dirname, './icon.png'));
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { type: 'separator' },
      { label: '添加荷叶', click: addLeaf },
      { label: '删除荷叶', click: addLeaf },
      { type: 'separator' },
      {
        label: '不老表',
        // icon: './leafs/clock_dark/logo.png',
        click: showLeaf.bind(null, './leafs/clock_dark'),
      },
      { type: 'separator' },
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
