// js/last.js

// ------------------------------------------------------------
// GLOBAL RENDER FUNCTION (STEP‑AWARE)
// ------------------------------------------------------------

function render() {
  const step = config.currentStep || "step99";

  // Highlight the active step button
  Helpers.DOM.all(".step-btn").forEach(btn => {
    if (btn.dataset.step === step) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // If step99 → show everything
  if (step === "step99") {
    // Render all modules
    Object.keys(stepModules).forEach(key => {
      stepModules[key].forEach(mod => {
        const fnName = "render_" + mod;
        const fn = window[fnName];
        if (typeof fn === "function") fn();

        const el = Helpers.DOM.one("#" + mod);
        if (el) {
          el.classList.remove("hidden");

          // Ensure tbody is visible
          const tb = el.querySelector("tbody");
          if (tb) {
            tb.classList.remove("hidden");
            tb.style.display = ""; // extra safety
          }
        }
      });
    });

    applyTranslations();
    return;
  }

  // Normal step behavior
  const modules = stepModules[step] || [];

  // Hide all sections
  Helpers.DOM.all(".section").forEach(sec => sec.classList.add("hidden"));

  // Render only modules for this step
  modules.forEach(mod => {
    const fnName = "render_" + mod;
    const fn = window[fnName];
    if (typeof fn === "function") fn();

    const el = Helpers.DOM.one("#" + mod);
    if (el) el.classList.remove("hidden");
  });

  applyTranslations();
}

// ------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------

function init() {
  loadFromStorage();

  // Restore saved language
  const savedLang = localStorage.getItem("language") || "en";
  setLanguage(savedLang);

  // --- LANGUAGE SWITCHER ---
  Helpers.DOM.all(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      render();
    });
  });

  // --- BUTTON LISTENERS ---
  Helpers.DOM.listen("#exportBtn", "click", exportAll);
  Helpers.DOM.listen("#clearBtn", "click", clearAll);
  Helpers.DOM.listen("#importBtn", "click", () => {
    Helpers.DOM.one("#importFile").click();
  });
  Helpers.DOM.listen("#importFile", "change", importAll);

  // --- STEP NAVIGATION ---
  Helpers.DOM.delegate("#stepNavigation", "click", ".step-btn", (e) => {
    const btn = e.target.closest(".step-btn");
    const step = btn.dataset.step;

    config.currentStep = step;
    saveToStorage();
    render();
  });

  // --- UNIVERSAL CRUD DISPATCHER ---
  Helpers.DOM.delegate("body", "click", "button[data-action]", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const module = btn.dataset.module;
    const key = btn.dataset.key || null;

    if (!module || !action) return;

    const Core = Crud.Core;

    if (action === "add") {
      Core.addEntity(module);
    } else if (action === "edit") {
      Core.editEntity(module, key);
    } else if (action === "save") {
      Core.saveEntity(module, key);
    } else if (action === "cancel") {
      Core.renderModule(module);
    } else if (action === "delete") {
      Core.deleteEntity(module, key, "delete_confirm_item");
    }
  });

  // --- INITIAL RENDER ---
  render();
}

window.addEventListener("DOMContentLoaded", init);
