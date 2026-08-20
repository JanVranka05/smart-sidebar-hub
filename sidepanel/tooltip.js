const MARGIN = 6;

function clamp(target) {
  const el = target.closest?.("[data-tooltip]");
  if (!el) return;

  const tooltipWidth = parseFloat(getComputedStyle(el, "::after").width) || 0;
  if (!tooltipWidth) return;

  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const naturalLeft = centerX - tooltipWidth / 2;
  const naturalRight = centerX + tooltipWidth / 2;

  let shift = 0;
  if (naturalLeft < MARGIN) {
    shift = MARGIN - naturalLeft;
  } else if (naturalRight > window.innerWidth - MARGIN) {
    shift = window.innerWidth - MARGIN - naturalRight;
  }

  el.style.setProperty("--tooltip-shift", `${shift}px`);
}

export function init() {
  document.addEventListener("mouseenter", (e) => clamp(e.target), true);
  document.addEventListener("focus", (e) => clamp(e.target), true);
}
