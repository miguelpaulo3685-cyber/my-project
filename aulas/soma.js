aulasMM.aulas['soma'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // ---------- caixa da lanchonete: notas, moedas e o "vai um" ----------
  // Colunas da direita para a esquerda: moedas de 1, notas de 10, notas de 100, notas de 1000.
  const TIPOS = [
    { nome: 'moedas de R$ 1', um: 'moeda de R$ 1', valor: 1, classe: 'au-moeda' },
    { nome: 'notas de R$ 10', um: 'nota de R$ 10', valor: 10, classe: 'au-nota10' },
    { nome: 'notas de R$ 100', um: 'nota de R$ 100', valor: 100, classe: 'au-nota100' },
    { nome: 'notas de R$ 1000', um: 'nota de R$ 1000', valor: 1000, classe: 'au-nota1000' }
  ];
  const partes = n => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10, Math.floor(n / 1000) % 10];
  let a = 47, b = 38;
  let mesa = null;        // depois de juntar: quantidade em cada coluna
  let sobe = [0, 0, 0, 0]; // "vai um" que chegou em cada coluna (vindo da anterior)

  const pilha = (qtd, t, novo = 0) => Array.from({ length: qtd }, (_, i) =>
    `<i class="${t.classe}${i >= qtd - novo ? ' au-nova' : ''}">${t.valor}</i>`).join('');

  function colunas() {
    const usadas = Math.max(String(a + b).length, String(a).length, String(b).length);
    return TIPOS.slice(0, usadas).map((t, i) => i).reverse();
  }

  function desenharCaixa() {
    const cols = colunas(), pa = partes(a), pb = partes(b);
    const cabeca = cols.map(i => `<b>${['Unidades', 'Dezenas', 'Centenas', 'Milhar'][i]}</b>`).join('');
    let linhas;
    if (!mesa) {
      linhas = [[a, pa, 'Venda 1'], [b, pb, 'Venda 2']].map(([n, p, nome]) =>
        `<div class="au-linha-mesa"><span class="au-rotulo-mesa">${nome}<b>R$ ${fmt(n)}</b></span>${cols.map(i => `<div class="au-pilha">${pilha(p[i], TIPOS[i])}</div>`).join('')}</div>`).join('');
    } else {
      linhas = `<div class="au-linha-mesa au-junto"><span class="au-rotulo-mesa">Tudo junto<b>${mesa.every(q => q < 10) ? 'R$ ' + fmt(a + b) : '?'}</b></span>${cols.map(i =>
        `<div class="au-pilha${mesa[i] >= 10 ? ' au-cheia' : ''}">${pilha(mesa[i], TIPOS[i], sobe[i])}${mesa[i] >= 10 ? `<em>${mesa[i]}!</em>` : ''}</div>`).join('')}</div>`;
    }
    $('mesa').innerHTML = `<div class="au-linha-mesa au-cabeca-mesa"><span></span>${cabeca}</div>${linhas}`;
    $('mesa').style.setProperty('--au-cols', cols.length);

    // Conta armada: o "1" de cada troca aparece em cima da coluna; o resultado de uma coluna
    // só aparece quando ela e as da direita já estão resolvidas (menos de 10).
    const largura = cols.length;
    const casa = (n, i) => { const d = partes(n)[i]; return n >= TIPOS[i].valor || i === 0 ? d : ''; };
    const resolvida = i => mesa && mesa.slice(0, i + 1).every(q => q < 10);
    const vaiUm = cols.map(i => `<span class="au-vai">${sobe[i] ? '1' : ''}</span>`).join('');
    const linhaNum = n => cols.map(i => `<span>${casa(n, i)}</span>`).join('');
    const resultado = cols.map(i => `<span>${resolvida(i) ? (i === largura - 1 && mesa[i] === 0 ? '' : mesa[i]) : ''}</span>`).join('');
    $('armada').innerHTML = `<div class="au-armada-grade" style="--au-cols:${largura}">
      <span></span>${vaiUm}<span>&nbsp;</span>${linhaNum(a)}<span>+</span>${linhaNum(b)}<span class="au-traco"></span><span></span>${resultado.replace(/<span>/g, '<span class="au-res">')}</div>`;

    const cheia = mesa ? mesa.findIndex(q => q >= 10) : -1;
    $('juntar').disabled = Boolean(mesa);
    $('trocar').disabled = cheia < 0;
    $('trocar').setAttribute('aria-pressed', String(cheia >= 0)); // aceso quando é a hora de trocar
    $('juntar').setAttribute('aria-pressed', String(!mesa));
    $('trocar').textContent = cheia < 0 ? '2. Trocar 10 por 1' : `2. Trocar 10 ${TIPOS[cheia].nome} por 1 ${TIPOS[cheia + 1].um}`;
    $('recado').textContent = !mesa
      ? `Duas vendas: R$ ${fmt(a)} e R$ ${fmt(b)}. Toque em "Juntar na mesa".`
      : cheia >= 0
        ? `Ficaram ${mesa[cheia]} ${TIPOS[cheia].nome}. Ninguém guarda tanta coisa solta: troque 10 delas por 1 ${TIPOS[cheia + 1].um}. Esse é o "vai um".`
        : sobe.some(Boolean)
          ? `Pronto: R$ ${fmt(a + b)}. Cada "1" pequeno em cima da conta é uma troca que você fez.`
          : `Pronto: R$ ${fmt(a + b)}. Aqui nenhuma coluna passou de 9, então não teve "vai um".`;
  }

  function novaConta(x, y) { a = x; b = y; mesa = null; sobe = [0, 0, 0, 0]; desenharCaixa(); }
  $('juntar').addEventListener('click', () => {
    const pa = partes(a), pb = partes(b);
    mesa = [0, 1, 2, 3].map(i => pa[i] + pb[i]);
    desenharCaixa();
  });
  $('trocar').addEventListener('click', () => {
    const i = mesa.findIndex(q => q >= 10);
    if (i < 0) return;
    mesa[i] -= 10; mesa[i + 1] += 1; sobe[i + 1] = 1;
    desenharCaixa();
  });
  $('recomecar').addEventListener('click', () => novaConta(a, b));
  raiz.querySelectorAll('[data-conta]').forEach(bt => bt.addEventListener('click', () => {
    const [x, y] = bt.dataset.conta.split(',').map(Number); novaConta(x, y);
  }));
  $('sortear').addEventListener('click', () => {
    const x = 20 + Math.floor(Math.random() * 480), y = 10 + Math.floor(Math.random() * 480);
    novaConta(x, y);
  });

  // ---------- duplas que fecham redondo ----------
  const CONJUNTOS = [[37, 48, 63, 52, 25, 75], [16, 91, 84, 9, 47, 53], [128, 36, 72, 64, 150, 50]];
  let conjunto = 0, fichas = [], escolhida = null;
  function prepararFichas() {
    fichas = CONJUNTOS[conjunto].map(v => ({ v, par: null }));
    escolhida = null;
    desenharFichas();
  }
  function desenharFichas() {
    const pares = [];
    fichas.forEach((f, i) => { if (f.par !== null && f.par > i) pares.push(f.v + fichas[f.par].v); });
    $('fichas').innerHTML = fichas.map((f, i) => `<button type="button" class="au-ficha${f.par !== null ? ' au-feita' : ''}${escolhida === i ? ' au-escolhida' : ''}"
      data-i="${i}" ${f.par !== null ? 'disabled' : ''} aria-pressed="${escolhida === i}">${f.v}</button>`).join('');
    const todos = fichas.every(f => f.par !== null);
    const total = fichas.reduce((s, f) => s + f.v, 0);
    $('recado2').innerHTML = todos
      ? `Fechou! ${pares.join(' + ')} = <b>${total}</b>. Na ordem da lista seria bem mais trabalhoso.`
      : pares.length ? `Duplas prontas: ${pares.join(' + ')}. Continue.` : `Soma de todos: ${fichas.map(f => f.v).join(' + ')} = ? Em vez de ir na ordem, ache as duplas.`;
  }
  $('fichas').addEventListener('click', e => {
    const bt = e.target.closest('.au-ficha');
    if (!bt) return;
    const i = Number(bt.dataset.i);
    if (escolhida === null || escolhida === i) { escolhida = escolhida === i ? null : i; return desenharFichas(); }
    const soma = fichas[escolhida].v + fichas[i].v;
    if (soma % 10 === 0) { fichas[escolhida].par = i; fichas[i].par = escolhida; escolhida = null; desenharFichas(); }
    else {
      const j = escolhida; escolhida = null; desenharFichas();
      $('recado2').textContent = `${fichas[j].v} + ${fichas[i].v} = ${soma}: não fecha redondo. Olhe só o último algarismo: qual junta com ${fichas[j].v % 10} para dar 10?`;
    }
  });
  $('outras-fichas').addEventListener('click', () => { conjunto = (conjunto + 1) % CONJUNTOS.length; prepararFichas(); });

  // ---------- compensação: passar 1 de um para o outro ----------
  let esq = 198, dir = 47;
  const redondo = n => n % 10 === 0;
  function desenharBalanca() {
    const total = esq + dir;
    $('balanca').innerHTML = `<div class="au-conta-grande"><span class="${redondo(esq) ? 'au-redondo' : ''}">${fmt(esq)}</span> + <span class="${redondo(dir) ? 'au-redondo' : ''}">${fmt(dir)}</span> = <b>${fmt(total)}</b></div>
      <div class="au-barras-soma"><i style="flex:${esq / total}">${esq >= total * .18 ? fmt(esq) : ''}</i><i style="flex:${dir / total}">${dir >= total * .18 ? fmt(dir) : ''}</i></div>
      <p class="au-legenda">A barra inteira é sempre ${fmt(total)}: só muda onde fica o corte.</p>`;
    $('passa-esq').disabled = dir <= 0; $('passa-dir').disabled = esq <= 0;
    $('recado3').textContent = redondo(esq) || redondo(dir)
      ? `Agora ficou fácil: ${fmt(esq)} + ${fmt(dir)} = ${fmt(total)}. Mesmo total, conta muito mais leve.`
      : `Passe de um em um até um dos números ficar redondo (terminar em 0). Repare que o total não muda.`;
  }
  $('passa-esq').addEventListener('click', () => { if (dir > 0) { esq++; dir--; desenharBalanca(); } });
  $('passa-dir').addEventListener('click', () => { if (esq > 0) { esq--; dir++; desenharBalanca(); } });
  raiz.querySelectorAll('[data-par]').forEach(bt => bt.addEventListener('click', () => {
    [esq, dir] = bt.dataset.par.split(',').map(Number); desenharBalanca();
  }));

  // ---------- horas: a troca é de 60 ----------
  const hm = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);
  function desenharRelogio() {
    const x = Number($('onibus').value), y = Number($('metro').value);
    $('o-onibus').textContent = hm(x); $('o-metro').textContent = hm(y);
    const hx = Math.floor(x / 60), mx = x % 60, hy = Math.floor(y / 60), my = y % 60;
    const h = hx + hy, m = mx + my;
    $('relogio').innerHTML = `<div class="au-formula" style="margin:0">${hx}h ${mx}min + ${hy}h ${my}min = ${h}h <span class="${m >= 60 ? 'au-passou' : ''}">${m}min</span></div>
      <p class="au-legenda" style="text-align:left;margin:8px 0 0">${m >= 60
        ? `${m} minutos passam de 60: troque 60 minutos por 1 hora. Sobram ${m - 60} min. Viagem: <b>${hm(x + y)}</b>.`
        : `Os minutos não passaram de 60, então não tem troca. Viagem: <b>${hm(x + y)}</b>.`}</p>`;
  }
  for (const k of ['onibus', 'metro']) $(k).addEventListener('input', desenharRelogio);

  desenharCaixa(); prepararFichas(); desenharBalanca(); desenharRelogio();

  // ---------- filminhos: cada ideia mostrada passo a passo, tocando sozinha ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const moeda = '<i class="au-moeda">1</i>', nota10 = '<i class="au-nota10">10</i>', nota100 = '<i class="au-nota100">100</i>';
  const ROTEIROS = {
    // 247 = 200 + 40 + 7
    valor: {
      montar(p) {
        const a = {
          d: ['2', '4', '7'].map((t, k) => ator(p, N(t), 44 + k * 6, 38)),
          rot: ['centenas', 'dezenas', 'unidades'].map((t, k) => ator(p, N(t, 'au-pequeno'), 20 + k * 30, 14)),
          din: [], conta: ator(p, N('200 + 40 + 7 = 247', 'au-medio'), 50, 90)
        };
        a.rot.forEach(r => por(r, { o: 0 })); por(a.conta, { o: 0 });
        [[2, nota100, 20, 2, 12.5], [4, nota10, 50, 2, 12.5], [7, moeda, 80, 4, 7]].forEach(([q, h, x, naLinha, passo]) => {
          for (let k = 0; k < q; k++) a.din.push(por(ator(p, h, x + (k % naLinha - (naLinha - 1) / 2) * passo, 56 + Math.floor(k / naLinha) * 12), { o: 0, s: .4 }));
        });
        return a;
      },
      passos: [
        [1800, 'Este é o número <b>247</b>. Parece um número só, mas ele é um pacote.'],
        [2600, 'Cada algarismo mora numa <b>casa</b>: centenas, dezenas e unidades.', a => {
          ['au-cor-c', 'au-cor-d', 'au-cor-u'].forEach((c, k) => { a.d[k].firstChild.classList.add(c); por(a.d[k], { x: 20 + k * 30, y: 34 }); por(a.rot[k], { o: 1 }); });
        }],
        [3200, 'Na casa das centenas, o 2 vale <b>2 notas de 100</b>. O 4 vale <b>4 notas de 10</b>. O 7 vale <b>7 moedas</b>.', a => {
          a.din.forEach((d, k) => por(d, { o: 1, s: 1, atraso: k * 90 }));
        }],
        [3400, 'Então 247 = <b>200 + 40 + 7</b>. O mesmo "2" valeria 2 se estivesse nas unidades.', a => por(a.conta, { o: 1 })]
      ]
    },
    // armar 125 + 37
    alinhar: {
      montar(p) {
        const a = {
          col: ['C', 'D', 'U'].map((t, k) => ator(p, '', 26 + k * 18, 50, 'au-faixa')),
          tit: ['centena', 'dezena', 'unidade'].map((t, k) => ator(p, N(t, 'au-pequeno'), 26 + k * 18, 6)),
          de1: ['1', '2', '5'].map((t, k) => ator(p, N(t), 26 + k * 18, 26)),
          de2: ['3', '7'].map((t, k) => por(ator(p, N(t, 'au-errado-txt'), 26 + k * 18, 50), { o: 0 })),
          mais: por(ator(p, N('+'), 10, 50), { o: 0 }),
          selo: por(ator(p, '', 85, 50, 'au-balao'), { o: 0 }),
          res: ['1', '6', '2'].map((t, k) => por(ator(p, N(t, 'au-certo-txt'), 26 + k * 18, 78), { o: 0 }))
        };
        return a;
      },
      passos: [
        [2000, 'Vamos armar <b>125 + 37</b>. Cada coluna é uma casa: centena, dezena e unidade.'],
        [3200, 'Erro comum: começar o 37 pela esquerda. Aí o 3 (que vale <b>30</b>) cai na casa das <b>centenas</b>.', a => {
          a.de2.forEach(d => por(d, { o: 1 })); por(a.mais, { o: 1 }); por(a.selo, { o: 1, html: '✗ errado' }); a.selo.style.background = 'var(--errado)'; a.selo.style.color = '#fff';
        }],
        [3200, 'O certo: <b>unidade embaixo de unidade</b>. O 7 vai para baixo do 5, e o 3 para baixo do 2.', a => {
          a.de2.forEach((d, k) => { por(d, { x: 44 + k * 18 }); d.firstChild.classList.replace('au-errado-txt', 'au-certo-txt'); });
          por(a.selo, { html: '✓ certo' }); a.selo.style.background = 'var(--certo)';
        }],
        [3000, 'Agora cada casa soma com a sua: 5 + 7, 2 + 3, 1 + 0. Resultado: <b>162</b>.', a => a.res.forEach((r, k) => por(r, { o: 1, atraso: (2 - k) * 350 }))]
      ]
    },
    // 47 + 38: o "vai um" é uma troca
    vaiUm: {
      montar(p) {
        const a = { ud: [], dz: [] };
        ator(p, N('dezenas', 'au-pequeno'), 20, 8); ator(p, N('unidades', 'au-pequeno'), 52, 8);
        for (let k = 0; k < 15; k++) a.ud.push(ator(p, moeda, 38 + (k < 7 ? k : k - 7) * 5.6, k < 7 ? 26 : 44));
        for (let k = 0; k < 7; k++) a.dz.push(ator(p, nota10, k < 4 ? 14 : 26, 24 + (k < 4 ? k : k - 4) * 11));
        a.nova = por(ator(p, nota10, 50, 56), { o: 0, s: .3 });
        a.conta = ator(p, `<div class="au-armadinha"><span></span><span class="au-v1"></span><span></span><span></span><span>4</span><span>7</span><span>+</span><span>3</span><span>8</span><i></i><span></span><span class="au-r1"></span><span class="au-r2"></span></div>`, 88, 46);
        return a;
      },
      passos: [
        [2600, 'Conta: <b>47 + 38</b>. Comece pelas unidades: <b>7 moedas</b> de uma venda e <b>8 moedas</b> da outra.'],
        [2600, 'Junte tudo: são <b>15 moedas</b>. Na conta isso daria um "15" numa casa só, e não pode.', a => {
          a.ud.forEach((m, k) => por(m, { x: 40 + (k % 5) * 6.2, y: 26 + Math.floor(k / 5) * 13, atraso: k * 30 }));
        }],
        [2800, 'Separe <b>10 moedas</b>. 10 moedas de R$ 1 valem o mesmo que <b>1 nota de R$ 10</b>.', a => {
          a.ud.slice(0, 10).forEach((m, k) => por(m, { x: 50 + (k % 5 - 2) * 1.2, y: 58 + Math.floor(k / 5) * 2, atraso: k * 40 }));
          a.ud.slice(10).forEach((m, k) => por(m, { y: 26, x: 40 + k * 6.2 }));
        }],
        [3200, 'Troque! As 10 moedas viram 1 nota, que vai para as <b>dezenas</b>. Esse é o "vai um".', a => {
          a.ud.slice(0, 10).forEach(m => por(m, { o: 0, s: .4 }));
          por(a.nova, { o: 1, s: 1 });
          setTimeout(() => { por(a.nova, { x: 26, y: 57 }); a.conta.querySelector('.au-v1').textContent = '1'; }, 700);
        }],
        [3600, 'Sobraram <b>5 moedas</b> e ficaram <b>4 + 3 + 1 = 8 notas de 10</b>. Resultado: <b>85</b>.', a => {
          a.conta.querySelector('.au-r2').textContent = '5';
          setTimeout(() => { a.conta.querySelector('.au-r1').textContent = '8'; }, 700);
        }]
      ]
    },
    // 247 + 138 por partes
    partes: {
      montar(p) {
        const pecas = (vals, y) => vals.map((v, k) => ator(p, N(v, 'au-medio ' + ['au-cor-c', 'au-cor-d', 'au-cor-u'][k]), 50, y));
        const a = { n1: ator(p, N('247'), 30, 20), n2: ator(p, N('138'), 70, 20), mais: ator(p, N('+'), 50, 20),
          p1: pecas(['200', '40', '7'], 20), p2: pecas(['100', '30', '8'], 20),
          s: ['300', '70', '15'].map((v, k) => ator(p, N(v, 'au-medio'), 18 + k * 32, 66)),
          total: ator(p, N('300 + 70 + 15 = 385', 'au-medio'), 50, 90) };
        [...a.p1, ...a.p2, ...a.s, a.total].forEach(e => por(e, { o: 0 }));
        a.p1.forEach(e => por(e, { x: 30 })); a.p2.forEach(e => por(e, { x: 70 }));
        return a;
      },
      passos: [
        [2000, 'De cabeça: <b>247 + 138</b>. Primeiro, abra cada número nas suas partes.'],
        [3000, '247 vira <b>200 + 40 + 7</b>. 138 vira <b>100 + 30 + 8</b>.', a => {
          por(a.n1, { o: 0 }); por(a.n2, { o: 0 }); por(a.mais, { o: 0 });
          a.p1.forEach((e, k) => por(e, { o: 1, x: 18 + k * 32, y: 22 })); a.p2.forEach((e, k) => por(e, { o: 1, x: 18 + k * 32, y: 42 }));
        }],
        [3000, 'Some <b>parte com parte</b>, começando pela maior: 200 + 100, depois 40 + 30, depois 7 + 8.', a => {
          [...a.p1, ...a.p2].forEach(e => por(e, { y: 56, o: 0 })); a.s.forEach((e, k) => por(e, { o: 1, atraso: k * 500 }));
        }],
        [3000, 'Agora é só juntar: <b>300 + 70 + 15 = 385</b>. Logo no começo você já sabia que passava de 300.', a => por(a.total, { o: 1 })]
      ]
    },
    // duplas que fecham redondo
    duplas: {
      montar(p) {
        const a = { c: [[37, 14, 26], [48, 40, 72], [63, 66, 22], [52, 88, 70]].map(([v, x, y]) => ator(p, `<span class="au-chip">${v}</span>`, x, y)),
          r: [ator(p, '<span class="au-chip au-ok">100</span>', 30, 30), ator(p, '<span class="au-chip au-ok">100</span>', 70, 30)],
          total: ator(p, N('100 + 100 = 200', 'au-medio'), 50, 76) };
        [...a.r, a.total].forEach(e => por(e, { o: 0, s: .6 }));
        return a;
      },
      passos: [
        [2400, 'Conta: <b>37 + 48 + 63 + 52</b>. Na ordem, dá trabalho. Olhe só os <b>últimos algarismos</b>.'],
        [2800, '7 e 3 fazem 10. Junte o <b>37 com o 63</b>: dá <b>100</b> certinho.', a => {
          por(a.c[0], { x: 24, y: 30 }); por(a.c[2], { x: 36, y: 30 });
          setTimeout(() => { por(a.c[0], { o: 0, x: 30 }); por(a.c[2], { o: 0, x: 30 }); por(a.r[0], { o: 1, s: 1 }); }, 900);
        }],
        [2800, '8 e 2 também fazem 10. <b>48 com 52</b>: mais <b>100</b>.', a => {
          por(a.c[1], { x: 64, y: 30 }); por(a.c[3], { x: 76, y: 30 });
          setTimeout(() => { por(a.c[1], { o: 0, x: 70 }); por(a.c[3], { o: 0, x: 70 }); por(a.r[1], { o: 1, s: 1 }); }, 900);
        }],
        [3000, 'Total: <b>200</b>. A ordem das parcelas não muda a soma, então escolha a ordem mais fácil.', a => por(a.total, { o: 1, s: 1 })]
      ]
    },
    // compensação: 198 + 47 = 200 + 45
    compensa: {
      montar(p) {
        const a = { azul: ator(p, '198', 38, 40, 'au-bloquinho'), verde: ator(p, '47', 80, 40, 'au-bloquinho'),
          u: [0, 1].map(k => por(ator(p, moeda, 88 - k * 5, 40), { o: 0 })),
          conta: ator(p, N('198 + 47', 'au-medio'), 50, 76) };
        a.azul.style.cssText += ';width:58%;background:#3f87c9'; a.verde.style.cssText += ';width:16%;background:#2f9e6a';
        return a;
      },
      passos: [
        [2400, '<b>198 + 47</b> parece chato. Mas o 198 está pertinho do 200: só faltam <b>2</b>.'],
        [2600, 'Pegue <b>2</b> do 47…', a => { a.u.forEach(m => por(m, { o: 1, y: 22 })); por(a.verde, { html: '45' }); }],
        [2600, '…e entregue para o 198. Ele vira <b>200</b>, um número redondo.', a => {
          a.u.forEach((m, k) => por(m, { x: 64 - k * 3, y: 40, atraso: k * 200 }));
          setTimeout(() => { a.u.forEach(m => por(m, { o: 0 })); por(a.azul, { html: '200' }); a.azul.style.boxShadow = '0 0 0 3px var(--certo)'; }, 900);
        }],
        [3400, 'Nada sumiu, só mudou de lugar. <b>200 + 45 = 245</b>, igual a 198 + 47.', a => por(a.conta, { html: N('200 + 45 = 245', 'au-medio au-certo-txt') })]
      ]
    },
    // estimativa
    estimar: {
      montar(p) {
        const linhas = [['1 987', '2 000'], ['512', '500'], ['498', '500']];
        const a = { de: [], para: [], seta: [] };
        linhas.forEach(([d, q], k) => {
          a.de.push(ator(p, N(d, 'au-medio'), 26, 18 + k * 20));
          a.seta.push(por(ator(p, N('→', 'au-medio'), 50, 18 + k * 20), { o: 0 }));
          a.para.push(por(ator(p, N(q, 'au-medio au-cor-d'), 74, 18 + k * 20), { o: 0 }));
        });
        a.soma = por(ator(p, N('≈ 3 000', 'au-medio au-cor-d'), 74, 84), { o: 0 });
        a.exato = por(ator(p, N('exato: 2 997', 'au-pequeno'), 28, 84), { o: 0 });
        return a;
      },
      passos: [
        [2200, 'Três gastos para somar. Antes da conta exata, <b>arredonde</b> cada um.'],
        [3000, '1 987 fica perto de <b>2 000</b>. 512 e 498 ficam perto de <b>500</b>.', a => a.para.forEach((e, k) => { por(a.seta[k], { o: 1, atraso: k * 400 }); por(e, { o: 1, atraso: k * 400 }); })],
        [2600, 'Arredondado é fácil: 2 000 + 500 + 500 = <b>3 000</b>.', a => por(a.soma, { o: 1 })],
        [3200, 'A conta exata dá <b>2 997</b>. Se a sua desse 3 997, a estimativa já mostraria o erro.', a => por(a.exato, { o: 1 })]
      ]
    },
    // horas: troca de 60
    horas: {
      montar(p) {
        const a = { rel: ator(p, '<i class="au-hora"></i><i class="au-min"></i>', 28, 50, 'au-relogio-filme'),
          tela: ator(p, N('13h50', ''), 72, 30), mais: por(ator(p, N('+ 25 min', 'au-medio au-cor-d'), 72, 52), { o: 0 }),
          balao: por(ator(p, '', 72, 76, 'au-balao'), { o: 0 }) };
        a.min = a.rel.querySelector('.au-min'); a.hora = a.rel.querySelector('.au-hora');
        a.min.style.transform = 'rotate(300deg)'; a.hora.style.transform = 'rotate(55deg)';
        return a;
      },
      passos: [
        [2400, 'O ônibus sai às <b>13h50</b> e a viagem dura <b>25 minutos</b>. A que horas ele chega?'],
        [3400, 'O ponteiro dos minutos anda 25. Quando passa do 12, completou <b>60 minutos</b>…', a => {
          por(a.mais, { o: 1 }); a.min.style.transform = 'rotate(450deg)'; a.hora.style.transform = 'rotate(67.5deg)';
        }],
        [3000, '…e <b>60 minutos viram 1 hora</b>. É o "vai um" do relógio: a troca é de 60, não de 10.', a => {
          por(a.balao, { o: 1, html: '50 + 25 = 75 min<br>= 1 hora + 15 min' });
        }],
        [3200, 'A hora sobe de 13 para 14 e sobram 15 minutos: chega às <b>14h15</b>, e não "13h75".', a => { por(a.tela, { html: N('14h15', 'au-certo-txt') }); por(a.mais, { o: 0 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
