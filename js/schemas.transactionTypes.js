// js/schemas.transactionTypes.js

Crud.Registry.register("transactionTypes", {
  tableBodySelector: "#transactionTypesTableBody",
  entityName: "transactionType",
  primaryKey: "key",

  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.transactionTypes,

  referencedBy: [
    { module: "transactions", field: "type" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: tt => tt.code
    },

    {
      key: "en",
      type: "text",
      classBase: "en",
      required: true,
      display: tt => tt.en
    },

    {
      key: "fr",
      type: "text",
      classBase: "fr",
      required: true,
      display: tt => tt.fr
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
