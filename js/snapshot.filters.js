// js/snapshot.filters.js

window.Helpers = window.Helpers || {};

Helpers.snapshotGroupPassesFilters = function (group, config, portfolio) {
  const { account, asset } = group;

  const selectedPersons = config.filters.snapshot.persons || [];
  const selectedAccountTypes = config.filters.snapshot.accountTypes || [];
  const selectedClasses = config.filters.snapshot.classes || [];
  const selectedRegions = config.filters.snapshot.regions || [];

  if (selectedPersons.length > 0 && !selectedPersons.includes(account.person))
    return false;

  if (selectedAccountTypes.length > 0 && !selectedAccountTypes.includes(account.type))
    return false;

  const allocations = portfolio.assetAllocations.filter(a => a.asset === asset.key);

  if (selectedClasses.length > 0) {
    if (!allocations.some(a => selectedClasses.includes(a.class))) return false;
  }

  if (selectedRegions.length > 0) {
    if (!allocations.some(a => selectedRegions.includes(a.region))) return false;
  }

  return true;
};
