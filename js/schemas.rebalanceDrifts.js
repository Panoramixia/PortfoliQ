// js/schemas.rebalanceDrifts.js

// ------------------------------------------------------------
// REBALANCE DRIFTS (Read‑Only, Computed)
// ------------------------------------------------------------

Crud.Registry.register("rebalanceDrifts", {
  readOnly: true,
  label: "rebalanceDrifts",
  tableBodySelector: "#rebalanceDriftsTableBody",

  getCollection: () => Helpers.computeRebalanceDrifts(),

  filters: [
    {
      key: "persons",
      label: "persons",
      multiple: true,
      row: 1,
      options: () =>
        portfolio.persons.map(p => ({
          label: p.name,
          value: p.key
        }))
    }
  ],

  fields: [
    {
      key: "person",
      label: "person",
      sortable: false,
      display: rd => Helpers.getPersonNameByKey(rd.person)
    },
    {
      key: "class",
      label: "class",
      sortable: false,
      display: rd => {
        const c = portfolio.assetClasses.find(x => x.key === rd.class);
        return c ? Helpers.getLocalized(c) : "";
      }
    },
    {
      key: "region",
      label: "region",
      sortable: false,
      display: rd => {
        const r = portfolio.assetRegions.find(x => x.key === rd.region);
        return r ? Helpers.getLocalized(r) : "";
      }
    },

    {
      key: "liquidationPct",
      label: "liquidationpct",
      sortable: false,
      display: row => (row.liquidationPct * 100).toFixed(2) + "%"
    },

    {
      key: "goalPct",
      label: "goalpct",
      sortable: false,
      display: row => (row.goalPct * 100).toFixed(2) + "%"
    },

    {
      key: "driftPct",
      label: "driftpct",
      sortable: false,
      display: row => (row.driftPct * 100).toFixed(2) + "%"
    },

    {
      key: "action",
      label: "action",
      sortable: false
    },

    {
      key: "amount",
      label: "amount",
      sortable: false,
      display: row => {
        const span = document.createElement("span");
        span.className = row.amount >= 0 ? "gain" : "loss";
        span.textContent = Helpers.formatByCurrency(row.amount, row.currency);
        return span;
      }
    }
  ]
});
