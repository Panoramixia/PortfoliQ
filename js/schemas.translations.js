Crud.Registry.register("translations", {
  tableBodySelector: "#translationsTableBody",
  entityName: "translation",
  primaryKey: "key",

  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.translations,

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: t => t.key
    },

    {
      key: "en",
      type: "textarea",
      classBase: "en",
      required: true,
      display: t => t.en || ""
    },

    {
      key: "fr",
      type: "textarea",
      classBase: "fr",
      required: true,
      display: t => t.fr || ""
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
