/* assets/st4rt-carrusel-productos.js */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const ANIMATION_MS = 700;

  const prefersReducedMotion = (root) =>
    root?.dataset?.reducedMotion === 'true' ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function emitAnalytics(root, type, detail = {}) {
    const payload = {
      sectionId: root.dataset.sectionId,
      component: 'st4rt-carrusel-productos',
      type,
      ...detail,
    };

    root.dispatchEvent(new CustomEvent('st4rt:carousel', { detail: payload }));
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'st4rt_carousel', ...payload });
    }
  }

  class St4rtHeroCarousel {
    constructor(root) {
      this.root = root;
      this.track = $('.st4rt-hero__track', root);
      this.slides = $$('[data-slide]', root);
      this.dotsWrap = $('.st4rt-hero__dots', root);
      this.prev = $('[data-prev]', root);
      this.next = $('[data-next]', root);
      this.live = $('[data-live-status]', root);
      this.slideOffsets = [];
      this.activeIndex = 0;
      this.reduceMotion = prefersReducedMotion(root);
      this.cleanup = [];
      this.timer = null;
      this.raf = 0;
      this.animTimer = 0;
      this.io = null;
      this.scrollEndTimer = 0;
    }

    init() {
      if (!this.track || !this.slides.length) return;

      this.slides.forEach((slide) => this.syncBgFx(slide));
      this.buildDots();
      this.updateOffsets();
      this.bindInViewObserver();
      this.bindArrows();
      this.bindTrackScroll();
      this.bindResize();
      this.setActiveSlide(0, { source: 'init', scroll: false, announce: true });
      this.initAutoplay();
    }

    destroy() {
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.animTimer) window.clearTimeout(this.animTimer);
      if (this.scrollEndTimer) window.clearTimeout(this.scrollEndTimer);
      this.stopAutoplay();
      if (this.io) this.io.disconnect();
      this.cleanup.forEach((fn) => fn());
      this.cleanup = [];
    }

    bindInViewObserver() {
      this.io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle('is-inview', entry.isIntersecting);
          });
        },
        { threshold: 0.35 }
      );

      this.slides.forEach((slide) => this.io.observe(slide));
    }

    syncBgFx(slide) {
      const fx = $('.st4rt-hero__bgfx', slide);
      if (!fx) return;

      const bgImg = $('img', $('.st4rt-hero__bg', slide) || slide);
      if (!bgImg) return;

      const applyFromImg = () => {
        const src = bgImg.currentSrc || bgImg.src;
        if (src) {
          fx.style.backgroundImage = `url("${src}")`;
          return;
        }

        const bgVar = getComputedStyle(slide).getPropertyValue('--st4rt-bg-url').trim();
        if (bgVar) fx.style.backgroundImage = bgVar;
      };

      applyFromImg();

      if (!bgImg.complete && bgImg.dataset.st4rtBgFxBound !== 'true') {
        bgImg.dataset.st4rtBgFxBound = 'true';
        bgImg.addEventListener('load', applyFromImg, { once: true });
      }
    }

    updateOffsets() {
      this.slideOffsets = this.slides.map((slide) => slide.offsetLeft);
    }

    nearestIndex(scrollLeft) {
      if (!this.slideOffsets.length) return 0;

      let best = 0;
      let bestDist = Math.abs(this.slideOffsets[0] - scrollLeft);
      for (let i = 1; i < this.slideOffsets.length; i += 1) {
        const dist = Math.abs(this.slideOffsets[i] - scrollLeft);
        if (dist < bestDist) {
          best = i;
          bestDist = dist;
        }
      }
      return best;
    }

    markAnimating() {
      this.root.classList.add('is-animating');
      if (this.animTimer) window.clearTimeout(this.animTimer);
      this.animTimer = window.setTimeout(() => {
        this.root.classList.remove('is-animating');
      }, ANIMATION_MS);
    }

    updateA11y(index) {
      const total = this.slides.length;
      const dots = $$('[data-dot]', this.root);
      dots.forEach((dot, idx) => {
        const current = idx === index;
        dot.classList.toggle('is-active', current);
        dot.setAttribute('aria-current', current ? 'true' : 'false');
      });

      this.slides.forEach((slide, idx) => {
        slide.setAttribute('aria-hidden', idx === index ? 'false' : 'true');
      });

      if (this.live) {
        this.live.textContent = `Slide ${index + 1} de ${total}`;
      }
    }

    setActiveSlide(index, options = {}) {
      const total = this.slides.length;
      if (!total) return 0;

      const { source = 'programmatic', scroll = true, announce = false } = options;
      const target = this.root.dataset.loop === 'true'
        ? (index + total) % total
        : clamp(index, 0, total - 1);

      this.slides.forEach((slide, idx) => slide.classList.toggle('is-active', idx === target));
      this.updateA11y(target);
      this.activeIndex = target;
      this.root.dataset.activeIndex = String(target);

      const active = this.slides[target];
      if (active) this.syncBgFx(active);

      if (scroll) this.scrollToSlide(target);
      if (source !== 'scroll') this.markAnimating();
      if (announce) emitAnalytics(this.root, 'slide_view', { index: target + 1, source });

      return target;
    }

    scrollToSlide(index) {
      const left = this.slideOffsets[index] ?? this.slides[index]?.offsetLeft;
      if (typeof left !== 'number') return;

      this.track.scrollTo({
        left,
        behavior: this.reduceMotion ? 'auto' : 'smooth',
      });
    }

    buildDots() {
      if (!this.dotsWrap) return;

      this.dotsWrap.innerHTML = '';
      this.slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'st4rt-hero__dot';
        dot.dataset.dot = '';
        dot.setAttribute('aria-label', `Ir al slide ${idx + 1}`);
        dot.setAttribute('aria-controls', this.track.id);
        dot.addEventListener('click', () => {
          this.setActiveSlide(idx, { source: 'dot', announce: true });
          emitAnalytics(this.root, 'dot_click', { index: idx + 1 });
        });
        this.dotsWrap.appendChild(dot);
      });
    }

    bindArrows() {
      if (!this.prev || !this.next) return;

      const onPrev = () => {
        const nextIndex = this.setActiveSlide(this.activeIndex - 1, { source: 'arrow_prev', announce: true });
        emitAnalytics(this.root, 'arrow_click', { direction: 'prev', index: nextIndex + 1 });
      };

      const onNext = () => {
        const nextIndex = this.setActiveSlide(this.activeIndex + 1, { source: 'arrow_next', announce: true });
        emitAnalytics(this.root, 'arrow_click', { direction: 'next', index: nextIndex + 1 });
      };

      this.prev.addEventListener('click', onPrev);
      this.next.addEventListener('click', onNext);
      this.cleanup.push(() => {
        this.prev.removeEventListener('click', onPrev);
        this.next.removeEventListener('click', onNext);
      });
    }

    bindTrackScroll() {
      const onScroll = () => {
        if (this.raf) cancelAnimationFrame(this.raf);

        this.raf = requestAnimationFrame(() => {
          const idx = this.nearestIndex(this.track.scrollLeft);
          if (idx !== this.activeIndex) {
            this.setActiveSlide(idx, { source: 'scroll', scroll: false });
          }

          if (this.scrollEndTimer) window.clearTimeout(this.scrollEndTimer);
          this.scrollEndTimer = window.setTimeout(() => {
            emitAnalytics(this.root, 'slide_view', { index: this.activeIndex + 1, source: 'scroll' });
          }, 140);
        });
      };

      this.track.addEventListener('scroll', onScroll, { passive: true });
      this.cleanup.push(() => this.track.removeEventListener('scroll', onScroll));
    }

    bindResize() {
      const onResize = () => this.updateOffsets();
      window.addEventListener('resize', onResize, { passive: true });
      this.cleanup.push(() => window.removeEventListener('resize', onResize));
    }

    initAutoplay() {
      const enabled = this.root.dataset.autoplay === 'true';
      if (!enabled || this.slides.length < 2) return;

      const seconds = Number(this.root.dataset.autoplaySeconds || 6);
      const interval = clamp(seconds, 2, 20) * 1000;

      const start = () => {
        if (this.reduceMotion) return;
        this.stopAutoplay();
        this.timer = window.setInterval(() => {
          this.setActiveSlide(this.activeIndex + 1, { source: 'autoplay', announce: true });
        }, interval);
      };

      const stop = () => this.stopAutoplay();

      this.root.addEventListener('mouseenter', stop);
      this.root.addEventListener('mouseleave', start);
      this.root.addEventListener('focusin', stop);
      this.root.addEventListener('focusout', start);

      this.cleanup.push(() => {
        this.root.removeEventListener('mouseenter', stop);
        this.root.removeEventListener('mouseleave', start);
        this.root.removeEventListener('focusin', stop);
        this.root.removeEventListener('focusout', start);
      });

      start();
    }

    stopAutoplay() {
      if (!this.timer) return;
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  const instances = new Map();

  function mount(root) {
    if (instances.has(root)) instances.get(root).destroy();
    const carousel = new St4rtHeroCarousel(root);
    carousel.init();
    instances.set(root, carousel);
  }

  function unmount(root) {
    const instance = instances.get(root);
    if (!instance) return;
    instance.destroy();
    instances.delete(root);
  }

  function boot() {
    $$('[data-st4rt-hero]').forEach((root) => mount(root));
  }

  document.addEventListener('shopify:section:load', (event) => {
    const root = $('[data-st4rt-hero]', event.target);
    if (root) mount(root);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    const root = $('[data-st4rt-hero]', event.target);
    if (root) unmount(root);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
