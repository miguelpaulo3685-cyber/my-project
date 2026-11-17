aulasMM.aulas['tratamento-agua'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- estação de tratamento ----------
  // [ícone, nome, tipo, turbidez 0-1, lixo grande?, flocos?, microrganismos?, explicação]
  const ETAPAS = [
    ['🏞️', 'Captação', '', 1, true, false, true, 'A água chega do rio ou da represa: com galhos e lixo, turva por causa da argila e com microrganismos.'],
    ['🚧', 'Grades', 'física', 1, false, false, true, 'Grades seguram galhos, folhas e lixo grande. A água continua turva e com microrganismos.'],
    ['🧪', 'Coagulação e floculação', 'química', .9, false, true, true, 'Um sal de alumínio (ou de ferro) e cal fazem as partículas finas de argila se grudarem em flocos maiores. É uma etapa química.'],
    ['⬇️', 'Decantação', 'física', .35, false, false, true, 'A água fica parada num tanque: os flocos, pesados, afundam e formam um lodo no fundo. A água de cima já está bem mais clara.'],
    ['⏳', 'Filtração', 'física', .05, false, false, true, 'Camadas de areia, cascalho e carvão seguram as partículas que ainda sobraram. A água fica transparente, mas ainda pode ter microrganismos.'],
    ['🧴', 'Desinfecção e fluoretação', 'química', 0, false, false, false, 'Cloro mata os microrganismos; flúor ajuda a prevenir cáries; a cal acerta o pH. Agora a água pode ir para a sua casa.'],
    ['🚰', 'Na sua torneira', '', 0, false, false, false, 'Água potável: limpa e sem microrganismos perigosos. Não é água pura: ainda tem cloro, flúor e alguns sais.']
  ];
  let k = 0;
  function eta() {
    const [ic, nome, tipo, turb, lixo, flocos, micro, txt] = ETAPAS[k];
    $('eta').innerHTML = `<div class="au-trilha-eta">${ETAPAS.map((e, i) => `<span class="${i === k ? 'au-at' : i < k ? 'au-feita' : ''}">${e[0]}</span>`).join('<i></i>')}</div>
      <div class="au-tanque" style="--turb:${turb}">
        ${lixo ? '<span class="au-lixo">🪵🥫🍃</span>' : ''}
        ${flocos ? '<span class="au-flocos">●●●<br>●●●●</span>' : ''}
        ${micro ? '<span class="au-micro">🦠 🦠</span>' : ''}
        ${k >= 3 ? '<span class="au-lodo"></span>' : ''}
      </div>
      <b class="au-nome-etapa">${nome}${tipo ? ` <em class="au-tipo-${tipo === 'física' ? 'fis' : 'qui'}">processo ${tipo === 'física' ? 'físico' : 'químico'}</em>` : ''}</b>`;
    $('eta').setAttribute('aria-label', `Etapa ${k + 1}: ${nome}`);
    $('recado').textContent = txt;
    $('volta').disabled = k === 0; $('avanca').disabled = k === ETAPAS.length - 1;
  }
  $('avanca').addEventListener('click', () => { if (k < ETAPAS.length - 1) { k++; eta(); } });
  $('volta').addEventListener('click', () => { if (k > 0) { k--; eta(); } });
  eta();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    floculo: {
      montar(p) {
        const a = { tanque: ator(p, '', 50, 50, 'au-tanque-filme'), part: [] };
        for (let i = 0; i < 18; i++) a.part.push(ator(p, '<i class="au-particula"></i>', 18 + (i * 37) % 64, 26 + (i * 23) % 46));
        a.al = por(ator(p, '<span class="au-molecula" style="background:#9aa6b2">sal de alumínio</span>', 50, 10), { o: 0 });
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'A água turva tem partículas <b>pequenas demais</b> para afundar sozinhas.'],
        [2800, 'Põe-se um <b>sal de alumínio</b>: ele faz as partículas se grudarem.', a => por(a.al, { o: 1 })],
        [2800, 'Formam-se <b>flocos</b> grandes (floculação).', a => a.part.forEach((pt, i) => por(pt, { x: [30, 50, 70][i % 3] + (i % 2) * 3, y: 46 + (i % 3) * 2, atraso: i * 40 }))],
        [3000, 'Pesados, os flocos <b>afundam</b> (decantação). A água de cima fica clara.', a => { a.part.forEach((pt, i) => por(pt, { y: 74 + (i % 2) * 2 })); por(a.al, { o: 0 }); por(a.t, { html: N('coagulação → floculação → decantação', 'au-pequeno au-certo-txt') }); }]
      ]
    },
    ete: {
      montar(p) {
        const a = { tanque: ator(p, '', 50, 50, 'au-tanque-filme'), mo: [], b: [] };
        for (let i = 0; i < 10; i++) a.mo.push(ator(p, '<i class="au-materia"></i>', 18 + (i * 31) % 64, 30 + (i * 17) % 40));
        for (let i = 0; i < 4; i++) a.b.push(por(ator(p, '<span style="font-size:20px">🦠</span>', 20 + i * 20, 80), { o: 0 }));
        a.dbo = ator(p, N('DBO: alta', 'au-pequeno au-errado-txt'), 50, 10);
        return a;
      },
      passos: [
        [2400, 'O esgoto tem muita <b>matéria orgânica</b> (marrom): DBO alta.'],
        [2800, 'No tanque, <b>bactérias</b> se alimentam dessa matéria e a decompõem.', a => a.b.forEach((b, i) => por(b, { o: 1, y: 40 + (i % 2) * 20, atraso: i * 200 }))],
        [3200, 'A matéria orgânica some, a <b>DBO cai</b>, e a água pode voltar ao rio sem matar os peixes.', a => { a.mo.forEach((m, i) => por(m, { o: 0, s: .2, atraso: i * 120 })); por(a.dbo, { html: N('DBO: baixa', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
