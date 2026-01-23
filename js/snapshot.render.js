// js/snapshot.render.js

window.Helpers = window.Helpers || {};

Helpers.renderSnapshotChartsAndSummary = function() {
  // Use the already-filtered rows
  const rows = Helpers.computeSnapshotRows();

  const summaryTotals = {};
  const marketPersonTotals = {};
  const liquidationPersonTotals = {};
  const marketAccountTypeTotals = {};
  const liquidationAccountTypeTotals = {};
  const marketClassTotals = {};
  const liquidationClassTotals = {};
  const marketRegionTotals = {};
  const liquidationRegionTotals = {};

  rows.forEach(row => {
    const account = portfolio.accounts.find(a => a.key === row.account);
    const asset = portfolio.assets.find(a => a.key === row.asset);
    const currency = portfolio.currencies.find(c => c.key === row.currency);
    const group = { account, asset, currency };

    const metrics = {
      marketTotal: new Decimal(row.market),
      liquidation: new Decimal(row.liquidation),
      realizedGain: new Decimal(row.realized_gain),
      unrealizedGain: new Decimal(row.unrealized_gain)
    };

    const allocations = portfolio.assetAllocations.filter(a => a.asset === asset.key);

    Helpers.accumulateSnapshotTotals(
      {
        summaryTotals,
        marketPersonTotals,
        liquidationPersonTotals,
        marketAccountTypeTotals,
        liquidationAccountTypeTotals,
        marketClassTotals,
        liquidationClassTotals,
        marketRegionTotals,
        liquidationRegionTotals
      },
      group,
      metrics,
      allocations
    );
  });

  const totalsNum = Helpers.convertTotalsToNumbers(portfolio, {
    marketPersonTotals,
    liquidationPersonTotals,
    marketAccountTypeTotals,
    liquidationAccountTypeTotals,
    marketClassTotals,
    liquidationClassTotals,
    marketRegionTotals,
    liquidationRegionTotals
  });

  Helpers.renderSnapshotCharts({
    portfolio,
    ...totalsNum
  });

  Helpers.renderSnapshotSummaryTable(summaryTotals);
};


Helpers.renderSnapshotSummaryTable = function (summaryTotals) {
  const container = document.getElementById("snapshotSummaryTable");
  if (!container) return;

  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "snapshot-summary";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>${t("account_type")}</th>
      <th>${t("realized_gain")}</th>
      <th>${t("market")}</th>
      <th>${t("unrealized_gain")}</th>
      <th>${t("liquidation")}</th>
      <th>${t("currency")}</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  Object.entries(summaryTotals).forEach(([typeKey, currencies]) => {
    Object.entries(currencies).forEach(([currKey, totals]) => {
      const tr = document.createElement("tr");

      const type = portfolio.accountTypes.find(t => t.key === typeKey);
      const currency = portfolio.currencies.find(c => c.key === currKey);

      tr.innerHTML = `
        <td>${Helpers.getLocalized(type)}</td>
        <td>${Helpers.formatByCurrency(totals.realized.toNumber(), currKey)}</td>
        <td>${Helpers.formatByCurrency(totals.market.toNumber(), currKey)}</td>
        <td>${Helpers.formatByCurrency(totals.unrealized.toNumber(), currKey)}</td>
        <td>${Helpers.formatByCurrency(totals.liquidation.toNumber(), currKey)}</td>
        <td>${currency.symbol} (${currency.code})</td>
      `;

      tbody.appendChild(tr);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);
};
