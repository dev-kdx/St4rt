/* Product Highlights - JS */

(() => {
  const sections = document.querySelectorAll("[data-st4rt-pd]");
  if (!sections.length) return;

  sections.forEach((root) => {
    const track = root.querySelector("[data-st4rt-pd-track]");
    const viewport = root.querySelector("[data-st4rt-pd-viewport]");
    if (!track || !viewport) return;

    const prev = root.querySelector("[data-st4rt-pd-prev]");
    const next = root.querySelector("[data-st4rt-pd-next]");

    const scrollBySlide = (dir) => {
      const amount = viewport.clientWidth;
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    };

    prev?.addEventListener("click", () => scrollBySlide(-1));
    next?.addEventListener("click", () => scrollBySlide(1));
  });
})();