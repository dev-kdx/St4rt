(() => {
  const SELECTOR = '[data-reveal-once]';

  function reveal(el) {
    if (!el || el.classList.contains('is-in')) return;
    el.classList.add('is-in');
  }

  function boot(root = document) {
    const els = root.querySelectorAll(SELECTOR);
    if (!els.length) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      els.forEach(reveal);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      els.forEach(reveal);
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    els.forEach(el => io.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot());
  } else {
    boot();
  }

  // Shopify theme editor: cuando agregas/recargas una sección
  document.addEventListener('shopify:section:load', (e) => {
    boot(e.target);
  });
})();

