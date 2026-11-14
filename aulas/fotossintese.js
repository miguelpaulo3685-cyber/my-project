aulasMM.aulas['fotossintese'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  let vivo = true;
  const tela = $('tela'), c = tela.getContext('2d');
  const W = 400, H = 300, CHAO = 236, RAIZ_X = 200;
  const calmo = aulasMM.calmo;
  const RESPIRA = 20; // gasto constante da respiração

  const est = { luz: 70, agua: 70, co2: 60, tam: 0.08, murcha: 0, o2: 0, t: 0 };
  let particulas = [];

  // Cada ingrediente vira um número de 0 a 1; a fotossíntese segue o menor deles.
  const fLuz = l => (1 - Math.exp(-l / 40)) / (1 - Math.exp(-2.5));
  const fAgua = a => Math.min(1, a / 55);
  const fCo2 = g => (1 - Math.exp(-g / 30)) / (1 - Math.exp(-100 / 30));
  function conta(luz = est.luz) {
    const f = { luz: fLuz(luz), agua: fAgua(est.agua), co2: fCo2(est.co2) };
    const limitante = Object.keys(f).sort((a, b) => f[a] - f[b])[0];
    const bruta = 100 * f[limitante];
    return { bruta, saldo: bruta - RESPIRA, limitante, f };
  }

  // ---------- desenho ----------
  function ajustar() {
    const r = tela.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    tela.width = Math.round(r.width * d); tela.height = Math.round(r.width * 0.75 * d);
    c.setTransform(tela.width / W, 0, 0, tela.height / H, 0, 0);
  }
  const mistura = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const cor = (v, alfa = 1) => `rgba(${v[0]},${v[1]},${v[2]},${alfa})`;

  function folha(x, y, tamanho, lado, queda, verde) {
    c.save(); c.translate(x, y); c.rotate(lado * (-0.5 + queda * 1.25)); c.scale(lado, 1);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(tamanho * 0.5, -tamanho * 0.45, tamanho, 0);
    c.quadraticCurveTo(tamanho * 0.5, tamanho * 0.45, 0, 0);
    c.fillStyle = verde; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(tamanho * 0.9, 0); c.stroke();
    c.restore();
  }

  let pontasDasFolhas = [];
  function desenhar() {
    const k = est.luz / 100;
    // céu: de noite azul-escuro, de dia azul-claro
    const topo = mistura([14, 20, 44], [96, 176, 236], k), base = mistura([30, 36, 66], [206, 232, 248], k);
    const ceu = c.createLinearGradient(0, 0, 0, CHAO);
    ceu.addColorStop(0, cor(topo)); ceu.addColorStop(1, cor(base));
    c.fillStyle = ceu; c.fillRect(0, 0, W, CHAO);

    // sol (ou lua, sem luz)
    const sx = 330, sy = 52;
    if (k > 0.03) {
      const brilho = c.createRadialGradient(sx, sy, 6, sx, sy, 40 + 70 * k);
      brilho.addColorStop(0, `rgba(255,236,150,${0.5 + 0.4 * k})`); brilho.addColorStop(1, 'rgba(255,236,150,0)');
      c.fillStyle = brilho; c.fillRect(0, 0, W, CHAO);
      c.strokeStyle = `rgba(255,226,120,${0.55 * k})`; c.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 + est.t * 0.15;
        c.beginPath(); c.moveTo(sx + Math.cos(a) * 24, sy + Math.sin(a) * 24);
        c.lineTo(sx + Math.cos(a) * (30 + 16 * k), sy + Math.sin(a) * (30 + 16 * k)); c.stroke();
      }
      c.fillStyle = cor(mistura([240, 200, 110], [255, 214, 74], k));
      c.beginPath(); c.arc(sx, sy, 18, 0, 7); c.fill();
    } else {
      c.fillStyle = '#e8ebf5'; c.beginPath(); c.arc(sx, sy, 15, 0, 7); c.fill();
      c.fillStyle = cor(topo); c.beginPath(); c.arc(sx + 7, sy - 4, 13, 0, 7); c.fill();
    }

    // solo: mais escuro quanto mais molhado
    const terra = mistura([176, 138, 96], [84, 58, 40], est.agua / 100);
    c.fillStyle = cor(terra); c.fillRect(0, CHAO, W, H - CHAO);
    c.fillStyle = cor(mistura(terra, [0, 0, 0], 0.18)); c.fillRect(0, CHAO, W, 4);

    // raízes
    const g = est.tam;
    c.strokeStyle = 'rgba(236,222,196,.75)'; c.lineWidth = 1.6; c.lineCap = 'round';
    [[-1, 0.9], [1, 0.8], [-0.35, 1], [0.5, 0.95]].forEach(([dx, dy]) => {
      c.beginPath(); c.moveTo(RAIZ_X, CHAO);
      c.quadraticCurveTo(RAIZ_X + dx * 14 * (0.4 + g), CHAO + 14, RAIZ_X + dx * 46 * (0.3 + g), CHAO + dy * 52 * (0.35 + g * 0.65)); c.stroke();
    });

    // caule e folhas
    const altura = 18 + g * 172, inclina = est.murcha * 26;
    const topoX = RAIZ_X + inclina, topoY = CHAO - altura + est.murcha * altura * 0.12;
    const verde = cor(mistura([70, 168, 92], [148, 142, 78], est.murcha));
    c.strokeStyle = cor(mistura([58, 132, 70], [124, 120, 70], est.murcha)); c.lineWidth = 3 + g * 3;
    c.beginPath(); c.moveTo(RAIZ_X, CHAO); c.quadraticCurveTo(RAIZ_X - 6, CHAO - altura * 0.5, topoX, topoY); c.stroke();

    pontasDasFolhas = [];
    const pares = Math.max(1, Math.floor(altura / 30));
    for (let i = 0; i < pares; i++) {
      const u = (i + 1) / (pares + 0.6); // posição ao longo do caule
      const x = (1 - u) * (1 - u) * RAIZ_X + 2 * (1 - u) * u * (RAIZ_X - 6) + u * u * topoX;
      const y = (1 - u) * (1 - u) * CHAO + 2 * (1 - u) * u * (CHAO - altura * 0.5) + u * u * topoY;
      const tamanho = (14 + g * 30) * (1 - u * 0.35);
      const balanco = calmo ? 0 : Math.sin(est.t * 1.3 + i) * 0.04;
      folha(x, y, tamanho, -1, est.murcha + balanco, verde);
      folha(x, y, tamanho, 1, est.murcha - balanco, verde);
      pontasDasFolhas.push([x - tamanho * 0.6, y - 4], [x + tamanho * 0.6, y - 4]);
    }
    // broto no topo; flor quando a planta está grande e saudável
    folha(topoX, topoY, 10 + g * 14, 1, -0.6 + est.murcha, verde);
    if (g > 0.85 && est.murcha < 0.3) {
      const r = (g - 0.85) / 0.15 * 7;
      c.fillStyle = '#f6c8dc';
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.arc(topoX + Math.cos(a) * r, topoY - 8 + Math.sin(a) * r, r * 0.75, 0, 7); c.fill(); }
      c.fillStyle = '#f2b632'; c.beginPath(); c.arc(topoX, topoY - 8, r * 0.7, 0, 7); c.fill();
    }

    // partículas
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 7px Inter, sans-serif';
    for (const p of particulas) {
      const alfa = Math.min(1, p.vida * 2, (p.dura - p.vida) * 3);
      if (p.tipo === 'o2') { c.fillStyle = `rgba(214,240,255,${0.9 * alfa})`; c.strokeStyle = `rgba(60,130,200,${alfa})`; }
      else if (p.tipo === 'co2') { c.fillStyle = `rgba(92,96,108,${0.85 * alfa})`; c.strokeStyle = `rgba(255,255,255,${0.5 * alfa})`; }
      else { c.fillStyle = `rgba(92,172,240,${alfa})`; c.strokeStyle = 'rgba(0,0,0,0)'; }
      c.lineWidth = 1;
      c.beginPath(); c.arc(p.x, p.y, p.tipo === 'agua' ? 2.6 : 7.5, 0, 7); c.fill(); c.stroke();
      if (p.tipo !== 'agua') { c.fillStyle = p.tipo === 'o2' ? `rgba(20,70,130,${alfa})` : `rgba(255,255,255,${alfa})`; c.fillText(p.tipo === 'o2' ? 'O₂' : 'CO₂', p.x, p.y + 0.5); }
    }
  }

  // ---------- movimento ----------
  function nascer(dt, r) {
    const folhas = pontasDasFolhas;
    const sorteio = taxa => Math.random() < taxa * dt;
    if (folhas.length && sorteio(r.bruta / 100 * 5)) {
      const [x, y] = folhas[Math.floor(Math.random() * folhas.length)];
      particulas.push({ tipo: 'o2', x, y, vx: (Math.random() - 0.5) * 10, vy: -22 - Math.random() * 12, vida: 0, dura: 3.2 });
      est.o2++;
    }
    if (folhas.length && sorteio(est.co2 / 100 * 3.5)) {
      const [ax, ay] = folhas[Math.floor(Math.random() * folhas.length)];
      const x = Math.random() < 0.5 ? -8 : W + 8, y = 60 + Math.random() * 120, dura = 3;
      particulas.push({ tipo: 'co2', x, y, vx: (ax - x) / dura, vy: (ay - y) / dura, vida: 0, dura });
    }
    if (sorteio(est.agua / 100 * 6)) {
      const x = RAIZ_X + (Math.random() - 0.5) * 150, y = CHAO + 20 + Math.random() * 40, dura = 1.8;
      particulas.push({ tipo: 'agua', x, y, vx: (RAIZ_X - x) / dura, vy: (CHAO + 4 - y) / dura, vida: 0, dura });
    }
  }

  let antes = 0;
  function quadro(agora) {
    if (!vivo) return;
    const dt = Math.min(0.05, (agora - antes) / 1000 || 0); antes = agora;
    est.t += dt;
    const r = conta();
    est.tam = Math.max(0.05, Math.min(1, est.tam + (r.saldo > 0 ? r.saldo / 100 * 0.07 : r.saldo / 100 * 0.12) * dt));
    est.murcha += ((est.agua < 22 ? 1 - est.agua / 22 : 0) - est.murcha) * Math.min(1, dt * 1.5);
    if (!calmo) nascer(dt, r);
    particulas = particulas.filter(p => { p.vida += dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.vida < p.dura; });
    desenhar();
    leituras(r);
    requestAnimationFrame(quadro);
  }

  // ---------- painel ----------
  const NOME = { luz: 'luz', agua: 'água', co2: 'gás carbônico' };
  let ultimoRecado = '';
  function leituras(r) {
    $('l-taxa').textContent = Math.round(r.bruta) + '%';
    $('b-taxa').style.width = r.bruta + '%';
    $('l-o2').textContent = calmo ? '—' : est.o2;
    $('l-tam').textContent = Math.round(est.tam * 100) + '%';
    let recado;
    if (est.luz < 3) recado = '🌙 Sem luz não há fotossíntese. A planta só respira e gasta as reservas.';
    else if (r.saldo < 0) recado = `📉 Ela gasta mais do que produz: falta ${NOME[r.limitante]}. Está abaixo do ponto de compensação.`;
    else if (r.bruta > 92) recado = est.tam >= 1 ? '🌸 Planta adulta, com tudo de que precisa.' : '🌱 Condições ótimas: nada está faltando e a planta cresce rápido.';
    else recado = `⚠️ Fator limitante: ${NOME[r.limitante]}. Aumentar os outros dois não adianta.`;
    if (recado !== ultimoRecado) { $('recado').textContent = ultimoRecado = recado; }
    for (const k of ['luz', 'agua', 'co2']) $('e-' + k).classList.toggle('au-falta', r.bruta <= 92 && r.limitante === k);
    ponto(r);
  }

  // ---------- gráfico ----------
  const X = l => 40 + l / 100 * 290, Y = s => 150 - (s + RESPIRA) / 100 * 130;
  function curva() {
    let d = '', comp = null;
    for (let l = 0; l <= 100; l += 2) {
      const s = conta(l).saldo;
      d += `${l ? 'L' : 'M'}${X(l).toFixed(1)} ${Y(s).toFixed(1)} `;
      if (comp === null && s >= 0) comp = l;
    }
    $('g-curva').setAttribute('d', d);
    const y0 = Y(0);
    $('g-zero').setAttribute('y1', y0); $('g-zero').setAttribute('y2', y0); $('g-zero-t').setAttribute('y', y0 - 5);
    const tem = comp !== null && comp > 0;
    $('g-comp').style.display = $('g-comp-t').style.display = tem ? '' : 'none';
    if (tem) {
      const x = X(comp);
      for (const [a, v] of [['x1', x], ['x2', x], ['y1', y0], ['y2', 166]]) $('g-comp').setAttribute(a, v);
      $('g-comp-t').setAttribute('x', x + 5); $('g-comp-t').setAttribute('y', 170);
    }
  }
  function ponto(r) { $('g-ponto').setAttribute('cx', X(est.luz)); $('g-ponto').setAttribute('cy', Y(r.saldo)); }

  // ---------- controles ----------
  function ler() {
    for (const k of ['luz', 'agua', 'co2']) { est[k] = Number($(k).value); $('o-' + k).textContent = est[k] + '%'; }
    curva();
  }
  for (const k of ['luz', 'agua', 'co2']) $(k).addEventListener('input', ler);
  raiz.querySelectorAll('[data-cena]').forEach(b => b.addEventListener('click', () => {
    const [l, a, g] = b.dataset.cena.split(',');
    $('luz').value = l; $('agua').value = a; $('co2').value = g; ler();
  }));
  $('recomecar').addEventListener('click', () => { est.tam = 0.08; est.o2 = 0; particulas = []; });

  // ---------- teste rápido ----------
  addEventListener('resize', ajustar);
  ajustar(); ler(); requestAnimationFrame(quadro);
  return () => { vivo = false; removeEventListener('resize', ajustar); };
};
