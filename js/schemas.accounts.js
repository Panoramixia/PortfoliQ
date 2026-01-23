// js/schemas.accounts.js

// ------------------------------------------------------------
// ACCOUNTS SCHEMA (Key‑Based)
// ------------------------------------------------------------

Crud.Registry.register("accounts", {
  tableBodySelector: "#accountsTableBody",
  entityName: "account",
  primaryKey: "key",

  // Normalized name (unique)
  makeKey(values) {
    return values.name?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.accounts,

  // Other tables that reference accounts
  referencedBy: [
    { module: "assets", field: "account" },
    { module: "transactions", field: "account" }
  ],

  fields: [
    {
      key: "name",
      type: "text",
      classBase: "name",
      showKey: true,
      required: true,
      display: acc => acc.name
    },

    {
      key: "type",
      type: "dropdown",
      classBase: "type",
      required: true,
      options: () =>
        portfolio.accountTypes.map(at => ({
          value: at.key,
          label: Helpers.getLocalized(at)
        })),
      display: acc => {
        const type = portfolio.accountTypes.find(at => at.key === acc.type);
        return type ? Helpers.getLocalized(type) : "";
      }
    },

    {
      key: "currency",
      type: "dropdown",
      classBase: "currency",
      required: true,
      options: () =>
        portfolio.currencies.map(c => ({
          value: c.key,
          label: c.code
        })),
      display: acc => Helpers.getCurrencyCodeByKey(acc.currency)
    },

    {
      key: "institution",
      type: "dropdown",
      classBase: "institution",
      required: true,
      options: () =>
        portfolio.institutions.map(i => ({
          value: i.key,
          label: i.name
        })),
      display: acc => Helpers.getInstitutionNameByKey(acc.institution)
    },

    {
      key: "person",
      type: "dropdown",
      classBase: "person",
      required: true,
      options: () =>
        portfolio.persons
          .filter(p => p.active !== false)
          .map(p => ({ value: p.key, label: p.name })),
      display: acc => Helpers.getPersonNameByKey(acc.person)
    }
  ],

  validate(values) {
    if (!values.name || !values.type || !values.currency || !values.institution || !values.person)
      return false;

    if (!portfolio.currencies.find(c => c.key === values.currency)) return false;
    if (!portfolio.institutions.find(i => i.key === values.institution)) return false;
    if (!portfolio.persons.find(p => p.key === values.person)) return false;

    return true;
  },

  transform(values) {
    // Assign key based on name
    values.key = this.makeKey(values);
    return values;
  }
});
