// js/schemas.assets.js

Crud.Registry.register("assets", {
  tableBodySelector: "#assetsTableBody",
  entityName: "asset",
  primaryKey: "key",

  // Asset key = uppercase symbol (e.g., "AAPL", "VTI")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.assets,

  // Other tables that reference assets
  referencedBy: [
    { module: "markets", field: "asset" },
    { module: "accounts", field: "asset" },
    { module: "transactions", field: "asset" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: h => h.code
    },

    {
      key: "name",
      type: "text",
      classBase: "name",
      required: true,
      display: h => h.name
    },

    {
      key: "currency",
      type: "dropdown",
      classBase: "currency",
      required: true,
      options: () =>
        portfolio.currencies.map(c => ({
          value: c.key,
          label: c.code
        })),
      display: h => Helpers.getCurrencyCodeByKey(h.currency)
    },

    {
      key: "url",
      type: "text",
      classBase: "url",
      required: false,
      display: h => {
        if (!h.url) return "";
        return Helpers.DOM.create(
          "a",
          {
            href: h.url,
            target: "_blank",
            rel: "noopener noreferrer"
          },
          [h.url]
        );
      }
    }
  ],

  validate(values) {
    if (!values.code || !values.name || !values.currency) return false;

    // Ensure currency exists
    const currency = portfolio.currencies.find(c => c.key === values.currency);
    if (!currency) return false;

    if (values.url) {
      const normalized = Helpers.normalizeUrl(values.url);
      if (!Helpers.isValidUrl(normalized)) return false;
    }

    return true;
  },

  transform(values) {
    // Assign asset key
    values.key = this.makeKey(values);

    // Normalize URL
    if (values.url) {
      values.url = Helpers.normalizeUrl(values.url);
    }

    return values;
  }
});
