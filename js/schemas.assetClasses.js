// js/schemas.assetClasses.js

Crud.Registry.register("assetClasses", {
  tableBodySelector: "#assetClassesTableBody",
  entityName: "assetClass",
  primaryKey: "key",

  // asset class key = normalized code (e.g., "Equities" → "EQUITIES")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.assetClasses,

  // Other tables that will reference asset classes
  referencedBy: [
    { module: "assetAllocations", field: "class" },
    { module: "etfs", field: "class" }
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
      key: "color",
      type: "color",
      classBase: "color",
      required: true,
      default: "#000000",
      display: c => {
        if (!c.color) return "";
        return Helpers.DOM.create("span", {
          style: `
            display:inline-block;
            width:80px;
            height:16px;
            border-radius:3px;
            border:1px solid #000000;
            background:${c.color};
          `
        });
      }
    }
  ],

  validate(values) {
    if (!values.code || !values.en || !values.fr) return false;
    return true;
  },

  transform(values) {
    if (!values.key) {
      values.key = this.makeKey(values);
    }
    return values;
  }
});
