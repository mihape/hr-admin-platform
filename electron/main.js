const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const DATA_FILE_NAME = "hr-admin-data.json";
const CONFIG_FILE_NAME = "hr-admin-storage-config.json";
const LOCK_STALE_MS = 5 * 60 * 1000;
let mainWindow = null;

function getDefaultDataPath() {
  return path.join(app.getPath("userData"), DATA_FILE_NAME);
}

function getConfigPath() {
  return path.join(app.getPath("userData"), CONFIG_FILE_NAME);
}

function readStorageConfig() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeStorageConfig(config) {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config || {}, null, 2), "utf8");
}

function getDataPath() {
  const config = readStorageConfig();
  return config.sharedDataPath || getDefaultDataPath();
}

function getStorageInfo() {
  const config = readStorageConfig();
  const dataPath = getDataPath();
  return {
    dataPath,
    defaultDataPath: getDefaultDataPath(),
    sharedDataPath: config.sharedDataPath || "",
    isShared: Boolean(config.sharedDataPath),
    configPath: getConfigPath(),
    lockPath: dataPath + ".lock"
  };
}

function ensureDataFile(dataPath = getDataPath()) {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ version: 1, collections: {} }, null, 2), "utf8");
  }
  return dataPath;
}

function readDatabaseFromPath(dataPath) {
  ensureDataFile(dataPath);
  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    if (!parsed.collections) {
      parsed.collections = {};
    }
    return parsed;
  } catch (error) {
    const backupPath = dataPath + ".corrupt-" + Date.now();
    if (fs.existsSync(dataPath)) {
      fs.copyFileSync(dataPath, backupPath);
    }
    const fresh = { version: 1, collections: {} };
    fs.writeFileSync(dataPath, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }
}

function readDatabase() {
  return readDatabaseFromPath(getDataPath());
}

function acquireWriteLock(dataPath) {
  const lockPath = dataPath + ".lock";
  try {
    const fd = fs.openSync(lockPath, "wx");
    fs.writeFileSync(fd, JSON.stringify({
      pid: process.pid,
      createdAt: new Date().toISOString(),
      hostname: require("os").hostname()
    }, null, 2), "utf8");
    return function releaseLock() {
      fs.closeSync(fd);
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
      }
    };
  } catch (error) {
    if (error && error.code === "EEXIST") {
      const stat = fs.statSync(lockPath);
      if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
        fs.unlinkSync(lockPath);
        return acquireWriteLock(dataPath);
      }
      throw new Error("Az adatfájl éppen használatban van egy másik gépen. Próbáld újra pár másodperc múlva.");
    }
    throw error;
  }
}

function writeDatabaseToPath(database, dataPath) {
  ensureDataFile(dataPath);
  const releaseLock = acquireWriteLock(dataPath);
  const tmpPath = dataPath + "." + process.pid + "." + Date.now() + ".tmp";
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(database, null, 2), "utf8");
    fs.renameSync(tmpPath, dataPath);
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    releaseLock();
  }
}

function writeDatabase(database) {
  writeDatabaseToPath(database, getDataPath());
}

function validateDatabaseFile(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!parsed || typeof parsed !== "object" || !parsed.collections) {
    throw new Error("A kiválasztott fájl nem HR Admin adatfájl.");
  }
  return parsed;
}

function configureSharedDataFile(sharedDataPath) {
  const currentDatabase = readDatabase();
  const dir = path.dirname(sharedDataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const usedExisting = fs.existsSync(sharedDataPath);
  if (usedExisting) {
    validateDatabaseFile(sharedDataPath);
  } else {
    writeDatabaseToPath(currentDatabase, sharedDataPath);
  }

  writeStorageConfig({
    sharedDataPath,
    updatedAt: new Date().toISOString()
  });
  return { dataPath: sharedDataPath, usedExisting };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: "HR Admin Platform",
    icon: path.join(__dirname, "..", "assets", "app-icon.ico"),
    backgroundColor: "#f4f7f5",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));
}

ipcMain.on("storage:get", (event, key) => {
  const database = readDatabase();
  event.returnValue = Object.prototype.hasOwnProperty.call(database.collections, key) ? database.collections[key] : null;
});

ipcMain.on("storage:set", (event, key, value) => {
  const database = readDatabase();
  database.collections[key] = value;
  database.updatedAt = new Date().toISOString();
  writeDatabase(database);
  event.returnValue = true;
});

ipcMain.on("storage:info", (event) => {
  event.returnValue = getStorageInfo();
});

ipcMain.handle("storage:exportBackup", async () => {
  const dataPath = ensureDataFile();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Biztonsági mentés mentése",
    defaultPath: "hr-admin-backup.json",
    filters: [{ name: "JSON mentés", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  fs.copyFileSync(dataPath, result.filePath);
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle("storage:importBackup", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Biztonsági mentés visszatöltése",
    properties: ["openFile"],
    filters: [{ name: "JSON mentés", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePaths.length) {
    return { canceled: true };
  }
  const sourcePath = result.filePaths[0];
  const parsed = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (!parsed || typeof parsed !== "object" || !parsed.collections) {
    throw new Error("A kiválasztott fájl nem HR Admin mentés.");
  }
  writeDatabase(parsed);
  return { canceled: false, filePath: sourcePath };
});

ipcMain.handle("storage:chooseSharedDataFile", async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Közös adatfájl kiválasztása vagy létrehozása",
    defaultPath: DATA_FILE_NAME,
    filters: [{ name: "HR Admin adatfájl", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  return Object.assign({ canceled: false }, configureSharedDataFile(result.filePath));
});

ipcMain.handle("storage:useLocalDataFile", async () => {
  writeStorageConfig({
    updatedAt: new Date().toISOString()
  });
  ensureDataFile(getDefaultDataPath());
  return { canceled: false, dataPath: getDefaultDataPath() };
});

app.whenReady().then(() => {
  ensureDataFile();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
