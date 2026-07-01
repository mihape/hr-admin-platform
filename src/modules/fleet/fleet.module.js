(function () {
  var seedVehicles = [
    {
      id: "veh-001",
      plate: "ABC-123",
      model: "Ford Transit",
      odometer: 154200,
      motDate: "2026-12-15",
      insDate: "2026-11-01"
    },
    {
      id: "veh-002",
      plate: "TZG-804",
      model: "Toyota Proace",
      odometer: 84210,
      motDate: "2026-06-24",
      insDate: "2026-07-04"
    }
  ];

  var seedRefuels = [
    {
      id: "ref-001",
      vehicleId: "veh-001",
      date: "2026-05-10",
      odometer: 153800,
      amount: 65,
      cost: 38000
    },
    {
      id: "ref-002",
      vehicleId: "veh-001",
      date: "2026-05-14",
      odometer: 154200,
      amount: 60,
      cost: 35000
    },
    {
      id: "ref-003",
      vehicleId: "veh-002",
      date: "2026-05-18",
      odometer: 84210,
      amount: 52,
      cost: 31400
    }
  ];

  var seedServices = [
    {
      id: "srv-001",
      vehicleId: "veh-001",
      date: "2026-01-15",
      type: "Karbantartás",
      cost: 45000,
      description: "Olajcsere és szűrők"
    }
  ];

  var selectedVehicleId = window.localStorage.getItem("hr.fleet.selectedVehicleId") || "";
  var activeFleetSection = window.localStorage.getItem("hr.fleet.activeSection") || "overview";
  var pendingFleetEdit = null;

  function getVehicles() {
    return window.HRPlatform.storage.readCollection("fleet.vehicles", seedVehicles);
  }

  function saveVehicles(items) {
    window.HRPlatform.storage.writeCollection("fleet.vehicles", items);
  }

  function getRefuels() {
    return window.HRPlatform.storage.readCollection("fleet.refuels", seedRefuels);
  }

  function saveRefuels(items) {
    window.HRPlatform.storage.writeCollection("fleet.refuels", items);
  }

  function getServices() {
    return window.HRPlatform.storage.readCollection("fleet.services", seedServices);
  }

  function saveServices(items) {
    window.HRPlatform.storage.writeCollection("fleet.services", items);
  }

  function findVehicle(vehicleId) {
    return getVehicles().find(function (item) {
      return item.id === vehicleId;
    });
  }

  function getVehicleName(vehicleId) {
    var vehicle = findVehicle(vehicleId);
    return vehicle ? vehicle.plate + " - " + vehicle.model : "Törölt autó";
  }

  function calculateConsumption(refuel) {
    var refuels = getRefuels()
      .filter(function (item) {
        return item.vehicleId === refuel.vehicleId;
      })
      .sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
      });
    var index = refuels.findIndex(function (item) {
      return item.id === refuel.id;
    });
    var previous = refuels[index - 1];

    if (!previous) {
      return null;
    }

    var distance = Number(refuel.odometer || 0) - Number(previous.odometer || 0);
    if (distance <= 0) {
      return null;
    }

    return (Number(refuel.amount || 0) / distance) * 100;
  }

  function getAlerts() {
    var today = new Date();
    return getVehicles().filter(function (vehicle) {
      var motDiff = daysUntil(vehicle.motDate, today);
      var insDiff = daysUntil(vehicle.insDate, today);
      return motDiff < 30 || insDiff < 30;
    });
  }

  function stats() {
    var thisMonth = getMonthKey(new Date());
    var refuelCost = getRefuels().reduce(function (sum, item) {
      return sum + Number(item.cost || 0);
    }, 0);
    var serviceCost = getServices().reduce(function (sum, item) {
      return sum + Number(item.cost || 0);
    }, 0);
    var monthlyCost = getRefuels()
      .filter(function (item) { return getMonthKey(item.date) === thisMonth; })
      .concat(getServices().filter(function (item) { return getMonthKey(item.date) === thisMonth; }))
      .reduce(function (sum, item) { return sum + Number(item.cost || 0); }, 0);

    return [
      {
        label: "Járművek",
        value: getVehicles().length,
        detail: "Aktív flotta"
      },
      {
        label: "Lejárati figyelmeztetés",
        value: getAlerts().length,
        detail: "Műszaki vagy KGFB"
      },
      {
        label: "Havi költség",
        value: window.HRPlatform.utils.formatCurrency(monthlyCost),
        detail: "Tankolás + szerviz"
      },
      {
        label: "Teljes költség",
        value: window.HRPlatform.utils.formatCurrency(refuelCost + serviceCost),
        detail: "Rögzített tételek alapján"
      }
    ];
  }

  function render(context) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var search = context.searchTerm;
    var vehicles = getVehicles();
    var visibleVehicles = vehicles.filter(function (item) {
      return window.HRPlatform.utils.matchesSearch(item, search);
    });
    var refuels = getRefuels();
    var services = getServices();
    var selectedVehicle = ensureSelectedVehicle(visibleVehicles, vehicles);
    var selectedRefuels = selectedVehicle ? filterByVehicle(refuels, selectedVehicle.id) : [];
    var selectedServices = selectedVehicle ? filterByVehicle(services, selectedVehicle.id) : [];
    var searchedRefuels = refuels.filter(function (item) {
      return window.HRPlatform.utils.matchesSearch(Object.assign({}, item, { vehicle: getVehicleName(item.vehicleId) }), search);
    });
    var searchedServices = services.filter(function (item) {
      return window.HRPlatform.utils.matchesSearch(Object.assign({}, item, { vehicle: getVehicleName(item.vehicleId) }), search);
    });
    var vehicleOptions = vehicles
      .map(function (vehicle) {
        return '<option value="' + h(vehicle.id) + '"' + (selectedVehicle && selectedVehicle.id === vehicle.id ? " selected" : "") + ">" + h(vehicle.plate + " - " + vehicle.model) + "</option>";
      })
      .join("");

    return [
      '<div class="module-layout" data-module-root="fleet">',
      '  <div class="module-header">',
      "    <div>",
      '      <p class="module-kicker">Céges autók</p>',
      "      <h3>Flotta modul</h3>",
      "      <p>Jármű dashboard, tankolások, szervizek, lejáratok és havi kimutatások autónként.</p>",
      "    </div>",
      '    <div class="module-actions">',
      '      <button class="secondary-button" type="button" data-export="fleet">CSV export</button>',
      "    </div>",
      "  </div>",
      renderSubnav("fleet", activeFleetSection, [
        { id: "overview", label: "Áttekintés" },
        { id: "vehicles", label: "Autók" },
        { id: "forms", label: "Rögzítés" },
        { id: "logs", label: "Naplók" }
      ]),
      renderFleetSection(activeFleetSection, vehicles, refuels, services, visibleVehicles, selectedVehicle, selectedRefuels, selectedServices, vehicleOptions, searchedRefuels, searchedServices),
      "</div>"
    ].join("");
  }

  function renderFleetSection(section, vehicles, refuels, services, visibleVehicles, selectedVehicle, selectedRefuels, selectedServices, vehicleOptions, searchedRefuels, searchedServices) {
    if (section === "vehicles") {
      return renderVehicleWorkbench(visibleVehicles, selectedVehicle, selectedRefuels, selectedServices);
    }
    if (section === "forms") {
      return renderForms(vehicleOptions, selectedVehicle);
    }
    if (section === "logs") {
      return renderGlobalLogs(searchedRefuels, searchedServices);
    }
    return renderFleetDashboard(vehicles, refuels, services);
  }

  function renderFleetDashboard(vehicles, refuels, services) {
    var money = window.HRPlatform.utils.formatCurrency;
    var thisMonth = getMonthKey(new Date());
    var monthlyFuel = sumByMonth(refuels, thisMonth);
    var monthlyService = sumByMonth(services, thisMonth);
    var recentRefuels = refuels.slice().sort(sortByDateDesc).slice(0, 5);
    var alertRows = buildDeadlineAlerts(vehicles);

    return [
      '<section class="fleet-dashboard">',
      statCard("Aktív járművek", vehicles.length, "Rendszám, km óra, határidők"),
      statCard("Havi üzemanyag", money(monthlyFuel), "Aktuális hónap"),
      statCard("Havi szerviz", money(monthlyService), "Munkalapok alapján"),
      statCard("Figyelendő határidő", alertRows.length, "Műszaki vagy KGFB 30 napon belül"),
      '</section>',
      '<section class="fleet-overview-grid">',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Legutóbbi tankolások</h4><span>Összesített</span></div>',
      '<div class="table-wrap compact"><table><thead><tr><th>Autó</th><th>Dátum</th><th>Liter</th><th>Költség</th></tr></thead><tbody>',
      recentRefuels.map(renderRecentRefuelRow).join("") || '<tr><td colspan="4">Még nincs rögzített tankolás.</td></tr>',
      '</tbody></table></div>',
      '</article>',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Határidők</h4><span>Műszaki és KGFB</span></div>',
      '<div class="fleet-alert-list">',
      alertRows.map(renderDeadlineAlertRow).join("") || '<p class="muted-line">Nincs lejárt vagy 30 napon belüli flotta határidő.</p>',
      '</div>',
      '</article>',
      '</section>'
    ].join("");
  }

  function renderVehicleWorkbench(vehicles, selectedVehicle, refuels, services) {
    return [
      '<section class="fleet-workbench">',
      '<aside class="fleet-vehicle-list" aria-label="Járművek">',
      '<div class="fleet-panel-title"><h4>Járművek</h4><span>' + vehicles.length + ' db</span></div>',
      vehicles.map(function (vehicle) {
        return renderVehicleButton(vehicle, selectedVehicle && selectedVehicle.id === vehicle.id);
      }).join("") || '<p class="muted-line">Nincs találat a keresésre.</p>',
      '</aside>',
      '<section class="fleet-detail">',
      selectedVehicle ? renderVehicleDetail(selectedVehicle, refuels, services) : '<div class="empty-state"><strong>Nincs kiválasztott autó</strong><p>Adj hozzá vagy válassz ki egy járművet a részletekhez.</p></div>',
      '</section>',
      '</section>'
    ].join("");
  }

  function renderSubnav(scope, activeId, items) {
    return [
      '<nav class="module-subnav" aria-label="Flotta almenü">',
      items.map(function (item) {
        return '<button class="module-subnav-button ' + (item.id === activeId ? "active" : "") + '" type="button" data-subnav-scope="' + scope + '" data-subnav-section="' + item.id + '">' + item.label + "</button>";
      }).join(""),
      "</nav>"
    ].join("");
  }

  function bindSubnav(root, scope, onChange) {
    root.querySelectorAll('[data-subnav-scope="' + scope + '"]').forEach(function (button) {
      button.addEventListener("click", function () {
        onChange(button.getAttribute("data-subnav-section"));
        window.HRPlatform.notify();
      });
    });
  }

  function renderVehicleButton(vehicle, active) {
    var h = window.HRPlatform.utils.escapeHtml;
    return [
      '<button class="fleet-vehicle-button ' + (active ? "active" : "") + '" type="button" data-select-vehicle="' + h(vehicle.id) + '">',
      '<span class="fleet-plate">' + h(vehicle.plate) + '</span>',
      '<strong>' + h(vehicle.model) + '</strong>',
      '<small>' + Number(vehicle.odometer || 0).toLocaleString("hu-HU") + ' km</small>',
      renderVehicleStatus(vehicle),
      '</button>'
    ].join("");
  }

  function renderVehicleDetail(vehicle, refuels, services) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var date = window.HRPlatform.utils.formatDate;
    var fuelCost = sumCosts(refuels);
    var serviceCost = sumCosts(services);
    var monthlyRows = buildMonthlyRows(vehicle.id);
    var lastRefuel = refuels.slice().sort(sortByDateDesc)[0];
    var lastService = services.slice().sort(sortByDateDesc)[0];

    return [
      '<div class="fleet-detail-head">',
      '<div><span class="fleet-plate dark">' + h(vehicle.plate) + '</span><h4>' + h(vehicle.model) + '</h4><p>' + Number(vehicle.odometer || 0).toLocaleString("hu-HU") + ' km óraállás</p></div>',
      '<div class="fleet-detail-actions">',
      '<button class="secondary-button" type="button" data-edit-vehicle="' + h(vehicle.id) + '">Autó szerkesztése</button>',
      '<button class="quiet-button danger" type="button" data-delete-vehicle="' + h(vehicle.id) + '">Törlés</button>',
      '</div>',
      '</div>',
      '<div class="fleet-mini-grid">',
      miniMetric("Műszaki", date(vehicle.motDate), deadlineText(vehicle.motDate)),
      miniMetric("KGFB", date(vehicle.insDate), deadlineText(vehicle.insDate)),
      miniMetric("Tankolás összesen", money(fuelCost), refuels.length + " bejegyzés"),
      miniMetric("Szerviz összesen", money(serviceCost), services.length + " munkalap"),
      '</div>',
      '<div class="fleet-overview-grid">',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Havi kimutatás</h4><span>Autónként</span></div>',
      '<div class="table-wrap compact"><table><thead><tr><th>Hónap</th><th>Tankolás</th><th>Szerviz</th><th>Összesen</th></tr></thead><tbody>',
      monthlyRows.map(renderMonthlyRow).join("") || '<tr><td colspan="4">Ehhez az autóhoz még nincs havi adat.</td></tr>',
      '</tbody></table></div>',
      '</article>',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Aktuális állapot</h4><span>Utolsó események</span></div>',
      '<div class="fleet-summary-list">',
      summaryLine("Utolsó tankolás", lastRefuel ? date(lastRefuel.date) + " - " + money(lastRefuel.cost) : "Nincs adat"),
      summaryLine("Utolsó szerviz", lastService ? date(lastService.date) + " - " + h(lastService.type) : "Nincs adat"),
      summaryLine("Átlagfogyasztás", averageConsumption(refuels)),
      summaryLine("Összes költség", money(fuelCost + serviceCost)),
      '</div>',
      '</article>',
      '</div>',
      renderVehicleLogs(refuels, services)
    ].join("");
  }

  function renderVehicleLogs(refuels, services) {
    return [
      '<section class="fleet-overview-grid">',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Tankolások</h4><span>Kiválasztott autó</span></div>',
      '<div class="table-wrap compact"><table><thead><tr><th>Dátum</th><th>Km</th><th>Liter</th><th>Költség</th><th>Fogyasztás</th><th></th></tr></thead><tbody>',
      refuels.slice().sort(sortByDateDesc).map(renderVehicleRefuelRow).join("") || '<tr><td colspan="6">Ehhez a járműhöz még nincs tankolás.</td></tr>',
      '</tbody></table></div>',
      '</article>',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Szerviz / karbantartás</h4><span>Kiválasztott autó</span></div>',
      '<div class="table-wrap compact"><table><thead><tr><th>Dátum</th><th>Típus</th><th>Leírás</th><th>Költség</th><th></th></tr></thead><tbody>',
      services.slice().sort(sortByDateDesc).map(renderVehicleServiceRow).join("") || '<tr><td colspan="5">Ehhez a járműhöz még nincs munkalap.</td></tr>',
      '</tbody></table></div>',
      '</article>',
      '</section>'
    ].join("");
  }

  function renderForms(vehicleOptions, selectedVehicle) {
    return [
      '<section class="fleet-form-grid">',
      '<form class="form-panel fleet-form" id="fleetVehicleForm">',
      '<input type="hidden" name="id" />',
      '<h4>Autó adatai</h4>',
      field("Rendszám", '<input name="plate" required placeholder="ABC-123" />'),
      field("Típus / modell", '<input name="model" required placeholder="Ford Transit" />'),
      field("Km óra", '<input name="odometer" inputmode="decimal" required placeholder="154200" />'),
      field("Műszaki", '<input name="motDate" type="date" required />'),
      field("KGFB", '<input name="insDate" type="date" required />'),
      '<div class="form-actions"><button class="primary-button" type="submit">Autó mentése</button><button class="quiet-button" type="button" data-reset-form="fleetVehicleForm">Ürítés</button></div>',
      '</form>',
      '<form class="form-panel fleet-form" id="fleetRefuelForm">',
      '<input type="hidden" name="id" />',
      '<h4>Tankolás</h4>',
      field("Autó", '<select name="vehicleId" required>' + vehicleOptions + "</select>"),
      field("Dátum", '<input name="date" type="date" required />'),
      field("Km óra", '<input name="odometer" inputmode="decimal" required />'),
      field("Liter", '<input name="amount" inputmode="decimal" required />'),
      field("Költség", '<input name="cost" inputmode="decimal" required />'),
      '<div class="form-actions"><button class="primary-button" type="submit">Tankolás mentése</button><button class="quiet-button" type="button" data-reset-form="fleetRefuelForm">Ürítés</button></div>',
      '</form>',
      '<form class="form-panel fleet-form" id="fleetServiceForm">',
      '<input type="hidden" name="id" />',
      '<h4>Szerviz / munkalap</h4>',
      field("Autó", '<select name="vehicleId" required>' + vehicleOptions + "</select>"),
      field("Dátum", '<input name="date" type="date" required />'),
      field("Típus", '<select name="type"><option>Karbantartás</option><option>Javítás</option><option>Gumicsere</option><option>Eseti vizsga</option></select>'),
      field("Költség", '<input name="cost" inputmode="decimal" required />'),
      field("Leírás", '<input name="description" placeholder="Olajcsere" />'),
      '<div class="form-actions"><button class="primary-button" type="submit">Munkalap mentése</button><button class="quiet-button" type="button" data-reset-form="fleetServiceForm">Ürítés</button></div>',
      '</form>',
      '</section>'
    ].join("");
  }

  function renderGlobalLogs(refuels, services) {
    return [
      '<section class="fleet-overview-grid">',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Teljes tankolási napló</h4><span>Kereshető lista</span></div>',
      '<div class="table-wrap compact"><table><thead><tr><th>Autó</th><th>Dátum</th><th>Km</th><th>Liter</th><th>Költség</th><th>Fogyasztás</th><th></th></tr></thead><tbody>',
      refuels.slice().sort(sortByDateDesc).map(renderGlobalRefuelRow).join("") || '<tr><td colspan="7">Még nincs tankolás.</td></tr>',
      '</tbody></table></div>',
      '</article>',
      '<article class="fleet-panel">',
      '<div class="fleet-panel-title"><h4>Munkalapok és szervizek</h4><span>Kereshető lista</span></div>',
      '<div class="table-wrap compact"><table><thead><tr><th>Autó</th><th>Dátum</th><th>Típus</th><th>Leírás</th><th>Költség</th><th></th></tr></thead><tbody>',
      services.slice().sort(sortByDateDesc).map(renderGlobalServiceRow).join("") || '<tr><td colspan="6">Még nincs munkalap.</td></tr>',
      '</tbody></table></div>',
      '</article>',
      '</section>'
    ].join("");
  }

  function afterRender(root) {
    bindSubnav(root, "fleet", function (section) {
      activeFleetSection = section;
      window.localStorage.setItem("hr.fleet.activeSection", section);
    });

    root.querySelectorAll("[data-select-vehicle]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectedVehicleId = button.getAttribute("data-select-vehicle");
        window.localStorage.setItem("hr.fleet.selectedVehicleId", selectedVehicleId);
        window.HRPlatform.notify();
      });
    });

    bindForm(root, "#fleetVehicleForm", saveVehicleForm);
    bindForm(root, "#fleetRefuelForm", saveRefuelForm);
    bindForm(root, "#fleetServiceForm", saveServiceForm);
    bindEditButtons(root);
    bindResetButtons(root);
    applyPendingFleetEdit(root);

    bindDelete(root, "delete-vehicle", function (id) {
      saveVehicles(getVehicles().filter(function (item) { return item.id !== id; }));
      saveRefuels(getRefuels().filter(function (item) { return item.vehicleId !== id; }));
      saveServices(getServices().filter(function (item) { return item.vehicleId !== id; }));
      selectedVehicleId = "";
      window.localStorage.removeItem("hr.fleet.selectedVehicleId");
    });
    bindDelete(root, "delete-refuel", function (id) {
      saveRefuels(getRefuels().filter(function (item) { return item.id !== id; }));
    });
    bindDelete(root, "delete-service", function (id) {
      saveServices(getServices().filter(function (item) { return item.id !== id; }));
    });
  }

  function saveVehicleForm(data) {
    var vehicles = getVehicles();
    var id = data.id || "veh-" + Date.now();
    var item = {
      id: id,
      plate: String(data.plate || "").trim().toUpperCase(),
      model: String(data.model || "").trim(),
      odometer: parseDecimalValue(data.odometer),
      motDate: data.motDate,
      insDate: data.insDate
    };

    if (data.id) {
      saveVehicles(vehicles.map(function (vehicle) { return vehicle.id === id ? item : vehicle; }));
    } else {
      vehicles.unshift(item);
      saveVehicles(vehicles);
    }
    selectedVehicleId = id;
    window.localStorage.setItem("hr.fleet.selectedVehicleId", id);
  }

  function saveRefuelForm(data) {
    var refuels = getRefuels();
    var vehicles = getVehicles();
    var id = data.id || "ref-" + Date.now();
    var odometer = parseDecimalValue(data.odometer);
    var item = {
      id: id,
      vehicleId: data.vehicleId,
      date: data.date,
      odometer: odometer,
      amount: parseDecimalValue(data.amount),
      cost: parseDecimalValue(data.cost)
    };

    if (data.id) {
      saveRefuels(refuels.map(function (refuel) { return refuel.id === id ? item : refuel; }));
    } else {
      refuels.unshift(item);
      saveRefuels(refuels);
    }

    saveVehicles(
      vehicles.map(function (vehicle) {
        if (vehicle.id === data.vehicleId && odometer > Number(vehicle.odometer || 0)) {
          return Object.assign({}, vehicle, { odometer: odometer });
        }
        return vehicle;
      })
    );
    selectedVehicleId = data.vehicleId;
    window.localStorage.setItem("hr.fleet.selectedVehicleId", selectedVehicleId);
  }

  function saveServiceForm(data) {
    var services = getServices();
    var id = data.id || "srv-" + Date.now();
    var item = {
      id: id,
      vehicleId: data.vehicleId,
      date: data.date,
      type: data.type,
      cost: parseDecimalValue(data.cost),
      description: String(data.description || "").trim()
    };

    if (data.id) {
      saveServices(services.map(function (service) { return service.id === id ? item : service; }));
    } else {
      services.unshift(item);
      saveServices(services);
    }
    selectedVehicleId = data.vehicleId;
    window.localStorage.setItem("hr.fleet.selectedVehicleId", selectedVehicleId);
  }

  function bindForm(root, selector, onSubmit) {
    var form = root.querySelector(selector);
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      onSubmit(Object.fromEntries(new FormData(form).entries()));
      form.reset();
      window.HRPlatform.notify();
    });
  }

  function bindEditButtons(root) {
    root.querySelectorAll("[data-edit-vehicle]").forEach(function (button) {
      button.addEventListener("click", function () {
        requestFleetEdit(root, "vehicle", button.getAttribute("data-edit-vehicle"));
      });
    });

    root.querySelectorAll("[data-edit-refuel]").forEach(function (button) {
      button.addEventListener("click", function () {
        requestFleetEdit(root, "refuel", button.getAttribute("data-edit-refuel"));
      });
    });

    root.querySelectorAll("[data-edit-service]").forEach(function (button) {
      button.addEventListener("click", function () {
        requestFleetEdit(root, "service", button.getAttribute("data-edit-service"));
      });
    });
  }

  function requestFleetEdit(root, type, id) {
    pendingFleetEdit = { type: type, id: id };
    if (root.querySelector("#fleetVehicleForm")) {
      applyPendingFleetEdit(root);
      return;
    }
    activeFleetSection = "forms";
    window.localStorage.setItem("hr.fleet.activeSection", activeFleetSection);
    window.HRPlatform.notify();
  }

  function applyPendingFleetEdit(root) {
    if (!pendingFleetEdit) {
      return;
    }
    if (pendingFleetEdit.type === "vehicle") {
      fillForm(root.querySelector("#fleetVehicleForm"), findVehicle(pendingFleetEdit.id));
    }
    if (pendingFleetEdit.type === "refuel") {
      fillForm(root.querySelector("#fleetRefuelForm"), getRefuels().find(function (item) { return item.id === pendingFleetEdit.id; }));
    }
    if (pendingFleetEdit.type === "service") {
      fillForm(root.querySelector("#fleetServiceForm"), getServices().find(function (item) { return item.id === pendingFleetEdit.id; }));
    }
    pendingFleetEdit = null;
  }

  function bindResetButtons(root) {
    root.querySelectorAll("[data-reset-form]").forEach(function (button) {
      button.addEventListener("click", function () {
        var form = root.querySelector("#" + button.getAttribute("data-reset-form"));
        if (form) {
          form.reset();
          var idInput = form.querySelector('input[name="id"]');
          if (idInput) {
            idInput.value = "";
          }
        }
      });
    });
  }

  function fillForm(form, data) {
    if (!form || !data) {
      return;
    }
    Object.keys(data).forEach(function (key) {
      var control = form.querySelector('[name="' + key + '"]');
      if (control) {
        control.value = data[key];
      }
    });
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function bindDelete(root, name, onDelete) {
    root.querySelectorAll("[data-" + name + "]").forEach(function (button) {
      button.addEventListener("click", function () {
        onDelete(button.getAttribute("data-" + name));
        window.HRPlatform.notify();
      });
    });
  }

  function ensureSelectedVehicle(visibleVehicles, allVehicles) {
    var selected = findVehicle(selectedVehicleId);
    if (selected && visibleVehicles.some(function (vehicle) { return vehicle.id === selected.id; })) {
      return selected;
    }
    selected = visibleVehicles[0] || allVehicles[0] || null;
    if (selected) {
      selectedVehicleId = selected.id;
      window.localStorage.setItem("hr.fleet.selectedVehicleId", selectedVehicleId);
    }
    return selected;
  }

  function renderVehicleStatus(vehicle) {
    var motDiff = daysUntil(vehicle.motDate, new Date());
    var insDiff = daysUntil(vehicle.insDate, new Date());

    if (motDiff < 0 || insDiff < 0) {
      return '<span class="pill danger">Lejárt</span>';
    }

    if (motDiff < 30 || insDiff < 30) {
      return '<span class="pill warning">Figyelendő</span>';
    }

    return '<span class="pill success">Rendben</span>';
  }

  function renderRecentRefuelRow(refuel) {
    var money = window.HRPlatform.utils.formatCurrency;
    var date = window.HRPlatform.utils.formatDate;
    return "<tr><td><strong>" + escape(getVehicleName(refuel.vehicleId)) + "</strong></td><td>" + date(refuel.date) + "</td><td>" + Number(refuel.amount || 0).toLocaleString("hu-HU") + " l</td><td>" + money(refuel.cost) + "</td></tr>";
  }

  function renderDeadlineAlertRow(alert) {
    var h = window.HRPlatform.utils.escapeHtml;
    var date = window.HRPlatform.utils.formatDate;
    return [
      '<div class="fleet-alert-row">',
      '<strong>' + h(alert.vehicle.plate) + '</strong>',
      '<span>' + h(alert.label) + ': ' + date(alert.date) + '</span>',
      '<span>' + h(alert.detail) + '</span>',
      '<span class="pill ' + alert.variant + '">' + h(alert.status) + '</span>',
      '</div>'
    ].join("");
  }

  function renderMonthlyRow(row) {
    var money = window.HRPlatform.utils.formatCurrency;
    return "<tr><td><strong>" + row.month + "</strong></td><td>" + money(row.fuel) + "</td><td>" + money(row.service) + "</td><td>" + money(row.fuel + row.service) + "</td></tr>";
  }

  function renderVehicleRefuelRow(refuel) {
    return renderRefuelRow(refuel, false);
  }

  function renderGlobalRefuelRow(refuel) {
    return renderRefuelRow(refuel, true);
  }

  function renderRefuelRow(refuel, includeVehicle) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var date = window.HRPlatform.utils.formatDate;
    var consumption = calculateConsumption(refuel);
    return [
      "<tr>",
      includeVehicle ? "<td>" + h(getVehicleName(refuel.vehicleId)) + "</td>" : "",
      "<td>" + date(refuel.date) + "</td>",
      "<td>" + Number(refuel.odometer || 0).toLocaleString("hu-HU") + " km</td>",
      "<td>" + Number(refuel.amount || 0).toLocaleString("hu-HU") + " l</td>",
      "<td>" + money(refuel.cost) + "</td>",
      "<td>" + (consumption ? consumption.toFixed(1) + " l/100 km" : "-") + "</td>",
      '<td class="row-actions"><button class="quiet-button" type="button" data-edit-refuel="' + h(refuel.id) + '">Szerkesztés</button><button class="quiet-button danger" type="button" data-delete-refuel="' + h(refuel.id) + '">Törlés</button></td>',
      "</tr>"
    ].join("");
  }

  function renderVehicleServiceRow(service) {
    return renderServiceRow(service, false);
  }

  function renderGlobalServiceRow(service) {
    return renderServiceRow(service, true);
  }

  function renderServiceRow(service, includeVehicle) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var date = window.HRPlatform.utils.formatDate;
    return [
      "<tr>",
      includeVehicle ? "<td>" + h(getVehicleName(service.vehicleId)) + "</td>" : "",
      "<td>" + date(service.date) + "</td>",
      "<td>" + h(service.type) + "</td>",
      "<td>" + h(service.description || "-") + "</td>",
      "<td>" + money(service.cost) + "</td>",
      '<td class="row-actions"><button class="quiet-button" type="button" data-edit-service="' + h(service.id) + '">Szerkesztés</button><button class="quiet-button danger" type="button" data-delete-service="' + h(service.id) + '">Törlés</button></td>',
      "</tr>"
    ].join("");
  }

  function buildMonthlyRows(vehicleId) {
    var rows = {};
    filterByVehicle(getRefuels(), vehicleId).forEach(function (item) {
      var month = getMonthKey(item.date);
      rows[month] = rows[month] || { month: month, fuel: 0, service: 0 };
      rows[month].fuel += Number(item.cost || 0);
    });
    filterByVehicle(getServices(), vehicleId).forEach(function (item) {
      var month = getMonthKey(item.date);
      rows[month] = rows[month] || { month: month, fuel: 0, service: 0 };
      rows[month].service += Number(item.cost || 0);
    });
    return Object.keys(rows).sort().reverse().map(function (month) { return rows[month]; });
  }

  function miniMetric(label, value, detail) {
    return '<article class="fleet-mini-metric"><span>' + label + '</span><strong>' + value + '</strong><small>' + detail + '</small></article>';
  }

  function summaryLine(label, value) {
    return '<div class="fleet-summary-row"><span>' + label + '</span><strong>' + value + '</strong></div>';
  }

  function statCard(label, value, detail) {
    return [
      '<article class="module-card">',
      "<h4>" + label + "</h4>",
      "<strong>" + value + "</strong>",
      "<p>" + detail + "</p>",
      "</article>"
    ].join("");
  }

  function field(label, control) {
    return '<div class="field"><label>' + label + "</label>" + control + "</div>";
  }

  function parseDecimalValue(value) {
    var normalized = normalizeDecimalText(value);
    var numeric = Number(normalized || 0);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function normalizeDecimalText(value) {
    var text = String(value || "")
      .replace(/\s/g, "")
      .replace(/Ft/gi, "")
      .replace(/l$/i, "")
      .replace(/km$/i, "")
      .replace(/'/g, "");
    var lastComma = text.lastIndexOf(",");
    var lastDot = text.lastIndexOf(".");

    if (lastComma > -1 && lastDot > -1) {
      if (lastComma > lastDot) {
        return text.replace(/\./g, "").replace(/,/g, ".");
      }
      return text.replace(/,/g, "");
    }

    return text.replace(/,/g, ".");
  }

  function filterByVehicle(items, vehicleId) {
    return items.filter(function (item) { return item.vehicleId === vehicleId; });
  }

  function sumCosts(items) {
    return items.reduce(function (sum, item) { return sum + Number(item.cost || 0); }, 0);
  }

  function sumByMonth(items, month) {
    return items.filter(function (item) { return getMonthKey(item.date) === month; }).reduce(function (sum, item) { return sum + Number(item.cost || 0); }, 0);
  }

  function getMonthKey(value) {
    var date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Nincs dátum";
    }
    return date.getFullYear() + ". " + String(date.getMonth() + 1).padStart(2, "0") + ".";
  }

  function sortByDateDesc(a, b) {
    return new Date(b.date) - new Date(a.date);
  }

  function daysUntil(dateValue, today) {
    return (new Date(dateValue) - today) / 86400000;
  }

  function buildDeadlineAlerts(vehicles) {
    var today = new Date();
    return vehicles.reduce(function (rows, vehicle) {
      addDeadlineAlert(rows, vehicle, "Műszaki", vehicle.motDate, today);
      addDeadlineAlert(rows, vehicle, "KGFB", vehicle.insDate, today);
      return rows;
    }, []).sort(function (a, b) {
      return a.days - b.days;
    });
  }

  function addDeadlineAlert(rows, vehicle, label, dateValue, today) {
    var days = Math.ceil(daysUntil(dateValue, today));
    if (Number.isNaN(days) || days >= 30) {
      return;
    }

    rows.push({
      vehicle: vehicle,
      label: label,
      date: dateValue,
      days: days,
      detail: deadlineText(dateValue),
      status: days < 0 ? "Lejárt" : "Figyelendő",
      variant: days < 0 ? "danger" : "warning"
    });
  }

  function deadlineText(dateValue) {
    var days = Math.ceil(daysUntil(dateValue, new Date()));
    if (days < 0) {
      return "Lejárt " + Math.abs(days) + " napja";
    }
    if (days === 0) {
      return "Ma jár le";
    }
    return days + " nap múlva";
  }

  function averageConsumption(refuels) {
    var values = refuels.map(calculateConsumption).filter(function (value) { return value; });
    if (!values.length) {
      return "Nincs elég adat";
    }
    return (values.reduce(function (sum, value) { return sum + value; }, 0) / values.length).toFixed(1) + " l/100 km";
  }

  function escape(value) {
    return window.HRPlatform.utils.escapeHtml(value);
  }

  function exportRows() {
    return getVehicles().map(function (vehicle) {
      var vehicleRefuels = getRefuels().filter(function (item) {
        return item.vehicleId === vehicle.id;
      });
      var vehicleServices = getServices().filter(function (item) {
        return item.vehicleId === vehicle.id;
      });
      var currentMonth = getMonthKey(new Date());
      return {
        rendszám: vehicle.plate,
        tipus: vehicle.model,
        km_ora: vehicle.odometer,
        muszaki: vehicle.motDate,
        kgfb: vehicle.insDate,
        tankolas_db: vehicleRefuels.length,
        szerviz_db: vehicleServices.length,
        havi_tankolas: sumByMonth(vehicleRefuels, currentMonth),
        havi_szerviz: sumByMonth(vehicleServices, currentMonth),
        költség: vehicleRefuels.concat(vehicleServices).reduce(function (sum, item) {
          return sum + Number(item.cost || 0);
        }, 0)
      };
    });
  }

  window.HRPlatform.registerModule({
    id: "fleet",
    title: "Flotta",
    shortTitle: "Flotta",
    route: "#fleet",
    icon: "F",
    order: 20,
    permission: "fleet.manage",
    description: "Céges autók, tankolások és szerviz/munkalapok.",
    stats: stats,
    render: render,
    afterRender: afterRender,
    exportRows: exportRows
  });
})();
