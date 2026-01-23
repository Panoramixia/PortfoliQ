// js/schemas.etfs.js

// ------------------------------------------------------------
// ETFS SCHEMA (Key‑Based, Schema‑Driven CRUD)
// ------------------------------------------------------------

Crud.Registry.register("etfs", {
  tableBodySelector: "#etfsTableBody",
  entityName: "etf",
  primaryKey: "key",

  // ETF key = uppercase code (e.g., "VTI")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.etfs,

  // Other tables that reference ETFs
  referencedBy: [
    { module: "etfRelations", field: "parent" },
    { module: "etfRelations", field: "child" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: e => e.code
    },
    
    {
      key: "name",
      type: "text",
      classBase: "name",
      required: true,
      display: e => e.name
    },

    {
      key: "class",
      type: "dropdown",
      classBase: "class",
      required: true,
      options: () =>
        portfolio.assetClasses.map(c => ({
          value: c.key,
          label: Helpers.getLocalized(c)
          })),
      display: e => {
        const c = portfolio.assetClasses.find(x => x.key === e.class);
        return c ? Helpers.getLocalized(c) : "";
      }
    },

    {
      key: "domicile",
      type: "dropdown",
      classBase: "domicile",
      required: true,
      options: () =>
        portfolio.countries.map(c => ({
          value: c.key,
          label: Helpers.getLocalized(c)
        })),
      display: e => {
        const country = portfolio.countries.find(c => c.key === e.domicile);
        return country ? Helpers.getLocalized(country) : "";
      }
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
      display: e => Helpers.getCurrencyCodeByKey(e.currency)
    },

    {
      key: "region",
      type: "dropdown",
      classBase: "region",
      required: true,
      options: () =>
        portfolio.assetRegions.map(r => ({
          label: Helpers.getLocalized(r),
          value: r.key
        })),
      display: e => {
        const r = portfolio.assetRegions.find(x => x.key === e.region);
        return r ? Helpers.getLocalized(r) : "";
      }
    },

    {
      key: "mer",
      type: "percent",
      classBase: "mer",
      required: true,
      display: e => new Decimal(e.mer).times(100).toNumber()
    },

    {
      key: "yield_dividend",
      type: "percent",
      classBase: "yield_dividend",
      required: true,
      display: e => new Decimal(e.yield_dividend).times(100).toNumber()
    },

    {
      key: "yield_interest",
      type: "percent",
      classBase: "yield_interest",
      required: true,
      display: e => new Decimal(e.yield_interest).times(100).toNumber()
    },

    {
      key: "url",
      type: "text",
      classBase: "url",
      required: false,
      display: e => {
        if (!e.url) return "";
        return Helpers.DOM.create(
          "a",
          {
            href: e.url,
            target: "_blank",
            rel: "noopener noreferrer"
          },
          [e.url]
        );
      }
    }
  ],

  validate(values) {
    const mer = parseFloat(values.mer);
    const yd = parseFloat(values.yield_dividend);
    const yi = parseFloat(values.yield_interest);

    if (isNaN(mer) || mer < 0 || mer > 1) return t("percent_invalid");
    if (isNaN(yd) || yd < 0 || yd > 1) return t("percent_invalid");
    if (isNaN(yi) || yi < 0 || yi > 1) return t("percent_invalid");

    if (values.url) {
      const normalized = Helpers.normalizeUrl(values.url);
      if (!Helpers.isValidUrl(normalized)) return false;
    }

    return true;
  },

  transform(values) {
    // Assign ETF key
    values.key = this.makeKey(values);

    // Percent fields already converted in readFields()
    values.mer = parseFloat(values.mer);
    values.yield_dividend = parseFloat(values.yield_dividend);
    values.yield_interest = parseFloat(values.yield_interest);

    if (values.url) {
      values.url = Helpers.normalizeUrl(values.url);
    }

    return values;
  }
});
