// js/schemas.markets.js

let marketChart = null;

Crud.Registry.register("markets", {
  tableBodySelector: "#marketsTableBody",
  entityName: "market",
  primaryKey: "key",

  // ------------------------------------------------------------
  // SCHEMA-DRIVEN FILTERS
  // ------------------------------------------------------------
  filters: [
    {
      key: "asset",
      label: "asset",
      multiple: false, 
      row: 1,
      options: () =>
        [{ value: "", label: t("all_assets") }]
        .concat(portfolio.assets.map(a => ({
          value: a.key,
          label: a.code
        })))
    },

    {
      key: "year",
      label: "year",
      multiple: false, 
      row: 1,
      options: () => {
        const years = [...new Set(portfolio.markets.map(m => m.date.slice(0,4)))]
          .sort()
          .reverse();
        return [{ value: "", label: t("all_years") }]
          .concat(years.map(y => ({ value: y, label: y })));
      }
    }
  ],

  // ------------------------------------------------------------ 
  // SCHEMA-DRIVEN CHARTS
  // ------------------------------------------------------------
  charts: [ 
    { 
      id: "marketChart", 
      container: "marketChartContainer", 
      position: "before-table"  
    } 
  ],

  // ------------------------------------------------------------
  // RAW COLLECTION
  // ------------------------------------------------------------
  getCollection: () => portfolio.markets,

  // ------------------------------------------------------------
  // FILTER LOGIC (auto-applied)
  // ------------------------------------------------------------
  filter(row) {
    const asset = config.filters.markets.asset;
    const year  = config.filters.markets.year;

    if (asset && row.asset !== asset) return false;
    if (year && !row.date.startsWith(year)) return false;

    return true;
  },

  // Composite key: asset ^ date
  makeKey(values) {
    const asset = values.asset || "";
    const date = values.date?.trim() || "";

    return `${asset}^${date}`;
  },
  
  // ------------------------------------------------------------
  // FIELDS
  // ------------------------------------------------------------
  fields: [
    {
      key: "date",
      type: "date",
      classBase: "date",
      showKey: true,
      required: true,
      display: m => m.date
    },

    {
      key: "asset",
      type: "dropdown",
      classBase: "asset",
      showKey: true,
      required: true,
      options: () =>
        portfolio.assets.map(h => ({
          value: h.key,
          label: h.code
        })),
      display: m => {
        const h = portfolio.assets.find(h => h.key === m.asset);
        return h ? h.code : "";
      }
    },

    {
      key: "price",
      type: "number",
      classBase: "price",
      showKey: true,
      required: true,
      min: 0,
      step: "0.00000001",
      display: m => m.price
    },


    {
      key: "currency",
      type: "custom",
      classBase: "currency",
      display: (m, mode) => {
        if (mode === "new") {
          return Helpers.DOM.create("span", { class: "new-currency" }, [""]);
        }
        const asset = portfolio.assets.find(h => h.key === m.asset);
        const currency = asset
          ? portfolio.currencies.find(c => c.key === asset.currency)
          : null;

        const text = currency ? `${currency.symbol} (${currency.code})` : "";

        const cls = mode === "edit" ? "edit-currency" : "currency";

        return Helpers.DOM.create("span", { class: cls }, [text]);
      }
    }
  ],

  // ------------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------------
  validate(values) {
    if (!values.date || !values.asset) return false;

    const price = parseFloat(values.price);
    if (isNaN(price)) return false;


    if (price.isNegative()) return false;

    return true;
  },

  // ------------------------------------------------------------
  // TRANSFORM
  // ------------------------------------------------------------
  transform(values) {
    // Only assign key if it's a NEW transaction
    if (!values.key) {
      values.key = this.makeKey(values);
    }

    values.price = parseFloat(values.price);

    return values;
  },

  // ------------------------------------------------------------
  // RENDER HOOK
  // ------------------------------------------------------------
  onRendered(tbody, schema) {
    wireMarketRows(tbody);
    renderMarketChart();
  }
});

// ------------------------------------------------------------
// ROW WIRING
// ------------------------------------------------------------
function wireMarketRows(tbody) {
  tbody.querySelectorAll("tr[data-key], tr.new-row").forEach(tr => {
    const assetInput = tr.querySelector(".edit-asset, .new-asset");
    const currencyCell = tr.querySelector(".edit-currency, .new-currency");

    if (!assetInput || !currencyCell) return;

    assetInput.addEventListener("change", () => {
      const asset = portfolio.assets.find(a => a.key === assetInput.value);
      const currency = asset
        ? portfolio.currencies.find(c => c.key === asset.currency)
        : null;

      currencyCell.textContent = currency
        ? `${currency.symbol} (${currency.code})`
        : "";
    });
  });
}

// ------------------------------------------------------------
// CHART
// ------------------------------------------------------------
function renderMarketChart() {
  const container = document.getElementById("marketChartContainer");
  const ctx = document.getElementById("marketChart");

  if (!ctx || !container) return;

  if (!config.filters.markets.asset) {
    container.style.display = "none";
    if (marketChart && typeof marketChart.destroy === "function") {
      marketChart.destroy();
      marketChart = null;
    }
    return;
  }

  const assetKey = config.filters.markets.asset;
  const assetCode = Helpers.getAssetCodeByKey(assetKey);

  container.style.display = "block";

  const schema = Crud.Registry.modules.markets;
  const rows = schema.getCollection().filter(r => schema.filter(r));

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

  const labels = sorted.map(r => r.date);
  const prices = sorted.map(r => Number(r.price));

  if (marketChart && typeof marketChart.destroy === "function") {
    marketChart.destroy();
  }

  marketChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: assetCode,
          data: prices,
          borderColor: "#4e79a7",
          backgroundColor: "rgba(78, 121, 167, 0.2)",
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: t("date") } },
        y: { title: { display: true, text: t("price") } }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${t("price")}: ${ctx.parsed.y}`
          }
        }
      }
    }
  });
}
