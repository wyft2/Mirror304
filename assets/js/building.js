/* 建筑资料页交互 */
(function () {
  "use strict";

  function initPlanCheck() {
    const hotspot = document.getElementById("plan-mirror");
    const button = document.getElementById("plan-mirror-button");
    const note = document.getElementById("plan-note");
    if (!note) return;
    let checked = false;

    const check = () => {
      note.classList.add("is-active");
      note.innerHTML =
        '<strong>图注 3F-07 已核对：</strong>走廊尽端为一面整装镜面。' +
        '镜后为承重墙，墙体连续，未设置任何门洞。';
      if (button) {
        button.textContent = "镜面位置已核对";
        button.classList.add("is-checked");
      }
      if (!checked) {
        checked = true;
        window.QSL?.playLowTone?.();
      }
      note.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    button?.addEventListener("click", check);
    if (hotspot) {
      hotspot.addEventListener("click", check);
      hotspot.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          check();
        }
      });
    }
  }

  function initRepairSupplement() {
    const button = document.getElementById("repair-supplement-button");
    const supplement = document.getElementById("repair-supplement");
    if (!button || !supplement) return;
    let hasRevealed = false;

    button.addEventListener("click", () => {
      const isHidden = supplement.hasAttribute("hidden");
      if (isHidden) {
        supplement.removeAttribute("hidden");
        button.setAttribute("aria-expanded", "true");
        button.textContent = "补充记录已检出";
        if (!hasRevealed) {
          hasRevealed = true;
          window.QSL?.addClue("repair");
          window.QSL?.playLowTone?.();
        }
        supplement.focus?.();
      } else {
        supplement.setAttribute("hidden", "");
        button.setAttribute("aria-expanded", "false");
        button.textContent = "检出维修单背面手写补记";
      }
    });
  }

  function initSketchZoom() {
    const dialog = document.getElementById("sketch-dialog");
    const openButton = document.getElementById("open-sketch");
    const preview = document.getElementById("sketch-preview");
    const canvas = document.getElementById("zoom-canvas");
    const stage = document.getElementById("zoom-stage");
    const range = document.getElementById("zoom-range");
    const readout = document.querySelector("[data-zoom-readout]");
    const closeButton = dialog?.querySelector("[data-close-sketch]");
    const zoomOut = dialog?.querySelector("[data-zoom-out]");
    const zoomIn = dialog?.querySelector("[data-zoom-in]");
    if (!dialog || !openButton || !preview || !canvas || !stage || !range) return;

    let hasRevealed = false;
    let value = 100;
    let previousActive = null;

    function addKeyboardOption() {
      const svg = canvas.querySelector("svg");
      if (!svg) return;
      svg.setAttribute("focusable", "false");
    }

    function applyZoom(nextValue) {
      value = Math.max(100, Math.min(260, Number(nextValue) || 100));
      range.value = String(value);
      if (readout) readout.textContent = `${value}%`;
      canvas.style.transform = `scale(${value / 100})`;
      const revealed = value >= 170;
      stage.classList.toggle("is-revealed", revealed);
      const badge = stage.querySelector(".zoom-reveal");
      if (badge) badge.setAttribute("aria-hidden", String(!revealed));
      if (revealed && !hasRevealed) {
        hasRevealed = true;
        window.QSL?.addClue("sketch");
        window.QSL?.playLowTone?.();
      }
    }

    function openDialog() {
      previousActive = document.activeElement;
      const sourceSvg = preview.querySelector("svg");
      if (sourceSvg) {
        canvas.innerHTML = sourceSvg.outerHTML;
        const cloned = canvas.querySelector("svg");
        if (cloned) {
          cloned.setAttribute("aria-hidden", "true");
          cloned.querySelectorAll("title, desc").forEach((node) => node.remove());
          cloned.setAttribute("focusable", "false");
        }
        addKeyboardOption();
      }
      applyZoom(100);
      document.body.classList.add("is-locked");
      dialog.showModal();
      closeButton?.focus();
    }

    openButton.addEventListener("click", openDialog);
    closeButton?.addEventListener("click", () => dialog.close());
    zoomOut?.addEventListener("click", () => applyZoom(value - 20));
    zoomIn?.addEventListener("click", () => applyZoom(value + 20));
    range.addEventListener("input", () => applyZoom(range.value));

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("is-locked");
      if (previousActive && typeof previousActive.focus === "function") {
        previousActive.focus();
      }
      if (range) {
        applyZoom(100);
        stage.classList.remove("is-revealed");
      }
    });
  }

  function init() {
    initPlanCheck();
    initRepairSupplement();
    initSketchZoom();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
