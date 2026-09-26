/*
 * The eight scenes.
 *
 * The screens are the app's own, rebuilt at its real size from the running
 * client: the same layout, labels, icons and flows (see app.css for where the
 * styles come from). Each builder lays its DOM out once and returns
 * update(lt), where lt is seconds since the scene started. Words and numbers
 * the film may want changed come from film.json.
 */
(function () {
  const { h, place, set, A, ease, prog, count, path, typed, centre, clamp, lerp } = E;
  const I = (name, cls = '') => `<span class="${cls}" style="display:inline-flex">${window.ICONS[name] || ''}</span>`;
  const naira2 = (n) => '₦' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plain2 = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const compact = (n) => '₦' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';

  /* ── Captions ──────────────────────────────────────────────────── */

  function captions(parent, sc, { x, y, width = 700 }) {
    const box = place(h('div', 'caps', parent), { x, y, w: width });
    const items = sc.captions.map((c) => {
      if (c.small) return { c, el: h('div', 'cap-small', box, c.text) };
      const line = h('div', 'cap-line' + (c.big ? ' cap-big' : ''), box);
      return { c, el: line, words: c.text.split(' ').map((w) => h('span', 'cap-word', line, w)) };
    });
    return (lt) => {
      for (const { c, el, words } of items) {
        if (!words) { A.rise(el, lt, c.at); continue; }
        el.style.opacity = 1;
        words.forEach((w, i) => A.slam(w, lt, c.at + i * 0.06));
      }
    };
  }

  /* ── The app's shell ───────────────────────────────────────────── */

  // nav-config.tsx, in order, with the icons it uses.
  const NAV = [
    ['Me', [['My Classes', 'Presentation'], ['My Pay', 'Banknote'], ['My Leave', 'TreePalm'], ['My Profile', 'UserCircle']]],
    ['Home', [['Dashboard', 'LayoutDashboard'], ['Approvals', 'Inbox', 2]]],
    ['People', [['Staff', 'Users'], ['Students', 'GraduationCap']]],
    ['Admissions', [['Applications', 'ClipboardList'], ['Assessment diary', 'CalendarClock'], ['Question sets', 'ListChecks'], ['Criteria', 'SlidersHorizontal']]],
    ['School day', [['Classes', 'School'], ['Register', 'CalendarCheck'], ['The Gate', 'DoorOpen'], ['Follow up', 'AlertTriangle'], ['Awards', 'Trophy'], ['School calendar', 'CalendarRange']]],
    ['Pay', [['Pay runs', 'Calculator'], ['Loans & advances', 'Receipt'], ['Leave', 'CalendarDays']]],
    ['Money', [['Fees', 'BadgeDollarSign'], ['Expenses', 'Wallet'], ['Budgets', 'PiggyBank'], ['Bank reconciliation', 'ArrowLeftRight'], ['Ledger', 'Scale']]],
    ['Insight', [['Reports', 'BarChart3'], ['Audit log', 'Shield']]],
  ];

  /**
   * A browser window holding the desktop app at its real 1440×900, scaled.
   * `frame` is the unscaled coordinate space for pointers.
   */
  function desk(parent, F, { x, y, scale = 0.72, url, active, user = 'Adebayo Bello' }) {
    const W = 1440, H = 936;
    const win = place(h('div', 'bw', parent), { x, y, w: W * scale, h: H * scale });
    const frame = h('div', 'bw-frame', win);
    frame.style.transform = `scale(${scale})`;
    h('div', 'bw-bar', frame, `<span class="dots"><i></i><i></i><i></i></span><div class="bw-url">${I('Lock', 'i14')}${url}</div><span style="width:60px"></span>`);
    const app = h('div', 'app app-desk', frame);
    const sb = h('aside', 'sb', app);
    h('div', 'sb-head', sb, `<div class="sb-logo">${F.story.school[0]}</div><div><div class="sb-org">${F.story.school}</div><div class="sb-orgsub">School Payroll</div></div>`);
    const scroll = h('div', 'sb-scroll', sb);
    const nav = h('nav', 'sb-nav', scroll);
    const items = {};
    for (const [label, list] of NAV) {
      const g = h('div', 'sb-group', nav);
      h('div', 'sb-label', g, `<span>${label}</span>${I('ChevronDown')}`);
      for (const [t, icon, n] of list) items[t] = h('div', 'sb-item', g, `${I(icon)}<span>${t}</span>${n ? `<span class="sb-count">${n}</span>` : ''}`);
    }
    h('div', 'sb-foot', sb, `<div class="sb-collapse">${I('ChevronLeft')}Collapse</div>`);
    const col = h('div', 'col', app);
    const initials = user.split(' ').map((w) => w[0]).join('');
    h('header', 'tb', col, `<span class="tb-icon">${I('Sun')}</span><span class="tb-icon">${I('Bell')}</span><span class="tb-user"><span class="avatar-g">${initials}</span>${user}</span>`);
    const mainEl = h('main', 'main', col);
    const main = h('div', 'main-inner', mainEl);
    const setActive = (name) => {
      Object.entries(items).forEach(([k, el]) => el.classList.toggle('on', k === name));
      // Scrolled so the current page shows, as it would for someone who got there.
      const el = items[name];
      const off = el ? Math.max(0, el.offsetTop - 360) : 0;
      nav.style.transform = `translateY(${-off}px)`;
    };
    setActive(active);
    /**
     * Zoom inside the window, like a screen recording that punches in:
     * keys = [[time, zoom, fx, fy]], (fx, fy) the focus as fractions of the page.
     * The window stays put; its contents scale about the focus.
     */
    const zoom = (t, keys) => {
      let [z, fx, fy] = keys[0].slice(1);
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i - 1][0]) break;
        const k = ease.inOutCubic(prog(t, keys[i - 1][0], keys[i][0] - keys[i - 1][0]));
        z = lerp(keys[i - 1][1], keys[i][1], k); fx = lerp(keys[i - 1][2], keys[i][2], k); fy = lerp(keys[i - 1][3], keys[i][3], k);
      }
      const px = fx * W, py = fy * H;
      frame.style.transform = `translate(${scale * px * (1 - z)}px, ${scale * py * (1 - z)}px) scale(${scale * z})`;
    };
    return { win, frame, app, main, mainEl, setActive, zoom };
  }

  /** A phone: a 390×844 screen with a status bar, then the app or a page below it. */
  function phone(parent, { x, y, scale = 0.9, time = '9:41', dark = false }) {
    const el = place(h('div', 'device', parent), { x, y });
    const frame = h('div', 'phone', el);
    frame.style.transform = `scale(${scale})`;
    const screen = h('div', 'phone-screen', frame);
    const status = h('div', 'phone-status' + (dark ? ' dark' : ''), screen, `<span>${time}</span><span class="isl"></span><span class="bars">${I('signal')}</span>`);
    status.querySelector('.bars').innerHTML = '<svg viewBox="0 0 34 13" fill="currentColor"><rect x="0" y="8" width="3.5" height="5" rx="1"/><rect x="5.5" y="5.5" width="3.5" height="7.5" rx="1"/><rect x="11" y="3" width="3.5" height="10" rx="1"/><rect x="16.5" y="0" width="3.5" height="13" rx="1"/><rect x="24" y="1.5" width="10" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="26" y="3.5" width="6" height="6" rx="1.5"/></svg>';
    const content = h('div', 'phone-content', screen);
    return { el, frame, screen, content, status };
  }

  /** The app as a phone shows it: menu button, theme, bell, avatar, then the page. */
  function phoneApp(parent, initials) {
    const app = h('div', 'app app-phone', parent);
    h('header', 'tb tb-m', app, `<span class="tb-icon">${I('Menu', 'i20')}</span><span class="right"><span class="tb-icon">${I('Sun')}</span><span class="tb-icon">${I('Bell')}</span><span class="avatar-g">${initials}</span></span>`);
    const mainEl = h('main', 'main main-m', app);
    return { app, main: h('div', 'main-inner', mainEl) };
  }

  /** Mouse pointer following keyframes, rippling on clicks. Coordinates in `root`'s space. */
  function pointer(root) {
    const el = h('div', 'cursor', root, '<svg viewBox="0 0 24 24"><path d="M4 2.5l15.5 9.2-6.8 1.4 3.9 7.3-2.9 1.5-3.9-7.3L5 19.5z" fill="#0a0a0a" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>');
    const ripple = h('div', 'ripple', root);
    return (t, keys, clicks = [], show = keys[0][0], hide = Infinity) => {
      const p = path(t, keys);
      const last = clicks.filter((c) => t >= c).pop();
      const pressed = last != null && t - last < 0.12;
      set(el, { o: t < show || t > hide ? 0 : ease.outCubic(prog(t, show, 0.2)), x: p.x, y: p.y, s: pressed ? 0.85 : 1 });
      if (last != null && t - last < 0.45 && t <= hide) {
        const k = prog(t, last, 0.45);
        set(ripple, { o: 0.5 * (1 - k), x: p.x + 4, y: p.y + 4, s: lerp(0.3, 1.5, ease.outCubic(k)) });
      } else ripple.style.opacity = 0;
    };
  }

  /** A finger tap on a phone. */
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

  const at = (el, root, dx = -2, dy = -2) => {
    const c = centre(el, root);
    return [c.x + dx, c.y + dy];
  };

  /** Rows of a grid table; `cols` is a grid-template-columns string. */
  function table(parent, cols, head, rows) {
    const t = h('div', 'tbl-a', parent);
    const th = h('div', 'tr-a th', t, head.map((c) => `<div${c.startsWith('>') ? ' class="r"' : ''}>${c.replace(/^>/, '')}</div>`).join(''));
    th.style.gridTemplateColumns = cols;
    const els = rows.map((cells) => {
      const r = h('div', 'tr-a', t, cells.map((c) => (typeof c === 'string' ? `<div>${c}</div>` : `<div class="${c[1]}">${c[0]}</div>`)).join(''));
      r.style.gridTemplateColumns = cols;
      return r;
    });
    return { t, th, rows: els };
  }

  const toast = (parent, text) => h('div', 'toast-a', parent, `${I('CircleCheck')}<span>${text}</span>`);

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
        el.innerHTML = `<b>RECEIPT No. ${a}</b>Received from: ________<br>Sum of: ₦${b.toLocaleString('en-US')}<br>Being: school fees<br>Sign: ______`;
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
        const ck = ease.inCubic(collapse);
        set(f.el, {
          o: clamp(k * 3) * (f.dim ? 0.35 : 1) * (1 - ck),
          x: lerp(0, 960 - f.x - 150, ck) + Math.sin(lt * 37 + f.i * 3) * shake,
          y: lerp(0, 415 - f.y - 50, ck) + Math.sin(lt * 1.4 + f.i) * 6,
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

  /* ── 1 · Register (Educator, on a phone) ───────────────────────── */

  function register(root, sc, F) {
    const s = F.story;
    const caps = captions(root, sc, { x: 130, y: 380, width: 900 });
    const ph = phone(root, { x: 1300, y: 140, time: '7:52' });
    const { main } = phoneApp(ph.content, 'AE');
    // register/page.tsx + register-screen.tsx
    h('div', 'reg-h', main, `<div class="row gap12" style="align-items:flex-start">${I('ArrowLeft')}<div><div class="h1s">Register</div><div class="mut">${s.pupilClass}</div></div></div><div><div class="lbl" style="margin-bottom:4px">Date</div><div class="inp num" style="width:150px">24/09/2026 ${I('Calendar')}</div></div>`);
    h('div', 'row', main, `<div class="b7" style="font-size:20px;line-height:28px">${s.pupilClass}</div><span class="bdg t-neutral b6" style="margin-left:auto">14 pupils</span>`).style.marginTop = '20px';
    h('div', 'mut', main, `Thursday 24 September · First Term`);
    const tally = h('div', 'reg-tally num', main);
    h('div', 'reg-details', main, `<span style="font-size:10px">▶</span> Absent or excused?`);
    const list = h('div', 'cd reg-list', main);
    const names = ['Amina Bello', 'David Okafor', 'Esther Johnson', 'Ibrahim Sani', s.pupil, 'Grace Obi', 'Chidera Nnamdi', 'Oluwaseun Ade', 'Fatima Yusuf'];
    const rows = names.map((n, i) => {
      const [f, l] = n.split(' ');
      const row = h('div', 'reg-row', list, `<div class="row gap12"><span class="reg-av">${l.slice(0, 2).toUpperCase()}</span><div><div>${l}, ${f}</div><div class="xs mut num">GFC/2025/${String(311 + i * 7).padStart(4, '0')}</div></div></div>`);
      const seg = h('div', 'seg4', row, '<span>P</span><span>L</span><span>A</span><span>E</span>');
      return { row, seg };
    });
    const tobi = rows[4];
    const why = h('div', 'reg-why', tobi.row, `<div class="caps-l" style="margin:12px 0 8px">Why is ${s.pupil.split(' ')[0]} away?</div><div class="chips">${['Illness', 'Appointment', 'Family reason', 'Travelling', 'Bereavement', 'Religious observance', 'Suspended', 'Not known'].map((c) => `<span class="chip">${c}</span>`).join('')}</div>`);
    const notKnown = why.querySelector('.chip:last-child');
    const bar = h('div', 'reg-bar', ph.content);
    const warn = h('div', 'reg-warn', bar, `${I('AlertTriangle', 'i14')} 1 pupil needs a reason before this register can be saved.`);
    const submit = h('div', 'reg-submit', bar);
    const done = toast(ph.content, `Register saved — 14 marked`);
    done.style.cssText += 'right:17px;left:auto;top:70px;width:356px';
    const tap = tapper(ph.screen);
    const WHY_H = 188;

    return (lt) => {
      caps(lt);
      A.slide(ph.el, lt, 0, { dy: 90, dur: 0.7 });
      const absent = lt >= 1.45, reason = lt >= 2.45;
      rows.forEach((r, i) => {
        const cells = r.seg.children;
        const a = i === 4 && absent;
        cells[0].className = a ? '' : 'P';
        cells[2].className = a ? 'A' : '';
      });
      tally.innerHTML = `<span>${absent ? 13 : 14} present</span><span>0 late</span><span>${absent ? 1 : 0} absent</span><span>0 excused</span>`;
      why.style.height = WHY_H * ease.outCubic(prog(lt, 1.45, 0.35)) + 'px';
      notKnown.classList.toggle('on', reason);
      const needReason = absent && !reason;
      warn.style.display = needReason ? 'flex' : 'none';
      submit.classList.toggle('dis', needReason);
      submit.innerHTML = `Submit register <small class="num">${absent ? 13 : 14} present · 0 late · ${absent ? 1 : 0} absent</small>`;
      set(submit, { s: lt >= 3.3 && lt < 3.45 ? 0.97 : 1 });
      // The teacher scrolls down to Tobi, taps A, picks a reason and submits.
      const sy = 250 * ease.inOutCubic(prog(lt, 0.7, 0.5)) + 190 * ease.inOutCubic(prog(lt, 1.6, 0.5));
      main.style.transform = `translateY(${-sy}px)`;
      const A_ = centre(tobi.seg.children[2], ph.screen);
      const nk = centre(notKnown, ph.screen);
      const sb = centre(submit, ph.screen);
      tap(lt, [[1.35, A_.x, A_.y - sy], [2.35, nk.x, nk.y - sy], [3.25, sb.x, sb.y]]);
      if (lt < 5.2) A.slide(done, lt, 3.5, { dy: -20, dur: 0.4 });
      else set(done, { o: 1 - prog(lt, 5.2, 0.25) });
    };
  }

  /* ── 2 · Pupils to follow up (Registrar) ───────────────────────── */

  function atrisk(root, sc, F) {
    const s = F.story;
    const caps = captions(root, sc, { x: 1230, y: 330, width: 620 });
    const d = desk(root, F, { x: 95, y: 200, url: 'greenfield.soteria.app/attendance/at-risk', active: 'Follow up' });
    h('div', '', d.main, `<div class="h1">Pupils to follow up</div><div class="lead">Attendance below your threshold this term, worst first. A child who stops coming usually stops weeks before anyone notices.</div>`);
    h('div', 'row', d.main, `<div><div class="lbl">Term</div><div class="inp" style="width:208px">First Term<span class="chev">${I('ChevronDown')}</span></div></div><div style="margin-left:16px"><div class="lbl">Below (%)</div><div class="inp num" style="width:96px">85</div></div><div class="mut" style="margin:22px 0 0 16px"><span class="cnt">3</span> pupils of 14 teaching days so far.</div>`).style.marginTop = '24px';
    const cnt = d.main.querySelector('.cnt');
    h('div', 'row', d.main, `<div class="inp" style="width:288px"><span class="mut">${I('Search')}</span><span class="ph">Pupil, admission no. or guardian…</span></div><div class="inp" style="width:160px;margin-left:12px">All classes<span class="chev">${I('ChevronDown')}</span></div>`).style.marginTop = '24px';
    const card = h('div', 'cd risk', d.main);
    card.style.marginTop = '16px';
    const cols = '160px 120px 106px 130px 234px 1fr 150px';
    const person = (n, adm) => [`<div class="two">${n}<small class="num">${adm}</small></div>`, ''];
    const call = (g, p) => [`<div class="row gap8">${I('Phone')}<div class="two">${g}<small class="num">${p}</small></div></div>`, ''];
    const log = [`<span class="btn-a ghost">${I('MessageSquarePlus')}Log contact</span>`, 'r'];
    const none = ['<span class="xs mut">None yet</span>', ''];
    const T = table(card, cols, ['Pupil', 'Class', 'In school', 'Attendance', 'Who to call', 'Last contact', ''], [
      [person('Adeyemi, Tobi', 'GFC/2025/0339'), ['JSS2 Gold', 'mut'], '10 of 14', ['<span class="bdg sq t-problem num tob">71.4%</span>', ''], call(s.guardian, s.guardianPhone), none, log],
      [person('Okoro, Daniel', 'GFC/2023/0102'), ['SS1 Green', 'mut'], '11 of 14', ['<span class="bdg sq t-problem num">78.6%</span>', ''], call('Mr Samuel Okoro', '0812 553 0194'), ['<div class="two"><span class="bdg t-done">Spoke to them</span><small>Sep 18, 2026 · Grace Ade</small></div>', ''], log],
      [person('Nwosu, Ifeoma', 'GFC/2026/0041'), ['JSS1 Blue', 'mut'], '11 of 14', ['<span class="bdg sq t-problem num">78.6%</span>', ''], call('Mr Chinedu Nwosu', '0806 771 2230'), none, log],
      [person('Musa, Zainab', 'GFC/2024/0210'), ['JSS3 Gold', 'mut'], '12 of 14', ['<span class="bdg sq t-problem num">85.7%</span>', ''], call('Mrs Hauwa Musa', '0703 118 4462'), none, log],
    ]);
    T.rows.forEach((r) => (r.style.height = '53px'));
    const [tobiRow] = T.rows;
    const tobPct = tobiRow.querySelector('.tob');
    const lastCell = tobiRow.children[5];
    const logBtn = tobiRow.children[6].firstChild;
    // log-contact-dialog.tsx
    const ovl = h('div', 'ovl', d.app);
    const dlg = h('div', 'dlg', d.app, `<div class="dlg-x">${I('X')}</div><div class="dlg-t">Log a contact about ${s.pupil}</div><div class="subs">Staff who follow up this pupil will see it on their record.</div>
      <div class="grid2"><div><div class="lbl">How</div><div class="inp" style="width:122px">Phone call<span class="chev">${I('ChevronDown')}</span></div></div><div><div class="lbl">Did you get through?</div><div class="inp" style="width:147px">Yes, we spoke<span class="chev">${I('ChevronDown')}</span></div></div>
      <div><div class="lbl">With</div><div class="inp">${s.guardian}</div></div><div><div class="lbl">When</div><div class="inp num">24/09/2026, 10:34</div></div></div>
      <div class="lbl" style="margin-top:16px">What came of it</div><div class="inp note" style="height:64px;align-items:flex-start;padding-top:8px"></div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:16px"><span class="btn-a out">Cancel</span><span class="btn-a save">Save contact</span></div>`);
    dlg.style.top = '251px';
    const note = dlg.querySelector('.note');
    const save = dlg.querySelector('.save');
    const move = pointer(d.frame);

    return (lt) => {
      caps(lt);
      A.slide(d.win, lt, 0, { dx: -80, dur: 0.7 });
      // Tobi's slide below the others lands him first on a list sorted worst first.
      const enter = ease.outQuint(prog(lt, 1.9, 0.5));
      T.rows.slice(1).forEach((r, i) => A.rise(r, lt, 0.35 + i * 0.1, { dy: 12 }));
      // Until he arrives the others sit in his slot; then they make room.
      T.rows[1].style.marginTop = -53 * (1 - enter) + 'px';
      if (lt < 1.9) { tobiRow.style.opacity = 0; }
      else set(tobiRow, { o: enter, x: -30 * (1 - enter) });
      tobiRow.style.background = lt >= 1.9 && lt < 3.6 ? `rgba(254,226,226,${0.6 * (1 - prog(lt, 3.0, 0.6))})` : '#fff';
      cnt.textContent = lt >= 1.9 ? '4' : '3';
      tobPct.textContent = count(lt, 1.9, 1.1, 85.7, 71.4, ease.outCubic).toFixed(1) + '%';
      // Log contact → the dialog → saved, and the row shows it.
      const open = lt >= 4.05 && lt < 6.45;
      const k = open ? ease.outCubic(prog(lt, 4.05, 0.2)) : lt >= 6.45 ? 1 - prog(lt, 6.45, 0.15) : 0;
      set(ovl, { o: k });
      set(dlg, { o: k, s: lerp(0.96, 1, k) });
      const tx = typed(lt, 4.5, 'Sick with malaria, back on Monday', 32);
      note.innerHTML = tx ? tx + (lt < 5.7 ? '<span class="caret-a"></span>' : '') : '<span class="ph">Sick with malaria, back on Monday</span>';
      if (!tx) note.firstChild.style.color = 'var(--muted)';
      note.classList.toggle('focus', lt >= 4.4 && lt < 5.9);
      set(save, { s: lt >= 6.2 && lt < 6.35 ? 0.96 : 1 });
      lastCell.innerHTML = lt >= 6.5 ? '<div class="two"><span class="bdg t-done">Spoke to them</span><small>Sep 24, 2026 · Grace Ade</small></div>' : '<span class="xs mut">None yet</span>';
      if (lt >= 6.5) A.pop(lastCell.firstChild, lt, 6.5, { from: 0.8 });
      const [lx, ly] = at(logBtn, d.frame, -30, 0);
      const [sx, sy] = at(save, d.frame, -10, -4);
      d.zoom(lt, [[0, 1, 0.5, 0.5], [1.8, 1, 0.5, 0.5], [2.3, 1.45, 0.3, 0.42], [3.3, 1.45, 0.3, 0.42], [3.7, 1.25, 0.75, 0.42], [4.1, 1.4, 0.5, 0.42], [6.3, 1.4, 0.5, 0.42], [6.8, 1.35, 0.72, 0.42]]);
      move(lt, [[3.1, 1100, 750], [3.8, lx, ly], [4.2, lx, ly], [5.8, sx + 60, sy + 60], [6.1, sx, sy], [6.6, sx, sy], [7.2, 900, 780]], [3.95, 6.2], 3.1);
    };
  }

  /* ── 3 · The gate (Front desk) ─────────────────────────────────── */

  function gate(root, sc, F) {
    const caps = captions(root, sc, { x: 120, y: 380 });
    const d = desk(root, F, { x: 830, y: 200, url: 'greenfield.soteria.app/attendance/gate', active: 'The Gate' });
    h('div', '', d.main, `<div class="h1s">The gate</div><div class="subs">Sign a pupil out during the day, and back in when they return.</div>`);
    const card = h('div', 'cd', d.main);
    card.style.cssText = 'margin-top:24px;padding:20px 24px 24px';
    h('div', 'lbl', card, 'Find a pupil').style.marginTop = '12px';
    const search = h('div', 'inp', card);
    search.style.height = '44px';
    const results = h('div', 'gate-res', card, `<div class="row" style="justify-content:space-between"><span class="b5">Obi, Chiamaka</span><span class="xs mut num">GFC/2024/0117</span></div><div class="row" style="justify-content:space-between"><span class="b5">Obi, Chidinma</span><span class="xs mut num">GFC/2022/0088</span></div>`);
    const chosen = h('div', 'gate-chosen', card);
    chosen.innerHTML = `<div class="b6" style="font-size:18px;line-height:28px;margin-top:16px">Obi, Chiamaka</div>
      <div class="lbl" style="margin-top:12px">Why are they leaving?</div><div class="inp" style="width:256px">Appointment<span class="chev">${I('ChevronDown')}</span></div>
      <div class="caps-l" style="margin:16px 0 8px">Who is collecting them?</div>`;
    const list = h('div', 'gate-list', chosen);
    const opt = (name, sub, barred) => h('div', 'gate-opt' + (barred ? ' barred' : ''), list, `<span class="radio"></span><div><div>${name}</div><div class="xs ${barred ? 'red' : 'mut'}">${sub}</div></div>`);
    const mum = opt('Mrs Ngozi Obi', 'mother · primary contact');
    opt('Mr Emeka Obi', 'father');
    const barred = opt('Mr Chidi Okafor', 'Not permitted to collect this pupil', true);
    const go = h('div', 'btn-a lg', chosen);
    go.style.marginTop = '16px';
    h('div', 'caps-l', d.main, "Today's movements").style.margin = '32px 0 12px';
    const moves = h('div', 'cd gate-moves', d.main);
    const newMove = h('div', 'gate-move', moves, `<div>Obi, Chiamaka</div><div class="xs mut">Left 12:15 PM with Mrs Ngozi Obi</div>`);
    h('div', 'gate-move', moves, `<div>Bello, Amina</div><div class="xs mut">Left 9:40 AM with Mr Yusuf Bello · back 11:05 AM</div>`);
    const signed = toast(d.app, 'Signed out');
    const move = pointer(d.frame);

    return (lt) => {
      caps(lt);
      A.slide(d.win, lt, 0, { dx: 80, dur: 0.7 });
      const picked = lt >= 1.65 && lt < 4.45;
      const q = lt >= 4.45 ? '' : typed(lt, 0.6, 'Chiamaka', 16);
      search.innerHTML = q ? `${q}${!picked && lt < 1.65 ? '<span class="caret-a"></span>' : ''}` : '<span class="ph">Name or admission number</span>';
      search.classList.toggle('focus', lt >= 0.5 && lt < 1.65);
      results.style.display = q && !picked ? 'block' : 'none';
      chosen.style.display = picked ? 'block' : 'none';
      const who = lt >= 3.65 ? mum : lt >= 2.45 ? barred : null;
      [...list.children].forEach((o) => o.querySelector('.radio').classList.toggle('on', o === who));
      // Choosing the barred adult turns the button red: releasing needs an override.
      go.className = 'btn-a lg' + (who === barred ? ' danger' : who ? '' : ' dis');
      go.innerHTML = `${I('LogOut')}${who === barred ? 'Release to Mr Chidi Okafor…' : 'Sign out'}`;
      if (who === barred) A.pop(go, lt, 2.45, { from: 0.9, dur: 0.3 });
      else set(go, { s: lt >= 4.3 && lt < 4.45 ? 0.96 : 1 });
      if (lt >= 4.45) A.rise(newMove, lt, 4.5, { dy: -10 });
      else newMove.style.display = 'none';
      if (lt >= 4.45) newMove.style.display = 'block';
      if (lt < 6.4) A.slide(signed, lt, 4.5, { dx: 40, dur: 0.4 });
      else set(signed, { o: 1 - prog(lt, 6.4, 0.3) });
      // Measure each target with its panel shown (offsets of hidden elements are 0),
      // then restore what this moment actually shows.
      const P = (el, dx, dy = -2) => at(el, d.frame, dx, dy);
      const shown = [results.style.display, chosen.style.display];
      results.style.display = 'block'; chosen.style.display = 'none';
      const r1 = P(results.firstChild, -200);
      results.style.display = 'none'; chosen.style.display = 'block';
      const pb = P(barred, -380), pm = P(mum, -380), pg = P(go, -10);
      [results.style.display, chosen.style.display] = shown;
      d.zoom(lt, [[0, 1, 0.5, 0.5], [0.4, 1, 0.5, 0.5], [0.9, 1.3, 0.5, 0.25], [1.9, 1.3, 0.5, 0.3], [2.3, 1.4, 0.45, 0.42], [4.6, 1.4, 0.45, 0.42], [5.2, 1.15, 0.5, 0.45]]);
      move(lt, [[1.0, 900, 700], [1.45, ...r1], [1.8, ...r1], [2.3, ...pb], [3.3, ...pb], [3.55, ...pm], [3.9, ...pm], [4.25, ...pg], [4.8, ...pg], [5.4, 1100, 820]], [1.6, 2.4, 3.6, 4.3], 1.0);
    };
  }

  /* ── 4 · The bill (Bursar → Parent) ────────────────────────────── */

  function invoice(root, sc, F) {
    const s = F.story;
    const bal = s.feeTotal - s.feePaid;
    const caps = captions(root, sc, { x: 120, y: 330 });
    const d = desk(root, F, { x: 830, y: 200, url: 'greenfield.soteria.app/fees/invoices/inv-0413', active: 'Fees' });
    h('div', 'tabs-u', d.main, [['Price list', 'BadgeDollarSign'], ['Invoices', 'ReceiptText'], ['Receipts', 'HandCoins'], ['Concessions', 'BadgePercent'], ['Optional fees', 'Bus'], ['Arrears', 'TrendingDown']].map(([t, i]) => `<span class="${t === 'Invoices' ? 'on' : ''}">${I(i)}${t}</span>`).join(''));
    const head = h('div', 'row', d.main, `<div class="grow"><div class="mut row gap8" style="font-size:13px">${I('ArrowLeft', 'i14')}Invoices</div><div class="h1s b7" style="margin-top:4px">INV-2026-0413</div><div class="subs">Adeyemi, Tobi · GFC/2025/0339 · JSS2 · First Term</div></div>`);
    head.style.alignItems = 'flex-start';
    h('div', 'row gap8', head, `<span class="bdg t-active">Issued</span>`);
    const pdf = h('span', 'btn-a out', head.lastChild, `${I('Download')}PDF`);
    h('span', 'btn-a out', head.lastChild, 'Cancel');
    const card = h('div', 'cd cd-p', d.main);
    card.style.marginTop = '24px';
    h('div', 'cd-t', card, 'What is charged');
    const lines = [['Tuition', 150000], ['Development levy', 15000], ['Books and materials', 12000], ['Sports and clubs', 8000]];
    h('div', 'inv-lines', card, lines.map(([k, v]) => `<div class="row"><span class="grow">${k}</span><span class="num">${naira2(v)}</span></div>`).join('') + `<div class="row tot"><span class="grow">Total</span><span class="num b7" style="font-size:18px">${naira2(s.feeTotal)}</span></div>`);
    h('div', 'inv-meta3', d.main, `<div><div class="mut">Issued</div><div class="num">2026-09-07</div></div><div><div class="mut">Due</div><div class="num">2026-09-30</div></div><div><div class="mut">Concessions</div><div class="num">₦0.00</div></div>`);
    const dl = h('div', 'dl-chip', d.app, `${I('FileText')}<div><div class="b5">invoice-INV-2026-0413.pdf</div><div class="xs mut">86 KB · Done</div></div>`);
    const move = pointer(d.frame);

    // The parent's phone: the school sends the PDF, whose link opens the bill.
    const ph = phone(root, { x: 1300, y: 140, time: '14:00' });
    const chat = h('div', 'chat', ph.content, `<div class="chat-h">${I('ChevronLeft', 'i20')}<span class="sb-logo" style="width:32px;height:32px;border-radius:50%;font-size:13px">G</span><div><div class="b6">${s.school}</div><div class="xs mut">Bursary</div></div></div><div class="chat-body"></div>`);
    const body = chat.querySelector('.chat-body');
    const msg = h('div', 'bubble', body, `<div class="att">${I('FileText', 'i20')}<div><div class="b5">invoice-INV-2026-0413.pdf</div><div class="xs mut">PDF · 1 page</div></div></div><div style="margin-top:8px">Good afternoon Ma. ${s.pupil.split(' ')[0]}'s ${s.term.split(' ').slice(0, 2).join(' ')} bill. You can also open it here:</div><div class="link">greenfield.soteria.app/invoice/7fk2Q…</div><div class="xs mut r" style="margin-top:4px">2:00 PM</div>`);
    const link = msg.querySelector('.link');
    // (public)/invoice/[token]/page.tsx
    const pub = h('div', 'pub', ph.content);
    pub.innerHTML = `<div class="phone-url" style="margin:-58px -32px 22px">${I('Lock', 'i14')}greenfield.soteria.app/invoice/7fk2Q…</div>
      <div style="text-align:center"><div class="b7" style="font-size:20px;line-height:28px">${s.school}</div><div class="mut">Invoice INV-2026-0413 · ${s.term}</div></div>
      <div class="cd due"><div class="mut">Still to pay</div><div class="due-v num">₦0.00</div><div class="mut">Due Sep 30, 2026</div></div>
      <div class="cd pub-card"><div class="b6" style="font-size:16px">${s.pupil}</div><div class="mut" style="margin:6px 0 18px">${s.pupilClass} · GFC/2025/0339</div>${lines.map(([k, v]) => `<div class="pl"><span>${k}</span><span class="num">${naira2(v)}</span></div>`).join('')}<div class="pl tot"><span>Total</span><span class="num b7">${naira2(s.feeTotal)}</span></div><div class="pl mut" style="border:none"><span>Paid so far</span><span class="num">– ${naira2(s.feePaid)}</span></div></div>`;
    const due = pub.querySelector('.due');
    const dueV = pub.querySelector('.due-v');
    const tap = tapper(ph.screen);

    return (lt) => {
      caps(lt);
      if (lt < 3.0) A.slide(d.win, lt, 0, { dx: 80, dur: 0.7 });
      else {
        const k = ease.inCubic(prog(lt, 3.0, 0.4));
        set(d.win, { o: 1 - k, x: -60 * k, s: 1 - 0.06 * k, blur: 6 * k });
      }
      set(pdf, { s: lt >= 1.5 && lt < 1.65 ? 0.95 : 1 });
      A.slide(dl, lt, 1.75, { dy: 20, dur: 0.4 });
      const [px, py] = at(pdf, d.frame, -8, -2);
      d.zoom(lt, [[0, 1, 0.5, 0.5], [0.6, 1, 0.5, 0.5], [1.1, 1.3, 0.75, 0.22], [3, 1.3, 0.75, 0.22]]);
      move(lt, [[0.8, 700, 700], [1.35, px, py]], [1.5], 0.8);
      A.slide(ph.el, lt, 3.2, { dy: 140, dur: 0.6 });
      A.slide(msg, lt, 3.6, { dy: 20, dur: 0.4, s: 0.96 });
      const lc = centre(link, ph.screen);
      tap(lt, [[4.1, lc.x, lc.y]]);
      pub.style.transform = `translateY(${(1 - ease.outQuint(prog(lt, 4.25, 0.45))) * 800}px)`;
      dueV.style.opacity = lt >= 4.6 ? 1 : 0;
      dueV.textContent = naira2(Math.round(count(lt, 4.6, 0.8, 0, bal, ease.outExpo)));
      due.classList.toggle('ring', lt >= 7.0);
    };
  }

  /* ── 5 · Receipts → the ledger (Bursar) ────────────────────────── */

  function ledger(root, sc, F) {
    const s = F.story;
    const bal = s.feeTotal - s.feePaid;
    const caps = captions(root, sc, { x: 120, y: 360 });
    const d = desk(root, F, { x: 830, y: 200, url: 'greenfield.soteria.app/fees/payments', active: 'Fees' });
    // Before: Receipts, with "Record a payment" open.
    const rec = h('div', 'layer-a', d.main);
    h('div', 'tabs-u', rec, [['Price list', 'BadgeDollarSign'], ['Invoices', 'ReceiptText'], ['Receipts', 'HandCoins'], ['Concessions', 'BadgePercent'], ['Optional fees', 'Bus'], ['Arrears', 'TrendingDown']].map(([t, i]) => `<span class="${t === 'Receipts' ? 'on' : ''}">${I(i)}${t}</span>`).join(''));
    h('div', 'row', rec, `<div class="grow"><div class="h1s">Receipts</div><div class="subs">Money received, and what it settled.</div></div><span class="btn-a">${I('Plus')}Record a payment</span>`);
    const rcard = h('div', 'cd', rec);
    rcard.style.marginTop = '24px';
    const rcols = '1.2fr 1.4fr 1fr 0.9fr 1fr 0.8fr 110px';
    const rrow = (no, ref, who, adm, m, on, amt) => [[`<div class="two">${no}${ref ? `<small class="num">${ref}</small>` : ''}</div>`, ''], [`<div class="two">${who}<small class="num">${adm}</small></div>`, ''], [on, 'num mut'], [m, 'mut'], [naira2(amt), 'r num b6'], ['—', 'r mut'], [`<span class="row gap12" style="justify-content:flex-end">${I('Download')}Void</span>`, 'r']];
    const R = table(rcard, rcols, ['Receipt', 'Child', 'Paid on', 'Method', '>Amount', '>Unapplied', ''], [
      rrow('RCT-2026-0391', 'GTB-2409-5521', 'Adeyemi, Tobi', 'GFC/2025/0339', 'Bank transfer', 'Sep 24, 2026', bal),
      rrow('RCT-2026-0390', 'ZEN-2309-1142', 'Adewale, Folake', 'GFC/2024/0150', 'Bank transfer', 'Sep 23, 2026', 185000),
      rrow('RCT-2026-0389', '', 'Bello, Amina', 'GFC/2026/0012', 'Cash', 'Sep 22, 2026', 185000),
      rrow('RCT-2026-0388', 'POS-88213', 'Eze, Chuka', 'GFC/2022/0077', 'POS', 'Sep 19, 2026', 150000),
    ]);
    R.rows.forEach((r) => (r.style.height = '61px'));
    const newRec = R.rows[0];
    const ovl = h('div', 'ovl', d.app);
    const dlg = h('div', 'dlg', d.app, `<div class="dlg-x">${I('X')}</div><div class="dlg-t">Record a payment</div><div class="subs">Anything not applied to a bill is kept as the family's credit.</div>
      <div class="grid2"><div><div class="lbl">Who it is for</div><div class="inp who"><span class="ph">Child</span><span class="chev">${I('ChevronDown')}</span></div></div><div><div class="lbl">Amount</div><div class="inp amt num"></div></div>
      <div><div class="lbl">Method</div><div class="inp" style="width:145px">Bank transfer<span class="chev">${I('ChevronDown')}</span></div></div><div><div class="lbl">Paid on</div><div class="inp num">24/09/2026<span class="chev">${I('Calendar')}</span></div></div>
      <div><div class="lbl">Into</div><div class="inp" style="width:195px">GTBank — operating<span class="chev">${I('ChevronDown')}</span></div></div><div><div class="lbl">Bank reference</div><div class="inp ref num"></div></div></div>
      <div class="lbl" style="margin-top:16px">Who paid</div><div class="inp"><span class="ph">Often not the registered guardian</span></div>
      <div class="settle"><div class="row"><span class="grow">What it settles</span><span class="mut left num"></span></div><div class="row" style="margin-top:10px"><div class="grow"><div>Adeyemi, Tobi <span class="mut">— First Term</span></div><div class="xs mut num">${naira2(bal)} outstanding</div></div><div class="inp r num" style="width:128px;justify-content:flex-end;height:32px"><span class="mut">—</span></div></div><div class="row xs mut gap8" style="margin-top:10px">${I('Info', 'i14')}Leave these empty to settle the child's own bills oldest first.</div></div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:16px"><span class="btn-a out">Cancel</span><span class="btn-a go">Record payment</span></div>`);
    dlg.style.top = '120px';
    const [who, amt, ref, left, go] = ['.who', '.amt', '.ref', '.left', '.go'].map((q) => dlg.querySelector(q));
    const recorded = toast(d.app, 'Receipt RCT-2026-0391 recorded');
    // After: the ledger, journal open.
    const led = h('div', 'layer-a', d.main);
    h('div', '', led, `<div class="h1">Ledger</div><div class="lead">Every naira in and out, as the books record it.</div>`);
    const books = h('div', 'cd books', led, `<div class="row gap8 b6" style="font-size:18px">${I('CircleCheck', 'i20')}The books balance</div><div class="subs">Debits equal credits, as of today.</div><div class="books-3"><div><div class="caps-l" style="letter-spacing:0;font-weight:500">Total debits</div><div class="bv num"></div></div><div><div class="caps-l" style="letter-spacing:0;font-weight:500">Total credits</div><div class="bv num"></div></div><div><div class="caps-l" style="letter-spacing:0;font-weight:500">Difference</div><div class="bv num">₦0.00</div></div></div>`);
    const [dv, cv] = books.querySelectorAll('.bv');
    h('div', 'tabs-p', led, '<span>Accounts</span><span class="on">Journal</span>').style.marginTop = '24px';
    h('div', 'inp', led, `Everything<span class="chev">${I('ChevronDown')}</span>`).style.cssText = 'width:200px;margin-top:16px';
    const jcard = h('div', 'cd', led);
    jcard.style.marginTop = '16px';
    const J = table(jcard, '170px 170px 1fr 160px', ['Date', 'Type', 'Description', '>Amount'], [
      [['Sep 24, 2026', 'mut num'], ['<span class="bdg t-neutral">Fee payment</span>', ''], `Fee payment RCT-2026-0391 — Adeyemi, Tobi`, [plain2(bal), 'r num']],
      [['Sep 23, 2026', 'mut num'], ['<span class="bdg t-neutral">Fee payment</span>', ''], 'Fee payment RCT-2026-0390 — Adewale, Folake', ['185,000.00', 'r num']],
      [['Sep 22, 2026', 'mut num'], ['<span class="bdg t-neutral">Expense</span>', ''], 'Diesel for the generator', ['62,000.00', 'r num']],
      [['Sep 22, 2026', 'mut num'], ['<span class="bdg t-neutral">Fee payment</span>', ''], 'Fee payment RCT-2026-0389 — Bello, Amina', ['185,000.00', 'r num']],
    ]);
    J.rows.forEach((r) => (r.style.height = '39px'));
    const jNew = J.rows[0];
    const edlg = h('div', 'dlg', d.app, `<div class="dlg-x">${I('X')}</div><div class="dlg-t" style="padding-right:24px">Fee payment RCT-2026-0391 — Adeyemi, Tobi</div><div class="subs">Sep 24, 2026 · Fee payment</div>
      <div class="cd" style="margin-top:16px;box-shadow:none;border-radius:8px;overflow:hidden"><div class="jl th"><span>Account</span><span class="r">Debit</span><span class="r">Credit</span></div><div class="jl"><span><span class="xs mut">BANK</span> GTBank — operating</span><span class="r num">${plain2(bal)}</span><span></span></div><div class="jl"><span><span class="xs mut">FEES_RECEIVABLE</span> Fees receivable<br><span class="xs mut">INV-2026-0413</span></span><span></span><span class="r num">${plain2(bal)}</span></div></div>`);
    edlg.style.top = '380px';
    const move = pointer(d.frame);
    // The parent's bill, now settled.
    const mini = phone(root, { x: 1620, y: 430, scale: 0.56, time: '16:10' });
    const mp = h('div', 'pub', mini.content);
    mp.innerHTML = `<div style="text-align:center"><div class="b7" style="font-size:20px;line-height:28px">${s.school}</div><div class="mut">Invoice INV-2026-0413 · ${s.term}</div></div>
      <div class="cd due"><div class="stp"><div class="mut">Still to pay</div><div class="due-v num">${naira2(bal)}</div><div class="mut">Due Sep 30, 2026</div></div><div class="paid">${I('CircleCheck', 'i20')}<div class="b6" style="font-size:18px;color:#16a34a;margin-top:8px">Paid in full</div><div class="mut" style="margin-top:6px">Thank you. Nothing is outstanding on this bill.</div></div></div>
      <div class="cd pub-card"><div class="b6" style="font-size:16px">${s.pupil}</div><div class="mut" style="margin:6px 0 10px">${s.pupilClass} · GFC/2025/0339</div><div class="pl tot"><span>Total</span><span class="num b7">${naira2(s.feeTotal)}</span></div><div class="pl mut" style="border:none"><span>Paid so far</span><span class="num pf"></span></div></div>`;
    const [stp, paidEl, pf] = ['.stp', '.paid', '.pf'].map((q) => mp.querySelector(q));

    return (lt) => {
      caps(lt);
      A.slide(d.win, lt, 0, { dx: 80, dur: 0.6 });
      const after = lt >= 2.8;
      d.setActive(after ? 'Ledger' : 'Fees');
      d.win.querySelector('.bw-url').innerHTML = `${I('Lock', 'i14')}greenfield.soteria.app/${after ? 'ledger' : 'fees/payments'}`;
      set(rec, { o: after ? 0 : 1 });
      const close = prog(lt, 2.0, 0.15);
      const dk = lt < 2.0 ? ease.outCubic(prog(lt, 0.15, 0.25)) : 1 - close;
      set(ovl, { o: dk });
      set(dlg, { o: dk, s: lerp(0.96, 1, dk) });
      who.innerHTML = lt >= 0.45 ? `Adeyemi, Tobi (GFC/2025/0339)<span class="chev">${I('ChevronDown')}</span>` : `<span class="ph">Child</span><span class="chev">${I('ChevronDown')}</span>`;
      const a = typed(lt, 0.6, String(bal), 14);
      amt.innerHTML = a || '<span class="ph">200000</span>';
      amt.classList.toggle('focus', lt >= 0.55 && lt < 1.05);
      left.textContent = `${naira2(a ? Number(a) : 0)} left to apply`;
      const r = typed(lt, 1.1, 'GTB-2409-5521', 40);
      ref.innerHTML = r || '<span class="ph">TRF/2026/09/8871</span>';
      set(go, { s: lt >= 1.85 && lt < 2.0 ? 0.96 : 1 });
      if (lt < 2.05) newRec.style.display = 'none';
      else { newRec.style.display = 'grid'; newRec.style.background = `rgba(209,250,229,${0.7 * (1 - prog(lt, 2.4, 0.4))})`; }
      if (lt < 2.8) A.slide(recorded, lt, 2.1, { dx: 40, dur: 0.35 });
      else recorded.style.opacity = 0;
      // The ledger: the books still balance, with the new entry on top.
      set(led, { o: after ? ease.outCubic(prog(lt, 2.8, 0.25)) : 0 });
      const tot = 74943400 + bal * ease.outCubic(prog(lt, 3.0, 0.6));
      dv.textContent = naira2(tot);
      cv.textContent = naira2(tot);
      jNew.style.background = lt >= 2.8 && lt < 4.6 ? `rgba(209,250,229,${0.7 * (1 - prog(lt, 4.0, 0.6))})` : '#fff';
      const eo = lt >= 3.85 ? ease.outCubic(prog(lt, 3.85, 0.2)) : 0;
      const eclose = lt >= 6.9 ? prog(lt, 6.9, 0.2) : 0;
      set(edlg, { o: eo * (1 - eclose), s: lerp(0.96, 1, eo) });
      if (!after) ovl.style.opacity = dk;
      else set(ovl, { o: eo * (1 - eclose) });
      const [gx, gy] = at(go, d.frame, -10, -4);
      const [jx, jy] = at(jNew, d.frame, -200, 0);
      d.zoom(lt, [[0, 1.35, 0.5, 0.42], [1.9, 1.35, 0.5, 0.42], [2.4, 1, 0.5, 0.5], [2.8, 1, 0.5, 0.5], [3.3, 1.25, 0.4, 0.45], [3.7, 1.25, 0.4, 0.45], [4.0, 1.35, 0.5, 0.52], [6.9, 1.35, 0.5, 0.52], [7.3, 1.1, 0.4, 0.4]]);
      move(lt, [[0.9, 1000, 820], [1.6, gx, gy], [2.3, gx, gy], [3.2, jx + 100, jy + 80], [3.6, jx, jy], [4.2, jx, jy]], [1.85, 3.7], 0.9, 4.3);
      A.slide(mini.el, lt, 4.4, { dy: 60, dur: 0.6 });
      const pk = ease.outCubic(prog(lt, 5.0, 0.35));
      set(stp, { o: 1 - pk });
      set(paidEl, { o: pk, s: lerp(0.9, 1, pk) });
      pf.textContent = '– ' + naira2(lerp(s.feePaid, s.feeTotal, pk));
    };
  }

  /* ── 6 · Payroll (Staff) ───────────────────────────────────────── */

  function payroll(root, sc, F) {
    const s = F.story;
    const caps = captions(root, sc, { x: 120, y: 360 });
    const d = desk(root, F, { x: 700, y: 200, url: 'greenfield.soteria.app/payroll/september-2026', active: 'Pay runs' });
    h('div', 'mut row gap8', d.main, `Pay runs ${I('ChevronRight', 'i14')} Payroll ${I('ChevronRight', 'i14')} ${s.payrollMonth}`);
    h('div', 'row gap12', d.main, `<div class="h1">${s.payrollMonth}</div><span class="bdg t-waiting">Processing</span>`).style.marginTop = '8px';
    h('div', 'lead', d.main, 'Sep 1, 2026 – Sep 30, 2026 · Paid Sep 25, 2026');
    const gross = s.payrollTotal + 2640000;
    const stats = h('div', 'pr-stats', d.main);
    const sv = [['Employees', 'Users', s.payrollStaff, (v) => Math.round(v)], ['Total Gross', 'TrendingUp', gross, naira2], ['Total Deductions', 'TrendingDown', 2640000, naira2], ['Total Net', 'DollarSign', s.payrollTotal, naira2]].map(([k, ic, v, f], i) => {
      const el = h('div', 'cd pr-stat', stats, `<div class="row mut" style="justify-content:space-between"><span>${k}</span><span style="color:${['#737373', '#16a34a', '#dc2626', '#0a0a0a'][i]}">${I(ic)}</span></div><div class="pr-v num"></div>`);
      return { el, v, f, out: el.querySelector('.pr-v') };
    });
    const buckets = h('div', 'pr-buckets', d.main);
    [['Draft', '#94a3b8', 0], ['Approved', '#3b82f6', s.payrollStaff], ['Paid', '#22c55e', 0]].forEach(([k, c, n]) => h('div', 'cd pr-b', buckets, `<div class="row gap8 mut"><span style="width:7px;height:7px;border-radius:50%;background:${c}"></span>${k}</div><div class="b7 num" style="font-size:20px;margin-top:4px">${n}</div>${n ? `<div class="xs mut num">${naira2(s.payrollTotal)}</div>` : ''}`));
    h('div', 'tabs-p', d.main, '<span class="on">Salaries</span><span>Adjustments</span><span>Payslips</span><span>Bank file</span><span>Ledger check</span><span>Variance</span>').style.marginTop = '24px';
    const card = h('div', 'cd', d.main);
    card.style.marginTop = '16px';
    const staff = [['Eze, Amaka', 515000, 102500], ['Ade, Grace', 480000, 95300], ['Garba, Yusuf', 455000, 89900], ['Okafor, Ngozi', 430000, 84100]];
    const T = table(card, '48px 1.6fr 1fr 1fr 1fr 1fr 110px', ['<span class="cbx"></span>', 'Employee', '>Gross', '>Deductions', '>Net', 'Status', '>Actions'], staff.map(([n, g, dd]) => [['<span class="cbx"></span>', ''], n, [naira2(g), 'r num'], [naira2(dd), 'r num red'], [naira2(g - dd), 'r num b7'], ['<span class="bdg t-active">Approved</span>', ''], [`<span class="row gap12" style="justify-content:flex-end">${I('Eye')}<span style="color:#2563eb">${I('CreditCard')}</span></span>`, 'r']]));
    T.rows.forEach((r) => (r.style.height = '60px'));
    // Amaka's own view: My Pay on her phone.
    const ph = phone(root, { x: 1560, y: 205, scale: 0.8, time: '9:41' });
    const { main } = phoneApp(ph.content, 'AE');
    h('div', '', main, `<div class="h1">My Pay</div><div class="lead" style="margin-top:0">${s.educator.replace(/^Mrs /, '')} · GFC-E-014 · T3 · Educator</div>`);
    const slips = h('div', 'cd cd-p', main);
    slips.style.cssText += 'margin-top:20px;padding:24px 24px 12px';
    h('div', 'b6', slips, 'Payslips').style.fontSize = '18px';
    const P = table(slips, '1.1fr 1fr 1.2fr', ['Period', 'Reference', '>Net pay'], [
      [['<div class="two">September<br>2026</div>', ''], ['<span class="xs mut num">PAY-2026-<br>09-014</span>', ''], ['<span class="sep"></span>', 'r num b5']],
      [['<div class="two">August<br>2026</div>', ''], ['<span class="xs mut num">PAY-2026-<br>08-014</span>', ''], [naira2(s.payslipNet), 'r num']],
      [['<div class="two">July<br>2026</div>', ''], ['<span class="xs mut num">PAY-2026-<br>07-014</span>', ''], [naira2(405200), 'r num']],
    ]);
    P.t.style.marginTop = '16px';
    P.th.style.background = '#f8fafc';
    const sep = P.rows[0].querySelector('.sep');
    const ytd = h('div', 'cd cd-p', main, `<div class="b6" style="font-size:18px">Year to date (2026)</div><div class="subs">Across 9 pay periods.</div><div class="caps-l" style="margin-top:16px;letter-spacing:0;font-weight:500">Net paid</div><div class="b6 num" style="font-size:16px;margin-top:4px">₦3,712,500.00</div>`);
    ytd.style.marginTop = '16px';

    return (lt) => {
      caps(lt);
      A.slide(d.win, lt, 0, { dx: 80, dur: 0.6 });
      sv.forEach((x, i) => {
        A.rise(x.el, lt, 0.2 + i * 0.08, { dy: 10 });
        x.out.textContent = x.f(count(lt, 0.4, 1.4, 0, x.v, ease.outCubic));
      });
      T.rows.forEach((r, i) => A.rise(r, lt, 0.9 + i * 0.08, { dy: 10 }));
      d.zoom(lt, [[0, 1, 0.5, 0.5], [0.2, 1, 0.5, 0.5], [0.7, 1.25, 0.32, 0.3], [2.4, 1.25, 0.32, 0.3], [2.9, 1.15, 0.3, 0.55]]);
      A.slide(ph.el, lt, 2.3, { dy: 120, dur: 0.6 });
      sep.textContent = naira2(Math.round(count(lt, 2.7, 0.8, 0, s.payslipNet, ease.outExpo)));
      P.rows[0].style.background = lt >= 2.7 ? `rgba(219,234,254,${0.8 * (1 - prog(lt, 4.2, 0.8))})` : '#fff';
    };
  }

  /* ── 7 · End card (Proprietor) ─────────────────────────────────── */

  function end(root, sc, F) {
    const s = F.story;
    const d = desk(root, F, { x: 330, y: 150, scale: 0.875, url: 'greenfield.soteria.app', active: 'Dashboard' });
    // (dashboard)/page.tsx for the owner: what waits on them, then the figures.
    h('div', '', d.main, `<div class="h1">Welcome back, Adebayo</div><div class="lead">Here's an overview of ${s.school}'s payroll status</div>`);
    h('div', 'caps-l', d.main, 'Waiting on you').style.cssText = 'margin:24px 0 12px;font-size:13px';
    const waits = h('div', 'dash-waits', d.main);
    [['Inbox', '2 decisions waiting on you', ''], ['ClipboardCheck', '3 registers not taken today', ''], ['BadgeDollarSign', '14 invoices overdue', '₦1,240,000.00 owed']].forEach(([ic, t, sub]) => h('div', 'cd dash-wait', waits, `<span style="color:#ea580c">${I(ic, 'i20')}</span><div class="grow"><div>${t}</div>${sub ? `<div class="xs mut num">${sub}</div>` : ''}</div>${I('ArrowRight')}`));
    const stats = h('div', 'dash-stats', d.main);
    const sv = [['Total Employees', 'Users', s.payrollStaff, (v) => Math.round(v), 'Active employees'], ['Monthly Payroll', 'Calculator', s.payrollTotal + 2640000, compact, 'Sep 2026 gross'], ['Active Loans', 'Receipt', 11, (v) => Math.round(v), 'Outstanding loans'], ['Outstanding Balance', 'Landmark', 3840000, compact, 'Total loan balance']].map(([k, ic, v, f, sub]) => {
      const el = h('div', 'cd stat', stats, `<div class="stat-top"><span>${k}</span><span class="stat-ic">${I(ic)}</span></div><div class="stat-v num"></div><div class="stat-s">${sub}</div>`);
      return { el, v, f, out: el.querySelector('.stat-v') };
    });
    const fees = h('div', 'cd cd-p', d.main, `<div class="row"><div class="grow"><div class="cd-t">Fees</div><div class="subs" style="margin-top:0">${s.term}</div></div><span class="mut row gap8" style="font-size:13px">Arrears ${I('ArrowRight', 'i14')}</span></div><div class="fees-4"><div><div class="xs mut">Billed</div><div class="fv num">₦55,400,000.00</div></div><div><div class="xs mut">Collected</div><div class="fv num" style="color:#16a34a">₦48,200,000.00 <span class="xs mut">87%</span></div></div><div><div class="xs mut">Outstanding</div><div class="fv num">₦7,200,000.00 <span class="xs mut">142 owing</span></div></div><div><div class="xs mut">Net this session</div><div class="fv num">₦16,800,000.00</div></div></div>`);
    fees.style.marginTop = '24px';
    const school = h('div', 'cd cd-p', d.main, `<div class="row"><div class="grow"><div class="cd-t">The school</div><div class="subs" style="margin-top:0">Who is here, and who is coming.</div></div><span class="mut row gap8" style="font-size:13px">Pupils ${I('ArrowRight', 'i14')}</span></div><div class="school-3"><div class="row gap12">${I('GraduationCap', 'i20')}<div><div class="b7 num" style="font-size:24px">612</div><div class="xs mut">on the roll</div></div></div><div class="row gap12">${I('School', 'i20')}<div><div class="b7 num" style="font-size:24px">24</div><div class="xs mut">classes</div></div></div><div class="row gap12">${I('ClipboardList', 'i20')}<div><div class="b7 num" style="font-size:24px">9</div><div class="xs mut">applications waiting</div></div></div></div>`);
    school.style.marginTop = '24px';

    const mark = place(h('div', 'wordmark', root, F.brand.product), { y: 300 });
    mark.style.fontSize = '200px';
    const tag = place(h('div', 'wordmark', root, F.brand.tagline), { y: 560 });
    tag.style.cssText += 'font-size:58px;font-weight:600;letter-spacing:-0.03em;color:var(--t-inkMuted)';
    const cta = place(h('div', 'cta', root, `${F.brand.cta}<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`), { y: 700 });
    const url = F.brand.ctaUrl ? place(h('div', 'cta-url', root, F.brand.ctaUrl), { y: 820 }) : null;

    return (lt) => {
      const out = ease.inCubic(prog(lt, 2.2, 0.45));
      set(d.win, { o: ease.outCubic(prog(lt, 0, 0.3)) * (1 - out), s: lerp(1.06, 1, ease.outQuint(prog(lt, 0, 0.8))) * lerp(1, 0.86, out), blur: 10 * out });
      [...waits.children].forEach((c, i) => A.rise(c, lt, 0.15 + i * 0.08, { dy: 12 }));
      sv.forEach((x, i) => {
        A.rise(x.el, lt, 0.35 + i * 0.08, { dy: 12 });
        x.out.textContent = x.f(count(lt, 0.4, 1.2, 0, x.v));
      });
      A.rise(fees, lt, 0.7, { dy: 12 });
      A.rise(school, lt, 0.8, { dy: 12 });
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
