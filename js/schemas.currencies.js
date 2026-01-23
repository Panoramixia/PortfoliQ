// js/schemas.currencies.js

Crud.Registry.register("currencies", {
  tableBodySelector: "#currenciesTableBody",
  entityName: "currency",
  primaryKey: "key",

  // Currency key = ISO code (e.g., "CAD")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.currencies,

  // Other tables that reference currencies
  referencedBy: [
    { module: "accounts", field: "currency" },
    { module: "assets", field: "currency" },
    { module: "markets", field: "currency" },
    { module: "transactions", field: "currency" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: c => c.code
    },

    {
      key: "en",
      type: "text",
      classBase: "en",
      required: true,
      display: c => c.en
    },

    {
      key: "fr",
      type: "text",
      classBase: "fr",
      required: true,
      display: c => c.fr
    },

    {
      key: "symbol",
      type: "text",
      classBase: "symbol",
      required: true,
      display: c => c.symbol
    },

    {
      key: "decimals",
      type: "number",
      classBase: "decimals",
      required: true,
      min: 0,
      max: 6,
      step: 1,
      display: c => c.decimals
    }
  ],

  validate(values) {
    if (!values.code || !values.en || !values.fr || !values.symbol || !values.decimals) return false;

    const d = parseInt(values.decimals, 10);
    if (isNaN(d) || d < 0 || d > 6) return false;

    return true;
  },

  transform(values) {
    values.key = this.makeKey(values);

    // Normalize decimals
    values.decimals = parseInt(values.decimals, 10);

    return values;
  }
});
