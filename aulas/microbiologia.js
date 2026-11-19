aulasMM.aulas['microbiologia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const rot = (x, y, t, al = 'start') => `<text x="${x}" y="${y}" text-anchor="${al}">${t}</text>`;
  const espinhos = () => { let s = ''; for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * Math.PI, c = Math.cos(a), si = Math.sin(a);
    s += `<line x1="${110 + 32 * c}" y1="${70 + 32 * si}" x2="${110 + 44 * c}" y2="${70 + 44 * si}" stroke="#e98fd0" stroke-width="3"/><circle cx="${110 + 46 * c}" cy="${70 + 46 * si}" r="4" fill="#e98fd0"/>`; } return s; };
  const GRUPOS = {
    virus: { nome: 'Vírus', em: '🦠', celula: 'não tem', nucleo: '—', doenca: 'gripe, covid, dengue',
      txt: 'Só uma cápsula de proteína com material genético dentro. Fora de uma célula, não faz nada. Tratamento: antivirais (poucos) e, principalmente, vacinas. Antibiótico não funciona.',
      svg: () => `${espinhos()}<circle cx="110" cy="70" r="32" fill="#b06ab3"/><path d="M92 70 q6 -12 12 0 t12 0 t12 0" fill="none" stroke="#f4f1ea" stroke-width="3"/>
        ${rot(170, 50, 'cápsula de proteína')}${rot(170, 66, 'material genético')}${rot(170, 82, '(DNA ou RNA)')}${rot(170, 106, 'sem célula, sem núcleo')}` },
    bacteria: { nome: 'Bactéria', em: '🧫', celula: 'uma (procarionte)', nucleo: 'não tem', doenca: 'tuberculose, cólera',
      txt: 'Uma célula simples, com parede celular e o DNA solto no citoplasma. Tratamento: antibióticos. Muitas são úteis: fazem iogurte e vivem no nosso intestino.',
      svg: () => `<rect x="40" y="44" width="150" height="56" rx="28" fill="#6fd08c" stroke="#3f9a5c" stroke-width="4"/>
        <path d="M70 72 c10 -18 24 18 34 0 s24 -16 30 4 s-20 14 -30 4" fill="none" stroke="#10130f" stroke-width="2.5"/>
        <path d="M190 72 q14 -14 26 0 t26 0" fill="none" stroke="#6fd08c" stroke-width="2.5"/>
        ${[[60, 58], [150, 60], [160, 86], [62, 88], [120, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#10130f"/>`).join('')}
        ${rot(115, 30, 'parede celular', 'middle')}${rot(115, 120, 'DNA solto (sem núcleo)', 'middle')}${rot(248, 66, 'flagelo')}` },
    protozoario: { nome: 'Protozoário', em: '🔬', celula: 'uma (eucarionte)', nucleo: 'tem', doenca: 'malária, Chagas',
      txt: 'Uma só célula, mas com núcleo e organelas, como as nossas. Muitos têm ciclos com hospedeiros e vetores, como o mosquito da malária e o barbeiro da doença de Chagas.',
      svg: () => `<path d="M70 70 c-10 -30 30 -40 50 -30 s40 -14 50 6 s20 34 -6 44 s-30 22 -54 10 s-50 0 -40 -30z" fill="#7cb7e8"/>
        <circle cx="118" cy="68" r="14" fill="#2f5d8a"/><circle cx="150" cy="84" r="5" fill="#f4f1ea" opacity=".8"/>
        ${rot(200, 60, 'núcleo (eucarionte)')}${rot(200, 78, 'uma célula só')}<line x1="133" y1="66" x2="196" y2="57" stroke="currentColor" opacity=".5"/>` },
    fungo: { nome: 'Fungo', em: '🍄', celula: 'uma ou muitas', nucleo: 'tem', doenca: 'micose, candidíase',
      txt: 'Células com núcleo e parede de quitina. Não fazem fotossíntese: absorvem alimento do ambiente e são grandes decompositores. Fermento de pão e penicilina vêm de fungos. Tratamento das micoses: antifúngicos.',
      svg: () => `<path d="M60 64 q50 -50 100 0 z" fill="#e9b949"/><rect x="100" y="64" width="20" height="40" rx="6" fill="#f4f1ea"/>
        <path d="M110 104 l-30 22 M110 104 l-10 26 M110 104 l14 26 M110 104 l34 20" stroke="#f4f1ea" stroke-width="2" opacity=".8"/>
        ${rot(180, 52, 'corpo de frutificação')}${rot(180, 68, '(o cogumelo)')}${rot(180, 116, 'hifas no solo')}` }
  };
  let grupo = 'virus';
  function desenhar() {
    const g = GRUPOS[grupo];
    $('graf').innerHTML = g.svg();
    $('graf').setAttribute('aria-label', `Desenho de ${g.nome.toLowerCase()}`);
    $('leituras').innerHTML = leitura('Células', g.celula) + leitura('Núcleo', g.nucleo) + leitura('Doenças', g.doenca);
    $('recado').textContent = g.txt;
    raiz.querySelectorAll('[data-grupo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.grupo === grupo));
  }
  $('grupos').innerHTML = Object.entries(GRUPOS).map(([id, g]) => `<button type="button" data-grupo="${id}">${g.em} ${g.nome}</button>`).join('');
  raiz.querySelectorAll('[data-grupo]').forEach(b => b.addEventListener('click', () => { grupo = b.dataset.grupo; desenhar(); }));
  desenhar();

  // ---------- filminho: o vírus usa a célula ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const V = '<span style="font-size:20px">🦠</span>';
  const ROTEIROS = {
    virus: {
      montar(p) {
        const a = { cel: ator(p, '<span style="display:block;width:150px;height:110px;border-radius:50%;background:#7cb7e8;opacity:.35;border:3px solid #7cb7e8"></span>', 55, 50), t: ator(p, N('célula'), 55, 90) };
        a.v = ator(p, V, 10, 20);
        a.f = [0, 1, 2, 3, 4].map(k => por(ator(p, V, 50 + (k % 3) * 6, 44 + Math.floor(k / 3) * 10), { o: 0 }));
        return a;
      },
      passos: [
        [2400, 'O vírus encosta numa célula e injeta seu material genético.', a => por(a.v, { x: 50, y: 46 })],
        [2800, 'A célula passa a obedecer o vírus e fabrica <b>centenas de cópias</b> dele.', a => { por(a.v, { o: 0 }); a.f.forEach(f => por(f, { o: 1 })); }],
        [3000, 'Os novos vírus saem e vão infectar outras células. Fora delas, o vírus não se multiplica.', a => a.f.forEach((f, k) => por(f, { x: [12, 92, 20, 88, 55][k], y: [20, 22, 80, 78, 6][k] }))]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
