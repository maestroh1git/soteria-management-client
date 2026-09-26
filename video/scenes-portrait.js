/*
 * Compositions made for the 9:16 cut.
 *
 * A 1440-wide page shrunk to a phone-width frame is too small to read, so
 * here the pieces that matter are lifted out of the app and shown large: the
 * same components, styles and words as the real screens (app.css), arranged
 * for a tall frame. What is invented is the arrangement, never the feature:
 * every card shows something the product does.
 *
 * Scenes without an entry here (the hook, the register) use scenes.js.
 */
(function () {
  const { h, place, set, A, ease, prog, count, typed, clamp, lerp } = E;
  const { I, naira2, plain2, compact, captions, phone, phoneApp, tapper, toast } = window.KIT;

  /** A block of app UI drawn at `z`× its real size, at (x, y) on the stage, `w` wide. */
  function xl(parent, { x, y, w, z = 2 }) {
    const box = place(h('div', 'xl', parent), { x, y, w });
    const app = h('div', 'app xl-app', box);
    app.style.zoom = z;
    app.style.width = w / z + 'px';
    return { box, app };
  }

  /** Centre of `el` in `root`'s own coordinates, whatever zoom or transforms sit between. */
  function local(el, root) {
    const r = el.getBoundingClientRect(), R = root.getBoundingClientRect();
    const k = R.width / root.offsetWidth || 1;
    return { x: (r.left + r.width / 2 - R.left) / k, y: (r.top + r.height / 2 - R.top) / k };
  }

  /* ── The gate: the three collectors, large ─────────────────────── */

  function gate(root, sc, F) {
    const caps = captions(root, sc);
    const { box, app } = xl(root, { x: 70, y: 700, w: 940, z: 2.1 });
    const pupil = h('div', 'cd pg-pupil', app, `<div class="b6" style="font-size:18px">Obi, Chiamaka</div><div class="xs mut">JSS1 Blue · GFC/2024/0117</div><div class="row gap8" style="margin-top:10px"><span class="mut xs">Why are they leaving?</span><span class="inp" style="height:28px;font-size:12px;width:130px">Appointment<span class="chev">${I('ChevronDown')}</span></span></div>`);
    const label = h('div', 'caps-l', app, 'Who is collecting them?');
    label.style.margin = '14px 2px 8px';
    const row = (name, sub, barred) => h('div', 'cd pg-opt' + (barred ? ' barred' : ''), app, `<span class="radio"></span><div class="grow"><div>${name}</div><div class="xs ${barred ? 'red' : 'mut'}">${sub}</div></div><span class="pg-lock">${barred ? I('Lock') : ''}</span>`);
    const mum = row('Mrs Ngozi Obi', 'mother · primary contact');
    const dad = row('Mr Emeka Obi', 'father');
    const uncle = row('Mr Chidi Okafor', 'Not permitted to collect this pupil', true);
    const go = h('div', 'btn-a lg pg-go', app);
    const moved = h('div', 'cd pg-moved', app, `<div class="caps-l" style="margin-bottom:6px">Today's movements</div><div>Obi, Chiamaka</div><div class="xs mut">Left 12:15 PM with Mrs Ngozi Obi</div>`);
    const signed = toast(root, 'Signed out');
    signed.style.cssText += 'left:50%;right:auto;margin-left:-178px;top:1650px;width:356px;font-size:15px';
    const tap = tapper(root);

    return (lt) => {
      caps(lt);
      A.slide(pupil, lt, 0.1, { dy: 40, dur: 0.5 });
      A.rise(label, lt, 0.4, { dy: 10 });
      [mum, dad, uncle].forEach((r, i) => A.slide(r, lt, 0.5 + i * 0.12, { dy: 40, dur: 0.5 }));
      const who = lt >= 3.4 ? mum : lt >= 1.6 ? uncle : null;
      [mum, dad, uncle].forEach((r) => {
        r.querySelector('.radio').classList.toggle('on', r === who);
        r.classList.toggle('sel', r === who);
      });
      // The barred adult refuses: a shake, and the button turns into an override.
      if (lt > 1.6 && lt < 2.0) uncle.style.transform = `translateX(${Math.sin((lt - 1.6) * 60) * 6 * (1 - prog(lt, 1.6, 0.4))}px)`;
      go.className = 'btn-a lg pg-go' + (who === uncle ? ' danger' : who ? '' : ' dis');
      go.innerHTML = `${I('LogOut')}${who === uncle ? 'Release to Mr Chidi Okafor…' : 'Sign out'}`;
      if (lt < 1.0) set(go, { o: 0 });
      else if (who === uncle) A.pop(go, lt, 1.6, { from: 0.85, dur: 0.35 });
      else set(go, { o: 1, s: lt >= 4.2 && lt < 4.35 ? 0.95 : 1 });
      A.slide(moved, lt, 4.6, { dy: 30, dur: 0.5 });
      if (lt < 6.8) A.slide(signed, lt, 4.4, { dy: 20, dur: 0.4 });
      else set(signed, { o: 1 - prog(lt, 6.8, 0.3) });
      const pu = local(uncle, root), pm = local(mum, root), pg = local(go, root);
      tap(lt, [[1.5, pu.x - 250, pu.y], [3.3, pm.x - 250, pm.y], [4.1, pg.x, pg.y]]);
      void box;
    };
  }

  /* ── The bill: the PDF carries the link, the phone opens it ────── */

  function invoice(root, sc, F) {
    const s = F.story;
    const bal = s.feeTotal - s.feePaid;
    const caps = captions(root, sc);
    const lines = [['Tuition', 150000], ['Development levy', 15000], ['Books and materials', 12000], ['Sports and clubs', 8000]];
    // The invoice as a document (invoicePdf prints the bill's own link on it).
    const sheet = place(h('div', 'pdf', root), { x: 150, y: 720 });
    sheet.innerHTML = `<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="pdf-org"><span class="sb-logo" style="width:40px;height:40px;font-size:20px">G</span>${s.school}</div></div><div style="text-align:right"><div class="pdf-t">INVOICE</div><div class="pdf-mut">INV-2026-0413</div></div></div>
      <div class="pdf-to"><div class="pdf-mut">Billed for</div><b>${s.pupil}</b> · ${s.pupilClass}<br>${s.term}</div>
      ${lines.map(([k, v]) => `<div class="pdf-l"><span>${k}</span><span>${naira2(v)}</span></div>`).join('')}
      <div class="pdf-l tot"><span>Total</span><span>${naira2(s.feeTotal)}</span></div>
      <div class="pdf-link">View this bill online<br><u>greenfield.soteria.app/invoice/7fk2Q…</u></div>`;
    const link = sheet.querySelector('.pdf-link');

    const ph = phone(root, { x: 296, y: 700, scale: 1.18, time: '14:00' });
    const chat = h('div', 'chat', ph.content, `<div class="chat-h"><span class="sb-logo" style="width:32px;height:32px;border-radius:50%;font-size:13px">G</span><div><div class="b6">${s.school}</div><div class="xs mut">Bursary</div></div></div><div class="chat-body"></div>`);
    const msg = h('div', 'bubble', chat.querySelector('.chat-body'), `<div class="att">${I('FileText', 'i20')}<div><div class="b5">invoice-INV-2026-0413.pdf</div><div class="xs mut">PDF · 1 page</div></div></div><div style="margin-top:8px">Good afternoon Ma. ${s.pupil.split(' ')[0]}'s First Term bill. You can also open it here:</div><div class="link">greenfield.soteria.app/invoice/7fk2Q…</div><div class="xs mut r" style="margin-top:4px">2:00 PM</div>`);
    const chatLink = msg.querySelector('.link');
    const pub = h('div', 'pub', ph.content);
    pub.innerHTML = `<div class="phone-url" style="margin:-58px -32px 22px">${I('Lock', 'i14')}greenfield.soteria.app/invoice/7fk2Q…</div>
      <div style="text-align:center"><div class="b7" style="font-size:20px;line-height:28px">${s.school}</div><div class="mut">Invoice INV-2026-0413 · ${s.term}</div></div>
      <div class="cd due"><div class="mut">Still to pay</div><div class="due-v num">₦0.00</div><div class="mut">Due Sep 30, 2026</div></div>
      <div class="cd pub-card"><div class="b6" style="font-size:16px">${s.pupil}</div><div class="mut" style="margin:6px 0 18px">${s.pupilClass} · GFC/2025/0339</div>${lines.map(([k, v]) => `<div class="pl"><span>${k}</span><span class="num">${naira2(v)}</span></div>`).join('')}<div class="pl tot"><span>Total</span><span class="num b7">${naira2(s.feeTotal)}</span></div><div class="pl mut" style="border:none"><span>Paid so far</span><span class="num">– ${naira2(s.feePaid)}</span></div></div>`;
    const due = pub.querySelector('.due'), dueV = pub.querySelector('.due-v');
    const tap = tapper(ph.screen);

    return (lt) => {
      caps(lt);
      // The sheet arrives, its link lights up, then it folds away into the chat.
      if (lt < 2.9) A.slide(sheet, lt, 0.1, { dy: 80, dur: 0.6, s: 0.92 });
      else {
        const k = ease.inCubic(prog(lt, 2.9, 0.45));
        set(sheet, { o: 1 - k, x: 40 * k, y: 260 * k, s: lerp(1, 0.35, k), r: -4 * k });
      }
      sheet.style.transform += ' rotate(-2deg)';
      link.classList.toggle('lit', lt >= 1.3);
      A.slide(ph.el, lt, 3.1, { dy: 200, dur: 0.6 });
      A.slide(msg, lt, 3.55, { dy: 20, dur: 0.4, s: 0.96 });
      const lc = E.centre(chatLink, ph.screen);
      tap(lt, [[4.1, lc.x, lc.y]]);
      pub.style.transform = `translateY(${(1 - ease.outQuint(prog(lt, 4.25, 0.45))) * 800}px)`;
      dueV.style.opacity = lt >= 4.6 ? 1 : 0;
      dueV.textContent = naira2(Math.round(count(lt, 4.6, 0.8, 0, bal, ease.outExpo)));
      due.classList.toggle('ring', lt >= 7.0);
    };
  }

  /* ── The ledger: a receipt becomes both sides of an entry ──────── */

  function ledger(root, sc, F) {
    const s = F.story;
    const bal = s.feeTotal - s.feePaid;
    const caps = captions(root, sc);
    const { app } = xl(root, { x: 70, y: 700, w: 940, z: 2 });
    const receipt = h('div', 'cd pl-card', app, `<div class="row"><span class="grow"><span class="b6">RCT-2026-0391</span><br><span class="xs mut">Adeyemi, Tobi · Bank transfer · GTB-2409-5521</span></span><span class="b7 num" style="font-size:18px">${naira2(bal)}</span></div>`);
    const entry = h('div', 'cd pl-card', app, `<div class="b6">Fee payment RCT-2026-0391 — Adeyemi, Tobi</div><div class="xs mut" style="margin-bottom:10px">Sep 24, 2026 · Fee payment</div><div class="jl th"><span>Account</span><span class="r">Debit</span><span class="r">Credit</span></div>`);
    const l1 = h('div', 'jl', entry, `<span><span class="xs mut">BANK</span> GTBank — operating</span><span class="r num">${plain2(bal)}</span><span></span>`);
    const l2 = h('div', 'jl', entry, `<span><span class="xs mut">FEES_RECEIVABLE</span> Fees receivable</span><span></span><span class="r num">${plain2(bal)}</span>`);
    const books = h('div', 'cd pl-card books', app, `<div class="row gap8 b6" style="font-size:17px">${I('CircleCheck', 'i20')}The books balance</div><div class="subs">Debits equal credits, as of today.</div><div class="books-3" style="margin-top:14px"><div><div class="xs mut">TOTAL DEBITS</div><div class="bv num"></div></div><div><div class="xs mut">TOTAL CREDITS</div><div class="bv num"></div></div><div><div class="xs mut">DIFFERENCE</div><div class="bv num">₦0.00</div></div></div>`);
    const [dv, cv] = books.querySelectorAll('.bv');
    const paid = h('div', 'cd pl-card pl-paid', app, `${I('CircleCheck', 'i20')}<div><div class="b6" style="color:#16a34a;font-size:16px">Paid in full</div><div class="xs mut">Thank you. Nothing is outstanding on this bill.</div></div>`);

    return (lt) => {
      caps(lt);
      A.slide(receipt, lt, 0.1, { dy: -40, dur: 0.5 });
      A.slide(entry, lt, 0.9, { dy: 40, dur: 0.5 });
      A.rise(l1, lt, 1.3, { dy: 8 });
      A.rise(l2, lt, 1.6, { dy: 8 });
      A.slide(books, lt, 2.4, { dy: 40, dur: 0.5 });
      const tot = 74943400 + bal * ease.outCubic(prog(lt, 2.6, 0.8));
      dv.textContent = naira2(tot).replace('.00', '');
      cv.textContent = dv.textContent;
      A.slide(paid, lt, 4.2, { dy: 40, dur: 0.5 });
    };
  }

  /* ── End card: the owner's home, on a phone ────────────────────── */

  function end(root, sc, F) {
    const s = F.story;
    const ph = phone(root, { x: 296, y: 240, scale: 1.18, time: '14:30' });
    const { main } = phoneApp(ph.content, 'AB');
    h('div', '', main, `<div class="h1">Good afternoon, Adebayo</div><div class="lead">${s.school} · Thursday 24 September</div>`);
    const stats = [
      ['Fees collected this term', 'HandCoins', 48200000, compact, '87% of ₦55.4M billed'],
      ['Outstanding', 'Receipt', 7200000, compact, '142 pupils owing'],
      ['Attendance today', 'UserCheck', 94, (v) => Math.round(v) + '%', '575 of 612 in school'],
      ['Payroll · Sep', 'Calculator', s.payrollTotal + 2640000, compact, 'Gross, approved'],
    ].map(([k, ic, v, f, sub]) => {
      const el = h('div', 'cd own-stat', main, `<div class="row" style="justify-content:space-between;align-items:flex-start"><span class="own-t" style="min-height:0">${k}</span><span class="own-ic">${I(ic, 'i20')}</span></div><div class="stat-v num" style="margin-top:4px"></div><div class="stat-s">${sub}</div>`);
      el.style.cssText += 'margin-top:14px;padding:18px 20px';
      return { el, v, f, out: el.querySelector('.stat-v') };
    });
    const wait = h('div', 'cd own-wait', main, `<div class="cd-t" style="padding:16px 20px 10px">Waiting on you</div>${[['Inbox', '2 decisions waiting on you'], ['ClipboardCheck', '3 registers not taken today'], ['Receipt', '14 invoices overdue']].map(([ic, t]) => `<div class="own-row"><span style="color:#d97706">${I(ic)}</span><div class="grow">${t}</div><span class="mut">${I('ArrowRight')}</span></div>`).join('')}`);
    wait.style.marginTop = '14px';

    const mark = place(h('div', 'wordmark', root, F.brand.product), { y: 600 });
    mark.style.fontSize = '190px';
    const tag = place(h('div', 'wordmark', root, F.brand.tagline), { y: 860 });
    tag.style.cssText += 'font-size:54px;font-weight:600;letter-spacing:-0.03em;color:var(--t-inkMuted)';
    const cta = place(h('div', 'cta', root, `${F.brand.cta}<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`), { y: 1010 });

    return (lt) => {
      const out = ease.inCubic(prog(lt, 2.2, 0.45));
      set(ph.el, { o: ease.outCubic(prog(lt, 0, 0.3)) * (1 - out), y: lerp(60, 0, ease.outQuint(prog(lt, 0, 0.7))), s: lerp(1, 0.9, out), blur: 10 * out });
      stats.forEach((x, i) => {
        A.rise(x.el, lt, 0.15 + i * 0.07, { dy: 12 });
        x.out.textContent = x.f(count(lt, 0.3, 1.1, 0, x.v));
      });
      A.rise(wait, lt, 0.5, { dy: 12 });
      main.style.transform = `translateY(${-230 * ease.inOutCubic(prog(lt, 1.0, 1.1))}px)`;
      A.slam(mark, lt, 2.5, { from: 1.25, dur: 0.3 });
      A.rise(tag, lt, 3.0, { dy: 24 });
      if (lt < 3.5) set(cta, { o: 0 });
      else {
        const k = prog(lt, 3.5, 0.45);
        cta.style.opacity = clamp(k * 3);
        cta.style.transform = `translateX(-50%) scale(${lerp(0.7, 1, ease.outBack(k))})`;
      }
    };
  }

  window.SCENES_PORTRAIT = { gate, invoice, ledger, end };
})();
