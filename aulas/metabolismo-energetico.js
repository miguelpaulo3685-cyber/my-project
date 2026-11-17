aulasMM.aulas['metabolismo-energetico'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const VIAS = {
    aerobia: [['🍬 glicose', 'glicólise (citoplasma)', '2 piruvatos', 'Krebs (mitocôndria)', 'CO₂', 'cadeia respiratória + O₂', 'água'], 30,
      'Com oxigênio, a glicose é quebrada até o fim: sai CO₂ (que você expira), água e cerca de 30 ATP. É a respiração aeróbica.'],
    alcoolica: [['🍬 glicose', 'glicólise', '2 piruvatos', 'sem O₂', 'álcool + CO₂'], 2,
      'Sem oxigênio, a levedura só faz a glicólise e transforma o piruvato em álcool e CO₂. Rende só 2 ATP. O CO₂ faz o pão crescer.'],
    latica: [['🍬 glicose', 'glicólise', '2 piruvatos', 'sem O₂', 'ácido lático'], 2,
      'No músculo em esforço intenso falta oxigênio: ele faz só a glicólise e acumula ácido lático. Rende só 2 ATP, por isso o músculo cansa rápido.']
  };
  let via = 'aerobia';
  function desenhar() {
    const [etapas, atp, txt] = VIAS[via];
    $('via').innerHTML = etapas.map((e, k) => k % 2 ? `<span class="au-passo-via">↓ ${e}</span>` : `<b class="au-no-via">${e}</b>`).join('');
    $('atp').innerHTML = `<span>${'<i>⚡</i>'.repeat(atp)}</span><b>≈ ${atp} ATP</b>`;
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-via]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.via === via)));
  }
  raiz.querySelectorAll('[data-via]').forEach(b => b.addEventListener('click', () => { via = b.dataset.via; desenhar(); }));
  desenhar();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    etapas: {
      montar(p) {
        const a = { cito: ator(p, N('citoplasma', 'au-pequeno'), 20, 8), mito: ator(p, '<span class="au-mito-grande"></span>', 70, 52), ml: ator(p, N('mitocôndria', 'au-pequeno'), 70, 8) };
        a.g = ator(p, '<span class="au-molecula" style="background:#e9b949">glicose</span>', 20, 30);
        a.co2 = por(ator(p, '<span class="au-molecula" style="background:#7d7d84">CO₂</span>', 70, 40), { o: 0 });
        a.o2 = por(ator(p, '<span class="au-molecula" style="background:#62a8ea">O₂ → H₂O</span>', 70, 66), { o: 0 });
        a.atp = ator(p, N('ATP: 0', 'au-medio au-cor-u'), 20, 82);
        return a;
      },
      passos: [
        [2400, 'Uma <b>glicose</b> chega ao citoplasma.'],
        [2800, '<b>Glicólise</b>: ela é quebrada em dois pedaços (piruvatos). Rende um pouquinho de ATP.', a => { por(a.g, { html: '<span class="au-molecula" style="background:#e9b949">piruvato ×2</span>', y: 46 }); por(a.atp, { html: N('ATP: 2', 'au-medio au-cor-u') }); }],
        [2800, 'Os piruvatos entram na mitocôndria: no <b>ciclo de Krebs</b>, são desmontados e soltam <b>CO₂</b>.', a => { por(a.g, { x: 66, y: 52, o: .6 }); por(a.co2, { o: 1, y: 22 }); }],
        [3200, 'Na <b>cadeia respiratória</b>, o <b>O₂</b> entra e vira água, e sai a maior parte da energia: cerca de <b>30 ATP</b> no total.', a => { por(a.o2, { o: 1 }); por(a.g, { o: 0 }); por(a.atp, { html: N('ATP: ≈ 30', 'au-medio au-certo-txt') }); }]
      ]
    },
    pao: {
      montar(p) {
        const a = { massa: ator(p, '<span class="au-massa"></span>', 50, 80), bolhas: [] };
        a.massa.style.transform = 'translate(-50%, -100%)';
        for (let k = 0; k < 8; k++) a.bolhas.push(por(ator(p, '<i class="au-bolha-pao"></i>', 38 + (k * 23) % 26, 62 + (k % 3) * 5), { o: 0 }));
        a.t = ator(p, N('massa + fermento', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'Massa com <b>fermento</b>: leveduras vivas comendo o açúcar da farinha, sem oxigênio.'],
        [2800, 'Elas fazem <b>fermentação alcoólica</b> e soltam bolhas de <b>CO₂</b>.', a => a.bolhas.forEach((b, k) => por(b, { o: 1, atraso: k * 150 }))],
        [3000, 'O gás fica preso na massa, que <b>cresce</b>. No forno, o álcool evapora e o pão fica fofo.', a => { a.massa.firstChild.classList.add('au-cresceu'); por(a.t, { html: N('o CO₂ faz o pão crescer', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
