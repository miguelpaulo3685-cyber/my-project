aulasMM.aulas['relacoes-ecologicas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- classifique a relação ----------
  const SINAIS = [['mm', '+ / +'], ['m0', '+ / 0'], ['mn', '+ / −'], ['nn', '− / −']];
  // [emoji 1, ser 1, emoji 2, ser 2, situação, sinais, nome, por quê]
  const CASOS = [
    ['🐄', 'Boi', '🐦', 'Anu', 'O anu pousa no boi e come os carrapatos dele.', 'mm', 'Protocooperação', 'Os dois ganham: o anu se alimenta e o boi fica livre dos carrapatos. Mas cada um consegue viver sem o outro.'],
    ['🦈', 'Tubarão', '🐟', 'Rêmora', 'A rêmora acompanha o tubarão e come os restos das caçadas dele.', 'm0', 'Comensalismo', 'A rêmora ganha comida; o tubarão nem ganha nem perde.'],
    ['🐕', 'Cachorro', '🕷️', 'Carrapato', 'O carrapato vive preso ao cachorro, sugando o sangue dele.', 'mn', 'Parasitismo', 'O carrapato ganha (alimento); o cachorro perde, mas em geral não morre: o parasita precisa do hospedeiro vivo.'],
    ['🪵', 'Cupim', '🦠', 'Protozoário do intestino', 'Os protozoários no intestino do cupim digerem a madeira que ele come.', 'mm', 'Mutualismo', 'Os dois ganham e um não vive sem o outro: o cupim não digere madeira sozinho, e o protozoário não vive fora do cupim.'],
    ['🦁', 'Leão', '🦓', 'Zebra', 'O leão caça e mata a zebra para comer.', 'mn', 'Predação', 'O leão ganha alimento; a zebra perde a vida.'],
    ['🌳', 'Árvore', '🌸', 'Orquídea', 'A orquídea cresce apoiada no tronco da árvore, sem tirar seiva dela.', 'm0', 'Inquilinismo', 'A orquídea ganha um lugar com mais luz; a árvore não ganha nem perde. É parecido com o comensalismo, só que o ganho é abrigo.'],
    ['🌾', 'Capim A', '🌾', 'Capim B', 'Duas espécies de capim disputam água e nutrientes do mesmo solo.', 'nn', 'Competição', 'Os dois perdem: cada um fica com menos recurso do que teria sozinho.'],
    ['🍄', 'Fungo', '🟢', 'Alga', 'No líquen, a alga faz fotossíntese e o fungo guarda água e protege a alga.', 'mm', 'Mutualismo', 'Os dois ganham e vivem juntos como se fossem um organismo só: o líquen.'],
    ['🐜', 'Formiga A', '🐜', 'Formiga B', 'Uma espécie de formiga invade o ninho de outra, rouba larvas e as cria para trabalhar para ela.', 'mn', 'Esclavagismo', 'Uma espécie ganha trabalhadoras; a outra perde parte da colônia.']
  ];
  let ordem = CASOS.map((_, k) => k).sort(() => Math.random() - .5), i = 0, acertos = 0, feitos = 0, respondeu = false;
  function caso() {
    const [e1, n1, e2, n2, sit] = CASOS[ordem[i]];
    respondeu = false;
    $('caso').innerHTML = `<div class="au-dupla"><span><b>${e1}</b>${n1}</span><i>e</i><span><b>${e2}</b>${n2}</span></div><p>${sit}</p>`;
    $('opcoes').innerHTML = SINAIS.map(([id, t]) => `<button type="button" class="au-alt" data-s="${id}">${t}<small>${n1} / ${n2}</small></button>`).join('');
    $('recado').textContent = 'O que acontece com cada um? Escolha os sinais (+ ganha, − perde, 0 nem liga).';
    $('proximo').disabled = true;
    $('placar').textContent = feitos ? `${acertos} de ${feitos} certos` : '';
  }
  $('opcoes').addEventListener('click', e => {
    const b = e.target.closest('[data-s]');
    if (!b || respondeu) return;
    const [, , , , , certo, nome, porque] = CASOS[ordem[i]];
    respondeu = true; feitos++;
    const ok = b.dataset.s === certo;
    if (ok) acertos++;
    $('opcoes').querySelectorAll('[data-s]').forEach(x => x.classList.toggle('au-certa', x.dataset.s === certo));
    if (!ok) b.classList.add('au-errada');
    $('recado').innerHTML = `${ok ? 'Isso!' : 'Quase.'} É <b>${nome}</b>. ${porque}`;
    $('proximo').disabled = false;
    $('placar').textContent = `${acertos} de ${feitos} certos`;
  });
  $('proximo').addEventListener('click', () => { i = (i + 1) % CASOS.length; if (i === 0) ordem = ordem.sort(() => Math.random() - .5); caso(); });
  caso();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const linha = (sinal, emojis, nome, y, cor) => `<div class="au-linha-relacao" style="--c:${cor}"><b>${sinal}</b><span>${emojis}</span><em>${nome}</em></div>`;
  // Curva desenhada aos poucos: o traço começa escondido e a transição revela.
  const curva = (d, cor) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="3" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" style="transition:stroke-dashoffset 2.6s linear"/>`;
  const ROTEIROS = {
    sinais: {
      montar(p) {
        const L = [['+ +', '🐝🌸', 'mutualismo · protocooperação', '#2f9e6a'], ['+ 0', '🦈🐟', 'comensalismo · inquilinismo', '#62a8ea'], ['+ −', '🦁🦓', 'predação · parasitismo', '#e9b949'], ['− −', '🌾🌾', 'competição', '#c94b4b']];
        return { l: L.map(([s, e, n, c], k) => por(ator(p, linha(s, e, n, 0, c), 50, 14 + k * 23), { o: 0 })) };
      },
      passos: [
        [2400, '<b>+ +</b>: os dois ganham. É harmônica.', a => por(a.l[0], { o: 1 })],
        [2400, '<b>+ 0</b>: um ganha e o outro nem percebe. Também é harmônica.', a => por(a.l[1], { o: 1 })],
        [2400, '<b>+ −</b>: um ganha à custa do outro. É desarmônica.', a => por(a.l[2], { o: 1 })],
        [3000, '<b>− −</b>: os dois perdem disputando o mesmo recurso. Com esses quatro sinais você classifica qualquer relação.', a => por(a.l[3], { o: 1 })]
      ]
    },
    ondas: {
      montar(p) {
        const presa = 'M10 90 C 40 20, 60 20, 90 80 S 140 140, 170 70 S 220 20, 250 80 S 290 120, 300 90';
        const pred = 'M10 110 C 50 100, 70 60, 105 60 S 150 120, 185 105 S 230 60, 265 65 S 295 100, 300 105';
        const a = { g: ator(p, `<svg viewBox="0 0 310 150" style="width:min(310px,84vw);margin:0">${curva(presa, '#62a8ea')}${curva(pred, '#c94b4b')}
          <line x1="8" y1="140" x2="302" y2="140" stroke="currentColor" opacity=".4"/><text x="300" y="150" text-anchor="end">tempo</text></svg>`, 50, 50) };
        a.leg = por(ator(p, '<span class="au-leg"><i style="background:#62a8ea"></i>lebres (presa)</span>', 24, 8), { o: 0 });
        a.leg2 = por(ator(p, '<span class="au-leg"><i style="background:#c94b4b"></i>linces (predador)</span>', 72, 8), { o: 0 });
        return a;
      },
      passos: [
        [3200, 'As <b>lebres</b> (presa) aumentam, diminuem e voltam a aumentar.', a => { por(a.leg, { o: 1 }); a.g.querySelectorAll('path')[0].style.strokeDashoffset = 0; }],
        [3400, 'Os <b>linces</b> (predador) seguem o mesmo vaivém, mas <b>um pouco depois</b>: primeiro sobe a comida, depois sobe quem come.', a => { por(a.leg2, { o: 1 }); a.g.querySelectorAll('path')[1].style.strokeDashoffset = 0; }],
        [2800, 'Um controla o outro: é assim que predador e presa se equilibram na natureza.']
      ]
    },
    gause: {
      montar(p) {
        const sobe = 'M10 130 C 60 128, 90 40, 140 30 S 290 26, 300 26', some = 'M10 130 C 50 120, 80 70, 120 75 S 200 135, 300 138';
        const a = { g: ator(p, `<svg viewBox="0 0 310 150" style="width:min(310px,84vw);margin:0">${curva(sobe, '#2f9e6a')}${curva(some, '#e9b949')}
          <line x1="8" y1="140" x2="302" y2="140" stroke="currentColor" opacity=".4"/><text x="300" y="150" text-anchor="end">dias juntas no mesmo pote</text></svg>`, 50, 50) };
        a.t1 = por(ator(p, '<span class="au-leg"><i style="background:#2f9e6a"></i>espécie A</span>', 24, 8), { o: 0 });
        a.t2 = por(ator(p, '<span class="au-leg"><i style="background:#e9b949"></i>espécie B</span>', 72, 8), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Duas espécies de paramécio que comem <b>a mesma coisa</b> são postas no mesmo pote.', a => { por(a.t1, { o: 1 }); por(a.t2, { o: 1 }); }],
        [3400, 'No começo as duas crescem. Mas a espécie A é um pouco melhor em pegar comida…', a => a.g.querySelectorAll('path').forEach(c => { c.style.strokeDashoffset = 0; })],
        [3000, '…e a espécie B acaba <b>sumindo</b> do pote. Mesmo recurso, mesmo lugar: uma exclui a outra.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
