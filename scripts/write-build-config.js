const fs = require("fs");
const path = require("path");

const mode = process.argv[2] === "demo" ? "demo" : "release";
const seedDemoData = mode === "demo";
const packageJson = require("../package.json");
const target = path.join(__dirname, "..", "src", "config", "app-config.js");

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
  target,
  [
    "(function () {",
    "  window.HRAdminConfig = {",
    "    version: " + JSON.stringify(packageJson.version) + ",",
    '    buildMode: "' + mode + '",',
    "    seedDemoData: " + seedDemoData,
    "  };",
    "})();",
    ""
  ].join("\n"),
  "utf8"
);

console.log("HR Admin build config: " + mode);
