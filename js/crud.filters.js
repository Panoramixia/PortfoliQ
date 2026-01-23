// js/crud.filters.js

window.Crud = window.Crud || {};

window.Crud.Filters = {
  populate(schema) {
    if (!schema.filters) return;

    const moduleName = schema.moduleName;

    // Ensure nested config exists
    if (!config.filters[moduleName]) {
      config.filters[moduleName] = {};
    }

    schema.filters.forEach(f => {
      const el = document.querySelector(`#${moduleName}_filter_${f.key}`);
      if (!el) return;

      // ------------------------------------------------------------
      // NUMBER INPUT
      // ------------------------------------------------------------
      if (f.type === "number") {
        el.value = config.filters[moduleName][f.key] ?? "";

        el.oninput = () => {
          config.filters[moduleName][f.key] = el.value;
          saveToStorage();
          Crud.Core.renderModule(moduleName);
        };

        return; // skip dropdown logic
      }

      // ------------------------------------------------------------
      // RANGE + NUMBER combo INPUT
      // ------------------------------------------------------------
      if (f.type === "range") {
        const slider = document.querySelector(`#${moduleName}_filter_${f.key}_slider`);
        const number = document.querySelector(`#${moduleName}_filter_${f.key}_number`);

        const stored = config.filters[moduleName][f.key];
        const current = stored !== undefined ? stored * 100 : (f.min ?? 0);

        slider.value = current;
        number.value = current;

        const update = val => {
          const pct = val / 100;
          config.filters[moduleName][f.key] = pct;

          slider.value = val;
          number.value = val;

          saveToStorage();
          Crud.Core.renderModule(moduleName);
        };

        slider.oninput = () => update(slider.value);
        number.oninput = () => update(number.value);

        return; // skip select logic
      }

      // ------------------------------------------------------------
      // SELECT INPUT (default)
      // ------------------------------------------------------------
      el.innerHTML = "";

      const opts = f.options ? f.options() : [];
      opts.forEach(opt => {
        const o = new Option(opt.label, opt.value);
        el.appendChild(o);
      });

      const currentValue = config.filters[moduleName][f.key];

      if (f.multiple) {
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        [...el.options].forEach(o => {
          o.selected = selectedValues.includes(o.value);
        });
      } else {
        el.value = currentValue ?? "";
      }

      el.onchange = () => {
        if (f.multiple) {
          const selected = [...el.selectedOptions].map(o => o.value);
          config.filters[moduleName][f.key] = selected;
        } else {
          config.filters[moduleName][f.key] = el.value;
        }

        saveToStorage();
        Crud.Core.renderModule(moduleName);
      };
    });
  }
};
