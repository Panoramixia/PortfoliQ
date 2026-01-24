// js/schemas.assetRegions.js

Crud.Registry.register("assetRegions", {
  tableBodySelector: "#assetRegionsTableBody",
  entityName: "assetRegion",
  primaryKey: "key",

  // AssetRegion key = normalized name (e.g., "North America" → "north_america")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.assetRegions,

  // Other tables that reference assetRegions
  referencedBy: [
    { module: "etfs", field: "assetRegion" },
    { module: "assetFwts", field: "assetRegion" },
    { module: "assetAllocations", field: "region" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: r => r.code
    },

    {
      key: "en",
      type: "text",
      classBase: "en",
      required: true,
      display: r => r.en
    },

    {
      key: "en2",
      type: "textarea",
      classBase: "en2",
      required: false,
      display: r => r.en2 || ""
    },

    {
      key: "fr",
      type: "text",
      classBase: "fr",
      required: true,
      display: r => r.fr
    },

    {
      key: "fr2",
      type: "textarea",
      classBase: "fr2",
      required: false,
      display: r => r.fr2 || ""
    },

    {
      key: "color",
      type: "color",
      classBase: "color",
      required: true,
      default: "#000000",
      display: r => {
        if (!r.color) return "";
        return Helpers.DOM.create("span", {
          style: `
            display:inline-block;
            width:80px;
            height:16px;
            border-radius:3px;
            border:1px solid #000000;
            background:${r.color};
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
