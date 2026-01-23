// helpers.dom.js

// ------------------------------------------------------------
// DOM HELPERS
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

window.Helpers.DOM = {
  one(sel, root = document) {
    return root.querySelector(sel);
  },

  all(sel, root = document) {
    return [...root.querySelectorAll(sel)];
  },

  listen(sel, event, handler, root = document) {
    const el = root.querySelector(sel);
    if (el) el.addEventListener(event, handler);
  },

  delegate(rootSel, event, targetSel, handler) {
    const root = document.querySelector(rootSel);
    if (!root) return;

    root.addEventListener(event, (e) => {
      if (e.target.closest(targetSel)) handler(e);
    });
  },

  create(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (key === "class") el.className = value;
      else if (key === "dataset") {
        for (const [dkey, dval] of Object.entries(value)) {
          el.dataset[dkey] = dval;
        }
      } else if (key === "on") {
        for (const [event, handler] of Object.entries(value)) {
          el.addEventListener(event, handler);
        }
      } else {
        el.setAttribute(key, value);
      }
    }

    for (const child of children) {
      el.append(child instanceof Node ? child : document.createTextNode(child));
    }

    return el;
  },

  css(el, styles) {
    for (const key in styles) el.style[key] = styles[key];
    return el;
  },

  attr(el, attrs) {
    for (const key in attrs) el.setAttribute(key, attrs[key]);
    return el;
  }
};
