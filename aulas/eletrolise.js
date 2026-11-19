aulasMM.aulas['eletrolise'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const mil = n => Math.round(n).toLocaleString('pt-BR');
  function desenhar() {
    const i = Number($('i').value), min = Number($('t').value), t = min * 60, Q = i * t, ne = Q / 96500, m = ne / 2 * 63.5;
    $('io').textContent = `${i} A`; $('to').textContent = `${min} min`;
    const camada = Math.min(6, 1 + m * 0.8), gasto = Math.min(30, m * 4);
    $('graf').innerHTML = `<path d="M40 50 V140 H280 V50" fill="#6c8cff" fill-opacity=".22" stroke="currentColor" stroke-width="2"/>
      <text x="160" y="134" text-anchor="middle">solução de CuSO₄ (íons Cu²⁺)</text>
      <rect x="80" y="${30 + gasto * .4}" width="${24 - gasto * .4}" height="${90 - gasto}" rx="3" fill="#c8743c"/>
      <text x="92" y="158" text-anchor="middle" style="font-weight:700;fill:var(--errado)">ânodo (+)</text>
      <rect x="${208 - camada}" y="${40 - camada}" width="${24 + 2 * camada}" height="${70 + 2 * camada}" rx="6" fill="#c8743c"/>
      <rect x="208" y="40" width="24" height="70" rx="4" fill="#b8c4cc"/><text x="220" y="80" text-anchor="middle" style="font-size:16px">🔑</text>
      <text x="220" y="158" text-anchor="middle" style="font-weight:700;fill:#6c8cff">cátodo (−)</text>
      <path d="M92 ${30 + gasto * .4} V8 H140 M180 8 H220 V${40 - camada}" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="140" y="0" width="40" height="16" rx="3" fill="var(--superficie)" stroke="currentColor"/><text x="160" y="12" text-anchor="middle" style="font-weight:800;fill:var(--texto)">+ −</text>
      <text x="228" y="26" style="fill:#e9b949;font-weight:700">e⁻ ↓</text>`;
    $('graf').setAttribute('aria-label', `${i} ampères por ${min} minutos depositam ${br(m, 2)} gramas de cobre`);
    $('eq').innerHTML = `Q = <span>${i} A</span> · <span>${mil(t)} s</span> = <span>${mil(Q)} C</span>`;
    $('leituras').innerHTML = leitura('Mols de e⁻', br(ne, 3)) + leitura('Mols de cobre', br(ne / 2, 3)) + leitura('Cobre na chave', `${br(m, 2)} g`);
    $('recado').textContent = `${mil(Q)} C ÷ 96 500 C/mol = ${br(ne, 3)} mol de elétrons. Cada Cu²⁺ precisa de 2 elétrons: ${br(ne / 2, 3)} mol de cobre × 63,5 g/mol = ${br(m, 2)} g. O ânodo de cobre se desgasta e repõe os íons. Dobrar a corrente ou o tempo dobra o cobre.`;
  }
  $('i').addEventListener('input', desenhar);
  $('t').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: alumínio e reciclagem ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = (e, t = 38) => `<span style="font-size:${t}px">${e}</span>`;
  const ROTEIROS = {
    aluminio: {
      montar(p) {
        return {
          bx: ator(p, E('🪨'), 14, 40), t1: ator(p, N('bauxita'), 14, 64),
          raio: por(ator(p, E('⚡', 30), 38, 40), { o: 0 }), lata: por(ator(p, E('🥫'), 62, 40), { o: 0 }), t2: por(ator(p, N('alumínio'), 62, 64), { o: 0 }),
          rec: por(ator(p, E('♻️', 30), 86, 40), { o: 0 }), t3: por(ator(p, N('reciclar gasta ~5%<br>da energia'), 72, 84), { o: 0 })
        };
      },
      passos: [
        [2400, 'O alumínio vem da bauxita, um minério com óxido de alumínio.'],
        [3000, 'Para separar o metal, faz-se uma <b>eletrólise ígnea</b>, que consome muita energia elétrica.', a => { por(a.raio, { o: 1 }); por(a.lata, { o: 1 }); por(a.t2, { o: 1 }); }],
        [3200, 'Por isso reciclar latinhas vale tanto: refundir o alumínio gasta só uns 5% dessa energia.', a => { por(a.rec, { o: 1 }); por(a.t3, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
