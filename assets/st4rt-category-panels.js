/* ST4RT Category Panels (v2)
   - Reveal on scroll (solo una vez)
   - wait_for_scroll: si true, no anima hasta que el usuario haga el primer scroll
   - Watermark auto-opuesto al botón: si activo, cambia posición L/R según button_align
*/

(() => {
  const sections = document.querySelectorAll('[data-st4rt-catpanels]');
  if (!sections.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function oppositePos(pos) {
    // Solo invertimos horizontalidad (L <-> R). Si es centro, se queda centro.
    if (pos === 'tl') return 'tr';
    if (pos === 'tr') return 'tl';
    if (pos === 'bl') return 'br';
    if (pos === 'br') return 'bl';
    return pos;
  }

  function applyWatermarkOpposite(panel) {
    const enabled = panel.getAttribute('data-watermark-opposite') === 'true';
    if (!enabled) return;

    const btnAlign = panel.getAttribute('data-button-align') || 'left';
    const wm = panel.querySelector('.st4rt-catpanel__watermark');
    if (!wm) return;

    const current = wm.getAttribute('data-wm-pos') || 'br';

    // Si el botón está a la izquierda, preferimos watermark a la derecha (TR/BR). Si está a la derecha, al revés.
    // Si el watermark ya está del lado correcto, no tocamos.
    const isLeftBtn = btnAlign === 'left';
    const wmIsLeft = current === 'tl' || current === 'bl';
    const wmIsRight = current === 'tr' || current === 'br';

    if (isLeftBtn && wmIsLeft) wm.setAttribute('data-wm-pos', oppositePos(current));
    if (!isLeftBtn && wmIsRight) wm.setAttribute('data-wm-pos', oppositePos(current));
  }

  function initSection(section) {
    const panels = section.querySelectorAll('[data-st4rt-panel]');
    panels.forEach(applyWatermarkOpposite);

    if (prefersReduced) {
      panels.forEach(p => p.classList.add('is-in'));
      return;
    }

    const waitForScroll = section.getAttribute('data-wait-scroll') === 'true';
    let unlocked = !waitForScroll;

    const unlockOnScrollOnce = () => {
      unlocked = true;
      window.removeEventListener('scroll', unlockOnScrollOnce, { passive: true });
      // después de desbloquear, forzamos check
      io && panels.forEach(p => io.observe(p));
    };

    if (!unlocked) {
      window.addEventListener('scroll', unlockOnScrollOnce, { passive: true, once: true });
    }

    const io = new IntersectionObserver((entries) => {
      if (!unlocked) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.22 });

    if (unlocked) {
      panels.forEach(p => io.observe(p));
    }
  }

  sections.forEach(initSection);
})();