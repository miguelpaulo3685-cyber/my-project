aulasMM.aulas['queda-livre'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  let g = 10, quadro = null, inicio = 0;
  const TOPO = 20, CHAO = 220, XB = 120; // y do alto da régua e do chão; x da bola
  const escala = h => (CHAO - TOPO) / 80; // 80 m cabem na régua
  function cena(tempo) {
    const h = Number($('h').value), k = escala(h), tq = Math.sqrt(2 * h / g);
    const t = Math.min(tempo, tq), caiu = g * t * t / 2;
    const yIni = CHAO - h * k;
    let marcas = '';
    for (let s = 0.5; s < t; s += 0.5) marcas += `<circle cx="${XB}" cy="${yIni + g * s * s / 2 * k}" r="7" fill="none" stroke="#e9b949" stroke-width="2"/><text x="${XB + 14}" y="${yIni + g * s * s / 2 * k + 4}">${br(s, 1)} s</text>`;
    const regua = [0, 20, 40, 60, 80].map(m => `<line x1="40" y1="${CHAO - m * k}" x2="52" y2="${CHAO - m * k}" stroke="currentColor" opacity=".5"/><text x="36" y="${CHAO - m * k + 4}" text-anchor="end">${m} m</text>`).join('');
    $('graf').innerHTML = `<line x1="46" y1="${TOPO}" x2="46" y2="${CHAO}" stroke="currentColor" opacity=".35"/>${regua}
      <rect x="20" y="${CHAO}" width="290" height="20" fill="color-mix(in srgb, #6fae3f 45%, transparent)"/>
      <line x1="${XB - 30}" y1="${yIni}" x2="${XB + 30}" y2="${yIni}" stroke="#62a8ea" stroke-width="3"/>${marcas}
      <circle cx="${XB}" cy="${yIni + caiu * k}" r="8" fill="#e9b949"/>
      <text x="230" y="60" text-anchor="middle" style="font-size:13px;fill:var(--texto);font-weight:800">t = ${br(t, 1)} s</text>
      <text x="230" y="82" text-anchor="middle" style="font-size:13px;fill:var(--texto);font-weight:800">v = ${br(g * t, 1)} m/s</text>`;
    return t >= tq;
  }
  function resumo() {
    const h = Number($('h').value), tq = Math.sqrt(2 * h / g), v = Math.sqrt(2 * g * h);
    $('o').textContent = h + ' m';
    $('leituras').innerHTML = leitura('Tempo de queda', br(tq, 1) + ' s') + leitura('Chega a', br(v, 1) + ' m/s') + leitura('Em km/h', br(v * 3.6, 0) + ' km/h');
    $('graf').setAttribute('aria-label', `Bola solta de ${h} metros com g = ${br(g, 1)}: cai em ${br(tq, 1)} segundos`);
    $('recado').textContent = g === 10
      ? `As marcas ficam cada vez mais longe uma da outra: a bola ganha 10 m/s a cada segundo. De ${h} m, ela chega a ${br(v * 3.6, 0)} km/h.`
      : `Com g = ${br(g, 1)}, a mesma queda leva ${br(tq / Math.sqrt(2 * h / 10), 1)} vezes mais tempo que na Terra. A bola é a mesma: só a gravidade mudou.`;
  }
  function parar() { cancelAnimationFrame(quadro); quadro = null; }
  function soltar() {
    parar();
    if (aulasMM.calmo) { cena(99); return; }
    inicio = performance.now();
    const passo = agora => { if (!cena((agora - inicio) / 1000)) quadro = requestAnimationFrame(passo); else quadro = null; };
    quadro = requestAnimationFrame(passo);
  }
  raiz.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => {
    g = Number(b.dataset.g);
    raiz.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    resumo(); soltar();
  }));
  $('h').addEventListener('input', () => { parar(); resumo(); cena(0); });
  $('soltar').addEventListener('click', soltar);
  raiz.querySelector('[data-g="10"]').setAttribute('aria-pressed', 'true');
  resumo(); cena(0);

  // ---------- filminho: solta e lançada chegam juntas ----------
  const { ator, por } = aulasMM;
  const bola = cor => `<i style="width:16px;height:16px;border-radius:50%;background:${cor}"></i>`;
  const ROTEIROS = {
    juntas: {
      montar(p) {
        const a = { mesa: ator(p, '<span style="display:block;width:70px;height:6px;background:currentColor;border-radius:3px"></span>', 18, 14) };
        a.solta = ator(p, bola('#62a8ea'), 22, 10);
        a.lancada = ator(p, bola('#e9b949'), 28, 10);
        a.chao = ator(p, '<span style="display:block;width:min(300px,80vw);height:4px;background:#6fae3f;border-radius:2px"></span>', 50, 90);
        a.t = por(ator(p, '<span class="au-numero au-pequeno">mesmo tempo de queda</span>', 60, 76), { o: 0 });
        return a;
      },
      passos: [
        [2200, 'Duas bolas na mesma altura: a <b>azul</b> será solta e a <b>amarela</b>, lançada para frente.'],
        [3000, 'Elas descem igual: a vertical das duas é a mesma queda livre. A amarela só anda também para o lado.', a => {
          a.solta.style.transition = a.lancada.style.transition = 'left 1.2s linear, top 1.2s cubic-bezier(.55,0,1,.45)';
          por(a.solta, { y: 86 }); por(a.lancada, { x: 80, y: 86 });
        }],
        [2800, 'Chegam ao chão <b>juntas</b>. O movimento para frente não muda o tempo de queda.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => { parar(); paradas.forEach(p => p()); };
};
