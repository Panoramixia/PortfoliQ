// js/crud.table.js
window.Crud = window.Crud || {};

(function() {

  const Table = {};

  // Safely append DOM or text
  function appendSafe(td, content) {
    if (content instanceof HTMLElement) {
      td.appendChild(content);
    } else if (content === null || content === undefined) {
      td.textContent = "";
    } else {
      td.textContent = String(content);
    }
  }

  // ------------------------------------------------------------
  // Build display row
  // ------------------------------------------------------------
  Table.buildDisplayRow = function(schema, entity) {
    const pk = schema.primaryKey || "key";
    const key = entity[pk];

    const tr = Crud.Utils.el("tr", { "data-key": key });

    // Hidden key column
    tr.appendChild(Crud.Utils.el("td", { style: "display:none" }, [key]));

    schema.fields.forEach(field => {
      const td = Crud.Utils.el("td");
      let content;

      if (field.type === "custom") {
        content = field.display(entity, "view");
      } else if (field.type === "computed") {
        content = field.compute(entity);
      } else {
        content = field.display
          ? field.display(entity, "view")
          : (entity[field.key] ?? "");
      }

      appendSafe(td, content);
      tr.appendChild(td);
    });

    if (!schema.readOnly) {
      const tdActions = Crud.Utils.el("td");
      tdActions.appendChild(Helpers.actionButton("edit", schema.moduleName, key));
      tdActions.appendChild(Helpers.actionButton("delete", schema.moduleName, key));
      tr.appendChild(tdActions);
    }

    return tr;
  };

  // ------------------------------------------------------------
  // Build add row
  // ------------------------------------------------------------
  Table.buildAddRow = function(schema) {
    const tr = Crud.Utils.el("tr");
    tr.classList.add("new-row");

    // Hidden key column
    tr.appendChild(Crud.Utils.el("td", { style: "display:none" }));

    schema.fields.forEach(field => {
      const td = Crud.Utils.el("td");

      if (field.type === "custom") {
        appendSafe(td, field.display({}, "new"));
      } else {
        appendSafe(td, Crud.Fields.buildInput(field, "", "new"));
      }

      tr.appendChild(td);
    });

    const tdActions = Crud.Utils.el("td");
    tdActions.appendChild(Helpers.actionButton("add", schema.moduleName));
    tr.appendChild(tdActions);

    return tr;
  };

  // ------------------------------------------------------------
  // Build edit row
  // ------------------------------------------------------------
  Table.buildEditRow = function(schema, entity) {
    const pk = schema.primaryKey || "key";
    const key = entity[pk];

    const tr = Crud.Utils.el("tr", { "data-key": key });

    // Hidden key column
    tr.appendChild(Crud.Utils.el("td", { style: "display:none" }, [key]));

    schema.fields.forEach(field => {
      const td = Crud.Utils.el("td");

      if (field.type === "custom") {
        appendSafe(td, field.display(entity, "edit"));
      } else {
        appendSafe(td, Crud.Fields.buildInput(field, entity[field.key], "edit"));
      }

      tr.appendChild(td);
    });

    const tdActions = Crud.Utils.el("td");
    tdActions.appendChild(Helpers.actionButton("save", schema.moduleName, key));
    tdActions.appendChild(Helpers.actionButton("cancel", schema.moduleName, key));
    tr.appendChild(tdActions);

    return tr;
  };

  window.Crud.Table = Table;

})();
