// js/schemas.etfRelations.js

// ------------------------------------------------------------
// ETF RELATIONS SCHEMA (Key‑Based, Schema‑Driven CRUD)
// ------------------------------------------------------------

Crud.Registry.register("etfRelations", {
  tableBodySelector: "#etfRelationsTableBody",
  entityName: "etfRelation",
  primaryKey: "key",

  // Composite key: parentKey^childKey
  makeKey(values) {
    return `${values.parent}^${values.child}`;
  },

  getCollection: () => portfolio.etfRelations,

  // Other tables that reference ETF relations (usually none)
  referencedBy: [],

  fields: [
    {
      key: "parent_etf",
      type: "dropdown",
      classBase: "parent_etf",
      showKey: true,
      required: true,
      options: () =>
        portfolio.etfs.map(e => ({
          label: e.code,
          value: e.key        // 🔥 use key, not id
        })),
      display: r => {
        const parent = portfolio.etfs.find(x => x.key === r.parent_etf);
        return parent ? parent.code : "";
      }
    },

    {
      key: "child_etf",
      type: "dropdown",
      classBase: "child_etf",
      showKey: true,
      required: true,
      options: () =>
        portfolio.etfs.map(e => ({
          label: e.code,
          value: e.key        // 🔥 use key, not id
        })),
      display: r => {
        const child = portfolio.etfs.find(x => x.key === r.child_etf);
        return child ? child.code : "";
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
      display: r => `${new Decimal(r.weight).times(100).toNumber()}%`
    }
  ],

  validate(values) {
    // prevent parent = child
    if (values.parent_etf === values.child) {
      return t("etf_relation_both_same");
    }

    // prevent cycles A → B → A
    if (Helpers.doesRelationCreateCycle(values.parent_etf, values.child_etf, portfolio.etfRelations)) {
      return t("etf_relation_loop");
    }

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
