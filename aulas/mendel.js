aulasMM.aulas['mendel'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const GENOTIPOS = ['AA', 'Aa', 'aa'];
  let p1 = 'Aa', p2 = 'Aa';
  const ervilha = g => `<i class="au-gen-ervilha ${g.includes('A') ? 'au-gen-amarela' : 'au-gen-verde'}"></i>`;
  const ordenar = (x, y) => (x === 'A' || y === 'a') ? x + y : y + x; // a maiúscula vem primeiro
  const pct = n => `${aulasMM.br(n * 100, n * 100 % 1 ? 1 : 0)}%`;
  const barra = (rotulo, n, total) => `<div class="au-gen-barra"><b>${rotulo}</b><span><i style="width:${n / total * 100}%"></i></span><em>${pct(n / total)}</em></div>`;
  function filhos() {
    const lista = [];
    for (const x of p1) for (const y of p2) lista.push(ordenar(x, y));
    return lista;
  }
  function desenhar() {
    for (const [id, atual] of [['p1', p1], ['p2', p2]]) {
      $(id).innerHTML = GENOTIPOS.map(g => `<button type="button" data-g="${g}" aria-pressed="${g === atual}">${ervilha(g)} ${g}</button>`).join('');
    }
    const f = filhos();
    $('quadro').innerHTML = `<b></b><b>${p2[0]}</b><b>${p2[1]}</b>` +
      [0, 1].map(i => `<b>${p1[i]}</b>` + [0, 1].map(j => { const g = f[i * 2 + j]; return `<span>${ervilha(g)}${g}<small>${g.includes('A') ? 'amarela' : 'verde'}</small></span>`; }).join('')).join('');
    $('quadro').setAttribute('aria-label', `Filhos possíveis: ${f.join(', ')}`);
    const conta = g => f.filter(x => x === g).length;
    const amarelas = f.filter(x => x.includes('A')).length;
    $('barras').innerHTML = barra('AA', conta('AA'), 4) + barra('Aa', conta('Aa'), 4) + barra('aa', conta('aa'), 4) +
      barra('🟡 amarelas', amarelas, 4) + barra('🟢 verdes', 4 - amarelas, 4);
    const verdes = 4 - amarelas;
    let txt = `Cada planta manda um alelo em cada gameta (as letras na borda do quadro). Chance de verde: ${verdes} em 4 = ${pct(verdes / 4)}.`;
    if (p1 === 'Aa' && p2 === 'Aa') txt = 'Aa × Aa: 1 AA, 2 Aa e 1 aa. Amarelas para verdes = 3 : 1, a proporção clássica de Mendel.';
    else if ((p1 === 'Aa' && p2 === 'aa') || (p1 === 'aa' && p2 === 'Aa')) txt = 'Aa × aa: metade amarela, metade verde (1 : 1). É o cruzamento-teste: se aparece verde, a amarela era Aa.';
    else if (verdes === 0) txt = `Nenhuma verde: todo filho recebe pelo menos um A, e o A domina. ${conta('Aa') === 4 ? 'Mas todos carregam o a escondido (são Aa).' : conta('Aa') ? 'Mas metade carrega o a escondido (é Aa).' : ''}`;
    else if (verdes === 4) txt = 'aa × aa: só verdes. O recessivo só aparece em dose dupla, e aqui não há nenhum A.';
    $('recado').textContent = txt;
  }
  for (const id of ['p1', 'p2']) $(id).addEventListener('click', e => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    if (id === 'p1') p1 = b.dataset.g; else p2 = b.dataset.g;
    desenhar();
  });
  $('plantar').addEventListener('click', () => {
    let amarelas = 0;
    for (let k = 0; k < 100; k++) {
      const g = p1[Math.random() < .5 ? 0 : 1] + p2[Math.random() < .5 ? 0 : 1];
      if (g.includes('A')) amarelas++;
    }
    const esperado = filhos().filter(x => x.includes('A')).length * 25;
    $('recado').textContent = `Nasceram ${amarelas} amarelas e ${100 - amarelas} verdes. A conta previa ${esperado} e ${100 - esperado}. Com poucas sementes o resultado varia; com milhares, chega perto da conta (foi assim que Mendel percebeu).`;
  });
  desenhar();

  // ---------- filminho: gerações ----------
  const { ator, por } = aulasMM;
  const E = cor => `<i class="au-gen-ervilha au-gen-${cor}" style="width:22px;height:22px"></i>`;
  const T = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    geracoes: {
      montar(p) {
        const a = {
          pa: ator(p, E('amarela'), 38, 18), pv: ator(p, E('verde'), 62, 18), tp: ator(p, T('AA × aa'), 50, 30),
          f1: [0, 1, 2, 3].map(k => por(ator(p, E('amarela'), 32 + k * 12, 50), { o: 0 })), t1: por(ator(p, T('todos Aa: amarelos'), 50, 61), { o: 0 }),
          f2: ['amarela', 'amarela', 'amarela', 'verde'].map((c, k) => por(ator(p, E(c), 32 + k * 12, 80), { o: 0 })), t2: por(ator(p, T('3 amarelas : 1 verde'), 50, 91), { o: 0 })
        };
        return a;
      },
      passos: [
        [2600, 'Geração P: uma ervilha amarela pura (<b>AA</b>) cruzada com uma verde pura (<b>aa</b>).'],
        [2800, 'Geração F1: todos os filhos são <b>Aa</b> e saem <b>amarelos</b>. O verde "sumiu"?', a => { a.f1.forEach((e, k) => por(e, { o: 1, atraso: k * 150 })); por(a.t1, { o: 1 }); }],
        [3000, 'Cruzando dois F1 (Aa × Aa), o verde volta: <b>3 amarelas para 1 verde</b>. Ele só estava escondido.', a => { a.f2.forEach((e, k) => por(e, { o: 1, atraso: k * 150 })); por(a.t2, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
