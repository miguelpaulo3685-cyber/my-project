aulasMM.aulas['biotecnologia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // Posição de cada banda no gel (0 = perto do poço, 100 = mais longe; pedaços menores andam mais).
  const MAE = [12, 38, 61, 84], FILHO = [12, 27, 61, 73]; // 12 e 61 vieram da mãe; 27 e 73 vêm do pai
  const SUPOSTOS = [[20, 46, 73, 90], [27, 52, 73, 79], [8, 27, 55, 66]]; // só o 2º tem 27 e 73
  let escolhido = null;
  const faixas = (lista, cls = () => '') => lista.map(y => `<i class="au-gen-faixa ${cls(y)}" style="top:${8 + y * 0.82}%"></i>`).join('');
  function desenhar() {
    const doPai = FILHO.filter(y => !MAE.includes(y));
    const s = escolhido === null ? null : SUPOSTOS[escolhido];
    const poco = (nome, lista, cls, extra = '') => `<div class="au-gen-poco${extra}"><small>${nome}</small><div class="au-gen-trilho">${faixas(lista, cls)}</div></div>`;
    $('gel').innerHTML = poco('Mãe', MAE, () => 'au-gen-mae') +
      poco('Criança', FILHO, y => MAE.includes(y) ? 'au-gen-mae' : s ? (s.includes(y) ? 'au-gen-pai' : 'au-gen-falta') : '') +
      SUPOSTOS.map((l, k) => `<button type="button" class="au-gen-poco${k === escolhido ? ' au-gen-escolhido' : ''}" data-k="${k}" aria-pressed="${k === escolhido}" style="all:unset;cursor:pointer;display:flex;flex-direction:column;gap:6px">
        <small>Suposto pai ${k + 1}${k === escolhido ? ' ✓' : ''}</small><div class="au-gen-trilho">${faixas(l, y => s && k === escolhido && doPai.includes(y) ? 'au-gen-pai' : '')}</div></button>`).join('');
    let txt;
    if (s === null) txt = 'As bandas rosa da criança também aparecem na mãe: vieram dela. As outras duas (brancas) vieram do pai biológico. Toque num suposto pai para comparar.';
    else {
      const tem = doPai.filter(y => s.includes(y)).length;
      txt = tem === doPai.length
        ? `O suposto pai ${escolhido + 1} tem as duas bandas da criança que não vieram da mãe (verdes). Ele é compatível: é o pai biológico.`
        : `O suposto pai ${escolhido + 1} tem ${tem} das 2 bandas que a criança herdou do pai (em vermelho, as que faltam). Ele está excluído.`;
    }
    $('recado').textContent = txt;
    $('gel').setAttribute('aria-label', 'Gel de eletroforese com as bandas da mãe, da criança e de três supostos pais. ' + txt);
  }
  $('gel').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { escolhido = Number(b.dataset.k); desenhar(); } });
  desenhar();

  // ---------- filminho: bactéria fabricando insulina ----------
  const { ator, por } = aulasMM;
  const T = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const anel = '<span style="display:block;width:46px;height:46px;border-radius:50%;border:5px solid #62a8ea"></span>';
  const bac = '<span style="display:block;width:58px;height:30px;border-radius:16px;background:#6fd08c;border:2px solid #3f9a5c"></span>';
  const ROTEIROS = {
    insulina: {
      montar(p) {
        const a = {
          gene: ator(p, '<span class="au-gen-aa au-gen-mudou">gene da insulina</span>', 22, 24), tg: ator(p, T('DNA humano'), 22, 36),
          pl: ator(p, anel, 62, 26), tp: ator(p, T('plasmídeo'), 62, 44),
          bacs: [0, 1, 2, 3].map(k => por(ator(p, bac, 20 + k * 20, 72), { o: k ? 0 : 1 })),
          ins: [0, 1, 2, 3].map(k => por(ator(p, '<span class="au-balao">insulina</span>', 20 + k * 20, 88), { o: 0 }))
        };
        return a;
      },
      passos: [
        [2600, 'Uma enzima de restrição corta o <b>gene da insulina</b> do DNA humano.'],
        [2800, 'O gene é colado num <b>plasmídeo</b>, um DNA em anel da bactéria. É o <b>DNA recombinante</b>.', a => { por(a.gene, { x: 62, y: 26, s: .7 }); por(a.tg, { o: 0 }); }],
        [2800, 'O plasmídeo entra na bactéria, que se multiplica muito rápido, com o gene junto.', a => { por(a.gene, { x: 20, y: 72, o: 0 }); por(a.pl, { x: 20, y: 72, s: .5, o: 0 }); por(a.tp, { o: 0 }); a.bacs.forEach((b, k) => por(b, { o: 1, atraso: k * 250 })); }],
        [3000, 'Cada bactéria lê o gene humano (o código é universal) e fabrica <b>insulina</b> para quem tem diabetes.', a => a.ins.forEach((b, k) => por(b, { o: 1, atraso: k * 250 }))]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
