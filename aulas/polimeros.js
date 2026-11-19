aulasMM.aulas['polimeros'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, emoji, monômero, adição?, cor, uso, explicação]
  const POLIS = {
    pe: ['Polietileno', '🛍️', 'eteno (CH₂=CH₂)', true, '#e9b949', 'sacolas, embalagens', 'O plástico mais produzido do mundo. Cada eteno abre a ligação dupla e se prende ao vizinho.'],
    pvc: ['PVC', '🚰', 'cloreto de vinila', true, '#6c8cff', 'canos, fios', 'Tem cloro na estrutura. Rígido e resistente: canos e capas de fios. Queimar PVC libera gases tóxicos.'],
    pet: ['PET', '🍾', 'ácido + diálcool', false, '#6fd08c', 'garrafas, fibras de roupa', 'Polímero de condensação: a cada ligação, sai uma molécula de água. Reciclado vira fibra de tecido, vassoura, nova garrafa.'],
    nailon: ['Náilon', '🧵', 'diamina + diácido', false, '#b47cd6', 'tecidos, cordas', 'Também de condensação, com ligações parecidas com as das proteínas. Forte e elástico.'],
    amido: ['Amido', '🍚', 'glicose', false, '#f4f1ea', 'arroz, batata, pão', 'Polímero natural: as plantas ligam glicoses para guardar energia. A celulose também é feita de glicose, mas ligada de outro jeito.']
  };
  let p = 'pe';
  function desenhar() {
    const [nome, em, mono, adicao, cor, uso, txt] = POLIS[p], n = Number($('n').value);
    $('no').textContent = n;
    const passo = Math.min(24, 280 / n), x0 = 160 - (n - 1) * passo / 2;
    let s = '';
    for (let k = 0; k < n; k++) {
      const x = x0 + k * passo, y = 46 + (k % 2 ? 8 : -8);
      if (k) s += `<line x1="${x - passo}" y1="${46 + ((k - 1) % 2 ? 8 : -8)}" x2="${x}" y2="${y}" stroke="currentColor" stroke-width="2.5" opacity=".7"/>`;
      if (k && !adicao) s += `<text x="${x - passo / 2}" y="${84 + (k % 2) * 10}" text-anchor="middle" style="font-size:11px">💧</text>`;
    }
    for (let k = 0; k < n; k++) s += `<circle cx="${x0 + k * passo}" cy="${46 + (k % 2 ? 8 : -8)}" r="${Math.min(10, passo / 2.4)}" fill="${cor}"/>`;
    s += `<text x="160" y="16" text-anchor="middle" style="font-weight:700">${n} monômero${n > 1 ? 's' : ''} de ${mono}</text>`;
    if (!adicao && n > 1) s += `<text x="160" y="106" text-anchor="middle">${n - 1} molécula${n > 2 ? 's' : ''} de água liberada${n > 2 ? 's' : ''}</text>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `${nome}: ${n} monômeros ligados`);
    $('leituras').innerHTML = leitura('Monômero', mono) + leitura('Tipo', adicao ? 'adição' : 'condensação') + leitura('Uso', `${em} ${uso}`);
    $('recado').textContent = `${txt} Um polímero de verdade tem milhares de monômeros.`;
    raiz.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === p));
  }
  $('polis').innerHTML = Object.entries(POLIS).map(([id, x]) => `<button type="button" data-p="${id}">${x[1]} ${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { p = b.dataset.p; desenhar(); }));
  $('n').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: reciclagem ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = (e, t = 36) => `<span style="font-size:${t}px">${e}</span>`;
  const ROTEIROS = {
    reciclar: {
      montar(p2) {
        return {
          g: ator(p2, E('🍾'), 12, 40), t1: ator(p2, N('separar'), 12, 64),
          m: por(ator(p2, E('⚙️'), 37, 40), { o: 0 }), t2: por(ator(p2, N('moer'), 37, 64), { o: 0 }),
          f: por(ator(p2, E('🔥'), 62, 40), { o: 0 }), t3: por(ator(p2, N('derreter'), 62, 64), { o: 0 }),
          c: por(ator(p2, E('👕'), 87, 40), { o: 0 }), t4: por(ator(p2, N('produto novo'), 87, 64), { o: 0 })
        };
      },
      passos: [
        [2200, 'A garrafa PET usada é <b>separada</b> dos outros materiais (por isso a coleta seletiva importa).'],
        [2400, 'Lavada e <b>moída</b> em flocos.', a => { por(a.m, { o: 1 }); por(a.t2, { o: 1 }); }],
        [2400, 'Os flocos são <b>derretidos</b>: como é termoplástico, o PET amolece.', a => { por(a.f, { o: 1 }); por(a.t3, { o: 1 }); }],
        [2800, 'E viram um <b>produto novo</b>: fibra para roupas, cordas, novas garrafas.', a => { por(a.c, { o: 1 }); por(a.t4, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(pp => pp());
};
