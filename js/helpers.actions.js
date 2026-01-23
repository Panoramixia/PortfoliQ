// helpers.actions.js

// ------------------------------------------------------------
// GLOBAL ACTION HANDLER (ONE DELEGATED LISTENER)
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || !btn.dataset.action || !btn.dataset.section) return;

  const action = btn.dataset.action;
  const section = btn.dataset.section;
  const index = btn.dataset.index;

  // Look up the handler table for this section
  const handlers = window.ActionHandlers?.[section];
  if (!handlers) return;

  if (action === "add") return handlers.add();
  if (action === "edit") return handlers.edit(index);
  if (action === "save") return handlers.save(index);
  if (action === "cancel") return handlers.cancel(index);
  if (action === "delete") return handlers.delete(index);
});

// Registry for all module handlers
window.ActionHandlers = {};
