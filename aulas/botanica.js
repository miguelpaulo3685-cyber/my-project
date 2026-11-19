aulasMM.aulas['botanica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, emoji, exemplo, explicação]; o índice diz quantas novidades o grupo tem (0 a 3)
  const GRUPOS = [
    ['Briófitas', '🌱', 'musgos', 'Sem vasos, a água passa de célula em célula. Por isso são baixinhas, vivem em lugar úmido e precisam de água para o gameta masculino nadar até o feminino.'],
    ['Pteridófitas', '🌿', 'samambaias', 'Ganharam vasos condutores e podem ser maiores. Embaixo das folhas há pontinhos (soros) que liberam esporos. Ainda precisam de água para a fecundação.'],
    ['Gimnospermas', '🌲', 'pinheiros', 'Ganharam a semente, que protege e alimenta o embrião. A semente é "nua" (fica na pinha, sem fruto). O pólen é levado pelo vento: não dependem mais de água para se reproduzir. Ex.: araucária, cuja semente é o pinhão.'],
    ['Angiospermas', '🌸', 'ipê, feijão, laranjeira', 'Ganharam flores, que atraem polinizadores, e frutos, que protegem e espalham as sementes. É o maior grupo de plantas e quase tudo que comemos de planta vem daqui.']
  ];
  const NOVIDADES = [['vasos condutores', 1], ['sementes', 2], ['flor e fruto', 3]];
  let g = 0;
  function desenhar() {
    let s = '';
    GRUPOS.forEach(([, em], k) => {
      const x = 45 + k * 80, on = k === g, nome = ['musgo', 'samambaia', 'pinheiro', 'ipê'][k];
      s += `<rect x="${x - 38}" y="6" width="76" height="80" rx="12" fill="${on ? 'var(--marca)' : 'currentColor'}" opacity="${on ? .2 : .05}"/>
        <text x="${x}" y="50" text-anchor="middle" style="font-size:${on ? 38 : 30}px">${em}</text>
        <text x="${x}" y="76" text-anchor="middle" style="${on ? 'fill:var(--texto);font-weight:800' : ''}">${nome}</text>`;
    });
    NOVIDADES.forEach(([nome, desde], k) => {
      const x = 5 + desde * 80, y = 94 + k * 18, tem = g >= desde;
      s += `<rect x="${x}" y="${y}" width="${315 - x}" height="14" rx="7" fill="${tem ? 'var(--certo)' : 'currentColor'}" opacity="${tem ? .85 : .15}"/>
        <text x="${x + 8}" y="${y + 11}" style="font-weight:700;${tem ? 'fill:#10130f' : ''}">${nome}</text>`;
    });
    $('graf').innerHTML = s;
    const [nome, , ex, txt] = GRUPOS[g];
    $('graf').setAttribute('aria-label', `${nome}: ${g >= 1 ? 'tem' : 'não tem'} vasos, ${g >= 2 ? 'tem' : 'não tem'} sementes, ${g >= 3 ? 'tem' : 'não tem'} flores e frutos`);
    $('leituras').innerHTML = leitura('Vasos', g >= 1 ? 'sim' : 'não') + leitura('Semente', g >= 2 ? 'sim' : 'não') + leitura('Flor e fruto', g >= 3 ? 'sim' : 'não');
    $('recado').textContent = `${nome} (${ex}). ${txt}`;
    raiz.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.g) === g));
  }
  $('grupos').innerHTML = GRUPOS.map(([nome, em], k) => `<button type="button" data-g="${k}">${em} ${nome}</button>`).join('');
  raiz.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => { g = Number(b.dataset.g); desenhar(); }));
  desenhar();

  // ---------- filminho: polinização ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = (e, t = 40) => `<span style="font-size:${t}px">${e}</span>`;
  const ROTEIROS = {
    polinizacao: {
      montar(p) {
        return {
          f1: ator(p, E('🌼'), 20, 56), f2: ator(p, E('🌸'), 80, 56), ab: ator(p, E('🐝', 28), 20, 30),
          po: por(ator(p, '<span style="display:block;width:10px;height:10px;border-radius:50%;background:#e9b949;box-shadow:0 0 6px #e9b949"></span>', 22, 36), { o: 0 }),
          t: por(ator(p, N('fruto com sementes'), 80, 84), { o: 0 })
        };
      },
      passos: [
        [2400, 'A abelha visita uma flor atrás de néctar e sai com <b>pólen</b> grudado no corpo.', a => por(a.po, { o: 1 })],
        [2800, 'Na próxima flor, o pólen cai no estigma: é a <b>polinização</b>.', a => { por(a.ab, { x: 80 }); por(a.po, { x: 80, y: 50 }); }],
        [3200, 'Depois da fecundação, o ovário vira <b>fruto</b> e o óvulo vira <b>semente</b>.', a => { por(a.po, { o: 0 }); por(a.ab, { x: 50, y: 18 }); por(a.f2, { html: E('🍎') }); por(a.t, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
