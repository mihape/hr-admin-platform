(function () {
  var holidays = {
    "01-01": "Újév",
    "03-15": "Nemzeti ünnep",
    "05-01": "Munka ünnepe",
    "08-20": "Államalapítás",
    "10-23": "1956-os forradalom",
    "11-01": "Mindenszentek",
    "12-25": "Karácsony",
    "12-26": "Karácsony",
    "2026-04-03": "Nagypéntek",
    "2026-04-06": "Húsvéthétfő",
    "2026-05-25": "Pünkösdhétfő"
  };
  var dayNames = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
  var editingEmployeeId = "";

  function getEmployees() {
    return window.HRPlatform.employeeAdapter.getEmployees();
  }

  function getCurrentWeekValue() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 1);
    var week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
    return now.getFullYear() + "-W" + String(week).padStart(2, "0");
  }

  function getDateOfISOWeek(week, year) {
    var simple = new Date(year, 0, 1 + (week - 1) * 7);
    var dow = simple.getDay();
    var start = simple;
    if (dow <= 4) {
      start.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      start.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return start;
  }

  function formatShortDate(date) {
    return String(date.getMonth() + 1).padStart(2, "0") + "." + String(date.getDate()).padStart(2, "0") + ".";
  }

  function checkHoliday(date) {
    var fullDate =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    return holidays[fullDate] || holidays[fullDate.substring(5)] || null;
  }

  function stats() {
    return [
      { label: "Munkatársak", value: getEmployees().length, detail: "Aktív munkatársi lista" },
      { label: "Heti napok", value: 6, detail: "Hétfő - szombat" },
      { label: "Export", value: "A4", detail: "Nyomtatásra optimalizálva" }
    ];
  }

  function render(context) {
    var h = window.HRPlatform.utils.escapeHtml;
    var employees = getEmployees().filter(function (employee) {
      return window.HRPlatform.utils.matchesSearch(employee, context.searchTerm);
    });
    var editingEmployee = editingEmployeeId ? window.HRPlatform.employeeAdapter.findById(editingEmployeeId) : null;
    var options = employees
      .map(function (employee) {
        return '<option value="' + h(employee.id) + '">' + h(employee.name) + "</option>";
      })
      .join("");

    return [
      '<div class="module-layout" data-module-root="attendance">',
      '  <div class="module-header">',
      "    <div>",
      '      <p class="module-kicker">Munkaidő / jelenlét</p>',
      "      <h3>Jelenléti ív modul</h3>",
      "      <p>Heti jelenléti ív készítés, munkatárs választással és A4 nyomtatással.</p>",
      "    </div>",
      '    <div class="module-actions">',
      '      <button class="secondary-button" type="button" id="attendancePrintCurrent">Jelenlegi nyomtatása</button>',
      '      <button class="secondary-button" type="button" id="attendancePrintAll">Összes aktív nyomtatása</button>',
      '      <button class="primary-button" type="button" data-export="attendance">CSV export</button>',
      "    </div>",
      "  </div>",
      '  <div class="module-grid">',
      statCard("Munkatársak", getEmployees().length, "Munkatársi lista alapján"),
      statCard("Aktuális hét", getCurrentWeekValue(), "ISO hét alapján"),
      statCard("Kimenet", "A4", "Nyomtatás / PDF mentés"),
      "  </div>",
      renderEmployeeForm(editingEmployee),
      '  <div class="form-panel">',
      field("Hét", '<input id="attendanceWeek" type="week" value="' + getCurrentWeekValue() + '" />'),
      field("Előzetes munkatárs", '<select id="attendanceEmployee">' + options + "</select>"),
      '<div class="form-actions"><button class="secondary-button" type="button" id="attendanceRefresh">Előzetes frissítése</button></div>',
      "  </div>",
      '  <div class="attendance-preview" id="attendancePreview"></div>',
      '  <div class="table-wrap">',
      "    <table>",
      "      <thead><tr><th>Név</th><th>Beosztás</th><th>Projekt</th><th>Állapot</th><th>Művelet</th></tr></thead>",
      "      <tbody>",
      employees
        .map(function (employee) {
          var status = normalizeEmployeeStatus(employee.status || "Aktív");
          return [
            "<tr>",
            "<td><strong>" + h(employee.name) + "</strong></td>",
            "<td>" + h(employee.role || "-") + "</td>",
            "<td>" + h(employee.project || "-") + "</td>",
            '<td><span class="pill ' + (status === "Aktív" ? "success" : "warning") + '">' + h(status) + "</span></td>",
            '<td><div class="row-actions"><button class="quiet-button" type="button" data-edit-employee="' + h(employee.id) + '">Szerkesztés</button><button class="quiet-button danger" type="button" data-delete-employee="' + h(employee.id) + '">Törlés</button></div></td>',
            "</tr>"
          ].join("");
        })
        .join("") || '<tr><td colspan="5">Nincs munkatárs.</td></tr>',
      "      </tbody>",
      "    </table>",
      "  </div>",
      "</div>"
    ].join("");
  }

  function renderEmployeeForm(employee) {
    var h = window.HRPlatform.utils.escapeHtml;
    var isEditing = Boolean(employee);
    var status = normalizeEmployeeStatus(employee && employee.status ? employee.status : "Aktív");
    return [
      '<form class="form-panel" id="employeeForm">',
      '<div class="form-heading"><strong>' + (isEditing ? "Munkatárs szerkesztése" : "Új munkatárs") + '</strong><span>' + (isEditing ? "A módosítás a helyi munkatárslistát frissíti." : "Helyi munkatárs felvétele a jelenléti ívekhez.") + '</span></div>',
      '<input name="id" type="hidden" value="' + h(employee ? employee.id : "") + '" />',
      field("Név", '<input name="name" required placeholder="Kovács Anna" value="' + h(employee ? employee.name : "") + '" />'),
      field("Beosztás", '<input name="role" placeholder="Építésvezető" value="' + h(employee ? employee.role || "" : "") + '" />'),
      field("Projekt", '<input name="project" placeholder="Központ" value="' + h(employee ? employee.project || "" : "") + '" />'),
      field("Állapot", '<select name="status"><option' + (status === "Aktív" ? " selected" : "") + '>Aktív</option><option' + (status === "Inaktív" ? " selected" : "") + '>Inaktív</option></select>'),
      '<div class="form-actions"><button class="primary-button" type="submit">' + (isEditing ? "Módosítás mentése" : "Munkatárs hozzáadása") + '</button>' + (isEditing ? '<button class="secondary-button" type="button" id="employeeCancelEdit">Mégse</button>' : "") + '</div>',
      "  </form>"
    ].join("");
  }

  function afterRender(root) {
    var form = root.querySelector("#employeeForm");
    var weekInput = root.querySelector("#attendanceWeek");
    var employeeSelect = root.querySelector("#attendanceEmployee");
    var preview = root.querySelector("#attendancePreview");

    function refreshPreview() {
      var employee = window.HRPlatform.employeeAdapter.findById(employeeSelect.value) || getEmployees()[0];
      preview.innerHTML = generateSheet(employee ? employee.name : "", weekInput.value || getCurrentWeekValue());
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = Object.fromEntries(new FormData(form).entries());
        var employee = {
          name: String(data.name || "").trim(),
          role: String(data.role || "").trim(),
          project: String(data.project || "").trim(),
          status: normalizeEmployeeStatus(data.status || "Aktív")
        };
        if (editingEmployeeId) {
          window.HRPlatform.employeeAdapter.updateEmployee(editingEmployeeId, employee);
          editingEmployeeId = "";
        } else {
          window.HRPlatform.employeeAdapter.addEmployee(employee);
        }
        form.reset();
        window.HRPlatform.notify();
      });
    }

    var cancelEdit = root.querySelector("#employeeCancelEdit");
    if (cancelEdit) {
      cancelEdit.addEventListener("click", function () {
        editingEmployeeId = "";
        window.HRPlatform.notify();
      });
    }

    root.querySelectorAll("[data-edit-employee]").forEach(function (button) {
      button.addEventListener("click", function () {
        editingEmployeeId = button.getAttribute("data-edit-employee");
        window.HRPlatform.notify();
      });
    });

    root.querySelectorAll("[data-delete-employee]").forEach(function (button) {
      button.addEventListener("click", function () {
        var employeeId = button.getAttribute("data-delete-employee");
        if (!confirm("Biztosan törlöd ezt a munkatársat a helyi listából?")) {
          return;
        }
        if (editingEmployeeId === employeeId) {
          editingEmployeeId = "";
        }
        window.HRPlatform.employeeAdapter.deleteEmployee(employeeId);
        window.HRPlatform.notify();
      });
    });

    root.querySelector("#attendanceRefresh").addEventListener("click", refreshPreview);
    root.querySelector("#attendancePrintCurrent").addEventListener("click", function () {
      printCurrentSheet(root);
    });
    root.querySelector("#attendancePrintAll").addEventListener("click", function () {
      printAllActiveSheets(root);
    });
    weekInput.addEventListener("change", refreshPreview);
    employeeSelect.addEventListener("change", refreshPreview);
    refreshPreview();
  }

  function generateSheet(employeeName, weekValue) {
    var h = window.HRPlatform.utils.escapeHtml;
    var year = Number(weekValue.substring(0, 4));
    var week = Number(weekValue.substring(6, 8));
    var monday = getDateOfISOWeek(week, year);
    var days = "";

    for (var i = 0; i < 6; i += 1) {
      var day = new Date(monday);
      day.setDate(monday.getDate() + i);
      var holiday = checkHoliday(day);
      var rowCount = i === 5 ? 2 : 4;
      var rows = "";

      for (var row = 0; row < rowCount; row += 1) {
        rows += [
          "<tr>",
          '<td class="attendance-row-number">' + (row + 1) + "</td>",
          '<td class="attendance-project-cell"><input /></td>',
          '<td class="attendance-time-cell"><input /></td>',
          '<td class="attendance-time-cell"><input /></td>',
          "</tr>"
        ].join("");
      }

      days += [
        '<section class="attendance-day ' + (holiday ? "holiday" : "") + '">',
        '<header><strong>' + dayNames[day.getDay()].toLocaleUpperCase("hu-HU") + "</strong><span>Dátum: " + formatShortDate(day) + (holiday ? " (" + holiday + ")" : "") + "</span></header>",
        '<div class="attendance-day-times">',
        '<label>Kezdés<input /></label>',
        '<label>Telephelyre érkezés<input /></label>',
        '<label>Telephelyről indulás<input /></label>',
        '<label>Munka vége<input /></label>',
        "</div>",
        '<table><thead><tr><th class="attendance-row-number">#</th><th class="attendance-project-cell">Projekt</th><th class="attendance-time-cell">Kezdés</th><th class="attendance-time-cell">Vége</th></tr></thead><tbody>' + rows + "</tbody></table>",
        "</section>"
      ].join("");
    }

    return [
      '<article class="a4-sheet">',
      '<header class="attendance-sheet-header">',
      '<div class="attendance-sheet-person"><strong>Név:</strong><span>' + h(employeeName || "Üres lap") + "</span></div>",
      '<div class="attendance-sheet-period"><strong>Időszak:</strong><span>' + h(year + ". " + week + ". hét") + "</span></div>",
      "</header>",
      days,
      "</article>"
    ].join("");
  }

  function printCurrentSheet(root) {
    var weekInput = root.querySelector("#attendanceWeek");
    var employeeSelect = root.querySelector("#attendanceEmployee");
    var preview = root.querySelector("#attendancePreview");
    var employee = window.HRPlatform.employeeAdapter.findById(employeeSelect.value) || getActiveEmployees()[0] || getEmployees()[0];
    preview.innerHTML = generateSheet(employee ? employee.name : "", weekInput.value || getCurrentWeekValue());
    printAttendancePreview(function () {
      preview.innerHTML = generateSheet(employee ? employee.name : "", weekInput.value || getCurrentWeekValue());
    });
  }

  function printAllActiveSheets(root) {
    var weekInput = root.querySelector("#attendanceWeek");
    var employeeSelect = root.querySelector("#attendanceEmployee");
    var preview = root.querySelector("#attendancePreview");
    var previousEmployee = window.HRPlatform.employeeAdapter.findById(employeeSelect.value) || getActiveEmployees()[0] || getEmployees()[0];
    var employees = getActiveEmployees();
    if (employees.length === 0) {
      employees = getEmployees();
    }

    preview.innerHTML = employees
      .map(function (employee) {
        return generateSheet(employee.name, weekInput.value || getCurrentWeekValue());
      })
      .join("");

    printAttendancePreview(function () {
      preview.innerHTML = generateSheet(previousEmployee ? previousEmployee.name : "", weekInput.value || getCurrentWeekValue());
    });
  }

  function printAttendancePreview(afterPrint) {
    document.body.classList.add("attendance-printing");
    var cleanup = function () {
      document.body.classList.remove("attendance-printing");
      window.removeEventListener("afterprint", cleanup);
      if (typeof afterPrint === "function") {
        afterPrint();
      }
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(function () {
      window.print();
      setTimeout(cleanup, 500);
    }, 100);
  }

  function getActiveEmployees() {
    return getEmployees().filter(function (employee) {
      return normalizeEmployeeStatus(employee.status || "Aktív") === "Aktív";
    });
  }

  function normalizeEmployeeStatus(status) {
    var text = String(status || "")
      .toLocaleLowerCase("hu-HU")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return text.includes("inaktiv") ? "Inaktív" : "Aktív";
  }

  function print(root) {
    printCurrentSheet(root);
  }

  function statCard(label, value, detail) {
    return '<article class="module-card"><h4>' + label + "</h4><strong>" + value + "</strong><p>" + detail + "</p></article>";
  }

  function field(label, control) {
    return '<div class="field"><label>' + label + "</label>" + control + "</div>";
  }

  function exportRows() {
    return getEmployees().map(function (employee) {
      return {
        nev: employee.name,
        beosztas: employee.role || "",
        projekt: employee.project || "",
        allapot: normalizeEmployeeStatus(employee.status || "Aktív"),
        forras: window.HRPlatform.employeeAdapter.source
      };
    });
  }

  window.HRPlatform.registerModule({
    id: "attendance",
    title: "Jelenléti ív",
    shortTitle: "Jelenlét",
    route: "#attendance",
    icon: "J",
    order: 30,
    permission: "attendance.manage",
    description: "Heti jelenléti ívek és nyomtatás.",
    stats: stats,
    render: render,
    afterRender: afterRender,
    exportRows: exportRows,
    print: print
  });
})();
