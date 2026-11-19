aulasMM.aulas['oxirreducao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, emoji, equação, [quem oxida, Nox antes, depois], [quem reduz, antes, depois], elétrons, explicação]
  const REACOES = {
    zinco: ['Zinco no cobre', '🔩', 'Zn + Cu²⁺ → Zn²⁺ + Cu', ['Zn', '0', '+2'], ['Cu', '+2', '0'], 2, 'Uma placa de zinco numa solução azul de sulfato de cobre: o zinco se desgasta e um pó avermelhado de cobre aparece. A cor azul vai sumindo.'],
    ferrugem: ['Ferrugem', '🧲', '4 Fe + 3 O₂ → 2 Fe₂O₃', ['Fe', '0', '+3'], ['O', '0', '−2'], 12, 'O ferro perde elétrons para o oxigênio do ar (com ajuda da umidade) e vira óxido de ferro: a ferrugem.'],
    metano: ['Queima do gás', '🔥', 'CH₄ + 2 O₂ → CO₂ + 2 H₂O', ['C', '−4', '+4'], ['O', '0', '−2'], 8, 'Toda combustão é oxirredução: o combustível é oxidado e o oxigênio é reduzido. A energia liberada vira calor.'],
    acido: ['Ferro no ácido', '🧪', 'Fe + 2 H⁺ → Fe²⁺ + H₂', ['Fe', '0', '+2'], ['H', '+1', '0'], 2, 'O ferro reage com o ácido: ele oxida e o H⁺ reduz, formando bolhas de gás hidrogênio.']
  };
  let r = 'zinco';
  function desenhar() {
    const [, , eq, ox, red, e, txt] = REACOES[r];
    const chip = (x, [el, a, d], oxida) => `<rect x="${x - 54}" y="44" width="108" height="64" rx="12" fill="${oxida ? 'var(--errado)' : '#6c8cff'}" opacity=".18"/>
      <text x="${x}" y="68" text-anchor="middle" style="font-size:18px;font-weight:800;fill:var(--texto)">${el}</text>
      <text x="${x}" y="88" text-anchor="middle" style="font-size:13px;fill:var(--texto)">Nox ${a} → ${d}</text>
      <text x="${x}" y="102" text-anchor="middle" style="font-weight:700;fill:${oxida ? 'var(--errado)' : '#6c8cff'}">${oxida ? 'oxida ⬆' : 'reduz ⬇'}</text>`;
    $('graf').innerHTML = `<text x="160" y="22" text-anchor="middle" style="font-size:14px;font-weight:800;fill:var(--texto)">${eq}</text>`
      + chip(70, ox, true) + chip(250, red, false)
      + `<path d="M126 70 C150 50 170 50 194 70" fill="none" stroke="#e9b949" stroke-width="3"/><path d="M186 64 L195 71 L184 74" fill="none" stroke="#e9b949" stroke-width="3"/>
      <text x="160" y="48" text-anchor="middle" style="font-weight:800;fill:#e9b949">${e} e⁻</text>
      <text x="70" y="128" text-anchor="middle">agente redutor</text><text x="250" y="128" text-anchor="middle">agente oxidante</text>`;
    $('graf').setAttribute('aria-label', `${eq}: ${ox[0]} oxida de ${ox[1]} para ${ox[2]}; ${red[0]} reduz de ${red[1]} para ${red[2]}`);
    $('leituras').innerHTML = leitura('Oxida', ox[0]) + leitura('Reduz', red[0]) + leitura('Elétrons', `${e} e⁻`);
    $('recado').textContent = `${txt} ${ox[0]}: perde elétrons, Nox sobe de ${ox[1]} para ${ox[2]} (agente redutor). ${red[0]}: ganha elétrons, Nox desce de ${red[1]} para ${red[2]} (agente oxidante).`;
    raiz.querySelectorAll('[data-r]').forEach(b => b.setAttribute('aria-pressed', b.dataset.r === r));
  }
  $('reacoes').innerHTML = Object.entries(REACOES).map(([id, x]) => `<button type="button" data-r="${id}">${x[1]} ${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { r = b.dataset.r; desenhar(); }));
  desenhar();

  // ---------- filminho: zinco e cobre ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const at = (c, t) => `<span style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:${c};font:800 12px var(--fonte);color:#10130f">${t}</span>`;
  const el = '<span style="display:block;width:10px;height:10px;border-radius:50%;background:#e9b949;box-shadow:0 0 6px #e9b949"></span>';
  const ROTEIROS = {
    zinco: {
      montar(p) {
        return {
          zn: ator(p, at('#b8c4cc', 'Zn'), 24, 44), cu: ator(p, at('#6c8cff', 'Cu²⁺'), 76, 44),
          e1: por(ator(p, el, 30, 34), { o: 0 }), e2: por(ator(p, el, 30, 54), { o: 0 }),
          t1: ator(p, N('zinco metálico'), 24, 70), t2: ator(p, N('íon cobre (azul)'), 76, 70)
        };
      },
      passos: [
        [2400, 'Um átomo de zinco encosta num íon de cobre da solução.', a => { por(a.e1, { o: 1 }); por(a.e2, { o: 1 }); }],
        [3000, 'O zinco <b>perde 2 elétrons</b> e o íon de cobre os <b>ganha</b>.', a => { por(a.e1, { x: 70, y: 34 }); por(a.e2, { x: 70, y: 54 }); }],
        [3200, 'O zinco vira Zn²⁺ e vai para a solução (oxidou); o cobre vira metal e se deposita (reduziu).', a => { por(a.e1, { o: 0 }); por(a.e2, { o: 0 }); por(a.zn, { html: at('#b8c4cc', 'Zn²⁺'), o: .6 }); por(a.cu, { html: at('#c8743c', 'Cu') }); por(a.t1, { html: N('Zn²⁺ na solução') }); por(a.t2, { html: N('cobre metálico') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el2 => aulasMM.filme(el2, ROTEIROS[el2.dataset.filme]));
  return () => paradas.forEach(p => p());
};
