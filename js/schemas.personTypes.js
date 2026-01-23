// js/schemas.personTypes.js

Crud.Registry.register("personTypes", {
  tableBodySelector: "#personTypesTableBody",
  entityName: "personType",
  primaryKey: "key",

  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.personTypes,

  referencedBy: [
    { module: "persons", field: "type" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: pt => pt.code
    },

    {
      key: "en",
      type: "text",
      classBase: "en",
      required: true,
      display: pt => pt.en
    },

    {
      key: "fr",
      type: "text",
      classBase: "fr",
      required: true,
      display: pt => pt.fr
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
