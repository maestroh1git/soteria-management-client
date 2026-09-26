/*
 * A tiny, deterministic animation engine.
 *
 * Nothing here runs on a clock. The whole film is a function of one number,
 * the time in seconds: seek(t) puts every element exactly where it belongs at
 * t. That is what lets the renderer step through frame by frame and get the
 * same picture every time, and what lets the preview scrub to any moment.
 * There are no CSS transitions or animations anywhere — they would run on the
 * browser's clock, not ours.
 */
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;

  const ease = {
    linear: (k) => k,
    inCubic: (k) => k * k * k,
    outCubic: (k) => 1 - Math.pow(1 - k, 3),
    outQuint: (k) => 1 - Math.pow(1 - k, 5),
    inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    outBack: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
  };

  /** 0 before `at`, 1 after `at + dur`, linear in between. */
  const prog = (t, at, dur) => (dur <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / dur));

  /** Create an element. `html` is trusted: it only ever comes from film.json and this code. */
  function h(tag, cls, parent, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    if (parent) parent.appendChild(el);
    return el;
  }

  function place(el, { x, y, w, h: ht }) {
    if (x != null) el.style.left = x + 'px';
    if (y != null) el.style.top = y + 'px';
    if (w != null) el.style.width = w + 'px';
    if (ht != null) el.style.height = ht + 'px';
    return el;
  }

  /** Apply opacity / transform / blur in one go. */
  function set(el, { o = 1, x = 0, y = 0, s = 1, r = 0, blur = 0 } = {}) {
    el.style.opacity = o;
    el.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
    el.style.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
  }

  /* Entrances. Each is invisible before `at`, so a scene can lay everything out
   * up front and let time reveal it. */
  const A = {
    /** Text slam: big, blurred and fast, landing on the beat. */
    slam(el, t, at, { from = 1.35, dur = 0.24 } = {}) {
      if (t < at) return set(el, { o: 0 });
      const k = ease.outExpo(prog(t, at, dur));
      set(el, { o: clamp(prog(t, at, dur) * 4), s: lerp(from, 1, k), blur: lerp(14, 0, k) });
    },
    rise(el, t, at, { dy = 28, dur = 0.45, o = 1 } = {}) {
      if (t < at) return set(el, { o: 0, y: dy });
      const k = ease.outCubic(prog(t, at, dur));
      set(el, { o: k * o, y: lerp(dy, 0, k) });
    },
    pop(el, t, at, { dur = 0.4, from = 0.6 } = {}) {
      if (t < at) return set(el, { o: 0, s: from });
      const k = prog(t, at, dur);
      set(el, { o: clamp(k * 3), s: lerp(from, 1, ease.outBack(k)) });
    },
    fade(el, t, at, { dur = 0.3 } = {}) {
      set(el, { o: ease.outCubic(prog(t, at, dur)) });
    },
    /** Slide in from a direction (x, y offsets) with a soft blur. */
    slide(el, t, at, { dx = 0, dy = 0, dur = 0.6, s = 1 } = {}) {
      if (t < at) return set(el, { o: 0, x: dx, y: dy, s });
      const k = ease.outQuint(prog(t, at, dur));
      set(el, { o: clamp(prog(t, at, dur) * 2.5), x: lerp(dx, 0, k), y: lerp(dy, 0, k), s: lerp(s, 1, k), blur: lerp(8, 0, k) });
    },
  };

  /** A value that eases from `from` to `to` between at and at+dur. */
  const count = (t, at, dur, from, to, fn = ease.outCubic) => lerp(from, to, fn(prog(t, at, dur)));

  /** Keyframed position: keys = [[time, x, y], ...], eased between keys. */
  function path(t, keys, fn = ease.inOutCubic) {
    if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
    for (let i = 1; i < keys.length; i++) {
      const [t1, x1, y1] = keys[i];
      if (t <= t1) {
        const [t0, x0, y0] = keys[i - 1];
        const k = fn(prog(t, t0, t1 - t0));
        return { x: lerp(x0, x1, k), y: lerp(y0, y1, k) };
      }
    }
    const last = keys[keys.length - 1];
    return { x: last[1], y: last[2] };
  }

  /** Characters of `str` revealed at `cps` characters per second from `at`. */
  const typed = (t, at, str, cps = 18) => str.slice(0, Math.max(0, Math.floor((t - at) * cps)));

  /** Centre of `el` in `root`'s coordinate space (offsets ignore transforms). */
  function centre(el, root) {
    let x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el;
    while (n && n !== root) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { x, y };
  }

  const naira = (n) => '₦' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const nairaShort = (n) => '₦' + (n / 1e6).toFixed(1) + 'M';

  /** Deterministic pseudo-random numbers, so "random" layouts never change between renders. */
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let r = Math.imul(s ^ (s >>> 15), 1 | s);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.E = { clamp, lerp, ease, prog, h, place, set, A, count, path, typed, centre, naira, nairaShort, rng };
})();
