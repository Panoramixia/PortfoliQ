// js/crud.registry.js

window.Crud = window.Crud || {};

(function() {

  const Registry = {
    modules: {},

    register(name, schema) {
      schema.moduleName = name;
      this.modules[name] = schema;

      // ------------------------------------------------------------
      // 1. Auto-generate controller functions
      // ------------------------------------------------------------
      const renderFn = `render_${name}`;
      window[renderFn] = () => Crud.Core.renderModule(name);

      if (!schema.readOnly) {
        const addFn     = `add_${name}`;
        const editFn    = `edit_${name}`;
        const saveFn    = `save_${name}`;
        const cancelFn  = `cancel_${name}`;
        const deleteFn  = `delete_${name}`;

        window[addFn]     = () => Crud.Core.addEntity(name);
        window[editFn]    = key => Crud.Core.editEntity(name, key);
        window[saveFn]    = key => Crud.Core.saveEntity(name, key);
        window[cancelFn]  = () => window[renderFn]();
        window[deleteFn]  = key =>
          Crud.Core.deleteEntity(name, key, "delete_confirm_item");

        // ------------------------------------------------------------
        // 2. Auto-register ActionHandlers
        // ------------------------------------------------------------
        window.ActionHandlers[name] = {
          add: window[addFn],
          edit: window[editFn],
          save: window[saveFn],
          cancel: window[cancelFn],
          delete: window[deleteFn]
        };
      }

      // ------------------------------------------------------------
      // 3. Auto-generate section + filters + table
      // ------------------------------------------------------------
      const sectionId = name;
      let section = document.getElementById(sectionId);

      if (!section) {
        section = document.createElement("section");
        section.id = sectionId;
        section.classList.add("section");

        // Title
        const h2 = document.createElement("h2");
        const titleKey = schema.labelKey || schema.label || name;
        h2.textContent = t(titleKey);
        h2.setAttribute("data-i18n", titleKey);
        section.appendChild(h2);

        // ------------------------------------------------------------
// FILTERS (schema-driven, with row support)
// ------------------------------------------------------------
if (schema.filters && schema.filters.length > 0) {
  const filterBox = document.createElement("div");
  filterBox.id = `${name}Filters`;
  filterBox.classList.add("filters");

  // Group filters by row number
  const rows = {};
  schema.filters.forEach(f => {
    const r = f.row || 1;
    if (!rows[r]) rows[r] = [];
    rows[r].push(f);
  });

  // Render each row
  Object.keys(rows).sort().forEach(rowNum => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("filter-row");

    rows[rowNum].forEach(f => {
      const group = document.createElement("div");
      group.classList.add("filter-group");

      const label = document.createElement("label");
      label.setAttribute("for", `${name}_filter_${f.key}`);
      label.setAttribute("data-i18n", f.label);
      label.textContent = t(f.label);
      group.appendChild(label);

      let inputEl;

      if (f.type === "number") {
        inputEl = document.createElement("input");
        inputEl.type = "number";
        inputEl.id = `${name}_filter_${f.key}`;
      }
      else if (f.type === "range") {
        const wrapper = document.createElement("div");
        wrapper.classList.add("marginal-rate-control");

        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.id = `${name}_filter_${f.key}`;
        wrapper.appendChild(hidden);

        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = `${name}_filter_${f.key}_slider`;
        wrapper.appendChild(slider);

        const number = document.createElement("input");
        number.type = "number";
        number.id = `${name}_filter_${f.key}_number`;
        wrapper.appendChild(number);

        const span = document.createElement("span");
        span.textContent = "%";
        wrapper.appendChild(span);

        inputEl = wrapper;
      }
      else {
        const select = document.createElement("select");
        select.id = `${name}_filter_${f.key}`;

        if (f.multiple) {
          select.multiple = true;
          select.size = 4; // optional, makes it look like a list instead of a tiny box
        }

        inputEl = select;
      }

      group.appendChild(inputEl);
      rowDiv.appendChild(group);
    });

    filterBox.appendChild(rowDiv);
  });

  section.appendChild(filterBox);
}


        // ------------------------------------------------------------
        // CHARTS BEFORE TABLE
        // ------------------------------------------------------------
        if (schema.charts) {
          schema.charts
            .filter(c => c.position === "before-table")
            .forEach(c => {
              const chartBox = document.createElement("div");
              chartBox.id = c.container;

              const canvas = document.createElement("canvas");
              canvas.id = c.id;

              chartBox.appendChild(canvas);
              section.appendChild(chartBox);
            });
        }

        // ------------------------------------------------------------
        // TABLE
        // ------------------------------------------------------------
        const table = document.createElement("table");
        table.id = `${name}Table`;

        // Thead
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");

        // Hidden key column
        const thKey = document.createElement("th");
        thKey.style.display = "none";
        tr.appendChild(thKey);

        // Column headers
        schema.fields.forEach(field => {
          const th = document.createElement("th");

          // Enable sorting unless explicitly disabled
          if (field.sortable !== false) {
            th.dataset.sort = field.key;
          }

          // Blue # indicator (optional)
          if (field.showKey) {
            const keySpan = document.createElement("span");
            keySpan.classList.add("key");
            keySpan.textContent = "#";
            th.appendChild(keySpan);
          }

          // Red * indicator (optional)
          if (field.required) {
            const reqSpan = document.createElement("span");
            reqSpan.classList.add("required");
            reqSpan.textContent = "*";
            th.appendChild(reqSpan);
          }

          // Label span
          const labelSpan = document.createElement("span");
          labelSpan.classList.add("label");
          const labelKey = field.labelKey || field.label || field.key;
          labelSpan.textContent = t(labelKey);
          labelSpan.setAttribute("data-i18n", labelKey);
          th.appendChild(labelSpan);

          // Sort indicator span
          if (field.sortable !== false) {
            const sortSpan = document.createElement("span");
            sortSpan.classList.add("sort-indicator");
            th.appendChild(sortSpan);
          }

          tr.appendChild(th);
        });

        // Actions column
        if (!schema.readOnly) {
          const thActions = document.createElement("th");
          tr.appendChild(thActions);
        }

        thead.appendChild(tr);
        table.appendChild(thead);

        // Tbody
        const tbody = document.createElement("tbody");
        tbody.id = `${name}TableBody`;
        table.appendChild(tbody);

        section.appendChild(table);

        // ------------------------------------------------------------
        // CHARTS AFTER TABLE
        // ------------------------------------------------------------
        if (schema.charts) {
          schema.charts
            .filter(c => c.position === "after-table")
            .forEach(c => {
              const chartBox = document.createElement("div");
              chartBox.id = c.container;

              const canvas = document.createElement("canvas");
              canvas.id = c.id;

              chartBox.appendChild(canvas);
              section.appendChild(chartBox);
            });
        }

        // Insert into DOM
        document.querySelector("#mainContent").appendChild(section);

        // Enable sorting AFTER table exists
        const tableSelector = schema.tableSelector || `#${name}Table`;
        Helpers.enableSorting(
          name,
          tableSelector,
          window[renderFn]
        );
      }
    }
  };

  window.Crud.Registry = Registry;

})();