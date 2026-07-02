(function () {
  var INVOICE_DUE_SOON_DAYS = 7;
  var platform = window.HRPlatform;
  var nav = document.getElementById("moduleNav");
  var content = document.getElementById("moduleContent");
  var stats = document.getElementById("dashboardStats");
  var search = document.getElementById("globalSearch");
  var exportButton = document.getElementById("exportButton");
  var printButton = document.getElementById("printButton");
  var title = document.getElementById("activeModuleTitle");
  var eyebrow = document.getElementById("activeModuleEyebrow");
  var tenantName = document.getElementById("tenantName");
  var tenantMode = document.getElementById("tenantMode");
  var tenantUser = document.getElementById("tenantUser");

  function boot() {
    tenantName.textContent = platform.authTenantAdapter.getCurrentTenant().name;
    tenantMode.textContent = platform.authTenantAdapter.getCurrentTenant().mode;
    search.addEventListener("input", function () {
      platform.state.searchTerm = search.value;
      render();
      search.focus();
    });
    search.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        search.value = "";
        platform.state.searchTerm = "";
        render();
        search.focus();
      }
    });
    exportButton.addEventListener("click", function () {
      var moduleDefinition = platform.getModuleById(platform.state.activeModuleId);
      platform.exportPrintAdapter.exportModule(moduleDefinition, getContext());
    });
    printButton.addEventListener("click", function () {
      var moduleDefinition = platform.getModuleById(platform.state.activeModuleId);
      if (moduleDefinition && typeof moduleDefinition.print === "function") {
        moduleDefinition.print(content, getContext());
        return;
      }
      platform.exportPrintAdapter.printCurrentView();
    });
    platform.subscribe(render);
    var initialModule = location.hash ? location.hash.replace("#", "") : "";
    if (platform.getModuleById(initialModule)) {
      platform.state.activeModuleId = initialModule;
    }
    window.addEventListener("hashchange", function () {
      var moduleId = location.hash.replace("#", "");
      if (platform.getModuleById(moduleId)) {
        platform.state.activeModuleId = moduleId;
        render();
      }
    });
    render();
  }

  function render() {
    var moduleDefinition = platform.getModuleById(platform.state.activeModuleId);
    if (!moduleDefinition) {
      moduleDefinition = null;
      platform.state.activeModuleId = "overview";
    }

    renderNav();
    tenantName.textContent = platform.authTenantAdapter.getCurrentTenant().name;
    tenantMode.textContent = platform.authTenantAdapter.getCurrentTenant().mode;
    tenantUser.textContent = platform.authTenantAdapter.getCurrentUser().name;
    document.body.classList.toggle(
      "invoice-focus-mode",
      Boolean(moduleDefinition && moduleDefinition.id === "invoices" && typeof moduleDefinition.isCompact === "function" && moduleDefinition.isCompact())
    );

    if (moduleDefinition) {
      title.textContent = moduleDefinition.title;
      eyebrow.textContent = moduleDefinition.description;
      stats.innerHTML = renderStats(moduleDefinition.stats ? moduleDefinition.stats(getContext()) : []);
      content.innerHTML = renderModuleSearchState() + moduleDefinition.render(getContext());
      bindSharedModuleActions(content);
      if (typeof moduleDefinition.afterRender === "function") {
        moduleDefinition.afterRender(content, getContext());
      }
      return;
    }

    title.textContent = "Napi áttekintés";
    eyebrow.textContent = "HR admin munkafelület";
    stats.innerHTML = renderStats(getOverviewStats());
    content.innerHTML = renderOverview();
    bindSharedModuleActions(content);
  }

  function renderModuleSearchState() {
    var h = platform.utils.escapeHtml;
    var term = String(platform.state.searchTerm || "").trim();
    if (!term) {
      return "";
    }
    return '<div class="search-state"><span>Szűrés ebben a modulban: <strong>' + h(term) + '</strong></span><button class="quiet-button" type="button" data-clear-search>Keresés törlése</button></div>';
  }

  function renderNav() {
    var modules = platform.getModules();
    var rows = [
      navButton({
        id: "overview",
        icon: "A",
        shortTitle: "Áttekintés",
        description: "Közös HR dashboard"
      })
    ].concat(modules.map(navButton));
    nav.innerHTML = rows.join("");
    nav.querySelectorAll("[data-module-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        platform.state.activeModuleId = button.dataset.moduleId;
        if (button.dataset.moduleId === "overview") {
          history.replaceState(null, "", location.pathname);
        } else {
          location.hash = button.dataset.moduleId;
        }
        render();
      });
    });
  }

  function navButton(moduleDefinition) {
    var h = platform.utils.escapeHtml;
    var active = platform.state.activeModuleId === moduleDefinition.id || (!platform.getModuleById(platform.state.activeModuleId) && moduleDefinition.id === "overview");
    return [
      '<button class="nav-button ' + (active ? "active" : "") + '" type="button" data-module-id="' + h(moduleDefinition.id) + '">',
      '<span class="nav-icon">' + h(moduleDefinition.icon || moduleDefinition.shortTitle.charAt(0)) + "</span>",
      "<span>",
      '<span class="nav-label">' + h(moduleDefinition.shortTitle || moduleDefinition.title) + "</span>",
      '<span class="nav-description">' + h(moduleDefinition.description || "") + "</span>",
      "</span>",
      "</button>"
    ].join("");
  }

  function renderStats(items) {
    return items
      .map(function (item) {
        return [
          '<article class="stat-card">',
          "<span>" + platform.utils.escapeHtml(item.label) + "</span>",
          "<strong>" + platform.utils.escapeHtml(item.value) + "</strong>",
          "<small>" + platform.utils.escapeHtml(item.detail || "") + "</small>",
          "</article>"
        ].join("");
      })
      .join("");
  }

  function getOverviewStats() {
    var all = [];
    platform.getModules().forEach(function (moduleDefinition) {
      if (moduleDefinition.id === "settings") {
        return;
      }
      if (typeof moduleDefinition.stats === "function") {
        all = all.concat(moduleDefinition.stats(getContext()).slice(0, 1));
      }
    });
    return all.slice(0, 4);
  }

  function renderOverview() {
    var h = platform.utils.escapeHtml;
    var modules = getOverviewModules();
    var tenant = platform.authTenantAdapter.getCurrentTenant();
    var user = platform.authTenantAdapter.getCurrentUser();
    var searchTerm = String(platform.state.searchTerm || "").trim();
    var todayLabel = formatTodayLabel();
    return [
      '<div class="overview-layout">',
      '  <section class="overview-hero">',
      '    <div>',
      '      <h3>' + h(greetingLabel()) + ', ' + h(firstName(user.name)) + '</h3>',
      '      <div class="overview-meta"><span>' + h(todayLabel) + '</span><span>' + h(tenant.mode) + '</span></div>',
      '      <p>Itt látod a mai admin teendőket, a nyitott számlákat, a jelenléti íveket, a flotta ügyeket és a rezsi/albérlet nyilvántartást.</p>',
      '    </div>',
      '    <div class="overview-hero-panel">',
      '      <span>Aktív cég</span>',
      '      <strong>' + h(tenant.name) + '</strong>',
      '      <small>' + h(tenant.mode) + '</small>',
      '    </div>',
      '  </section>',
      searchTerm ? '<div class="search-state"><span>Keresés: <strong>' + h(searchTerm) + '</strong></span><button class="quiet-button" type="button" data-clear-search>Keresés törlése</button></div>' : "",
      '  <section class="workbench-grid">',
      modules.map(renderModuleLauncher).join("") || '<article class="module-card"><h4>Nincs találat</h4><p>Próbálj másik kifejezést, például számla, autó, jelenlét vagy rezsi.</p></article>',
      '  </section>',
      '  <section class="overview-columns">',
      '    <article class="module-card focus-list">',
      '      <h4>Mai fókusz</h4>',
      renderDashboardTasks(),
      '    </article>',
      '  </section>',
      '</div>'
    ].join("");
  }

  function renderDashboardTasks() {
    var h = platform.utils.escapeHtml;
    var tasks = getDashboardTasks();
    if (!tasks.length) {
      return '<div class="dashboard-task empty"><strong>Nincs sürgős teendő</strong><span>A lejáratok és nyitott admin feladatok rendben vannak.</span></div>';
    }
    return tasks.map(function (task) {
      return [
        '<button class="dashboard-task ' + h(task.level || "info") + '" type="button" data-launch-module="' + h(task.moduleId) + '"' + (task.action ? ' data-launch-action="' + h(task.action) + '"' : "") + '>',
        '<span>' + h(task.label) + '</span>',
        '<strong>' + h(task.title) + '</strong>',
        '<small>' + h(task.detail) + '</small>',
        '</button>'
      ].join("");
    }).join("");
  }

  function firstName(name) {
    return String(name || "Felhasználó").trim().split(/\s+/)[0] || "Felhasználó";
  }

  function greetingLabel() {
    var hour = new Date().getHours();
    if (hour < 10) {
      return "Jó reggelt";
    }
    if (hour < 18) {
      return "Jó napot";
    }
    return "Jó estét";
  }

  function formatTodayLabel() {
    return new Intl.DateTimeFormat("hu-HU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date());
  }

  function getDashboardTasks() {
    return []
      .concat(getInvoiceTasks())
      .concat(getFleetTasks())
      .concat(getUtilitiesTasks())
      .concat(getAttendanceTasks())
      .sort(function (a, b) {
        return taskPriority(a) - taskPriority(b);
      })
      .slice(0, 8);
  }

  function getInvoiceTasks() {
    var invoices = readTenantCollection("invoices.records", []);
    var openOverdue = invoices.filter(function (invoice) {
      return !isInvoicePaid(invoice) && isPastDate(invoice.dueDate);
    });
    var dueSoon = invoices.filter(function (invoice) {
      var days = daysUntil(invoice.dueDate);
      return !isInvoicePaid(invoice) && days >= 0 && days <= INVOICE_DUE_SOON_DAYS;
    });
    var tasks = [];
    if (openOverdue.length) {
      var overdueTotal = openOverdue.reduce(sumInvoiceGross, 0);
      tasks.push({
        moduleId: "invoices",
        action: "invoice-overdue",
        level: "danger",
        label: "Lejárt számla",
        title: openOverdue.length + " fizetésre váró számla",
        detail: platform.utils.formatCurrency(overdueTotal) + " lejárt határidővel"
      });
    }
    if (dueSoon.length) {
      var soonTotal = dueSoon.reduce(sumInvoiceGross, 0);
      var nearestDays = dueSoon.reduce(function (nearest, invoice) {
        return Math.min(nearest, daysUntil(invoice.dueDate));
      }, INVOICE_DUE_SOON_DAYS);
      tasks.push({
        moduleId: "invoices",
        action: "invoice-due-soon",
        level: "warning",
        label: "Közeli számlalejárat",
        title: dueSoon.length + " számla " + INVOICE_DUE_SOON_DAYS + " napon belül",
        detail: platform.utils.formatCurrency(soonTotal) + " / legközelebb: " + deadlineText(nearestDays).toLocaleLowerCase("hu-HU")
      });
    }
    return tasks;
  }

  function getFleetTasks() {
    var vehicles = readTenantCollection("fleet.vehicles", []);
    return vehicles.reduce(function (items, vehicle) {
      var motDays = daysUntil(vehicle.motDate);
      var insDays = daysUntil(vehicle.insDate);
      if (motDays < 30) {
        items.push({
          moduleId: "fleet",
          level: motDays < 0 ? "danger" : "warning",
          label: "Flotta határidő",
          title: vehicle.plate + " műszaki",
          detail: deadlineText(motDays)
        });
      }
      if (insDays < 30) {
        items.push({
          moduleId: "fleet",
          level: insDays < 0 ? "danger" : "warning",
          label: "Flotta határidő",
          title: vehicle.plate + " KGFB",
          detail: deadlineText(insDays)
        });
      }
      return items;
    }, []);
  }

  function getUtilitiesTasks() {
    var state = readTenantCollection("utilities.state", null);
    if (!state || !state.settlements || !state.units) {
      return [];
    }
    var unitsById = {};
    state.units.forEach(function (unit) {
      unitsById[unit.id] = unit;
    });
    return Object.keys(state.settlements).reduce(function (items, key) {
      var settlement = state.settlements[key];
      var unit = unitsById[settlement.unitId];
      var balance = calculateUtilityBalance(state, unit, settlement);
      if (balance > 0 && isPastDate(settlement.dueDate)) {
        items.push({
          moduleId: "utilities",
          level: "warning",
          label: "Rezsi / albérlet",
          title: unit ? unit.name : "Elszámolás",
          detail: platform.utils.formatCurrency(balance) + " nyitott egyenleg"
        });
      }
      return items;
    }, []);
  }

  function getAttendanceTasks() {
    var today = new Date();
    var day = today.getDay();
    if (day !== 4 && day !== 5) {
      return [];
    }
    return [{
      moduleId: "attendance",
      level: "info",
      label: "Jelenléti ív",
      title: "Heti ívek előkészítése",
      detail: "Nyomtatás / PDF mentés a hét végéhez"
    }];
  }

  function readTenantCollection(collectionName, fallback) {
    if (platform.storage && typeof platform.storage.readCollection === "function") {
      return platform.storage.readCollection(collectionName, fallback);
    }
    try {
      var tenant = platform.authTenantAdapter.getCurrentTenant();
      var key = "hr-admin-platform:" + tenant.id + ":" + collectionName;
      var raw = window.localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function calculateUtilityBalance(state, unit, settlement) {
    if (!unit || !settlement) {
      return 0;
    }
    var labels = ["water", "electricity", "gas"];
    var utilityTotal = labels.reduce(function (sum, key) {
      var reading = settlement.readings && settlement.readings[key] ? settlement.readings[key] : {};
      var consumption = Math.max(0, Number(reading.current || 0) - Number(reading.previous || 0));
      return sum + consumption * Number(reading.rate || state.rates && state.rates[key] || 0);
    }, 0);
    var recurringTotal = (state.recurringCharges || []).filter(function (charge) {
      return charge.unitId === unit.id && charge.active && !(settlement.disabledRecurringChargeIds || []).includes(charge.id);
    }).reduce(function (sum, charge) {
      return sum + Number(charge.amount || 0);
    }, 0);
    var extraTotal = (settlement.extras || []).reduce(function (sum, extra) {
      return sum + Number(extra.amount || 0);
    }, 0);
    var total = utilityTotal + Number(unit.rent || 0) + recurringTotal + extraTotal;
    return total - Number(settlement.paid || 0);
  }

  function normalizeInvoiceStatus(value) {
    return String(value || "").toLocaleLowerCase("hu-HU").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function isInvoicePaid(invoice) {
    var status = normalizeInvoiceStatus(invoice && invoice.status);
    return status === "utalva" || status === "kiegyenlitve" || status === "fizetve" || status === "paid" || status.includes("befizet") || isAutoSettledInvoice(invoice);
  }

  function isAutoSettledInvoice(invoice) {
    var paymentMethod = normalizeInvoiceStatus(invoice && invoice.paymentMethod);
    return paymentMethod.includes("kesz") || paymentMethod === "kp";
  }

  function sumInvoiceGross(sum, invoice) {
    return sum + Number(invoice.grossAmount || 0);
  }

  function isPastDate(value) {
    var date = parseLocalDate(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function daysUntil(value) {
    var target = parseLocalDate(value);
    if (Number.isNaN(target.getTime())) {
      return 9999;
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / 86400000);
  }

  function parseLocalDate(value) {
    var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    var date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }

  function deadlineText(days) {
    if (days < 0) {
      return "Lejárt " + Math.abs(days) + " napja";
    }
    if (days === 0) {
      return "Ma jár le";
    }
    return days + " nap múlva";
  }

  function taskPriority(task) {
    var levels = { danger: 0, warning: 1, info: 2 };
    return levels[task.level] == null ? 3 : levels[task.level];
  }

  function getStorageModeLabel() {
    var info = platform.storage && typeof platform.storage.getInfo === "function" ? platform.storage.getInfo() : { mode: "browser-localStorage" };
    if (info.mode === "native-file") {
      return "Mentés: helyi Windows adatfájl" + (info.dataPath ? " - " + info.dataPath : "");
    }
    if (info.mode === "shared-file") {
      return "Mentés: közös adatfájl" + (info.dataPath ? " - " + info.dataPath : "");
    }
    return "Mentés: böngésző localStorage fallback";
  }

  function getOverviewModules() {
    var term = String(platform.state.searchTerm || "").trim();
    var modules = platform.getModules();
    if (!term) {
      return modules;
    }
    return modules.filter(function (moduleDefinition) {
      return platform.utils.matchesSearch(
        {
          title: moduleDefinition.title,
          shortTitle: moduleDefinition.shortTitle,
          description: moduleDefinition.description,
          permission: moduleDefinition.permission,
          teaser: getModuleTeaser(moduleDefinition.id),
          action: getModuleAction(moduleDefinition.id)
        },
        term
      );
    });
  }

  function renderModuleLauncher(moduleDefinition) {
    var h = platform.utils.escapeHtml;
    var moduleStats = typeof moduleDefinition.stats === "function" ? moduleDefinition.stats(getContext()) : [];
    var primaryStat = moduleStats[0] || { label: "Tétel", value: "-", detail: "" };
    return [
      '<article class="workbench-card module-launcher" data-launch-module="' + h(moduleDefinition.id) + '">',
      '  <div class="workbench-card-top">',
      '    <span class="workbench-icon">' + h(moduleDefinition.icon || moduleDefinition.shortTitle.charAt(0)) + '</span>',
      '    <span class="pill">' + h(primaryStat.label) + '</span>',
      '  </div>',
      '  <h4>' + h(moduleDefinition.title) + '</h4>',
      '  <p>' + h(getModuleTeaser(moduleDefinition.id)) + '</p>',
      '  <div class="workbench-card-bottom">',
      '    <strong>' + h(primaryStat.value) + '</strong>',
      '    <span>' + h(getModuleAction(moduleDefinition.id)) + '</span>',
      '  </div>',
      '</article>'
    ].join("");
  }

  function renderFocusItems(modules) {
    return modules.map(function (moduleDefinition) {
      var h = platform.utils.escapeHtml;
      var moduleStats = typeof moduleDefinition.stats === "function" ? moduleDefinition.stats(getContext()) : [];
      var first = moduleStats[0] || { value: "-", detail: "" };
      return [
        '<button class="focus-row" type="button" data-launch-module="' + h(moduleDefinition.id) + '">',
        '  <span>' + h(moduleDefinition.title) + '</span>',
        '  <strong>' + h(first.value) + '</strong>',
        '  <small>' + h(first.detail || getModuleAction(moduleDefinition.id)) + '</small>',
        '</button>'
      ].join("");
    }).join("");
  }

  function getModuleTeaser(moduleId) {
    var teasers = {
      utilities: "Ingatlanok, albérletek és havi elszámolások gyors ellenőrzése.",
      fleet: "Autók, tankolások, szervizek és lejáratok egy listában.",
      attendance: "Heti jelenléti ív összeállítása és nyomtatása.",
      invoices: "Havi számlaellenőrzés, szűrés, rendezés és kiegyenlítés.",
      settings: "Cégadatok, felhasználó, számla alapértékek és mentés."
    };
    return teasers[moduleId] || "Adminisztrációs modul megnyitása.";
  }

  function getModuleAction(moduleId) {
    var actions = {
      utilities: "Rezsi megnyitása",
      fleet: "Flotta megnyitása",
      attendance: "Heti ív készítése",
      invoices: "Számlák ellenőrzése",
      settings: "Beállítások"
    };
    return actions[moduleId] || "Megnyitás";
  }

  function bindSharedModuleActions(root) {
    root.querySelectorAll("[data-export]").forEach(function (button) {
      button.addEventListener("click", function () {
        var moduleDefinition = platform.getModuleById(button.dataset.export);
        platform.exportPrintAdapter.exportModule(moduleDefinition, getContext());
      });
    });
    root.querySelectorAll("[data-export-manifest]").forEach(function (button) {
      button.addEventListener("click", function () {
        platform.exportPrintAdapter.exportJson("hr-admin-module-manifest.json", platform.getManifest());
      });
    });
    root.querySelectorAll("[data-backup-data]").forEach(function (button) {
      button.addEventListener("click", function () {
        platform.storage.exportBackup().then(function (result) {
          if (result && result.fallbackPayload) {
            platform.exportPrintAdapter.exportJson("hr-admin-backup.json", result.fallbackPayload);
          }
        }).catch(function (error) {
          alert(error.message || "Nem sikerült a biztonsági mentés.");
        });
      });
    });
    root.querySelectorAll("[data-restore-data]").forEach(function (button) {
      button.addEventListener("click", function () {
        platform.storage.importBackup().then(function (result) {
          if (!result || result.canceled) {
            return;
          }
          alert("A mentés visszatöltve. Az app újratöltődik.");
          location.reload();
        }).catch(function (error) {
          alert(error.message || "Nem sikerült a mentés visszatöltése.");
        });
      });
    });
    root.querySelectorAll("[data-launch-module]").forEach(function (card) {
      card.addEventListener("click", function () {
        var moduleId = card.dataset.launchModule;
        var moduleDefinition = platform.getModuleById(moduleId);
        if (moduleDefinition && card.dataset.launchAction && typeof moduleDefinition.applyLaunchAction === "function") {
          moduleDefinition.applyLaunchAction(card.dataset.launchAction, getContext());
        }
        platform.state.activeModuleId = moduleId;
        location.hash = moduleId;
        render();
      });
    });
    root.querySelectorAll("[data-clear-search]").forEach(function (button) {
      button.addEventListener("click", function () {
        platform.state.searchTerm = "";
        search.value = "";
        render();
        search.focus();
      });
    });
  }

  function getContext() {
    return {
      tenant: platform.authTenantAdapter.getCurrentTenant(),
      user: platform.authTenantAdapter.getCurrentUser(),
      searchTerm: platform.state.searchTerm
    };
  }

  boot();
})();
