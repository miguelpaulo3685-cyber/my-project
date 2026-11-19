aulasMM.aulas['circuitos'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const R = 6; // cada lâmpada: 6 Ω
  let lig = 'serie', queimada = false;
  const lampada = (x, y, brilho, rot) => `<circle cx="${x}" cy="${y}" r="${12 + brilho * 10}" fill="#ffd54a" opacity="${brilho * 0.45}"/>
    <circle cx="${x}" cy="${y}" r="11" fill="${brilho > 0.02 ? '#ffd54a' : 'color-mix(in srgb, currentColor 20%, transparent)'}" stroke="currentColor"/>
    <text x="${x}" y="${y + 4}" text-anchor="middle" style="fill:#10130f;font-weight:800">${rot}</text>`;
  function desenhar() {
    const U = Number($('u').value);
    $('o').textContent = U + ' V';
    let i1, i2, it;
    if (lig === 'serie') { it = queimada ? 0 : U / (2 * R); i1 = i2 = it; }
    else { i1 = queimada ? 0 : U / R; i2 = U / R; it = i1 + i2; }
    const brilho = i => Math.min(1, (i * i * R) / 24); // potência relativa
    const fio = 'stroke="currentColor" stroke-width="2.5" fill="none"';
    const pilha = `<rect x="22" y="70" width="26" height="40" rx="4" fill="#62a8ea"/><text x="35" y="95" text-anchor="middle" style="fill:#10130f;font-weight:800">${U}V</text>`;
    let circ;
    if (lig === 'serie') {
      circ = `<path d="M35 70 V30 H285 V150 H35 V110" ${fio}/>${lampada(130, 30, queimada ? 0 : brilho(i1), queimada ? '✕' : '1')}${lampada(220, 30, brilho(i2), '2')}`;
    } else {
      circ = `<path d="M35 70 V30 H285 V150 H35 V110 M160 30 V150 M285 30 V150" ${fio}/>${lampada(160, 90, queimada ? 0 : brilho(i1), queimada ? '✕' : '1')}${lampada(285, 90, brilho(i2), '2')}`;
    }
    $('graf').innerHTML = circ + pilha + `<text x="160" y="172" text-anchor="middle">cada lâmpada: ${R} Ω</text>`;
    $('graf').setAttribute('aria-label', `Duas lâmpadas em ${lig === 'serie' ? 'série' : 'paralelo'} com ${U} volts${queimada ? ', lâmpada 1 queimada' : ''}`);
    raiz.querySelectorAll('[data-lig]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lig === lig)));
    $('queimar').setAttribute('aria-pressed', String(queimada));
    $('queimar').textContent = queimada ? '🔧 Trocar a lâmpada 1' : '💥 Queimar a lâmpada 1';
    $('leituras').innerHTML = leitura('Corrente total', num(it) + ' A') + leitura('Na lâmpada 2', num(i2) + ' A') + leitura('Tensão na lâmpada 2', num(i2 * R) + ' V');
    $('recado').textContent = lig === 'serie'
      ? (queimada ? 'Em série há um caminho só: com a lâmpada 1 queimada, o circuito abre e a corrente para em tudo. As duas apagam, como no pisca-pisca antigo.'
        : `Em série, a corrente (${num(it)} A) é a mesma nas duas e a tensão de ${U} V se divide: ${num(U / 2)} V para cada uma. Por isso elas brilham fraco.`)
      : (queimada ? 'Em paralelo, cada lâmpada tem o seu caminho: a lâmpada 2 continua acesa, com o mesmo brilho. É assim que a sua casa é ligada.'
        : `Em paralelo, cada lâmpada recebe os ${U} V inteiros e brilha mais. A corrente total soma as duas: ${num(it)} A. Quanto mais aparelhos, mais corrente no fio principal.`);
  }
  raiz.querySelectorAll('[data-lig]').forEach(b => b.addEventListener('click', () => { lig = b.dataset.lig; desenhar(); }));
  $('queimar').addEventListener('click', () => { queimada = !queimada; desenhar(); });
  $('u').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: o disjuntor ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    curto: {
      montar(p) {
        const a = { disj: ator(p, '<span style="font-size:30px">🎚️</span>', 16, 46), i: ator(p, N('corrente: 10 A'), 16, 70) };
        a.ap = ['💡', '📺', '🧊', '🚿'].map((e, k) => por(ator(p, `<span style="font-size:26px">${e}</span>`, 38 + k * 16, 46), { o: k < 2 ? 1 : 0 }));
        a.limite = ator(p, N('limite do disjuntor: 40 A'), 60, 88);
        return a;
      },
      passos: [
        [2400, 'Lâmpada e TV ligadas em paralelo: a corrente total é pequena.'],
        [2600, 'Liga a geladeira e o chuveiro: as correntes <b>se somam</b> no fio principal…', a => { a.ap.forEach(e => por(e, { o: 1 })); por(a.i, { html: N('corrente: 45 A') }); }],
        [3000, '…passou do limite: o fio ia esquentar demais, e o <b>disjuntor desarma</b>, cortando tudo.', a => { a.ap.forEach(e => por(e, { o: .25 })); por(a.disj, { html: '<span style="font-size:30px">⛔</span>' }); por(a.i, { html: N('corrente: 0 A') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
