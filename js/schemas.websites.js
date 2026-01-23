// js/schemas.websites.js

Crud.Registry.register("websites", {
  tableBodySelector: "#websitesTableBody",
  entityName: "website",
  primaryKey: "key",

  // Key = module + "_" + order
  makeKey(values) {
    const mod = values.module?.trim();
    const seq = values.sequence?.toString().trim();
    if (!mod || !seq) return "";
    return `${mod}_${seq}`;
  },

  getCollection: () => portfolio.websites,

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
      display: w => t(w.module.toUpperCase())
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
      type: "text",
      classBase: "en",
      required: false,
      display: w => {
        if (!w.en) return "";
        return Helpers.DOM.create(
          "a",
          {
            href: w.en,
            target: "_blank",
            rel: "noopener noreferrer"
          },
          [w.en]
        );
      }
    },

    {
      key: "fr",
      type: "text",
      classBase: "fr",
      required: false,
      display: w => {
        if (!w.fr) return "";
        return Helpers.DOM.create(
          "a",
          {
            href: w.fr,
            target: "_blank",
            rel: "noopener noreferrer"
          },
          [w.fr]
        );
      }
    }
  ],

  validate(values) {
    if (!values.module || !values.sequence) return false;

    if (!Number.isInteger(Number(values.sequence))) return false;
    
    // Validate URLs if provided
    for (const lang of ["fr", "en"]) {
      const url = values[lang];
      if (url) {
        const normalized = Helpers.normalizeUrl(url);
        if (!Helpers.isValidUrl(normalized)) return false;
      }
    }

    return true;
  },

  transform(values) {
    // Assign composite key
    if (!values.key) {
      values.key = this.makeKey(values);
    }

    // Normalize URLs
    for (const lang of ["fr", "en"]) {
      if (values[lang]) {
        values[lang] = Helpers.normalizeUrl(values[lang]);
      }
    }

    return values;
  }
});
