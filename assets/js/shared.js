/* 青石里旧楼档案 · 全站共享状态与交互 */
(function () {
  "use strict";

  const STORAGE_KEY = "qsl304.archive.v1";
  const DEFAULT_STATE = {
    clues: [],
    unlocked: false,
    remembered: false,
    doorOpened: false,
    footerSeen: false
  };

  const CLUES = {
    fourth: {
      source: "住户记录 / 1999年旧表",
      title: "302室的第四个人",
      text: "旧住户登记中，302室登记为四口之家。第四人的姓名被水渍盖住，只留下一个「许」字。"
    },
    school: {
      source: "住户记录 / 小学移交材料",
      title: "另一个孩子的名字",
      text: "青石小学的学生登记里，302室有两个孩子：许砚，以及他的姐姐许棠。监护人是许建国。"
    },
    sketch: {
      source: "建筑资料 / 物业草图",
      title: "镜子旁被涂黑的区域",
      text: "官方三楼图纸没有304室。旧物业草图上，镜子旁有一块被涂黑的位置；放大后能辨认出「304」。"
    },
    repair: {
      source: "建筑资料 / 维修记录",
      title: "张建民的补记",
      text: "维修记录里有一行补记：住户称，镜后的敲击最早出现在凌晨02:13。张建民检查时，墙内没有空腔。"
    },
    familyPhoto: {
      source: "旧照片 / 1999年春节",
      title: "四个人的全家福",
      text: "1999年的全家福里有四个人：父亲、母亲、一个男孩和一个女孩。照片背面写着「1999年春节，全家福。」"
    },
    sister: {
      source: "旧照片 / 2000年夏天",
      title: "姐姐帮我拍的",
      text: "照片背面有一句「姐姐帮我拍的。」照片里站在许砚身边的人，是他的姐姐。"
    },
    mirrorDoor: {
      source: "旧照片 / 2001年春天",
      title: "镜中多出的门",
      text: "女孩站在走廊尽头的镜子前。镜子里除了她的倒影，还有一扇本不该存在的门。门牌号看起来像304。"
    },
    emptyHall: {
      source: "旧照片 / 2001年6月17日",
      title: "门里面也有一个家",
      text: "凌晨的空走廊里没有人，但镜中有一个模糊人影站在门后。照片背面只有一句：「她说，门里面也有一个家。」"
    },
    knock: {
      source: "声音档案 / 02:13",
      title: "三下敲击",
      text: "录音二的时间是凌晨02:13。先是十秒环境音，然后是三下敲击。女孩说：「小砚，别开门。不要进来。」"
    },
    repairVoice: {
      source: "声音档案 / 02:20",
      title: "维修人员也看见了",
      text: "张建民说，他也在镜子里看见了门后的人。有人一直在敲。录音末尾，还有一句很轻的「哥哥，你还记得我吗？」"
    },
    remembered: {
      source: "私人记录 / 最后一次整理",
      title: "她已经等了很久",
      text: "许砚想起了姐姐的名字：许棠。就在同一天凌晨，镜子里那扇门又出现了。"
    }
  };

  const CLUE_TOTAL = Object.keys(CLUES).length;
  const state = loadState();
  let lastFocused = null;
  let confirmState = null;

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE, clues: [] };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return { ...DEFAULT_STATE, clues: [] };
      }
      return {
        clues: Array.isArray(parsed.clues) ? parsed.clues.filter((id) => CLUES[id]) : [],
        unlocked: Boolean(parsed.unlocked),
        remembered: Boolean(parsed.remembered),
        doorOpened: Boolean(parsed.doorOpened),
        footerSeen: Boolean(parsed.footerSeen)
      };
    } catch (error) {
      return { ...DEFAULT_STATE, clues: [] };
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* 本地存储不可用时，游戏仍可在当前页面继续。 */
    }
  }

  function getClue(id) {
    return CLUES[id] || null;
  }

  function addClue(id, options) {
    const clue = CLUES[id];
    if (!clue) return false;
    if (state.clues.includes(id)) return false;
    state.clues.push(id);
    persist();
    renderClueCount();
    renderNotebook();
    if (!options || options.toast !== false) {
      showToast("调查手记已更新", clue.title);
    }
    return true;
  }

  function hasClue(id) {
    return state.clues.includes(id);
  }

  function setFlag(name, value) {
    if (!(name in DEFAULT_STATE) || name === "clues") return;
    state[name] = Boolean(value);
    persist();
  }

  function updateClueCount() {
    renderClueCount();
  }

  function renderClueCount() {
    const buttons = document.querySelectorAll("[data-notebook-toggle]");
    const count = state.clues.length;
    document.querySelectorAll("[data-clue-count]").forEach((el) => {
      el.textContent = String(count).padStart(2, "0");
    });
    buttons.forEach((btn) => btn.classList.toggle("has-clues", count > 0));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureNotebook() {
    if (document.getElementById("notebook-panel")) return;

    const backdrop = document.createElement("div");
    backdrop.className = "notebook-backdrop";
    backdrop.id = "notebook-backdrop";
    backdrop.setAttribute("data-notebook-close", "");

    const panel = document.createElement("aside");
    panel.className = "notebook";
    panel.id = "notebook-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "notebook-title");
    panel.innerHTML = `
      <header class="notebook__head">
        <div class="notebook__kicker">INVESTIGATION NOTES / QSL-03</div>
        <div class="notebook__title-row">
          <h2 class="notebook__title" id="notebook-title">调查手记</h2>
          <button class="dialog-close" type="button" data-notebook-close aria-label="关闭调查手记">×</button>
        </div>
        <p class="notebook__progress"><span data-notebook-progress>已记录 0 / ${CLUE_TOTAL} 条线索</span> · 仅在当前浏览器保存</p>
      </header>
      <div class="notebook__body" id="notebook-body"></div>
      <div class="notebook__foot">
        记录会随调查自动补全。资料之间仍有空白。<br>
        <button type="button" data-reset>恢复初始档案</button>
      </div>
    `;

    document.body.append(backdrop, panel);
    backdrop.addEventListener("click", closeNotebook);
    panel.querySelectorAll("[data-notebook-close]").forEach((button) => {
      button.addEventListener("click", closeNotebook);
    });
    panel.querySelector("[data-reset]")?.addEventListener("click", () => {
      closeNotebook();
      openConfirm({
        title: "恢复初始档案？",
        text: "这会清除已经记录的线索、已解锁的私人记录与全部结局状态。网页中的原始资料不会改变。",
        confirmLabel: "清除并返回首页",
        onConfirm: () => {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch (error) {
            /* ignore */
          }
          window.location.href = "index.html";
        }
      });
    });
    renderNotebook();
  }

  function renderNotebook() {
    const body = document.getElementById("notebook-body");
    if (!body) return;
    const progress = document.querySelector("[data-notebook-progress]");
    if (progress) {
      progress.textContent = `已记录 ${state.clues.length} / ${CLUE_TOTAL} 条线索`;
    }

    if (!state.clues.length) {
      body.innerHTML = `
        <div class="notebook__empty">
          <strong>还没有可以确认的线索。</strong><br>
          打开各页资料，留意被遮住的姓名、被涂掉的编号、重复出现的时间，以及照片背面的字。
        </div>
      `;
      return;
    }

    const entries = state.clues
      .map((id, index) => {
        const clue = CLUES[id];
        if (!clue) return "";
        return `
          <li class="clue-entry" data-number="${String(index + 1).padStart(2, "0")}">
            <div class="clue-entry__source">${escapeHtml(clue.source)}</div>
            <h3 class="clue-entry__title">${escapeHtml(clue.title)}</h3>
            <p class="clue-entry__text">${escapeHtml(clue.text)}</p>
          </li>
        `;
      })
      .filter(Boolean)
      .join("");

    body.innerHTML = `<ol class="clue-list">${entries}</ol>`;
  }

  function openNotebook() {
    ensureNotebook();
    const panel = document.getElementById("notebook-panel");
    const backdrop = document.getElementById("notebook-backdrop");
    if (!panel || !backdrop) return;
    lastFocused = document.activeElement;
    panel.classList.add("is-open");
    backdrop.classList.add("is-open");
    document.body.classList.add("is-locked");
    const closeButton = panel.querySelector("[data-notebook-close]");
    closeButton?.focus();
  }

  function closeNotebook() {
    const panel = document.getElementById("notebook-panel");
    const backdrop = document.getElementById("notebook-backdrop");
    if (!panel || !backdrop) return;
    panel.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function isNotebookOpen() {
    return document.getElementById("notebook-panel")?.classList.contains("is-open") || false;
  }

  function trapNotebookFocus(event) {
    if (!isNotebookOpen() || event.key !== "Tab") return;
    const panel = document.getElementById("notebook-panel");
    const focusables = Array.from(
      panel.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function ensureToast() {
    let toast = document.getElementById("site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }
    return toast;
  }

  function showToast(title, detail) {
    const toast = ensureToast();
    toast.innerHTML = `<div><small>${escapeHtml(title)}</small>${escapeHtml(detail)}</div>`;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2800);
  }

  function ensureConfirm() {
    let dialog = document.getElementById("confirm-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "confirm-dialog";
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `
      <div class="confirm-dialog__inner">
        <h2 class="confirm-dialog__title" id="confirm-title"></h2>
        <p class="confirm-dialog__text" id="confirm-text"></p>
        <div class="confirm-dialog__actions">
          <button class="btn btn--ghost" type="button" data-confirm-cancel>取消</button>
          <button class="btn" type="button" data-confirm-ok>确认</button>
        </div>
      </div>
    `;
    document.body.append(dialog);
    dialog.querySelector("[data-confirm-cancel]").addEventListener("click", () => {
      dialog.close();
      confirmState = null;
    });
    dialog.querySelector("[data-confirm-ok]").addEventListener("click", () => {
      const callback = confirmState?.onConfirm;
      dialog.close();
      confirmState = null;
      if (typeof callback === "function") callback();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("is-locked");
      confirmState = null;
    });
    return dialog;
  }

  function openConfirm(options) {
    const dialog = ensureConfirm();
    confirmState = options || {};
    const title = dialog.querySelector("#confirm-title");
    const text = dialog.querySelector("#confirm-text");
    const ok = dialog.querySelector("[data-confirm-ok]");
    const cancel = dialog.querySelector("[data-confirm-cancel]");
    if (title) title.textContent = confirmState.title || "确认";
    if (text) text.textContent = confirmState.text || "";
    if (ok) {
      ok.textContent = confirmState.confirmLabel || "确认";
      ok.classList.toggle("btn--accent", Boolean(confirmState.danger));
    }
    if (cancel) cancel.textContent = confirmState.cancelLabel || "取消";
    document.body.classList.add("is-locked");
    dialog.showModal();
  }

  function playKnocks(count) {
    const total = Number(count) || 3;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!playKnocks._ctx) playKnocks._ctx = new AudioContext();
      const ctx = playKnocks._ctx;
      if (ctx.state === "suspended") ctx.resume();
      let index = 0;
      const hit = () => {
        if (index >= total) return;
        const now = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(78, now);
        oscillator.frequency.exponentialRampToValueAtTime(44, now + 0.18);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.26);
        index += 1;
        if (index < total) window.setTimeout(hit, 380);
      };
      hit();
    } catch (error) {
      /* 没有音频支持时，视觉反馈仍然有效。 */
    }
  }

  function playLowTone() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!playLowTone._ctx) playLowTone._ctx = new AudioContext();
      const ctx = playLowTone._ctx;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(72, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1);
    } catch (error) {
      /* ignore */
    }
  }

  function initNav() {
    const page = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const nav = link.getAttribute("data-nav");
      if (nav === page) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function initWhisper() {
    const btn = document.querySelector("[data-whisper]");
    const zone = document.querySelector(".whisper-zone");
    if (!btn || !zone) return;
    const reveal = zone.querySelector(".whisper-reveal");
    const setOpen = (open) => {
      zone.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      if (reveal) reveal.setAttribute("aria-hidden", String(!open));
    };
    btn.addEventListener("click", () => {
      setOpen(!zone.classList.contains("is-open"));
      if (zone.classList.contains("is-open")) {
        setFlag("footerSeen", true);
      }
    });
    setOpen(false);
  }

  function initGlobal() {
    initNav();
    renderClueCount();
    ensureNotebook();
    initWhisper();

    document.querySelectorAll("[data-notebook-toggle]").forEach((btn) => {
      btn.addEventListener("click", openNotebook);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isNotebookOpen()) closeNotebook();
      trapNotebookFocus(event);
    });
    document.querySelectorAll("[data-reset]").forEach((btn) => {
      if (btn.closest("#notebook-panel")) return;
      btn.addEventListener("click", () => {
        openConfirm({
          title: "恢复初始档案？",
          text: "这会清除已经记录的线索、已解锁的私人记录与全部结局状态。网页中的原始资料不会改变。",
          confirmLabel: "清除并返回首页",
          onConfirm: () => {
            try {
              window.localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
              /* ignore */
            }
            window.location.href = "index.html";
          }
        });
      });
    });

    if (state.doorOpened) document.body.classList.add("door-opened");
  }

  window.QSL = {
    state,
    clues: CLUES,
    clueTotal: CLUE_TOTAL,
    addClue,
    hasClue,
    getClue,
    setFlag,
    updateClueCount,
    openNotebook,
    closeNotebook,
    showToast,
    openConfirm,
    playKnocks,
    playLowTone,
    renderNotebook,
    storageKey: STORAGE_KEY,
    reset: function () {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* ignore */
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobal);
  } else {
    initGlobal();
  }
})();
