/* 结局页面：守卫状态与播放节奏 */
(function () {
  "use strict";

  const ending = document.body.dataset.ending;
  const state = window.QSL?.state;
  if (!ending || !state) return;

  function initRemember() {
    if (!state.remembered) {
      window.location.replace("archive.html");
      return;
    }

    const black = document.getElementById("ending-black");
    const skip = document.getElementById("skip-to-end");
    const stage = document.querySelector(".ending-stage");
    const line = black?.querySelector(".ending-black__line");
    const footButtons = black ? Array.from(black.querySelectorAll("a, button")) : [];
    let finished = false;
    let knockAudio = null;

    if (black) {
      black.setAttribute("aria-hidden", "true");
      black.setAttribute("inert", "");
    }
    footButtons.forEach((element) => {
      element.setAttribute("tabindex", "-1");
    });

    const finish = () => {
      if (finished || !black) return;
      finished = true;
      window.clearTimeout(finishTimer);
      if (knockAudio) knockAudio.pause();
      black.classList.add("is-on");
      black.removeAttribute("inert");
      black.setAttribute("aria-hidden", "false");
      black.setAttribute("role", "dialog");
      black.setAttribute("aria-modal", "true");
      footButtons.forEach((element) => element.removeAttribute("tabindex"));
      document.body.classList.add("is-locked");
      if (stage) stage.setAttribute("inert", "");
      if (line) {
        line.setAttribute("tabindex", "-1");
        line.focus({ preventScroll: true });
      }
      if (skip) skip.hidden = true;
    };

    const finishTimer = window.setTimeout(finish, 12000);

    skip?.addEventListener("click", finish);

    // 结局页上的三下敲击。浏览器若拦截自动播放，视觉节奏仍然完整。
    window.setTimeout(() => {
      try {
        knockAudio = new Audio("assets/audio/knocks.mp3");
        knockAudio.volume = 0.7;
        knockAudio.play().catch(() => {});
      } catch (error) {
        knockAudio = null;
      }
    }, 6300);
  }

  function initDoor() {
    if (!state.doorOpened) {
      window.location.replace("archive.html");
      return;
    }
    window.QSL?.setFlag("doorOpened", true);

    const refresh = document.getElementById("ending-refresh");
    const skip = document.getElementById("skip-to-refresh");
    const flash = document.getElementById("ending-flash");
    let revealed = false;
    let revealTimer = null;

    if (refresh) {
      refresh.setAttribute("aria-hidden", "true");
      refresh.setAttribute("inert", "");
    }

    const reveal = () => {
      if (revealed || !refresh) return;
      revealed = true;
      window.clearTimeout(revealTimer);
      if (skip) skip.hidden = true;
      if (flash) {
        flash.classList.add("is-flashing");
        window.setTimeout(() => flash.classList.remove("is-flashing"), 700);
      }
      window.setTimeout(() => {
        refresh.classList.add("is-on");
        refresh.removeAttribute("inert");
        refresh.setAttribute("aria-hidden", "false");
        refresh.setAttribute("tabindex", "-1");
        refresh.focus({ preventScroll: true });
        refresh.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 260);
    };

    revealTimer = window.setTimeout(reveal, 9000);
    skip?.addEventListener("click", reveal);
  }

  if (ending === "remember") initRemember();
  if (ending === "door") initDoor();
})();
