// helpers.table.js

// ------------------------------------------------------------
// TABLE + SORTING HELPERS
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

window.Helpers.sortList = function(list, column, asc) {
  return list.sort((a, b) => {
    let v1 = a[column];
    let v2 = b[column];

    if (column === "amount") {
      const v1 = a.price * a.units;
      const v2 = b.price * b.units;
      return asc ? v1 - v2 : v2 - v1;
    }

    if (typeof v1 === "number" && typeof v2 === "number") {
      return asc ? v1 - v2 : v2 - v1;
    }

    return asc
      ? String(v1).localeCompare(String(v2))
      : String(v2).localeCompare(String(v1));
  });
};

window.Helpers.enableSorting = function(key, tableSelector, renderFn) {
  if (!config.sort[key]) {
    config.sort[key] = { column: null, asc: true };
  }

  Helpers.DOM.delegate(tableSelector, "click", "th[data-sort]", (e) => {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;

    const column = th.dataset.sort;
    const state = config.sort[key];

    state.asc = state.column === column ? !state.asc : true;
    state.column = column;

    renderFn();

    Helpers.updateSortIndicators(tableSelector, column, state.asc);
  });
};

window.Helpers.updateSortIndicators = function(tableSelector, column, asc) {
  const table = document.querySelector(tableSelector);
  if (!table) return;

  const ths = table.querySelectorAll("th[data-sort]");
  ths.forEach(th => {
    const indicator = th.querySelector(".sort-indicator");
    if (!indicator) return;
    indicator.textContent = th.dataset.sort === column
      ? (asc ? " ▲" : " ▼")
      : "";
  });
};

function isEditingMarkets() {
  return !!document.querySelector("#marketsTableBody tr.edit-row, #marketsTableBody tr.new-row");
}

function updateActiveStepButton() {
  const current = config.currentStep || "step99";

  Helpers.DOM.all(".step-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.step === current);
  });
}
