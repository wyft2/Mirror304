/* 住户记录页交互 */
(function () {
  "use strict";

  function initAlteredRecord() {
    if (!window.QSL?.state?.doorOpened) return;
    const notice = document.getElementById("altered-notice");
    const normal = document.getElementById("official-normal");
    const altered = document.getElementById("official-altered");
    const status = document.getElementById("current-status");
    const copy = document.getElementById("official-section-copy");
    const sub = document.getElementById("official-doc-sub");
    if (notice) notice.hidden = false;
    if (normal) normal.hidden = true;
    if (altered) altered.hidden = false;
    if (status) status.innerHTML = "302室：2人<br>304室：1人";
    if (copy) copy.textContent = "物业记录在最近一次访问期间发生变化。302室仅余两名登记成员，一个新的房间编号出现在表格里。";
    if (sub) sub.textContent = "三楼 · 302 / 304室 / 最后更新：2001年6月17日 02:13";
  }

  function initWaterScan() {
    const dialog = document.getElementById("water-dialog");
    const openers = [
      document.getElementById("water-name-button"),
      document.getElementById("open-water-scan")
    ].filter(Boolean);
    const close = dialog?.querySelector("[data-close-water]");
    if (!dialog || !openers.length) return;
    let previousActive = null;

    function openDialog() {
      previousActive = document.activeElement;
      window.QSL?.addClue("fourth");
      document.body.classList.add("is-locked");
      dialog.showModal();
      close?.focus();
    }

    openers.forEach((button) => button.addEventListener("click", openDialog));
    close?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("is-locked");
      if (previousActive && typeof previousActive.focus === "function") {
        previousActive.focus();
      }
    });
  }

  function initSchoolFolder() {
    const folder = document.getElementById("school-file");
    if (!folder) return;
    const toggle = folder.querySelector(".folder-toggle");
    const syncLabel = () => {
      if (toggle) toggle.textContent = folder.open ? "收起材料" : "展开材料";
    };
    folder.addEventListener("toggle", () => {
      if (folder.open) {
        if (!window.QSL?.hasClue("school")) {
          window.QSL?.playLowTone?.();
        }
        window.QSL?.addClue("school");
      }
      syncLabel();
    });
    syncLabel();
  }

  function initComparison() {
    const button = document.getElementById("compare-button");
    const text = document.getElementById("compare-text");
    const bar = document.getElementById("compare-bar");
    if (!button || !text || !bar) return;

    button.addEventListener("click", () => {
      if (!window.QSL?.hasClue("fourth") || !window.QSL?.hasClue("school")) {
        text.innerHTML = "还有一些字段没有核对。先查看旧表中被水渍遮住的姓名，以及青石小学移交的两行学生记录。";
        bar.classList.add("is-incomplete");
        window.setTimeout(() => bar.classList.remove("is-incomplete"), 450);
        return;
      }

      bar.classList.add("is-compared");
      text.innerHTML = `
        1999年 / 302室：<strong>4人</strong>　→　2001年 / 302室：<strong>3人</strong><br>
        旧表第四人只余“许”姓；学校材料中，同一地址、同一监护人名下还登记着
        <strong>许棠</strong>。<br>
        <span class="mono" style="font-size:.52rem;color:var(--muted-dim);">登记缺口：1名家庭成员</span>
      `;
      text.setAttribute("role", "status");
      if (button.textContent !== "已比对") {
        button.textContent = "已比对";
        window.QSL?.playLowTone?.();
      }
    });
  }

  function init() {
    initAlteredRecord();
    initWaterScan();
    initSchoolFolder();
    initComparison();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
