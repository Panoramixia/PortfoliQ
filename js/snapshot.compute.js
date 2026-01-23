// js/snapshot.compute.js

// ------------------------------------------------------------
// SNAPSHOT CALCULATION HELPERS (Key‑Based Version)
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

Helpers.computeSnapshotRows = function () {
  const rows = [];
  const groups = Helpers.groupSnapshotTransactions(portfolio);

  Object.values(groups).forEach(group => {
    if (!Helpers.snapshotGroupPassesFilters(group, config, portfolio)) return;

    const metrics = Helpers.computeSnapshotGroupMetrics(group, portfolio);

    rows.push({
      key: `${group.account.key}__${group.asset.key}`,
      account: group.account.key,
      asset: group.asset.key,
      units: metrics.unitsRemaining.toNumber(),
      acb_per_unit: metrics.acbPerUnit.toNumber(),
      acb_total: metrics.acbTotal.toNumber(),
      realized_gain: metrics.realizedGain.toNumber(),
      market: metrics.marketTotal.toNumber(),
      unrealized_gain: metrics.unrealizedGain.toNumber(),
      liquidation: metrics.liquidation.toNumber(),
      currency: group.currency.key
    });
  });

  return rows;
}

Helpers.groupSnapshotTransactions = function (portfolio) {
  const groups = {};

  portfolio.accounts.forEach(acc => {
    const txs = portfolio.transactions.filter(tx => tx.account === acc.key);

    txs.forEach(tx => {
      const asset = portfolio.assets.find(a => a.key === tx.asset);
      if (!asset) return;

      const currency = portfolio.currencies.find(c => c.key === acc.currency);
      if (!currency) return;

      const key = `${acc.key}__${asset.key}`;

      if (!groups[key]) {
        groups[key] = {
          account: acc,
          asset,
          currency,
          transactions: []
        };
      }

      groups[key].transactions.push(tx);
    });
  });

  return groups;
};

Helpers.computeSnapshotGroupMetrics = function (group, portfolio) {
  const { account, asset, currency, transactions } = group;

  let acbTotal = new Decimal(0);
  let unitsRemaining = new Decimal(0);
  let realizedGain = new Decimal(0);
  let marketTotal = new Decimal(0);

  const accountType = portfolio.accountTypes.find(t => t.key === account.type);
  const isDeferred = accountType?.is_tax_deferred === true;
  const isCapitalGain = accountType?.is_capital_gain === true;

  const person = portfolio.persons.find(p => p.key === account.person);
  const marginal_rate = new Decimal(person?.marginal_rate ?? 0);

  const decimals = currency.decimals ?? 2;

  // Sort chronologically
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  transactions.forEach(tx => {
    const dUnits = new Decimal(tx.units || 0);
    const dPrice = new Decimal(tx.price || 0);
    const isSell = tx.type === "SELL";

    if (!isSell) {
      const cost = dUnits.mul(dPrice);
      acbTotal = acbTotal.plus(cost);
      unitsRemaining = unitsRemaining.plus(dUnits);
    } else {
      if (unitsRemaining.gt(0)) {
        const acbPerUnit = acbTotal.div(unitsRemaining);
        const acbReduction = acbPerUnit.mul(dUnits);
        const proceeds = dUnits.mul(dPrice);

        realizedGain = realizedGain.plus(proceeds.minus(acbReduction));

        acbTotal = acbTotal.minus(acbReduction);
        unitsRemaining = unitsRemaining.minus(dUnits);
      }
    }

    const market = Helpers.getEffectiveMarketPrice(asset.key);
    if (market) {
      const dMarketPrice = new Decimal(market.price || 0);
      const signedUnits = isSell ? dUnits.neg() : dUnits;
      marketTotal = marketTotal.plus(signedUnits.mul(dMarketPrice));
    }
  });

  const acbPerUnit = unitsRemaining.gt(0)
    ? acbTotal.div(unitsRemaining)
    : new Decimal(0);

  const unrealizedGain = marketTotal.minus(acbTotal);

  let liquidation = marketTotal;
  if (isDeferred) {
    liquidation = marketTotal.mul(new Decimal(1).minus(marginal_rate));
  } else if (isCapitalGain) {
    const taxablePortion = unrealizedGain.mul(0.5).mul(marginal_rate);
    liquidation = marketTotal.minus(taxablePortion);
  }

  return {
    unitsRemaining,
    acbPerUnit,
    acbTotal,
    realizedGain,
    marketTotal,
    unrealizedGain,
    liquidation,
    decimals
  };
};

Helpers.accumulateSnapshotTotals = function (
  totals,
  group,
  metrics,
  allocations
) {
  const {
    summaryTotals,
    marketPersonTotals,
    liquidationPersonTotals,
    marketAccountTypeTotals,
    liquidationAccountTypeTotals,
    marketClassTotals,
    liquidationClassTotals,
    marketRegionTotals,
    liquidationRegionTotals
  } = totals;

  const { account, currency } = group;
  const {
    realizedGain,
    marketTotal,
    unrealizedGain,
    liquidation
  } = metrics;

  // --- PERSON TOTALS ---
  const personKey = group.account.person;

  if (!marketPersonTotals[personKey]) marketPersonTotals[personKey] = new Decimal(0);
  marketPersonTotals[personKey] = marketPersonTotals[personKey].plus(marketTotal);

  if (!liquidationPersonTotals[personKey]) liquidationPersonTotals[personKey] = new Decimal(0);
  liquidationPersonTotals[personKey] = liquidationPersonTotals[personKey].plus(liquidation);

  // --- ACCOUNT TYPE TOTALS ---
  const typeKey = group.account.type;

  if (!marketAccountTypeTotals[typeKey]) marketAccountTypeTotals[typeKey] = new Decimal(0);
  marketAccountTypeTotals[typeKey] = marketAccountTypeTotals[typeKey].plus(marketTotal);

  if (!liquidationAccountTypeTotals[typeKey]) liquidationAccountTypeTotals[typeKey] = new Decimal(0);
  liquidationAccountTypeTotals[typeKey] = liquidationAccountTypeTotals[typeKey].plus(liquidation);

  const currKey = currency.key;

  // Summary totals
  if (!summaryTotals[typeKey]) summaryTotals[typeKey] = {};
  if (!summaryTotals[typeKey][currKey]) {
    summaryTotals[typeKey][currKey] = {
      realized: new Decimal(0),
      market: new Decimal(0),
      unrealized: new Decimal(0),
      liquidation: new Decimal(0),
      currency: currKey
    };
  }

  summaryTotals[typeKey][currKey].realized =
    summaryTotals[typeKey][currKey].realized.plus(realizedGain);

  summaryTotals[typeKey][currKey].market =
    summaryTotals[typeKey][currKey].market.plus(marketTotal);

  summaryTotals[typeKey][currKey].unrealized =
    summaryTotals[typeKey][currKey].unrealized.plus(unrealizedGain);

  summaryTotals[typeKey][currKey].liquidation =
    summaryTotals[typeKey][currKey].liquidation.plus(liquidation);

  // Region/Class totals
  allocations.forEach(a => {
    const weight = new Decimal(a.weight || 0);
    const regionKey = a.region;
    const classKey = a.class;

    if (!marketRegionTotals[regionKey]) marketRegionTotals[regionKey] = new Decimal(0);
    marketRegionTotals[regionKey] =
      marketRegionTotals[regionKey].plus(marketTotal.mul(weight));

    if (!marketClassTotals[classKey]) marketClassTotals[classKey] = new Decimal(0);
    marketClassTotals[classKey] =
      marketClassTotals[classKey].plus(marketTotal.mul(weight));

    if (!liquidationRegionTotals[regionKey]) liquidationRegionTotals[regionKey] = new Decimal(0);
    liquidationRegionTotals[regionKey] =
      liquidationRegionTotals[regionKey].plus(liquidation.mul(weight));

    if (!liquidationClassTotals[classKey]) liquidationClassTotals[classKey] = new Decimal(0);
    liquidationClassTotals[classKey] =
      liquidationClassTotals[classKey].plus(liquidation.mul(weight));
  });
};