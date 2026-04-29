// js/schemas.rebalanceRules.js

// ------------------------------------------------------------
// REBALANCE RULES SCHEMA (Key‑Based, Schema‑Driven CRUD)
// ------------------------------------------------------------

Crud.Registry.register("rebalanceRules", {
  tableBodySelector: "#rebalanceRulesTableBody",
  entityName: "rebalanceRule",
  primaryKey: "id",

  // Composite key: person^account^asset
  makeKey(values) {
    return `${values.person}^${values.account}^${values.asset}`;
  },

  getCollection: () => portfolio.rebalanceRules,

  referencedBy: [],

  fields: [
    {
      key: "person",
      type: "dropdown",
      classBase: "person",
      showKey: true,
      required: true,
      options: () => {
        const driftPersons = config.filters.rebalanceDrifts?.persons || [];

        let persons = portfolio.persons.filter(p => p.active !== false);

        if (driftPersons.length > 0) {
          persons = persons.filter(p => driftPersons.includes(p.key));
        }

        return persons.map(p => ({
          value: p.key,
          label: p.name
        }));
      },
      display: rr => Helpers.getPersonNameByKey(rr.person)
    },

    {
      key: "account",
      type: "dropdown",
      classBase: "account",
      showKey: true,
      required: true,
      options: rr => {
        const person = rr?.person;
        return portfolio.accounts
          .filter(a => !person || a.person === person)
          .map(a => ({
            value: a.key,
            label: a.name
          }));
      },
      display: rr => {
        const a = portfolio.accounts.find(x => x.key === rr.account);
        return a ? a.name : "";
      }
    },

    {
      key: "accountType",
      type: "readonly",
      classBase: "accountType",
      display: rr => {
        if (!rr?.account) return "";
        const a = portfolio.accounts.find(x => x.key === rr.account);
        if (!a) return "";

        const at = portfolio.accountTypes.find(t => t.key === a.type);
        return at ? Helpers.getLocalized(at) : "";
      }
    },

    {
      key: "asset",
      type: "dropdown",
      classBase: "asset",
      showKey: true,
      required: true,
      options: () =>
        portfolio.assets.map(a => ({
          value: a.key,
          label: a.code
        })),
      display: rr => {
        if (!rr?.asset) return "";
        return Helpers.getAssetCodeByKey(rr.asset);
      }
    },

    {
      key: "priority",
      type: "number",
      classBase: "priority",
      required: false,
      min: 1,
      step: 1,
      placeholder: "1 = highest priority",
      display: rr => rr.priority
    },

    {
      key: "maxBuy",
      type: "number",
      classBase: "maxBuy",
      required: false,
      min: 0,
      step: 0.01,
      placeholder: "0 = no buys",
      display: rr => rr.maxBuy != null ? rr.maxBuy : ""
    },

    {
      key: "maxSell",
      type: "number",
      classBase: "maxSell",
      required: false,
      min: 0,
      step: 0.01,
      placeholder: "0 = no sells",
      display: rr => rr.maxSell != null ? rr.maxSell : ""
    }
  ],

  validate(values) {
    if (!values.person || !values.account || !values.asset) {
      return t("missing_required_fields");
    }

    return true;
  },

  transform(values) {
    values.key = this.makeKey(values);

    // Priority: auto-assign next available if empty or invalid
    let p = parseInt(values.priority);

    if (isNaN(p) || p < 1) {
      const existing = portfolio.rebalanceRules.filter(r =>
        r.person === values.person &&
        r.account === values.account
      );
      values.priority = existing.length + 1;
    } else {
      values.priority = p;
    }

    // maxBuy: clamp to minimum 0
    let b = parseFloat(values.maxBuy);
    values.maxBuy = isNaN(b) || b < 0 ? 0 : b;

    // maxSell: clamp to minimum 0
    let s = parseFloat(values.maxSell);
    values.maxSell = isNaN(s) || s < 0 ? 0 : s;

    return values;
  },

  onRendered(tbody, schema) {
    const driftPersons = config.filters.rebalanceDrifts?.persons || [];

    // 1. Auto-select person based on filter
    if (driftPersons.length > 0) {
      tbody.querySelectorAll('select.new-person, select.edit-person').forEach(sel => {
        if (!sel.value || !driftPersons.includes(sel.value)) {
          sel.value = driftPersons[0];
          sel.dispatchEvent(new Event("change"));
        }
      });
    }

    // 2. When person changes, update the account dropdown directly
    tbody.querySelectorAll('select.new-person, select.edit-person').forEach(sel => {
      const refreshAccounts = () => {
        const tr = sel.closest("tr");
        if (!tr) return;

        const accountSel = tr.querySelector("select.new-account, select.edit-account");
        if (!accountSel) return;

        const person = sel.value;

        // Build new account options
        accountSel.innerHTML = "";
        portfolio.accounts
          .filter(a => a.person === person)
          .forEach(a => {
            const opt = new Option(a.name, a.key);
            accountSel.appendChild(opt);
          });

        // Trigger accountType update
        accountSel.dispatchEvent(new Event("change"));
      };

      // Update when user changes person
      sel.addEventListener("change", refreshAccounts);

      // Update once on initial load (fixes F5 issue)
      refreshAccounts();
    });

    // 3. Account change → update accountType
    tbody.querySelectorAll('select.new-account, select.edit-account').forEach(sel => {
      const updateAccountType = () => {
        const tr = sel.closest("tr");
        if (!tr) return;

        const accountKey = sel.value;
        const account = portfolio.accounts.find(a => a.key === accountKey);
        if (!account) return;

        const at = portfolio.accountTypes.find(t => t.key === account.type);

        const accountTd = sel.closest("td");
        if (!accountTd) return;

        const typeTd = accountTd.nextElementSibling;
        if (!typeTd) return;

        const span = typeTd.querySelector("span") || typeTd;
        span.textContent = at ? Helpers.getLocalized(at) : "";
      };

      updateAccountType();
      sel.addEventListener("change", updateAccountType);
    });
  }
});
