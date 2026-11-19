aulasMM.aulas['parasitologia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, origem (emoji), rótulo da origem, entrada (boca/pe/braco), causador, prevenção curta, explicação]
  const DOENCAS = {
    lombriga: ['Lombriga', '🥬', 'água e verduras com ovos', 'boca', 'Ascaris (verme)', 'saneamento e higiene', 'Os ovos saem nas fezes de quem está doente. Sem esgoto, contaminam a água e as verduras. Lavar as mãos e os alimentos e beber água tratada evita.'],
    amarelao: ['Amarelão', '🦶', 'solo com larvas', 'pe', 'Ancylostoma (verme)', 'andar calçado', 'A larva vive no solo contaminado por fezes e entra pela pele dos pés descalços. No intestino, o verme suga sangue e causa anemia: a pessoa fica fraca e amarelada.'],
    esquisto: ['Esquistossomose', '🐌', 'lagoa com caramujos', 'pe', 'Schistosoma (verme)', 'saneamento; evitar banho em lagoas', 'A larva sai do caramujo e entra pela pele de quem nada ou trabalha em água doce contaminada. O fígado incha e a barriga cresce: é a "barriga d\'água".'],
    tenia: ['Teníase', '🥩', 'carne crua com cisticercos', 'boca', 'Taenia, a solitária (verme)', 'carne bem cozida', 'Comer carne de porco ou de boi crua ou malpassada com cisticercos faz a tênia crescer no intestino. Cozinhar bem a carne e comprar carne inspecionada evita.'],
    malaria: ['Malária', '🦟', 'mosquito Anopheles', 'braco', 'Plasmodium (protozoário)', 'combater o mosquito, mosquiteiro', 'A fêmea do mosquito Anopheles pica uma pessoa doente e leva o parasita a outra. Causa febre alta em ciclos. É comum na região amazônica.'],
    chagas: ['Doença de Chagas', '🪲', 'barbeiro', 'braco', 'Trypanosoma cruzi (protozoário)', 'casas de alvenaria e telas', 'O barbeiro pica e defeca perto da picada; ao coçar, a pessoa leva o parasita para a ferida. Vive em frestas de casas de pau a pique. Ataca o coração com o tempo.']
  };
  const ENTRADA = { boca: [262, 32, 'entra pela boca'], pe: [248, 128, 'entra pela pele do pé'], braco: [282, 72, 'entra pela picada'] };
  let d = 'lombriga';
  function desenhar() {
    const [nome, em, origem, ent, causa, prev, txt] = DOENCAS[d], [ex, ey, rot] = ENTRADA[ent];
    $('graf').innerHTML = `<text x="56" y="72" text-anchor="middle" style="font-size:44px">${em}</text>
      <text x="56" y="100" text-anchor="middle">${origem}</text>
      <line x1="100" y1="64" x2="196" y2="64" stroke="var(--marca)" stroke-width="3" stroke-dasharray="6 4"/><path d="M196 58 l10 6 l-10 6 z" fill="var(--marca)"/>
      <text x="150" y="54" text-anchor="middle" style="fill:var(--texto);font-weight:700">${rot}</text>
      <g stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7">
        <circle cx="262" cy="24" r="13"/><line x1="262" y1="37" x2="262" y2="92"/><line x1="262" y1="52" x2="240" y2="76"/><line x1="262" y1="52" x2="284" y2="76"/>
        <line x1="262" y1="92" x2="248" y2="128"/><line x1="262" y1="92" x2="276" y2="128"/></g>
      <circle cx="${ex}" cy="${ey}" r="9" fill="var(--errado)" opacity=".9"/>`;
    $('graf').setAttribute('aria-label', `${nome}: vem de ${origem} e ${rot}`);
    $('leituras').innerHTML = leitura('Causador', causa) + leitura('Entrada', { boca: 'boca', pe: 'pele', braco: 'picada de inseto' }[ent]) + leitura('Prevenção', prev);
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-d]').forEach(b => b.setAttribute('aria-pressed', b.dataset.d === d));
  }
  $('doencas').innerHTML = Object.entries(DOENCAS).map(([id, x]) => `<button type="button" data-d="${id}">${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { d = b.dataset.d; desenhar(); }));
  desenhar();

  // ---------- filminho: ciclo da esquistossomose ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = e => `<span style="font-size:34px">${e}</span>`;
  const ROTEIROS = {
    esquisto: {
      montar(p) {
        return {
          pes: ator(p, E('🧍'), 16, 34), t1: ator(p, N('pessoa doente'), 16, 58),
          ovo: por(ator(p, '<span style="font-size:18px">🥚</span>', 22, 40), { o: 0 }),
          agua: ator(p, '<span style="display:block;width:170px;height:40px;border-radius:20px;background:#2f7bd8;opacity:.45"></span>', 64, 78),
          car: ator(p, E('🐌'), 60, 74), t2: ator(p, N('caramujo'), 60, 94),
          lar: por(ator(p, '<span style="font-size:14px">〰️〰️〰️</span>', 60, 68), { o: 0 }),
          nad: por(ator(p, E('🏊'), 88, 70), { o: 0 })
        };
      },
      passos: [
        [2400, 'Os ovos do verme saem nas fezes da pessoa doente.', a => por(a.ovo, { o: 1 })],
        [2800, 'Sem esgoto, os ovos chegam à água. A larva que nasce entra num <b>caramujo</b> e se multiplica.', a => por(a.ovo, { x: 58, y: 72, s: .6 })],
        [2800, 'Do caramujo saem centenas de larvas (cercárias) para a água.', a => { por(a.ovo, { o: 0 }); por(a.lar, { o: 1, x: 76 }); }],
        [3000, 'Quem entra na água é infectado pela <b>pele</b>. Saneamento quebra o ciclo.', a => { por(a.nad, { o: 1 }); por(a.lar, { x: 86 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
