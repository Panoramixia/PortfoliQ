// js/crud.validation.js
window.Crud = window.Crud || {};

(function() {

  const Validation = {};

  Validation.validate = function(schema, values) {
    for (const field of schema.fields) {

      // Required fields: allow 0, disallow empty string/null/undefined
      if (field.required && (values[field.key] === "" || values[field.key] === null || values[field.key] === undefined)) {
        return `${field.key} is required`;
      }

      // Percent fields: stored as 0–1
      if (field.type === "percent") {
        const v = parseFloat(values[field.key]);
        if (isNaN(v) || v < 0 || v > 1) {
          return `${t("percent_invalid")}: ${t(field.key)}`;
        }
      }
    }
    return true;
  };

  window.Crud.Validation = Validation;

})();
