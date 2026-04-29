// js/schemas.rebalanceGoals.js

// ------------------------------------------------------------
// REBALANCE GOALS SCHEMA (Key‑Based, Schema‑Driven CRUD)
// ------------------------------------------------------------

Crud.Registry.register("rebalanceGoals", {
  tableBodySelector: "#rebalanceGoalsTableBody",
  entityName: "rebalanceGoal",
  primaryKey: "id",

  // Composite key: assetKey^classKey^regionKey
  makeKey(values) {
    return `${values.person}^${values.class}^${values.region}`;
  },

  getCollection: () => portfolio.rebalanceGoals,

  // Other tables referencing this module (none yet)
  referencedBy: [],

  fields: [
    {
      key: "person",
      type: "dropdown",
      classBase: "person",
      showKey: true,
      required: true,
      options: () =>
        portfolio.persons
          .filter(p => p.active !== false)
          .map(p => ({ value: p.key, label: p.name })),
      display: rg => Helpers.getPersonNameByKey(rg.person)
    },

    {
      key: "class",
      type: "dropdown",
      classBase: "class",
      showKey: true,
      required: true,
      options: () =>
        portfolio.assetClasses.map(c => ({
          value: c.key,
          label: Helpers.getLocalized(c)
          })),
      display: rg => {
        const c = portfolio.assetClasses.find(x => x.key === rg.class);
        return c ? Helpers.getLocalized(c) : "";
      }
    },

    {
      key: "region",
      type: "dropdown",
      classBase: "region",
      showKey: true,
      required: true,
      options: () =>
        portfolio.assetRegions.map(r => ({
          label: r.code,
          value: r.key
        })),
      display: rg => {
        const r = portfolio.assetRegions.find(x => x.key === rg.region);
        return r ? Helpers.getLocalized(r) : "";
      }
    },

    {
      key: "goalpct",
      type: "percent",
      classBase: "goalpct",
      required: true,
      min: 0,
      max: 100,
      step: 0.01,
      display: a => {
        const v = a.goalpct != null ? a.goalpct : 0;   // fallback to 0
        return `${new Decimal(v).times(100).toNumber()}%`;
      }
    }
  ],

  validate(values) {
    if (!values.person || !values.class || !values.region) return false;

    const w = parseFloat(values.weight);
    if (isNaN(w) || w < 0 || w > 1) {
      return t("percent_invalid");
    }

    return true;
  },

  transform(values) {
    // Assign composite key
    values.key = this.makeKey(values);

    // percent already converted in readFields()
    values.weight = parseFloat(values.weight);

    return values;
  }
});
