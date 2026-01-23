// js/etfInsights.compute.js

// ------------------------------------------------------------
// ETF INSIGHTS – COMPUTE LAYER
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

/**
 * Main collection builder for CRUD.
 * Returns an array of table rows.
 */
Helpers.computeEtfInsightsRows = function () {
  const parentKey = config.filters.etfInsights.parentEtf;

  // ------------------------------------------------------------
  // 1. Parent ETF drilldown mode
  // ------------------------------------------------------------
  if (parentKey) {
    return Helpers.computeParentEtfRows(parentKey);
  }

  // ------------------------------------------------------------
  // 2. Default mode
  // ------------------------------------------------------------
  const groups = Helpers.groupEtfData(portfolio);

  const rows = groups.map(group => {
    const metrics = Helpers.computeEtfInsightMetrics(group, portfolio);

    const investment = Number(config.filters.etfInsights.investment || 0);
    const years = Number(config.filters.etfInsights.years || 1);

    const grossYield = metrics.yields.grossYield.toNumber();
    const netYield = metrics.yields.netYield.toNumber();
    const taxDrag = metrics.drag.totalDrag.toNumber();

    const taxDragAmount = investment * taxDrag;
    const afterTaxIncome = investment * netYield;
    const afterTaxGrowth = investment * Math.pow(1 + netYield, years) - investment;

    return {
      symbol: group.etf.code,
      name: group.etf.name,
      currency: group.etf.currency,
      region: group.etf.region,
      mer: group.etf.mer || 0,
      investment,
      yield: grossYield,
      tax_drag: taxDrag,
      tax_drag_amount: taxDragAmount,
      after_tax_yield: netYield,
      after_tax_income: afterTaxIncome,
      after_tax_growth: afterTaxGrowth,
      region_exposure: group.regionExposure
    };
  });

  return rows;
};

/**
 * Parent ETF drilldown rows.
 */
Helpers.computeParentEtfRows = function (parentKey) {
  const parent = portfolio.etfs.find(e => e.key === parentKey);
  if (!parent) return [];

  const investmentBase = Number(config.filters.etfInsights.investment || 0);
  const years = Number(config.filters.etfInsights.years || 1);

  // 1. Parent row
  const parentGroup = {
    etf: parent,
    weight: 1,
    regionExposure: Helpers.computeEtfRegionExposure(parent.key, portfolio)
  };
  const parentMetrics = Helpers.computeEtfInsightMetrics(parentGroup, portfolio);
  const weightedChildDrag = Helpers.computeWeightedChildTaxDrag(parentKey, portfolio);
  const grossYield = parentMetrics.yields.grossYield.toNumber();
  const afterTaxYield = grossYield - weightedChildDrag;

  const parentRow = {
    symbol: parent.code,
    name: parent.name,
    currency: parent.currency,
    region: parent.region,
    mer: parent.mer || 0,
    investment: investmentBase,
    yield: grossYield,
    tax_drag: weightedChildDrag,
    tax_drag_amount: investmentBase * weightedChildDrag,
    after_tax_yield: afterTaxYield,
    after_tax_income: investmentBase * afterTaxYield,
    after_tax_growth:
      investmentBase * Math.pow(1 + afterTaxYield, years) - investmentBase,
    region_exposure: parentGroup.regionExposure
  };

  // 2. Children
  const children = Helpers.getDirectChildren(parentKey, portfolio);

  let totalWeight = 0;
  let weightedMer = 0;
  let weightedGrossYield = 0;
  let weightedDrag = 0;
  let weightedNetYield = 0;

  const childRows = children.map(({ childKey, weight }) => {
    const etf = portfolio.etfs.find(e => e.key === childKey);
    if (!etf) return null;

    const childGroup = {
      etf,
      weight,
      regionExposure: Helpers.computeEtfRegionExposure(etf.key, portfolio)
    };

    const metrics = Helpers.computeEtfInsightMetrics(childGroup, portfolio);

    const w = Number(weight);
    const childInvestment = investmentBase * w;

    // accumulate for dummy row
    totalWeight += w;
    weightedMer += (etf.mer || 0) * w;
    weightedGrossYield +=
      (etf.yield_dividend + etf.yield_interest) * w;
    weightedDrag += metrics.drag.totalDrag.toNumber() * w;
    weightedNetYield += metrics.yields.netYield.toNumber() * w;

    return {
      symbol: etf.code,
      name: etf.name,
      currency: etf.currency,
      region: etf.region,
      mer: etf.mer || 0,
      investment: childInvestment,
      yield: metrics.yields.grossYield.toNumber(),
      tax_drag: metrics.drag.totalDrag.toNumber(),
      tax_drag_amount: childInvestment * metrics.drag.totalDrag.toNumber(),
      after_tax_yield: metrics.yields.netYield.toNumber(),
      after_tax_income: childInvestment * metrics.yields.netYield.toNumber(),
      after_tax_growth:
        childInvestment *
          Math.pow(1 + metrics.yields.netYield.toNumber(), years) -
        childInvestment,
      region_exposure: childGroup.regionExposure
    };
  }).filter(Boolean);

  // 3. Dummy row (weighted children)
  const dummyRow = {
    symbol: children.map(c => c.childKey).join(" + "),
    name: t("child_etf_dummy"),
    currency: "",
    region: "",
    mer: weightedMer,
    investment: investmentBase,
    yield: weightedGrossYield,
    tax_drag: weightedDrag,
    tax_drag_amount: investmentBase * weightedDrag,
    after_tax_yield: weightedNetYield,
    after_tax_income: investmentBase * weightedNetYield,
    after_tax_growth:
      investmentBase * Math.pow(1 + weightedNetYield, years) -
      investmentBase,
    region_exposure: {}
  };

  return [parentRow, dummyRow, ...childRows];
};

/**
 * Totals for charts.
 */
Helpers.computeEtfInsightTotals = function (rows) {
  const taxDragTotals = {};
  const afterTaxYieldTotals = {};
  const regionTotals = {};

  rows.forEach(row => {
    taxDragTotals[row.symbol] = row.tax_drag;
    afterTaxYieldTotals[row.symbol] = row.after_tax_yield;

    Object.entries(row.region_exposure).forEach(([region, w]) => {
      if (!regionTotals[region]) regionTotals[region] = 0;
      regionTotals[region] += w.toNumber();
    });
  });

  return { taxDragTotals, afterTaxYieldTotals, regionTotals };
};

/**
 * 1. Group ETFs
 */
Helpers.groupEtfData = function (portfolio) {
  const allowedCurrencies = config.filters.etfInsights.currencies;

  return portfolio.etfs
    .filter(etf => {
      if (!allowedCurrencies || allowedCurrencies.length === 0) return true;
      return allowedCurrencies.includes(etf.currency);
    })
    .map(etf => ({
      etf,
      regionExposure: Helpers.computeEtfRegionExposure(etf.key, portfolio)
    }));
};


/**
 * 2. Compute metrics
 */
Helpers.computeEtfInsightMetrics = function (group, portfolio) {
  const marginalRate = config.filters.etfInsights.marginalRate || 0;

  const acctKey =
    config.filters.etfInsights.accountType || portfolio.accountTypes[0].key;

  const accountType = portfolio.accountTypes.find(a => a.key === acctKey);

  // Build effective tax rates using marginal rate
  const effectiveAccountType = {
    ...accountType,

    // Dividend tax
    dividend_tax_rate:
      accountType.is_tax_free || accountType.is_tax_deferred ? 0 : marginalRate * (accountType.dividend_multiplier || 1),

    // Interest tax
    interest_tax_rate:
      accountType.is_tax_free || accountType.is_tax_deferred ? 0 : marginalRate * (accountType.interest_multiplier || 1),

    // Capital gains tax
    capital_gains_tax_rate:
      accountType.is_tax_free || accountType.is_tax_deferred ? 0 : marginalRate * 0.5,

    // U.S. withholding tax (15% unless waived)
    us_withholding_rate:
      accountType.is_usa_withholding_waived ? 0 : 0.15
  };

  const dragValue = Helpers.computeEtfTaxDragRecursive(group.etf.key, effectiveAccountType, portfolio);

  const drag = {
    totalDrag: new Decimal(dragValue),
    domesticDrag: new Decimal(0), // optional: break down if you want
    interestDrag: new Decimal(0),
    fwtDrag: new Decimal(dragValue)
  };

  const yields = Helpers.computeEtfAfterTaxYield(group.etf, drag);

  return { drag, yields };
};

/**
 * 3. Accumulate totals
 */
Helpers.accumulateEtfInsightTotals = function (totals, group, metrics) {
  const { taxDragTotals, afterTaxYieldTotals, regionExposureTotals } = totals;
  const key = group.etf.key;

  taxDragTotals[key] = metrics.drag.totalDrag;
  afterTaxYieldTotals[key] = metrics.yields.netYield;

  Object.entries(group.regionExposure).forEach(([region, w]) => {
    if (!regionExposureTotals[region]) regionExposureTotals[region] = new Decimal(0);
    regionExposureTotals[region] = regionExposureTotals[region].plus(w);
  });
};

/**
 * 4. Convert totals
 */
Helpers.convertEtfInsightTotalsToNumbers = function (totals) {
  const out = {};
  Object.entries(totals).forEach(([k, obj]) => {
    const converted = {};
    Object.entries(obj).forEach(([key, val]) => {
      converted[key] = val.toNumber();
    });
    out[k] = converted;
  });
  return out;
};

function renderEtfInsights() {
  EtfInsights.render();
}