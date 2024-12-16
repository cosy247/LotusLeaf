const { app, shell, Tray, Menu, BrowserWindow, Notification, powerMonitor, ipcMain } = require('electron');
const path = require('path');
const package = require('./package.json');

// ----------------- 浮动窗口控制 ----------------- //
// 创建窗口
function showLeaf(path) {
  const width = 360;
  const height = 500;
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
      // preload: './preload.js',
    },
  });
  win.loadFile(`${path}/index.html`);
  win.setSkipTaskbar(true);

  // 双击左键关闭
  // let lastTime = 0;
  // win.hookWindowMessage(528, function () {
  //   const time = Date.now();
  //   if (time - lastTime < 300) win.close();
  //   else lastTime = time;
  // });

  // 滚轮放大
  let zoomLevel = 1;
  win.hookWindowMessage(522, function (e) {
    if (Object.values(e)[3] < 127) {
      zoomLevel += 0.05;
    } else {
      zoomLevel -= 0.05;
    }
    // const [x, y] = win.getPosition();
    // win.setPosition(Math.floor(x + 0.05 * width),Math.floor(y + 0.05 * height));
    win.setSize(Math.floor(width * zoomLevel), Math.floor(height * zoomLevel));
  });

  // 右键开启调整窗口大小功能
  // let resizable = false;
  win.hookWindowMessage(278, function () {
    win.close();
    // win.setEnabled(false); //窗口禁用
    // if ((resizable = !resizable)) {
    //   win.setBackgroundColor('#2a98');
    //   win.setResizable(true);
    // } else {
    //   win.setBackgroundColor('#0fff');
    //   win.setResizable(false);
    // }
    // let timer = setTimeout(() => {
    //   win.setEnabled(true);
    //   clearTimeout(timer);
    // }, 50);
  });

  return win;
}

// 定义托盘
function initTray() {
  const tray = new Tray(path.resolve(__dirname, './icon.png'));
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { type: 'separator' },
      {
        label: '不老表',
        click: showLeaf.bind(null, './clock_dark'),
      },
      { label: '退出', role: 'quit' },
    ])
  );
}

// 获取实例的关闭信息
ipcMain.on('close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.close();
});

// 单一运行
if (app.requestSingleInstanceLock({ myKey: 'myValue' })) {
  app.setAppUserModelId(package.name);
  app.on('ready', () => {
    initTray();
    showLeaf('./clock_dark');
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
