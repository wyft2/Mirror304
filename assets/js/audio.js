/* 声音档案页播放器 */
(function () {
  "use strict";

  const TAPES = [
    {
      title: "磁带 01 / 对话",
      shortName: "对话 / 姐姐在镜子前",
      subtitle: "2001.06.17 / 02:10 / A面 / MONO",
      src: "assets/audio/tape-1-0210.mp3",
      duration: 22.2,
      timeLabel: "02:10",
      source: "许砚保存的录音带 · A面",
      note: "未编辑的对话原带",
      caption: "点击播放，开始检听",
      cues: [
        { t: 0.0, speaker: "磁带", text: "磁带开始转动。室内很安静。", sound: true },
        { t: 1.4, speaker: "许砚", text: "姐姐，你在干什么？" },
        { t: 4.75, speaker: "女孩", text: "我在看镜子。" },
        { t: 7.45, speaker: "许砚", text: "里面有什么？" },
        { t: 9.95, speaker: "女孩", text: "有一扇门。" },
        { t: 12.5, speaker: "许砚", text: "我怎么没看见？" },
        { t: 14.75, speaker: "女孩", text: "因为你还没有进去。" },
        { t: 18.4, speaker: "声音", text: "对话结束。底噪持续了约三秒。", sound: true }
      ]
    },
    {
      title: "磁带 02 / 敲击",
      shortName: "敲击 / 镜子后方",
      subtitle: "2001.06.17 / 02:13 / A面 / MONO",
      src: "assets/audio/tape-2-0213.mp3",
      duration: 15.53,
      timeLabel: "02:13",
      source: "许砚保存的录音带 · A面",
      note: "前面的环境音持续约十秒",
      caption: "点击播放，注意十秒后的声音",
      cues: [
        { t: 0.0, speaker: "环境音", text: "持续约十秒。听不见人声。", sound: true },
        { t: 10.0, speaker: "敲击", text: "三下。来自镜子后方。", sound: true },
        { t: 11.45, speaker: "女孩", text: "小砚，别开门。不要进来。" },
        { t: 15.3, speaker: "磁带", text: "录音在句尾突然中断。", sound: true }
      ],
      clueAt: { time: 10.0, id: "knock" }
    },
    {
      title: "磁带 03 / 现场记录",
      shortName: "维修人员 / 现场记录",
      subtitle: "2001.06.17 / 02:20 / A面 / MONO",
      src: "assets/audio/tape-3-0220.mp3",
      duration: 22.6,
      timeLabel: "02:20",
      source: "张建民留下的现场录音",
      note: "结尾四秒几乎听不见",
      caption: "点击播放，留意结尾的轻音",
      cues: [
        { t: 0.4, speaker: "环境音", text: "磁带底噪。远处有门轴声。", sound: true },
        { t: 1.1, speaker: "维修人员", text: "这里明明是一面墙。" },
        { t: 4.1, speaker: "维修人员", text: "可我刚才在镜子里，看见门后面有人。" },
        { t: 8.55, speaker: "维修人员", text: "她一直在敲。" },
        { t: 11.3, speaker: "维修人员", text: "我不想再待在这里了。" },
        { t: 14.2, speaker: "停顿", text: "维修人员停止说话。", sound: true },
        { t: 17.3, speaker: "很轻的声音", text: "哥哥，你还记得我吗？" },
        { t: 21.5, speaker: "磁带", text: "磁带又转动了几秒，然后停止。", sound: true }
      ],
      clueAt: { time: 17.0, id: "repairVoice" }
    }
  ];

  const audio = document.getElementById("tape-audio");
  const deck = document.getElementById("tape-deck");
  const waveform = document.getElementById("waveform");
  const playButton = document.getElementById("play-audio");
  const playLabel = document.getElementById("play-label");
  const rewindButton = document.getElementById("rewind-audio");
  const transcript = document.getElementById("transcript");
  const transcriptToggle = document.getElementById("transcript-toggle");
  const cueList = document.getElementById("cue-list");
  const elapsedLabel = document.getElementById("time-elapsed");
  const totalLabel = document.getElementById("time-total");
  const audioCaption = document.getElementById("audio-caption");
  const deckTitle = document.getElementById("deck-title");
  const deckSubtitle = document.getElementById("deck-subtitle");
  const deckState = document.getElementById("deck-state");
  const metaTime = document.getElementById("meta-time");
  const metaSource = document.getElementById("meta-source");
  const metaNote = document.getElementById("meta-note");
  const tapeButtons = Array.from(document.querySelectorAll("[data-tape]"));

  if (!audio || !waveform || !cueList) return;

  let activeTape = 0;
  let bars = [];
  let wasPlaying = false;
  let lastClueId = null;

  const pad = (number) => String(number).padStart(2, "0");
  const formatTime = (value) => {
    const safe = Number.isFinite(value) && value > 0 ? value : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = Math.floor(safe % 60);
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function buildWaveform(seed) {
    const random = seededRandom(304 + seed * 113);
    waveform.innerHTML = "";
    bars = [];
    const total = 92;
    for (let index = 0; index < total; index += 1) {
      const bar = document.createElement("span");
      bar.className = "waveform__bar";
      const arc = Math.sin((index / total) * Math.PI);
      const shape = 0.19 + arc * 0.52 + random() * 0.27;
      bar.style.setProperty("--h", `${Math.round(Math.min(1, shape) * 100)}`);
      waveform.append(bar);
      bars.push(bar);
    }
    updateWaveform(0);
  }

  function updateWaveform(progress) {
    if (!bars.length) return;
    const activeCount = Math.round(progress * bars.length);
    bars.forEach((bar, index) => {
      bar.classList.toggle("is-past", index < activeCount);
    });
    const value = Math.round(progress * 100);
    waveform.setAttribute("aria-valuenow", String(value));
    waveform.setAttribute("aria-valuetext", `${formatTime(audio.currentTime)} / ${formatTime(getDuration())}`);
  }

  function getDuration() {
    if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;
    return TAPES[activeTape].duration;
  }

  function renderCues(tape) {
    cueList.innerHTML = tape.cues
      .map(
        (cue, index) => `
          <li class="cue${cue.sound ? " cue--sound" : ""}" data-cue="${index}" data-time="${cue.t}">
            <span class="cue__time">${formatTime(cue.t)}</span>
            <span class="cue__text">
              ${cue.sound ? "" : `<span class="cue__speaker">${cue.speaker}</span>`}
              ${cue.text}
            </span>
          </li>
        `
      )
      .join("");
  }

  function updateCues(currentTime) {
    const cues = cueList.querySelectorAll(".cue");
    let active = 0;
    TAPES[activeTape].cues.forEach((cue, index) => {
      if (currentTime >= cue.t - 0.05) active = index;
    });
    cues.forEach((el, index) => {
      el.classList.toggle("is-active", index === active);
      el.classList.toggle("is-past", index < active);
    });
  }

  function revealTapeClue(force) {
    const tape = TAPES[activeTape];
    if (!tape.clueAt) return;
    if (force || audio.currentTime >= tape.clueAt.time) {
      if (lastClueId !== tape.clueAt.id) {
        lastClueId = tape.clueAt.id;
        window.QSL?.addClue(tape.clueAt.id);
      }
    }
  }

  function updateUI(progress) {
    const duration = getDuration();
    totalLabel.textContent = formatTime(duration);
    elapsedLabel.textContent = formatTime(audio.currentTime);
    updateWaveform(progress);
    updateCues(audio.currentTime);
    revealTapeClue(false);
  }

  function setPlayingUI(playing) {
    deck.classList.toggle("is-playing", playing);
    if (playing) {
      playLabel.textContent = "暂停";
      playButton.setAttribute("aria-label", "暂停录音");
      playButton.querySelector("svg").innerHTML = '<path d="M7 5h4v14H7zM14 5h4v14h-4z" fill="currentColor" stroke="none"/>';
      deckState.textContent = "PLAYING";
      audioCaption.textContent = TAPES[activeTape].caption;
    } else {
      playLabel.textContent = audio.currentTime > 0 && !audio.ended ? "继续播放" : "播放录音";
      playButton.setAttribute("aria-label", "播放录音");
      playButton.querySelector("svg").innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>';
      deckState.textContent = audio.ended
        ? "END OF TAPE"
        : audio.currentTime > 0
          ? "PAUSED"
          : "TAPE READY";
    }
  }

  function selectTape(index, options) {
    const nextIndex = Number(index);
    if (!Number.isFinite(nextIndex) || !TAPES[nextIndex]) return;
    audio.pause();
    activeTape = nextIndex;
    const tape = TAPES[activeTape];
    lastClueId = null;

    tapeButtons.forEach((button) => {
      const isActive = Number(button.getAttribute("data-tape")) === activeTape;
      button.setAttribute("aria-pressed", String(isActive));
    });

    deckTitle.textContent = tape.title;
    deckSubtitle.textContent = tape.subtitle;
    metaTime.textContent = `2001.06.17 / ${tape.timeLabel}`;
    metaSource.textContent = tape.source;
    metaNote.textContent = tape.note;
    audioCaption.textContent = tape.caption;
    totalLabel.textContent = formatTime(tape.duration);
    elapsedLabel.textContent = "00:00";
    deckState.textContent = "TAPE READY";

    audio.src = tape.src;
    audio.load();
    renderCues(tape);
    buildWaveform(activeTape);
    updateUI(0);
    setPlayingUI(false);

    if (!transcript.classList.contains("is-collapsed")) {
      revealTapeClue(true);
    }

    if (!options || options.announce !== false) {
      window.QSL?.showToast?.(`磁带 ${pad(activeTape + 1)} 已装入`, "按播放键开始检听");
    }
  }

  function togglePlayback() {
    if (!audio.src) selectTape(0);
    if (audio.paused) {
      audio.play().then(() => {
        wasPlaying = true;
        setPlayingUI(true);
      }).catch(() => {
        deckState.textContent = "PLAYBACK ERROR";
        audioCaption.textContent = "音频无法播放，请检查浏览器的声音权限。文字稿仍可阅读。";
        window.QSL?.showToast?.("录音未能播放", "可以直接展开文字稿");
      });
    } else {
      audio.pause();
      wasPlaying = false;
      setPlayingUI(false);
    }
  }

  function seekFromEvent(event) {
    const duration = getDuration();
    if (!duration) return;
    const rect = waveform.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    updateUI(ratio);
  }

  playButton.addEventListener("click", togglePlayback);
  rewindButton.addEventListener("click", () => {
    audio.currentTime = 0;
    updateUI(0);
    if (audio.paused) {
      audio.play().then(() => {
        wasPlaying = true;
        setPlayingUI(true);
      }).catch(() => {});
    }
  });

  tapeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectTape(button.getAttribute("data-tape"));
    });
  });

  transcriptToggle.addEventListener("click", () => {
    const collapsed = transcript.classList.toggle("is-collapsed");
    transcriptToggle.setAttribute("aria-expanded", String(!collapsed));
    transcriptToggle.textContent = collapsed ? "展开文字稿" : "收起文字稿";
    if (!collapsed) {
      window.QSL?.playLowTone?.();
      revealTapeClue(true);
    }
  });

  waveform.addEventListener("click", seekFromEvent);
  waveform.addEventListener("keydown", (event) => {
    const duration = getDuration();
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 5 : -5;
      audio.currentTime = Math.min(duration, Math.max(0, audio.currentTime + delta));
      updateUI(audio.currentTime / duration);
    } else if (event.key === "Home") {
      event.preventDefault();
      audio.currentTime = 0;
      updateUI(0);
    } else if (event.key === "End") {
      event.preventDefault();
      audio.currentTime = Math.max(0, duration - 0.25);
      updateUI(audio.currentTime / duration);
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    const duration = getDuration();
    totalLabel.textContent = formatTime(duration);
    const durationLabel = document.querySelector(`[data-tape-duration="${activeTape}"]`);
    if (durationLabel) durationLabel.textContent = formatTime(duration);
    updateUI(audio.currentTime / duration || 0);
    if (TAPES[activeTape] && TAPES[activeTape].clueAt) {
      revealTapeClue(false);
    }
  });

  audio.addEventListener("timeupdate", () => {
    const duration = getDuration();
    const progress = duration ? audio.currentTime / duration : 0;
    updateUI(progress);
  });

  audio.addEventListener("play", () => {
    wasPlaying = true;
    setPlayingUI(true);
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended) {
      wasPlaying = false;
      setPlayingUI(false);
      deckState.textContent = audio.currentTime > 0 ? "PAUSED" : "TAPE READY";
      if (playLabel.textContent === "暂停") {
        playLabel.textContent = audio.currentTime > 0 ? "继续播放" : "播放录音";
      }
    }
  });

  audio.addEventListener("ended", () => {
    wasPlaying = false;
    audioCaption.textContent = "录音结束 / END OF TAPE";
    deckState.textContent = "END OF TAPE";
    setPlayingUI(false);
    playLabel.textContent = "重新播放";
    updateWaveform(1);
    revealTapeClue(true);
    window.QSL?.playLowTone?.();
  });

  audio.addEventListener("error", () => {
    audioCaption.textContent = "音频读取失败。请展开文字稿继续调查。";
    deckState.textContent = "TAPE ERROR";
  });

  selectTape(0, { announce: false });
})();
