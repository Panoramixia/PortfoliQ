// js/schemas.snapshot.js

Crud.Registry.register("snapshot", {
  readOnly: true,
  label: "Snapshot",
  tableBodySelector: "#snapshotTableBody",

  getCollection: () => Helpers.computeSnapshotRows(),

  filters: [
    {
      key: "persons",
      label: "persons",
      multiple: true, 
      row: 1,
      options: () => {
        const usedAccountKeys = new Set(portfolio.transactions.map(tx => tx.account));
        const usedPersonKeys = new Set(
          portfolio.accounts
            .filter(acc => usedAccountKeys.has(acc.key))
            .map(acc => acc.person)
        );
        return portfolio.persons
          .filter(p => usedPersonKeys.has(p.key))
          .map(p => ({ label: p.name, value: p.key }));
      }
    },
    {
      key: "accountTypes",
      label: "accounttypes",
      multiple: true, 
      row: 1,
      options: () => {
        const usedAccountKeys = new Set(portfolio.transactions.map(tx => tx.account));
        const usedTypeKeys = new Set(
          portfolio.accounts
            .filter(acc => usedAccountKeys.has(acc.key))
            .map(acc => acc.type)
        );
        return portfolio.accountTypes
          .filter(t => usedTypeKeys.has(t.key))
          .map(t => ({ label: Helpers.getLocalized(t), value: t.key }));
      }
    },
    {
      key: "classes",
      label: "assetclasses",
      multiple: true, 
      row: 1,
      options: () => {
        const usedAssetKeys = new Set(portfolio.transactions.map(tx => tx.asset));
        const usedAlloc = portfolio.assetAllocations.filter(a => usedAssetKeys.has(a.asset));
        const usedClassKeys = new Set(usedAlloc.map(a => a.class));
        return portfolio.assetClasses
          .filter(c => usedClassKeys.has(c.key))
          .map(c => ({ label: Helpers.getLocalized(c), value: c.key }));
      }
    },
    {
      key: "regions",
      label: "regions",
      multiple: true, 
      row: 1,
      options: () => {
        const usedAssetKeys = new Set(portfolio.transactions.map(tx => tx.asset));
        const usedAlloc = portfolio.assetAllocations.filter(a => usedAssetKeys.has(a.asset));
        const usedRegionKeys = new Set(usedAlloc.map(a => a.region));
        return portfolio.assetRegions
          .filter(r => usedRegionKeys.has(r.key))
          .map(r => ({ label: Helpers.getLocalized(r), value: r.key }));
      }
    }
  ],

  fields: [
    { 
      key: "account", 
      label: "account", 
      sortable: false 
    },
    { 
      key: "asset", 
      label: "asset", 
      sortable: false 
    },
    { 
      key: "units", 
      label: "units", 
      sortable: false 
    },
    {
      key: "acb_per_unit",
      label: "acb_per_unit",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.acb_per_unit, row.currency)
    },
    {
      key: "acb_total",
      label: "acb_total",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.acb_total, row.currency)
    },
    {
      key: "realized_gain",
      label: "realized_gain",
      sortable: false,
      display: row => {
        const span = document.createElement("span");
        span.className = row.realized_gain >= 0 ? "gain" : "loss";
        span.textContent = Helpers.formatByCurrency(row.realized_gain, row.currency);
        return span;
      }
    },
    {
      key: "market",
      label: "market",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.market, row.currency)
    },
    {
      key: "unrealized_gain",
      label: "unrealized_gain",
      sortable: false,
      display: row => {
        const span = document.createElement("span");
        span.className = row.unrealized_gain >= 0 ? "gain" : "loss";
        span.textContent = Helpers.formatByCurrency(row.unrealized_gain, row.currency);
        return span;
      }
    },
    {
      key: "liquidation",
      label: "liquidation",
      sortable: false,
      display: row => Helpers.formatByCurrency(row.liquidation, row.currency)
    },
 
    {
      key: "currency",
      type: "custom",
      classBase: "currency",
      sortable: false,
      display: row => {
        const currency = portfolio.currencies.find(c => c.key === row.currency);
        const text = currency ? `${currency.symbol} (${currency.code})` : ""; 
        return Helpers.DOM.create("span", { class: "currency" }, [text]);
      }
    }
  ],

  charts: [
    { id: "marketPersonChartCanvas", container: "snapshotMarketPersonChart", position: "after-table" },
    { id: "liquidationPersonChartCanvas", container: "snapshotLiquidationPersonChart", position: "after-table" },
    { id: "marketAccountTypeChartCanvas", container: "snapshotMarketAccountTypeChart", position: "after-table" },
    { id: "liquidationAccountTypeChartCanvas", container: "snapshotLiquidationAccountTypeChart", position: "after-table" },
    { id: "marketClassChartCanvas", container: "snapshotMarketClassChart", position: "after-table" },
    { id: "liquidationClassChartCanvas", container: "snapshotLiquidationClassChart", position: "after-table" },
    { id: "marketRegionChartCanvas", container: "snapshotMarketRegionChart", position: "after-table" },
    { id: "liquidationMarketChartCanvas", container: "snapshotLiquidationRegionChart", position: "after-table" }
  ],

  onRendered: (tbody, schema) => {
    if (tbody.children.length > 0) {

      // The table element
      const tableEl = tbody.parentElement;

      // The module container (parent of filters + table)
      const moduleContainer = tableEl.parentElement;

      // Create summary container if missing
      let summaryContainer = document.getElementById("snapshotSummaryTable");
      if (!summaryContainer) {
        summaryContainer = document.createElement("div");
        summaryContainer.id = "snapshotSummaryTable";
        summaryContainer.className = "snapshot-summary-container";

        // Insert BEFORE the table, right after filters
        moduleContainer.insertBefore(summaryContainer, tableEl);
      }

      // Create a wrapper for chart rows if missing
      let chartRows = document.getElementById("snapshotChartRows");
      if (!chartRows) {
        chartRows = document.createElement("div");
        chartRows.id = "snapshotChartRows";
        chartRows.style.display = "flex";
        chartRows.style.flexDirection = "column";
        chartRows.style.gap = "20px";
        chartRows.style.marginTop = "20px";

        // Insert AFTER the table
        moduleContainer.insertBefore(chartRows, tableEl.nextSibling);
      }

      // Group charts in pairs: market + liquidation
      const chartPairs = [
          ["snapshotMarketPersonChart", "snapshotLiquidationPersonChart"],
          ["snapshotMarketAccountTypeChart", "snapshotLiquidationAccountTypeChart"],
          ["snapshotMarketClassChart", "snapshotLiquidationClassChart"],
          ["snapshotMarketRegionChart", "snapshotLiquidationRegionChart"]
      ];

      chartPairs.forEach(([marketId, liquidationId]) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.gap = "20px";

        const marketEl = document.getElementById(marketId);
        const liquidationEl = document.getElementById(liquidationId);

        if (marketEl) {
          marketEl.style.flex = "1";
          marketEl.style.maxWidth = "500px";
          marketEl.style.height = "400px";
          marketEl.classList.add("snapshot-chart-box");
          row.appendChild(marketEl);
        }

        if (liquidationEl) {
          liquidationEl.style.flex = "1";
          liquidationEl.style.maxWidth = "500px";
          liquidationEl.style.height = "400px";
          liquidationEl.classList.add("snapshot-chart-box");
          row.appendChild(liquidationEl);
        }

        chartRows.appendChild(row);
      });

      // Render charts + summary
      Helpers.renderSnapshotChartsAndSummary();
    }
  }
});
