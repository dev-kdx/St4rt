/* ST4RT Scroll Vertical Slides
   Marca el slide visible con IntersectionObserver para animaciones suaves (sin scroll listeners pesados).
*/
(() => {
  function initSVSC(root) {
    const slides = Array.from(root.querySelectorAll("[data-st4rt-svsc-slide]"));
    if (!slides.length) return;

    // Estado inicial: marca el primero para evitar “vacío” al cargar
    slides[0].classList.add("is-inview");

    const io = new IntersectionObserver(
      (entries) => {
        // Elegimos el más visible para evitar “parpadeos” si hay varios intersectando
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (!visible) return;

        slides.forEach((s) => s.classList.remove("is-inview"));
        visible.target.classList.add("is-inview");
      },
      {
        root: null,
        threshold: [0.25, 0.5, 0.75]
      }
    );

    slides.forEach((s) => io.observe(s));

    // Cleanup (por Theme Editor / rerenders)
    root._st4rtSvscCleanup = () => io.disconnect();
  }

  function boot() {
    document.querySelectorAll("[data-st4rt-svsc]").forEach((root) => {
      // Evita doble init si Shopify re-renderiza
      if (root._st4rtSvscCleanup) root._st4rtSvscCleanup();
      initSVSC(root);
    });
  }

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Shopify Theme Editor support (sin depender de APIs internas)
  document.addEventListener("shopify:section:load", boot);
  document.addEventListener("shopify:section:unload", (e) => {
    const root = e.target && e.target.querySelector && e.target.querySelector("[data-st4rt-svsc]");
    if (root && root._st4rtSvscCleanup) root._st4rtSvscCleanup();
  });
})();
