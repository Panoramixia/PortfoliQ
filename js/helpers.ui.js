// helpers.ui.js

// ------------------------------------------------------------
// UI HELPERS
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

window.Helpers.commit = function(saveToStorage, moduleKey) {
  saveToStorage();

  // Always require a moduleKey
  Crud.Core.renderModule(moduleKey);
};

window.Helpers.createRow = function(cells) {
  const tr = Helpers.DOM.create("tr");

  cells.forEach((cell) => {
    const td = Helpers.DOM.create("td");
    if (cell instanceof Node) td.appendChild(cell);
    else td.textContent = cell != null ? String(cell) : "";
    tr.appendChild(td);
  });

  return tr;
};

window.Helpers.actionButton = function(type, module, key = null) {
  const icons = {
    add: "➕",
    edit: "✏️",
    save: "💾",
    cancel: "✖️",
    delete: "❌"
  };

  const titles = {
    add: "add_tooltip",
    edit: "edit_tooltip",
    save: "save_tooltip",
    cancel: "cancel_tooltip",
    delete: "delete_tooltip"
  };

  const attrs = {
    "data-action": type,
    "data-module": module,
    "data-i18n-title": titles[type]
  };

  if (key !== null) {
    attrs["data-key"] = key;
  }

  return Helpers.DOM.create("button", attrs, [
    Helpers.DOM.create("span", { class: "icon" }, [icons[type]])
  ]);
};

window.Helpers.renderSection = function(list, tbodySelector, rowBuilder, applyTranslations) {
  const tbody = Helpers.DOM.one(tbodySelector);
  if (!tbody) return;

  tbody.innerHTML = "";
  list.forEach((item, index) => tbody.appendChild(rowBuilder(item, index)));
  applyTranslations();
};