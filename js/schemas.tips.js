// js/schemas.tips.js

Crud.Registry.register("tips", {
  tableBodySelector: "#tipsTableBody",
  entityName: "tip",
  primaryKey: "key",

  // Key = module + "_" + order
  makeKey(values) {
    const mod = values.module?.trim();
    const fld = values.field.trim().toUpperCase().replace(/\s+/g, "_");
    const code = values.code?.toString().trim();
    if (!mod || !fld || !code) return "";
    return `${mod}_${fld}_${code}`;
  },

  getCollection: () => portfolio.tips,

  fields: [
    {
      key: "module",
      type: "dropdown",
      classBase: "module",
      showKey: true,
      required: true,
      options: () =>
        ALL_MODULES.map(m => ({
          value: m,
          label: t(m.toUpperCase())
        })),
      display: row => t(row.module.toUpperCase())
    },

    {
      key: "field",
      type: "text",
      classBase: "field",
      showKey: true,
      required: true,
      display: row => row.field
    },

    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: t => t.code
    },

    {
      key: "en",
      type: "textarea",
      classBase: "en",
      required: false,
      display: t => t.en || ""
    },

    {
      key: "fr",
      type: "textarea",
      classBase: "fr",
      required: false,
      display: t => t.fr || ""
    }
  ],

  validate(values) {
    if (!values.module || !values.field || !values.code) return false;

    return true;
  },

  transform(values) {
    if (values.field) { 
      values.field = values.field.trim().toUpperCase().replace(/\s+/g, "_"); 
    }

    // Assign composite key
    if (!values.key) {
      values.key = this.makeKey(values);
    }

    return values;
  }
});
