(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* navbar becomes tighter after scroll */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* reveal on scroll */
  $$('.pains article, .feat article, .pay article, .trio div, .slogan, .city-card, .chal details, .phases button, .grid81-wrap')
    .forEach(el => el.classList.add('rv'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });

  /* card tilt on pointer */
  const card = $('#ycard');
  const stage = $('.card-stage');
  if (card && !reduce && matchMedia('(hover:hover)').matches) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `rotateY(${x * 26}deg) rotateX(${-y * 20}deg) rotateZ(-3deg)`;
    });
    stage.addEventListener('pointerleave', () => card.style.transform = '');
  }

  /* how a tap works: auto stepper + offline switch */
  const steps = $$('#steps li'), flow = $$('#vFlow i');
  const vState = $('#vState'), vLine = $('#vLine'), vNote = $('#vNote'), validator = $('#validator'), off = $('#offlineToggle');
  const copy = [
    ['Ready', 'Hold your card here'],
    ['Verifying…', 'Card detected · checking signature'],
    ['Charging…', 'Fare for this city and mode'],
    ['Gate open', 'Balance updated · have a good trip'],
  ];
  const copyOff = [
    ['Ready', 'Hold your card here'],
    ['Verifying…', 'Checked on the device itself'],
    ['Charging…', 'Fare stored securely on validator'],
    ['Gate open', 'Will sync when internet returns'],
  ];
  let cur = 0, timer;
  function show(i) {
    cur = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    flow.forEach((f, k) => f.classList.toggle('on', k <= i));
    const c = (off.checked ? copyOff : copy)[i];
    vState.textContent = c[0]; vLine.textContent = c[1];
    validator.classList.remove('run'); void validator.offsetWidth; validator.classList.add('run');
  }
  const tick = () => show((cur + 1) % 4);
  const start = () => { clearInterval(timer); if (!reduce) timer = setInterval(tick, 1800); };
  steps.forEach((s, i) => s.addEventListener('click', () => { show(i); start(); }));
  off.addEventListener('change', () => {
    vNote.textContent = off.checked
      ? 'Offline: validators store trips securely, then send them to the central system when the connection returns.'
      : 'Online: the central system is updated instantly.';
    show(cur);
  });
  show(0); start();

  /* journey */
  const cities = [
    { n: 'Ankara', m: 'Metro · Ankaray · Bus', t: 'The capital since 1923. Visit Anıtkabir in the morning, Hamamönü in the afternoon and Atakule in the evening, all on one card.', see: 'Anıtkabir, Hamamönü, Ankara Castle', taste: 'Ankara tava, Beypazarı kurusu', bal: '₺ 200,00 · full balance' },
    { n: 'Eskişehir', m: 'Tram · Bus', t: 'A student city with cafés and river views. Travel from Ankara and keep using your existing card on trams and buses.', see: 'Odunpazarı, Porsuk River, Sazova Park', taste: 'Çibörek, met helvası', bal: '₺ 170,50 · same card' },
    { n: 'İstanbul', m: 'Metro · Tram · Bus · Ferry', t: 'Four transport types, one card. The city keeps its ferry system, OmniPass simply connects it.', see: 'Hagia Sophia, Blue Mosque, Galata Tower', taste: 'Simit, balık ekmek', bal: '₺ 131,00 · same card' },
    { n: 'İzmir', m: 'Metro · Tram · Bus · Ferry', t: 'A seaside atmosphere on the Aegean coast. Move around the whole city without buying a local card.', see: 'Clock Tower, Kemeraltı Bazaar, Kordon', taste: 'Boyoz, kumru', bal: '₺ 92,25 · same card' },
    { n: 'Antalya', m: 'Tram · Bus', t: 'One of the most popular tourist destinations. First-time visitors can use the same card for their whole stay.', see: 'Kaleiçi, Hadrian’s Gate, Düden Waterfalls, Konyaaltı Beach', taste: 'Mediterranean coast food', bal: '₺ 58,00 · same card' },
  ];
  const stops = $$('#route .stop');
  function city(i) {
    const c = cities[i];
    stops.forEach((s, k) => { s.classList.toggle('on', k === i); s.setAttribute('aria-selected', k === i); });
    $('#cdModes').textContent = c.m; $('#cdTitle').textContent = c.n; $('#cdText').textContent = c.t;
    $('#cdSee').textContent = c.see; $('#cdTaste').textContent = c.taste; $('#cdBal').textContent = c.bal;
  }
  stops.forEach((s, i) => s.addEventListener('click', () => city(i)));
  city(0);

  /* roadmap: 81 plates */
  const grid = $('#grid81'), count = $('#gridCount');
  const P1 = [6, 26], P2 = [6, 26, 34, 35, 7];
  const cells = [];
  for (let n = 1; n <= 81; n++) {
    const s = document.createElement('span'); s.textContent = String(n).padStart(2, '0'); grid.appendChild(s); cells[n] = s;
  }
  function phase(p) {
    $$('#phases button').forEach(b => { const on = +b.dataset.p === p; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    const active = p === 1 ? P1 : p === 2 ? P2 : null;
    cells.forEach((el, k) => {
      if (!el) return;
      const on = active ? active.includes(k) : true;
      setTimeout(() => {
        el.classList.toggle('on', on);
        el.classList.toggle('hero-c', on && P2.includes(k));
        el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 220);
      }, reduce ? 0 : (p === 3 ? k * 12 : 0));
    });
    count.textContent = p === 1 ? 2 : p === 2 ? 5 : 81;
  }
  $$('#phases button').forEach(b => b.addEventListener('click', () => phase(+b.dataset.p)));
  phase(1);
})();
