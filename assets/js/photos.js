/* 旧照片页交互 */
(function () {
  "use strict";

  const PHOTOS = [
    {
      src: "assets/img/family-1999.svg",
      alt: "1999年春节的全家福，一家四口站在客厅里。女孩的脸像失焦一样模糊。",
      date: "1999年春节",
      title: "全家福",
      description:
        "客厅里一共站着四个人：父亲、母亲、一个男孩和一个女孩。女孩的脸像失焦一样模糊。照片使用了闪光灯，墙面泛着一层暖黄。",
      printDate: "1999 / 春节",
      meta: [
        ["来源", "许家旧相册 · 第 1 页"],
        ["介质", "35mm 彩色负片 / 扫描件"],
        ["状态", "轻微褪色，右侧有折痕"]
      ],
      back: {
        quote: "1999年春节，全家福。",
        note: "字迹属于陈芸。相纸上有一处圆形茶渍，正好落在女孩脸的背面。",
        date: "1999 / 02"
      },
      backClue: "familyPhoto"
    },
    {
      src: "assets/img/summer-2000.svg",
      alt: "2000年夏天的客厅，一个男孩坐在沙发上，一个女孩站在窗边，桌上摆着一台相机。",
      date: "2000年夏天",
      title: "客厅",
      description:
        "午后的光从右侧窗户照进来。许砚坐在沙发上，许棠站在他旁边。右下方有一台架在椅子上的相机，像是在倒计时。",
      printDate: "2000 / 夏",
      meta: [
        ["来源", "许家旧相册 · 第 4 页"],
        ["介质", "35mm 彩色负片 / 扫描件"],
        ["状态", "色彩偏绿，边缘有划痕"]
      ],
      back: {
        quote: "姐姐帮我拍的。",
        note: "笔迹比照片拍摄时间新，像是后来补写的。",
        date: "2000 / 07"
      },
      backClue: "sister"
    },
    {
      src: "assets/img/mirror-2001.svg",
      alt: "2001年春天，一个女孩站在走廊尽头的镜子前。镜中多出一扇门，门牌号像304。",
      date: "2001年春天",
      title: "走廊尽头",
      description:
        "照片拍的是三号楼三层的走廊。女孩站在尽头的镜子前，背对镜头。镜中除了她的倒影，还多出一扇门。门牌上的数字很模糊，看起来像304。",
      printDate: "2001 / 春",
      meta: [
        ["来源", "许家旧相册 · 无编号散页"],
        ["介质", "35mm 彩色负片 / 扫描件"],
        ["状态", "对焦偏移，镜面曝光不足"]
      ],
      back: {
        quote: "",
        note: "背面没有字。相纸右下角有一道很浅的指甲划痕。",
        date: "2001 / 03"
      },
      inspectable: true
    },
    {
      src: "assets/img/hallway-2001.svg",
      alt: "2001年6月17日凌晨的空走廊，镜中有一个模糊人影站在半开的门后。",
      date: "2001年6月17日 · 凌晨",
      title: "空走廊",
      description:
        "走廊里空无一人。尽头的镜子中出现了一个模糊的人影，站在半开的门后。照片拍摄时没有开闪光灯，反射的光源不在走廊里。",
      printDate: "2001 / 06 / 17",
      meta: [
        ["来源", "许家旧相册 · 最后一页"],
        ["时间", "凌晨 / 具体时间未记录"],
        ["状态", "严重欠曝，扫描后半部有噪点"]
      ],
      back: {
        quote: "她说，门里面也有一个家。",
        note: "字迹很轻，最后一个字几乎被相纸纤维吃掉。",
        date: "2001 / 06 / 17"
      },
      backClue: "emptyHall"
    }
  ];

  const dialog = document.getElementById("photo-dialog");
  if (!dialog) return;

  const cards = Array.from(document.querySelectorAll("[data-photo]"));
  const image = document.getElementById("photo-image");
  const print = document.getElementById("photo-print");
  const media = document.getElementById("photo-media");
  const backQuote = document.getElementById("photo-back-quote");
  const backNote = document.getElementById("photo-back-note");
  const backDate = document.getElementById("photo-back-date");
  const title = document.getElementById("photo-dialog-title");
  const dateLabel = document.getElementById("photo-dialog-date");
  const desc = document.getElementById("photo-dialog-desc");
  const meta = document.getElementById("photo-dialog-meta");
  const indexLabel = document.getElementById("photo-dialog-index");
  const printDate = document.getElementById("photo-print-date");
  const flipButton = document.getElementById("flip-photo");
  const inspectButton = document.getElementById("inspect-mirror");
  const prevButton = document.getElementById("prev-photo");
  const nextButton = document.getElementById("next-photo");
  const closeButton = document.getElementById("close-photo");
  const inspectTag = dialog.querySelector(".photo-inspect-tag");

  let activeIndex = 0;
  let flipped = false;
  let inspecting = false;
  let previousFocus = null;

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function render(index, options) {
    activeIndex = (index + PHOTOS.length) % PHOTOS.length;
    const photo = PHOTOS[activeIndex];
    flipped = false;
    inspecting = false;

    image.src = photo.src;
    image.alt = photo.alt;
    title.textContent = photo.title;
    dateLabel.textContent = photo.date;
    desc.textContent = photo.description;
    printDate.textContent = photo.printDate;
    print.dataset.index = String(activeIndex);
    indexLabel.textContent = `PHOTO ${pad(activeIndex + 1)} / ${pad(PHOTOS.length)}`;
    meta.innerHTML = photo.meta
      .map(([label, value]) => `<span><strong>${label}</strong> · ${value}</span>`)
      .join("");

    backQuote.textContent = photo.back.quote;
    backQuote.hidden = !photo.back.quote;
    backNote.textContent = photo.back.note;
    backDate.textContent = photo.back.date || "";
    backDate.hidden = !photo.back.date;

    dialog.classList.remove("is-flipped");
    print.classList.remove("is-inspecting");
    media.classList.remove("is-inspected");
    inspectTag?.setAttribute("aria-hidden", "true");
    flipButton.textContent = "翻看背面";
    flipButton.setAttribute("aria-expanded", "false");
    inspectButton.hidden = !photo.inspectable;
    inspectButton.textContent = "放大镜中门牌";
    if (photo.inspectable) {
      inspectButton.disabled = false;
    }

    if (options && options.focusTitle) {
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }

    if (photo.openClue) window.QSL?.addClue(photo.openClue);
  }

  function setFlipped(next) {
    if (!PHOTOS[activeIndex]) return;
    flipped = Boolean(next);
    if (flipped && inspecting) {
      inspecting = false;
      print.classList.remove("is-inspecting");
      media.classList.remove("is-inspected");
      inspectTag?.setAttribute("aria-hidden", "true");
      inspectButton.textContent = "放大镜中门牌";
    }
    dialog.classList.toggle("is-flipped", flipped);
    flipButton.textContent = flipped ? "返回正面" : "翻看背面";
    flipButton.setAttribute("aria-expanded", String(flipped));
    inspectButton.disabled = flipped;
    if (flipped) {
      const photo = PHOTOS[activeIndex];
      if (photo.backClue) window.QSL?.addClue(photo.backClue);
    }
  }

  function setInspecting() {
    if (flipped) return;
    const photo = PHOTOS[activeIndex];
    if (!photo.inspectable) return;
    inspecting = !inspecting;
    print.classList.toggle("is-inspecting", inspecting);
    media.classList.toggle("is-inspected", inspecting);
    inspectTag?.setAttribute("aria-hidden", String(!inspecting));
    inspectButton.textContent = inspecting ? "恢复全图" : "放大镜中门牌";
    if (inspecting) {
      window.QSL?.addClue("mirrorDoor");
      window.QSL?.playLowTone?.();
    }
  }

  function openPhoto(index) {
    previousFocus = document.activeElement;
    render(index, { focusTitle: false });
    document.body.classList.add("is-locked");
    dialog.showModal();
    closeButton?.focus();
    title.setAttribute("tabindex", "-1");
    title.focus({ preventScroll: true });
  }

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      const index = Number(card.getAttribute("data-photo"));
      openPhoto(Number.isFinite(index) ? index : 0);
    });
  });

  closeButton?.addEventListener("click", () => dialog.close());
  flipButton?.addEventListener("click", () => setFlipped(!flipped));
  inspectButton?.addEventListener("click", setInspecting);
  prevButton?.addEventListener("click", () => render(activeIndex - 1));
  nextButton?.addEventListener("click", () => render(activeIndex + 1));

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      render(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      render(activeIndex + 1);
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
    print.classList.remove("is-inspecting");
    media.classList.remove("is-inspected");
    dialog.classList.remove("is-flipped");
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  });
})();
