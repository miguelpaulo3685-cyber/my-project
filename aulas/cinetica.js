aulasMM.aulas['cinetica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  let po = false, cat = false;
  // Velocidade relativa à referência (20 °C, concentração 2, comprimido inteiro, sem catalisador)
  const vel = (T, c, p, k) => 2 ** ((T - 20) / 10) * (c / 2) * (p ? 4 : 1) * (k ? 5 : 1);
  const X = t => 140 + t / 180 * 170, Y = f => 130 - f * 110;
  const curva = v => { const pts = []; for (let t = 0; t <= 180; t += 3) pts.push(`${X(t)},${Y(1 - Math.exp(-Math.LN2 / 60 * v * t))}`); return pts.join(' '); };
  function desenhar() {
    const T = Number($('t').value), c = Number($('c').value), v = vel(T, c, po, cat), meia = 60 / v;
    $('to').textContent = `${T} °C`; $('co').textContent = ['', 'baixa', 'média', 'alta', 'muito alta'][c];
    // Caixa com partículas: rastro maior = mais rápidas
    let s = `<rect x="8" y="10" width="120" height="120" rx="10" fill="#2f7bd8" opacity=".15"/>`;
    const rastro = 4 + 3 * 2 ** ((T - 20) / 10);
    for (let k = 0; k < c * 5; k++) {
      const x = 20 + ((k * 37) % 23) / 23 * 96, y = 22 + ((k * 53) % 19) / 19 * 70, a = k * 1.7;
      s += `<line x1="${x}" y1="${y}" x2="${x - Math.cos(a) * rastro}" y2="${y - Math.sin(a) * rastro}" stroke="#e9b949" stroke-width="2" opacity=".5"/><circle cx="${x}" cy="${y}" r="3.5" fill="#e9b949"/>`;
    }
    if (po) for (let k = 0; k < 14; k++) s += `<rect x="${24 + (k % 7) * 13}" y="${108 + Math.floor(k / 7) * 9}" width="6" height="6" fill="#f4f1ea"/>`;
    else s += `<rect x="46" y="104" width="44" height="20" rx="5" fill="#f4f1ea"/>`;
    if (cat) s += `<text x="118" y="28" text-anchor="end" style="font-size:16px">⚗️</text>`;
    s += `<line x1="140" y1="130" x2="312" y2="130" stroke="currentColor" opacity=".4"/><line x1="140" y1="16" x2="140" y2="130" stroke="currentColor" opacity=".4"/>
      <text x="144" y="14">quanto já reagiu</text><text x="312" y="144" text-anchor="end">tempo →</text>
      <polyline points="${curva(1)}" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 4" opacity=".5"/>
      <polyline points="${curva(v)}" fill="none" stroke="#e9b949" stroke-width="3"/>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `Reação ${br(v, 1)} vezes mais rápida que a referência`);
    $('leituras').innerHTML = leitura('Velocidade', `${br(v, v < 10 ? 1 : 0)}× a referência`) + leitura('Metade reage em', meia >= 1 ? `${br(meia, 0)} s` : 'menos de 1 s') + leitura('Energia de ativação', cat ? 'menor ✓' : 'normal');
    const fatores = [T > 20 && 'temperatura mais alta', T < 20 && 'temperatura mais baixa', c > 2 && 'mais concentração', c < 2 && 'menos concentração', po && 'mais superfície de contato', cat && 'catalisador'].filter(Boolean);
    $('recado').textContent = !fatores.length ? 'Esta é a reação de referência: comprimido inteiro, água a 20 °C. Mude uma condição de cada vez e compare as curvas.'
      : `Com ${fatores.join(', ')}, a reação fica ${v >= 1 ? `${br(v, v < 10 ? 1 : 0)} vezes mais rápida` : `${br(1 / v, 1 / v < 10 ? 1 : 0)} vezes mais lenta`}. ${v >= 1 ? 'Mais choques efetivos por segundo.' : 'Menos choques efetivos por segundo.'}`;
    $('po').setAttribute('aria-pressed', po); $('cat').setAttribute('aria-pressed', cat);
  }
  $('t').addEventListener('input', desenhar);
  $('c').addEventListener('input', desenhar);
  $('po').addEventListener('click', () => { po = !po; desenhar(); });
  $('cat').addEventListener('click', () => { cat = !cat; desenhar(); });
  desenhar();

  // ---------- filminho: o catalisador ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const morro = (h, cor) => `<span style="display:block;width:0;height:0;border-left:70px solid transparent;border-right:70px solid transparent;border-bottom:${h}px solid ${cor}"></span>`;
  const ROTEIROS = {
    catalisador: {
      montar(p) {
        return {
          m: ator(p, morro(70, '#e9b949'), 50, 56), bola: ator(p, '<span style="font-size:22px">⚽</span>', 14, 74),
          t: ator(p, N('energia de ativação'), 50, 14)
        };
      },
      passos: [
        [2600, 'Para reagir, as partículas precisam de energia para "passar o morro": a <b>energia de ativação</b>. Muitas não conseguem.', a => por(a.bola, { x: 34, y: 56 })],
        [2800, 'O <b>catalisador</b> abre um caminho com o morro mais baixo.', a => { por(a.bola, { x: 14, y: 74 }); por(a.m, { html: morro(32, '#6fd08c'), y: 68 }); por(a.t, { html: N('com catalisador: morro menor'), y: 44 }); }],
        [3000, 'Agora muito mais partículas passam, e a reação acelera. O catalisador sai inteiro no fim.', a => por(a.bola, { x: 86, y: 74 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
