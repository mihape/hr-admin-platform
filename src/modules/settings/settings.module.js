(function () {
  var paymentMethods = ["Utalás", "Kártya", "Készpénz", "Utánvét", "Csoportos beszedés", "Egyéb"];
  var paymentTerms = [0, 3, 8, 15, 30];
  var categories = ["Anyag", "Alvállalkozó", "Iroda", "Rezsi", "Flotta", "Bér", "Egyéb"];
  var uiState = {
    message: ""
  };

  function stats() {
    var settings = getSettings();
    return [
      {
        label: "Beállítások",
        value: window.HRPlatform.metadata.version,
        detail: (settings.companyName || "Cégadatok") + " / " + (settings.userName || "Felhasználó")
      }
    ];
  }

  function render() {
    var settings = getSettings();
    var storageInfo = window.HRPlatform.storage.getInfo();
    var partnerStats = getPartnerStats();

    return [
      '<div class="module-layout settings-layout" data-module-root="settings">',
      '  <div class="module-header">',
      "    <div>",
      '      <p class="module-kicker">Alapadatok</p>',
      "      <h3>Beállítások</h3>",
      "      <p>Cégadatok, felhasználói név, számla alapértékek és helyi adatkezelés egy helyen.</p>",
      "    </div>",
      "  </div>",
      uiState.message ? '<div class="settings-save-state">' + h(uiState.message) + "</div>" : "",
      '  <section class="settings-grid">',
      renderCompanyPanel(settings),
      renderInvoiceDefaultsPanel(settings),
      renderDataPanel(storageInfo),
      renderAboutPanel(settings, storageInfo),
      "  </section>",
      renderPartnerPanel(partnerStats),
      "</div>"
    ].join("");
  }

  function renderCompanyPanel(settings) {
    return [
      '<form class="settings-panel" id="settingsCompanyForm">',
      "  <h4>Cég és felhasználó</h4>",
      field("Cég neve", '<input name="companyName" required value="' + hAttr(settings.companyName) + '" />'),
      field("Működési mód", '<input name="companyMode" value="' + hAttr(settings.companyMode) + '" />'),
      field("Felhasználó neve", '<input name="userName" required value="' + hAttr(settings.userName) + '" />'),
      field("Pénznem", '<input name="currency" value="' + hAttr(settings.currency || "HUF") + '" readonly />'),
      '  <div class="form-actions"><button class="primary-button" type="submit">Alapadatok mentése</button></div>',
      "</form>"
    ].join("");
  }

  function renderInvoiceDefaultsPanel(settings) {
    var defaults = settings.invoiceDefaults || {};
    return [
      '<form class="settings-panel" id="settingsInvoiceForm">',
      "  <h4>Számla alapértékek</h4>",
      field("Alap fizetési mód", select("paymentMethod", paymentMethods, defaults.paymentMethod || "Utalás")),
      field("Alap fizetési határidő", select("paymentTermDays", paymentTerms.map(String), String(defaults.paymentTermDays == null ? 8 : defaults.paymentTermDays), paymentTermLabel)),
      field("Alap kategória", select("category", categories, defaults.category || "Egyéb")),
      field("Utalás dátuma", '<label class="checkbox-field"><input name="autoPaidDate" type="checkbox" value="true" ' + (defaults.autoPaidDate === false ? "" : "checked") + ' /><span>Kiegyenlítéskor mai dátum</span></label>'),
      '  <div class="form-actions"><button class="primary-button" type="submit">Számla alapok mentése</button></div>',
      "</form>"
    ].join("");
  }

  function renderDataPanel(storageInfo) {
    return [
      '<section class="settings-panel">',
      "  <h4>Adatok és átadás</h4>",
      "  <p>Adatfájl, biztonsági mentés, visszatöltés és átadási export kezelése.</p>",
      '  <div class="settings-info-row"><span>Mentés módja</span><strong>' + h(storageLabel(storageInfo)) + "</strong></div>",
      '  <div class="settings-info-row"><span>Közös adatfájl</span><strong>' + (storageInfo.isShared ? "Bekapcsolva" : "Nincs bekapcsolva") + "</strong></div>",
      storageInfo.dataPath ? '<div class="settings-info-row"><span>Adatfájl</span><strong>' + h(storageInfo.dataPath) + "</strong></div>" : "",
      '  <div class="settings-actions">',
      '    <button class="secondary-button" type="button" data-choose-shared-data-file>Közös adatfájl kiválasztása</button>',
      storageInfo.isShared ? '    <button class="quiet-button" type="button" data-use-local-data-file>Helyi adatfájl használata</button>' : "",
      '    <button class="secondary-button" type="button" data-backup-data>Biztonsági mentés</button>',
      '    <button class="secondary-button" type="button" data-restore-data>Mentés visszatöltése</button>',
      '    <button class="secondary-button" type="button" data-export-manifest>Átadási fájl export</button>',
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderAboutPanel(settings, storageInfo) {
    return [
      '<section class="settings-panel">',
      "  <h4>Névjegy</h4>",
      '  <div class="settings-info-row"><span>App</span><strong>' + h(window.HRPlatform.metadata.name) + "</strong></div>",
      '  <div class="settings-info-row"><span>Verzió</span><strong>' + h(window.HRPlatform.metadata.version) + "</strong></div>",
      '  <div class="settings-info-row"><span>Aktív cég</span><strong>' + h(settings.companyName || "-") + "</strong></div>",
      '  <div class="settings-info-row"><span>Tárolás</span><strong>' + h(storageInfo.mode || "browser-localStorage") + "</strong></div>",
      "</section>"
    ].join("");
  }

  function renderPartnerPanel(partnerStats) {
    return [
      '<section class="settings-panel partner-settings-panel">',
      '  <div class="settings-panel-head">',
      "    <div>",
      "      <h4>Mentett partnerek</h4>",
      "      <p>A számlákból tanult partnerlista. Átnevezéskor a meglévő számlák partnerneve is frissül.</p>",
      "    </div>",
      '    <button class="secondary-button" type="button" id="settingsSyncPartners">Frissítés számlákból</button>',
      "  </div>",
      '  <form class="settings-inline-form" id="settingsPartnerAddForm">',
      '    <input name="partnerName" placeholder="Új partner neve" />',
      '    <button class="primary-button" type="submit">Partner hozzáadása</button>',
      "  </form>",
      renderPartnerTable(partnerStats),
      "</section>"
    ].join("");
  }

  function renderPartnerTable(partnerStats) {
    if (!partnerStats.length) {
      return '<div class="empty-state"><strong>Nincs mentett partner</strong><span>Az első számla mentése után automatikusan megjelenik itt.</span></div>';
    }

    return [
      '<div class="table-wrap compact settings-partner-table">',
      "  <table>",
      "    <thead><tr><th>Partner</th><th>Számlák</th><th>Nyitott összeg</th><th>Összes bruttó</th><th>Művelet</th></tr></thead>",
      "    <tbody>",
      partnerStats.map(renderPartnerRow).join(""),
      "    </tbody>",
      "  </table>",
      "</div>"
    ].join("");
  }

  function renderPartnerRow(partner) {
    return [
      "<tr>",
      '<td><input class="settings-partner-input" data-partner-old-name="' + hAttr(partner.name) + '" value="' + hAttr(partner.name) + '" /></td>',
      "<td>" + partner.count + "</td>",
      "<td>" + money(partner.openGross) + "</td>",
      "<td>" + money(partner.grossTotal) + "</td>",
      '<td><div class="row-actions"><button class="quiet-button" type="button" data-save-partner="' + hAttr(partner.name) + '">Mentés</button><button class="quiet-button danger" type="button" data-delete-partner="' + hAttr(partner.name) + '">Törlés</button></div></td>',
      "</tr>"
    ].join("");
  }

  function afterRender(root) {
    var companyForm = root.querySelector("#settingsCompanyForm");
    var invoiceForm = root.querySelector("#settingsInvoiceForm");
    var partnerAddForm = root.querySelector("#settingsPartnerAddForm");

    companyForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = Object.fromEntries(new FormData(companyForm).entries());
      showMessage("Alapadatok mentve.");
      window.HRPlatform.settings.update({
        companyName: data.companyName,
        companyMode: data.companyMode,
        userName: data.userName,
        currency: data.currency || "HUF"
      });
    });

    invoiceForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = Object.fromEntries(new FormData(invoiceForm).entries());
      showMessage("Számla alapértékek mentve.");
      window.HRPlatform.settings.update({
        invoiceDefaults: {
          paymentMethod: data.paymentMethod,
          paymentTermDays: Number(data.paymentTermDays || 8),
          category: data.category,
          autoPaidDate: data.autoPaidDate === "true"
        }
      });
    });

    partnerAddForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = String(new FormData(partnerAddForm).get("partnerName") || "").trim();
      if (!name) {
        return;
      }
      savePartners(addUniquePartner(getStoredPartners(), name));
      partnerAddForm.reset();
      showMessage("Partner hozzáadva.");
      window.HRPlatform.notify();
    });

    root.querySelector("#settingsSyncPartners").addEventListener("click", function () {
      savePartners(mergePartners(getStoredPartners(), collectInvoicePartners()));
      showMessage("Partnerlista frissítve a számlákból.");
      window.HRPlatform.notify();
    });

    var sharedDataButton = root.querySelector("[data-choose-shared-data-file]");
    if (sharedDataButton) {
      sharedDataButton.addEventListener("click", function () {
        window.HRPlatform.storage.chooseSharedDataFile().then(function (result) {
          if (!result || result.canceled) {
            return;
          }
          alert(result.usedExisting ? "Közös adatfájl beállítva. Az app újratöltődik." : "Közös adatfájl létrehozva a jelenlegi adatokkal. Az app újratöltődik.");
          location.reload();
        }).catch(function (error) {
          alert(error.message || "Nem sikerült beállítani a közös adatfájlt.");
        });
      });
    }

    var localDataButton = root.querySelector("[data-use-local-data-file]");
    if (localDataButton) {
      localDataButton.addEventListener("click", function () {
        if (!confirm("Visszaváltasz a helyi adatfájlra? A közös NAS fájl nem törlődik.")) {
          return;
        }
        window.HRPlatform.storage.useLocalDataFile().then(function (result) {
          if (!result || result.canceled) {
            return;
          }
          alert("Helyi adatfájl beállítva. Az app újratöltődik.");
          location.reload();
        }).catch(function (error) {
          alert(error.message || "Nem sikerült visszaváltani a helyi adatfájlra.");
        });
      });
    }

    root.querySelectorAll("[data-save-partner]").forEach(function (button) {
      button.addEventListener("click", function () {
        var oldName = button.getAttribute("data-save-partner");
        var row = button.closest("tr");
        var input = row ? row.querySelector(".settings-partner-input") : null;
        var newName = input ? String(input.value || "").trim() : "";
        if (!newName) {
          return;
        }
        renamePartner(oldName, newName);
        showMessage("Partner átnevezve.");
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-delete-partner]").forEach(function (button) {
      button.addEventListener("click", function () {
        var name = button.getAttribute("data-delete-partner");
        if (!confirm("Törlöd ezt a mentett partnert? A meglévő számlák partnerneve nem változik.")) {
          return;
        }
        savePartners(getStoredPartners().filter(function (partner) {
          return normalizeText(partner) !== normalizeText(name);
        }));
        showMessage("Partner törölve a mentett listából.");
        window.HRPlatform.notify();
      });
    });
  }

  function showMessage(message) {
    uiState.message = message;
  }

  function getSettings() {
    return window.HRPlatform.settings.get();
  }

  function getStoredPartners() {
    return window.HRPlatform.storage.readCollection("invoices.partners", []);
  }

  function savePartners(partners) {
    window.HRPlatform.storage.writeCollection("invoices.partners", sortPartners(partners));
  }

  function getInvoices() {
    return window.HRPlatform.storage.readCollection("invoices.records", []);
  }

  function saveInvoices(invoices) {
    window.HRPlatform.storage.writeCollection("invoices.records", invoices);
  }

  function getPartnerStats() {
    var invoices = getInvoices();
    var partners = mergePartners(getStoredPartners(), collectInvoicePartners());
    return partners.map(function (name) {
      var partnerInvoices = invoices.filter(function (invoice) {
        return normalizeText(invoice.partnerName) === normalizeText(name);
      });
      var open = partnerInvoices.filter(function (invoice) {
        return normalizeText(invoice.status) !== normalizeText("Utalva");
      });
      return {
        name: name,
        count: partnerInvoices.length,
        grossTotal: partnerInvoices.reduce(function (sum, invoice) {
          return sum + Number(invoice.grossAmount || 0);
        }, 0),
        openGross: open.reduce(function (sum, invoice) {
          return sum + Number(invoice.grossAmount || 0);
        }, 0)
      };
    });
  }

  function collectInvoicePartners() {
    return getInvoices().map(function (invoice) {
      return invoice.partnerName;
    }).filter(Boolean);
  }

  function renamePartner(oldName, newName) {
    savePartners(addUniquePartner(getStoredPartners().filter(function (partner) {
      return normalizeText(partner) !== normalizeText(oldName);
    }), newName));
    saveInvoices(getInvoices().map(function (invoice) {
      if (normalizeText(invoice.partnerName) !== normalizeText(oldName)) {
        return invoice;
      }
      return Object.assign({}, invoice, { partnerName: newName });
    }));
  }

  function mergePartners(left, right) {
    return sortPartners((left || []).concat(right || []).reduce(addPartnerReducer, []));
  }

  function addUniquePartner(partners, name) {
    return addPartnerReducer(partners.slice(), name);
  }

  function addPartnerReducer(partners, name) {
    var value = String(name || "").trim();
    if (value && !partners.some(function (partner) {
      return normalizeText(partner) === normalizeText(value);
    })) {
      partners.push(value);
    }
    return partners;
  }

  function sortPartners(partners) {
    return (partners || []).filter(Boolean).sort(function (a, b) {
      return normalizeText(a).localeCompare(normalizeText(b), "hu-HU");
    });
  }

  function field(label, control) {
    return '<div class="field"><label>' + label + "</label>" + control + "</div>";
  }

  function select(name, items, selected, labelFormatter) {
    return '<select name="' + name + '">' + items.map(function (item) {
      var label = labelFormatter ? labelFormatter(item) : item;
      return '<option value="' + hAttr(item) + '" ' + (String(item) === String(selected) ? "selected" : "") + ">" + h(label) + "</option>";
    }).join("") + "</select>";
  }

  function paymentTermLabel(value) {
    return String(value) === "0" ? "Aznapi" : value + " nap";
  }

  function storageLabel(info) {
    if (info.mode === "shared-file") {
      return "Közös NAS / hálózati adatfájl";
    }
    return info.mode === "native-file" ? "Helyi Windows adatfájl" : "Böngésző localStorage fallback";
  }

  function normalizeText(value) {
    return String(value || "")
      .toLocaleLowerCase("hu-HU")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function h(value) {
    return window.HRPlatform.utils.escapeHtml(value);
  }

  function hAttr(value) {
    return h(value);
  }

  function money(value) {
    return window.HRPlatform.utils.formatCurrency(value);
  }

  window.HRPlatform.registerModule({
    id: "settings",
    title: "Beállítások",
    shortTitle: "Beállítások",
    route: "#settings",
    icon: "B",
    order: 90,
    permission: "settings.manage",
    description: "Cégadatok, felhasználó, számla alapértékek és mentés.",
    stats: stats,
    render: render,
    afterRender: afterRender
  });
})();
