/*
 * The eight scenes. Each builder lays its DOM out once and returns
 * update(lt), where lt is seconds since the scene started. Words and numbers
 * come from film.json (F.story, F.brand, scene captions); the screens copy
 * the real app's labels, so what is shown is what the product does.
 */
(function () {
  const { h, place, set, A, ease, prog, count, path, typed, centre, naira, nairaShort, clamp, lerp } = E;

  const ICON = {
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>',
    cursor: '<svg viewBox="0 0 24 24"><path d="M4 2.5l15.5 9.2-6.8 1.4 3.9 7.3-2.9 1.5-3.9-7.3L5 19.5z" fill="#0a0a0a" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    signal: '<svg viewBox="0 0 34 13" fill="currentColor"><rect x="0" y="8" width="3.5" height="5" rx="1"/><rect x="5.5" y="5.5" width="3.5" height="7.5" rx="1"/><rect x="11" y="3" width="3.5" height="10" rx="1"/><rect x="16.5" y="0" width="3.5" height="13" rx="1"/><rect x="24" y="1.5" width="10" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="26" y="3.5" width="6" height="6" rx="1.5"/></svg>',
  };

  const initials = (name) => name.replace(/^(Mr|Mrs|Ms|Dr) /, '').split(' ').map((w) => w[0]).join('').slice(0, 2);

  /* ── Captions ──────────────────────────────────────────────────── */

  /** Big lines stack and slam in word by word; `small` lines rise in underneath. */
  function captions(parent, sc, { x, y, width = 700 }) {
    const box = place(h('div', 'caps', parent), { x, y, w: width });
    const items = sc.captions.map((c) => {
      if (c.small) return { c, el: h('div', 'cap-small', box, c.text) };
      const line = h('div', 'cap-line' + (c.big ? ' cap-big' : ''), box);
      const words = c.text.split(' ').map((w) => h('span', 'cap-word', line, w));
      return { c, el: line, words };
    });
    return (lt) => {
      for (const { c, el, words } of items) {
        if (!words) { A.rise(el, lt, c.at); continue; }
        el.style.opacity = 1;
        words.forEach((w, i) => A.slam(w, lt, c.at + i * 0.06));
      }
    };
  }

  /* ── Devices ───────────────────────────────────────────────────── */

  const NAV = [
    ['Home', ['Dashboard', 'Approvals']],
    ['People', ['Staff', 'Students']],
    ['School day', ['Classes', 'Register', 'The Gate', 'Follow up']],
    ['Money', ['Fees', 'Ledger']],
    ['Pay', ['Pay runs']],
  ];

  /** A browser window with the app's sidebar. Returns the window, its main area and the nav items. */
  function browser(parent, F, { x, y, w, h: ht, url, active }) {
    const win = place(h('div', 'win', parent), { x, y, w, h: ht });
    h('div', 'win-bar', win, `<span class="dots"><i></i><i></i><i></i></span><div class="win-url">${ICON.lock}${url}</div><span style="width:52px"></span>`);
    const body = h('div', 'win-body', win);
    const side = h('aside', 'side', body);
    h('div', 'side-org', side, `<span class="logo">${F.story.school[0]}</span>${F.story.school}`);
    const nav = {};
    for (const [label, items] of NAV) {
      const g = h('div', 'side-group', side);
      h('div', 'side-label', g, label);
      for (const it of items) nav[it] = h('div', 'side-item' + (it === active ? ' on' : ''), g, it);
    }
    const main = h('main', 'main', body);
    const setActive = (name) => Object.entries(nav).forEach(([k, el]) => el.classList.toggle('on', k === name));
    return { win, main, nav, setActive };
  }

  function phone(parent, { x, y, time }) {
    // The wrapper takes the entrance animation; the frame inside can be scaled on its own.
    const el = place(h('div', 'device', parent), { x, y });
    const frame = h('div', 'phone', el);
    const screen = h('div', 'phone-screen', frame);
    h('div', 'phone-status', screen, `<span>${time}</span><span class="isl"></span><span class="bars">${ICON.signal}</span>`);
    const content = h('div', 'phone-content', screen);
    return { el, screen, content };
  }

  /** A mouse pointer that follows keyframes and ripples on clicks. Coordinates are in `root`'s space. */
  function pointer(root) {
    const el = h('div', 'cursor', root, ICON.cursor);
    const ripple = h('div', 'ripple', root);
    return (t, keys, clicks = [], show = keys[0][0]) => {
      const p = path(t, keys);
      const last = clicks.filter((c) => t >= c).pop();
      const pressed = last != null && t - last < 0.12;
      set(el, { o: t < show ? 0 : ease.outCubic(prog(t, show, 0.2)), x: p.x, y: p.y, s: pressed ? 0.85 : 1 });
      if (last != null && t - last < 0.45) {
        const k = prog(t, last, 0.45);
        set(ripple, { o: 0.55 * (1 - k), x: p.x + 4, y: p.y + 4, s: lerp(0.3, 1.5, ease.outCubic(k)) });
      } else ripple.style.opacity = 0;
    };
  }

  /** A finger tap for phones: a soft disc that appears and fades at each tap. */
  function tapper(root) {
    const el = h('div', 'tap', root);
    return (t, taps) => {
      const hit = taps.filter(([at]) => t >= at && t < at + 0.35).pop();
      if (!hit) return (el.style.opacity = 0);
      const [at, x, y] = hit;
      const k = prog(t, at, 0.35);
      set(el, { o: k < 0.3 ? 1 : 1 - (k - 0.3) / 0.7, x, y, s: lerp(0.7, 1.15, ease.outCubic(k)) });
    };
  }

  /** Pointer target: centre of `el` in root space, nudged so the arrow tip sits on it. */
  const at = (el, root, dx = -4, dy = -4) => {
    const c = centre(el, root);
    return [c.x + dx, c.y + dy];
  };

  /* ── 0 · Hook ──────────────────────────────────────────────────── */

  function hook(root, sc, F) {
    const frags = [
      ['sheet', 1080, 110, -4, 0.25, 'fees_2026_FINAL_v3.xlsx'],
      ['chat', 1420, 240, 3, 0.5, 'JSS2 Parents', 'Mummy Tobi said she paid. Can anyone confirm?', 47],
      ['receipt', 890, 420, -8, 0.75, '0412', 45000],
      ['chat', 1330, 520, -2, 1.0, 'Greenfield Staff', 'Pls who has the JSS2 register?', 12],
      ['sheet', 1500, 700, 4, 1.25, 'salaries_sept (copy).xlsx'],
      ['chat', 960, 770, 2, 1.5, 'Bursary', 'Please resend the fees account number', 8],
      ['sheet', 700, 40, 3, 1.75, 'register_JSS2_term1.xlsx'],
      ['receipt', 1700, 70, 7, 2.0, '0413', 20000],
      ['chat', 1390, 880, -3, 2.25, 'Greenfield Staff', 'Sir, salary never enter yet', 31],
      ['sheet', 1160, 330, -5, 2.5, 'debtors_list_NEW.xlsx'],
      ['chat', 1560, 430, -4, 2.75, 'JSS2 Parents', 'Is school closing early today?', 62],
      ['receipt', 560, 150, -6, 3.0, '0414', 60000],
      ['sheet', 130, 770, -3, 3.25, 'fees_2026_FINAL_v4.xlsx'],
      ['chat', 1760, 600, 6, 3.5, 'Bursary', 'Who approved this expense??', 5],
    ].map(([kind, x, y, r, t0, a, b, c], i) => {
      const el = place(h('div', 'frag frag-' + kind, root), { x, y });
      if (kind === 'sheet') {
        const rows = ['', 'A', 'B', 'C', 'D', '1', 'Name', 'Class', 'Amount', 'Paid?', '2', 'Adeyemi T.', 'JSS2', '185,000', '??', '3', 'Bello A.', 'JSS1', '185,000', 'yes', '4', 'Okoro D.', 'SS1', '#REF!', ''];
        el.innerHTML = `<div class="tab">${a}</div><div class="grid">${rows.map((v) => `<div>${v}</div>`).join('')}</div>`;
      } else if (kind === 'chat') {
        el.innerHTML = `<div class="grp"><span>${a}</span><span class="badge">${c}</span></div><div class="msg">${b}</div>`;
      } else {
        el.innerHTML = `<b>RECEIPT No. ${a}</b>Received from: ________<br>Sum of: ${naira(b)}<br>Being: school fees<br>Sign: ______`;
      }
      return { el, x, y, r, t0, i, dim: x < 900 && y > 120 && y < 700 };
    });

    const caps = place(h('div', 'caps', root), { x: 120, y: 330, w: 820 });
    const lines = sc.captions.filter((c) => !c.big).map((c) => {
      const line = h('div', 'cap-line', caps);
      return { c, line, words: c.text.split(' ').map((w) => h('span', 'cap-word', line, w)) };
    });
    const bigC = sc.captions.find((c) => c.big);
    const big = place(h('div', 'cap-line cap-big abs', root), { x: 0, y: 590, w: 1920 });
    big.style.textAlign = 'center';
    const bigWords = bigC.text.split(' ').map((w) => h('span', 'cap-word', big, w));

    const win = h('div', 'one-window', root, `<span class="logo">${F.brand.product[0]}</span><span class="wm">${F.brand.product}</span>`);

    return (lt) => {
      const collapse = prog(lt, 4.0, 0.38);
      const shake = clamp((lt - 3.0) / 1.0) * 3;
      for (const f of frags) {
        if (lt < f.t0) { f.el.style.opacity = 0; continue; }
        const k = prog(lt, f.t0, 0.3);
        const floatY = Math.sin(lt * 1.4 + f.i) * 6;
        const jx = Math.sin(lt * 37 + f.i * 3) * shake;
        const ck = ease.inCubic(collapse);
        const x = lerp(0, 960 - f.x - 150, ck) + jx;
        const y = lerp(0, 415 - f.y - 50, ck) + floatY;
        set(f.el, {
          o: clamp(k * 3) * (f.dim ? 0.35 : 1) * (1 - ck),
          x, y,
          s: lerp(0.7, 1, ease.outBack(k)) * lerp(1, 0.2, ck),
          r: f.r * (1 + ck * 3),
        });
      }
      const out = ease.inCubic(prog(lt, 3.95, 0.25));
      for (const { c, line, words } of lines) {
        set(line, { o: 1 - out, y: -40 * out });
        words.forEach((w, i) => A.slam(w, lt, c.at + i * 0.06));
      }
      A.pop(win, lt, 4.25, { dur: 0.5, from: 0.4 });
      if (lt >= 4.25) win.style.transform += ` scale(${1 + 0.04 * prog(lt, 4.75, 1.25)})`;
      bigWords.forEach((w, i) => A.slam(w, lt, bigC.at + i * 0.08, { from: 1.5 }));
    };
  }

  /* ── 1 · Register (Educator) ───────────────────────────────────── */

  function register(root, sc, F) {
    const caps = captions(root, sc, { x: 130, y: 360, width: 900 });
    const ph = phone(root, { x: 1210, y: 125, time: '7:52' });
    const s = F.story;
    const box = h('div', 'reg', ph.content);
    h('div', 'reg-top', box, `<div class="crumb">My Classes › ${s.pupilClass}</div><div class="h1">Register</div><div class="sub">Thursday 24 September · Morning</div>`);
    const counter = h('div', 'reg-count', box.firstChild, '<b class="num">0</b> / 30 present');
    const list = h('div', 'reg-list', box);
    const scroll = h('div', 'reg-scroll', list);
    const pupils = ['Amina Bello', 'David Okafor', 'Esther Johnson', 'Ibrahim Sani', s.pupil, 'Grace Obi', 'Chidera Nnamdi', 'Oluwaseun Ade', 'Fatima Yusuf', 'Kemi Balogun', 'Michael Etim', 'Blessing Uche', 'Samuel Ojo', 'Halima Garba'];
    const marks = pupils.map((p) => (p === s.pupil ? 'A' : p === 'Kemi Balogun' ? 'E' : 'P'));
    const rows = pupils.map((p, i) => {
      const row = h('div', 'reg-row', scroll);
      h('div', 'avatar', row, initials(p));
      const who = h('div', 'reg-who', row, `<div class="reg-name">${p}</div><div class="reg-adm">GFC/2025/${String(311 + i * 7).padStart(4, '0')}</div>`);
      const ctl = h('div', 'reg-ctl', row);
      const btn = {};
      for (const l of ['P', 'L', 'A', 'E']) btn[l] = h('span', '', ctl, l);
      return { row, who, btn };
    });
    const tobi = rows[pupils.indexOf(s.pupil)];
    const note = h('div', 'pill alert reg-note', tobi.who, '3rd absence in 2 weeks');
    const foot = h('div', 'reg-foot', box);
    const save = h('div', 'btn', foot, 'Save register');
    const toast = h('div', 'toast', ph.screen, `${ICON.check}Register saved · 07:53`);
    const tap = tapper(ph.screen);
    const T0 = 1.0, STEP = 0.18, ROW = 66;
    const maxScroll = (pupils.length - 7.4) * ROW;

    return (lt) => {
      caps(lt);
      A.slide(ph.el, lt, 0, { dy: 90, dur: 0.7 });
      // Mark each row on a 16th-ish grid, scrolling to keep the current row in view.
      let sy = clamp(((lt - T0) / STEP - 3.5) * ROW, 0, maxScroll);
      if (lt > 5.3) sy = lerp(maxScroll, 0, ease.inOutCubic(prog(lt, 5.3, 0.7)));
      scroll.style.transform = `translateY(${-sy}px)`;
      const taps = [];
      rows.forEach((r, i) => {
        const on = lt >= T0 + i * STEP;
        for (const [l, b] of Object.entries(r.btn)) b.className = on && marks[i] === l ? (l === 'A' ? 'on alert' : 'on') : '';
        const c = centre(r.btn[marks[i]], ph.screen);
        taps.push([T0 + i * STEP, c.x, c.y - sy]);
      });
      const cs = centre(save, ph.screen);
      taps.push([4.2, cs.x, cs.y]);
      tap(lt, taps);
      counter.firstChild.textContent = Math.round(count(lt, T0, pupils.length * STEP, 0, 28, ease.linear));
      set(save, { s: lt >= 4.2 && lt < 4.35 ? 0.95 : 1 });
      if (lt < 5.3) A.rise(toast, lt, 4.4, { dy: 20 });
      else set(toast, { o: 1 - prog(lt, 5.3, 0.2), y: 0 });
      place(toast, { x: 40, y: 660 });
      tobi.row.classList.toggle('flag', lt >= 6.0);
      A.pop(note, lt, 6.0);
    };
  }

  /* ── 2 · Follow up (Registrar) ─────────────────────────────────── */

  function atrisk(root, sc, F) {
    const s = F.story;
    const caps = captions(root, sc, { x: 1230, y: 330, width: 620 });
    const b = browser(root, F, { x: 100, y: 180, w: 1060, h: 720, url: 'greenfield.soteria.app/attendance/at-risk', active: 'Follow up' });
    h('div', '', b.main, `<div class="crumb">School day</div><div class="h1">Follow up</div><div class="sub">Pupils whose attendance has fallen</div>`);
    h('div', 'filters', b.main, `<div><div class="label">Term</div><div class="field" style="width:240px">${s.term}<span class="muted" style="margin-left:auto">▾</span></div></div><div><div class="label">Below (%)</div><div class="field num" style="width:110px">80</div></div>`);
    const card = h('div', 'card risk-card', b.main);
    const title = h('div', 'risk-title', card, 'Pupils to follow up <span class="pill num">3</span>');
    const cols = 'grid-template-columns: 1.55fr 0.9fr 1.35fr 1.45fr 1.15fr';
    h('div', 'tbl-row tbl-head', card, ['Pupil', 'Class', 'Attendance', 'Primary guardian', 'Phone'].map((c) => `<div>${c}</div>`).join('')).style.cssText = cols;
    const body = h('div', 'risk-body', card);
    const data = [
      ['Daniel Okoro', 'SS1 Green', 76, 'Mr Samuel Okoro', '0812 553 0194'],
      ['Ifeoma Nwosu', 'JSS1 Blue', 78, 'Mr Chinedu Nwosu', '0806 771 2230'],
      ['Zainab Musa', 'JSS3 Gold', 79, 'Mrs Hauwa Musa', '0703 118 4462'],
      [s.pupil, s.pupilClass, s.attendanceFrom, s.guardian, s.guardianPhone],
    ];
    const rows = data.map(([n, c, pct, g, p]) => {
      const row = h('div', 'tbl-row risk-row', body);
      row.style.cssText = cols;
      h('div', '', row, `<b style="font-weight:600">${n}</b>`);
      h('div', 'muted', row, c);
      const att = h('div', 'att', row, `<span class="bar"><i></i></span><span class="num pct">${pct}%</span>`);
      h('div', '', row, g);
      const ph = h('div', 'callcell num', row, `${ICON.phone}${p}`);
      return { row, att, ph, pct };
    });
    const tobi = rows[3];
    const toast = h('div', 'toast', b.main, `${ICON.phone}Calling ${s.guardian} · ${s.guardianPhone}`);
    const move = pointer(b.win);
    const RH = 58;

    return (lt) => {
      caps(lt);
      A.slide(b.win, lt, 0, { dx: -80, dur: 0.7 });
      rows.slice(0, 3).forEach((r, i) => {
        A.rise(r.row, lt, 0.35 + i * 0.1, { dy: 14 });
        r.att.querySelector('i').style.width = r.pct + '%';
      });
      title.querySelector('.pill').textContent = lt >= 2.0 ? '4' : '3';
      // Tobi arrives at the bottom, slides down to the lowest attendance, then jumps to the top.
      const pct = Math.round(count(lt, 2.0, 1.4, s.attendanceFrom, s.attendanceTo, ease.inOutCubic));
      tobi.att.querySelector('.pct').textContent = pct + '%';
      tobi.att.querySelector('i').style.width = pct + '%';
      const jump = ease.outQuint(prog(lt, 3.5, 0.5));
      rows.slice(0, 3).forEach((r) => (r.row.style.transform = `translateY(${RH * jump}px)`));
      if (lt < 2.0) set(tobi.row, { o: 0 });
      else set(tobi.row, { o: ease.outCubic(prog(lt, 2.0, 0.3)), y: -3 * RH * jump });
      tobi.row.classList.toggle('hot', lt >= 3.5);
      const [px, py] = at(tobi.ph, b.win, -40, 0);
      move(lt, [[4.0, 1000, 700], [4.7, px, py - 3 * RH]], [4.85], 4.0);
      A.rise(toast, lt, 5.0, { dy: 16 });
      place(toast, { x: 30, y: 590 });
    };
  }

  /* ── 3 · The Gate (Front desk) ─────────────────────────────────── */

  function gate(root, sc, F) {
    const caps = captions(root, sc, { x: 120, y: 380 });
    const b = browser(root, F, { x: 790, y: 180, w: 1030, h: 720, url: 'greenfield.soteria.app/attendance/gate', active: 'The Gate' });
    h('div', '', b.main, `<div class="crumb">School day</div><div class="h1">The gate</div><div class="sub">Signing children out during the day, and back in.</div>`);
    const find = h('div', 'gate-find', b.main, `<div class="label">Find a pupil</div>`);
    const field = h('div', 'field', find, `${ICON.search}<span class="q"></span>`);
    const q = field.querySelector('.q');
    const pupil = h('div', 'card gate-pupil', b.main, `<span class="avatar">CO</span><div><b>Chiamaka Obi</b><div class="muted" style="font-size:13.5px">JSS1 Blue · GFC/2024/0117</div></div><span class="pill" style="margin-left:auto">In school</span>`);
    const whoL = h('div', 'label gate-l', b.main, 'Who is collecting?');
    const adults = h('div', 'gate-adults', b.main);
    const mk = (name, rel, ok, extra = '') => h('div', 'card adult' + (ok ? '' : ' barred'), adults,
      `<div class="adult-top"><span class="avatar">${initials(name)}</span><span class="tick">${ok ? ICON.check : ICON.lock}</span></div><b>${name}</b><div class="muted">${rel}</div>${extra}`);
    const mum = mk('Mrs Ngozi Obi', 'Mother · permitted', true);
    mk('Mr Emeka Obi', 'Father · permitted', true);
    const barred = mk('Mr Chidi Okafor', 'Not permitted to collect', false, '<div class="why">On file since 12 Jan 2026</div><span class="pill alert np">NOT PERMITTED</span>');
    const np = barred.querySelector('.np');
    const whyL = h('div', 'label gate-l', b.main, 'Why are they leaving?');
    const chips = h('div', 'gate-chips', b.main);
    const med = h('span', 'pill big', chips, 'Medical appointment');
    ['Family emergency', 'Early closure', 'Other'].forEach((c) => h('span', 'pill big', chips, c));
    const go = h('div', 'btn gate-go', b.main, 'Sign out at 12:15');
    const toast = h('div', 'toast', b.main, `${ICON.check}Chiamaka Obi signed out to Mrs Ngozi Obi · 12:15`);
    const move = pointer(b.win);

    return (lt) => {
      caps(lt);
      A.slide(b.win, lt, 0, { dx: 80, dur: 0.7 });
      const typedQ = typed(lt, 0.6, 'Chiamaka', 16);
      q.innerHTML = typedQ ? `${typedQ}<span class="caret"></span>` : '<span class="ph">Name or admission number</span>';
      A.rise(pupil, lt, 1.25, { dy: 12 });
      A.rise(whoL, lt, 1.55, { dy: 10 });
      [...adults.children].forEach((c, i) => A.rise(c, lt, 1.65 + i * 0.1, { dy: 16, o: c === barred ? 0.62 : 1 }));
      // Trying the barred adult: the card refuses with a shake and says why.
      if (lt > 3.0 && lt < 3.45) barred.style.transform = `translateX(${Math.sin((lt - 3.0) * 60) * 9 * (1 - prog(lt, 3.0, 0.45))}px)`;
      if (lt >= 3.0) barred.style.opacity = 1;
      A.pop(np, lt, 3.0);
      mum.classList.toggle('sel', lt >= 3.95);
      A.rise(whyL, lt, 4.2, { dy: 10 });
      A.rise(chips, lt, 4.25, { dy: 10 });
      A.rise(go, lt, 4.3, { dy: 10 });
      med.classList.toggle('solid', lt >= 4.65);
      set(go, { o: lt >= 4.3 ? ease.outCubic(prog(lt, 4.3, 0.3)) : 0, s: lt >= 5.05 && lt < 5.2 ? 0.95 : 1 });
      const P = (el) => at(el, b.win, -10, -6);
      move(lt, [[2.2, 900, 650], [2.85, ...P(barred)], [3.5, ...P(barred)], [3.9, ...P(mum)], [4.3, ...P(mum)], [4.6, ...P(med)], [4.75, ...P(med)], [5.0, ...P(go)]], [3.0, 3.95, 4.65, 5.05], 2.2);
      A.rise(toast, lt, 5.3, { dy: 16 });
      place(toast, { x: 30, y: 604 });
    };
  }

  /* ── 4 · Invoice (Bursar → Parent) ─────────────────────────────── */

  function invoice(root, sc, F) {
    const s = F.story;
    const bal = s.feeTotal - s.feePaid;
    const caps = captions(root, sc, { x: 120, y: 330 });
    const b = browser(root, F, { x: 790, y: 180, w: 1030, h: 720, url: 'greenfield.soteria.app/fees', active: 'Fees' });
    h('div', '', b.main, `<div class="crumb">Money</div><div class="h1">Fees</div>`);
    h('div', 'tabs', b.main, '<span class="on">Invoices</span><span>Payments</span><span>Fee structures</span>');
    const card = h('div', 'card', b.main);
    const cols = 'grid-template-columns: 1.5fr 0.9fr 0.95fr 0.95fr 0.95fr 1.05fr';
    h('div', 'tbl-row tbl-head', card, ['Pupil', 'Class', 'Total', 'Paid', 'Balance', ''].map((c) => `<div>${c}</div>`).join('')).style.cssText = cols;
    const inv = [
      ['Amina Bello', 'JSS1 Blue', 185000, 185000],
      [s.pupil, s.pupilClass, s.feeTotal, s.feePaid],
      ['Chuka Eze', 'SS2 Green', 210000, 150000],
      ['Folake Adewale', 'JSS3 Blue', 185000, 185000],
      ['Musa Abdullahi', 'SS1 Gold', 210000, 0],
    ];
    let send;
    const rows = inv.map(([n, c, tot, paid]) => {
      const row = h('div', 'tbl-row', card);
      row.style.cssText = cols;
      const due = tot - paid;
      row.innerHTML = `<div><b style="font-weight:600">${n}</b></div><div class="muted">${c}</div><div class="num">${naira(tot)}</div><div class="num">${naira(paid)}</div><div class="num" style="font-weight:600">${naira(due)}</div>`;
      const act = h('div', '', row, due ? '<span class="btn ghost sm">Send link</span>' : '<span class="pill">Paid</span>');
      if (n === s.pupil) { send = act.firstChild; row.classList.add('focus'); }
      return row;
    });
    const sent = h('div', 'toast', b.main, `${ICON.check}Link sent by SMS to ${s.guardianPhone}`);
    const move = pointer(b.win);

    const ph = phone(root, { x: 1300, y: 125, time: '14:00' });
    const lock = h('div', 'lock', ph.screen, `<div class="lock-time">14:00</div><div class="lock-date">Thursday 24 September</div>`);
    const notif = h('div', 'notif', lock, `<div class="notif-app">${ICON.msg}MESSAGES<span>now</span></div><b>${s.school}</b><div>${s.pupil.split(' ')[0]}'s ${s.term.replace(/ \d.*/, '')} bill is ready. View it here: greenfield.soteria.app/invoice/7fk2Q…</div>`);
    const page = h('div', 'inv', ph.screen);
    page.innerHTML = `<div style="height:54px"></div><div class="phone-url">${ICON.lock}greenfield.soteria.app/invoice/7fk2Q…</div>
      <div class="inv-body">
        <div class="inv-school"><span class="logo">${s.school[0]}</span>${s.school}</div>
        <div class="inv-meta">Fee invoice · ${s.term}<br><b>${s.pupil}</b> · ${s.pupilClass}</div>
        <div class="inv-due"><div class="k">Still to pay</div><div class="v num">₦0</div></div>
        <div class="inv-line r1"><span>Total</span><b class="num">${naira(s.feeTotal)}</b></div>
        <div class="inv-line r2"><span>Paid so far</span><b class="num">${naira(s.feePaid)}</b></div>
        <div class="inv-sec">Payments received</div>
        <div class="inv-pay"><span>12 Sep 2026 · Bank transfer</span><b class="num">${naira(s.feePaid)}</b></div>
      </div>`;
    const due = page.querySelector('.inv-due');
    const dueV = due.querySelector('.v');
    const [r1, r2, sec, pay] = ['.r1', '.r2', '.inv-sec', '.inv-pay'].map((q) => page.querySelector(q));
    const tap = tapper(ph.screen);

    return (lt) => {
      caps(lt);
      // Phase A: the bursar sends the link.
      if (lt < 3.0) A.slide(b.win, lt, 0, { dx: 80, dur: 0.7 });
      else {
        const k = ease.inCubic(prog(lt, 3.0, 0.4));
        set(b.win, { o: 1 - k, x: -60 * k, s: 1 - 0.06 * k, blur: 6 * k });
      }
      rows.forEach((r, i) => A.rise(r, lt, 0.3 + i * 0.07, { dy: 12 }));
      const [sx, sy] = at(send, b.win, -8, -4);
      move(lt, [[0.8, 700, 690], [1.5, sx, sy]], [1.7], 0.8);
      A.rise(sent, lt, 1.9, { dy: 14 });
      place(sent, { x: 30, y: 604 });
      // Phase B: the parent's phone.
      A.slide(ph.el, lt, 3.2, { dy: 140, dur: 0.6 });
      A.slide(notif, lt, 3.65, { dy: -40, dur: 0.45, s: 0.94 });
      const nc = centre(notif, ph.screen);
      tap(lt, [[4.1, nc.x, nc.y]]);
      const up = ease.outQuint(prog(lt, 4.25, 0.45));
      page.style.transform = `translateY(${(1 - up) * 830}px)`;
      // Hidden until it starts counting: a flash of ₦0 would read as "nothing owed".
      dueV.style.opacity = lt >= 4.6 ? 1 : 0;
      dueV.textContent = naira(count(lt, 4.6, 0.8, 0, bal, ease.outExpo));
      A.rise(r1, lt, 5.4, { dy: 10 });
      A.rise(r2, lt, 5.55, { dy: 10 });
      A.rise(sec, lt, 5.8, { dy: 10 });
      A.rise(pay, lt, 5.9, { dy: 10 });
      due.classList.toggle('ring', lt >= 7.0);
    };
  }

  /* ── 5 · Ledger (Bursar) ───────────────────────────────────────── */

  function ledger(root, sc, F) {
    const s = F.story;
    const bal = s.feeTotal - s.feePaid;
    const caps = captions(root, sc, { x: 120, y: 360 });
    const b = browser(root, F, { x: 790, y: 180, w: 1030, h: 720, url: 'greenfield.soteria.app/ledger', active: 'Fees' });
    // Before: the fees page under a Record payment dialog.
    const fees = h('div', 'layer', b.main, `<div class="crumb">Money</div><div class="h1">Fees</div><div class="tabs"><span>Invoices</span><span class="on">Payments</span><span>Fee structures</span></div><div class="card ghost-rows">${'<div></div>'.repeat(6)}</div>`);
    const dim = h('div', 'dim', b.main);
    const dlg = h('div', 'card dialog', b.main, `<div class="h1" style="font-size:21px">Record payment</div><div class="sub">${s.pupil} · ${s.term} · Balance ${naira(bal)}</div>`);
    h('div', 'label', dlg, 'Amount');
    const amt = h('div', 'field num', dlg);
    h('div', 'label', dlg, 'Method');
    const seg = h('div', 'seg', dlg);
    const segs = ['Cash', 'Bank transfer', 'POS'].map((m) => h('span', '', seg, m));
    h('div', 'label', dlg, 'Reference');
    const ref = h('div', 'field', dlg);
    const rec = h('div', 'btn', dlg, 'Record payment');
    rec.style.width = '100%';
    // After: the journal.
    const led = h('div', 'layer', b.main, `<div class="crumb">Money</div><div class="h1">Ledger</div><div class="tabs"><span class="on">Journal</span><span>Accounts</span><span>Trial balance</span></div>`);
    const je = h('div', 'card je', led, `<div class="je-head"><div><b>JE-2026-0913</b> <span class="muted">· 24 Sep 2026</span><div class="muted" style="font-size:13.5px;margin-top:2px">Fee payment — ${s.pupil}</div></div><span class="pill">Posted</span></div>`);
    const jcols = 'grid-template-columns: 1fr 110px 110px';
    h('div', 'tbl-row tbl-head', je, '<div>Account</div><div style="text-align:right">Debit</div><div style="text-align:right">Credit</div>').style.cssText = jcols;
    const l1 = h('div', 'tbl-row', je, `<div>1010 · Bank — GTBank Operating</div><div class="num r">${naira(bal)}</div><div class="r muted">—</div>`);
    const l2 = h('div', 'tbl-row', je, `<div>1200 · Fees receivable — ${s.pupil.split(' ')[0]} A.</div><div class="r muted">—</div><div class="num r">${naira(bal)}</div>`);
    const tot = h('div', 'tbl-row je-tot', je, `<div><span class="pill solid bal">${ICON.check.replace('<svg', '<svg width="12" height="12"')} Balanced</span></div><div class="num r">${naira(bal)}</div><div class="num r">${naira(bal)}</div>`);
    [l1, l2, tot].forEach((r) => (r.style.cssText = jcols));
    const balPill = tot.querySelector('.bal');
    const older = [
      ['JE-2026-0912', 'Fee payment — Amina Bello', 185000],
      ['JE-2026-0911', 'Expense — Diesel for the generator', 62000],
    ].map(([id, d, n]) => h('div', 'card je-old', led, `<b>${id}</b><span class="muted">${d}</span><span class="num" style="margin-left:auto">${naira(n)}</span>`));
    const move = pointer(b.win);
    // The parent's view updating on its own.
    const mini = phone(root, { x: 1610, y: 420, time: '16:10' });
    mini.el.classList.add('mini');
    mini.content.innerHTML = `<div class="phone-url">${ICON.lock}greenfield.soteria.app/invoice/7fk2Q…</div><div class="inv-body"><div class="inv-school"><span class="logo">${s.school[0]}</span>${s.school}</div><div class="inv-due"><div class="k">Still to pay</div><div class="v num"></div></div><div class="inv-line"><span>Paid so far</span><b class="num pf"></b></div><div style="margin-top:18px"><span class="pill solid big full">${ICON.check.replace('<svg', '<svg width="14" height="14"')} Paid in full</span></div></div>`;
    const mDue = mini.content.querySelector('.v');
    const mPaid = mini.content.querySelector('.pf');
    const full = mini.content.querySelector('.full');

    return (lt) => {
      caps(lt);
      A.slide(b.win, lt, 0, { dx: 80, dur: 0.6 });
      const after = lt >= 2.1;
      b.setActive(after ? 'Ledger' : 'Fees');
      set(fees, { o: after ? 0 : 1 });
      const close = prog(lt, 2.0, 0.15);
      set(dim, { o: 1 - close });
      if (lt < 2.0) A.pop(dlg, lt, 0.15, { from: 0.9, dur: 0.35 });
      else set(dlg, { o: 1 - close, s: 1 - 0.04 * close });
      const a = typed(lt, 0.5, '85,000', 14);
      amt.innerHTML = `<span class="muted">₦</span>${a}${lt > 0.5 && lt < 1.0 ? '<span class="caret"></span>' : ''}`;
      segs.forEach((el, i) => el.classList.toggle('on', i === 1 && lt >= 1.1));
      const r = typed(lt, 1.2, 'GTB-2409-5521', 40);
      ref.innerHTML = r ? r + (lt < 1.6 ? '<span class="caret"></span>' : '') : '<span class="ph">Bank reference</span>';
      set(rec, { s: lt >= 1.8 && lt < 1.95 ? 0.97 : 1 });
      const P = (el) => at(el, b.win, -10, -6);
      move(lt, [[0.6, 1000, 700], [1.0, ...P(segs[1])], [1.35, ...P(segs[1])], [1.7, ...P(rec)]], [1.1, 1.8], 0.6);
      if (lt >= 2.0) b.win.querySelector('.cursor').style.opacity = 1 - close;
      set(led, { o: after ? ease.outCubic(prog(lt, 2.1, 0.25)) : 0 });
      A.slide(je, lt, 2.2, { dy: 24, dur: 0.5 });
      A.rise(l1, lt, 2.5, { dy: 8 });
      A.rise(l2, lt, 2.75, { dy: 8 });
      A.rise(tot, lt, 3.0, { dy: 8 });
      A.pop(balPill, lt, 3.25);
      older.forEach((o, i) => A.rise(o, lt, 2.4 + i * 0.1, { dy: 12, o: 0.6 }));
      A.slide(mini.el, lt, 3.3, { dy: 60, dur: 0.6 });
      mDue.textContent = naira(count(lt, 3.7, 0.8, bal, 0, ease.inOutCubic));
      mPaid.textContent = naira(count(lt, 3.7, 0.8, s.feePaid, s.feeTotal, ease.inOutCubic));
      A.pop(full, lt, 4.5);
    };
  }

  /* ── 6 · Payroll (Staff) ───────────────────────────────────────── */

  function payroll(root, sc, F) {
    const s = F.story;
    const caps = captions(root, sc, { x: 120, y: 360 });
    const b = browser(root, F, { x: 790, y: 180, w: 1030, h: 720, url: 'greenfield.soteria.app/payroll', active: 'Pay runs' });
    const wrap = h('div', 'pr', b.main, `<div class="crumb">Pay</div><div class="h1">${s.payrollMonth} pay run</div><div class="sub">${s.payrollStaff} staff · ${s.school}</div>`);
    const steps = h('div', 'steps', wrap);
    const names = ['Calculate', 'Approve', 'Disburse', 'Payslips'];
    const st = names.map((n, i) => {
      const el = h('div', 'step', steps, `<span class="dot">${ICON.check}</span><span>${n}</span>`);
      const bar = i < names.length - 1 ? h('div', 'step-bar', steps, '<i></i>') : null;
      return { el, bar };
    });
    const gross = s.payrollTotal + 2640000;
    const sums = [['Gross pay', gross], ['Deductions', 2640000], ['Net pay', s.payrollTotal]].map(([k, v]) => {
      const el = h('div', 'card pr-sum', wrap, `<span class="muted">${k}</span><b class="num"></b>`);
      return { el, v, b: el.querySelector('b') };
    });
    const posted = h('div', 'card pr-post', wrap, `<span class="pill solid">${ICON.check.replace('<svg', '<svg width="12" height="12"')} Posted to ledger</span><span class="muted num">JE-2026-0925 · Salaries DR ${nairaShort(s.payrollTotal)} · Bank CR ${nairaShort(s.payrollTotal)}</span>`);

    const ph = phone(root, { x: 1545, y: 215, time: '9:41' });
    ph.el.classList.add('mid');
    const lines = [['Basic salary', 380000], ['Housing', 95000], ['Transport', 40000], ['PAYE tax', -68300], ['Pension (8%)', -34200]];
    ph.content.innerHTML = `<div class="slip"><div class="crumb">My Pay</div><div class="h1">Payslip</div><div class="sub">${s.payrollMonth} · ${s.educator} · Educator</div>
      <div class="inv-due"><div class="k">Net pay</div><div class="v num"></div></div>
      ${lines.map(([k, v]) => `<div class="inv-line"><span>${k}</span><b class="num">${v < 0 ? '−' : ''}${naira(Math.abs(v))}</b></div>`).join('')}</div>`;
    const net = ph.content.querySelector('.v');
    const lineEls = [...ph.content.querySelectorAll('.inv-line')];

    return (lt) => {
      caps(lt);
      A.slide(b.win, lt, 0, { dx: 80, dur: 0.6 });
      st.forEach(({ el, bar }, i) => {
        const on = lt >= 0.5 + i * 0.5;
        el.classList.toggle('done', on);
        if (bar) bar.firstChild.style.width = prog(lt, 0.5 + i * 0.5, 0.5) * 100 + '%';
      });
      sums.forEach((x, i) => {
        A.rise(x.el, lt, 0.4 + i * 0.1, { dy: 10 });
        x.b.textContent = naira(count(lt, 0.5, 1.6, 0, x.v, ease.outCubic));
      });
      A.rise(posted, lt, 3.5, { dy: 12 });
      A.slide(ph.el, lt, 2.3, { dy: 120, dur: 0.6 });
      net.textContent = naira(count(lt, 2.6, 0.8, 0, s.payslipNet, ease.outExpo));
      lineEls.forEach((el, i) => A.rise(el, lt, 2.8 + i * 0.07, { dy: 8 }));
    };
  }

  /* ── 7 · End card (Proprietor) ─────────────────────────────────── */

  function end(root, sc, F) {
    const s = F.story;
    const b = browser(root, F, { x: 300, y: 180, w: 1320, h: 720, url: 'greenfield.soteria.app', active: 'Dashboard' });
    h('div', '', b.main, `<div class="crumb">Home</div><div class="h1">Good afternoon</div><div class="sub">${s.school} · Thursday 24 September</div>`);
    const grid = h('div', 'kpis', b.main);
    const kpis = [
      ['Fees collected this term', 48200000, nairaShort, '87% of billed'],
      ['Outstanding', 6100000, nairaShort, '142 pupils'],
      ['Attendance today', 94, (v) => Math.round(v) + '%', '4 to follow up'],
      [`Payroll · ${s.payrollMonth.split(' ')[0]}`, s.payrollTotal, nairaShort, 'Approved · posted'],
    ].map(([k, v, fmt, note]) => {
      const el = h('div', 'card kpi', grid, `<div class="k-label">${k}</div><div class="k-val num"></div><div class="k-note">${note}</div>`);
      return { el, v, fmt, val: el.querySelector('.k-val') };
    });
    const lower = h('div', 'dash-lower', b.main);
    h('div', 'card wait', lower, `<div class="risk-title">Waiting on you</div>${['Approve October pay run draft', '4 pupils to follow up', '2 invoices overdue over 30 days', '1 expense over budget'].map((t) => `<div class="wait-row">${t}<span class="muted">›</span></div>`).join('')}`);
    const chart = h('div', 'card chartc', lower, '<div class="risk-title">Fees in vs payroll out <span class="muted" style="font-weight:500;font-size:12.5px;margin-left:auto">last 6 months</span></div>');
    const bars = h('div', 'bars', chart);
    const pairs = [[62, 40], [48, 41], [30, 41], [86, 42], [70, 43], [58, 43]].map(([a, c], i) => {
      const g = h('div', 'bar-g', bars);
      return { a: h('i', 'fee', g), c: h('i', 'pay', g), av: a, cv: c, i };
    });
    h('div', 'bars-x muted', chart, ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m) => `<span>${m}</span>`).join(''));

    const mark = place(h('div', 'wordmark', root, F.brand.product), { y: 300 });
    mark.style.fontSize = '200px';
    const tag = place(h('div', 'wordmark', root, F.brand.tagline), { y: 560 });
    tag.style.cssText += 'font-size:58px;font-weight:600;letter-spacing:-0.03em;color:var(--t-inkMuted)';
    const cta = place(h('div', 'cta', root, `${F.brand.cta}${ICON.arrow.replace('<svg', '<svg width="32" height="32"')}`), { y: 700 });
    const url = F.brand.ctaUrl ? place(h('div', 'cta-url', root, F.brand.ctaUrl), { y: 820 }) : null;

    return (lt) => {
      const out = ease.inCubic(prog(lt, 2.2, 0.45));
      set(b.win, { o: ease.outCubic(prog(lt, 0, 0.3)) * (1 - out), s: lerp(1.06, 1, ease.outQuint(prog(lt, 0, 0.8))) * lerp(1, 0.86, out), blur: 10 * out });
      kpis.forEach((k, i) => {
        A.rise(k.el, lt, 0.15 + i * 0.08, { dy: 14 });
        k.val.textContent = k.fmt(count(lt, 0.3, 1.2, 0, k.v));
      });
      pairs.forEach((p) => {
        const g = ease.outCubic(prog(lt, 0.5 + p.i * 0.08, 0.6));
        p.a.style.height = p.av * g + '%';
        p.c.style.height = p.cv * g + '%';
      });
      A.slam(mark, lt, 2.5, { from: 1.25, dur: 0.3 });
      A.rise(tag, lt, 3.0, { dy: 24 });
      if (lt < 3.5) set(cta, { o: 0 });
      else {
        const k = prog(lt, 3.5, 0.45);
        cta.style.opacity = clamp(k * 3);
        cta.style.transform = `translateX(-50%) scale(${lerp(0.7, 1, ease.outBack(k))})`;
      }
      if (url) A.rise(url, lt, 3.9, { dy: 12 });
    };
  }

  window.SCENES = { hook, register, atrisk, gate, invoice, ledger, payroll, end };
})();
