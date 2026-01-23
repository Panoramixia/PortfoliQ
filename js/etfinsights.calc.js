// js/etfinsights.calc.js

// ------------------------------------------------------------
// ETF TAX DRAG HELPERS
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

/**
 * Compute region exposure using look‑through.
 * Returns: { regionKey -> Decimal(weight) }
 */
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

// ------------------------------------------------------------
// TAX DRAG
// ------------------------------------------------------------
Helpers.computeEtfTaxDrag = function (etf, accountType, portfolio) {
  const regionKey = etf.region; // e.g. "CAN", "DEV", "EMR", "USA"
  const assetFwt = portfolio.assetFwts.find(r => r.key === regionKey);

  const isFundOfFunds = Helpers.isFundOfFunds(etf, portfolio);

  const fwt1 = assetFwt ? assetFwt.fwt1 : 0;
  const fwt2 = assetFwt ? assetFwt.fwt2 : 0;

  // RRSP exemption for US-listed ETFs
  if (accountType.is_usa_withholding_waived && etf.region === "USA") {
    fwt1 = 0;
    fwt2 = 0;
  }

  const dividendYield = etf.yield_dividend || 0;
  const interestYield = etf.yield_interest || 0;

  // 1. Domestic tax (depends on account type)
  const domesticDividendTax =
    dividendYield * (accountType.dividend_tax_rate || 0);

  const domesticInterestTax =
    interestYield * (accountType.interest_tax_rate || 0);

  // 2. Foreign withholding tax layers (CPM methodology)
  // FWT1 always applies for foreign equities
  const fwt1Drag = dividendYield * fwt1;

  // FWT2 only applies when ETF is a fund-of-funds
  const fwt2Drag = isFundOfFunds ? dividendYield * fwt2 : 0;

  // 3. Total drag
  const totalDrag =
    domesticDividendTax +
    domesticInterestTax +
    fwt1Drag +
    fwt2Drag;

  return {
    totalDrag: new Decimal(totalDrag),
    domesticDrag: new Decimal(domesticDividendTax + domesticInterestTax),
    interestDrag: new Decimal(domesticInterestTax),
    fwtDrag: new Decimal(fwt1Drag + fwt2Drag)
  };
};

Helpers.computeEtfTaxDragRecursive = function (etfKey, accountType, portfolio) {
  const etf = portfolio.etfs.find(e => e.key === etfKey);
  if (!etf) return 0;

  const regionFwt = portfolio.assetFwts.find(r => r.key === etf.region) || { fwt1: 0, fwt2: 0 };

  // ADD THIS:
  let fwt1 = regionFwt.fwt1;
  let fwt2 = regionFwt.fwt2;

  if (accountType.is_usa_withholding_waived && etf.region === "USA") {
    fwt1 = 0;
    fwt2 = 0;
  }

  const dividendYield = etf.yield_dividend || 0;
  const interestYield = etf.yield_interest || 0;

  const children = portfolio.etfRelations.filter(rel => rel.parent_etf === etfKey);
  const childWeightSum = children.reduce((sum, rel) => sum + rel.weight, 0);

  // Portion held directly (stocks, not via child ETFs)
  const directWeight = Math.max(0, 1 - childWeightSum);
  const directDividend = dividendYield * directWeight;
  const directInterest = interestYield * directWeight;

  // 1. Domestic tax on direct slice
  const domesticDividendTax =
    directDividend * (accountType.dividend_tax_rate || 0);
  const domesticInterestTax =
    directInterest * (accountType.interest_tax_rate || 0);

  // 2. FWT on direct slice (no second tier here – direct holdings)
  const fwt1DragDirect = directDividend * regionFwt.fwt1;
  const fwt2DragDirect = 0;

  let totalDrag =
    domesticDividendTax +
    domesticInterestTax +
    fwt1DragDirect +
    fwt2DragDirect;

  // 3. Recurse into child ETFs (their drag already includes their own FWT1/FWT2)
  children.forEach(rel => {
    const childDrag = Helpers.computeEtfTaxDragRecursive(rel.child_etf, accountType, portfolio);
    totalDrag += childDrag * rel.weight;
  });

  return totalDrag;
};


/**
 * Compute after‑tax yield.
 */
Helpers.computeEtfAfterTaxYield = function (etf, drag) {
  const gross = new Decimal(etf.yield_dividend || 0).plus(etf.yield_interest || 0);
  const net = gross.minus(drag.totalDrag);
  return {
    grossYield: gross,
    netYield: Decimal.max(net, 0)
  };
};

Helpers.computeWeightedChildTaxDrag = function (parentKey, portfolio) {
  const children = Helpers.getDirectChildren(parentKey, portfolio);

  let weightedDrag = 0;

  children.forEach(({ childKey, weight }) => {
    const etf = portfolio.etfs.find(e => e.key === childKey);
    if (!etf) return;

    const childGroup = {
      etf,
      weight,
      regionExposure: Helpers.computeEtfRegionExposure(etf.key, portfolio)
    };

    const metrics = Helpers.computeEtfInsightMetrics(childGroup, portfolio);
    weightedDrag += metrics.drag.totalDrag.toNumber() * weight;
  });

  return weightedDrag;
};

Helpers.isFundOfFunds = function (etf, portfolio) {
  if (!etf || !portfolio || !portfolio.etfRelations) return false;

  // If this ETF appears as a parent in etfRelations, it holds other ETFs
  return portfolio.etfRelations.some(rel => rel.parent_etf === etf.key);
};
