/* 私人记录页：密钥、姓名判定与结局分流 */
(function () {
  "use strict";

  const PIN_LENGTH = 7;
  const CORRECT_PIN = "3040213";
  const CORRECT_NAME = "许棠";

  const shell = document.getElementById("archive-shell");
  const lockScreen = document.getElementById("archive-locked");
  const lockPanel = document.getElementById("lock-panel");
  const pinForm = document.getElementById("pin-form");
  const display = document.getElementById("pin-display");
  const slots = display ? Array.from(display.querySelectorAll(".pin-slot")) : [];
  const live = document.getElementById("pin-live");
  const message = document.getElementById("pin-message");
  const hintButton = document.getElementById("hint-toggle");
  const hint = document.getElementById("pin-hint");
  const pinKeys = Array.from(document.querySelectorAll("[data-pin-key]"));
  const clearButton = document.querySelector("[data-pin-clear]");
  const backButton = document.querySelector("[data-pin-back]");
  const unlocked = document.getElementById("archive-unlocked");
  const nameForm = document.getElementById("name-form");
  const nameInput = document.getElementById("name-input");
  const nameError = document.getElementById("name-error");
  const openDoor = document.getElementById("open-door");
  const ghostTape = document.getElementById("ghost-tape");
  const unknownDuration = document.getElementById("unknown-duration");
  const unknownSource = document.getElementById("unknown-source");
  const unknownEmpty = document.getElementById("unknown-empty");
  const replayGhost = document.getElementById("replay-ghost");
  const lastRecording = document.getElementById("last-recording");
  const skipFinal = document.getElementById("skip-final");

  if (!shell || !pinForm || !unlocked) return;

  let pinValue = "";
  let attempts = 0;
  let ghostAudio = null;
  let finalAudio = null;
  let redirectTimer = null;
  let finalEndedTimer = null;
  let navigating = false;

  function setPinMessage(text, state) {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle("is-error", state === "error");
    message.classList.toggle("is-ok", state === "ok");
  }

  function updatePinDisplay() {
    slots.forEach((slot, index) => {
      slot.textContent = pinValue[index] || "";
      slot.classList.toggle("is-filled", index < pinValue.length);
      slot.classList.toggle("is-current", index === pinValue.length);
    });
    if (live) live.textContent = `已输入 ${pinValue.length} 位数字，共 ${PIN_LENGTH} 位。`;
  }

  function appendDigit(digit) {
    if (pinValue.length >= PIN_LENGTH) return;
    pinValue += digit;
    if (message?.classList.contains("is-error")) {
      setPinMessage(`已输入 ${pinValue.length} / ${PIN_LENGTH} 位。`, "neutral");
    }
    updatePinDisplay();
  }

  function removeDigit() {
    pinValue = pinValue.slice(0, -1);
    if (message?.classList.contains("is-error")) {
      setPinMessage(`已输入 ${pinValue.length} / ${PIN_LENGTH} 位。`, "neutral");
    }
    updatePinDisplay();
  }

  function clearPin() {
    pinValue = "";
    setPinMessage(`请输入 ${PIN_LENGTH} 位数字密钥。`, "neutral");
    updatePinDisplay();
  }

  function showHint() {
    if (!hint || !hintButton) return;
    hint.hidden = false;
    hintButton.setAttribute("aria-expanded", "true");
    hintButton.textContent = "收起提示";
  }

  function toggleHint() {
    if (!hint || !hintButton) return;
    const shouldShow = hint.hidden;
    hint.hidden = !shouldShow;
    hintButton.setAttribute("aria-expanded", String(shouldShow));
    hintButton.textContent = shouldShow ? "收起提示" : "需要提示？";
  }

  function unlockArchive(options) {
    if (shell.classList.contains("is-unlocked")) return;
    window.QSL?.setFlag("unlocked", true);
    window.QSL?.addClue("remembered", { toast: !options?.silent });
    shell.classList.add("is-unlocked");
    if (lockScreen) {
      lockScreen.hidden = true;
      lockScreen.setAttribute("aria-hidden", "true");
    }
    unlocked.hidden = false;
    setPinMessage("档案已解锁。", "ok");
    document.body.classList.remove("is-locked");
    if (!options?.silent) {
      window.QSL?.playLowTone?.();
      window.QSL?.showToast?.("私人记录已解锁", "档案柜的第 06 格被打开了");
      window.setTimeout(() => {
        const recordTitle = unlocked.querySelector(".private-record__title");
        if (recordTitle) {
          recordTitle.setAttribute("tabindex", "-1");
          recordTitle.focus({ preventScroll: true });
        }
        unlocked.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 260);
    }
  }

  function submitPin(event) {
    event?.preventDefault();
    if (!shell || shell.classList.contains("is-unlocked")) return;
    if (pinValue.length !== PIN_LENGTH) {
      setPinMessage(`密钥长度不对。需要 ${PIN_LENGTH} 位数字。`, "error");
      window.QSL?.playLowTone?.();
      return;
    }
    if (pinValue === CORRECT_PIN) {
      unlockArchive();
      return;
    }

    attempts += 1;
    setPinMessage("档案密钥错误。请重新核对。", "error");
    window.QSL?.playLowTone?.();
    if (lockPanel) {
      lockPanel.classList.remove("is-shaking");
      void lockPanel.offsetWidth;
      lockPanel.classList.add("is-shaking");
      window.setTimeout(() => lockPanel.classList.remove("is-shaking"), 450);
    }
    if (attempts >= 2) {
      showHint();
    }
  }

  function initPin() {
    pinKeys.forEach((key) => {
      key.addEventListener("click", () => appendDigit(key.getAttribute("data-pin-key")));
    });
    clearButton?.addEventListener("click", clearPin);
    backButton?.addEventListener("click", removeDigit);
    pinForm.addEventListener("submit", submitPin);
    hintButton?.addEventListener("click", toggleHint);

    document.addEventListener("keydown", (event) => {
      if (shell.classList.contains("is-unlocked")) return;
      if (document.querySelector("dialog[open]") || document.querySelector(".notebook.is-open")) return;
      const active = document.activeElement;
      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        appendDigit(event.key);
        return;
      }
      if (event.key === "Backspace") {
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        event.preventDefault();
        removeDigit();
        return;
      }
      if (event.key === "Escape") {
        clearPin();
        return;
      }
      if (event.key === "Enter") {
        const tag = active?.tagName;
        if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA") return;
        event.preventDefault();
        submitPin();
      }
    });
  }

  function playGhostAudio(forceRestart) {
    if (!ghostAudio) {
      ghostAudio = new Audio("assets/audio/wrong-name.mp3");
      ghostAudio.preload = "auto";
    }
    if (!forceRestart && !ghostAudio.paused) return;
    ghostAudio.currentTime = 0;
    ghostAudio.play().catch(() => {
      window.QSL?.showToast?.("音轨无法播放", "你仍然可以阅读浮现的文字。");
    });
  }

  function showWrongName() {
    if (nameError) {
      nameError.innerHTML = "没有找到对应的住户记录。<br>请重新核对档案。";
      nameError.classList.add("is-visible");
    }
    if (unknownDuration) unknownDuration.textContent = "00:06";
    if (unknownSource) unknownSource.textContent = "增补音轨 / 来源未知";
    if (unknownEmpty) unknownEmpty.textContent = "空白波形中出现了人声。文件修改时间：未知。";
    ghostTape?.classList.add("is-visible");
    playGhostAudio(true);
    window.QSL?.playLowTone?.();
    window.QSL?.showToast?.("UNKNOWN_AUDIO.WAV 发生了变化", "「你认错人了。她还在这里。」");
    nameInput?.focus();
  }

  function getCorrectName(value) {
    return String(value || "")
      .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
      .trim();
  }

  function navigateToEnding() {
    if (navigating) return;
    navigating = true;
    window.clearTimeout(redirectTimer);
    window.clearTimeout(finalEndedTimer);
    window.QSL?.setFlag("remembered", true);
    window.location.href = "ending-remember.html";
  }

  function playFinalSequence() {
    window.QSL?.setFlag("remembered", true);
    window.QSL?.addClue("remembered");
    if (nameForm) {
      nameForm.querySelectorAll("input, button").forEach((el) => {
        el.disabled = true;
      });
    }
    if (openDoor) openDoor.disabled = true;
    if (nameError) {
      nameError.textContent = "";
      nameError.classList.remove("is-visible");
    }
    if (!lastRecording) {
      navigateToEnding();
      return;
    }

    lastRecording.hidden = false;
    lastRecording.setAttribute("tabindex", "-1");
    document.body.classList.add("is-locked");
    document.querySelector(".site-header")?.setAttribute("inert", "");
    const main = document.querySelector("main");
    main?.setAttribute("inert", "");
    document.querySelector(".site-footer")?.setAttribute("inert", "");
    lastRecording.focus({ preventScroll: true });

    finalAudio = new Audio("assets/audio/final-recording.mp3");
    finalAudio.preload = "auto";
    finalAudio.play().catch(() => {
      /* 无法播放时，页面计时与文字仍然继续。 */
    });
    finalAudio.addEventListener("ended", () => {
      finalEndedTimer = window.setTimeout(navigateToEnding, 1300);
    });
    redirectTimer = window.setTimeout(navigateToEnding, 16000);
    skipFinal?.addEventListener("click", navigateToEnding);
  }

  function initNameGate() {
    nameForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (nameForm.querySelector("button")?.disabled) return;
      const answer = getCorrectName(nameInput?.value);
      if (!answer) {
        if (nameError) {
          nameError.textContent = "请先输入一个名字。";
          nameError.classList.add("is-visible");
        }
        nameInput?.focus();
        return;
      }
      if (answer === CORRECT_NAME) {
        playFinalSequence();
      } else {
        showWrongName();
      }
    });

    nameInput?.addEventListener("input", () => {
      if (nameError?.classList.contains("is-visible")) {
        nameError.textContent = "";
        nameError.classList.remove("is-visible");
      }
    });

    replayGhost?.addEventListener("click", () => playGhostAudio(true));
  }

  function initDoorPath() {
    openDoor?.addEventListener("click", () => {
      window.QSL?.openConfirm({
        title: "打开这扇门？",
        text: "门把手很冷。门后没有脚步声。打开之后，你就不会再站在走廊这一侧了。",
        confirmLabel: "打开门",
        cancelLabel: "退后",
        danger: true,
        onConfirm: () => {
          window.QSL?.setFlag("doorOpened", true);
          window.location.href = "ending-door.html";
        }
      });
    });
  }

  function init() {
    initPin();
    initNameGate();
    initDoorPath();
    updatePinDisplay();
    if (window.QSL?.state?.unlocked) {
      unlockArchive({ silent: true });
    } else {
      unlocked.hidden = true;
      shell.classList.remove("is-unlocked");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
