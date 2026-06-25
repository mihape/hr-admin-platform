(function () {
  function toCsv(rows) {
    if (!rows || rows.length === 0) {
      return "";
    }

    var columns = Object.keys(rows[0]);
    var lines = [columns.join(";")];

    rows.forEach(function (row) {
      lines.push(
        columns
          .map(function (column) {
            var value = row[column] == null ? "" : String(row[column]);
            return '"' + value.replace(/"/g, '""') + '"';
          })
          .join(";")
      );
    });

    return lines.join("\n");
  }

  function download(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCsv(filename, rows) {
    download(filename, toCsv(rows), "text/csv;charset=utf-8");
  }

  function exportJson(filename, payload) {
    download(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  }

  function printCurrentView() {
    window.print();
  }

  function exportModule(moduleDefinition, context) {
    if (moduleDefinition && typeof moduleDefinition.exportRows === "function") {
      exportCsv(moduleDefinition.id + "-export.csv", moduleDefinition.exportRows(context));
      return;
    }

    exportJson("module-manifest.json", window.HRPlatform.getManifest());
  }

  window.HRPlatform.exportPrintAdapter = {
    exportCsv: exportCsv,
    exportJson: exportJson,
    exportModule: exportModule,
    printCurrentView: printCurrentView
  };
})();
