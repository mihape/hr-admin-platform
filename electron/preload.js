const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("HRAdminNativeStorage", {
  isNative: true,
  getItem(key) {
    return ipcRenderer.sendSync("storage:get", key);
  },
  setItem(key, value) {
    return ipcRenderer.sendSync("storage:set", key, value);
  },
  getInfo() {
    return ipcRenderer.sendSync("storage:info");
  },
  exportBackup() {
    return ipcRenderer.invoke("storage:exportBackup");
  },
  importBackup() {
    return ipcRenderer.invoke("storage:importBackup");
  },
  chooseSharedDataFile() {
    return ipcRenderer.invoke("storage:chooseSharedDataFile");
  },
  useLocalDataFile() {
    return ipcRenderer.invoke("storage:useLocalDataFile");
  }
});
