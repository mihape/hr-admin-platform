const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const DATA_FILE_NAME = "hr-admin-data.json";
let mainWindow = null;

function getDataPath() {
  return path.join(app.getPath("userData"), DATA_FILE_NAME);
}

function ensureDataFile() {
  const dataPath = getDataPath();
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ version: 1, collections: {} }, null, 2), "utf8");
  }
  return dataPath;
}

function readDatabase() {
  const dataPath = ensureDataFile();
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

function writeDatabase(database) {
  const dataPath = ensureDataFile();
  const tmpPath = dataPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(database, null, 2), "utf8");
  fs.renameSync(tmpPath, dataPath);
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
  event.returnValue = { dataPath: ensureDataFile() };
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
