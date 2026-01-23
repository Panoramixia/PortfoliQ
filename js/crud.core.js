// js/crud.core.js
window.Crud = window.Crud || {};

(function() {

  const Core = {};

  function getPrimaryKey(schema) {
    return schema.primaryKey || "key";
  }

  function computeKey(schema, values) {
    if (typeof schema.makeKey === "function") {
      return schema.makeKey(values);
    }
    return values[schema.primaryKey || "key"];
  }

  // ------------------------------------------------------------
  // Render module
  // ------------------------------------------------------------
  Core.renderModule = function(moduleName) {
    const schema = Crud.Registry.modules[moduleName];
    const tbody = Helpers.DOM.one(schema.tableBodySelector);
    if (!tbody) return;

    tbody.innerHTML = "";

    let list = schema.getCollection();

    // Apply filters
    if (schema.filter) {
      list = list.filter(schema.filter);
    }

    // ------------------------------------------------------------
    // APPLY SORTING
    // ------------------------------------------------------------
    const sortState = config.sort[moduleName];
    if (sortState && sortState.column) {
      list = Helpers.sortList([...list], sortState.column, sortState.asc);
    }

    // Render rows
    list.forEach(item => {
      tbody.appendChild(Crud.Table.buildDisplayRow(schema, item));
    });

    // Add-row
    if (!schema.readOnly) {
      tbody.appendChild(Crud.Table.buildAddRow(schema));
    }

    applyTranslations();
    Crud.Filters.populate(schema);
    
    if (schema.onRendered) {
      schema.onRendered(tbody, schema);
    }

    // Update sort indicators
    if (sortState && sortState.column) {
      Helpers.updateSortIndicators(
        schema.tableBodySelector.replace("Body", ""),
        sortState.column,
        sortState.asc
      );
    }
  };

  // ------------------------------------------------------------
  // Add entity (auto-key)
  // ------------------------------------------------------------
  Core.addEntity = function(moduleName) {
    const schema = Crud.Registry.modules[moduleName];
    if (schema.readOnly) return;
    const pk = getPrimaryKey(schema);

    const tbody = Helpers.DOM.one(schema.tableBodySelector);
    const addRow = tbody.lastElementChild;

    const values = Crud.Fields.readFields(addRow, schema, "new");

    // Compute key automatically
    const key = computeKey(schema, values);
    if (!key) {
      alert(t("please_fill_fields"));
      return;
    }
    values[pk] = key;

    // Ensure unique key
    const collection = schema.getCollection();
    const duplicate = collection.some(e => e[pk] === key);
    if (duplicate) {
      alert(t("duplicate_key") || "Duplicate key");
      return;
    }

    const v = Crud.Validation.validate(schema, values);
    if (v !== true) {
      alert(typeof v === "string" ? v : t("please_fill_fields"));
      return;
    }

    const newEntity = { ...values };
    if (schema.transform) schema.transform(newEntity);

    collection.push(newEntity);

    Helpers.commit(saveToStorage, moduleName);
  };

  // ------------------------------------------------------------
  // Edit entity
  // ------------------------------------------------------------
  Core.editEntity = function(moduleName, key) {
    const schema = Crud.Registry.modules[moduleName];
    if (schema.readOnly) return;
    const pk = getPrimaryKey(schema);

    const tbody = Helpers.DOM.one(schema.tableBodySelector);
    const tr = tbody.querySelector(`tr[data-key="${key}"]`);

    const entity = schema.getCollection().find(x => x[pk] === key);
    if (!entity || !tr) return;

    const editRow = Crud.Table.buildEditRow(schema, entity);
    tr.replaceWith(editRow);

    applyTranslations();
    
    if (schema.onRendered) {
      schema.onRendered(tbody, schema);
    }
  };

  // ------------------------------------------------------------
  // Save entity (key immutable)
  // ------------------------------------------------------------
  Core.saveEntity = function(moduleName, key) {
    const schema = Crud.Registry.modules[moduleName];
    if (schema.readOnly) return;
    const pk = getPrimaryKey(schema);

    const tbody = Helpers.DOM.one(schema.tableBodySelector);
    const tr = tbody.querySelector(`tr[data-key="${key}"]`);
    if (!tr) return;

    let values = Crud.Fields.readFields(tr, schema, "edit");

    // Recompute key
    const newKey = computeKey(schema, values);

    if (newKey !== key) {
      alert(t("key_cannot_change") || "Key cannot be changed");
      return;
    }

    values[pk] = key;

    const v = Crud.Validation.validate(schema, values);
    if (v !== true) {
      alert(typeof v === "string" ? v : t("please_fill_fields"));
      return;
    }

    const collection = schema.getCollection();
    const index = collection.findIndex(x => x[pk] === key);
    if (index === -1) return;

    const updated = { ...collection[index], ...values };
    if (schema.transform) schema.transform(updated);

    collection[index] = updated;

    Helpers.commit(saveToStorage, moduleName);
  };

  // ------------------------------------------------------------
  // Delete entity (referential integrity)
  // ------------------------------------------------------------
  Core.deleteEntity = function(moduleName, key, confirmKey) {
    if (!confirm(t(confirmKey))) return;

    const schema = Crud.Registry.modules[moduleName];
    if (schema.readOnly) return;
    const pk = getPrimaryKey(schema);
    const collection = schema.getCollection();

    const entity = collection.find(x => x[pk] === key);
    if (!entity) return;

    // Referential integrity
    if (schema.referencedBy) {
      for (const ref of schema.referencedBy) {
        const otherSchema = Crud.Registry.modules[ref.module];
        if (!otherSchema) continue;

        const otherCollection = otherSchema.getCollection();
        const used = otherCollection.some(row => row[ref.field] === key);

        if (used) {
          alert(
            t("cannot_delete_in_use") ||
            `Cannot delete: this ${schema.entityName} is used in ${ref.module}`
          );
          return;
        }
      }
    }

    const index = collection.findIndex(x => x[pk] === key);
    if (index === -1) return;

    collection.splice(index, 1);

    Helpers.commit(saveToStorage, moduleName);
  };

  window.Crud.Core = Core;

})();
