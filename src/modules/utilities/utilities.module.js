(function () {
  var seedState = {
    version: 1,
    company: {
      name: "Céges ingatlan elszámolás",
      contact: "Projektmenedzser"
    },
    rates: {
      water: 680,
      electricity: 240,
      gas: 280
    },
    units: [
      {
        id: "unit-main",
        type: "main",
        name: "Főépület",
        tenantName: "Saját használat",
        phone: "",
        address: "Központi épület",
        rent: 0,
        deposit: 0,
        prepaidRent: 0,
        active: true,
        notes: "Ide érkeznek a szolgáltatói számlák."
      },
      {
        id: "unit-a3",
        type: "rental",
        name: "A/3 lakás",
        tenantName: "Nagy Anna",
        phone: "+36 30 123 4567",
        address: "A épület - 3. lakás",
        rent: 225000,
        deposit: 450000,
        prepaidRent: 225000,
        active: true,
        notes: ""
      },
      {
        id: "unit-b1",
        type: "rental",
        name: "B/1 lakás",
        tenantName: "Kiss Péter",
        phone: "+36 20 555 0101",
        address: "B épület - 1. lakás",
        rent: 210000,
        deposit: 420000,
        prepaidRent: 0,
        active: true,
        notes: ""
      }
    ],
    recurringCharges: [
      {
        id: "charge-internet",
        unitId: "unit-a3",
        name: "Internet díj",
        amount: 1000,
        active: true
      },
      {
        id: "charge-common",
        unitId: "unit-b1",
        name: "Közös költség átalány",
        amount: 30000,
        active: true
      }
    ],
    settlements: {
      "unit-a3_2026-05": {
        unitId: "unit-a3",
        month: "2026-05",
        readings: {
          water: { previous: 125, current: 131, rate: 680 },
          electricity: { previous: 2350, current: 2620, rate: 240 },
          gas: { previous: 880, current: 897, rate: 280 }
        },
        extras: [{ id: "extra-fridge", name: "Hűtőcsere", amount: 120000 }],
        disabledRecurringChargeIds: [],
        paid: 0,
        dueDate: "2026-06-10",
        note: ""
      },
      "unit-b1_2026-05": {
        unitId: "unit-b1",
        month: "2026-05",
        readings: {
          water: { previous: 85, current: 92, rate: 680 },
          electricity: { previous: 1820, current: 1984, rate: 240 },
          gas: { previous: 640, current: 651, rate: 280 }
        },
        extras: [],
        disabledRecurringChargeIds: [],
        paid: 250000,
        dueDate: "2026-06-10",
        note: ""
      }
    }
  };

  var selectedMonth = window.localStorage.getItem("hr.utilities.selectedMonth") || new Date().toISOString().slice(0, 7);
  var selectedUnitId = window.localStorage.getItem("hr.utilities.selectedUnitId") || "unit-a3";
  var activeUtilitiesSection = window.localStorage.getItem("hr.utilities.activeSection") || "settlement";
  var editingUnitId = "";

  function getState() {
    var state = window.HRPlatform.storage.readCollection("utilities.state", seedState);
    state.rates = state.rates || seedState.rates;
    state.units = state.units || [];
    state.recurringCharges = state.recurringCharges || [];
    state.settlements = state.settlements || {};
    return state;
  }

  function saveState(state) {
    window.HRPlatform.storage.writeCollection("utilities.state", state);
  }

  function getUnit(state, unitId) {
    return state.units.find(function (unit) {
      return unit.id === unitId;
    });
  }

  function getActiveUnits(state) {
    return state.units.filter(function (unit) {
      return unit.active;
    });
  }

  function ensureSelection(state) {
    if (!getUnit(state, selectedUnitId)) {
      var first = getActiveUnits(state)[0] || state.units[0];
      selectedUnitId = first ? first.id : "";
    }

    if (!selectedMonth) {
      selectedMonth = new Date().toISOString().slice(0, 7);
    }
  }

  function ensureSettlement(state, unitId, month) {
    var key = unitId + "_" + month;
    if (!state.settlements[key]) {
      state.settlements[key] = {
        unitId: unitId,
        month: month,
        readings: {
          water: { previous: 0, current: 0, rate: state.rates.water },
          electricity: { previous: 0, current: 0, rate: state.rates.electricity },
          gas: { previous: 0, current: 0, rate: state.rates.gas }
        },
        extras: [],
        disabledRecurringChargeIds: [],
        paid: 0,
        dueDate: dueDateForMonth(month),
        note: ""
      };
    }
    return state.settlements[key];
  }

  function dueDateForMonth(month) {
    var parts = month.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]), 10);
    return date.toISOString().slice(0, 10);
  }

  function calculateSettlement(state, unit, settlement) {
    var labels = {
      water: ["Víz", "m3"],
      electricity: ["Villany", "kWh"],
      gas: ["Gáz", "m3"]
    };
    var utilities = {};
    var utilityTotal = 0;

    Object.keys(labels).forEach(function (key) {
      var reading = settlement.readings[key] || { previous: 0, current: 0, rate: state.rates[key] };
      var consumption = Math.max(0, Number(reading.current || 0) - Number(reading.previous || 0));
      var amount = consumption * Number(reading.rate || 0);
      utilities[key] = {
        label: labels[key][0],
        unitLabel: labels[key][1],
        previous: Number(reading.previous || 0),
        current: Number(reading.current || 0),
        rate: Number(reading.rate || 0),
        consumption: consumption,
        amount: amount
      };
      utilityTotal += amount;
    });

    var disabled = settlement.disabledRecurringChargeIds || [];
    var recurringItems = state.recurringCharges.filter(function (charge) {
      return charge.unitId === unit.id && charge.active && !disabled.includes(charge.id);
    });
    var recurringTotal = recurringItems.reduce(function (sum, item) {
      return sum + Number(item.amount || 0);
    }, 0);
    var extraItems = settlement.extras || [];
    var extraTotal = extraItems.reduce(function (sum, item) {
      return sum + Number(item.amount || 0);
    }, 0);
    var rent = Number(unit.rent || 0);
    var total = utilityTotal + rent + recurringTotal + extraTotal;
    var paid = Number(settlement.paid || 0);

    return {
      utilities: utilities,
      utilityTotal: utilityTotal,
      rent: rent,
      recurringItems: recurringItems,
      recurringTotal: recurringTotal,
      extraItems: extraItems,
      extraTotal: extraTotal,
      total: total,
      paid: paid,
      balance: total - paid
    };
  }

  function stats() {
    var state = getState();
    var units = getActiveUnits(state);
    var settlements = Object.values(state.settlements);
    var openBalance = settlements.reduce(function (sum, settlement) {
      var unit = getUnit(state, settlement.unitId);
      if (!unit) {
        return sum;
      }
      return sum + Math.max(0, calculateSettlement(state, unit, settlement).balance);
    }, 0);

    return [
      { label: "Ingatlanok", value: units.length, detail: "Aktív egységek" },
      { label: "Elszámolások", value: settlements.length, detail: "Tárolt havi rekord" },
      { label: "Nyitott egyenleg", value: window.HRPlatform.utils.formatCurrency(openBalance), detail: "Fizetésre vár" }
    ];
  }

  function render(context) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var state = getState();
    ensureSelection(state);
    var unit = getUnit(state, selectedUnitId);
    var settlement = unit ? ensureSettlement(state, unit.id, selectedMonth) : null;
    var calc = unit ? calculateSettlement(state, unit, settlement) : null;
    var units = state.units.filter(function (item) {
      return window.HRPlatform.utils.matchesSearch(item, context.searchTerm);
    });
    var unitOptions = state.units
      .map(function (item) {
        return '<option value="' + h(item.id) + '" ' + (item.id === selectedUnitId ? "selected" : "") + ">" + h(item.name + " - " + item.tenantName) + "</option>";
      })
      .join("");

    return [
      '<div class="module-layout" data-module-root="utilities">',
      '  <div class="module-header">',
      "    <div>",
      '      <p class="module-kicker">Ingatlan / rezsi / albérlet</p>',
      "      <h3>Rezsi és albérlet modul</h3>",
      "      <p>Az eredeti rezsi elszámoló adatmodellje alapján: ingatlanok, mérők, havi plusz tételek és fizetési egyenleg.</p>",
      "    </div>",
      '    <div class="module-actions">',
      '      <button class="secondary-button" type="button" id="utilitiesPrint">Nyomtatás</button>',
      '      <button class="primary-button" type="button" data-export="utilities">CSV export</button>',
      "    </div>",
      "  </div>",
      renderUtilityContextBar(unit, settlement, unitOptions),
      renderSubnav("utilities", activeUtilitiesSection, [
        { id: "overview", label: "Áttekintés" },
        { id: "settlement", label: "Elszámolás" },
        { id: "units", label: "Ingatlanok" }
      ]),
      renderUtilitiesSection(activeUtilitiesSection, state, unit, settlement, calc, units, unitOptions),
      "</div>"
    ].join("");
  }

  function renderUtilityContextBar(unit, settlement, unitOptions) {
    var h = window.HRPlatform.utils.escapeHtml;
    return [
      '<section class="module-context-bar">',
      field("Aktív ingatlan", '<select id="utilityUnit">' + unitOptions + "</select>"),
      field("Hónap", '<input id="utilityMonth" type="month" value="' + h(selectedMonth) + '" />'),
      field("Bérlő", '<input value="' + h(unit ? unit.tenantName : "") + '" readonly />'),
      field("Határidő", '<input id="utilityDueDate" type="date" value="' + h(settlement ? settlement.dueDate : "") + '" />'),
      "</section>"
    ].join("");
  }

  function renderUtilitiesSection(section, state, unit, settlement, calc, units, unitOptions) {
    if (section === "units") {
      return renderUnitForm(getUnit(state, editingUnitId)) + renderUnitTable(units);
    }
    if (section === "overview") {
      return renderUtilitiesOverview(state, unit, settlement, calc);
    }
    return renderSettlementWorkspace(state, unit, settlement, calc, unitOptions);
  }

  function renderUtilitiesOverview(state, unit, settlement, calc) {
    var money = window.HRPlatform.utils.formatCurrency;
    var openRows = buildOpenSettlementRows(state).slice(0, 6);
    return [
      '<div class="module-grid">',
      statCard("Aktív ingatlan", getActiveUnits(state).length, "Főépület és albérletek"),
      statCard("Havi fizetendő", calc ? money(calc.total) : "-", "Kiválasztott egység"),
      statCard("Egyenleg", calc ? money(calc.balance) : "-", calc && calc.balance > 0 ? "Fizetésre vár" : "Rendezve"),
      '</div>',
      calc ? '<section class="module-card utility-settlement"><h4>' + unit.name + ' gyors összesítő</h4><div class="breakdown-list">' +
        row("Közművek", money(calc.utilityTotal)) +
        row("Bérleti díj", money(calc.rent)) +
        row("Ismétlődő tételek", money(calc.recurringTotal)) +
        row("Egyszeri plusz tételek", money(calc.extraTotal)) +
        row("Fizetendő összesen", money(calc.total), "strong") +
        row("Egyenleg", money(calc.balance), calc.balance > 0 ? "warning" : "strong") +
        '</div></section>' : '<div class="empty-state">Nincs ingatlan adat.</div>',
      '<section class="module-card utility-settlement"><h4>Nyitott egyenlegek</h4><div class="fleet-alert-list">',
      openRows.map(renderUtilityBalanceRow).join("") || '<p class="muted-line">Nincs nyitott albérleti vagy rezsi egyenleg.</p>',
      '</div></section>'
    ].join("");
  }

  function buildOpenSettlementRows(state) {
    return Object.values(state.settlements).reduce(function (rows, settlement) {
      var unit = getUnit(state, settlement.unitId);
      var calc = unit ? calculateSettlement(state, unit, settlement) : null;
      if (!calc || calc.balance <= 0) {
        return rows;
      }
      rows.push({
        unit: unit,
        settlement: settlement,
        balance: calc.balance,
        dueDate: settlement.dueDate || dueDateForMonth(settlement.month),
        dueText: dueText(settlement.dueDate || dueDateForMonth(settlement.month))
      });
      return rows;
    }, []).sort(function (a, b) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }

  function renderUtilityBalanceRow(rowData) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var date = window.HRPlatform.utils.formatDate;
    return [
      '<div class="fleet-alert-row">',
      '<strong>' + h(rowData.unit.name) + '</strong>',
      '<span>' + h(rowData.settlement.month) + ' / ' + date(rowData.dueDate) + '</span>',
      '<span>' + h(rowData.dueText) + '</span>',
      '<span class="pill ' + (new Date(rowData.dueDate) < startOfToday() ? "danger" : "warning") + '">' + money(rowData.balance) + '</span>',
      '</div>'
    ].join("");
  }

  function renderSettlementWorkspace(state, unit, settlement, calc, unitOptions) {
    return calc ? renderSettlement(state, unit, settlement, calc) : '<div class="empty-state">Nincs ingatlan adat.</div>';
  }

  function renderUnitTable(units) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    return [
      '  <div class="table-wrap">',
      "    <table>",
      "      <thead><tr><th>Ingatlan</th><th>Bérlő</th><th>Cím</th><th>Bérleti díj</th><th>Kaució</th><th>Állapot</th><th>Művelet</th></tr></thead>",
      "      <tbody>",
      units
        .map(function (item) {
          return [
            '<tr data-select-unit="' + h(item.id) + '">',
            "<td><strong>" + h(item.name) + "</strong></td>",
            "<td>" + h(item.tenantName || "-") + "</td>",
            "<td>" + h(item.address || "-") + "</td>",
            "<td>" + money(item.rent) + "</td>",
            "<td>" + money(item.deposit) + "</td>",
            '<td><span class="pill ' + (item.active ? "success" : "warning") + '">' + (item.active ? "Aktív" : "Archivált") + "</span></td>",
            '<td><div class="row-actions"><button class="quiet-button" type="button" data-edit-unit="' + h(item.id) + '">Szerkesztés</button><button class="quiet-button danger" type="button" data-delete-unit="' + h(item.id) + '">Törlés</button></div></td>',
            "</tr>"
          ].join("");
        })
        .join("") || '<tr><td colspan="7">Nincs találat.</td></tr>',
      "      </tbody>",
      "    </table>",
      "  </div>"
    ].join("");
  }

  function renderSubnav(scope, activeId, items) {
    return [
      '<nav class="module-subnav" aria-label="Rezsi almenü">',
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

  function renderSettlement(state, unit, settlement, calc) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    return [
      '<section class="module-card utility-settlement">',
      "  <h4>" + h(unit.name) + " - " + h(selectedMonth) + "</h4>",
      '  <div class="meter-grid">',
      meterInput("water", "Víz", "m3", settlement, calc),
      meterInput("electricity", "Villany", "kWh", settlement, calc),
      meterInput("gas", "Gáz", "m3", settlement, calc),
      "  </div>",
      '  <div class="form-panel embedded">',
      field("Bérleti díj", '<input id="utilityRent" type="number" min="0" step="1000" value="' + Number(unit.rent || 0) + '" />'),
      field("Fizetve", '<input id="utilityPaid" type="number" min="0" step="1000" value="' + Number(settlement.paid || 0) + '" />'),
      field("Plusz tétel neve", '<input id="utilityExtraName" placeholder="Hűtőcsere" />'),
      field("Plusz tétel összege", '<input id="utilityExtraAmount" type="number" step="1000" />'),
      '<div class="form-actions"><button class="secondary-button" type="button" id="utilityAddExtra">Plusz tétel</button></div>',
      "  </div>",
      '  <div class="breakdown-list">',
      row("Közművek", money(calc.utilityTotal)),
      row("Bérleti díj", money(calc.rent)),
      row("Ismétlődő tételek", money(calc.recurringTotal)),
      row("Egyszeri plusz tételek", money(calc.extraTotal)),
      row("Fizetendő összesen", money(calc.total), "strong"),
      row("Fizetve", money(calc.paid)),
      row("Egyenleg", money(calc.balance), calc.balance > 0 ? "warning" : "strong"),
      "  </div>",
      renderExtraTable(settlement),
      "</section>"
    ].join("");
  }

  function meterInput(kind, label, unitLabel, settlement, calc) {
    var item = calc.utilities[kind];
    return [
      '<article class="module-card meter-card">',
      "<h4>" + label + "</h4>",
      '<div class="field"><label>Előző</label><input data-meter="' + kind + '" data-field="previous" type="number" step="0.01" value="' + item.previous + '" /></div>',
      '<div class="field"><label>Aktuális</label><input data-meter="' + kind + '" data-field="current" type="number" step="0.01" value="' + item.current + '" /></div>',
      '<div class="field"><label>Egységár</label><input data-meter="' + kind + '" data-field="rate" type="number" step="1" value="' + item.rate + '" /></div>',
      "<p>Fogyasztás: <strong>" + item.consumption.toLocaleString("hu-HU") + " " + unitLabel + "</strong></p>",
      "<p>Összeg: <strong>" + window.HRPlatform.utils.formatCurrency(item.amount) + "</strong></p>",
      "</article>"
    ].join("");
  }

  function renderExtraTable(settlement) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    if (!settlement.extras || settlement.extras.length === 0) {
      return '<div class="empty-state">Ehhez a hónaphoz nincs egyszeri plusz tétel.</div>';
    }

    return [
      '<div class="table-wrap">',
      "<table>",
      "<thead><tr><th>Plusz tétel</th><th>Összeg</th><th></th></tr></thead>",
      "<tbody>",
      settlement.extras
        .map(function (extra) {
          return '<tr><td>' + h(extra.name) + "</td><td>" + money(extra.amount) + '</td><td><button class="quiet-button" data-delete-extra="' + h(extra.id) + '">Törlés</button></td></tr>';
        })
        .join(""),
      "</tbody>",
      "</table>",
      "</div>"
    ].join("");
  }

  function renderUnitForm(editingUnit) {
    var h = window.HRPlatform.utils.escapeHtml;
    var unit = editingUnit || {};
    var isEditing = Boolean(editingUnit);
    return [
      '<form class="form-panel" id="utilityUnitForm">',
      '<div class="form-heading"><strong>' + (isEditing ? "Ingatlan szerkesztése" : "Új ingatlan") + '</strong><span>' + (isEditing ? "A módosítás a kijelölt ingatlant írja felül." : "Új albérlet vagy ingatlan felvétele.") + '</span></div>',
      '<input name="id" type="hidden" value="' + h(unit.id || "") + '" />',
      field("Ingatlan neve", '<input name="name" required placeholder="C/2 lakás" value="' + h(unit.name || "") + '" />'),
      field("Bérlő", '<input name="tenantName" placeholder="Bérlő neve" value="' + h(unit.tenantName || "") + '" />'),
      field("Cím / azonosító", '<input name="address" placeholder="C épület - 2. lakás" value="' + h(unit.address || "") + '" />'),
      field("Bérleti díj", '<input name="rent" type="number" min="0" step="1000" value="' + h(unit.rent || "") + '" />'),
      field("Kaució", '<input name="deposit" type="number" min="0" step="1000" value="' + h(unit.deposit || "") + '" />'),
      field("Telefon", '<input name="phone" value="' + h(unit.phone || "") + '" />'),
      '<div class="form-actions"><button class="primary-button" type="submit">' + (isEditing ? "Módosítás mentése" : "Ingatlan hozzáadása") + '</button>' + (isEditing ? '<button class="secondary-button" type="button" id="utilityCancelUnitEdit">Mégse</button>' : "") + '</div>',
      "</form>"
    ].join("");
  }

  function afterRender(root) {
    var state = getState();
    ensureSelection(state);
    var settlement = ensureSettlement(state, selectedUnitId, selectedMonth);
    var unit = getUnit(state, selectedUnitId);

    bindSubnav(root, "utilities", function (section) {
      activeUtilitiesSection = section;
      window.localStorage.setItem("hr.utilities.activeSection", section);
    });

    bindIfPresent(root, "#utilityMonth", "change", function (event) {
      selectedMonth = event.target.value;
      window.localStorage.setItem("hr.utilities.selectedMonth", selectedMonth);
      window.HRPlatform.notify();
    });
    bindIfPresent(root, "#utilityUnit", "change", function (event) {
      selectedUnitId = event.target.value;
      window.localStorage.setItem("hr.utilities.selectedUnitId", selectedUnitId);
      window.HRPlatform.notify();
    });
    bindIfPresent(root, "#utilityDueDate", "change", function (event) {
      settlement.dueDate = event.target.value;
      saveState(state);
      window.HRPlatform.notify();
    });
    root.querySelectorAll("[data-meter]").forEach(function (input) {
      input.addEventListener("change", function () {
        settlement.readings[input.dataset.meter][input.dataset.field] = Number(input.value || 0);
        saveState(state);
        window.HRPlatform.notify();
      });
    });
    bindIfPresent(root, "#utilityRent", "change", function (event) {
      unit.rent = Number(event.target.value || 0);
      saveState(state);
      window.HRPlatform.notify();
    });
    bindIfPresent(root, "#utilityPaid", "change", function (event) {
      settlement.paid = Number(event.target.value || 0);
      saveState(state);
      window.HRPlatform.notify();
    });
    bindIfPresent(root, "#utilityAddExtra", "click", function () {
      var nameInput = root.querySelector("#utilityExtraName");
      var amountInput = root.querySelector("#utilityExtraAmount");
      var name = nameInput ? nameInput.value.trim() : "";
      var amount = amountInput ? Number(amountInput.value || 0) : 0;
      if (!name) {
        return;
      }
      settlement.extras.unshift({ id: "extra-" + Date.now(), name: name, amount: amount });
      saveState(state);
      window.HRPlatform.notify();
    });
    root.querySelectorAll("[data-delete-extra]").forEach(function (button) {
      button.addEventListener("click", function () {
        settlement.extras = settlement.extras.filter(function (extra) {
          return extra.id !== button.getAttribute("data-delete-extra");
        });
        saveState(state);
        window.HRPlatform.notify();
      });
    });
    root.querySelectorAll("[data-select-unit]").forEach(function (row) {
      row.addEventListener("click", function () {
        selectedUnitId = row.getAttribute("data-select-unit");
        editingUnitId = "";
        activeUtilitiesSection = "settlement";
        window.localStorage.setItem("hr.utilities.selectedUnitId", selectedUnitId);
        window.localStorage.setItem("hr.utilities.activeSection", activeUtilitiesSection);
        window.HRPlatform.notify();
      });
    });
    root.querySelectorAll("[data-edit-unit]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        editingUnitId = button.getAttribute("data-edit-unit");
        activeUtilitiesSection = "units";
        window.localStorage.setItem("hr.utilities.activeSection", activeUtilitiesSection);
        window.HRPlatform.notify();
      });
    });
    root.querySelectorAll("[data-delete-unit]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        deleteUnit(state, button.getAttribute("data-delete-unit"));
      });
    });
    bindIfPresent(root, "#utilityCancelUnitEdit", "click", function () {
      editingUnitId = "";
      window.HRPlatform.notify();
    });
    bindIfPresent(root, "#utilityUnitForm", "submit", function (event) {
      event.preventDefault();
      var data = Object.fromEntries(new FormData(event.currentTarget).entries());
      var unitItem = {
        id: data.id || "unit-" + Date.now(),
        type: "rental",
        name: String(data.name || "").trim(),
        tenantName: String(data.tenantName || "").trim(),
        phone: String(data.phone || "").trim(),
        address: String(data.address || "").trim(),
        rent: Number(data.rent || 0),
        deposit: Number(data.deposit || 0),
        prepaidRent: 0,
        active: true,
        notes: ""
      };

      if (data.id) {
        state.units = state.units.map(function (item) {
          return item.id === data.id ? Object.assign({}, item, unitItem, { type: item.type || unitItem.type, active: item.active !== false }) : item;
        });
      } else {
        state.units.unshift(unitItem);
      }

      selectedUnitId = unitItem.id;
      editingUnitId = "";
      activeUtilitiesSection = "settlement";
      window.localStorage.setItem("hr.utilities.selectedUnitId", selectedUnitId);
      window.localStorage.setItem("hr.utilities.activeSection", activeUtilitiesSection);
      saveState(state);
      window.HRPlatform.notify();
    });
    bindIfPresent(root, "#utilitiesPrint", "click", function () {
      window.print();
    });
  }

  function deleteUnit(state, unitId) {
    var unit = getUnit(state, unitId);
    if (!unit) {
      return;
    }
    if (!confirm("Biztosan törlöd ezt az ingatlant? A hozzá tartozó havi elszámolások és ismétlődő tételek is törlődnek.")) {
      return;
    }

    state.units = state.units.filter(function (item) {
      return item.id !== unitId;
    });
    state.recurringCharges = state.recurringCharges.filter(function (charge) {
      return charge.unitId !== unitId;
    });
    Object.keys(state.settlements).forEach(function (key) {
      if (state.settlements[key].unitId === unitId) {
        delete state.settlements[key];
      }
    });

    if (selectedUnitId === unitId) {
      var next = getActiveUnits(state)[0] || state.units[0];
      selectedUnitId = next ? next.id : "";
      window.localStorage.setItem("hr.utilities.selectedUnitId", selectedUnitId);
    }
    if (editingUnitId === unitId) {
      editingUnitId = "";
    }
    saveState(state);
    window.HRPlatform.notify();
  }

  function bindIfPresent(root, selector, eventName, handler) {
    var element = root.querySelector(selector);
    if (element) {
      element.addEventListener(eventName, handler);
    }
  }

  function startOfToday() {
    var today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function dueText(dateValue) {
    var days = Math.ceil((new Date(dateValue) - startOfToday()) / 86400000);
    if (Number.isNaN(days)) {
      return "Nincs határidő";
    }
    if (days < 0) {
      return "Lejárt " + Math.abs(days) + " napja";
    }
    if (days === 0) {
      return "Ma esedékes";
    }
    if (days === 1) {
      return "Holnap esedékes";
    }
    return days + " nap múlva esedékes";
  }

  function row(label, value, variant) {
    return '<div class="breakdown-row ' + (variant || "") + '"><span>' + label + "</span><strong>" + value + "</strong></div>";
  }

  function statCard(label, value, detail) {
    return '<article class="module-card"><h4>' + label + "</h4><strong>" + value + "</strong><p>" + detail + "</p></article>";
  }

  function field(label, control) {
    return '<div class="field"><label>' + label + "</label>" + control + "</div>";
  }

  function exportRows() {
    var state = getState();
    return Object.values(state.settlements).map(function (settlement) {
      var unit = getUnit(state, settlement.unitId);
      var calc = unit ? calculateSettlement(state, unit, settlement) : null;
      return {
        ingatlan: unit ? unit.name : settlement.unitId,
        bérlő: unit ? unit.tenantName : "",
        honap: settlement.month,
        fizetendő: calc ? calc.total : 0,
        fizetve: settlement.paid || 0,
        egyenleg: calc ? calc.balance : 0,
        határidő: settlement.dueDate || ""
      };
    });
  }

  window.HRPlatform.registerModule({
    id: "utilities",
    title: "Rezsi / Albérletek",
    shortTitle: "Rezsi",
    route: "#utilities",
    icon: "R",
    order: 10,
    permission: "utilities.manage",
    description: "Ingatlanok, albérletek, havi mérőállások és elszámolások.",
    stats: stats,
    render: render,
    afterRender: afterRender,
    exportRows: exportRows
  });
})();
