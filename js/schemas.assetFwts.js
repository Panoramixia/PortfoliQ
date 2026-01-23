// js/schemas.assetFwts.js

Crud.Registry.register("assetFwts", {
  tableBodySelector: "#assetFwtsTableBody",
  entityName: "assetFwt",
  primaryKey: "key",

  // AssetFwt key = normalized name (e.g., "North America" → "north_america")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.assetFwts,

  // Other tables that reference transactions (usually none)
  referencedBy: [],

  fields: [
    {
      key: "code",
      type: "dropdown",
      classBase: "code",
      showKey: true,
      required: true,
      options: () =>
        portfolio.assetRegions.map(ar => ({
          value: ar.key,
          label: ar.key
        })),
      display: f => f.code
    },

    {
      key: "en",
      type: "text",
      classBase: "en",
      required: true,
      display: f => f.en
    },

    {
      key: "fr",
      type: "textarea",
      classBase: "fr",
      required: false,
      display: f => f.fr || ""
    },

    {
      key: "fwt1",
      type: "percent",
      classBase: "fwt1",
      required: true,
      min: 0,
      max: 100,
      step: 1,
      display: r => new Decimal(r.fwt1).times(100).toNumber()
    },

    {
      key: "fwt2",
      type: "percent",
      classBase: "fwt2",
      required: true,
      min: 0,
      max: 100,
      step: 1,
      display: r => new Decimal(r.fwt2).times(100).toNumber()
    }
  ],

  validate(values) {
    if (!values.code) return false;

    const f1 = parseFloat(values.fwt1);
    if (isNaN(f1) || f1 < 0 || f1 > 1) return t("percent_invalid");

    const f2 = parseFloat(values.fwt2);
    if (isNaN(f2) || f2 < 0 || f2 > 1) return t("percent_invalid");

    return true;
  },

  transform(values) {
    if (!values.key) {
      values.key = this.makeKey(values);
    }
    return values;
  }
});

// ------------------------------------------------------------
// ETF LOOK‑THROUGH HELPERS
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

/**
 * Build a quick lookup of relations: parentKey -> [{ childKey, weight }]
 */
Helpers.buildEtfRelationMap = function (etfRelations) {
  const map = {};
  etfRelations.forEach(rel => {
    if (!map[rel.parent]) map[rel.parent] = [];
    map[rel.parent].push({
      child: rel.child,
      weight: new Decimal(rel.weight || 0) // already decimal (0–1)
    });
  });
  return map;
};

/**
 * Flatten ETF holdings into leaf ETFs with effective weights.
 * Returns: { etfKey -> Decimal(weight) }
 */
Helpers.flattenEtfHoldings = function (rootEtfKey, portfolio) {
  const relationsMap = Helpers.buildEtfRelationMap(portfolio.etfRelations);
  const weights = {};
  const visitedPath = new Set();

  function dfs(etfKey, currentWeight) {
    const pathKey = `${etfKey}`;
    if (visitedPath.has(pathKey)) {
      // Shouldn't happen due to cycle prevention, but guard anyway
      return;
    }

    const children = relationsMap[etfKey];
    if (!children || children.length === 0) {
      // Leaf ETF
      if (!weights[etfKey]) weights[etfKey] = new Decimal(0);
      weights[etfKey] = weights[etfKey].plus(currentWeight);
      return;
    }

    visitedPath.add(pathKey);

    children.forEach(({ child, weight }) => {
      const childWeight = currentWeight.mul(weight);
      dfs(child, childWeight);
    });

    visitedPath.delete(pathKey);
  }

  dfs(rootEtfKey, new Decimal(1));

  return weights; // key -> Decimal
};

/**
 * Compute effective region weights for a parent ETF using look‑through.
 * Returns: { regionKey -> Decimal(weight) }
 */
Helpers.computeEtfRegionExposure = function (rootEtfKey, portfolio) {
  const leafWeights = Helpers.flattenEtfHoldings(rootEtfKey, portfolio);
  const regionWeights = {};

  Object.entries(leafWeights).forEach(([etfKey, weight]) => {
    const etf = portfolio.etfs.find(e => e.key === etfKey);
    if (!etf || !etf.region) return;
    const regionKey = etf.region;

    if (!regionWeights[regionKey]) regionWeights[regionKey] = new Decimal(0);
    regionWeights[regionKey] = regionWeights[regionKey].plus(weight);
  });

  return regionWeights;
};
