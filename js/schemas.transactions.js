// js/schemas.transactions.js

// ------------------------------------------------------------
// TRANSACTIONS SCHEMA (Key‑Based, Schema‑Driven CRUD)
// ------------------------------------------------------------

Crud.Registry.register("transactions", {
  tableBodySelector: "#transactionsTableBody",
  entityName: "transaction",
  primaryKey: "key",

  // Composite key: date ^ type ^ account ^ asset ^ units ^ price
  makeKey(values) {
    const date = values.date?.trim() || "";
    const type = values.type || "";
    const account = values.account || "";
    const asset = values.asset || "";
    const units = values.units || "";
    const price = values.price || "";

    return `${date}^${type}^${account}^${asset}^${units}^${price}`;
  },

  getCollection: () => portfolio.transactions,

  // Other tables that reference transactions (usually none)
  referencedBy: [],

  fields: [
    {
      key: "date",
      type: "date",
      classBase: "date",
      showKey: true,
      required: true,
      display: tx => tx.date
    },

    {
      key: "type",
      type: "dropdown",
      classBase: "type",
      showKey: true,
      required: true,
      options: () =>
        portfolio.transactionTypes.map(tt => ({
          value: tt.key,
          label: Helpers.getLocalized(tt)
        })),
      display: tx => {
        const type = portfolio.transactionTypes.find(tt => tt.key === tx.type);
        return type ? Helpers.getLocalized(type) : "";
      }
    },

    {
      key: "account",
      type: "dropdown",
      classBase: "account",
      showKey: true,
      required: true,
      options: () =>
        portfolio.accounts
          .filter(a => {
            const p = portfolio.persons.find(p => p.key === a.person);
            return p && p.active !== false;
          })
          .map(a => ({ value: a.key, label: a.name })),
      display: tx => Helpers.getAccountNameByKey(tx.account)
    },

    {
      key: "asset",
      type: "dropdown",
      classBase: "asset",
      showKey: true,
      required: true,
      options: () =>
        portfolio.assets.map(h => ({
          value: h.key,
          label: h.code
        })),
      display: tx => {
        const h = portfolio.assets.find(h => h.key === tx.asset);
        return h ? h.code : "";
      }
    },

    {
      key: "units",
      type: "number",
      classBase: "units",
      showKey: true,
      required: true,
      min: 0,
      step: "0.00000001",
      display: tx => tx.units
    },

    {
      key: "price",
      type: "number",
      classBase: "price",
      showKey: true,
      required: true,
      min: 0,
      step: "0.00000001",
      display: tx => tx.price
    },

    {
      key: "amount",
      type: "custom",
      classBase: "amount",
      sortable: false,
      compute: tx => {
        if (!tx || !tx.asset || !tx.price || !tx.units) return "";

        const price = parseFloat(tx.price);
        const units = parseFloat(tx.units);

        const asset = portfolio.assets.find(h => h.key === tx.asset);
        if (!asset) return "";

        const amount = Helpers.computeAmount(price, units, asset.currency);
        return Helpers.formatByCurrency(amount, asset.currency);
      },

      display: (tx, mode) => {
        if (mode === "new") {
          return Helpers.DOM.create("span", { class: "new-amount" }, [""]);
        }

        const asset = portfolio.assets.find(h => h.key === tx.asset);
        if (!asset) {
          return Helpers.DOM.create("span", { class: "amount" }, ["0.00"]);
        }

        // Compute amount if missing
        const amountValue = tx.amount != null
          ? tx.amount
          : Helpers.computeAmount(tx.price, tx.units, asset.currency);

        const formatted = Helpers.formatByCurrency(amountValue, asset.currency);

        // Determine CSS class
        const isSell = tx.type === "SELL";
        const cls = isSell ? "loss" : "gain";

        return Helpers.DOM.create("span", { class: `edit-amount ${cls}` }, [formatted]);
      }
    },

    {
      key: "currency",
      type: "custom",
      classBase: "currency",
      display: (tx, mode) => {
        if (mode === "new") {
          return Helpers.DOM.create("span", { class: "new-currency" }, [""]);
        }

        const asset = portfolio.assets.find(h => h.key === tx.asset);
        const currency = asset
          ? portfolio.currencies.find(c => c.key === asset.currency)
          : null;

        const text = currency ? `${currency.symbol} (${currency.code})` : "";

        const cls = mode === "edit" ? "edit-currency" : "currency";

        return Helpers.DOM.create("span", { class: cls }, [text]);
      }
    }
  ],

  validate(values) {
    if (!values.date || !values.type || !values.account || !values.asset) return false;

    const price = parseFloat(values.price);
    const units = parseFloat(values.units);
    if (isNaN(price) || isNaN(units)) return false;

    if (!Helpers.validateTransactionCurrency(values.account, values.asset)) {
      alert(t("currency_mismatch"));
      return false;
    }

    return true;
  },

  transform(values) {
    // Only assign key if it's a NEW transaction
    if (!values.key) {
      values.key = this.makeKey(values);
    }

    values.price = parseFloat(values.price);
    values.units = parseFloat(values.units);

    const asset = portfolio.assets.find(h => h.key === values.asset);
    const currencyKey = asset ? asset.currency : null;

    const rawAmount = Helpers.computeAmount(values.price, values.units, currencyKey);
    values.amount = values.type === "SELL" ? -rawAmount : rawAmount;

    return values;
  },

  onRendered(tbody, schema) {
    // EDIT rows
    tbody.querySelectorAll("tr[data-key]").forEach(tr => {
      wireTransactionRow(tr, "edit");
    });

    // ADD row
    const addRow = tbody.querySelector("tr.new-row");
    if (addRow) {
      wireTransactionRow(addRow, "new");
    }
  }
});

function wireTransactionRow(tr, mode) {
  const typeInput    = tr.querySelector(`.${mode}-type`);
  const priceInput   = tr.querySelector(`.${mode}-price`);
  const unitsInput   = tr.querySelector(`.${mode}-units`);
  const assetInput   = tr.querySelector(`.${mode}-asset`);
  const amountCell   = tr.querySelector(`.${mode}-amount`);
  const currencyCell = tr.querySelector(`.${mode}-currency`);

  if (!priceInput || !unitsInput || !assetInput || !amountCell || !currencyCell) {
    return; // row not fully ready
  }

  const updateTypeClass = () => {
    if (!typeInput) return;
    const isSell = typeInput.value === "SELL";
    amountCell.classList.toggle("loss", isSell);
    amountCell.classList.toggle("gain", !isSell);
  };

  const updateAmount = () => {
    const price = parseFloat(priceInput.value);
    const units = parseFloat(unitsInput.value);

    const asset = portfolio.assets.find(a => a.key === assetInput.value);
    const currencyKey = asset ? asset.currency : null;

    const isSell = typeInput && typeInput.value === "SELL";

    const rawAmount =
      !isNaN(price) && !isNaN(units)
        ? price * units
        : 0;

    const amount = isSell ? -rawAmount : rawAmount;

    amountCell.textContent = Helpers.formatByCurrency(amount, currencyKey);
  };

  const updateCurrency = () => {
    const asset = portfolio.assets.find(a => a.key === assetInput.value);
    if (!asset) {
      currencyCell.textContent = "";
      return;
    }

    const currency = portfolio.currencies.find(c => c.key === asset.currency);
    currencyCell.textContent = currency
      ? `${currency.symbol} (${currency.code})`
      : "";
  };

  // Attach listeners
  if (typeInput) {
    typeInput.addEventListener("change", () => {
      updateTypeClass();
      updateAmount();
    });
  }
  priceInput.addEventListener("input", updateAmount);
  unitsInput.addEventListener("input", updateAmount);
  assetInput.addEventListener("change", () => {
    updateTypeClass();
    updateCurrency();
    updateAmount();
  });

  // Initialize immediately
  updateTypeClass();
  updateCurrency();
  updateAmount();
}