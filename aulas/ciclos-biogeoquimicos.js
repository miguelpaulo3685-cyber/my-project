aulasMM.aulas['ciclos-biogeoquimicos'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- siga o átomo ----------
  const CICLOS = {
    carbono: ['#9aa6b2', [
      ['🌫️', 'CO₂ no ar', 'O átomo de carbono começa no ar, preso numa molécula de CO₂ (gás carbônico).'],
      ['🌳', 'Fotossíntese', 'A planta puxa o CO₂ do ar e, com a luz do Sol, monta açúcar. O carbono agora faz parte da planta.'],
      ['🐄', 'Alimentação', 'Um animal come a planta e o carbono passa para o corpo dele. Ao respirar, ele já devolve parte desse carbono ao ar como CO₂.'],
      ['🍄', 'Decomposição', 'Quando planta e animal morrem, fungos e bactérias os decompõem e também soltam CO₂ na respiração deles.'],
      ['🛢️', 'Combustível fóssil', 'Restos que ficaram soterrados por milhões de anos, sem decompor, viraram petróleo e carvão: carbono guardado fora do ciclo.'],
      ['🔥', 'Queima', 'Queimar gasolina, carvão ou floresta devolve esse carbono ao ar de uma vez. Mais CO₂ no ar, mais efeito estufa.']]],
    nitrogenio: ['#62a8ea', [
      ['🌫️', 'N₂ no ar', 'O ar tem 78% de nitrogênio (N₂), mas nem plantas nem animais conseguem usar essa forma.'],
      ['🦠', 'Fixação', 'Bactérias fixadoras (como as dos nódulos das raízes do feijão) transformam o N₂ em amônia (NH₃). Raios e a indústria de adubo também fixam.'],
      ['🧫', 'Nitrificação', 'Outras bactérias transformam a amônia em nitrito e depois em nitrato (NO₃⁻), a forma que a planta absorve melhor.'],
      ['🌱', 'Planta', 'A raiz absorve o nitrato e a planta usa o nitrogênio para fazer proteínas e DNA.'],
      ['🐑', 'Animal', 'O animal come a planta e usa o nitrogênio nas proteínas dele.'],
      ['💩', 'Excretas e restos', 'Urina, fezes e corpos mortos são decompostos e o nitrogênio volta a ser amônia no solo (amonificação).'],
      ['↩️', 'Desnitrificação', 'Bactérias desnitrificantes transformam nitrato em N₂, que volta para o ar. O ciclo fecha.']]],
    agua: ['#4a94d8', [
      ['🌊', 'Mares e rios', 'A maior parte da água está nos oceanos.'],
      ['☀️', 'Evaporação', 'O Sol aquece a água, que vira vapor e sobe.'],
      ['🌿', 'Transpiração', 'As plantas também soltam vapor de água pelas folhas: uma floresta "sua" muita água para o ar.'],
      ['☁️', 'Condensação', 'Lá em cima o vapor esfria e vira gotinhas: as nuvens.'],
      ['🌧️', 'Chuva', 'As gotas crescem e caem como chuva (ou neve, ou granizo).'],
      ['🕳️', 'Infiltração', 'Parte da chuva entra no solo e abastece os lençóis subterrâneos. Asfalto e solo sem mata diminuem isso.'],
      ['🏞️', 'Escoamento', 'O resto escorre pela superfície para os rios, que levam a água de volta ao mar.']]]
  };
  let ciclo = 'carbono', k = 0;
  function desenhar() {
    const [cor, est] = CICLOS[ciclo], n = est.length;
    const pos = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [160 + 118 * Math.cos(a), 108 + 82 * Math.sin(a)]; };
    let svg = '';
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pos(i), [x2, y2] = pos((i + 1) % n), dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
      svg += `<line x1="${x1 + dx / d * 20}" y1="${y1 + dy / d * 20}" x2="${x2 - dx / d * 22}" y2="${y2 - dy / d * 22}" stroke="${cor}" stroke-width="2" opacity="${i === (k - 1 + n) % n ? 1 : .35}" marker-end="url(#au-pc)"/>`;
    }
    svg += est.map(([e, nome], i) => { const [x, y] = pos(i), at = i === k;
      return `<g opacity="${at ? 1 : .55}"><circle cx="${x}" cy="${y}" r="${at ? 19 : 16}" fill="var(--superficie)" stroke="${at ? cor : 'var(--borda)'}" stroke-width="3"/>
        <text x="${x}" y="${y + 6}" text-anchor="middle" style="font-size:${at ? 18 : 15}px">${e}</text>
        <text x="${x}" y="${y + (y > 108 ? 33 : -24)}" dominant-baseline="middle" text-anchor="middle" style="font-weight:${at ? 800 : 500};fill:var(--texto)">${nome}</text></g>`; }).join('');
    const [ax, ay] = pos(k);
    svg += `<circle cx="${ax + 14}" cy="${ay - 14}" r="6" fill="#e9b949" stroke="#000" stroke-opacity=".3"><title>o átomo</title></circle>`;
    $('ciclo').innerHTML = `<defs><marker id="au-pc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="${cor}"/></marker></defs>${svg}`;
    $('recado').innerHTML = `<b>Passo ${k + 1} de ${n}: ${est[k][1]}.</b> ${est[k][2]}`;
    raiz.querySelectorAll('[data-ciclo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ciclo === ciclo)));
    $('passo').textContent = k === n - 1 ? '↺ Voltar ao começo do ciclo' : 'Próximo passo →';
  }
  $('passo').addEventListener('click', () => { k = (k + 1) % CICLOS[ciclo][1].length; desenhar(); });
  raiz.querySelectorAll('[data-ciclo]').forEach(b => b.addEventListener('click', () => { ciclo = b.dataset.ciclo; k = 0; desenhar(); }));
  desenhar();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const E = (e, tam = 28) => `<span style="font-size:${tam}px">${e}</span>`;
  const ROTEIROS = {
    fossil: {
      montar(p) {
        const a = { haste: ator(p, '<div class="au-haste"><i class="au-prato-e"></i><i class="au-prato-d"></i></div>', 50, 40), base: ator(p, '', 50, 62, 'au-base-balanca') };
        a.e = ator(p, '<span class="au-balao">🌳 tira CO₂</span>', 22, 72);
        a.d = ator(p, '<span class="au-balao">🫁 devolve CO₂</span>', 78, 72);
        a.f = por(ator(p, '<span class="au-balao" style="background:#c94b4b;color:#fff">🛢️🔥 + queima</span>', 78, 88), { o: 0 });
        a.termo = ator(p, N('🌡️ equilíbrio', 'au-pequeno'), 50, 10);
        return a;
      },
      passos: [
        [2800, 'O que as plantas <b>tiram</b> de CO₂ do ar e o que os seres vivos <b>devolvem</b> respirando se equilibram.'],
        [3200, 'Agora some o carbono que estava <b>guardado</b> no petróleo e no carvão: a queima joga CO₂ a mais no ar.', a => { por(a.f, { o: 1 }); a.haste.style.setProperty('--au-r', '9deg'); }],
        [3200, 'A balança pende: o CO₂ do ar <b>aumenta</b> e o efeito estufa se intensifica.', a => por(a.termo, { html: N('🌡️ CO₂ subindo', 'au-pequeno au-errado-txt') })]
      ]
    },
    raiz: {
      montar(p) {
        const a = { planta: ator(p, E('🌱', 46), 50, 34), solo: ator(p, '', 50, 62, 'au-solo') };
        a.nod = [40, 50, 60].map((x, i) => ator(p, '<i class="au-nodulo"></i>', x, 70 + (i % 2) * 8));
        a.n2 = [12, 26, 76, 88].map((x, i) => ator(p, '<span class="au-molecula">N₂</span>', x, 14 + (i % 2) * 10));
        a.amonia = por(ator(p, '<span class="au-balao">NH₃ (amônia)</span>', 80, 74), { o: 0 });
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2600, 'O ar está cheio de <b>N₂</b>, mas a planta não consegue usar essa forma.'],
        [3000, 'Nas raízes do feijão há <b>nódulos</b> com bactérias. O N₂ do ar entra pelo solo até elas.', a => a.n2.forEach((m, i) => por(m, { x: [40, 50, 60, 50][i], y: 72, s: .6, atraso: i * 200 }))],
        [3000, 'As bactérias transformam o N₂ em <b>amônia</b>, que a planta usa para fazer proteínas.', a => { a.n2.forEach(m => por(m, { o: 0 })); por(a.amonia, { o: 1 }); por(a.planta, { s: 1.25 }); }],
        [2800, 'É a <b>fixação biológica</b>: por isso feijão e soja deixam o solo mais rico em nitrogênio.', a => por(a.t, { html: N('bactéria + leguminosa = adubo natural', 'au-pequeno au-certo-txt') })]
      ]
    },
    agua: {
      montar(p) {
        const a = { sol: ator(p, E('☀️', 30), 12, 14), mar: ator(p, '', 32, 84, 'au-mar'), nuvem: por(ator(p, E('☁️', 44), 70, 16), { o: 0 }) };
        a.vapor = [20, 30, 40].map((x, i) => ator(p, '<i class="au-gota au-vapor"></i>', x, 76 + i));
        a.chuva = [62, 70, 78, 66, 74].map((x, i) => por(ator(p, '<i class="au-gota"></i>', x, 26), { o: 0 }));
        a.morro = ator(p, '', 78, 86, 'au-morro');
        return a;
      },
      passos: [
        [2400, 'O <b>Sol</b> aquece o mar.'],
        [2800, 'A água <b>evapora</b>: vira vapor e sobe.', a => a.vapor.forEach((v, i) => por(v, { x: 50 + i * 8, y: 22, o: .3, atraso: i * 250 }))],
        [2600, 'Lá em cima o vapor esfria e <b>condensa</b>: forma nuvens.', a => { por(a.nuvem, { o: 1 }); a.vapor.forEach(v => por(v, { o: 0 })); }],
        [3000, 'As gotas crescem e caem como <b>chuva</b>, que volta para rios e mares. E o ciclo continua.', a => a.chuva.forEach((g, i) => por(g, { o: 1, y: 78, atraso: i * 180 }))]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
