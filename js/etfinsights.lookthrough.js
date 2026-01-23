// js/etfinsights.lookthrough.js

// ------------------------------------------------------------
// ETF LOOK‑THROUGH HELPERS
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

Helpers.buildEtfRelationMap = function (relations) {
  const map = {};
  relations.forEach(r => {
    if (!map[r.parent]) map[r.parent] = [];
    map[r.parent].push({
      child: r.child,
      weight: new Decimal(r.weight || 0)
    });
  });
  return map;
};

Helpers.flattenEtfHoldings = function (rootKey, portfolio) {
  const map = Helpers.buildEtfRelationMap(portfolio.etfRelations);
  const weights = {};
  const visited = new Set();

  function dfs(key, w) {
    if (visited.has(key)) return;
    const children = map[key];
    if (!children || children.length === 0) {
      if (!weights[key]) weights[key] = new Decimal(0);
      weights[key] = weights[key].plus(w);
      return;
    }
    visited.add(key);
    children.forEach(c => dfs(c.child, w.mul(c.weight)));
    visited.delete(key);
  }

  dfs(rootKey, new Decimal(1));
  return weights;
};

Helpers.computeEtfRegionExposure = function (rootKey, portfolio) {
  const leafWeights = Helpers.flattenEtfHoldings(rootKey, portfolio);
  const regionTotals = {};

  Object.entries(leafWeights).forEach(([etfKey, w]) => {
    const etf = portfolio.etfs.find(e => e.key === etfKey);
    if (!etf) return;
    const region = etf.region;
    if (!regionTotals[region]) regionTotals[region] = new Decimal(0);
    regionTotals[region] = regionTotals[region].plus(w);
  });

  return regionTotals;
};

Helpers.getDirectChildren = function (parentKey, portfolio) {
  return portfolio.etfRelations
    .filter(rel => rel.parent_etf === parentKey)
    .map(rel => ({
      childKey: rel.child_etf,
      weight: Number(rel.weight)
    }));
};
