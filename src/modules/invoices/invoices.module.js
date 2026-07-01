(function () {
  var seedInvoices = [
    {
      id: "invoice-001",
      date: "2026-05-03",
      partnerName: "Beton Partner Kft.",
      invoiceNumber: "BP-2026-114",
      netAmount: 420000,
      vatAmount: 113400,
      grossAmount: 533400,
      paymentMethod: "Utalás",
      status: "Fizetésre vár",
      dueDate: "2026-05-18",
      paymentTermDays: 15,
      category: "Anyag",
      projectName: "Családi ház",
      note: "Családi ház alapozás",
      sourceMonth: "május"
    },
    {
      id: "invoice-002",
      date: "2026-05-08",
      partnerName: "IrodaPont",
      invoiceNumber: "IP-5821",
      netAmount: 68000,
      vatAmount: 18360,
      grossAmount: 86360,
      paymentMethod: "Kártya",
      status: "Utalva",
      paidDate: "2026-05-08",
      dueDate: "2026-05-08",
      paymentTermDays: 0,
      category: "Iroda",
      projectName: "Központ",
      note: "Nyomtató és irodaszer",
      sourceMonth: "május"
    }
  ];

  var paymentMethods = ["Utalás", "Kártya", "Készpénz", "Utánvét", "Csoportos beszedés", "Egyéb"];
  var paymentTerms = [3, 8, 15, 30];
  var statuses = ["Fizetésre vár", "Utalva", "Kiegyenlítve"];
  var categories = ["Anyag", "Alvállalkozó", "Iroda", "Rezsi", "Flotta", "Bér", "Egyéb"];
  var uiState = {
    month: "",
    status: "all",
    paymentMethod: "all",
    localSearch: "",
    compactMode: false,
    sortKey: "date",
    sortDirection: "desc",
    editingId: "",
    selectedIds: {},
    filters: {
      date: "",
      partnerName: "",
      invoiceNumber: "",
      minGross: "",
      maxGross: "",
      projectName: "",
      category: "",
      note: ""
    }
  };

  function getInvoices() {
    return window.HRPlatform.storage.readCollection("invoices.records", seedInvoices).map(normalizeStoredInvoice);
  }

  function normalizeStoredInvoice(invoice) {
    var paymentMethod = normalizePaymentMethod(invoice.paymentMethod);
    var status = resolveInvoiceStatus(invoice.status, paymentMethod);
    return Object.assign({}, invoice, {
      paymentMethod: paymentMethod,
      status: status,
      paymentTermDays: normalizePaymentTerm(invoice.paymentTermDays, paymentMethod, invoice.date, invoice.dueDate),
      dueDate: normalizeDueDate(invoice),
      paidDate: normalizePaidDate(Object.assign({}, invoice, { status: status })),
      isSkonto: normalizeBoolean(invoice.isSkonto),
      category: categories.includes(invoice.category) ? invoice.category : normalizeCategory(invoice.category),
      partnerName: String(invoice.partnerName || "").trim(),
      projectName: String(invoice.projectName || "").trim(),
      sourceMonth: normalizeMonthLabel(invoice.sourceMonth)
    });
  }

  function saveInvoices(invoices) {
    window.HRPlatform.storage.writeCollection("invoices.records", invoices);
  }

  function getInvoiceDefaults() {
    var settings = window.HRPlatform.settings && typeof window.HRPlatform.settings.get === "function"
      ? window.HRPlatform.settings.get()
      : {};
    return Object.assign({
      paymentMethod: "Utalás",
      paymentTermDays: 8,
      category: "Egyéb",
      autoPaidDate: true
    }, settings.invoiceDefaults || {});
  }

  function getStoredPartners() {
    return window.HRPlatform.storage.readCollection("invoices.partners", []);
  }

  function savePartners(partners) {
    window.HRPlatform.storage.writeCollection("invoices.partners", partners);
  }

  function rememberPartnerNames(names) {
    var stored = getStoredPartners();
    var merged = stored.slice();

    names.forEach(function (name) {
      var partnerName = String(name || "").trim();
      if (partnerName && !merged.some(function (current) {
        return normalizeText(current) === normalizeText(partnerName);
      })) {
        merged.push(partnerName);
      }
    });

    savePartners(sortNames(merged));
  }

  function normalizeAmount(value) {
    var normalized = normalizeDecimalText(value);
    var numeric = Number(normalized || 0);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function normalizeDecimalText(value) {
    var text = String(value || "")
      .replace(/\s/g, "")
      .replace(/Ft/gi, "")
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

  function calculateVat(netAmount, grossAmount) {
    if (grossAmount > 0 && netAmount > 0) {
      return Math.max(0, grossAmount - netAmount);
    }

    return roundAmount(netAmount * 0.27);
  }

  function calculateGross(netAmount, vatAmount) {
    return roundAmount(Number(netAmount || 0) + Number(vatAmount || 0));
  }

  function roundAmount(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function getSummary() {
    var invoices = getInvoices();
    var open = invoices.filter(function (invoice) {
      return !isPaidInvoice(invoice);
    });
    var paid = invoices.filter(isPaidInvoice);

    return {
      count: invoices.length,
      openCount: open.length,
      paidCount: paid.length,
      openGross: open.reduce(function (sum, invoice) {
        return sum + Number(invoice.grossAmount || 0);
      }, 0),
      paidGross: paid.reduce(function (sum, invoice) {
        return sum + Number(invoice.grossAmount || 0);
      }, 0),
      vatTotal: invoices.reduce(function (sum, invoice) {
        return sum + Number(invoice.vatAmount || 0);
      }, 0)
    };
  }

  function stats() {
    var summary = getSummary();

    return [
      {
        label: "Számlák",
        value: summary.count,
        detail: "Nyilvántartott tétel"
      },
      {
        label: "Fizetésre vár",
        value: window.HRPlatform.utils.formatCurrency(summary.openGross),
        detail: summary.openCount + " nyitott számla"
      },
      {
        label: "ÁFA tartalom",
        value: window.HRPlatform.utils.formatCurrency(summary.vatTotal),
        detail: "Összesített ÁFA"
      }
    ];
  }

  function render(context) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var invoices = getInvoices();
    ensureSelectedMonth(invoices);

    var monthInvoices = invoices.filter(function (invoice) {
      return getInvoiceMonth(invoice) === uiState.month;
    });
    var visibleInvoices = getVisibleInvoices(context, invoices);
    var monthSummary = getInvoiceSummary(monthInvoices);
    var visibleSummary = getInvoiceSummary(visibleInvoices);
    var overdueCount = visibleInvoices.filter(isOverdue).length;
    var editingInvoice = uiState.editingId ? getInvoiceById(uiState.editingId) : null;
    var projectNames = getProjectNames(invoices);
    var partnerNames = getPartnerNames(invoices);

    return [
      '<div class="module-layout ' + (uiState.compactMode ? "invoice-focus-layout" : "") + '" data-module-root="invoices">',
      '  <div class="module-header">',
      "    <div>",
      '      <p class="module-kicker">Számlarendszerezés</p>',
      "      <h3>Számla modul</h3>",
      "      <p>Havi bontású számla nyilvántartás gyors szűrésekkel, rendezéssel, szerkesztéssel és egyértelmű kiegyenlítéssel.</p>",
      "    </div>",
      '    <div class="module-actions">',
      '      <button class="secondary-button" type="button" id="invoiceCompactToggle">' + (uiState.compactMode ? "Teljes nézet" : "Fókusz nézet") + "</button>",
      '      <button class="secondary-button" type="button" id="invoiceImportToggle">Excel import megnyitása</button>',
      '      <button class="primary-button" type="button" data-export="invoices">Látható CSV export</button>',
      "    </div>",
      "  </div>",
      renderMonthTabs(invoices),
      uiState.compactMode ? "" : [
        '  <div class="module-grid">',
        statCard("Havi számlák", monthSummary.count, money(monthSummary.grossTotal)),
        statCard("Látható lista", visibleSummary.count, money(visibleSummary.grossTotal)),
        statCard("Fizetésre vár", visibleSummary.openCount, money(visibleSummary.openGross)),
        statCard("Lejárt határidő", overdueCount, "Aktuális szűrésben"),
        "  </div>"
      ].join(""),
      renderInvoiceTools(visibleInvoices, monthInvoices, invoices, context),
      renderInvoiceReport(visibleInvoices),
      uiState.compactMode ? "" : renderInvoiceForm(editingInvoice, projectNames, partnerNames),
      uiState.compactMode ? "" : renderImportPanel(),
      renderInvoiceTable(visibleInvoices),
      "</div>"
    ].join("");
  }

  function renderMonthTabs(invoices) {
    var h = window.HRPlatform.utils.escapeHtml;
    var months = getAvailableMonths(invoices);

    if (months.length === 0) {
      return "";
    }

    return [
      '<section class="month-tabs" aria-label="Hónap választó">',
      months.map(function (month) {
        var count = invoices.filter(function (invoice) {
          return getInvoiceMonth(invoice) === month;
        }).length;
        return '<button class="month-tab ' + (month === uiState.month ? "active" : "") + '" type="button" data-month="' + h(month) + '"><span>' + h(month) + '</span><strong>' + count + "</strong></button>";
      }).join(""),
      "</section>"
    ].join("");
  }

  function renderInvoiceTools(visibleInvoices, monthInvoices, allInvoices, context) {
    var toolState = getInvoiceToolState(visibleInvoices, monthInvoices, allInvoices, context);

    return [
      '<section class="invoice-toolbar" aria-label="Számla szűrők">',
      '  <label class="field compact-field invoice-search-field"><span>Számla keresés</span><input id="invoiceLocalSearch" type="search" placeholder="Partner, sorszám, projekt..." value="' + hAttr(uiState.localSearch) + '" /></label>',
      '  <div class="field compact-field"><label>Státusz</label>' + filterSelect("invoiceStatusFilter", "status", ["all"].concat(statuses), uiState.status, "Összes státusz") + "</div>",
      '  <div class="field compact-field"><label>Fizetési mód</label>' + filterSelect("invoicePaymentFilter", "paymentMethod", ["all"].concat(paymentMethods), uiState.paymentMethod, "Összes mód") + "</div>",
      '  <div class="toolbar-summary" data-invoice-toolbar-summary><strong>' + visibleInvoices.length + " / " + toolState.totalBase + '</strong><span>' + toolState.helper + '</span></div>',
      '  <div class="bulk-actions" data-invoice-bulk-actions><span>' + toolState.selectedCount + " kijelölve</span>" + '<button class="settle-button" type="button" id="invoiceBulkSettle" ' + (toolState.selectedCount ? "" : "disabled") + '>Kiegyenlítés</button></div>',
      '<button class="secondary-button" type="button" id="invoiceSelectVisible" ' + (toolState.selectableCount ? "" : "disabled") + '>Láthatók kijelölése</button>',
      '<button class="secondary-button" type="button" id="invoiceClearFilters">Szűrők törlése</button>',
      '<div data-invoice-filter-hint>' + toolState.hint + '</div>',
      "</section>"
    ].join("");
  }

  function renderInvoiceReport(invoices) {
    var summary = getDetailedInvoiceSummary(invoices);
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;

    return [
      '<section class="invoice-report" data-invoice-report aria-label="Számla kimutatás">',
      '  <div class="invoice-report-head">',
      "    <div>",
      "      <h4>Kimutatás</h4>",
      "      <p>Az aktuálisan látható számlalista gyors pénzügyi bontása.</p>",
      "    </div>",
      '    <span class="invoice-report-pill">' + h(invoices.length + " látható tétel") + "</span>",
      "  </div>",
      '  <div class="invoice-report-grid">',
      '    <div class="invoice-report-metrics">',
      renderReportMetric("Bruttó összesen", money(summary.grossTotal)),
      renderReportMetric("Fizetésre vár", money(summary.openGross)),
      renderReportMetric("Kiegyenlítve", money(summary.paidGross)),
      renderReportMetric("ÁFA tartalom", money(summary.vatTotal)),
      renderReportMetric("Lejárt", summary.overdueCount + " db / " + money(summary.overdueGross)),
      "    </div>",
      renderBreakdownList("Kategóriák", aggregateInvoiceBreakdown(invoices, "category")),
      renderBreakdownList("Fizetési mód", aggregateInvoiceBreakdown(invoices, "paymentMethod")),
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderReportMetric(label, value) {
    return [
      '<div class="invoice-report-metric">',
      "<span>" + hAttr(label) + "</span>",
      "<strong>" + hAttr(value) + "</strong>",
      "</div>"
    ].join("");
  }

  function renderBreakdownList(title, rows) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    return [
      '<div class="invoice-report-breakdown">',
      "<h5>" + h(title) + "</h5>",
      rows.length ? rows.slice(0, 5).map(function (row) {
        return [
          '<div class="invoice-report-row">',
          "<span>" + h(row.label) + "</span>",
          "<strong>" + money(row.grossTotal) + "</strong>",
          "<small>" + row.count + " db</small>",
          "</div>"
        ].join("");
      }).join("") : '<div class="invoice-report-empty">Nincs megjeleníthető adat.</div>',
      "</div>"
    ].join("");
  }

  function getInvoiceToolState(visibleInvoices, monthInvoices, allInvoices, context) {
    var activeFilterCount = countActiveInvoiceFilters(context);
    var hasGlobalSearch = hasInvoiceGlobalSearch(context);
    var hasLocalSearch = hasInvoiceLocalSearch();
    var usesAllInvoices = hasGlobalSearch || hasLocalSearch || hasProjectQuickFilter() || hasPartnerQuickFilter();
    var totalBase = usesAllInvoices ? allInvoices.length : monthInvoices.length;
    var selectedCount = getSelectedInvoiceIds().length;
    var selectableCount = visibleInvoices.filter(function (invoice) {
      return !isPaidInvoice(invoice);
    }).length;
    var helper = activeFilterCount > 0
      ? activeFilterCount + " aktív szűrés miatt " + visibleInvoices.length + " tétel látszik" + (usesAllInvoices ? " az összes hónapból" : "")
      : (usesAllInvoices ? "Minden számla látszik" : "Minden havi tétel látszik");
    var hint = "";

    if ((hasGlobalSearch || hasLocalSearch) && visibleInvoices.length === 0) {
      hint = '<p class="filter-hint">Nincs találat az összes hónap számlái között erre a keresésre.</p>';
    } else if (!hasGlobalSearch && !hasLocalSearch && monthInvoices.length > 0 && visibleInvoices.length === 0) {
      hint = '<p class="filter-hint">Ebben a hónapban van ' + monthInvoices.length + ' számla, de a keresés vagy szűrők jelenleg elrejtik.</p>';
    }

    return {
      totalBase: totalBase,
      selectedCount: selectedCount,
      selectableCount: selectableCount,
      helper: helper,
      hint: hint
    };
  }

  function renderInvoiceTable(invoices) {
    return [
      '<div class="table-wrap invoice-table-wrap">',
      "    <table>",
      "      <thead>",
      "        <tr>",
      '          <th class="select-column"><input type="checkbox" id="invoiceSelectAll" aria-label="Látható nyitott számlák kijelölése" ' + (areAllVisibleOpenInvoicesSelected(invoices) ? "checked" : "") + " /></th>",
      sortableHeader("Dátum", "date"),
      sortableHeader("Partner", "partnerName"),
      sortableHeader("Sorszám", "invoiceNumber"),
      sortableHeader("Nettó", "netAmount"),
      sortableHeader("ÁFA", "vatAmount"),
      sortableHeader("Bruttó", "grossAmount"),
      sortableHeader("Mod", "paymentMethod"),
      sortableHeader("Státusz", "status"),
      sortableHeader("Határidő", "dueDate"),
      sortableHeader("Projekt", "projectName"),
      sortableHeader("Kategória", "category"),
      "          <th>Művelet</th>",
      "        </tr>",
      "        <tr class=\"column-filter-row\">",
      "          <th></th>",
      filterCell("date", "Dátum"),
      filterCell("partnerName", "Partner"),
      filterCell("invoiceNumber", "Sorszám"),
      '<th colspan="2"></th>',
      '<th><div class="amount-filter"><input data-column-filter="minGross" inputmode="decimal" placeholder="min" value="' + hAttr(uiState.filters.minGross) + '" /><input data-column-filter="maxGross" inputmode="decimal" placeholder="max" value="' + hAttr(uiState.filters.maxGross) + '" /></div></th>',
      '<th colspan="3"></th>',
      filterCell("projectName", "Projekt"),
      filterCell("category", "Kategória"),
      "          <th></th>",
      "        </tr>",
      "      </thead>",
      "      <tbody>",
      invoices.map(renderInvoiceRow).join("") || '<tr><td colspan="13">Nincs számla a szűrés szerint.</td></tr>',
      "      </tbody>",
      "    </table>",
      "  </div>"
    ].join("");
  }

  function renderInvoiceRow(invoice) {
    var h = window.HRPlatform.utils.escapeHtml;
    var money = window.HRPlatform.utils.formatCurrency;
    var date = window.HRPlatform.utils.formatDate;
    var isPaid = isPaidInvoice(invoice);
    var noteLine = [invoice.note || "", invoice.isSkonto ? "Skontó" : ""].filter(Boolean).join(" | ");

    return [
      '<tr class="' + (isOverdue(invoice) ? "row-warning" : "") + '">',
      '<td class="select-column"><input type="checkbox" data-select-invoice="' + h(invoice.id) + '" aria-label="Számla kijelölése" ' + (uiState.selectedIds[invoice.id] ? "checked" : "") + (isPaid ? " disabled" : "") + " /></td>",
      "<td>" + date(invoice.date) + "</td>",
      "<td>" + renderPartnerCell(invoice) + '<br><small>' + h(noteLine) + "</small></td>",
      "<td>" + h(invoice.invoiceNumber || "-") + "</td>",
      "<td>" + money(invoice.netAmount) + "</td>",
      "<td>" + money(invoice.vatAmount) + "</td>",
      "<td><strong>" + money(invoice.grossAmount) + "</strong></td>",
      "<td>" + h(invoice.paymentMethod) + "</td>",
      "<td>" + renderStatusCell(invoice) + "</td>",
      "<td>" + date(invoice.dueDate) + "</td>",
      "<td>" + renderProjectCell(invoice) + "</td>",
      "<td>" + h(invoice.category || "Egyéb") + "</td>",
      '<td><div class="row-actions">' + renderPaymentAction(invoice) + '<button class="quiet-button" type="button" data-edit-invoice="' + h(invoice.id) + '">Szerkesztés</button><button class="quiet-button danger" type="button" data-delete-invoice="' + h(invoice.id) + '">Törlés</button></div></td>',
      "</tr>"
    ].join("");
  }

  function renderPartnerCell(invoice) {
    var h = window.HRPlatform.utils.escapeHtml;
    if (!invoice.partnerName) {
      return '<span class="muted-text">-</span>';
    }

    return '<button class="project-chip partner-chip" type="button" data-partner-filter="' + h(invoice.partnerName) + '">' + h(invoice.partnerName) + "</button>";
  }

  function renderStatusCell(invoice) {
    var h = window.HRPlatform.utils.escapeHtml;
    var date = window.HRPlatform.utils.formatDate;
    var isPaid = isPaidInvoice(invoice);
    var paidLine = isPaid && invoice.paidDate ? '<small class="paid-date">' + date(invoice.paidDate) + "</small>" : "";

    return '<span class="status-stack"><span class="status-badge ' + (isPaid ? "success" : "warning") + '">' + h(invoice.status) + "</span>" + paidLine + "</span>";
  }

  function renderProjectCell(invoice) {
    var h = window.HRPlatform.utils.escapeHtml;
    if (!invoice.projectName) {
      return '<span class="muted-text">-</span>';
    }

    return '<button class="project-chip" type="button" data-project-filter="' + h(invoice.projectName) + '">' + h(invoice.projectName) + "</button>";
  }

  function renderPaymentAction(invoice) {
    var h = window.HRPlatform.utils.escapeHtml;
    if (isPaidInvoice(invoice)) {
      return '<button class="quiet-button" type="button" data-reopen-invoice="' + h(invoice.id) + '">Újranyitás</button>';
    }

    return '<button class="settle-button" type="button" data-settle-invoice="' + h(invoice.id) + '">Kiegyenlítés</button>';
  }

  function sortableHeader(label, key) {
    var marker = uiState.sortKey === key ? (uiState.sortDirection === "asc" ? " ↑" : " ↓") : "";
    return '<th><button class="sort-button" type="button" data-sort-key="' + key + '">' + label + '<span>' + marker + "</span></button></th>";
  }

  function filterCell(key, placeholder) {
    return '<th><input class="column-filter" data-column-filter="' + key + '" placeholder="' + placeholder + '" value="' + hAttr(uiState.filters[key]) + '" /></th>';
  }

  function renderInvoiceForm(editingInvoice, projectNames, partnerNames) {
    var invoice = editingInvoice || {};
    var defaults = getInvoiceDefaults();
    var title = editingInvoice ? "Számla szerkesztése" : "Új számla";
    var submitLabel = editingInvoice ? "Módosítás mentése" : "Számla mentése";
    var selectedPaymentMethod = normalizePaymentMethod(invoice.paymentMethod || defaults.paymentMethod);
    var selectedPaymentTerm = normalizePaymentTerm(invoice.paymentTermDays == null ? defaults.paymentTermDays : invoice.paymentTermDays, selectedPaymentMethod, invoice.date, invoice.dueDate);
    var projectOptions = projectNames.map(function (projectName) {
      return '<option value="' + hAttr(projectName) + '"></option>';
    }).join("");
    var partnerOptions = partnerNames.map(function (partnerName) {
      return '<option value="' + hAttr(partnerName) + '"></option>';
    }).join("");

    return [
      '<form class="form-panel invoice-form" id="invoiceForm">',
      '<div class="form-heading"><strong>' + title + '</strong><span>' + (editingInvoice ? "A szerkesztés a kijelölt tételt írja felül." : "Kézi rögzítéssel is adhatsz új tételt.") + "</span></div>",
      '<input name="id" type="hidden" value="' + hAttr(invoice.id || "") + '" />',
      '<datalist id="invoiceProjectOptions">' + projectOptions + "</datalist>",
      '<datalist id="invoicePartnerOptions">' + partnerOptions + "</datalist>",
      field("Dátum", '<input name="date" type="date" value="' + hAttr(invoice.date || "") + '" />'),
      field("Partner neve", '<input name="partnerName" list="invoicePartnerOptions" autocomplete="off" required placeholder="Kezdd el írni: Partner..." value="' + hAttr(invoice.partnerName || "") + '" />'),
      field("Számla sorszáma", '<input name="invoiceNumber" placeholder="ABC-2026-001" value="' + hAttr(invoice.invoiceNumber || "") + '" />'),
      field("Nettó", '<input name="netAmount" inputmode="decimal" value="' + hAttr(invoice.netAmount || "") + '" />'),
      field("ÁFA", '<input name="vatAmount" inputmode="decimal" placeholder="Automatikus 27%" value="' + hAttr(invoice.vatAmount || "") + '" />'),
      field("Bruttó", '<input name="grossAmount" inputmode="decimal" placeholder="Automatikus" value="' + hAttr(invoice.grossAmount || "") + '" />'),
      field("Fizetési mód", select("paymentMethod", paymentMethods, selectedPaymentMethod)),
      field("Fizetési határidő", paymentTermSelect(selectedPaymentTerm)),
      field("Státusz", select("status", statuses, invoice.status || "Fizetésre vár")),
      field("Utalás dátuma", '<input name="paidDate" type="date" value="' + hAttr(invoice.paidDate || "") + '" />'),
      field("Skontó", '<label class="checkbox-field"><input name="isSkonto" type="checkbox" value="true" ' + (invoice.isSkonto ? "checked" : "") + ' /><span>Skontós számla</span></label>'),
      field("Projekt", '<input name="projectName" list="invoiceProjectOptions" autocomplete="off" placeholder="Kezdd el írni: Leven..." value="' + hAttr(invoice.projectName || "") + '" />'),
      field("Kategória", select("category", categories, invoice.category || defaults.category)),
      field("Megjegyzés", '<input name="note" placeholder="Projekt, rövid leírás" value="' + hAttr(invoice.note || "") + '" />'),
      '<div class="form-actions"><button class="primary-button" type="submit">' + submitLabel + '</button>' + (editingInvoice ? '<button class="secondary-button" type="button" id="invoiceCancelEdit">Mégse</button>' : "") + "</div>",
      "</form>"
    ].join("");
  }

  function renderImportPanel() {
    return [
      '<section class="module-card import-panel" id="invoiceImportPanel" hidden>',
      "  <h4>Excel import</h4>",
      "  <p>Az Excelből ments CSV-t, vagy másold ki a táblázat sorait és illeszd be ide. A jelenlegi havi fülek oszlopait is felismeri: Dátum, Kiállító, Számlaszám, Bruttó, ÁFA tartalom, Fizetés módja.</p>",
      '  <textarea id="invoiceImportText" placeholder="hónap;dátum;kiállító;számlaszám;bruttó;áfa tartalom;fizetés módja;fizetési határidő;kiegyenlítés;projekt;megjegyzés"></textarea>',
      '  <div class="module-actions">',
      '    <label class="secondary-button file-button">CSV fájl választása<input id="invoiceImportFile" type="file" accept=".csv,.txt,.tsv" /></label>',
      '    <button class="primary-button" type="button" id="invoiceImportButton">Import indítása</button>',
      "  </div>",
      '  <p class="import-help">Támogatott oszlopnevek: hónap, dátum, kiállító/partner, számlaszám, nettó, bruttó, áfa tartalom, fizetés módja, fizetési határidő, kiegyenlítés, projekt, megjegyzés.</p>',
      "</section>"
    ].join("");
  }

  function afterRender(root, context) {
    var form = root.querySelector("#invoiceForm");
    var importPanel = root.querySelector("#invoiceImportPanel");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var formData = Object.fromEntries(new FormData(form).entries());
        var invoices = getInvoices();
        var invoice = normalizeInvoice(formData, getProjectNames(invoices), getPartnerNames(invoices));
        rememberPartnerNames([invoice.partnerName]);

        if (uiState.editingId) {
          saveInvoices(invoices.map(function (current) {
            return current.id === uiState.editingId ? Object.assign({}, invoice, { id: uiState.editingId }) : current;
          }));
          uiState.editingId = "";
        } else {
          invoices.unshift(invoice);
          saveInvoices(invoices);
        }

        uiState.selectedIds = {};
        form.reset();
        window.HRPlatform.notify();
      });
    }

    var cancelButton = root.querySelector("#invoiceCancelEdit");
    if (cancelButton) {
      cancelButton.addEventListener("click", function () {
        uiState.editingId = "";
        window.HRPlatform.notify();
      });
    }

    root.querySelectorAll("[data-month]").forEach(function (button) {
      button.addEventListener("click", function () {
        uiState.month = button.getAttribute("data-month");
        uiState.editingId = "";
        clearInvoiceFilters();
        uiState.selectedIds = {};
        if (window.HRPlatform && window.HRPlatform.state) {
          window.HRPlatform.state.searchTerm = "";
          var searchInput = document.getElementById("globalSearch");
          if (searchInput) {
            searchInput.value = "";
          }
        }
        window.HRPlatform.notify();
      });
    });

    var localSearchInput = root.querySelector("#invoiceLocalSearch");
    if (localSearchInput) {
      localSearchInput.addEventListener("input", function () {
        uiState.localSearch = localSearchInput.value;
        uiState.selectedIds = {};
        refreshInvoiceResults(root, context || {});
      });
    }

    root.querySelector("#invoiceStatusFilter").addEventListener("change", function (event) {
      uiState.status = event.target.value;
      uiState.selectedIds = {};
      window.HRPlatform.notify();
    });

    root.querySelector("#invoicePaymentFilter").addEventListener("change", function (event) {
      uiState.paymentMethod = event.target.value;
      uiState.selectedIds = {};
      window.HRPlatform.notify();
    });

    root.querySelectorAll("[data-column-filter]").forEach(function (input) {
      input.addEventListener("input", function () {
        uiState.filters[input.getAttribute("data-column-filter")] = input.value;
      });
      input.addEventListener("change", function () {
        uiState.filters[input.getAttribute("data-column-filter")] = input.value;
        uiState.selectedIds = {};
        window.HRPlatform.notify();
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          uiState.filters[input.getAttribute("data-column-filter")] = input.value;
          uiState.selectedIds = {};
          window.HRPlatform.notify();
        }
      });
    });

    var partnerInput = root.querySelector('input[name="partnerName"]');
    if (partnerInput) {
      partnerInput.addEventListener("blur", function () {
        var canonicalPartner = findCanonicalName(partnerInput.value, getPartnerNames(getInvoices()));
        if (canonicalPartner) {
          partnerInput.value = canonicalPartner;
        }
      });
    }

    var projectInput = root.querySelector('input[name="projectName"]');
    if (projectInput) {
      projectInput.addEventListener("blur", function () {
        var canonicalProject = findCanonicalName(projectInput.value, getProjectNames(getInvoices()));
        if (canonicalProject) {
          projectInput.value = canonicalProject;
        }
      });
    }

    var paymentMethodInput = root.querySelector('select[name="paymentMethod"]');
    var paymentTermInput = root.querySelector('select[name="paymentTermDays"]');
    function syncPaymentTermControl() {
      if (!paymentMethodInput || !paymentTermInput) {
        return;
      }
      var method = normalizePaymentMethod(paymentMethodInput.value);
      var isImmediate = isImmediatePaymentMethod(method);
      paymentTermInput.disabled = isImmediate;
      if (isImmediate) {
        paymentTermInput.value = "0";
      } else if (paymentTermInput.value === "0") {
        paymentTermInput.value = "8";
      }
    }
    if (paymentMethodInput && paymentTermInput) {
      paymentMethodInput.addEventListener("change", function () {
        syncPaymentTermControl();
        syncImmediatePaymentStatus(form);
      });
      paymentTermInput.addEventListener("change", syncPaymentTermControl);
      syncPaymentTermControl();
      syncImmediatePaymentStatus(form);
    }

    root.querySelectorAll("[data-sort-key]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-sort-key");
        if (uiState.sortKey === key) {
          uiState.sortDirection = uiState.sortDirection === "asc" ? "desc" : "asc";
        } else {
          uiState.sortKey = key;
          uiState.sortDirection = key === "partnerName" || key === "invoiceNumber" ? "asc" : "desc";
        }
        window.HRPlatform.notify();
      });
    });

    root.querySelector("#invoiceCompactToggle").addEventListener("click", function () {
      uiState.compactMode = !uiState.compactMode;
      uiState.editingId = "";
      uiState.selectedIds = {};
      window.HRPlatform.notify();
    });

    root.querySelector("#invoiceClearFilters").addEventListener("click", function () {
      clearInvoiceFilters();
      uiState.selectedIds = {};
      if (window.HRPlatform && window.HRPlatform.state) {
        window.HRPlatform.state.searchTerm = "";
        var searchInput = document.getElementById("globalSearch");
        if (searchInput) {
          searchInput.value = "";
        }
      }
      window.HRPlatform.notify();
    });

    root.querySelector("#invoiceImportToggle").addEventListener("click", function () {
      if (uiState.compactMode) {
        uiState.compactMode = false;
        window.HRPlatform.notify();
        return;
      }
      if (importPanel) {
        importPanel.hidden = !importPanel.hidden;
      }
    });

    var importFileInput = root.querySelector("#invoiceImportFile");
    if (importFileInput) {
      importFileInput.addEventListener("change", function (event) {
        var file = event.target.files[0];
        if (!file) {
          return;
        }

        file.text().then(function (text) {
          root.querySelector("#invoiceImportText").value = text;
        });
      });
    }

    var importButton = root.querySelector("#invoiceImportButton");
    if (importButton) {
      importButton.addEventListener("click", function () {
        var text = root.querySelector("#invoiceImportText").value;
        var imported = parseImportText(text);
        if (imported.length === 0) {
          alert("Nem találtam importálható sort.");
          return;
        }

        saveInvoices(imported.concat(getInvoices()));
        rememberPartnerNames(imported.map(function (invoice) {
          return invoice.partnerName;
        }));
        root.querySelector("#invoiceImportText").value = "";
        uiState.month = "";
        uiState.selectedIds = {};
        ensureSelectedMonth(getInvoices());
        window.HRPlatform.notify();
      });
    }

    root.querySelectorAll("[data-select-invoice]").forEach(function (input) {
      input.addEventListener("change", function () {
        var id = input.getAttribute("data-select-invoice");
        if (input.checked) {
          uiState.selectedIds[id] = true;
        } else {
          delete uiState.selectedIds[id];
        }
        window.HRPlatform.notify();
      });
    });

    var selectAll = root.querySelector("#invoiceSelectAll");
    if (selectAll) {
      selectAll.addEventListener("change", function () {
        setVisibleOpenInvoicesSelected(getVisibleInvoices(context || {}, getInvoices()), selectAll.checked);
        window.HRPlatform.notify();
      });
    }

    root.querySelector("#invoiceSelectVisible").addEventListener("click", function () {
      setVisibleOpenInvoicesSelected(getVisibleInvoices(context || {}, getInvoices()), true);
      window.HRPlatform.notify();
    });

    root.querySelector("#invoiceBulkSettle").addEventListener("click", function () {
      var ids = getSelectedInvoiceIds();
      if (!ids.length) {
        return;
      }
      updateInvoiceStatuses(ids, "Utalva");
    });

    root.querySelectorAll("[data-settle-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        updateInvoiceStatuses([button.getAttribute("data-settle-invoice")], "Utalva");
      });
    });

    root.querySelectorAll("[data-reopen-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        updateInvoiceStatuses([button.getAttribute("data-reopen-invoice")], "Fizetésre vár");
      });
    });

    root.querySelectorAll("[data-edit-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        uiState.editingId = button.getAttribute("data-edit-invoice");
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-delete-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.getAttribute("data-delete-invoice");
        if (!confirm("Biztosan törlöd ezt a számlát?")) {
          return;
        }
        saveInvoices(getInvoices().filter(function (invoice) {
          return invoice.id !== id;
        }));
        delete uiState.selectedIds[id];
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-partner-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        uiState.filters.partnerName = button.getAttribute("data-partner-filter");
        uiState.editingId = "";
        uiState.selectedIds = {};
        if (window.HRPlatform && window.HRPlatform.state) {
          window.HRPlatform.state.searchTerm = "";
          var searchInput = document.getElementById("globalSearch");
          if (searchInput) {
            searchInput.value = "";
          }
        }
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-project-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        uiState.filters.projectName = button.getAttribute("data-project-filter");
        uiState.editingId = "";
        uiState.selectedIds = {};
        if (window.HRPlatform && window.HRPlatform.state) {
          window.HRPlatform.state.searchTerm = "";
          var searchInput = document.getElementById("globalSearch");
          if (searchInput) {
            searchInput.value = "";
          }
        }
        window.HRPlatform.notify();
      });
    });
  }

  function refreshInvoiceResults(root, context) {
    var invoices = getInvoices();
    ensureSelectedMonth(invoices);
    var monthInvoices = invoices.filter(function (invoice) {
      return getInvoiceMonth(invoice) === uiState.month;
    });
    var visibleInvoices = getVisibleInvoices(context || {}, invoices);
    var toolState = getInvoiceToolState(visibleInvoices, monthInvoices, invoices, context || {});
    var tableWrap = root.querySelector(".invoice-table-wrap");
    var toolbarSummary = root.querySelector("[data-invoice-toolbar-summary]");
    var report = root.querySelector("[data-invoice-report]");
    var bulkActions = root.querySelector("[data-invoice-bulk-actions]");
    var selectVisible = root.querySelector("#invoiceSelectVisible");
    var bulkSettle = root.querySelector("#invoiceBulkSettle");
    var hint = root.querySelector("[data-invoice-filter-hint]");

    if (toolbarSummary) {
      toolbarSummary.innerHTML = "<strong>" + visibleInvoices.length + " / " + toolState.totalBase + "</strong><span>" + toolState.helper + "</span>";
    }
    if (bulkActions) {
      bulkActions.querySelector("span").textContent = toolState.selectedCount + " kijelölve";
    }
    if (bulkSettle) {
      bulkSettle.disabled = !toolState.selectedCount;
    }
    if (selectVisible) {
      selectVisible.disabled = !toolState.selectableCount;
    }
    if (hint) {
      hint.innerHTML = toolState.hint;
    }
    if (report) {
      report.outerHTML = renderInvoiceReport(visibleInvoices);
    }
    if (tableWrap) {
      tableWrap.outerHTML = renderInvoiceTable(visibleInvoices);
      bindInvoiceTableActions(root, context || {});
    }
  }

  function bindInvoiceTableActions(root, context) {
    root.querySelectorAll("[data-column-filter]").forEach(function (input) {
      input.addEventListener("input", function () {
        uiState.filters[input.getAttribute("data-column-filter")] = input.value;
      });
      input.addEventListener("change", function () {
        uiState.filters[input.getAttribute("data-column-filter")] = input.value;
        uiState.selectedIds = {};
        window.HRPlatform.notify();
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          uiState.filters[input.getAttribute("data-column-filter")] = input.value;
          uiState.selectedIds = {};
          window.HRPlatform.notify();
        }
      });
    });

    root.querySelectorAll("[data-sort-key]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-sort-key");
        if (uiState.sortKey === key) {
          uiState.sortDirection = uiState.sortDirection === "asc" ? "desc" : "asc";
        } else {
          uiState.sortKey = key;
          uiState.sortDirection = key === "partnerName" || key === "invoiceNumber" ? "asc" : "desc";
        }
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-select-invoice]").forEach(function (input) {
      input.addEventListener("change", function () {
        var id = input.getAttribute("data-select-invoice");
        if (input.checked) {
          uiState.selectedIds[id] = true;
        } else {
          delete uiState.selectedIds[id];
        }
        refreshInvoiceResults(root, context || {});
      });
    });

    var selectAll = root.querySelector("#invoiceSelectAll");
    if (selectAll) {
      selectAll.addEventListener("change", function () {
        setVisibleOpenInvoicesSelected(getVisibleInvoices(context || {}, getInvoices()), selectAll.checked);
        refreshInvoiceResults(root, context || {});
      });
    }

    root.querySelectorAll("[data-settle-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        updateInvoiceStatuses([button.getAttribute("data-settle-invoice")], "Utalva");
      });
    });

    root.querySelectorAll("[data-reopen-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        updateInvoiceStatuses([button.getAttribute("data-reopen-invoice")], "Fizetésre vár");
      });
    });

    root.querySelectorAll("[data-edit-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        uiState.editingId = button.getAttribute("data-edit-invoice");
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-delete-invoice]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.getAttribute("data-delete-invoice");
        if (!confirm("Biztosan törlöd ezt a számlát?")) {
          return;
        }
        saveInvoices(getInvoices().filter(function (invoice) {
          return invoice.id !== id;
        }));
        delete uiState.selectedIds[id];
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-partner-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        uiState.filters.partnerName = button.getAttribute("data-partner-filter");
        uiState.editingId = "";
        uiState.selectedIds = {};
        if (window.HRPlatform && window.HRPlatform.state) {
          window.HRPlatform.state.searchTerm = "";
          var searchInput = document.getElementById("globalSearch");
          if (searchInput) {
            searchInput.value = "";
          }
        }
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-project-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        uiState.filters.projectName = button.getAttribute("data-project-filter");
        uiState.editingId = "";
        uiState.selectedIds = {};
        if (window.HRPlatform && window.HRPlatform.state) {
          window.HRPlatform.state.searchTerm = "";
          var searchInput = document.getElementById("globalSearch");
          if (searchInput) {
            searchInput.value = "";
          }
        }
        window.HRPlatform.notify();
      });
    });
  }

  function updateInvoiceStatuses(ids, status) {
    var selected = ids.reduce(function (map, id) {
      map[id] = true;
      return map;
    }, {});
    var autoPaidDate = getInvoiceDefaults().autoPaidDate;
    var paidDate = isPaidStatus(status) && autoPaidDate ? todayIsoDate() : "";

    saveInvoices(getInvoices().map(function (invoice) {
      if (!selected[invoice.id]) {
        return invoice;
      }

      return Object.assign({}, invoice, {
        status: status,
        paidDate: paidDate,
        paidDateAutoDisabled: isPaidStatus(status) && !autoPaidDate
      });
    }));
    uiState.selectedIds = {};
    window.HRPlatform.notify();
  }

  function getSelectedInvoiceIds() {
    return Object.keys(uiState.selectedIds).filter(function (id) {
      return uiState.selectedIds[id];
    });
  }

  function setVisibleOpenInvoicesSelected(invoices, selected) {
    invoices.forEach(function (invoice) {
      if (isPaidInvoice(invoice)) {
        return;
      }

      if (selected) {
        uiState.selectedIds[invoice.id] = true;
      } else {
        delete uiState.selectedIds[invoice.id];
      }
    });
  }

  function areAllVisibleOpenInvoicesSelected(invoices) {
    var openInvoices = invoices.filter(function (invoice) {
      return !isPaidInvoice(invoice);
    });

    return openInvoices.length > 0 && openInvoices.every(function (invoice) {
      return uiState.selectedIds[invoice.id];
    });
  }

  function getVisibleInvoices(context, invoices) {
    var visible = hasInvoiceGlobalSearch(context) || hasInvoiceLocalSearch() || hasProjectQuickFilter() || hasPartnerQuickFilter()
      ? invoices.slice()
      : invoices.filter(function (invoice) {
        return getInvoiceMonth(invoice) === uiState.month;
      });

    visible = visible.filter(function (invoice) {
      return window.HRPlatform.utils.matchesSearch(invoice, context.searchTerm);
    });

    visible = visible.filter(function (invoice) {
      return window.HRPlatform.utils.matchesSearch(invoice, uiState.localSearch);
    });

    visible = visible.filter(matchesInvoiceFilters);
    visible.sort(compareInvoices);

    return visible;
  }

  function hasInvoiceGlobalSearch(context) {
    return Boolean(context && String(context.searchTerm || "").trim());
  }

  function hasInvoiceLocalSearch() {
    return Boolean(String(uiState.localSearch || "").trim());
  }

  function countActiveInvoiceFilters(context) {
    var count = 0;
    if (context && String(context.searchTerm || "").trim()) {
      count += 1;
    }
    if (String(uiState.localSearch || "").trim()) {
      count += 1;
    }
    if (uiState.status !== "all") {
      count += 1;
    }
    if (uiState.paymentMethod !== "all") {
      count += 1;
    }
    Object.keys(uiState.filters).forEach(function (key) {
      if (String(uiState.filters[key] || "").trim()) {
        count += 1;
      }
    });
    return count;
  }

  function clearInvoiceFilters() {
    uiState.status = "all";
    uiState.paymentMethod = "all";
    uiState.localSearch = "";
    uiState.filters = {
      date: "",
      partnerName: "",
      invoiceNumber: "",
      minGross: "",
      maxGross: "",
      projectName: "",
      category: "",
      note: ""
    };
  }

  function matchesInvoiceFilters(invoice) {
    if (uiState.status !== "all" && invoice.status !== uiState.status) {
      return false;
    }

    if (uiState.paymentMethod !== "all" && invoice.paymentMethod !== uiState.paymentMethod) {
      return false;
    }

    if (uiState.filters.date && !String(invoice.date || "").includes(uiState.filters.date)) {
      return false;
    }

    if (uiState.filters.partnerName && !normalizeText(invoice.partnerName).includes(normalizeText(uiState.filters.partnerName))) {
      return false;
    }

    if (uiState.filters.invoiceNumber && !normalizeText(invoice.invoiceNumber).includes(normalizeText(uiState.filters.invoiceNumber))) {
      return false;
    }

    if (uiState.filters.projectName && !normalizeText(invoice.projectName).includes(normalizeText(uiState.filters.projectName))) {
      return false;
    }

    if (uiState.filters.category && !normalizeText(invoice.category).includes(normalizeText(uiState.filters.category))) {
      return false;
    }

    if (uiState.filters.note && !normalizeText(invoice.note).includes(normalizeText(uiState.filters.note))) {
      return false;
    }

    if (uiState.filters.minGross && Number(invoice.grossAmount || 0) < normalizeAmount(uiState.filters.minGross)) {
      return false;
    }

    if (uiState.filters.maxGross && Number(invoice.grossAmount || 0) > normalizeAmount(uiState.filters.maxGross)) {
      return false;
    }

    return true;
  }

  function compareInvoices(a, b) {
    var direction = uiState.sortDirection === "asc" ? 1 : -1;
    var aValue = sortValue(a, uiState.sortKey);
    var bValue = sortValue(b, uiState.sortKey);

    if (aValue < bValue) {
      return -1 * direction;
    }

    if (aValue > bValue) {
      return direction;
    }

    return 0;
  }

  function sortValue(invoice, key) {
    if (["netAmount", "vatAmount", "grossAmount"].includes(key)) {
      return Number(invoice[key] || 0);
    }

    if (key === "date" || key === "dueDate") {
      return invoice[key] || "0000-00-00";
    }

    return normalizeText(invoice[key]);
  }

  function hasProjectQuickFilter() {
    return Boolean(String(uiState.filters.projectName || "").trim());
  }

  function hasPartnerQuickFilter() {
    return Boolean(String(uiState.filters.partnerName || "").trim());
  }

  function getProjectNames(invoices) {
    return collectNames(invoices, "projectName", []);
  }

  function getPartnerNames(invoices) {
    return collectNames(invoices, "partnerName", getStoredPartners());
  }

  function collectNames(invoices, key, extraNames) {
    var names = [];
    (extraNames || []).forEach(function (name) {
      addUniqueName(names, name);
    });
    invoices.forEach(function (invoice) {
      addUniqueName(names, invoice[key]);
    });

    return sortNames(names);
  }

  function addUniqueName(names, value) {
    var name = String(value || "").trim();
    if (name && !names.some(function (current) {
      return normalizeText(current) === normalizeText(name);
    })) {
      names.push(name);
    }
  }

  function sortNames(names) {
    return names.sort(function (a, b) {
      return normalizeText(a).localeCompare(normalizeText(b), "hu-HU");
    });
  }

  function getInvoiceSummary(invoices) {
    var open = invoices.filter(function (invoice) {
      return !isPaidInvoice(invoice);
    });

    return {
      count: invoices.length,
      openCount: open.length,
      grossTotal: invoices.reduce(function (sum, invoice) {
        return sum + Number(invoice.grossAmount || 0);
      }, 0),
      openGross: open.reduce(function (sum, invoice) {
        return sum + Number(invoice.grossAmount || 0);
      }, 0)
    };
  }

  function getDetailedInvoiceSummary(invoices) {
    var open = invoices.filter(function (invoice) {
      return !isPaidInvoice(invoice);
    });
    var paid = invoices.filter(isPaidInvoice);
    var overdue = invoices.filter(isOverdue);

    return {
      count: invoices.length,
      openCount: open.length,
      paidCount: paid.length,
      overdueCount: overdue.length,
      netTotal: sumInvoiceField(invoices, "netAmount"),
      vatTotal: sumInvoiceField(invoices, "vatAmount"),
      grossTotal: sumInvoiceField(invoices, "grossAmount"),
      openGross: sumInvoiceField(open, "grossAmount"),
      paidGross: sumInvoiceField(paid, "grossAmount"),
      overdueGross: sumInvoiceField(overdue, "grossAmount")
    };
  }

  function sumInvoiceField(invoices, fieldName) {
    return invoices.reduce(function (sum, invoice) {
      return sum + Number(invoice[fieldName] || 0);
    }, 0);
  }

  function aggregateInvoiceBreakdown(invoices, fieldName) {
    var map = {};
    invoices.forEach(function (invoice) {
      var label = String(invoice[fieldName] || "Nincs megadva").trim() || "Nincs megadva";
      if (!map[label]) {
        map[label] = {
          label: label,
          count: 0,
          grossTotal: 0
        };
      }
      map[label].count += 1;
      map[label].grossTotal += Number(invoice.grossAmount || 0);
    });

    return Object.keys(map).map(function (key) {
      return map[key];
    }).sort(function (a, b) {
      if (b.grossTotal !== a.grossTotal) {
        return b.grossTotal - a.grossTotal;
      }
      return normalizeText(a.label).localeCompare(normalizeText(b.label), "hu-HU");
    });
  }

  function getAvailableMonths(invoices) {
    var months = [];
    invoices.forEach(function (invoice) {
      var month = getInvoiceMonth(invoice);
      if (!months.includes(month)) {
        months.push(month);
      }
    });

    return months.sort(compareMonths);
  }

  function ensureSelectedMonth(invoices) {
    var months = getAvailableMonths(invoices);
    if (months.length === 0) {
      uiState.month = "";
      return;
    }

    if (!uiState.month || !months.includes(uiState.month)) {
      uiState.month = months[months.length - 1];
    }
  }

  function getInvoiceMonth(invoice) {
    if (invoice.date) {
      return formatInvoiceMonth(invoice.date);
    }

    return String(invoice.sourceMonth || "Nincs hónap").trim() || "Nincs hónap";
  }

  function compareMonths(a, b) {
    var aValue = monthSortValue(a);
    var bValue = monthSortValue(b);
    if (aValue !== bValue) {
      return aValue - bValue;
    }

    return normalizeText(a).localeCompare(normalizeText(b));
  }

  function monthSortValue(month) {
    var text = normalizeText(month);
    var yearMatch = text.match(/(20\d{2})/);
    var year = yearMatch ? Number(yearMatch[1]) : 0;
    var monthNumber = monthNumberFromLabel(text);

    return year * 12 + monthNumber;
  }

  function monthNumberFromLabel(text) {
    var order = ["januar", "februar", "marius", "marcius", "aprilis", "majus", "junius", "julius", "augusztus", "szeptember", "oktober", "november", "december"];
    var index = order.indexOf(text.replace(/20\d{2}/g, "").replace(/[.\s]/g, ""));
    if (index < 0) {
      index = order.findIndex(function (monthName) {
        return text.includes(monthName);
      });
    }

    return index >= 0 ? index + 1 : 99;
  }

  function formatInvoiceMonth(dateValue) {
    var normalizedDate = normalizeDate(dateValue);
    var match = normalizedDate.match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (!match) {
      return String(dateValue || "Nincs hónap").trim() || "Nincs hónap";
    }

    var labels = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
    return match[1] + ". " + labels[Number(match[2]) - 1];
  }

  function getInvoiceById(id) {
    return getInvoices().find(function (invoice) {
      return invoice.id === id;
    });
  }

  function parseImportText(text) {
    var rows = String(text || "")
      .split(/\r?\n/)
      .map(function (row) {
        return row.trim();
      })
      .filter(Boolean);

    if (rows.length === 0) {
      return [];
    }

    var delimiter = detectDelimiter(rows[0]);
    var first = splitRow(rows[0], delimiter);
    var hasHeader = first.some(function (cell) {
      return normalizeHeader(cell).includes("datum") || normalizeHeader(cell).includes("partner") || normalizeHeader(cell).includes("kiallito");
    });
    var headers = hasHeader ? first.map(normalizeHeader) : defaultHeaders();
    var dataRows = hasHeader ? rows.slice(1) : rows;

    var knownProjects = getProjectNames(getInvoices());

    return dataRows
      .map(function (row) {
        var cells = splitRow(row, delimiter);
        var raw = {};
        headers.forEach(function (header, index) {
          raw[header] = cells[index] || "";
        });
        return normalizeInvoice(mapImportedRow(raw), knownProjects, getPartnerNames(getInvoices()));
      })
      .filter(function (invoice) {
        return invoice.partnerName && (invoice.invoiceNumber || Number(invoice.grossAmount || 0) > 0);
      });
  }

  function detectDelimiter(row) {
    if (row.indexOf(";") >= 0) {
      return ";";
    }

    if (row.indexOf("\t") >= 0) {
      return "\t";
    }

    return ",";
  }

  function splitRow(row, delimiter) {
    var cells = [];
    var current = "";
    var quoted = false;

    String(row).split("").forEach(function (char) {
      if (char === '"') {
        quoted = !quoted;
        return;
      }

      if (char === delimiter && !quoted) {
        cells.push(current.trim());
        current = "";
        return;
      }

      current += char;
    });
    cells.push(current.trim());

    return cells;
  }

  function defaultHeaders() {
    return [
      "datum",
      "partnerneve",
      "szamlasorszama",
      "osszegnetto",
      "afatartalom",
      "osszegbrutto",
      "fizetesimod",
      "statusz",
      "honap",
      "skonto",
      "projekt"
    ];
  }

  function normalizeHeader(value) {
    return String(value || "")
      .toLocaleLowerCase("hu-HU")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function mapImportedRow(raw) {
    return {
      date: raw.datum || raw.keltes || raw.date,
      partnerName: raw.partnerneve || raw.partner || raw.kiallito || raw.szallito || raw.vevo,
      invoiceNumber: raw.szamlasorszama || raw.szamlasorszam || raw.szamlaszam || raw.sorszam || raw.invoice,
      netAmount: raw.osszegnetto || raw.netto || raw.netamount,
      vatAmount: raw.afatartalom || raw.afa || raw.vatamount,
      grossAmount: raw.osszegbrutto || raw.brutto || raw.grossamount,
      paymentMethod: raw.fizetesmodja || raw.fizetesimod || raw.fizetes || raw.paymentmethod,
      status: raw.statusz || raw.allapot || raw.status || raw.kiegyenlites || statusLikeValue(raw.fizetesihatarido),
      dueDate: dateLikeValue(raw.fizetesihatarido) || raw.hatarido || raw.duedate,
      paidDate: raw.utalasdatuma || raw.kiegyenlitesdatuma || raw.fizetesdatuma || raw.paiddate || raw.paymentdate,
      isSkonto: raw.skonto || raw.skontos || raw.discount,
      projectName: raw.projekt || raw.project || raw.projectname || raw.munka || raw.munkaneve,
      category: raw.kategoria || raw.category,
      note: mergeNotes(raw.megjegyzes || raw.note, statusNote(raw.fizetesihatarido), statusNote(raw.kiegyenlites)),
      sourceMonth: raw.honap || raw.month || raw.munkalap || raw.sheet
    };
  }

  function normalizeInvoice(raw, projectNames, partnerNames) {
    var netAmount = normalizeAmount(raw.netAmount);
    var grossAmount = normalizeAmount(raw.grossAmount);
    var vatAmount = normalizeAmount(raw.vatAmount);
    var date = normalizeDate(raw.date);
    var paymentMethod = normalizePaymentMethod(raw.paymentMethod);
    var paymentTermDays = normalizePaymentTerm(raw.paymentTermDays, paymentMethod, date, raw.dueDate);
    var dueDate = resolveDueDate(date, paymentMethod, paymentTermDays, raw.dueDate, raw.paymentTermDays);

    if (!netAmount && grossAmount && vatAmount) {
      netAmount = Math.max(0, grossAmount - vatAmount);
    }

    if (!vatAmount && grossAmount && netAmount) {
      vatAmount = Math.max(0, grossAmount - netAmount);
    }

    if (!vatAmount && grossAmount && !netAmount) {
      vatAmount = Math.round(grossAmount * 27 / 127);
      netAmount = Math.max(0, grossAmount - vatAmount);
    }

    if (!vatAmount) {
      vatAmount = calculateVat(netAmount, grossAmount);
    }

    if (!grossAmount) {
      grossAmount = calculateGross(netAmount, vatAmount);
    }

    return {
      id: raw.id || "invoice-" + Date.now() + "-" + Math.round(Math.random() * 100000),
      date: date,
      partnerName: normalizePartnerName(raw.partnerName, partnerNames || []),
      invoiceNumber: String(raw.invoiceNumber || "").trim(),
      netAmount: netAmount,
      vatAmount: vatAmount,
      grossAmount: grossAmount,
      paymentMethod: paymentMethod,
      status: resolveInvoiceStatus(raw.status, paymentMethod),
      dueDate: dueDate,
      paidDate: resolvePaidDate(raw.paidDate, resolveInvoiceStatus(raw.status, paymentMethod), date),
      paymentTermDays: paymentTermDays,
      isSkonto: normalizeBoolean(raw.isSkonto),
      projectName: normalizeProjectName(raw.projectName, projectNames || []),
      category: categories.includes(raw.category) ? raw.category : normalizeCategory(raw.category),
      note: String(raw.note || "").trim(),
      sourceMonth: normalizeMonthLabel(raw.sourceMonth) || formatInvoiceMonth(date)
    };
  }

  function normalizeText(value) {
    return String(value || "")
      .toLocaleLowerCase("hu-HU")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function normalizeProjectName(value, projectNames) {
    var raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    return findCanonicalName(raw, projectNames) || raw;
  }

  function normalizePartnerName(value, partnerNames) {
    var raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    return findCanonicalName(raw, partnerNames) || raw;
  }

  function findCanonicalName(value, names) {
    var text = normalizeText(value);
    if (!text) {
      return "";
    }

    var exact = names.find(function (name) {
      return normalizeText(name) === text;
    });
    if (exact) {
      return exact;
    }

    if (text.length >= 3) {
      var prefixMatches = names.filter(function (name) {
        return normalizeText(name).indexOf(text) === 0;
      });
      if (prefixMatches.length === 1) {
        return prefixMatches[0];
      }
    }

    if (text.length >= 5) {
      var fuzzyMatches = names.filter(function (name) {
        return levenshteinDistance(normalizeText(name), text) <= 2;
      });
      if (fuzzyMatches.length === 1) {
        return fuzzyMatches[0];
      }
    }

    return "";
  }

  function levenshteinDistance(left, right) {
    var previous = [];
    var current = [];
    var i;
    var j;

    for (i = 0; i <= right.length; i += 1) {
      previous[i] = i;
    }

    for (i = 1; i <= left.length; i += 1) {
      current[0] = i;
      for (j = 1; j <= right.length; j += 1) {
        current[j] = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
        );
      }
      previous = current.slice();
    }

    return previous[right.length];
  }

  function normalizePaymentMethod(value) {
    var text = normalizeText(value);
    if (text.includes("kart")) {
      return "Kártya";
    }

    if (text.includes("kesz") || text === "kp") {
      return "Készpénz";
    }

    if (text.includes("utanvet")) {
      return "Utánvét";
    }

    if (text.includes("csoportos")) {
      return "Csoportos beszedés";
    }

    if (text.includes("utal") || text.includes("atual") || text.includes("attual")) {
      return "Utalás";
    }

    return paymentMethods.includes(value) ? value : "Egyéb";
  }

  function isImmediatePaymentMethod(paymentMethod) {
    return paymentMethod === "Kártya" || paymentMethod === "Készpénz";
  }

  function normalizePaymentTerm(value, paymentMethod, dateValue, dueDateValue) {
    var method = normalizePaymentMethod(paymentMethod);
    if (isImmediatePaymentMethod(method)) {
      return 0;
    }

    var numeric = Number(value);
    if (paymentTerms.includes(numeric)) {
      return numeric;
    }

    var inferred = inferPaymentTermDays(dateValue, dueDateValue);
    if (paymentTerms.includes(inferred)) {
      return inferred;
    }

    return 8;
  }

  function normalizeDueDate(invoice) {
    var paymentMethod = normalizePaymentMethod(invoice.paymentMethod);
    var date = normalizeDate(invoice.date);
    var paymentTermDays = normalizePaymentTerm(invoice.paymentTermDays, paymentMethod, date, invoice.dueDate);
    if (!date && invoice.dueDate) {
      return normalizeDate(invoice.dueDate);
    }

    return resolveDueDate(date, paymentMethod, paymentTermDays, invoice.dueDate, invoice.paymentTermDays);
  }

  function normalizePaidDate(invoice) {
    if (invoice.paidDateAutoDisabled && !invoice.paidDate) {
      return "";
    }

    return resolvePaidDate(invoice.paidDate || invoice.paidAt || invoice.paymentDate || invoice.settledDate, invoice.status, invoice.dueDate || invoice.date);
  }

  function resolvePaidDate(value, status, fallbackDate) {
    var normalized = normalizeDate(value);
    if (!isPaidStatus(normalizeStatus(status))) {
      return "";
    }

    if (isIsoDate(normalized)) {
      return normalized;
    }

    normalized = normalizeDate(fallbackDate);
    return isIsoDate(normalized) ? normalized : todayIsoDate();
  }

  function resolveDueDate(date, paymentMethod, paymentTermDays, existingDueDate, rawPaymentTermDays) {
    if (!date) {
      return normalizeDate(existingDueDate);
    }

    if (!isImmediatePaymentMethod(normalizePaymentMethod(paymentMethod)) && rawPaymentTermDays == null && existingDueDate) {
      var inferred = inferPaymentTermDays(date, existingDueDate);
      if (!paymentTerms.includes(inferred)) {
        return normalizeDate(existingDueDate);
      }
    }

    return calculateDueDate(date, paymentMethod, paymentTermDays);
  }

  function calculateDueDate(dateValue, paymentMethod, paymentTermDays) {
    var date = normalizeDate(dateValue);
    if (!isIsoDate(date)) {
      return "";
    }

    var days = isImmediatePaymentMethod(normalizePaymentMethod(paymentMethod)) ? 0 : Number(paymentTermDays || 0);
    var parsed = new Date(date + "T00:00:00");
    parsed.setDate(parsed.getDate() + days);

    return formatIsoDate(parsed);
  }

  function inferPaymentTermDays(dateValue, dueDateValue) {
    var date = normalizeDate(dateValue);
    var dueDate = normalizeDate(dueDateValue);
    if (!isIsoDate(date) || !isIsoDate(dueDate)) {
      return 8;
    }

    var start = new Date(date + "T00:00:00");
    var end = new Date(dueDate + "T00:00:00");
    return Math.round((end - start) / 86400000);
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function formatIsoDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "";
    }

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function todayIsoDate() {
    return formatIsoDate(new Date());
  }

  function normalizeBoolean(value) {
    var text = normalizeText(value);
    return value === true || text === "true" || text === "igen" || text === "yes" || text === "1" || text.includes("skonto");
  }

  function normalizeStatus(value) {
    var text = normalizeText(value);
    if (text.includes("utalva")) {
      return "Utalva";
    }

    if (text.includes("kiegyenlit") || text.includes("befizet") || text.includes("fizetve") || text.includes("paid") || text === "kp") {
      return "Kiegyenlítve";
    }

    return "Fizetésre vár";
  }

  function resolveInvoiceStatus(rawStatus, paymentMethod) {
    var normalizedStatus = normalizeStatus(rawStatus);
    if (normalizedStatus !== "Fizetésre vár") {
      return normalizedStatus;
    }
    if (isAutoSettledPaymentMethod(paymentMethod)) {
      return "Kiegyenlítve";
    }
    return normalizedStatus;
  }

  function isPaidStatus(status) {
    return status === "Utalva" || status === "Kiegyenlítve";
  }

  function isPaidInvoice(invoice) {
    return isPaidStatus(invoice && invoice.status);
  }

  function isAutoSettledPaymentMethod(paymentMethod) {
    return normalizePaymentMethod(paymentMethod) === "Készpénz";
  }

  function syncImmediatePaymentStatus(form) {
    if (!form) {
      return;
    }
    var paymentMethodInput = form.querySelector('select[name="paymentMethod"]');
    var statusInput = form.querySelector('select[name="status"]');
    var paidDateInput = form.querySelector('input[name="paidDate"]');
    var dateInput = form.querySelector('input[name="date"]');
    if (!paymentMethodInput || !statusInput) {
      return;
    }

    if (isAutoSettledPaymentMethod(paymentMethodInput.value)) {
      statusInput.value = "Kiegyenlítve";
      if (paidDateInput && !paidDateInput.value) {
        paidDateInput.value = dateInput && dateInput.value ? dateInput.value : todayIsoDate();
      }
    }
  }

  function normalizeCategory(value) {
    var text = normalizeText(value);
    if (text.includes("alvallalkozo")) {
      return "Alvállalkozó";
    }

    if (text.includes("iroda")) {
      return "Iroda";
    }

    if (text.includes("rezsi")) {
      return "Rezsi";
    }

    if (text.includes("flotta")) {
      return "Flotta";
    }

    if (text.includes("ber")) {
      return "Bér";
    }

    if (text.includes("anyag")) {
      return "Anyag";
    }

    return "Egyéb";
  }

  function normalizeMonthLabel(value) {
    var text = normalizeText(value);
    var labels = {
      januar: "január",
      februar: "február",
      marius: "március",
      marcius: "március",
      aprilis: "április",
      majus: "május",
      junius: "június",
      julius: "július",
      augusztus: "augusztus",
      szeptember: "szeptember",
      oktober: "október",
      november: "november",
      december: "december"
    };

    return labels[text] || String(value || "").trim();
  }

  function normalizeDate(value) {
    var raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    raw = raw.replace(/(\d{4})[.\/-](\d{1,2})-\.(\d{1,2})/, "$1.$2.$3");

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    if (/^\d{5}(\.\d+)?$/.test(raw)) {
      var excelEpoch = new Date(Date.UTC(1899, 11, 30));
      excelEpoch.setUTCDate(excelEpoch.getUTCDate() + Math.floor(Number(raw)));
      return excelEpoch.toISOString().slice(0, 10);
    }

    var match = raw.match(/^(\d{4})[.\/-]\s?(\d{1,2})[.\/-]\s?(\d{1,2})/);
    if (match) {
      return match[1] + "-" + String(match[2]).padStart(2, "0") + "-" + String(match[3]).padStart(2, "0");
    }

    var hungarian = raw.match(/^(\d{1,2})[.\/-]\s?(\d{1,2})[.\/-]\s?(\d{4})/);
    if (hungarian) {
      return hungarian[3] + "-" + String(hungarian[2]).padStart(2, "0") + "-" + String(hungarian[1]).padStart(2, "0");
    }

    return raw;
  }

  function dateLikeValue(value) {
    var text = String(value || "").trim();
    if (!text || statusLikeValue(text) || !isDateLikeInput(text)) {
      return "";
    }

    return normalizeDate(text);
  }

  function isDateLikeInput(value) {
    var text = String(value || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ||
      /^\d{5}(\.\d+)?$/.test(text) ||
      /^\d{4}[.\/-]\s?\d{1,2}[.\/-]\s?\d{1,2}/.test(text) ||
      /^\d{1,2}[.\/-]\s?\d{1,2}[.\/-]\s?\d{4}/.test(text);
  }

  function statusLikeValue(value) {
    var text = normalizeText(value);
    if (text.includes("utalva") || text.includes("kiegyenlit") || text.includes("befizet") || text.includes("fizetve") || text === "kp") {
      return value;
    }

    return "";
  }

  function statusNote(value) {
    var text = String(value || "").trim();
    if (!text || statusLikeValue(text) || dateLikeValue(text)) {
      return "";
    }

    return text;
  }

  function mergeNotes() {
    return Array.from(arguments)
      .map(function (note) {
        return String(note || "").trim();
      })
      .filter(Boolean)
      .join(" | ");
  }

  function isOverdue(invoice) {
    if (!invoice.dueDate || isPaidInvoice(invoice)) {
      return false;
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dueDate = new Date(invoice.dueDate + "T00:00:00");
    if (Number.isNaN(dueDate.getTime())) {
      return false;
    }

    return dueDate < today;
  }

  function daysUntilInvoiceDueDate(invoice) {
    if (!invoice || !invoice.dueDate) {
      return null;
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dueDate = new Date(invoice.dueDate + "T00:00:00");
    if (Number.isNaN(dueDate.getTime())) {
      return null;
    }

    return Math.ceil((dueDate - today) / 86400000);
  }

  function statCard(label, value, detail) {
    return '<article class="module-card"><h4>' + label + "</h4><strong>" + value + "</strong><p>" + detail + "</p></article>";
  }

  function field(label, control) {
    return '<div class="field"><label>' + label + "</label>" + control + "</div>";
  }

  function select(name, items, selected) {
    return (
      '<select name="' +
      name +
      '">' +
      items
        .map(function (item) {
          return '<option value="' + item + '" ' + (item === selected ? "selected" : "") + ">" + item + "</option>";
        })
        .join("") +
      "</select>"
    );
  }

  function paymentTermSelect(selected) {
    var selectedValue = String(selected == null ? 8 : selected);
    var options = [{ value: 0, label: "Aznapi" }].concat(paymentTerms.map(function (days) {
      return { value: days, label: days + " nap" };
    }));

    return (
      '<select name="paymentTermDays">' +
      options.map(function (item) {
        return '<option value="' + item.value + '" ' + (String(item.value) === selectedValue ? "selected" : "") + ">" + item.label + "</option>";
      }).join("") +
      "</select>"
    );
  }

  function filterSelect(id, name, items, selected, allLabel) {
    return (
      '<select id="' + id + '" name="' + name + '">' +
      items.map(function (item) {
        var label = item === "all" ? allLabel : item;
        return '<option value="' + item + '" ' + (item === selected ? "selected" : "") + ">" + label + "</option>";
      }).join("") +
      "</select>"
    );
  }

  function hAttr(value) {
    return window.HRPlatform.utils.escapeHtml(value);
  }

  function exportRows(context) {
    var invoices = getInvoices();
    ensureSelectedMonth(invoices);
    var visibleInvoices = getVisibleInvoices(context || {}, invoices);
    var exportScope = visibleInvoices.length === invoices.length
      ? "összes számla"
      : "látható/szűrt lista";

    return visibleInvoices.map(function (invoice) {
      var days = daysUntilInvoiceDueDate(invoice);
      return {
        export_scope: exportScope,
        datum: invoice.date,
        honap: getInvoiceMonth(invoice),
        partner_neve: invoice.partnerName,
        szamla_sorszama: invoice.invoiceNumber,
        osszeg_netto: invoice.netAmount,
        afatartalom: invoice.vatAmount,
        osszeg_brutto: invoice.grossAmount,
        fizetesi_mod: invoice.paymentMethod,
        allapot: invoice.status,
        statusz_csoport: isPaidInvoice(invoice) ? "kiegyenlített" : "nyitott",
        lejart: isOverdue(invoice) ? "igen" : "nem",
        utalas_datuma: invoice.paidDate,
        fizetesi_hatarido: invoice.dueDate,
        napok_hataridoig: days == null ? "" : days,
        fizetesi_hatarido_nap: invoice.paymentTermDays,
        skonto: invoice.isSkonto ? "igen" : "nem",
        projekt: invoice.projectName,
        kategoria: invoice.category,
        megjegyzes: invoice.note
      };
    });
  }

  window.HRPlatform.registerModule({
    id: "invoices",
    title: "Számlák",
    shortTitle: "Számlák",
    route: "#invoices",
    icon: "S",
    order: 40,
    permission: "invoices.manage",
    description: "Egyszerű számla nyilvántartás, státusz és Excel/CSV import.",
    stats: stats,
    render: render,
    afterRender: afterRender,
    exportRows: exportRows,
    isCompact: function () {
      return uiState.compactMode;
    }
  });
})();
