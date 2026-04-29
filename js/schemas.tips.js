// js/schemas.tips.js

Crud.Registry.register("tips", {
  tableBodySelector: "#tipsTableBody",
  entityName: "tip",
  primaryKey: "key",

  // Key = module + "_" + order
  makeKey(values) {
    const mod = values.module?.trim();
    const seq = values.sequence?.toString().trim();
    if (!mod || !seq) return "";
    return `${mod}_${seq}`;
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
      key: "sequence",
      type: "number",
      classBase: "sequence",
      showKey: true,
      required: true,
      display: w => w.sequence
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
    if (!values.module || !values.sequence) return false;

    if (!Number.isInteger(Number(values.sequence))) return false;

    return true;
  },

  transform(values) {
    // Assign composite key
    if (!values.key) {
      values.key = this.makeKey(values);
    }

    return values;
  }
});
