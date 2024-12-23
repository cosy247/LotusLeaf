const { app, Tray, Menu, BrowserWindow, dialog, nativeImage, ipcMain } = require('electron');
const path = require('path');
const package = require('./package.json');
const fs = require('fs');
const log = require('electron-log');

log.transports.file.level = true; //是否输出到 日志文件
log.transports.console.level = false; //是否输出到 控制台

const leafsPath = (() => {
  const targetPath = path.join(app.getPath('exe'), '../leafs');
  if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath);
  return targetPath;
})();
log.info('leafsPath', leafsPath);

function getTrayIcon(iconPath) {
  return nativeImage.createFromPath(iconPath).resize({ height: 14 });
}

// 创建窗口
function showLeaf(config, indexPath) {
  // 创建窗口
  const width = parseInt(config.width) || 500;
  const height = parseInt(config.height) || 500;
  const win = new BrowserWindow({
    width,
    height,
    transparent: true,
    resizable: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  win.loadFile(indexPath);

  // 滚轮缩放
  // let zoomLevel = 1;
  // const zoomMultiple = 0.03;
  // win.hookWindowMessage(522, function (e) {
  //   if (Object.values(e)[3] < 127) {
  //     zoomLevel += zoomMultiple;
  //   } else {
  //     if (zoomLevel <= 0.2) return;
  //     zoomLevel -= zoomMultiple;
  //   }
  //   win.setSize(Math.floor(width * zoomLevel), Math.floor(height * zoomLevel), true);
  // });

  // // 右键关闭
  // win.hookWindowMessage(278, function () {
  //   win.close();
  // });

  return win;
}

// 通信
ipcMain.on('close', (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.close();
});
ipcMain.on('move', (event, x, y) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  const [width, height]  = win.getSize();
  win.setBounds({
    x: parseInt(x),
    y: parseInt(y),
    width: parseInt(width),
    height: parseInt(height),
  });
});

// 添加荷叶
function addLeaf() {
  dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }).then((data) => {
    if (data.canceled) return;
    const filePath = data.filePaths[0];
    if (!filePath) return;
    // 复制目录
    log.info(`复制荷叶：${filePath} 到 ${leafsPath}/${Date.now()} `);
    fs.cp(filePath, `${leafsPath}/${Date.now()}`, { recursive: true }, (err) => {
      err && log.error(err);
      updateTrayMenu();
    });
  });
}

// 删除荷叶
function deleteLeaf(filePath) {
  fs.rm(filePath, { recursive: true, force: true }, (err) => {
    err && console.log(err);
    updateTrayMenu();
  });
}

// 定义托盘
let tray = null;
function updateTrayMenu() {
  if (!tray) {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    tray.setToolTip(package.description);
  }

  // 获取荷叶
  const files = fs.readdirSync(leafsPath);
  log.info('files', JSON.stringify(files));
  log.info('files', files);
  const leafMenu = { deletes: [], leafs: [] };
  files.forEach((filePath) => {
    const config = JSON.parse(fs.readFileSync(`${leafsPath}/${filePath}/config.json`).toString() || '{}');
    const icon = getTrayIcon(path.join(leafsPath, filePath, config.icon));
    log.info('path.join(leafsPath, filePath, config.icon)', path.join(leafsPath, filePath, config.icon));
    leafMenu.leafs.push({
      label: config.name,
      icon,
      click: () => showLeaf(config, `${leafsPath}/${filePath}/${config.index}`),
    });
    leafMenu.deletes.push({
      label: config.name,
      icon,
      click: () => deleteLeaf(`${leafsPath}/${filePath}`),
    });
  });

  // 设置菜单
  tray.setContextMenu(
    Menu.buildFromTemplate([
      ...leafMenu.leafs,
      { type: 'separator' },
      { label: '添加荷叶', icon: getTrayIcon(path.join(__dirname, 'imgs/add.png')), click: addLeaf },
      {
        label: '删除荷叶',
        icon: getTrayIcon(path.join(__dirname, 'imgs/delete.png')),
        type: 'submenu',
        submenu: leafMenu.deletes,
      },
      { type: 'separator' },
      {
        label: '更多',
        type: 'submenu',
        submenu: [
          { label: '教程帮助', icon: getTrayIcon(path.join(__dirname, 'imgs/help.png')) },
          { label: '检查更新', icon: getTrayIcon(path.join(__dirname, 'imgs/update.png')) },
          { label: '意见反馈', icon: getTrayIcon(path.join(__dirname, 'imgs/feedback.png')) },
        ],
      },
      { label: '退出荷叶', icon: getTrayIcon(path.join(__dirname, 'imgs/out.png')), role: 'quit' },
    ])
  );
}

// 单一运行
if (app.requestSingleInstanceLock({ myKey: 'myValue' })) {
  app.setAppUserModelId(package.name);
  app.on('ready', () => {
    updateTrayMenu();
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
