// js/schemas.accountTypes.js

Crud.Registry.register("accountTypes", {
  tableBodySelector: "#accountTypesTableBody",
  entityName: "accountType",
  primaryKey: "key",

  makeKey(values) {
    return values.code?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.accountTypes,

  referencedBy: [
    { module: "accounts", field: "type" }
  ],

  fields: [
    {
      key: "code",
      type: "text",
      classBase: "code",
      showKey: true,
      required: true,
      display: at => at.code
    },

    {
      key: "en",
      type: "text",
      classBase: "en",
      required: true,
      display: at => at.en
    },

    {
      key: "fr",
      type: "text",
      classBase: "fr",
      required: true,
      display: at => at.fr
    },

    {
      key: "is_tax_free",
      type: "checkbox",
      classBase: "is_tax_free",
      required: false,
      display: at => at.is_tax_free ? "✓" : ""
    },

    {
      key: "is_tax_deferred",
      type: "checkbox",
      classBase: "is_tax_deferred",
      required: false,
      display: at => at.is_tax_deferred ? "✓" : ""
    },

    {
      key: "is_capital_gain",
      type: "checkbox",
      classBase: "is_capital_gain",
      required: false,
      display: at => at.is_capital_gain ? "✓" : ""
    },

    {
      key: "is_usa_withholding_waived",
      type: "checkbox",
      classBase: "is_usa_withholding_waived",
      required: false,
      display: at => at.is_usa_withholding_waived ? "✓" : ""
    },

    {
      key: "color",
      type: "color",
      classBase: "color",
      required: true,
      default: "#000000",
      display: at => {
        if (!at.color) return "";
        return Helpers.DOM.create("span", {
          style: `
            display:inline-block;
            width:80px;
            height:16px;
            border-radius:3px;
            border:1px solid #000000;
            background:${at.color};
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
