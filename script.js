 /*=============================================
   BAHAGIAN 1: BOUQUET (canvas ASCII 3D)
   Didedahkan sebagai window.startBouquet()
   ========================================================= */
   (function () {
    "use strict";
  
    // ============ TETAPAN (ubah di sini) ============
    var CONFIG = {
      message: "For Nurin <3",
      palette: ["#ff6fa5", "#ff9ec4", "#ffd166", "#7bdff2", "#b79ced", "#ffffff"],
      leaf: ["#3fa34d", "#6bcf6b", "#2f7d3a"],
      wrap: ["#e8b4a0", "#f4cdbd", "#d98f7a"],
      flowers: 13,
      rotateSpeed: 0.5,   // putaran bouquet (radian/saat). 0 = berhenti
      petalSpin: 1.2,     // kelajuan kelopak berpusing
      seed: 7
    };
    // ================================================
  
    var canvas = document.getElementById("stage");
    var ctx = canvas.getContext("2d");
    var COLS = 72, ROWS = 46;
    var wrapTopY = 28;
    var CX = COLS / 2;
    var W = 0, H = 0, dpr = 1, font = 12, cw = 7, chh = 13;
  
    function mulberry(a) {
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    var rnd = mulberry(CONFIG.seed);
    function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  
    var glyphs = [];
    var floaters = [];
    var stars = [];
    var flowers = [];
    var t0 = performance.now();
    var running = false;
  
    function buildBouquet() {
      glyphs = [];
      flowers = [];
      var wrapTop = 25, wrapBot = 35;
  
      var tries = 0;
      while (flowers.length < CONFIG.flowers && tries++ < 800) {
        var x = (rnd() - 0.5) * 44;
        var z = (rnd() - 0.5) * 44;
        var y = 4 + rnd() * 17;
        var r = 2.3 + rnd() * 1.2;
        if (Math.hypot(x / 21, (y - 13) / 9.5, z / 21) > 1) continue;
        var tooClose = flowers.some(function (o) {
          return Math.hypot((o.x - x) / 2, o.y - y, (o.z - z) / 2) < (o.r + r) * 0.9;
        });
        if (tooClose) continue;
  
        var cells = [];
        for (var gy = -Math.ceil(r) - 1; gy <= r + 1; gy++) {
          for (var gx = -Math.ceil(r * 2.2); gx <= r * 2.2; gx++) {
            var dx = gx / 2;
            cells.push({ gx: gx, gy: gy, dist: Math.hypot(dx, gy), ang: Math.atan2(gy, dx) });
          }
        }
        flowers.push({
          x: x, y: y, z: z, r: r, cells: cells,
          color: pick(CONFIG.palette),
          petals: 5 + Math.floor(rnd() * 3),
          dir: rnd() < 0.5 ? -1 : 1,
          speed: 0.7 + rnd() * 0.8,
          delay: 0.9 + flowers.length * 0.12
        });
      }
  
      // batang + daun
      flowers.forEach(function (f) {
        var steps = 22;
        for (var s = 0; s <= steps; s++) {
          var k = s / steps;
          var yy = f.y + f.r * 0.7 + (wrapTop + 3 - f.y - f.r * 0.7) * k;
          var px = f.x * (1 - k), pz = f.z * (1 - k);
          glyphs.push({ kind: "stem", f: f, x: px, y: yy, z: pz, color: CONFIG.leaf[0], delay: 0.4 + (1 - k) * 0.6 });
          if (s % 7 === 3) {
            for (var l = 1; l <= 3; l++) {
              glyphs.push({
                kind: "leaf", ch: l === 3 ? "}" : "~",
                x: px + l * (s % 2 ? 1 : -1), y: yy - l * 0.3, z: pz,
                color: pick(CONFIG.leaf), delay: 0.8
              });
            }
          }
        }
      });
  
      // pembalut (kon)
      for (var wy = wrapTop; wy <= wrapBot; wy++) {
        var kk = (wy - wrapTop) / (wrapBot - wrapTop);
        var rad = 16 * (1 - kk) + 1;
        var n = Math.ceil(rad * 3.6);
        for (var i = 0; i < n; i++) {
          var th = (i / n) * Math.PI * 2;
          var rib = wy === wrapTop + 3;
          var ch = rib ? "=" : (i + wy) % 4 === 0 ? "v" : (i + wy) % 4 === 2 ? "^" : "\u00b7";
          glyphs.push({
            kind: "wrap", ch: ch,
            x: Math.cos(th) * rad, y: wy, z: Math.sin(th) * rad,
            color: rib ? "#ff6fa5" : pick(CONFIG.wrap), delay: 1.6 + kk * 0.4
          });
        }
      }
      // pita di depan
      "(\\ /)".split("").forEach(function (c, i) {
        glyphs.push({ kind: "bow", ch: c, x: -2 + i, y: wrapTop + 4, z: 0, color: "#ff6fa5", delay: 2.1 });
      });
    }
  
    function buildStars() {
      stars = [];
      for (var i = 0; i < 70; i++) {
        stars.push({ x: rnd() * COLS, y: rnd() * ROWS, p: rnd() * 6.28, ch: pick([".", "\u00b7", "+", "*"]) });
      }
    }
  
    function spawnFloater(initial) {
      var kinds = [
        { ch: "<3", c: "#ff6fa5" },
        { ch: "\u2665", c: "#ff9ec4" },
        { ch: "*", c: "#ffd166" },
        { ch: "+", c: "#7bdff2" },
        { ch: ".", c: "#ffffff" },
        { ch: "(\u2661)", c: "#b79ced" }
      ];
      var k = pick(kinds);
      floaters.push({
        ch: k.ch, c: k.c,
        x: rnd() * COLS,
        y: initial ? rnd() * ROWS : ROWS + 2,
        vy: 1.2 + rnd() * 2.2,
        drift: (rnd() - 0.5) * 2,
        ph: rnd() * 6.28
      });
    }
  
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      font = Math.max(6, Math.min(W / (COLS * 0.6), H / (ROWS * 1.12)));
      ctx.font = font + 'px "Courier New", monospace';
      cw = ctx.measureText("M").width;
      chh = font * 1.12;
    }
  
    function drawCat(t, ox, oy) {
      var blink = Math.sin(t * 1.3) > 0.97;
      var eye = blink ? "-" : "o";
      var lines = [
        " /\\_/\\ ",
        "( " + eye + "." + eye + " )",
        " > ^ < ",
        "/(   )\\",
        " U\u201d U\u201d "
      ];
      ctx.fillStyle = "#f5f0ff";
      lines.forEach(function (ln, i) {
        for (var j = 0; j < ln.length; j++) {
          if (ln[j] !== " ") ctx.fillText(ln[j], ox + j * cw, oy + i * chh);
        }
      });
      var beat = 1 + 0.25 * Math.max(0, Math.sin(t * 5));
      ctx.fillStyle = "#ff6fa5";
      ctx.font = (font * beat) + 'px "Courier New", monospace';
      ctx.fillText("<3", ox + 2.5 * cw, oy + 3 * chh);
      ctx.font = font + 'px "Courier New", monospace';
    }
  
    function frame(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.font = font + 'px "Courier New", monospace';
      var gx = (W - COLS * cw) / 2;
      var gy = (H - ROWS * chh) / 2 + chh;
      ctx.textBaseline = "alphabetic";
  
      // bintang
      stars.forEach(function (s) {
        ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + s.p));
        ctx.fillStyle = "#cdbfff";
        ctx.fillText(s.ch, gx + s.x * cw, gy + s.y * chh);
      });
  
      // bouquet 3D berputar
      var phi = t * CONFIG.rotateSpeed;
      var cs = Math.cos(phi), sn = Math.sin(phi);
      var R = 24;
      var items = [];
      function proj(x, z) { return [x * cs + z * sn, -x * sn + z * cs]; }
      function shade(zr) { return 0.5 + 0.5 * (zr + R) / (2 * R); }
  
      glyphs.forEach(function (g) {
        var a = Math.min(1, Math.max(0, (t - g.delay * 0.9) * 3));
        if (a <= 0) return;
        var p = g.kind === "bow" ? [g.x, 30] : proj(g.x, g.z);
        var xr = p[0], zr = p[1];
        var ch = g.ch;
        if (g.kind === "stem") {
          var fx = proj(g.f.x, g.f.z)[0];
          var slope = fx / (wrapTopY - g.f.y);
          ch = Math.abs(slope) < 0.22 ? "|" : fx > 0 ? "/" : "\\";
        }
        var sway = Math.sin(t * 1.1 + g.y * 0.08) * 0.3 * ((ROWS - g.y) / ROWS);
        items.push({ ch: ch, x: xr + sway, y: g.y - (1 - a) * 2, z: zr, c: g.color, a: a * (g.kind === "bow" ? 1 : shade(zr)) });
      });
  
      flowers.forEach(function (f) {
        var a = Math.min(1, Math.max(0, (t - f.delay * 0.9) * 3));
        if (a <= 0) return;
        var p = proj(f.x, f.z);
        var fx = p[0], fz = p[1];
        var spin = t * CONFIG.petalSpin * f.speed * f.dir;
        var grow = Math.min(1, a * 1.2);
        var sway = Math.sin(t * 1.1 + f.y * 0.08) * 0.3 * ((ROWS - f.y) / ROWS);
        f.cells.forEach(function (c) {
          var edge = f.r * grow * (0.72 + 0.28 * Math.cos(f.petals * (c.ang - spin)));
          if (c.dist > edge) return;
          var ch;
          if (c.dist < 0.9) ch = "@";
          else if (c.dist < edge * 0.45) ch = "O";
          else if (c.dist < edge * 0.75) ch = "o";
          else ch = "*";
          items.push({
            ch: ch, x: fx + c.gx + sway, y: f.y + c.gy, z: fz + 0.5,
            c: c.dist < 0.9 ? "#ffd166" : f.color, a: a * shade(fz)
          });
        });
      });
  
      items.sort(function (p, q) { return p.z - q.z; });
      items.forEach(function (it) {
        ctx.globalAlpha = it.a;
        ctx.fillStyle = it.c;
        ctx.fillText(it.ch, gx + (CX + it.x) * cw, gy + it.y * chh);
      });
      ctx.globalAlpha = 1;
  
      // kucing
      ctx.globalAlpha = Math.min(1, Math.max(0, (t - 2.4) * 2));
      drawCat(t, gx + (CX - 3.5) * cw, gy + 36 * chh);
  
      // mesej ditaip
      var shown = Math.floor(Math.max(0, t - 3.2) * 14);
      var msg = CONFIG.message.slice(0, shown);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffd6e7";
      var mw = ctx.measureText(CONFIG.message).width;
      ctx.fillText(
        msg + (Math.floor(t * 2) % 2 && shown < CONFIG.message.length + 20 ? "_" : ""),
        gx + (COLS * cw - mw) / 2, gy + 43 * chh
      );
  
      // zarah terapung
      if (t > 1.5 && floaters.length < 55 && rnd() < 0.18) spawnFloater(false);
      for (var i = floaters.length - 1; i >= 0; i--) {
        var f = floaters[i];
        f.y -= f.vy * 0.016;
        f.x += Math.sin(t * 1.5 + f.ph) * 0.03 + f.drift * 0.004;
        if (f.y < -2) { floaters.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, f.y / 6, (ROWS - f.y) / 4 + 0.3) * 0.9;
        ctx.fillStyle = f.c;
        ctx.fillText(f.ch, gx + f.x * cw, gy + f.y * chh);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
  
    function start() {
      rnd = mulberry(CONFIG.seed);
      resize();
      buildBouquet();
      buildStars();
      floaters = [];
      for (var i = 0; i < 12; i++) spawnFloater(true);
      t0 = performance.now();
    }
  
    window.addEventListener("resize", resize);
    document.getElementById("replay").addEventListener("click", function () {
      t0 = performance.now();
    });
  
    window.startBouquet = function () {
      start();
      if (!running) { running = true; requestAnimationFrame(frame); }
    };
  })();
  
  
  /* =========================================================
     BAHAGIAN 2: KAD (sampul -> surat -> kek -> bouquet)
     ========================================================= */
  (function () {
    "use strict";
  
    var $ = function (id) { return document.getElementById(id); };
    var letterSong = $("letterMusic");
    var birthdaySong = $("bgMusic");
    var muted = false;
  
    function safePlay(a) {
      try { var p = a.play(); if (p && p.catch) { p.catch(function () {}); } } catch (e) {}
    }
  
    function show(id) {
      var screens = document.querySelectorAll(".screen");
      for (var i = 0; i < screens.length; i++) { screens[i].classList.remove("active"); }
      $(id).classList.add("active");
    }
  
    /* Hati terapung di latar */
    (function () {
      var box = $("bgHearts");
      var icons = ["💗", "💖", "💕", "🤍", "✨", "🧸", "🌸"];
      function spawn() {
        var s = document.createElement("span");
        s.textContent = icons[Math.floor(Math.random() * icons.length)];
        s.style.left = (Math.random() * 96) + "%";
        s.style.fontSize = (16 + Math.random() * 26) + "px";
        var dur = 7 + Math.random() * 7;
        s.style.animationDuration = dur + "s";
        box.appendChild(s);
        setTimeout(function () { s.remove(); }, dur * 1000 + 200);
      }
      for (var i = 0; i < 8; i++) { setTimeout(spawn, i * 350); }
      setInterval(function () { if (!document.hidden) { spawn(); } }, 900);
    })();
  
    /* Bunting */
    (function () {
      var b = $("bunting");
      var n = Math.max(8, Math.floor(window.innerWidth / 70));
      for (var i = 0; i < n; i++) {
        var f = document.createElement("i");
        f.style.setProperty("--d", (i * 0.15 % 1.6) + "s");
        b.appendChild(f);
      }
    })();
  
    /* Confetti */
    var cv = $("fx"), cx = cv.getContext("2d");
    var W = 0, H = 0, parts = [], raf = null;
    var colors = ["#ff8fc7", "#ffd6e8", "#c77dff", "#ffe08a", "#ff5fa8", "#ffffff"];
  
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();
  
    function burst(n, x, y) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
        parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, g: .24,
          w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
          r: Math.random() * 6, vr: (Math.random() - .5) * .4,
          c: colors[i % colors.length], round: Math.random() < .25,
          life: 130 + Math.random() * 90
        });
      }
      if (!raf) { loop(); }
    }
  
    function rain(n) {
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W, y: -20 - Math.random() * H * 0.4,
          vx: (Math.random() - .5) * 1.4, vy: 2 + Math.random() * 3, g: .01,
          w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
          r: Math.random() * 6, vr: (Math.random() - .5) * .25,
          c: colors[i % colors.length], round: Math.random() < .25,
          life: 260 + Math.random() * 120
        });
      }
      if (!raf) { loop(); }
    }
  
    function loop() {
      cx.clearRect(0, 0, W, H);
      parts = parts.filter(function (p) { return p.life > 0 && p.y < H + 30; });
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.vx *= .992; p.vy += p.g;
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
        cx.save();
        cx.globalAlpha = Math.min(1, p.life / 40);
        cx.translate(p.x, p.y);
        cx.rotate(p.r);
        cx.fillStyle = p.c;
        if (p.round) { cx.beginPath(); cx.arc(0, 0, p.h / 2 + 1, 0, 6.3); cx.fill(); }
        else { cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        cx.restore();
      }
      if (parts.length) { raf = requestAnimationFrame(loop); }
      else { raf = null; cx.clearRect(0, 0, W, H); }
    }
  
    /* Skrin 1 -> 2 */
    var opened = false;
    function openGift() {
      if (opened) { return; }
      opened = true;
      $("openBtn").disabled = true;
      $("envelope").classList.add("open");
      safePlay(letterSong);
      setTimeout(function () {
        show("letter");
        burst(40, W / 2, H / 2);
      }, 1500);
    }
    $("openBtn").addEventListener("click", openGift);
    $("envelope").addEventListener("click", openGift);
    $("envelope").addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGift(); }
    });
  
    /* Skrin 2 -> 3 */
    function showBirthday() {
      show("birthday");
      letterSong.pause();
      try { letterSong.currentTime = 0; } catch (e) {}
      safePlay(birthdaySong);
      $("musicBtn").classList.add("show");
      burst(90, W / 2, H * 0.4);
      setTimeout(function () { rain(70); }, 500);
    }
    $("continueBtn").addEventListener("click", showBirthday);
  
    /* Tiup lilin */
    var blown = false;
    function blow() {
      if (blown) { return; }
      blown = true;
      $("cake").classList.add("out");
      $("blowBtn").disabled = true;
      $("blowBtn").textContent = "🎂 Your wish is on its way 💫";
      $("wish").classList.add("show");
      var r = $("cake").getBoundingClientRect();
      burst(140, r.left + r.width / 2, r.top + 20);
      setTimeout(function () { rain(120); }, 350);
      setTimeout(function () { $("bouquetBtn").classList.add("show"); }, 2500);
    }
    $("blowBtn").addEventListener("click", blow);
    $("cake").addEventListener("click", blow);
    $("cake").addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blow(); }
    });
  
    /* Skrin 3 -> 4 (bouquet) */
    $("bouquetBtn").addEventListener("click", function () {
      show("bouquet");
      burst(60, W / 2, H / 2);
      window.startBouquet();
    });
  
    /* Butang muzik */
    $("musicBtn").addEventListener("click", function () {
      muted = !muted;
      letterSong.muted = muted;
      birthdaySong.muted = muted;
      this.textContent = muted ? "🔇" : "🔊";
    });
  })();