// js/crud.utils.js
window.Crud = window.Crud || {};

(function() {

  const Utils = {};

  Utils.el = function(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") el.className = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    children.forEach(c => {
      if (typeof c === "string") el.appendChild(document.createTextNode(c));
      else if (c instanceof Node) el.appendChild(c);
    });
    return el;
  };

  Utils.safeNumber = function(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  Utils.toPercent = function(v) {
    return new Decimal(v).times(100).toNumber();
  };

  Utils.fromPercent = function(v) {
    return new Decimal(v).div(100).toNumber();
  };

  window.Crud.Utils = Utils;

})();
