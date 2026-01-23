// js/helpers.translations.js

// ------------------------------------------------------------
// TRANSLATION MODULE
// ------------------------------------------------------------

// Current language
window.currentLanguage = localStorage.getItem("language") || "en";

// Translation lookup
window.t = function (code) {
  const lang = window.currentLanguage;
  const key = code.toUpperCase();
  const entry = portfolio.translations.find(t => t.key === key);
  if (!entry) { 
    return `***${key}***`;
  } 
  return entry[lang] || entry.en || `***${key}***`;
};

// Apply translations to DOM
window.applyTranslations = function () {
  Helpers.DOM.all("[data-i18n]").forEach(el => {
    const code = el.getAttribute("data-i18n");
    el.textContent = t(code);
  });

  Helpers.DOM.all("[data-i18n-title]").forEach(el => {
    const code = el.getAttribute("data-i18n-title");
    el.title = t(code);
  });
};

// Change language
window.setLanguage = function (lang) {
  window.currentLanguage = lang;
  localStorage.setItem("language", lang);

  applyTranslations();

  Helpers.DOM.all(".lang-btn").forEach(btn => {
    btn.classList.toggle("active-lang", btn.dataset.lang === lang);
  });
};

Helpers.getLocalized = function (item) {
  if (!item) return "";
  return window.currentLanguage === "fr" ? item.fr : item.en;
};
