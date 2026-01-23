// js/helpers.logic.js

// ------------------------------------------------------------
// LOGIC HELPERS (Key‑Based Version)
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

//
// GENERIC HELPERS
//
window.Helpers.buildDropdown = function(options, selectedValue = "") {
  const select = document.createElement("select");
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === selectedValue) o.selected = true;
    select.appendChild(o);
  });
  return select;
};

window.Helpers.calculateAge = function(dobString) {
  if (!dobString) return "";

  // Parse as UTC to avoid timezone shifts
  const [year, month, day] = dobString.split("-").map(Number);
  const dob = new Date(Date.UTC(year, month - 1, day));

  const today = new Date();
  const tYear = today.getUTCFullYear();
  const tMonth = today.getUTCMonth();
  const tDay = today.getUTCDate();

  let age = tYear - year;

  if (tMonth < (month - 1) || (tMonth === (month - 1) && tDay < day)) {
    age--;
  }

  return age;
};

window.Helpers.normalizeUrl = function(url) {
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
};

window.Helpers.isValidUrl = function(url) {
  try { new URL(url); return true; }
  catch { return false; }
};

//
// CURRENCY HELPERS (KEY‑BASED)
//
window.Helpers.formatByCurrency = function(value, currencyKey) {
  const currency = portfolio.currencies.find(c => c.key === currencyKey);
  const decimals = currency ? currency.decimals : 2;
  return Number(value).toFixed(decimals);
};

window.Helpers.getCurrencyCodeByKey = function(key) {
  const c = portfolio.currencies.find(c => c.key === key);
  return c ? c.code : "";
};

window.Helpers.getCurrencySymbolByKey = function(key) {
  const c = portfolio.currencies.find(c => c.key === key);
  return c ? c.symbol : "";
};

//
// ACCOUNT HELPERS (KEY‑BASED)
//
window.Helpers.getAccountNameByKey = function(key) {
  const acc = portfolio.accounts.find(a => a.key === key);
  return acc ? acc.name : "";
};

//
// ASSET HELPERS (KEY‑BASED)
//
window.Helpers.getAssetCodeByKey = function(key) {
  const h = portfolio.assets.find(h => h.key === key);
  return h ? h.code : "";
};

window.Helpers.getAssetsForAccountCurrency = function(accountKey) {
  const acc = portfolio.accounts.find(a => a.key === accountKey);
  return acc ? portfolio.assets.filter(h => h.currency === acc.currency) : [];
};

//
// INSTITUTION HELPERS (KEY‑BASED)
//
window.Helpers.getInstitutionNameByKey = function(key) {
  const inst = portfolio.institutions.find(i => i.key === key);
  return inst ? inst.name : "";
};

//
// PERSON HELPERS (KEY‑BASED)
//
window.Helpers.getPersonNameByKey = function(key) {
  const p = portfolio.persons.find(p => p.key === key);
  return p ? p.name : "";
};

//
// TRANSACTION HELPERS (KEY‑BASED)
//
window.Helpers.validateTransactionCurrency = function(accountKey, assetKey) {
  const acc = portfolio.accounts.find(a => a.key === accountKey);
  const h = portfolio.assets.find(h => h.key === assetKey);
  return acc && h && acc.currency === h.currency;
};

window.Helpers.computeAmount = function(price, units, currencyKey) {
  const safePrice = price === "" || price == null ? 0 : price;
  const safeUnits = units === "" || units == null ? 0 : units;

  const dPrice = new Decimal(safePrice);
  const dUnits = new Decimal(safeUnits);

  const currency = portfolio.currencies.find(c => c.key === currencyKey);
  const decimals = currency ? currency.decimals : 2;

  return dPrice.mul(dUnits).toDecimalPlaces(decimals).toNumber();
};

//
// ETF RELATION CYCLE DETECTION (KEY‑BASED)
//
window.Helpers.doesRelationCreateCycle = function(parentKey, childKey, relations) {
  function dfs(currentKey) {
    if (currentKey === parentKey) return true;

    const children = relations
      .filter(r => r.parent === currentKey)
      .map(r => r.child);

    for (const next of children) {
      if (dfs(next)) return true;
    }

    return false;
  }

  return dfs(childKey);
};

// ------------------------------------------------------------
// Market price lookup (key‑based)
// ------------------------------------------------------------
window.Helpers.getEffectiveMarketPrice = function(assetKey) {
  const today = new Date().toISOString().slice(0, 10);

  const markets = portfolio.markets.filter(m => m.asset === assetKey);
  if (markets.length === 0) return null;

  const valid = markets.filter(m => m.date <= today);
  if (valid.length === 0) return null;

  valid.sort((a, b) => (a.date < b.date ? 1 : -1));
  return valid[0];
};