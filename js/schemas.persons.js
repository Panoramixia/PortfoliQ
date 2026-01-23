// js/schemas.persons.js

// ------------------------------------------------------------
// PERSONS SCHEMA (Key‑Based)
// ------------------------------------------------------------

Crud.Registry.register("persons", {
  tableBodySelector: "#personsTableBody",
  entityName: "person",
  primaryKey: "key",

  // Normalized name (unique)
  // Example: "John Doe" → "JOHN_DOE"
  makeKey(values) {
    return values.name?.trim().toUpperCase().replace(/\s+/g, "_");
  },

  getCollection: () => portfolio.persons,

  // Other tables that reference persons
  referencedBy: [
    { module: "accounts", field: "person" }
  ],

  fields: [
    {
      key: "name",
      type: "text",
      classBase: "name",
      showKey: true,
      required: true,
      display: p => p.name
    },

    {
      key: "type",
      type: "dropdown",
      classBase: "type",
      required: true,
      options: () =>
        portfolio.personTypes.map(pt => ({
          value: pt.key,
          label: Helpers.getLocalized(pt)
        })),
      display: p => {
        const type = portfolio.personTypes.find(pt => pt.key === p.type);
        return type ? Helpers.getLocalized(type) : "";
      }
    },

    {
      key: "dob",
      type: "date",
      classBase: "dob",
      required: true,
      display: p => p.dob
    },

    {
      key: "age",
      type: "computed",
      classBase: "age",
      required: false,
      compute: p => Helpers.calculateAge(p.dob),
      display: p => Helpers.calculateAge(p.dob)
    },

    {
      key: "marginal_rate",
      type: "percent",
      classBase: "marginal_rate",
      required: false,
      min: 0,
      max: 100,
      step: 0.01,
      display: p => {
        const v = p.marginal_rate != null ? p.marginal_rate : 0;   // fallback to 0
        return `${new Decimal(v).times(100).toNumber()}%`;
      }
    },

    {
      key: "color",
      type: "color",
      classBase: "color",
      required: true,
      default: "#000000",
      display: p => {
        if (!p.color) return "";
        return Helpers.DOM.create("span", {
          style: `
            display:inline-block;
            width:80px;
            height:16px;
            border-radius:3px;
            border:1px solid #000000;
            background:${p.color};
          `
        });
      }
    }
  ],

  validate(values) {
    if (!values.name || !values.type || !values.dob) return false;

    const marginal_rate = parseFloat(values.marginal_rate);
    if (isNaN(marginal_rate) || marginal_rate < 0 || marginal_rate > 1) {
      return t("percent_invalid");
    }

    return true;
  },

  transform(values) {
    if (!values.key) {
      values.key = this.makeKey(values);
    }
    // age is computed automatically

    // percent already converted in readFields()
    values.marginal_rate = parseFloat(values.marginal_rate);

    return values;
  },

  onRendered(tbody, schema) {
    // --- ADD ROW ---
    const addRow = tbody.lastElementChild;
    const dobAdd = addRow.querySelector(".new-dob");
    const ageAdd = addRow.querySelector(".new-age");

    if (dobAdd && ageAdd) {
      dobAdd.addEventListener("input", () => {
        ageAdd.textContent = Helpers.calculateAge(dobAdd.value);
      });
    }

    // --- EDIT ROWS ---
    tbody.querySelectorAll("tr[data-key]").forEach(tr => {
      const dobEdit = tr.querySelector(".edit-dob");
      const ageEdit = tr.querySelector(".edit-age");

      if (dobEdit && ageEdit) {
        dobEdit.addEventListener("input", () => {
          ageEdit.textContent = Helpers.calculateAge(dobEdit.value);
        });
      }
    });
  }
});
