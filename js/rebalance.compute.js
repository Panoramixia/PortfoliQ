// js/rebalance.compute.js

window.Helpers = window.Helpers || {};

Helpers.computeRebalanceDrifts = function () {

  const snapshot = Helpers.computeSnapshotRows();
  const accounts = portfolio.accounts;
  const allocs   = portfolio.assetAllocations;
  const goals    = portfolio.rebalanceGoals;

  // 1. account → person
  const accountToPerson = Object.fromEntries(
    accounts.map(a => [a.key, a.person])
  );

  // 2. asset → [ { class, region, weight }, ... ]
  const assetToAllocations = {};
  allocs.forEach(a => {
    if (!assetToAllocations[a.asset]) {
      assetToAllocations[a.asset] = [];
    }
    assetToAllocations[a.asset].push({
      class: a.class,
      region: a.region,
      weight: a.weight // 0–1
    });
  });

  // 3. aggregate liquidation by person^class^region
  const buckets = {};

  snapshot.forEach(row => {
    const person = accountToPerson[row.account];
    if (!person) return;

    const allocations = assetToAllocations[row.asset];
    if (!allocations || allocations.length === 0) {
      // asset not classified in assetAllocations → you could
      // optionally bucket this as "UNCLASSIFIED"
      return;
    }

    allocations.forEach(alloc => {
      const { class: cls, region, weight } = alloc;
      const key = `${person}^${cls}^${region}`;

      if (!buckets[key]) {
        buckets[key] = {
          person,
          class: cls,
          region,
          liquidation: 0,
          currency: row.currency
        };
      }

      // distribute liquidation according to allocation weight
      buckets[key].liquidation += row.liquidation * weight;
    });
  });

  // 4. total liquidation per person
  const totalByPerson = {};
  Object.values(buckets).forEach(b => {
    totalByPerson[b.person] = (totalByPerson[b.person] || 0) + b.liquidation;
  });

  // 5. goals: person^class^region → goalpct
  const goalMap = {};
  goals.forEach(g => {
    const key = `${g.person}^${g.class}^${g.region}`;
    goalMap[key] = g.goalpct; // 0–1
  });

  // 6. build final rows
  const rows = [];

  Object.entries(buckets).forEach(([key, b]) => {
    // ---------------------------------------------
    // Apply module filters
    // ---------------------------------------------
    const selectedPersons = config.filters.rebalanceDrifts.persons || [];

    if (selectedPersons.length > 0 && !selectedPersons.includes(b.person)) {
      return; // skip this row
    }

    const total = totalByPerson[b.person];
    const liquidationPct = total > 0 ? b.liquidation / total : 0;

    const goalPct = goalMap[key] ?? 0;
    const driftPct = liquidationPct - goalPct;

    let action = t("balanced");
    let amount = 0;

    if (!(key in goalMap)) {
      action = t("missing_goal");
    } else {
      const threshold = 0.01; // 1%
      if (driftPct > threshold) action = t("sell");
      else if (driftPct < -threshold) action = t("buy");

      const targetValue = total * goalPct;
      amount = targetValue - b.liquidation;
    }

    rows.push({
      person: b.person,
      class: b.class,
      region: b.region,
      liquidationPct,
      goalPct,
      driftPct,
      action,
      amount,
      currency: b.currency
    });
  });

  rows.sort((a, b) => {
    // 1. sort by person (localized name)
    const nameA = Helpers.getPersonNameByKey(a.person);
    const nameB = Helpers.getPersonNameByKey(b.person);
    if (nameA !== nameB) {
      return nameA.localeCompare(nameB);
    }

    // 2. sort by class (localized)
    const classA = Helpers.getLocalized(
      portfolio.assetClasses.find(c => c.key === a.class)
    );
    const classB = Helpers.getLocalized(
      portfolio.assetClasses.find(c => c.key === b.class)
    );
    if (classA !== classB) {
      return classA.localeCompare(classB);
    }

    // 3. sort by region (localized)
    const regionA = Helpers.getLocalized(
      portfolio.assetRegions.find(r => r.key === a.region)
    );
    const regionB = Helpers.getLocalized(
      portfolio.assetRegions.find(r => r.key === b.region)
    );
    if (regionA !== regionB) {
      return regionA.localeCompare(regionB);
    }

    // 4. sort by goalPct (descending)
    if (a.goalPct !== b.goalPct) {
      return b.goalPct - a.goalPct;
    }
  });

  return rows;
};
