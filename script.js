/* =========================================================
   Birthday Slideshow — engine
   ========================================================= */
(() => {
  "use strict";

  /* ---------------- CONFIG ---------------- */
  const CONFIG = {
    name: "Adithya Reddy",
    interval: 2000,      // ms each slide stays fully still before moving on
    settle: 1600,        // ms for the entrance (transition + text/photo animations) — timer starts after this
    transition: 1100,    // ms for the slide-to-slide transition
    idleHide: 2600,      // ms of no mouse movement before UI fades out
  };

  /* ---------------- PERFORMANCE MODE ----------------
     TVs & low-power devices get "lite" mode: same slides & transitions,
     minus the GPU-heavy extras (blur filters, grain, dust, light leaks).
     Force with ?lite=1 or ?full=1 in the URL. */
  const qs = new URLSearchParams(location.search);
  const TV_UA = /SMART-?TV|SmartTV|Tizen|Web0S|WebOS|NetCast|HbbTV|BRAVIA|AFT[A-Z]|CrKey|Android TV|GoogleTV|Roku|Philips|VIDAA|Hisense|TV Safari|Opera TV|MiBOX|Aquos|; ?TV\b/i;
  let LITE = qs.has("lite") || (!qs.has("full") && (TV_UA.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 2));
  const applyLite = () => document.body.classList.toggle("lite", LITE);
  applyLite();

  /* ---------------- PHOTOS (optimised copies in assets/) ---------------- */
  const P = Object.fromEntries(
    ["retro", "vintage", "templeClose", "templeWide", "templeWall", "templeWall2",
     "seaLook", "seaWink", "seaBack", "hoodie", "sunset", "collage"]
      .map((k) => [k, `assets/photos/${k}.jpg`])
  );
  const bgOf = (p) => p.replace("assets/photos/", "assets/bg/");   // tiny pre-blurred version

  // Everything is downloaded up-front into memory (blob: URLs) so nothing loads mid-show
  const BLOB = {};
  const url = (p) => BLOB[p] || encodeURI(p);

  // Crops out of the 1080×1440 throwback collage → individual film frames
  const COLLAGE = { W: 1080, H: 1440 };
  const REEL = [
    { x: 0,   y: 0,    w: 472, h: 360 },  // by the car
    { x: 475, y: 0,    w: 605, h: 718 },  // #whistle wall
    { x: 0,   y: 360,  w: 472, h: 360 },  // blue check
    { x: 0,   y: 720,  w: 472, h: 360 },  // shades
    { x: 475, y: 722,  w: 605, h: 718 },  // red shirt on the beach
    { x: 0,   y: 1080, w: 472, h: 360 },  // red jacket
  ];

  /* ---------------- SLIDES ---------------- */
  const SLIDES = [
    {
      layout: "wide", theme: "retro", transition: "zoom",
      img: P.retro, bg: P.retro,
      eyebrow: "The day is all yours",
      title: `Happy Birthday, *${CONFIG.name}*`,
      sub: "Grab the cake — this one's a whole story.",
    },
    {
      layout: "mosaic", theme: "stone", transition: "curtain",
      imgs: [P.templeClose, P.templeWall, P.templeWall2], bg: P.templeWide, sharpBg: true,
      labels: ["N° 01 — Grace", "N° 02 — Poise", "N° 03 — Class"],
      eyebrow: "Chapter I · Heritage",
      title: "Timeless *Class*",
      sub: "Standing tall like these temple walls — rooted, graceful, built to last.",
      word: "Heritage",
    },
    {
      layout: "fan", theme: "ocean", transition: "circle",
      imgs: [P.seaBack, P.seaWink, P.seaLook], bg: P.seaWink,
      notes: ["Horizon chaser", "That wink!", "Sea breeze"],
      eyebrow: "Chapter II · Sea Breeze",
      title: "Salt, Sand & *Smiles*",
      sub: "The waves are loud, but your laugh is always louder.",
      bubbles: true,
    },
    {
      layout: "split", theme: "crimson", transition: "diagonal",
      img: P.hoodie, pos: "50% 35%", inset: P.seaLook, bg: P.hoodie,
      eyebrow: "Chapter III · Wild Coast",
      title: "Wild at *Heart*",
      sub: "Hoodie on, eyes on the horizon — always chasing the next adventure.",
      word: "Wild",
    },
    {
      layout: "split", theme: "gold", transition: "iris", flip: true,
      img: P.sunset, pos: "50% 40%", inset: P.templeClose, bg: P.sunset,
      eyebrow: "Chapter IV · Golden Hour",
      title: "Pure *Gold*",
      sub: "Some people glow at sunset. You glow all day long.",
      word: "Golden", sun: true,
    },
    {
      layout: "reel", theme: "sepia", transition: "shutter",
      bg: P.collage,
      eyebrow: "Chapter V · Rewind",
      title: "The Throwback *Reel*",
      sub: "Same smile, different years — every frame a classic.",
    },
    {
      layout: "wide", theme: "retro", transition: "split",
      img: P.vintage, bg: P.vintage, finale: true,
      eyebrow: "Another year older & even more awesome",
      title: `Many Happy Returns, *${CONFIG.name}* ✦`,
      sub: "Here's to more temples, more beaches, more golden hours — and more of you.",
    },
  ];

  /* ---------------- helpers ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const rand = (a, b) => a + Math.random() * (b - a);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // "Timeless *Class*" → per-char spans, *…* marks accent
  function splitTitle(text) {
    let i = 0, accent = false;
    return text.split(" ").map((word) => {
      let html = "";
      for (const ch of word) {
        if (ch === "*") { accent = !accent; continue; }
        html += `<span class="char${accent ? " accent" : ""}" style="--i:${i++}">${esc(ch)}</span>`;
      }
      return `<span class="word">${html}</span>`;
    }).join(" ");
  }
  const splitWords = (text) =>
    text.split(" ").map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(" ");

  const copyHTML = (s) => `
    <div class="copy">
      <p class="eyebrow"><span class="line"></span><span class="eb-text"><span>${esc(s.eyebrow)}</span></span></p>
      <h2 class="title">${splitTitle(s.title)}</h2>
      <p class="sub">${splitWords(s.sub)}</p>
      <svg class="flourish" viewBox="0 0 240 18" preserveAspectRatio="none"><path d="M2 12 C 40 2, 80 2, 120 10 S 200 18, 238 6"/></svg>
    </div>`;

  const photo = (src, d = 0, extra = "") =>
    `<div class="ph" style="--d:${d}" ${extra}><img src="${url(src)}" alt="" draggable="false"><span class="sheen"></span></div>`;

  function cropStyle(c) {
    const { W, H } = COLLAGE;
    const sx = (W / c.w) * 100, sy = (H / c.h) * 100;
    const px = W === c.w ? 0 : (c.x / (W - c.w)) * 100;
    const py = H === c.h ? 0 : (c.y / (H - c.h)) * 100;
    return `background-image:url('${url(P.collage)}');background-size:${sx}% ${sy}%;background-position:${px}% ${py}%`;
  }

  /* ---------------- layout builders ---------------- */
  const LAYOUTS = {
    wide: (s) => `
      <div class="content">
        <div class="frame"><div class="tilt"><div class="card">
          <img src="${url(s.img)}" alt="Birthday collage" draggable="false"><span class="sheen"></span>
        </div></div></div>
        ${copyHTML(s)}
      </div>
      ${s.finale ? sparks() : ""}`,

    mosaic: (s) => `
      <div class="content">
        ${copyHTML(s)}
        <div class="tilt"><div class="mosaic">
          ${s.imgs.map((src, d) => `<div class="tile" style="--d:${d}">${photo(src, d)}<span class="label" style="--d:${d}">${s.labels[d]}</span></div>`).join("")}
        </div></div>
      </div>`,

    fan: (s) => {
      const pos = [
        { x: "-58%", y: "4%",  r: "-11deg", z: 1 },
        { x: "0%",   y: "-4%", r: "2deg",   z: 3 },
        { x: "58%",  y: "6%",  r: "12deg",  z: 2 },
      ];
      return `
      ${s.bubbles ? bubbles() : ""}
      <div class="content">
        <div class="fan">
          ${s.imgs.map((src, d) => {
            const p = pos[d];
            return `<div class="fan-card" style="--x:${p.x};--y:${p.y};--r:${p.r};--z:${p.z};--d:${d}">
              <div class="fan-inner">${photo(src, d)}<span class="note" style="--d:${d}">${s.notes[d]}</span></div>
            </div>`;
          }).join("")}
        </div>
        ${copyHTML(s)}
      </div>`;
    },

    split: (s) => `
      ${s.sun ? '<div class="sun"></div>' : ""}
      <div class="panel" style="--pos:${s.pos}"><img src="${url(s.img)}" alt="" draggable="false"></div>
      <span class="seam"></span>
      <div class="inset">${photo(s.inset, 3)}</div>
      <div class="content">${copyHTML(s)}</div>`,

    reel: (s) => `
      <div class="content">
        ${copyHTML(s)}
        <div class="reel-wrap"><div class="reel">
          ${REEL.map((c) => `<div class="frm" style="--ar:${c.w}/${c.h}"><div class="crop" style="${cropStyle(c)}"></div></div>`).join("")}
        </div></div>
      </div>`,
  };

  function sparks() {
    const spots = [[8, 14], [90, 18], [14, 78], [86, 72], [50, 6], [70, 40], [28, 36]];
    return spots.map(([x, y], d) => `<span class="spark" style="left:${x}%;top:${y}%;--d:${d}">✦</span>`).join("");
  }
  function bubbles() {
    let h = '<div class="bubbles">';
    for (let i = 0; i < 18; i++) {
      h += `<i style="--l:${rand(0, 100)}%;--s:${rand(6, 22)}px;--dur:${rand(7, 14)}s;--del:${rand(-14, 0)}s;--dx:${rand(-60, 60)}px"></i>`;
    }
    return h + "</div>";
  }

  /* ---------------- build DOM (runs after everything is preloaded) ---------------- */
  const slidesEl = $("#slides");
  const segEl = $("#segments");
  const rollEl = $("#rollCur");
  document.documentElement.style.setProperty("--t", CONFIG.transition + "ms");
  let slideEls = [];
  let segs = [];

  function buildSlides() {
  SLIDES.forEach((s, i) => {
    const el = document.createElement("section");
    el.className = `slide l-${s.layout}${s.flip ? " flip" : ""}`;
    el.dataset.theme = s.theme;
    el.setAttribute("aria-roledescription", "slide");
    el.setAttribute("aria-label", `${i + 1} of ${SLIDES.length}`);
    el.style.setProperty("--kbx", `${rand(-3, 3)}%`);
    el.style.setProperty("--kby", `${rand(-2, 2)}%`);
    el.innerHTML = `
      <div class="bg${s.sharpBg ? " sharp" : ""}"><img src="${url(s.sharpBg ? s.bg : bgOf(s.bg))}" alt="" draggable="false"></div>
      <div class="tint"></div>
      ${s.word ? `<span class="big-word">${esc(s.word)}</span>` : ""}
      ${LAYOUTS[s.layout](s)}`;
    slidesEl.appendChild(el);

    const seg = document.createElement("div");
    seg.className = "seg";
    seg.innerHTML = '<span class="fill"></span>';
    seg.setAttribute("role", "button");
    seg.setAttribute("aria-label", `Go to slide ${i + 1}`);
    seg.addEventListener("click", () => go(i));
    segEl.appendChild(seg);

    rollEl.insertAdjacentHTML("beforeend", `<span>${pad(i + 1)}</span>`);
  });
  $("#countTotal").textContent = pad(SLIDES.length);
  slideEls = $$(".slide", slidesEl);
  segs = $$(".seg", segEl);
  }

  /* ---------------- slider state ---------------- */
  let current = -1;
  let started = false;
  let paused = false;
  let elapsed = 0;
  let lastT = performance.now();
  const TCLASSES = ["t-circle", "t-split", "t-diagonal", "t-zoom", "t-curtain", "t-shutter", "t-iris"];
  const leaveTimers = new WeakMap();

  function go(n, dir) {
    n = (n + SLIDES.length) % SLIDES.length;
    if (n === current) return;
    if (dir === undefined) dir = n > current ? 1 : -1;

    const prev = slideEls[current];
    const next = slideEls[n];
    const t = SLIDES[n].transition || "zoom";

    if (prev) {
      prev.classList.remove("is-active", ...TCLASSES);
      prev.classList.add("is-leaving");
      clearTimeout(leaveTimers.get(prev));
      leaveTimers.set(prev, setTimeout(() => prev.classList.remove("is-leaving"), CONFIG.transition + 80));
    }

    // origin for circular reveals follows direction
    next.style.setProperty("--ox", dir > 0 ? `${rand(70, 95)}%` : `${rand(5, 30)}%`);
    next.style.setProperty("--oy", `${rand(25, 75)}%`);

    next.classList.remove("is-leaving", "is-active", ...TCLASSES);
    void next.offsetWidth;                 // restart every animation inside
    next.classList.add("is-active", "t-" + t);

    if (t === "shutter") runOverlay($("#shutter"));
    runOverlay($("#leak"));

    current = n;
    elapsed = -CONFIG.settle;   // hold starts only once the slide has settled
    updateUI();

    if (SLIDES[n].finale && started) {
      setTimeout(() => burst(innerWidth * .2, innerHeight * .3, 90), 500);
      setTimeout(() => burst(innerWidth * .8, innerHeight * .3, 90), 750);
    }
  }
  const nextSlide = () => go(current + 1, 1);
  const prevSlide = () => go(current - 1, -1);

  function runOverlay(el) {
    el.classList.remove("run");
    void el.offsetWidth;
    el.classList.add("run");
  }
  $$("#shutter i").forEach((b, i) => b.style.setProperty("--i", i));

  function updateUI() {
    segs.forEach((s, i) => {
      s.classList.toggle("current", i === current);
      s.style.setProperty("--p", i < current ? 1 : 0);
      s.querySelector(".fill").style.setProperty("--p", i < current ? 1 : 0);
    });
    rollEl.style.transform = `translateY(${-current * 1.6}rem)`;
  }

  function setPaused(v) {
    paused = v;
    document.body.classList.toggle("paused", paused);
    $("#playBtn").setAttribute("aria-label", paused ? "Play" : "Pause");
  }

  /* ---------------- main loop (progress + parallax + cursor) ---------------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, sx: 0, sy: 0, rx: innerWidth / 2, ry: innerHeight / 2 };
  const root = document.documentElement;
  const dot = $(".cursor-dot"), ring = $(".cursor-ring");

  function loop(now) {
    const dt = Math.min(100, now - lastT);
    lastT = now;

    if (started && !paused && !document.hidden) {
      elapsed += dt;
      if (elapsed >= CONFIG.interval) nextSlide();
      const fill = segs[current] && segs[current].querySelector(".fill");
      if (fill) fill.style.setProperty("--p", Math.min(1, (elapsed + CONFIG.settle) / (CONFIG.interval + CONFIG.settle)));
    }

    // smoothed parallax -1..1
    const tx = (mouse.x / innerWidth) * 2 - 1;
    const ty = (mouse.y / innerHeight) * 2 - 1;
    mouse.sx += (tx - mouse.sx) * 0.06;
    mouse.sy += (ty - mouse.sy) * 0.06;
    root.style.setProperty("--mx", mouse.sx.toFixed(4));
    root.style.setProperty("--my", mouse.sy.toFixed(4));

    // cursor ring lerp
    mouse.rx += (mouse.x - mouse.rx) * 0.18;
    mouse.ry += (mouse.y - mouse.ry) * 0.18;
    dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
    ring.style.transform = `translate3d(${mouse.rx}px, ${mouse.ry}px, 0)`;

    drawFX(dt);
    requestAnimationFrame(loop);
  }

  /* ---------------- input ---------------- */
  const finePointer = matchMedia("(pointer: fine)").matches;
  if (finePointer) document.body.classList.add("has-cursor");

  let idleTimer;
  function wake() {
    document.body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (started) document.body.classList.add("idle"); }, CONFIG.idleHide);
  }

  addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; wake(); });
  addEventListener("mousedown", () => document.body.classList.add("cursor-down"));
  addEventListener("mouseup", () => document.body.classList.remove("cursor-down"));
  document.addEventListener("mouseover", (e) => {
    const hit = e.target.closest("button, .seg, .fan-inner, .frm, .tile");
    document.body.classList.toggle("cursor-hover", !!hit);
  });

  // magnetic buttons
  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.3}px, ${y * 0.35}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });

  $("#prevBtn").addEventListener("click", prevSlide);
  $("#nextBtn").addEventListener("click", nextSlide);
  $("#playBtn").addEventListener("click", () => setPaused(!paused));
  $("#fsBtn").addEventListener("click", toggleFS);

  addEventListener("keydown", (e) => {
    if (!started) {
      if ((e.key === "Enter" || e.key === " ") && !startBtn.disabled) { e.preventDefault(); start(); }
      return;
    }
    if (e.key === "ArrowRight") nextSlide();
    else if (e.key === "ArrowLeft") prevSlide();
    else if (e.key === " ") { e.preventDefault(); setPaused(!paused); }
    else if (e.key.toLowerCase() === "f") toggleFS();
    else if (e.key.toLowerCase() === "m") toggleMute();
    wake();
  });

  // swipe
  let tStart = null;
  addEventListener("touchstart", (e) => { tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (!tStart || !started) return;
    const dx = e.changedTouches[0].clientX - tStart.x;
    const dy = e.changedTouches[0].clientY - tStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? nextSlide() : prevSlide();
    tStart = null;
  });

  // fullscreen — "window / monitor size"
  function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  document.addEventListener("fullscreenchange", () =>
    document.body.classList.toggle("is-fs", !!document.fullscreenElement));

  /* ---------------- FX canvas: golden dust + confetti ---------------- */
  const cv = $("#fx");
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = LITE ? 1 : Math.min(2, devicePixelRatio || 1);
    W = cv.width = innerWidth * DPR;
    H = cv.height = innerHeight * DPR;
  }
  resize();
  addEventListener("resize", resize);

  let dust = Array.from({ length: 70 }, () => ({
    x: Math.random(), y: Math.random(),
    r: rand(.6, 2.2), s: rand(.00004, .00014),
    tw: rand(0, Math.PI * 2), tws: rand(.001, .003),
  }));
  const confetti = [];
  let fxDirty = true;
  const COLORS = ["#f1cf86", "#d9a74a", "#a3242a", "#fbf3e4", "#2a8c95", "#ff8a7a"];

  function burst(x, y, n = 120) {
    if (LITE) n = Math.round(n * 0.4);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(4, 13);
      confetti.push({
        x: x * DPR, y: y * DPR,
        vx: Math.cos(a) * v * DPR, vy: (Math.sin(a) * v - rand(4, 8)) * DPR,
        w: rand(5, 11) * DPR, h: rand(8, 16) * DPR,
        rot: rand(0, Math.PI), vr: rand(-.25, .25),
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1, flip: rand(0, Math.PI), shape: Math.random() < .25 ? "circle" : "rect",
      });
    }
  }

  function drawFX(dt) {
    if (LITE && !confetti.length) { if (fxDirty) { ctx.clearRect(0, 0, W, H); fxDirty = false; } return; }
    fxDirty = true;
    ctx.clearRect(0, 0, W, H);
    // dust
    if (!LITE) for (const p of dust) {
      p.y -= p.s * dt; p.tw += p.tws * dt;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      const a = 0.25 + Math.sin(p.tw) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = `rgba(241,207,134,${a})`;
      ctx.arc((p.x + mouseShift(p.r)) * W, p.y * H, p.r * DPR, 0, Math.PI * 2);
      ctx.fill();
    }
    // confetti
    const k = dt / 16.67;
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.vy += 0.32 * DPR * k; c.vx *= 0.985; c.vy *= 0.985;
      c.x += c.vx * k; c.y += c.vy * k;
      c.rot += c.vr * k; c.flip += 0.12 * k;
      if (c.y > H + 40) c.life -= 0.05;
      if (c.y > H * 0.7) c.life -= 0.008 * k;
      if (c.life <= 0) { confetti.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.scale(1, Math.cos(c.flip));
      ctx.fillStyle = c.c;
      if (c.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, c.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
  }
  const mouseShift = (depth) => mouse.sx * depth * 0.004;

  // confetti on click anywhere in the slideshow
  $("#stage").addEventListener("click", (e) => {
    if (e.target.closest("button, .seg")) return;
    burst(e.clientX, e.clientY, 40);
  });


  /* ---------------- MUSIC (2-song playlist, loops forever) ---------------- */
  const PLAYLIST = [
    { src: "01 - Namo Namo - SenSongsMp3.Co.mp3", title: "Namo Namo" },
    { src: "Vachindi Kada Avakasam(SenSongsMp3.Com).mp3", title: "Vachindi Kada Avakasam" },
  ];
  const MUSIC_VOLUME = 0.7;
  const audio = new Audio();
  audio.preload = "auto";
  audio.id = "bgm";
  document.body.appendChild(audio);   // no controls → invisible, but inspectable
  let track = 0, muted = false, npTimer;

  function loadTrack(i) {
    track = (i + PLAYLIST.length) % PLAYLIST.length;
    audio.src = url(PLAYLIST[track].src);
    $("#npTitle").textContent = PLAYLIST[track].title;
  }
  function showNowPlaying() {
    const np = $("#nowPlaying");
    np.classList.add("show");
    clearTimeout(npTimer);
    npTimer = setTimeout(() => np.classList.remove("show"), 4500);
  }
  function fadeTo(target, ms = 1200) {
    const from = audio.volume, t0 = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - t0) / ms);
      audio.volume = Math.min(1, Math.max(0, from + (target - from) * k));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function playMusic() {
    audio.volume = 0;
    audio.play().then(() => { fadeTo(muted ? 0 : MUSIC_VOLUME); showNowPlaying(); }).catch(() => {});
  }
  audio.addEventListener("ended", () => { loadTrack(track + 1); playMusic(); });   // song 1 → song 2 → song 1 …
  audio.addEventListener("error", () => { loadTrack(track + 1); playMusic(); });

  function toggleMute() {
    muted = !muted;
    document.body.classList.toggle("muted", muted);
    $("#musicBtn").setAttribute("aria-label", muted ? "Unmute music" : "Mute music");
    if (audio.paused && !muted) playMusic();
    else fadeTo(muted ? 0 : MUSIC_VOLUME, 500);
    if (!muted) showNowPlaying();
  }
  $("#musicBtn").addEventListener("click", toggleMute);

  /* =========================================================
     PRELOADER — "system check" that loads EVERYTHING before play
     ========================================================= */
  const startBtn = $("#startBtn");
  $("#introName").textContent = `for ${CONFIG.name} ✦`;

  const checksEl = $("#checks");
  const STEPS = [
    ["display", "Checking display"],
    ["perf",    "Testing performance"],
    ["fonts",   "Loading fonts"],
    ["photos",  "Loading photos"],
    ["music",   "Loading music"],
    ["slides",  "Preparing slides"],
  ];
  STEPS.forEach(([id, label]) => checksEl.insertAdjacentHTML("beforeend",
    `<li data-step="${id}" data-state="wait"><span class="ck"></span><span class="lbl">${label}</span><span class="val"></span></li>`));
  const step = (id, state, val) => {
    const li = $(`[data-step="${id}"]`, checksEl);
    if (state) li.dataset.state = state;
    if (val !== undefined) $(".val", li).textContent = val;
  };

  // weighted overall progress (bytes for photos & music)
  const prog = { photos: 0, music: 0, other: 0 };
  function renderProgress() {
    const pct = Math.round((prog.other * 0.15 + prog.photos * 0.35 + prog.music * 0.5) * 100);
    $("#loaderFill").style.width = pct + "%";
    $("#loaderPct").textContent = pct + "%";
  }

  const mb = (b) => (b / 1048576).toFixed(1);
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const withTimeout = (p, ms) => Promise.race([p, wait(ms)]);

  // fetch a file fully into memory, reporting bytes as they arrive
  async function fetchBlob(path, onBytes) {
    const res = await fetch(encodeURI(path), { cache: "force-cache" });
    if (!res.ok) throw new Error(res.status + " " + path);
    const total = +res.headers.get("content-length") || 0;
    if (!res.body || !res.body.getReader) {           // older browsers: no streaming
      const b = await res.blob(); onBytes(b.size, b.size || total); return b;
    }
    const reader = res.body.getReader(), parts = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value); got += value.length;
      onBytes(got, total);
    }
    return new Blob(parts, { type: res.headers.get("content-type") || "" });
  }

  // measure real frame rate for ~1s
  function measureFPS(ms = 1000) {
    return new Promise((resolve) => {
      let frames = 0; const t0 = performance.now();
      (function f(now) {
        frames++;
        if (now - t0 < ms) requestAnimationFrame(f);
        else resolve(Math.round((frames * 1000) / (now - t0)));
      })(t0);
    });
  }

  async function boot() {
    try {
      // 1. display
      step("display", "run");
      await wait(250);
      const dpr = devicePixelRatio || 1;
      step("display", "done", `${Math.round(innerWidth * dpr)}×${Math.round(innerHeight * dpr)}`);
      prog.other = 0.15; renderProgress();

      // 2. performance
      step("perf", "run");
      const fps = await measureFPS(1000);
      if (!qs.has("full") && !qs.has("lite") && fps < 40) LITE = true;
      applyLite();
      if (LITE) resize();
      step("perf", LITE ? "warn" : "done", LITE ? `${fps} fps · TV mode` : `${fps} fps · full effects`);
      prog.other = 0.35; renderProgress();

      // 3. fonts
      step("fonts", "run");
      if (document.fonts && document.fonts.ready) await withTimeout(document.fonts.ready, 5000);
      step("fonts", "done", "ready");
      prog.other = 0.5; renderProgress();

      // 4 + 5. photos and music in parallel
      const photoPaths = [...new Set(Object.values(P))];
      const allImgs = [...photoPaths, ...photoPaths.map(bgOf)];
      let imgsDone = 0;
      step("photos", "run", `0 / ${allImgs.length}`);
      const photosJob = Promise.all(allImgs.map(async (p) => {
        try {
          const blob = await fetchBlob(p, () => {});
          BLOB[p] = URL.createObjectURL(blob);
          const im = new Image();
          im.src = BLOB[p];
          if (im.decode) await im.decode().catch(() => {});   // decode now, not mid-transition
        } catch (e) { /* fall back to normal URL */ }
        imgsDone++;
        prog.photos = imgsDone / allImgs.length; renderProgress();
        step("photos", null, `${imgsDone} / ${allImgs.length}`);
      })).then(() => step("photos", "done", `${allImgs.length} / ${allImgs.length}`));

      const songBytes = PLAYLIST.map(() => ({ got: 0, total: 0 }));
      step("music", "run", "0.0 MB");
      const musicJob = Promise.all(PLAYLIST.map(async (t, i) => {
        try {
          const blob = await fetchBlob(t.src, (got, total) => {
            songBytes[i].got = got; songBytes[i].total = total;
            const g = songBytes.reduce((a, s) => a + s.got, 0);
            const tot = songBytes.reduce((a, s) => a + s.total, 0);
            prog.music = tot ? g / tot : 0; renderProgress();
            step("music", null, tot ? `${mb(g)} / ${mb(tot)} MB` : `${mb(g)} MB`);
          });
          BLOB[t.src] = URL.createObjectURL(blob);
        } catch (e) { /* stream normally instead */ }
      })).then(() => { prog.music = 1; renderProgress(); step("music", "done", `${PLAYLIST.length} songs`); });

      await Promise.all([photosJob, musicJob]);
      loadTrack(0);

      // 6. build every slide and render each one once (warms the GPU & image cache)
      step("slides", "run");
      buildSlides();
      for (let i = 0; i < slideEls.length; i++) {
        step("slides", null, `${i + 1} / ${slideEls.length}`);
        slideEls[i].classList.add("warm");
        await nextFrame(); await nextFrame();
        slideEls[i].classList.remove("warm");
      }
      step("slides", "done", "all set");
      prog.other = 1; renderProgress();
    } catch (e) {
      console.warn("Preload issue, continuing:", e);
      if (!slideEls.length) buildSlides();
      if (!audio.src) loadTrack(0);
    }
    ready();
  }

  function ready() {
    $("#loaderMsg").textContent = "Everything's ready";
    setTimeout(() => {
      $("#loader").classList.add("is-done");
      setTimeout(() => {
        $("#loader").hidden = true;
        startBtn.disabled = false;
        startBtn.classList.add("is-ready");
        startBtn.focus({ preventScroll: true });     // TV remote: just press OK
      }, 500);
    }, 700);
  }

  function start() {
    if (started) return;
    const r = startBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const intro = $("#intro");
    intro.style.setProperty("--cx", cx + "px");
    intro.style.setProperty("--cy", cy + "px");

    document.documentElement.requestFullscreen?.().catch(() => {});
    burst(cx, cy, 160);
    playMusic();

    started = true;
    go(0, 1);
    intro.classList.add("is-gone");
    setTimeout(() => intro.remove(), 1500);
    wake();
  }
  startBtn.addEventListener("click", start);

  requestAnimationFrame(loop);
  boot();
})();
