// js/snapshot.charts.js

// ------------------------------------------------------------
// SNAPSHOT CHARTS HELPERS (Key‑Based Version)
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

Helpers.convertTotalsToNumbers = function (portfolio, totals) {
  const {
    marketPersonTotals,
    liquidationPersonTotals,
    marketAccountTypeTotals,
    liquidationAccountTypeTotals,
    marketClassTotals,
    liquidationClassTotals,
    marketRegionTotals,
    liquidationRegionTotals
  } = totals;

  const marketPersonTotalsNum = {};
  portfolio.persons.forEach(p => {
    marketPersonTotalsNum[p.key] = marketPersonTotals[p.key]?.toNumber() || 0;
  });

  const liquidationPersonTotalsNum = {};
  portfolio.persons.forEach(p => {
    liquidationPersonTotalsNum[p.key] = liquidationPersonTotals[p.key]?.toNumber() || 0;
  });

  const marketAccountTypeTotalsNum = {};
  portfolio.accountTypes.forEach(t => {
    marketAccountTypeTotalsNum[t.key] = marketAccountTypeTotals[t.key]?.toNumber() || 0;
  });

  const liquidationAccountTypeTotalsNum = {};
  portfolio.accountTypes.forEach(t => {
    liquidationAccountTypeTotalsNum[t.key] = liquidationAccountTypeTotals[t.key]?.toNumber() || 0;
  });

  const marketClassTotalsNum = {};
  portfolio.assetClasses.forEach(c => {
    marketClassTotalsNum[c.key] = marketClassTotals[c.key]?.toNumber() || 0;
  });

  const liquidationClassTotalsNum = {};
  portfolio.assetClasses.forEach(c => {
    liquidationClassTotalsNum[c.key] = liquidationClassTotals[c.key]?.toNumber() || 0;
  });

  const marketRegionTotalsNum = {};
  portfolio.assetRegions.forEach(r => {
    marketRegionTotalsNum[r.key] = marketRegionTotals[r.key]?.toNumber() || 0;
  });

  const liquidationRegionTotalsNum = {};
  portfolio.assetRegions.forEach(r => {
    liquidationRegionTotalsNum[r.key] = liquidationRegionTotals[r.key]?.toNumber() || 0;
  });

  return {
    marketPersonTotalsNum,
    liquidationPersonTotalsNum,
    marketAccountTypeTotalsNum, 
    liquidationAccountTypeTotalsNum,
    marketRegionTotalsNum,
    marketClassTotalsNum,
    liquidationRegionTotalsNum,
    liquidationClassTotalsNum
  };
};

Helpers.renderSnapshotCharts = function ({
  portfolio,
  marketPersonTotalsNum,
  liquidationPersonTotalsNum,
  marketAccountTypeTotalsNum,
  liquidationAccountTypeTotalsNum,
  marketClassTotalsNum,
  liquidationClassTotalsNum,
  marketRegionTotalsNum,
  liquidationRegionTotalsNum
}) {
  
  Helpers.renderPieChart({
    containerSelector: "#snapshotMarketPersonChart",
    canvasId: "marketPersonChartCanvas",
    title: t("chart_market_person"),
    labels: portfolio.persons.map(p => p.name),
    values: portfolio.persons.map(p => marketPersonTotalsNum[p.key]),
    colors: portfolio.persons.map(p => p.color || "#000000")
  });

  Helpers.renderPieChart({
    containerSelector: "#snapshotLiquidationPersonChart",
    canvasId: "liquidationPersonChartCanvas",
    title: t("chart_liquidation_person"),
    labels: portfolio.persons.map(p => p.name),
    values: portfolio.persons.map(p => liquidationPersonTotalsNum[p.key]),
    colors: portfolio.persons.map(p => p.color || "#000000")
  });

  Helpers.renderPieChart({
    containerSelector: "#snapshotMarketAccountTypeChart",
    canvasId: "marketAccountTypeChartCanvas",
    title: t("chart_market_account_type"),
    labels: portfolio.accountTypes.map(t => Helpers.getLocalized(t)),
    values: portfolio.accountTypes.map(t => marketAccountTypeTotalsNum[t.key]),
    colors: portfolio.accountTypes.map(t => t.color || "#000000")
  });

  Helpers.renderPieChart({
    containerSelector: "#snapshotLiquidationAccountTypeChart",
    canvasId: "liquidationAccountTypeChartCanvas",
    title: t("chart_liquidation_account_type"),
    labels: portfolio.accountTypes.map(t => Helpers.getLocalized(t)),
    values: portfolio.accountTypes.map(t => liquidationAccountTypeTotalsNum[t.key]),
    colors: portfolio.accountTypes.map(t => t.color || "#000000")
  });

  Helpers.renderPieChart({
    containerSelector: "#snapshotMarketClassChart",
    canvasId: "marketClassChartCanvas",
    title: t("chart_market_class"),
    labels: portfolio.assetClasses.map(c => Helpers.getLocalized(c)),
    values: portfolio.assetClasses.map(c => marketClassTotalsNum[c.key] || 0),
    colors: portfolio.assetClasses.map(c => c.color || "#000000")
  });

  Helpers.renderPieChart({
    containerSelector: "#snapshotLiquidationClassChart",
    canvasId: "liquidationClassChartCanvas",
    title: t("chart_liquidation_class"),
    labels: portfolio.assetClasses.map(c => Helpers.getLocalized(c)),
    values: portfolio.assetClasses.map(c => liquidationClassTotalsNum[c.key] || 0),
    colors: portfolio.assetClasses.map(c => c.color || "#000000")
  });

  Helpers.renderPieChart({
    containerSelector: "#snapshotMarketRegionChart",
    canvasId: "marketRegionChartCanvas",
    title: t("chart_market_region"),
    labels: portfolio.assetRegions.map(r => Helpers.getLocalized(r)),
    values: portfolio.assetRegions.map(r => marketRegionTotalsNum[r.key] || 0),
    colors: portfolio.assetRegions.map(r => r.color || "#000000")
  });

  Helpers.renderPieChart({
    containerSelector: "#snapshotLiquidationRegionChart",
    canvasId: "liquidationMarketChartCanvas",
    title: t("chart_liquidation_region"),
    labels: portfolio.assetRegions.map(r => Helpers.getLocalized(r)),
    values: portfolio.assetRegions.map(r => liquidationRegionTotalsNum[r.key] || 0),
    colors: portfolio.assetRegions.map(r => r.color || "#000000")
  });
};
