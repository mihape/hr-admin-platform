(function () {
  var APP_KEY = "hr-admin-platform";
  var APP_VERSION = "0.3.0";
  var runtimeConfig = window.HRAdminConfig || {};
  var modules = [];
  var listeners = [];

  var state = {
    activeModuleId: "overview",
    searchTerm: "",
    tenant: {
      id: "tenant-general-kivitelezo",
      name: "Demo Company Kft.",
      mode: "Helyi verzió"
    },
    user: {
      id: "user-hr",
      name: "HR Admin User",
      role: "hr_admin",
      permissions: [
        "platform.view",
        "fleet.manage",
        "attendance.manage",
        "utilities.manage",
        "invoices.manage",
        "settings.manage",
        "exports.run"
      ]
    }
  };

  var defaultSettings = {
    companyName: state.tenant.name,
    companyMode: state.tenant.mode,
    userName: state.user.name,
    currency: "HUF",
    invoiceDefaults: {
      paymentMethod: "Utalás",
      paymentTermDays: 8,
      category: "Egyéb",
      autoPaidDate: true
    }
  };

  function tenantScopedKey(collectionName) {
    return APP_KEY + ":" + state.tenant.id + ":" + collectionName;
  }

  function getStorageDriver() {
    return window.HRAdminNativeStorage || window.localStorage;
  }

  function readRawValue(key) {
    var driver = getStorageDriver();
    var nativeRaw = driver.getItem(key);
    if (nativeRaw == null && driver !== window.localStorage) {
      var legacyRaw = window.localStorage.getItem(key);
      if (legacyRaw != null) {
        driver.setItem(key, legacyRaw);
        return legacyRaw;
      }
    }
    return nativeRaw;
  }

  function writeRawValue(key, value) {
    getStorageDriver().setItem(key, value);
  }

  function readCollection(collectionName, seedItems) {
    var key = tenantScopedKey(collectionName);
    var raw = readRawValue(key);

    if (!raw) {
      var initialValue = getInitialValue(collectionName, seedItems);
      writeCollection(collectionName, initialValue);
      return clone(initialValue);
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Nem sikerült betölteni a tárolt adatot:", collectionName, error);
      var fallbackValue = getInitialValue(collectionName, seedItems);
      writeCollection(collectionName, fallbackValue);
      return clone(fallbackValue);
    }
  }

  function getInitialValue(collectionName, seedItems) {
    if (collectionName === "platform.settings") {
      return seedItems || {};
    }
    if (runtimeConfig.seedDemoData) {
      return seedItems || [];
    }
    if (Array.isArray(seedItems)) {
      return [];
    }
    if (seedItems && typeof seedItems === "object") {
      return {};
    }
    return seedItems || [];
  }

  function writeCollection(collectionName, items) {
    writeRawValue(tenantScopedKey(collectionName), JSON.stringify(items));
  }

  function addItem(collectionName, item, seedItems) {
    var items = readCollection(collectionName, seedItems || []);
    var nextItem = Object.assign(
      {
        id: collectionName + "-" + Date.now()
      },
      item
    );
    items.unshift(nextItem);
    writeCollection(collectionName, items);
    notify();
    return nextItem;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency: "HUF",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Intl.DateTimeFormat("hu-HU").format(new Date(value));
  }

  function matchesSearch(item, searchTerm) {
    if (!searchTerm) {
      return true;
    }

    var haystack = Object.values(item)
      .join(" ")
      .toLocaleLowerCase("hu-HU");
    return haystack.includes(searchTerm.toLocaleLowerCase("hu-HU"));
  }

  function registerModule(moduleDefinition) {
    modules.push(moduleDefinition);
    modules.sort(function (a, b) {
      return (a.order || 999) - (b.order || 999);
    });
    notify();
  }

  function getModules() {
    return modules.slice();
  }

  function getModuleById(moduleId) {
    return modules.find(function (moduleDefinition) {
      return moduleDefinition.id === moduleId;
    });
  }

  function getManifest() {
    return {
      platform: "hr-admin-platform",
      version: APP_VERSION,
      tenantAware: true,
      hostModes: ["standalone", "crm-hosted"],
      adapters: [
        "authTenantAdapter",
        "employeeAdapter",
        "moduleManifest",
        "exportPrintAdapter"
      ],
      modules: modules.map(function (moduleDefinition) {
        return {
          id: moduleDefinition.id,
          title: moduleDefinition.title,
          route: moduleDefinition.route,
          permission: moduleDefinition.permission,
          description: moduleDefinition.description
        };
      })
    };
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
      listeners = listeners.filter(function (current) {
        return current !== listener;
      });
    };
  }

  function notify() {
    listeners.forEach(function (listener) {
      listener();
    });
  }

  function getStorageInfo() {
    if (window.HRAdminNativeStorage && typeof window.HRAdminNativeStorage.getInfo === "function") {
      var info = window.HRAdminNativeStorage.getInfo();
      return Object.assign({ mode: info && info.isShared ? "shared-file" : "native-file" }, info);
    }
    return { mode: "browser-localStorage" };
  }

  function exportBackup() {
    if (window.HRAdminNativeStorage && typeof window.HRAdminNativeStorage.exportBackup === "function") {
      return window.HRAdminNativeStorage.exportBackup();
    }
    var payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      collections: {}
    };
    Object.keys(window.localStorage).forEach(function (key) {
      if (key.indexOf(APP_KEY + ":") === 0) {
        payload.collections[key] = window.localStorage.getItem(key);
      }
    });
    return Promise.resolve({ fallbackPayload: payload });
  }

  function importBackup() {
    if (window.HRAdminNativeStorage && typeof window.HRAdminNativeStorage.importBackup === "function") {
      return window.HRAdminNativeStorage.importBackup();
    }
    return Promise.reject(new Error("A visszatöltés csak a Windows appban érhető el."));
  }

  function chooseSharedDataFile() {
    if (window.HRAdminNativeStorage && typeof window.HRAdminNativeStorage.chooseSharedDataFile === "function") {
      return window.HRAdminNativeStorage.chooseSharedDataFile();
    }
    return Promise.reject(new Error("A közös adatfájl választása csak a Windows appban érhető el."));
  }

  function useLocalDataFile() {
    if (window.HRAdminNativeStorage && typeof window.HRAdminNativeStorage.useLocalDataFile === "function") {
      return window.HRAdminNativeStorage.useLocalDataFile();
    }
    return Promise.reject(new Error("A helyi adatfájlra váltás csak a Windows appban érhető el."));
  }

  function readSettings() {
    return mergeSettings(readCollection("platform.settings", defaultSettings));
  }

  function writeSettings(settings) {
    writeCollection("platform.settings", mergeSettings(settings));
  }

  function mergeSettings(settings) {
    return Object.assign({}, defaultSettings, settings || {}, {
      invoiceDefaults: Object.assign({}, defaultSettings.invoiceDefaults, settings && settings.invoiceDefaults || {})
    });
  }

  function applySettings(settings) {
    var next = mergeSettings(settings);
    state.tenant.name = String(next.companyName || defaultSettings.companyName).trim() || defaultSettings.companyName;
    state.tenant.mode = String(next.companyMode || defaultSettings.companyMode).trim() || defaultSettings.companyMode;
    state.user.name = String(next.userName || defaultSettings.userName).trim() || defaultSettings.userName;
  }

  function updateSettings(patch) {
    var current = readSettings();
    var next = mergeSettings(Object.assign({}, current, patch || {}, {
      invoiceDefaults: Object.assign({}, current.invoiceDefaults, patch && patch.invoiceDefaults || {})
    }));
    writeSettings(next);
    applySettings(next);
    notify();
    return clone(next);
  }

  applySettings(readSettings());

  window.HRPlatform = {
    metadata: {
      name: "HR Admin Platform",
      version: APP_VERSION,
      buildMode: runtimeConfig.buildMode || "release"
    },
    state: state,
    registerModule: registerModule,
    getModules: getModules,
    getModuleById: getModuleById,
    getManifest: getManifest,
    subscribe: subscribe,
    notify: notify,
    storage: {
      readCollection: readCollection,
      writeCollection: writeCollection,
      addItem: addItem,
      getInfo: getStorageInfo,
      exportBackup: exportBackup,
      importBackup: importBackup,
      chooseSharedDataFile: chooseSharedDataFile,
      useLocalDataFile: useLocalDataFile
    },
    settings: {
      get: function () {
        return clone(readSettings());
      },
      update: updateSettings
    },
    utils: {
      clone: clone,
      escapeHtml: escapeHtml,
      formatCurrency: formatCurrency,
      formatDate: formatDate,
      matchesSearch: matchesSearch
    }
  };
})();
