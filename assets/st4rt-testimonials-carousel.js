// assets/st4rt-testimonials-carousel.js
(function () {
  function init(root) {
    const track = root.querySelector(".st4rt-testimonials__track");
    const prevBtn = root.querySelector(".st4rt-testimonials__nav--prev");
    const nextBtn = root.querySelector(".st4rt-testimonials__nav--next");
    const dotsWrap = root.querySelector(".st4rt-testimonials__dots");
    const cards = Array.from(root.querySelectorAll(".st4rt-tcard"));

    if (!track || cards.length === 0) return;

    const autoplay = root.dataset.autoplay === "true";
    const autoplaySeconds = Math.max(2, parseInt(root.dataset.autoplaySeconds || "6", 10));
    let autoplayTimer = null;

    const colsDesktop = parseInt(root.dataset.colsDesktop || "3", 10);
    const colsMobile = parseInt(root.dataset.colsMobile || "1", 10);

    // Set responsive grid auto columns via inline CSS variable
    function applyGridColumns() {
      const gap = getComputedStyle(track).gap || "16px";
      track.style.setProperty("--_gap", gap);

      const isMobile = window.matchMedia("(max-width: 749px)").matches;
      const cols = isMobile ? colsMobile : colsDesktop;

      // calc((100% - gap*(cols-1)) / cols)
      track.style.gridAutoColumns = `calc((100% - (${gap} * (${cols - 1}))) / ${cols})`;
    }

    function getStep() {
      const first = cards[0];
      if (!first) return 320;
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function scrollByStep(dir) {
      track.scrollBy({ left: getStep() * dir, behavior: "smooth" });
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";

      // Dots per card (like your mock). If you want per "page", we can switch.
      const count = cards.length;

      for (let i = 0; i < count; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "st4rt-testimonials__dot";
        b.setAttribute("aria-label", "ir a testimonio " + (i + 1));
        b.addEventListener("click", () => {
          cards[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
        dotsWrap.appendChild(b);
      }
    }

    function setActiveByCenter() {
      const rect = track.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;

      let bestIdx = 0;
      let bestDist = Infinity;

      cards.forEach((card, idx) => {
        const r = card.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(centerX - c);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });

      cards.forEach((c, i) => c.classList.toggle("is-active", i === bestIdx));

      if (dotsWrap) {
        const dots = Array.from(dotsWrap.querySelectorAll(".st4rt-testimonials__dot"));
        dots.forEach((d, i) => d.classList.toggle("is-active", i === bestIdx));
      }
    }

    function startAutoplay() {
      if (!autoplay) return;
      stopAutoplay();
      autoplayTimer = window.setInterval(() => scrollByStep(1), autoplaySeconds * 1000);
    }

    function stopAutoplay() {
      if (autoplayTimer) window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    // init
    applyGridColumns();
    buildDots();
    setActiveByCenter();
    startAutoplay();

    prevBtn && prevBtn.addEventListener("click", () => scrollByStep(-1));
    nextBtn && nextBtn.addEventListener("click", () => scrollByStep(1));

    track.addEventListener(
      "scroll",
      () => {
        window.requestAnimationFrame(setActiveByCenter);
      },
      { passive: true }
    );

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", startAutoplay);

    window.addEventListener("resize", () => {
      applyGridColumns();
      setActiveByCenter();
    });
  }

  function boot() {
    document.querySelectorAll("[data-st4rt-testimonials]").forEach((root) => init(root));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();