/* Tap & Go — cross five cities with one OmniPass card.
   Tap when the needle is inside the orange zone. */
(() => {
  const $ = s => document.querySelector(s);
  const LEGS = [
    { city: 'Ankara',    plate: '06', mode: 'Metro',   fare: 20, offline: true  },
    { city: 'Ankara',    plate: '06', mode: 'Ankaray', fare: 18 },
    { city: 'Eskişehir', plate: '26', mode: 'Tram',    fare: 15 },
    { city: 'Eskişehir', plate: '26', mode: 'Bus',     fare: 15 },
    { city: 'İstanbul',  plate: '34', mode: 'Metro',   fare: 22 },
    { city: 'İstanbul',  plate: '34', mode: 'Ferry',   fare: 28, offline: true },
    { city: 'İzmir',     plate: '35', mode: 'Metro',   fare: 18, offline: true },
    { city: 'İzmir',     plate: '35', mode: 'Ferry',   fare: 24 },
    { city: 'Antalya',   plate: '07', mode: 'Tram',    fare: 16 },
    { city: 'Antalya',   plate: '07', mode: 'Bus',     fare: 16 },
  ];
  const START_BAL = 250;
  const CITIES = [...new Set(LEGS.map(l => l.plate))];

  const el = {
    screens: { intro: $('#gIntro'), play: $('#gPlay'), end: $('#gEnd') },
    route: $('#gRoute'), bal: $('#gBal'), time: $('#gTime'), combo: $('#gCombo'),
    plate: $('#gPlate'), city: $('#gCity'), mode: $('#gMode'), offline: $('#gOffline'),
    reader: $('#gReader'), track: $('#gTrack'), zone: $('#gZone'), needle: $('#gNeedle'), msg: $('#gMsg'),
    best: $('#gBest'),
  };

  let leg, balance, misses, combo, bonus, running, t0, legStart, center, width, speed, raf, penalty, locked;

  /* best score (per-viewer convenience only) */
  const readBest = () => { try { return +localStorage.getItem('omnipass-best') || 0; } catch { return 0; } };
  const writeBest = v => { try { localStorage.setItem('omnipass-best', v); } catch {} };
  const showBest = () => { const b = readBest(); el.best.textContent = b ? b + ' points' : 'none yet'; };
  showBest();

  const screen = name => Object.entries(el.screens).forEach(([k, s]) => s.classList.toggle('on', k === name));

  function buildRoute() {
    el.route.innerHTML = '';
    CITIES.forEach((p, i) => {
      if (i) el.route.insertAdjacentHTML('beforeend', '<hr>');
      el.route.insertAdjacentHTML('beforeend', `<span class="plate" data-p="${p}"><b>TR</b><i>${p}</i></span>`);
    });
  }
  function paintRoute() {
    const cur = LEGS[leg] ? LEGS[leg].plate : null;
    const idx = CITIES.indexOf(cur);
    [...el.route.querySelectorAll('.plate')].forEach((n, i) => {
      n.classList.toggle('done', cur === null || i < idx);
      n.classList.toggle('now', i === idx);
    });
    [...el.route.querySelectorAll('hr')].forEach((h, i) => h.classList.toggle('done', cur === null || i < idx));
  }

  const money = v => '₺ ' + Math.round(v);
  const elapsed = () => (performance.now() - t0) / 1000 + penalty;

  function setMsg(text, kind) { el.msg.textContent = text; el.msg.className = 'g-msg ' + (kind || ''); }

  function setupLeg() {
    const L = LEGS[leg];
    el.plate.querySelector('i').textContent = L.plate;
    el.city.textContent = L.city; el.mode.textContent = L.mode + ' · fare ' + money(L.fare);
    el.offline.hidden = !L.offline;
    width = Math.max(.1, .24 - leg * .014);
    center = .22 + Math.random() * .56;
    speed = .75 + leg * .09;
    el.zone.style.left = (center - width / 2) * 100 + '%';
    el.zone.style.width = width * 100 + '%';
    el.zone.classList.toggle('hide-half', !!L.offline);
    legStart = performance.now();
    locked = false;
    setMsg(L.offline ? 'No signal here. Trust your timing.' : 'Tap when the needle is in the zone.');
    paintRoute();
  }

  const pos = () => {                      // triangle wave 0..1..0
    const x = ((performance.now() - legStart) / 1000 * speed) % 2;
    return x < 1 ? x : 2 - x;
  };

  function frame() {
    if (!running) return;
    el.needle.style.left = pos() * 100 + '%';
    el.time.textContent = elapsed().toFixed(1) + 's';
    raf = requestAnimationFrame(frame);
  }

  function flash(cls) {
    el.reader.classList.remove('ok', 'bad'); void el.reader.offsetWidth; el.reader.classList.add(cls);
  }

  function tap() {
    if (!running || locked) return;
    const p = pos(), d = Math.abs(p - center);
    if (d <= width / 2) {
      const perfect = d <= width * .18;
      combo = perfect ? combo + 1 : 1;
      if (perfect) bonus += 25 * Math.min(combo, 5);
      balance -= LEGS[leg].fare;
      el.bal.textContent = money(balance);
      el.combo.textContent = 'x' + Math.min(combo, 5);
      setMsg(perfect ? 'Perfect! Gate open.' : 'Gate open.', 'ok');
      flash('ok'); locked = true;
      leg++;
      setTimeout(() => {
        if (!running) return;
        if (leg >= LEGS.length) return finish();
        setupLeg();
      }, 480);
    } else {
      misses++; combo = 1; penalty += 1.5;
      el.combo.textContent = 'x1';
      setMsg(p < center ? 'Too early. Reader could not read the card.' : 'Too late. Try again.', 'bad');
      flash('bad');
    }
  }

  function start() {
    leg = 0; balance = START_BAL; misses = 0; combo = 1; bonus = 0; penalty = 0;
    el.bal.textContent = money(balance); el.combo.textContent = 'x1'; el.time.textContent = '0.0s';
    buildRoute(); screen('play'); setMsg('Get ready…'); locked = true;
    running = true; t0 = performance.now();
    setupLeg(); locked = true;
    // 3-2-1 ready beat so the first tap is fair
    let n = 3; setMsg('Ready… 3');
    const iv = setInterval(() => {
      n--; if (n > 0) { setMsg('Ready… ' + n); return; }
      clearInterval(iv); t0 = performance.now(); legStart = performance.now(); locked = false;
      setMsg('Go! Tap in the orange zone.');
    }, 600);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }

  function finish() {
    running = false; cancelAnimationFrame(raf); paintRoute();
    const secs = elapsed();
    const score = Math.max(0, Math.round(1000 + bonus - secs * 14 - misses * 70));
    const rank = score >= 1300 ? 'Platinum Pass' : score >= 1000 ? 'Gold Pass' : score >= 700 ? 'Silver Pass' : 'Rookie Traveller';
    $('#gRank').textContent = rank;
    $('#gScore').textContent = score;
    $('#gEndTime').textContent = secs.toFixed(1) + 's';
    $('#gEndMiss').textContent = misses;
    $('#gEndBal').textContent = money(balance);
    if (score > readBest()) writeBest(score);
    showBest();
    screen('end');
  }

  $('#gStart').addEventListener('click', start);
  $('#gAgain').addEventListener('click', start);
  $('#gTap').addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  el.reader.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });

  document.addEventListener('keydown', e => {
    if (!running || (e.code !== 'Space' && e.code !== 'Enter')) return;
    e.preventDefault(); if (!e.repeat) tap();
  });
  document.addEventListener('keyup', e => { if (running && e.code === 'Space') e.preventDefault(); });
  // keep keyboard users on the game button when it is focused
  $('#gTap').addEventListener('keydown', e => { if (running && (e.code === 'Space' || e.code === 'Enter')) e.preventDefault(); });
})();
