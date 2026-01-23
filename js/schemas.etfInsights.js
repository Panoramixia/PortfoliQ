// js/schemas.etfInsights.js

// ------------------------------------------------------------
// CRUD SCHEMA — ETF INSIGHTS
// ------------------------------------------------------------
Crud.Registry.register("etfInsights", {
  readOnly: true,
  label: "etfInsights",
  tableBodySelector: "#etfInsightsTableBody",

  // ------------------------------------------------------------
  // COLLECTION
  // ------------------------------------------------------------
  getCollection: () => Helpers.computeEtfInsightsRows(),

  // ------------------------------------------------------------
  // FILTERS (auto-rendered into #mainContent)
  // ------------------------------------------------------------
  filters: [
    {
      key: "currencies",
      label: "currencies",
      multiple: true,
      row: 1,
      options: () =>
        portfolio.currencies.map(c => ({
          label: `${c.symbol} (${c.code})`,
          value: c.key
        }))
    },
    {
      key: "parentEtf",
      label: "parent_etf",
      multiple: false,
      row: 1,
      options: () => {
        // all unique parent_etf keys from relations
        const parentKeys = Array.from(
          new Set(portfolio.etfRelations.map(r => r.parent_etf))
        );

        const parents = parentKeys
          .map(key => portfolio.etfs.find(e => e.key === key))
          .filter(Boolean);

        return [
          { label: "-- All ETFs --", value: "" },
          ...parents.map(e => ({
            label: e.code || e.name, // whichever you prefer
            value: e.key
          }))
        ];
      }
    },
    {
      key: "investment",
      label: "investment",
      type: "number",
      min: 0,
      step: 0.01, 
      row: 2
    },
    {
      key: "accountType",
      label: "accounttype",
      multiple: false, 
      row: 2,
      options: () =>
        portfolio.accountTypes.map(a => ({
          label: Helpers.getLocalized(a),
          value: a.key
        }))
    },
    {
      key: "marginalRate",
      label: "marginal_rate",
      type: "range",
      min: 0,
      max: 100,
      step: 1, 
      row: 2
    },
    {
      key: "years",
      label: "compound_years",
      type: "number",
      min: 1,
      max: 100,
      step: 1, 
      row: 2
    }
  ],

  // ------------------------------------------------------------
  // TABLE FIELDS
  // ------------------------------------------------------------
  fields: [
    {
      key: "symbol", 
      label: "code", 
      sortable: false
    },
    {
      key: "name", 
      label: "name", 
      sortable: false 
    },
    {
      key: "currency",
      label: "currency",
      sortable: false,
      display: row => {
        const c = portfolio.currencies.find(x => x.key === row.currency);
        return c ? `${c.symbol} (${c.code})` : "";
      }
    },

    {
      key: "region",
      label: "region",
      sortable: false,
      display: e => {
        const r = portfolio.assetRegions.find(x => x.key === e.region);
        return r ? Helpers.getLocalized(r) : "";
      }
    },

    {
      key: "mer",
      label: "mer",
      sortable: false,
      display: row => `${(row.mer * 100).toFixed(2)}%`
    },

    {
      key: "investment",
      label: "investment",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.investment, row.currency)
    },

    {
      key: "yield",
      label: "yield",
      sortable: false,
      display: row => `${(row.yield * 100).toFixed(3)}%`
    },

    {
      key: "tax_drag",
      label: "tax_drag",
      sortable: false,
      display: row => `${(row.tax_drag * 100).toFixed(3)}%`
    },

    {
      key: "tax_drag_amount",
      label: "tax_drag_amount",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.tax_drag_amount, row.currency)
    },

    {
      key: "after_tax_yield",
      label: "after_tax_yield",
      sortable: false,
      display: row => `${(row.after_tax_yield * 100).toFixed(3)}%`
    },

    {
      key: "after_tax_income",
      label: "after_tax_income",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.after_tax_income, row.currency)
    },

    {
      key: "after_tax_growth",
      label: "after_tax_growth",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.after_tax_growth, row.currency)
    }
  ],

  // ------------------------------------------------------------
  // CHARTS (CRUD auto-injects canvases)
  // ------------------------------------------------------------
  charts: [
    { id: "etfTaxDragChartCanvas", container: "etfTaxDragChart", position: "after-table" },
    { id: "etfAfterTaxYieldChartCanvas", container: "etfAfterTaxYieldChart", position: "after-table" }
  ],

  // ------------------------------------------------------------
  // ON RENDERED (same pattern as Snapshot)
  // ------------------------------------------------------------
  onRendered: (tbody, schema) => {
    if (tbody.children.length === 0) return;

    const tableEl = tbody.parentElement;
    const moduleContainer = tableEl.parentElement;

    // CHART ROW WRAPPER
    let chartRows = document.getElementById("etfInsightsChartRows");
    if (!chartRows) {
      chartRows = document.createElement("div");
      chartRows.id = "etfInsightsChartRows";
      chartRows.style.display = "flex";
      chartRows.style.flexDirection = "column";
      chartRows.style.gap = "20px";
      chartRows.style.marginTop = "20px";
      moduleContainer.insertBefore(chartRows, tableEl.nextSibling);
    }

    // GROUP CHARTS IN PAIRS (like Snapshot)
    const chartPairs = [
      ["etfTaxDragChart", "etfAfterTaxYieldChart"]
    ];

    chartPairs.forEach(([leftId, rightId]) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "20px";

      const leftEl = document.getElementById(leftId);
      const rightEl = rightId ? document.getElementById(rightId) : null;

      if (leftEl) {
        leftEl.style.flex = "1";
        leftEl.style.maxWidth = "500px";
        leftEl.style.height = "400px";
        leftEl.classList.add("snapshot-chart-box");
        row.appendChild(leftEl);
      }

      if (rightEl) {
        rightEl.style.flex = "1";
        rightEl.style.maxWidth = "500px";
        rightEl.style.height = "400px";
        rightEl.classList.add("snapshot-chart-box");
        row.appendChild(rightEl);
      }

      chartRows.appendChild(row);
    });

    // RENDER CHARTS + SUMMARY
    Helpers.renderEtfInsightsChartsAndSummary();
  }
});
