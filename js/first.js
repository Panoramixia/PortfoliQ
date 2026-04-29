// js/first.js

// ------------------------------------------------------------
// GLOBAL CONFIG + PORTFOLIO (FIRST FILE)
// ------------------------------------------------------------

const VERSION = 0.01;
const LANG_DFLT = "en";
const STORAGE_KEY = "portfoliq";

// NON PERSISTENT MODULES = not exported in the json
window.nonPersistentModules = [ "snapshot", "etfInsights" ];

// STEP DEFINITIONS
window.stepModules = {
  step01: ["persons", "institutions", "accounts", "assets", "assetAllocations"],
  step02: ["transactions"],
  step03: ["markets"],
  step04: ["snapshot"],
  step05: ["rebalanceGoals"],
  step06: ["rebalanceDrifts", "rebalanceRules"],
  step07: ["etfs", "etfRelations"],
  step08: ["etfInsights"],
  step00: ["personTypes", "accountTypes", "transactionTypes", "countries", "currencies", "assetClasses", "assetRegions", "assetFwts", "websites", "tips", "translations"]
};

// Build a flat list of all modules from all steps
const ALL_MODULES = Object.values(stepModules)
  .flat()
  .filter(mod => !window.nonPersistentModules.includes(mod));
window.ALL_MODULES = ALL_MODULES;

// Build dynamic sort config
const dynamicSortConfig = Object.fromEntries(
  ALL_MODULES.map(mod => [mod, { column: null, asc: true }])
);

// Build dynamic empty portfolio
const dynamicPortfolio = Object.fromEntries(
  ALL_MODULES.map(mod => [mod, []])
);

// Global application configuration
window.config = {
  appName: STORAGE_KEY,
  version: VERSION,
  language: LANG_DFLT,
  currentStep: "",
  filters: {
    markets: {
      asset: "",
      year: ""
    },
    snapshot: {
      persons: [],
      accountTypes: [],
      classes: [],
      regions: []
    },
    rebalanceDrifts: {
      persons: []
    },
    etfInsights: {
      currencies: [],
      parentEtf: "",
      investment: 0,
      accountType: "",
      marginalRate: 0,
      years: 1
    }
  },
  sort: dynamicSortConfig
};

config.sort.snapshot = { column: null, asc: true };
config.sort.etfInsights = { column: null, asc: true };

// Global data model for Portfolio
window.portfolio = dynamicPortfolio;

// ------------------------------------------------------------
// STORAGE
// ------------------------------------------------------------

window.saveToStorage = function () {
  const data = { config, portfolio };

  portfolio.persons.forEach(p => {
    p.age = Helpers.calculateAge(p.dob);
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

window.loadFromStorage = function () {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    if (data.config) Object.assign(config, data.config);
    if (data.portfolio) Object.assign(portfolio, data.portfolio);

    portfolio.persons.forEach(p => {
      p.age = Helpers.calculateAge(p.dob);
    });

    portfolio.currencies.forEach(c => {
      c.decimals = parseInt(c.decimals, 10);
    });

  } catch (err) {
    console.error("Failed to load storage:", err);
  }
};

// ------------------------------------------------------------
// EXPORT
// ------------------------------------------------------------

window.getExportDate = function () {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

window.exportAll = function () {
  const data = { config, portfolio };

  data.portfolio.persons.forEach(p => {
    p.age = Helpers.calculateAge(p.dob);
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${STORAGE_KEY}.${getExportDate()}.json`;
  a.click();
};

// ------------------------------------------------------------
// IMPORT
// ------------------------------------------------------------

window.importAll = function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      let text = reader.result;
      text = text.replace(/^[\uFEFF\u200B\u200C\u200D\u2060\r\n\t ]+/, "");
      const data = JSON.parse(text);

      if (data && data.config && data.portfolio) {
        Object.assign(config, data.config);
        Object.assign(portfolio, data.portfolio);

        portfolio.persons.forEach(p => {
          p.age = Helpers.calculateAge(p.dob);
        });

        saveToStorage();
        render();

        alert(t("import_success"));

        // IMPORTANT: allow importing the same file again 
        e.target.value = "";
        return;
      }

      alert(t("import_error"));
    } catch (err) {
      alert(t("import_error"));
    }
  };

  reader.readAsText(file);
};

// ------------------------------------------------------------
// CLEAR ALL
// ------------------------------------------------------------

window.clearAll = function () {
  if (!confirm(t("confirm_clear"))) return;

  // --- 1. Remove ALL saved keys ---
  localStorage.clear();

  // --- 2. Build dynamic list of REAL modules ---
  const allModules = Object.values(stepModules)
    .flat()
    .filter(mod => !window.nonPersistentModules.includes(mod));

  // --- 3. Build dynamic sort config ---
  const sortConfig = Object.fromEntries(
    allModules.map(mod => [mod, { column: null, asc: true }])
  );

  // --- 4. Rebuild config dynamically ---
  window.config = {
    appName: STORAGE_KEY,
    version: VERSION,
    language: LANG_DFLT,
    currentStep: "",
    filters: {
      markets: {
        asset: "",
        year: ""
      },
      snapshot: {
        persons: [],
        accountTypes: [],
        classes: [],
        regions: []
      },
      rebalanceDrifts: {
        persons: []
      },
      etfInsights: {
        currencies: [],
        parentEtf: "",
        investment: 0,
        accountType: "",
        marginalRate: 0,
        years: 1
      }
    },
    sort: sortConfig
  };

  config.sort.snapshot = { column: null, asc: true };
  config.sort.etfInsights = { column: null, asc: true };

  // --- 5. Rebuild portfolio dynamically ---
  window.portfolio = Object.fromEntries(
    allModules.map(mod => [mod, []])
  );

  // --- 6. Save + re-render ---
  saveToStorage();
  render();
};