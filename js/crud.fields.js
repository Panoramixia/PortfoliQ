// js/crud.fields.js
window.Crud = window.Crud || {};

(function() {

  const Fields = {};

  // ------------------------------------------------------------
  // Read fields from a row (new/edit)
  // ------------------------------------------------------------
  Fields.readFields = function(row, schema, mode) {
    const prefix = mode === "new" ? "new" : "edit";
    const result = {};

    schema.fields.forEach(field => {
      if (field.type === "computed" || field.type === "custom") return;

      const el = row.querySelector(`.${prefix}-${field.classBase}`);
      if (!el) return;

      if (field.type === "percent") {
        const v = el.value;
        result[field.key] = v === "" ? "" : Crud.Utils.fromPercent(v);
        return;
      }

      if (field.type === "number") {
        result[field.key] = el.value;
        return;
      }

      if (field.type === "color") {
        result[field.key] = el.value;
        return;
      }

      if (field.type === "checkbox") {
        result[field.key] = el.checked;
        return;
      }

      let value = el.value;
      if (field.type === "text" || field.type === "textarea") {
        value = value.trim();
      }

      result[field.key] = value;
    });

    return result;
  };

  // ------------------------------------------------------------
  // Build input for a field
  // ------------------------------------------------------------
  Fields.buildInput = function(field, value, mode) {
    const cls = `${mode}-${field.classBase}`;

    if (field.type === "text") {
      return Crud.Utils.el("input", {
        type: "text",
        class: cls,
        value: value ?? ""
      });
    }

    if (field.type === "textarea") {
      return Crud.Utils.el("textarea", { class: cls }, [value ?? ""]);
    }

    if (field.type === "percent") {
      // Apply schema default if value is empty
      let v = value;
      if (v === "" || v === null || v === undefined) {
        v = field.default ?? "";
      }

      return Crud.Utils.el("input", {
        type: "number",
        class: cls,
        value: v !== "" && v != null ? Crud.Utils.toPercent(v) : "",
        min: 0,
        max: 100,
        step: 0.01
      });
    }

    if (field.type === "number") {
      return Crud.Utils.el("input", {
        type: "number",
        class: cls,
        value: value ?? "",
        min: field.min ?? null,
        max: field.max ?? null,
        step: field.step ?? "1"
      });
    }

    if (field.type === "date") {
      return Crud.Utils.el("input", {
        type: "date",
        class: cls,
        value: value ?? ""
      });
    }

    if (field.type === "dropdown") {
      const select = Crud.Utils.el("select", { class: cls });
      const opts = field.options();
      opts.forEach(o => {
        const opt = Crud.Utils.el("option", { value: o.value }, [o.label]);
        if (o.value === value) opt.selected = true;
        select.appendChild(opt);
      });
      return select;
    }

    if (field.type === "color") {
      return Crud.Utils.el("input", {
        type: "color",
        class: cls,
        value: value ?? field.default ?? "#000000"
      });
    }

    if (field.type === "checkbox") {
      return Crud.Utils.el("input", {
        type: "checkbox",
        class: cls,
        checked: !!value
      });
    }

    if (field.type === "computed") {
      return Crud.Utils.el("span", { class: cls }, [
        field.compute ? field.compute(value || {}) : ""
      ]);
    }

    return Crud.Utils.el("span", {}, ["?"]);
  };

  window.Crud.Fields = Fields;

})();
