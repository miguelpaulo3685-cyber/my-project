aulasMM.aulas['conservacao-energia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const G = 10;
  let atrito = 0, quadro = null;
  // Pista: altura (m) em função de x (0 a 1). Vale em U com uma lombada no meio.
  const altura = (x, h0) => {
    const vale = h0 * (Math.cos(x * 2 * Math.PI) + 1) / 2; // h0 nas pontas, 0 no meio
    return vale + 8 * Math.exp(-(((x - 0.5) / 0.06) ** 2)); // lombada de 8 m no centro
  };
  const PX = x => 20 + x * 280, PY = h => 175 - h * 3;
  function pista(h0) {
    let d = '';
    for (let i = 0; i <= 100; i++) { const x = i / 100; d += `${i ? 'L' : 'M'}${PX(x)} ${PY(altura(x, h0))}`; }
    return d;
  }
  function cena(x, E, h0) {
    const h = altura(x, h0), Ep = G * h, Ec = Math.max(0, E - Ep), perdido = G * h0 - E;
    const total = G * h0, k = 100 / total;
    const barra = (i, val, cor, nome) => `<text x="20" y="${206 + i * 16}" style="font-size:10px">${nome}</text><rect x="92" y="${197 + i * 16}" width="${Math.max(0, val * k * 2.1)}" height="11" fill="${cor}" rx="3"/>`;
    $('graf').innerHTML = `<path d="${pista(h0)}" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="${PX(x)}" cy="${PY(h) - 7}" r="7" fill="#e9b949"/>
      <line x1="${PX(0)}" y1="${PY(h0)}" x2="${PX(1)}" y2="${PY(h0)}" stroke="#62a8ea" stroke-dasharray="4 4" opacity=".7"/>
      <text x="${PX(1)}" y="${PY(h0) - 5}" text-anchor="end" style="font-size:10px">altura inicial</text>
      ${barra(0, Ep, '#62a8ea', 'altura (Ep)')}${barra(1, Ec, '#e9b949', 'movimento (Ec)')}${barra(2, perdido, 'var(--errado)', 'calor')}`;
    return { Ec, h };
  }
  // A velocidade sai da própria energia: v = √(2 · (E − g · h)). Sem atrito, E não muda
  // (volta sempre à mesma altura); com atrito, E diminui a cada metro andado.
  function soltar() {
    cancelAnimationFrame(quadro);
    const h0 = Number($('h').value), L = 280 / 3; // a pista tem ~93 m na horizontal
    let x = 0.0005, dir = 1, E = G * h0, antes = 0, tempo = 0, parado = 0;
    const passo = agora => {
      const dt = antes ? Math.min(0.03, (agora - antes) / 1000) * 1.6 : 0; antes = agora; tempo += dt;
      for (let k = 0; k < 20; k++) {
        const h = altura(x, h0), v = Math.sqrt(Math.max(0, 2 * (E - G * h)));
        const inclin = (altura(x + 1e-4, h0) - altura(x - 1e-4, h0)) / 2e-4 / L;
        const ds = Math.max(v, 0.3) * dt / 20, nx = x + dir * ds / Math.sqrt(1 + inclin * inclin) / L;
        if (nx <= 0 || nx >= 1 || G * altura(nx, h0) > E) { dir = -dir; continue; } // não tem energia para subir mais: volta
        x = nx; E -= atrito * 0.12 * G * ds; // atrito: tira energia proporcional ao caminho
      }
      const { Ec } = cena(x, E, h0);
      parado = Ec < 0.3 && atrito ? parado + dt : 0;
      if (tempo < 40 && parado < 0.6) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
  }
  function resumo() {
    const h0 = Number($('h').value);
    $('o').textContent = h0 + ' m';
    raiz.querySelectorAll('[data-atrito]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.atrito) === atrito)));
    cena(0.001, G * h0, h0);
    $('graf').setAttribute('aria-label', `Montanha-russa com altura inicial de ${h0} metros, ${atrito ? 'com' : 'sem'} atrito`);
    $('recado').textContent = atrito
      ? 'Com atrito, a barra vermelha (calor) vai crescendo: a cada ida e volta o carrinho sobe menos, até parar no fundo. A energia não sumiu, virou calor.'
      : `Sem atrito, a barra azul (altura) e a amarela (movimento) trocam o tempo todo, mas a soma é sempre a mesma. No ponto mais baixo, o carrinho passa a ${br(Math.sqrt(2 * G * h0) * 3.6, 0)} km/h e volta exatamente à altura inicial.`;
  }
  raiz.querySelectorAll('[data-atrito]').forEach(b => b.addEventListener('click', () => { atrito = Number(b.dataset.atrito); cancelAnimationFrame(quadro); resumo(); soltar(); }));
  $('h').addEventListener('input', () => { cancelAnimationFrame(quadro); resumo(); });
  $('soltar').addEventListener('click', soltar);
  resumo();

  // ---------- filminho: a usina hidrelétrica ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    usina: {
      montar(p) {
        return {
          represa: ator(p, '<span style="display:block;width:80px;height:70px;background:#2f7bd8;border-radius:4px 0 0 4px"></span>', 16, 40),
          muro: ator(p, '<span style="display:block;width:12px;height:84px;background:#8a7a68"></span>', 30, 44),
          agua: por(ator(p, '<i style="width:14px;height:14px;border-radius:50%;background:#62a8ea"></i>', 34, 30), { o: 0 }),
          turbina: ator(p, '<span style="font-size:30px">⚙️</span>', 56, 76), gerador: ator(p, '<span style="font-size:28px">🔌</span>', 80, 76),
          luz: por(ator(p, '<span style="font-size:30px">💡</span>', 92, 40), { o: 0 }),
          t1: ator(p, N('potencial'), 16, 90), t2: por(ator(p, N('cinética'), 42, 60), { o: 0 }), t3: por(ator(p, N('elétrica'), 82, 92), { o: 0 })
        };
      },
      passos: [
        [2400, 'A água parada no alto da represa guarda <b>energia potencial</b>.'],
        [2800, 'Ao descer pelo tubo, ganha velocidade: a energia vira <b>cinética</b>.', a => { por(a.agua, { o: 1, x: 54, y: 72 }); por(a.t2, { o: 1 }); }],
        [3000, 'A água gira a <b>turbina</b>, que gira o <b>gerador</b>: sai <b>energia elétrica</b>.', a => { por(a.luz, { o: 1 }); por(a.t3, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => { cancelAnimationFrame(quadro); paradas.forEach(p => p()); };
};
