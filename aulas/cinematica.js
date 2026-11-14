aulasMM.aulas['cinematica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  let vivo = true;
  const tela = $('tela'), c = tela.getContext('2d');
  const W = 400, H = 180, PISTA = 128, MARGEM = 30, T_MAX = 10;
  const calmo = aulasMM.calmo;
  const br = (n, casas = 0) => n.toFixed(casas).replace('.', ',');
  const est = { v0: 10, a: 0, t: 0, fim: T_MAX, L: 100, vMax: 10 };

  // Movimento: a velocidade nunca fica negativa (o carro para, não dá ré).
  const tParada = () => est.a < 0 ? est.v0 / -est.a : Infinity;
  const vel = t => Math.max(0, est.v0 + est.a * Math.min(t, tParada()));
  const pos = t => { const u = Math.min(t, tParada()); return est.v0 * u + est.a * u * u / 2; };
  const redondo = x => { const p = Math.pow(10, Math.floor(Math.log10(x))); const m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };

  function preparar() {
    est.v0 = Number($('v0').value); est.a = Number($('ac').value);
    $('o-v0').textContent = est.v0 + ' m/s'; $('o-ac').textContent = br(est.a, est.a % 1 ? 1 : 0) + ' m/s²';
    est.fim = Math.min(T_MAX, tParada());
    est.L = redondo(Math.max(20, pos(T_MAX)));
    est.vMax = redondo(Math.max(5, est.v0, vel(T_MAX)));
    est.t = calmo ? T_MAX : 0;
    $('s-max').textContent = est.L; $('v-max').textContent = est.vMax;
    $('s-prev').setAttribute('d', caminho(pos, est.L, T_MAX));
    $('v-prev').setAttribute('d', caminho(vel, est.vMax, T_MAX));
  }

  // ---------- gráficos ----------
  const GX = t => 26 + t / T_MAX * 138, GY = (y, max) => 98 - y / max * 88;
  function caminho(f, max, ate) {
    let d = '';
    for (let i = 0; i <= 60; i++) { const t = ate * i / 60; d += `${i ? 'L' : 'M'}${GX(t).toFixed(1)} ${GY(f(t), max).toFixed(1)} `; }
    return d;
  }
  function graficos() {
    const t = est.t;
    $('s-feito').setAttribute('d', caminho(pos, est.L, t));
    const dv = caminho(vel, est.vMax, t);
    $('v-feito').setAttribute('d', dv);
    $('v-area').setAttribute('d', `${dv}L${GX(t).toFixed(1)} 98 L26 98 Z`);
    $('s-ponto').setAttribute('cx', GX(t)); $('s-ponto').setAttribute('cy', GY(pos(t), est.L));
    $('v-ponto').setAttribute('cx', GX(t)); $('v-ponto').setAttribute('cy', GY(vel(t), est.vMax));
  }

  // ---------- cena ----------
  function ajustar() {
    const r = tela.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    tela.width = Math.round(r.width * d); tela.height = Math.round(r.width * 0.45 * d);
    c.setTransform(tela.width / W, 0, 0, tela.height / H, 0, 0);
  }
  const PX = s => MARGEM + s / est.L * (W - 2 * MARGEM);
  function desenhar() {
    const ceu = c.createLinearGradient(0, 0, 0, PISTA);
    ceu.addColorStop(0, '#7fbdea'); ceu.addColorStop(1, '#dcedf8');
    c.fillStyle = ceu; c.fillRect(0, 0, W, PISTA);
    c.fillStyle = '#8fb873'; c.fillRect(0, PISTA - 22, W, 22);
    c.fillStyle = '#4a4d55'; c.fillRect(0, PISTA - 8, W, 30);
    c.strokeStyle = '#e9e4d2'; c.lineWidth = 1.5; c.setLineDash([10, 9]);
    c.beginPath(); c.moveTo(0, PISTA + 8); c.lineTo(W, PISTA + 8); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#efe9da'; c.fillRect(0, PISTA + 22, W, H - PISTA - 22);

    // régua em metros
    c.fillStyle = '#3b382f'; c.strokeStyle = '#3b382f'; c.lineWidth = 1; c.font = '600 9px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
    for (let i = 0; i <= 5; i++) {
      const s = est.L * i / 5, x = PX(s);
      c.beginPath(); c.moveTo(x, PISTA + 22); c.lineTo(x, PISTA + 29); c.stroke();
      c.fillText(br(s, est.L < 50 && s % 1 ? 1 : 0) + ' m', x, PISTA + 32);
    }

    // marcas a cada segundo
    c.textBaseline = 'bottom'; c.font = '600 8px Inter, sans-serif';
    for (let n = 0; n <= Math.floor(Math.min(est.t, est.fim) + 1e-6); n++) {
      const x = PX(pos(n));
      c.fillStyle = '#c8a96e'; c.beginPath(); c.arc(x, PISTA - 14, 3.2, 0, 7); c.fill();
      c.fillStyle = '#2b2a26'; c.fillText(n + ' s', x, PISTA - 19);
    }

    // carro
    const x = PX(pos(est.t)), y = PISTA + 2;
    c.fillStyle = '#c0392b';
    c.beginPath(); c.roundRect(x - 26, y - 14, 34, 12, 4); c.fill();
    c.beginPath(); c.roundRect(x - 19, y - 22, 19, 10, 4); c.fill();
    c.fillStyle = '#d6ecf7'; c.fillRect(x - 16, y - 20, 13, 6);
    c.fillStyle = '#1c1c1f';
    for (const dx of [-18, 0]) { c.beginPath(); c.arc(x + dx, y - 1, 4.5, 0, 7); c.fill(); }
    if (vel(est.t) > 0.2 && est.a < 0) { c.fillStyle = '#ff5a4a'; c.fillRect(x - 28, y - 12, 3, 4); } // luz de freio
  }

  // ---------- painel ----------
  let ultimo = '';
  function leituras() {
    const t = est.t, v = vel(t), s = pos(t);
    $('l-t').textContent = br(t, 1) + ' s';
    $('l-s').textContent = br(s, s < 100 ? 1 : 0) + ' m';
    $('l-v').textContent = br(v, 1) + ' m/s';
    $('l-kmh').textContent = br(v * 3.6) + ' km/h';
    $('l-area').textContent = br(s, s < 100 ? 1 : 0) + ' m';
    let r;
    if (est.v0 === 0 && est.a <= 0) r = '🅿️ Parado: sem velocidade inicial nem aceleração para frente, o carro não sai do lugar.';
    else if (est.a === 0) r = `➡️ Movimento uniforme: ${est.v0} m a cada segundo, sempre. As marcas ficam igualmente espaçadas.`;
    else if (est.a > 0) r = `⏩ Acelerando: a velocidade aumenta ${br(est.a, est.a % 1 ? 1 : 0)} m/s a cada segundo. As marcas se afastam.`;
    else if (t >= est.fim && est.fim < T_MAX) r = `🛑 Parou em ${br(est.fim, 1)} s, depois de ${br(pos(est.fim), 1)} m de frenagem.`;
    else r = `⏪ Freando: a velocidade cai ${br(-est.a, est.a % 1 ? 1 : 0)} m/s a cada segundo. As marcas se aproximam.`;
    if (r !== ultimo) $('recado').textContent = ultimo = r;
  }

  let antes = 0;
  function quadro(agora) {
    if (!vivo) return;
    const dt = Math.min(0.05, (agora - antes) / 1000 || 0); antes = agora;
    if (est.t < T_MAX) est.t = Math.min(T_MAX, est.t + dt * 1.6); // um pouco mais rápido que o tempo real
    desenhar(); graficos(); leituras();
    requestAnimationFrame(quadro);
  }

  for (const k of ['v0', 'ac']) $(k).addEventListener('input', preparar);
  raiz.querySelectorAll('[data-cena]').forEach(b => b.addEventListener('click', () => {
    const [v, a] = b.dataset.cena.split(','); $('v0').value = v; $('ac').value = a; preparar();
  }));
  $('repetir').addEventListener('click', () => { est.t = 0; });

  addEventListener('resize', ajustar);
  ajustar(); preparar(); requestAnimationFrame(quadro);
  return () => { vivo = false; removeEventListener('resize', ajustar); };
};
