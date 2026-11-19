aulasMM.aulas['pilhas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Potencial padrão de redução (V) e cor do metal
  const METAIS = { Mg: [-2.37, '#cfd6db'], Zn: [-0.76, '#b8c4cc'], Fe: [-0.44, '#8d8d8d'], Pb: [-0.13, '#6f7a85'], Cu: [0.34, '#c8743c'], Ag: [0.80, '#e6e8ea'] };
  let a = 'Zn', b = 'Cu';
  function desenhar() {
    const [Ea, ca] = METAIS[a], [Eb, cb] = METAIS[b], ddp = Math.abs(Ea - Eb), igual = a === b;
    const anodo = Ea < Eb ? a : b, catodo = Ea < Eb ? b : a, esqAnodo = anodo === a;
    const copo = (x, cor, met, rot, pol) => `<path d="M${x} 70 V146 H${x + 90} V70" fill="#2f7bd8" fill-opacity=".18" stroke="currentColor" stroke-width="2" opacity=".9"/>
      <rect x="${x + 36}" y="56" width="18" height="78" rx="3" fill="${cor}"/>
      <text x="${x + 45}" y="124" text-anchor="middle" style="font-weight:800;fill:#10130f">${met}</text>
      ${igual ? '' : `<text x="${x + 45}" y="158" text-anchor="middle" style="font-weight:700;fill:${pol === '−' ? 'var(--errado)' : '#6c8cff'}">${rot} (${pol})</text>`}`;
    let s = copo(20, ca, a, esqAnodo ? 'ânodo' : 'cátodo', esqAnodo ? '−' : '+') + copo(210, cb, b, esqAnodo ? 'cátodo' : 'ânodo', esqAnodo ? '+' : '−');
    s += `<path d="M110 92 H210" stroke="currentColor" stroke-width="10" opacity=".25" fill="none"/><text x="160" y="108" text-anchor="middle">ponte salina</text>
      <path d="M65 56 V18 H255 V56" fill="none" stroke="currentColor" stroke-width="2" opacity=".8"/>
      <circle cx="160" cy="18" r="15" fill="var(--superficie)" stroke="currentColor" stroke-width="2"/><text x="160" y="22" text-anchor="middle" style="font-weight:800;fill:var(--texto)">V</text>
      <text x="160" y="50" text-anchor="middle" style="font-size:15px;font-weight:800;fill:#e9b949">${br(ddp, 2)} V</text>`;
    if (!igual) s += `<text x="${esqAnodo ? 100 : 220}" y="12" text-anchor="middle" style="font-weight:700;fill:#e9b949">e⁻ ${esqAnodo ? '→' : '←'}</text>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', igual ? 'Dois eletrodos iguais: zero volt' : `Pilha ${anodo} e ${catodo}: ${br(ddp, 2)} volts`);
    $('leituras').innerHTML = igual ? leitura('Ânodo', '—') + leitura('Cátodo', '—') + leitura('ddp', '0 V')
      : leitura('Ânodo (oxida)', anodo) + leitura('Cátodo (reduz)', catodo) + leitura('ddp', `${br(ddp, 2)} V`);
    $('recado').textContent = igual ? 'Com o mesmo metal dos dois lados não há diferença de potencial: nada de corrente. Escolha metais diferentes.'
      : `E°(${catodo}) = ${br(METAIS[catodo][0], 2)} V é maior que E°(${anodo}) = ${br(METAIS[anodo][0], 2)} V: o ${catodo} reduz e o ${anodo} oxida. ddp = ${br(METAIS[catodo][0], 2)} − (${br(METAIS[anodo][0], 2)}) = ${br(ddp, 2)} V. Os elétrons saem do ${anodo} pelo fio.`;
    raiz.querySelectorAll('[data-a]').forEach(x => x.setAttribute('aria-pressed', x.dataset.a === a));
    raiz.querySelectorAll('[data-b]').forEach(x => x.setAttribute('aria-pressed', x.dataset.b === b));
  }
  $('ma').innerHTML = '<span class="au-legenda">Lado esquerdo:</span>' + Object.keys(METAIS).map(m => `<button type="button" data-a="${m}">${m}</button>`).join('');
  $('mb').innerHTML = '<span class="au-legenda">Lado direito:</span>' + Object.keys(METAIS).map(m => `<button type="button" data-b="${m}">${m}</button>`).join('');
  raiz.querySelectorAll('[data-a]').forEach(x => x.addEventListener('click', () => { a = x.dataset.a; desenhar(); }));
  raiz.querySelectorAll('[data-b]').forEach(x => x.addEventListener('click', () => { b = x.dataset.b; desenhar(); }));
  desenhar();

  // ---------- filminho: recarregar ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = (e, t = 40) => `<span style="font-size:${t}px">${e}</span>`;
  const ROTEIROS = {
    recarga: {
      montar(p) {
        return { bat: ator(p, E('🔋', 48), 50, 40), seta: ator(p, N('reação espontânea → energia elétrica'), 50, 76), x: por(ator(p, E('💡', 30), 82, 40), { o: 0 }) };
      },
      passos: [
        [2600, 'Usando o celular, a bateria <b>descarrega</b>: a oxirredução é espontânea e gera corrente (é uma pilha).', a => por(a.x, { o: 1 })],
        [3000, 'Na tomada, o carregador <b>força</b> a reação ao contrário, gastando energia elétrica. Isso é uma eletrólise.', a => { por(a.x, { html: E('🔌', 30) }); por(a.seta, { html: N('energia elétrica → reação forçada') }); }],
        [2800, 'Pilhas comuns não recarregam; baterias recarregáveis aguentam centenas de ciclos.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
