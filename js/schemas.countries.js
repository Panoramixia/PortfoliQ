// js/schemas.countries.js

Crud.Registry.register("countries", {
  tableBodySelector: "#countriesTableBody",
  entityName: "country",
  primaryKey: "key",

  // country key = normalized name (e.g., "North America" → "north_america")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.countries,

  // Other tables that reference countries
  referencedBy: [
    { module: "etfs", field: "domicile" }
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
    }
  ],

  validate(values) {
    if (!values.code || !values.en || !values.fr) return false;

    return true;
  },

  transform(values) {
    values.key = this.makeKey(values);
    return values;
  }
});
