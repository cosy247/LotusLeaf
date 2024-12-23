const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  close: () => ipcRenderer.send('close'),
  move: (x, y) => ipcRenderer.send('move', x, y),
});
