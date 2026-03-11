/* ST4RT Product Details — Accordion */
(function () {
  function setPanelState(panel, btn, isOpen) {
    if (isOpen) {
      panel.setAttribute("data-open", "");
      panel.removeAttribute("hidden");
      panel.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
    } else {
      panel.removeAttribute("data-open");
      panel.setAttribute("hidden", "");
      panel.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
    }

    const sign = btn.querySelector("[data-pd-sign]");
    if (sign) sign.textContent = isOpen ? "−" : "+";
  }

  function initAccordion(root) {
    if (root.dataset.pdReady === "true") return;

    const acc = root.querySelector("[data-pd-accordion]");
    if (!acc) return;

    const toggles = Array.from(acc.querySelectorAll("[data-pd-toggle]"));
    const panels = Array.from(acc.querySelectorAll("[data-pd-panel]"));
    if (!toggles.length || !panels.length) return;

    function closeAll(exceptId) {
      toggles.forEach((btn) => {
        const controls = btn.getAttribute("aria-controls");
        const panel = controls ? acc.querySelector(`#${CSS.escape(controls)}`) : null;
        if (!panel) return;
        setPanelState(panel, btn, Boolean(exceptId && controls === exceptId));
      });
    }

    toggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        const panelId = btn.getAttribute("aria-controls");
        const panel = panelId ? acc.querySelector(`#${CSS.escape(panelId)}`) : null;
        if (!panel) return;

        const isOpen = panel.hasAttribute("data-open");
        if (isOpen) {
          setPanelState(panel, btn, false);
        } else {
          closeAll(panelId);
        }
      });
    });

    root.dataset.pdReady = "true";
  }

  function initAll(scope) {
    scope.querySelectorAll("[data-st4rt-pd]").forEach(initAccordion);
  }

  document.addEventListener("DOMContentLoaded", () => initAll(document));

  document.addEventListener("shopify:section:load", (event) => {
    if (!event.target) return;
    initAll(event.target);
  });
})();