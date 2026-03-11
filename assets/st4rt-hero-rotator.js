(() => {
  const SELECTOR = '[data-st4rt-hero]';
  const DESKTOP_MQ = '(min-width: 768px)';

  function safeJSON(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  function getActiveVideo(root) {
    const isDesktop = window.matchMedia(DESKTOP_MQ).matches;
    const desktopEl = root.querySelector('.st4rt-hide-mobile');
    const mobileEl  = root.querySelector('.st4rt-hide-desktop');
    return { isDesktop, desktopEl, mobileEl, activeEl: isDesktop ? desktopEl : mobileEl, inactiveEl: isDesktop ? mobileEl : desktopEl };
  }

  function ensureHeadLink(rel, href) {
    if (!href) return;
    const key = `${rel}:${href}`;
    if (document.head.querySelector(`link[data-st4rt="${CSS.escape(key)}"]`)) return;

    const l = document.createElement('link');
    l.rel = rel;
    l.href = href;
    l.as = rel === 'preload' ? 'video' : undefined;
    l.type = 'video/mp4';
    l.setAttribute('data-st4rt', key);
    document.head.appendChild(l);
  }

  function setVideoSrc(videoEl, src, preloadMode = 'metadata') {
    if (!videoEl || !src) return;
    if (videoEl.dataset.src === src) return;

    videoEl.dataset.src = src;
    videoEl.preload = preloadMode;
    videoEl.src = src;

    // load() solo cuando cambiamos src
    try { videoEl.load(); } catch (e) {}

    const p = videoEl.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  function clearVideo(videoEl) {
    if (!videoEl) return;
    // Vaciar src evita descargas innecesarias del video "inactivo"
    videoEl.removeAttribute('src');
    videoEl.dataset.src = '';
    try { videoEl.load(); } catch (e) {}
  }

  function setHTML(el, html) {
    if (!el) return;
    el.innerHTML = html || '';
  }

  function setButton(btnEl, text, url) {
    if (!btnEl) return;
    if (text && url) {
      btnEl.textContent = text;
      btnEl.href = url;
      btnEl.style.display = 'inline-flex';
    } else {
      btnEl.removeAttribute('href');
      btnEl.style.display = 'none';
    }
  }

  function initHero(root) {
    const id = root.getAttribute('data-section-id');
    const dataEl = document.getElementById(`st4rt-hero-data-${id}`);
    if (!dataEl) return;

    const slides = safeJSON(dataEl.textContent);
    if (!slides || !slides.length) return;

    const h1El = root.querySelector('[data-h1]');
    const h2El = root.querySelector('[data-h2]');
    const btnEl = root.querySelector('[data-btn]');

    const autoplay = (root.getAttribute('data-autoplay') || 'true') === 'true';
    const loopSlides = (root.getAttribute('data-loop') || 'true') === 'true';

    let index = 0;
    let timer = null;
    let started = false;
    let inView = false;
    let prefetchT = null;

    const stopTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    const scheduleNext = (ms) => {
      stopTimer();
      if (!autoplay || !inView) return;
      let duration = Number(ms || 6000);
      if (duration < 1500) duration = 1500;
      timer = window.setTimeout(next, duration);
    };

    const prefetchNext = () => {
      if (prefetchT) window.clearTimeout(prefetchT);
      prefetchT = window.setTimeout(() => {
        const nextIndex = (index + 1 >= slides.length) ? (loopSlides ? 0 : null) : index + 1;
        if (nextIndex === null) return;

        const s = slides[nextIndex];
        const { isDesktop } = getActiveVideo(root);
        const url = isDesktop ? s.desktop_video : s.mobile_video;

        // Prefetch suave (baja prioridad)
        ensureHeadLink('prefetch', url);
      }, 500);
    };

    function render(i, { preloadActive = 'metadata' } = {}) {
      const s = slides[i];
      if (!s) return;

      root.classList.add('is-fading');
      root.classList.remove('is-anim-in');

      setHTML(h1El, s.h1);
      setHTML(h2El, s.h2);
      setButton(btnEl, s.button_text, s.button_url);

      // reinicia animación
      void root.offsetWidth;
      window.setTimeout(() => root.classList.add('is-anim-in'), 30);

      const { activeEl, inactiveEl, isDesktop } = getActiveVideo(root);

      // IMPORTANT: solo cargamos el video activo
      const activeSrc = isDesktop ? s.desktop_video : s.mobile_video;
      setVideoSrc(activeEl, activeSrc, preloadActive);

      // el inactivo queda vacío, no descarga nada
      clearVideo(inactiveEl);

      window.setTimeout(() => root.classList.remove('is-fading'), 220);

      scheduleNext(s.duration_ms);
      prefetchNext();
    }

    function next() {
      index += 1;
      if (index >= slides.length) {
        if (!loopSlides) return;
        index = 0;
      }
      render(index);
    }

    function syncViewportVideo() {
      if (!started) return;
      const s = slides[index];
      if (!s) return;

      const { activeEl, inactiveEl, isDesktop } = getActiveVideo(root);
      const src = isDesktop ? s.desktop_video : s.mobile_video;

      setVideoSrc(activeEl, src, 'metadata');
      clearVideo(inactiveEl);

      prefetchNext();
    }

    const onEnterView = () => {
      inView = true;
      if (!started) {
        started = true;

        // Precarga fuerte del PRIMER video (solo el activo)
        const first = slides[0];
        const { isDesktop } = getActiveVideo(root);
        const firstSrc = isDesktop ? first.desktop_video : first.mobile_video;
        ensureHeadLink('preload', firstSrc);

        render(0, { preloadActive: 'auto' });
      } else {
        // reanudar si vuelve a entrar en viewport
        const { activeEl } = getActiveVideo(root);
        try { activeEl.play(); } catch (e) {}
        const s = slides[index];
        scheduleNext(s && s.duration_ms);
      }
    };

    const onExitView = () => {
      inView = false;
      stopTimer();
      if (prefetchT) window.clearTimeout(prefetchT);

      const { desktopEl, mobileEl } = getActiveVideo(root);
      try { desktopEl && desktopEl.pause(); } catch (e) {}
      try { mobileEl && mobileEl.pause(); } catch (e) {}
    };

    // Observer para iniciar/pausar
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) onEnterView();
        else onExitView();
      });
    }, { root: null, threshold: 0.25 });

    io.observe(root);

    // Resize throttled
    let rT = null;
    window.addEventListener('resize', () => {
      if (rT) window.clearTimeout(rT);
      rT = window.setTimeout(syncViewportVideo, 180);
    }, { passive: true });

    // Si cambia visibilidad del tab, pausa
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onExitView();
      else if (inView) onEnterView();
    });
  }

  function boot() {
    document.querySelectorAll(SELECTOR).forEach(initHero);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();