// js/schemas.assetAllocations.js

// ------------------------------------------------------------
// ASSET ALLOCATIONS SCHEMA (Key‑Based, Schema‑Driven CRUD)
// ------------------------------------------------------------

Crud.Registry.register("assetAllocations", {
  tableBodySelector: "#assetAllocationsTableBody",
  entityName: "assetAllocation",
  primaryKey: "id",

  // Composite key: assetKey^classKey^regionKey
  makeKey(values) {
    return `${values.asset}^${values.class}^${values.region}`;
  },

  getCollection: () => portfolio.assetAllocations,

  // Other tables referencing this module (none yet)
  referencedBy: [],

  fields: [
    {
      key: "asset",
      type: "dropdown",
      classBase: "asset",
      showKey: true,
      required: true,
      options: () =>
        portfolio.assets.map(a => ({
          value: a.key,
          label: a.code
        })),
      display: aa => {
        const a = portfolio.assets.find(x => x.key === aa.asset);
        return a ? a.code : "";
      }
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
      display: aa => {
        const c = portfolio.assetClasses.find(x => x.key === aa.class);
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
          label: r.name,
          value: r.key
        })),
      display: aa => {
        const r = portfolio.assetRegions.find(x => x.key === aa.region);
        return r ? r.name : "";
      }
    },

    {
      key: "weight",
      type: "percent",
      classBase: "weight",
      required: true,
      min: 0,
      max: 100,
      step: 0.01,
      display: a => {
        const v = a.weight != null ? a.weight : 0;   // fallback to 0
        return `${new Decimal(v).times(100).toNumber()}%`;
      }
    }
  ],

  validate(values) {
    if (!values.asset || !values.class || !values.region) return false;

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
