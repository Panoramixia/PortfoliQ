// js/schemas.institutions.js

Crud.Registry.register("institutions", {
  tableBodySelector: "#institutionsTableBody",
  entityName: "institution",
  primaryKey: "key",

  // Institution key = uppercase code (e.g., "TD", "BMO", "VANGUARD")
  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.institutions,

  // Other tables that reference institutions
  referencedBy: [
    { module: "accounts", field: "institution" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: inst => inst.code
    },

    {
      key: "name",
      type: "text",
      classBase: "name",
      required: true,
      display: inst => inst.name
    },

    {
      key: "url",
      type: "text",
      classBase: "url",
      required: false,
      display: inst => {
        if (!inst.url) return "";
        return Helpers.DOM.create(
          "a",
          {
            href: inst.url,
            target: "_blank",
            rel: "noopener noreferrer"
          },
          [inst.url]
        );
      }
    }
  ],

  validate(values) {
    if (!values.code || !values.name) return false;

    if (values.url) {
      const normalized = Helpers.normalizeUrl(values.url);
      if (!Helpers.isValidUrl(normalized)) return false;
    }

    return true;
  },

  transform(values) {
    // Assign institution key
    values.key = this.makeKey(values);

    if (values.url) {
      values.url = Helpers.normalizeUrl(values.url);
    }

    return values;
  }
});
