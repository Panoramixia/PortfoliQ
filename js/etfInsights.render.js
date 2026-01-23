// js/etfInsights.render.js

// ------------------------------------------------------------
// ETF INSIGHTS – RENDER LAYER (ONLY BAR CHARTS)
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

/**
 * Main renderer called by CRUD onRendered().
 */
Helpers.renderEtfInsightsChartsAndSummary = function () {
  const rows = Helpers.computeEtfInsightsRows();
  const totals = Helpers.computeEtfInsightTotals(rows);

  Helpers.renderEtfInsightsCharts(rows, totals);
};

/**
 * Render ONLY the two bar charts.
 */
Helpers.renderEtfInsightsCharts = function (rows, totals) {
  const symbols = rows.map(r => r.symbol);

  const colors = rows.map(r => {
    const etf = portfolio.etfs.find(e => e.key === r.symbol);
    const cls = etf && portfolio.assetClasses.find(c => c.key === etf.class);
    return cls ? cls.color : "#999999";
  });

  // ------------------------------------------------------------
  // 1. Tax Drag (BAR CHART)
  // ------------------------------------------------------------
  Helpers.renderBarChart({
    containerSelector: "#etfTaxDragChart",
    canvasId: "etfTaxDragChartCanvas",
    title: "Tax Drag by ETF",
    labels: symbols,
    values: symbols.map(s => totals.taxDragTotals[s]),
    colors
  });

  // ------------------------------------------------------------
  // 2. After‑Tax Yield (BAR CHART)
  // ------------------------------------------------------------
  Helpers.renderBarChart({
    containerSelector: "#etfAfterTaxYieldChart",
    canvasId: "etfAfterTaxYieldChartCanvas",
    title: "After‑Tax Yield by ETF",
    labels: symbols,
    values: symbols.map(s => totals.afterTaxYieldTotals[s]),
    colors
  });
};
