aulasMM.aulas['subtracao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const TIPOS = [
    { nome: 'moedas de R$ 1', um: 'moeda', valor: 1, classe: 'au-moeda' },
    { nome: 'notas de R$ 10', um: 'nota de R$ 10', valor: 10, classe: 'au-nota10' },
    { nome: 'notas de R$ 100', um: 'nota de R$ 100', valor: 100, classe: 'au-nota100' },
    { nome: 'notas de R$ 1000', um: 'nota de R$ 1000', valor: 1000, classe: 'au-nota1000' }
  ];
  const CASAS = ['Unidades', 'Dezenas', 'Centenas', 'Milhar'];
  const partes = n => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10, Math.floor(n / 1000) % 10];

  // ---------- caixa: tirar e destrocar ----------
  let a = 85, b = 32, mesa, feitas, emCima;
  const largura = () => String(a).length;
  function novaConta(x, y) { a = x; b = y; mesa = partes(a); feitas = 0; emCima = [null, null, null, null]; desenhar(); }
  const pilha = (q, t) => Array.from({ length: q }, () => `<i class="${t.classe}">${t.valor}</i>`).join('');

  function desenhar() {
    const n = largura(), cols = [...Array(n).keys()].reverse(), pb = partes(b), c = feitas;
    const pronto = feitas >= n;
    $('mesa').style.setProperty('--au-cols', n);
    $('mesa').innerHTML = `<div class="au-linha-mesa au-cabeca-mesa"><span></span>${cols.map(i => `<b>${CASAS[i]}</b>`).join('')}</div>
      <div class="au-linha-mesa"><span class="au-rotulo-mesa">Você tem<b>${pronto ? 'R$ ' + fmt(a - b) : 'R$ ' + fmt(a)}</b></span>${cols.map(i =>
        `<div class="au-pilha${i === c && !pronto ? ' au-atual' : ''}${i === c && !pronto && mesa[i] < pb[i] ? ' au-cheia' : ''}">${pilha(mesa[i], TIPOS[i])}</div>`).join('')}</div>
      <div class="au-linha-mesa au-apagar"><span class="au-rotulo-mesa">Tirar<b>R$ ${fmt(b)}</b></span>${cols.map(i =>
        `<div class="au-pilha au-fantasma">${i < feitas ? '<span class="au-ok-col">✓</span>' : pilha(pb[i], TIPOS[i])}</div>`).join('')}</div>`;

    const casa = (num, i) => (num >= TIPOS[i].valor || i === 0 ? partes(num)[i] : '');
    $('armada').innerHTML = `<div class="au-armada-grade" style="--au-cols:${n}">
      <span></span>${cols.map(i => `<span class="au-vai">${emCima[i] !== null ? emCima[i] : ''}</span>`).join('')}
      <span>&nbsp;</span>${cols.map(i => `<span class="${emCima[i] !== null ? 'au-riscado' : ''}">${casa(a, i)}</span>`).join('')}
      <span>−</span>${cols.map(i => `<span>${casa(b, i)}</span>`).join('')}
      <span class="au-traco"></span><span></span>${cols.map(i => `<span class="au-res">${i < feitas ? (i === n - 1 && mesa[i] === 0 && n > 1 ? '' : mesa[i]) : ''}</span>`).join('')}</div>`;

    const falta = !pronto && mesa[c] < pb[c];
    $('destrocar').disabled = !falta;
    $('tirar').disabled = pronto || falta;
    $('destrocar').setAttribute('aria-pressed', String(falta));
    $('tirar').setAttribute('aria-pressed', String(!pronto && !falta));
    const k = falta ? mesa.findIndex((q, j) => j > c && q > 0) : -1;
    $('destrocar').textContent = k > 0 ? `Destrocar 1 ${TIPOS[k].um} em 10 ${TIPOS[k - 1].nome}` : 'Destrocar 1 nota';
    $('tirar').textContent = pronto ? 'Tirar' : `Tirar ${pb[c]} ${TIPOS[c].nome}`;
    $('recado').textContent = pronto
      ? `Pronto: sobraram R$ ${fmt(a - b)}. Confira somando: ${fmt(a - b)} + ${fmt(b)} = ${fmt(a)}.`
      : falta
        ? (k === c + 1
          ? `Nas ${CASAS[c].toLowerCase()} você precisa tirar ${pb[c]}, mas só tem ${mesa[c]}. Destroque 1 ${TIPOS[k].um} da casa ao lado.`
          : `Não tem nada na casa ao lado. Destroque primeiro 1 ${TIPOS[k].um}, de mais longe, e vá descendo.`)
        : `Coluna das ${CASAS[c].toLowerCase()}: tem ${mesa[c]}, tire ${pb[c]}.`;
  }
  $('tirar').addEventListener('click', () => { const pb = partes(b); mesa[feitas] -= pb[feitas]; feitas++; desenhar(); });
  $('destrocar').addEventListener('click', () => {
    const k = mesa.findIndex((q, j) => j > feitas && q > 0);
    if (k < 1) return;
    mesa[k]--; mesa[k - 1] += 10; emCima[k] = mesa[k]; emCima[k - 1] = mesa[k - 1];
    desenhar();
  });
  $('recomecar').addEventListener('click', () => novaConta(a, b));
  raiz.querySelectorAll('[data-conta]').forEach(bt => bt.addEventListener('click', () => {
    const [x, y] = bt.dataset.conta.split(',').map(Number); novaConta(x, y);
  }));
  novaConta(85, 32);

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const moeda = '<i class="au-moeda">1</i>', nota10 = '<i class="au-nota10">10</i>';
  const fig = '<i class="au-fig"></i>';
  const xReta = (v, de, ate) => 8 + (v - de) / (ate - de) * 84;
  const ROTEIROS = {
    sentidos: {
      montar(p) {
        const a = { ana: [], bia: [], vaga: [] };
        a.nome1 = por(ator(p, N('Ana', 'au-pequeno'), 7, 30), { o: 0 });
        a.nome2 = por(ator(p, N('Bia', 'au-pequeno'), 7, 58), { o: 0 });
        for (let k = 0; k < 12; k++) a.ana.push(ator(p, fig, 16 + k * 6.6, 40));
        for (let k = 0; k < 5; k++) a.bia.push(por(ator(p, fig, 16 + k * 6.6, 62), { o: 0 }));
        for (let k = 5; k < 12; k++) a.vaga.push(por(ator(p, '<i class="au-fig au-vaga"></i>', 16 + k * 6.6, 62), { o: 0 }));
        a.conta = por(ator(p, N('12 − 5 = 7', 'au-medio'), 50, 86), { o: 0 });
        return a;
      },
      passos: [
        [2400, '<b>Tirar.</b> Você tem <b>12 figurinhas</b> e dá 5 para um amigo.'],
        [2600, 'Saíram 5. Sobraram <b>7</b>.', a => a.ana.slice(7).forEach((f, k) => por(f, { x: 112, o: 0, atraso: k * 120 }))],
        [3000, '<b>Comparar.</b> Ana tem 12 e Bia tem 5. Lado a lado, sobram <b>7 a mais</b> para a Ana.', a => {
          a.ana.forEach((f, k) => { por(f, { x: 16 + k * 6.6, y: 30, o: 1, atraso: 0 }); f.firstChild.classList.toggle('au-destaque', k >= 5); });
          a.bia.forEach(f => por(f, { o: 1 })); por(a.nome1, { o: 1 }); por(a.nome2, { o: 1 });
        }],
        [3000, '<b>Completar.</b> A meta da Bia é 12 e ela tem 5. Os espaços vazios mostram que <b>faltam 7</b>.', a => a.vaga.forEach((f, k) => por(f, { o: 1, atraso: k * 100 }))],
        [2600, 'Três perguntas, uma conta só: <b>12 − 5 = 7</b>.', a => por(a.conta, { o: 1 })]
      ]
    },
    empresta: {
      montar(p) {
        const a = { nt: [], md: [], novas: [] };
        ator(p, N('dezenas', 'au-pequeno'), 20, 8); ator(p, N('unidades', 'au-pequeno'), 54, 8);
        for (let k = 0; k < 5; k++) a.nt.push(ator(p, nota10, k < 3 ? 14 : 26, 24 + (k % 3) * 12));
        for (let k = 0; k < 2; k++) a.md.push(ator(p, moeda, 44 + k * 6, 26));
        for (let k = 0; k < 10; k++) a.novas.push(por(ator(p, moeda, 56 + (k % 5) * 6 - 12, 40 + Math.floor(k / 5) * 12), { o: 0, s: .4 }));
        a.balao = por(ator(p, '', 54, 78, 'au-balao'), { o: 0 });
        a.conta = ator(p, `<div class="au-armadinha"><span></span><span class="au-v1"></span><span class="au-v2"></span><span></span><span class="au-d">5</span><span class="au-u">2</span><span>−</span><span>1</span><span>7</span><i></i><span></span><span class="au-r1"></span><span class="au-r2"></span></div>`, 88, 44);
        return a;
      },
      passos: [
        [2600, 'Conta: <b>52 − 17</b>. Nas unidades, é preciso tirar <b>7 moedas</b>…'],
        [2600, '…mas só tem <b>2</b>. Não dá para tirar 7 de 2.', a => por(a.balao, { o: 1, html: '2 moedas < 7' })],
        [3400, 'Destroque <b>1 nota de 10</b> por <b>10 moedas</b>. Agora são <b>12 moedas</b> e <b>4 notas</b>.', a => {
          por(a.balao, { o: 0 }); por(a.nt[4], { x: 50, y: 46, o: 0 });
          setTimeout(() => a.novas.forEach((m, k) => por(m, { o: 1, s: 1, atraso: k * 40 })), 500);
          a.conta.querySelector('.au-v1').textContent = '4'; a.conta.querySelector('.au-v2').textContent = '12';
          a.conta.querySelector('.au-d').classList.add('au-riscado'); a.conta.querySelector('.au-u').classList.add('au-riscado');
        }],
        [2800, 'Tire 7 moedas: <b>12 − 7 = 5</b>.', a => {
          [...a.md, ...a.novas].slice(0, 7).forEach((m, k) => por(m, { y: 112, o: 0, atraso: k * 70 }));
          a.conta.querySelector('.au-r2').textContent = '5';
        }],
        [3200, 'Nas dezenas, tire 1 nota: <b>4 − 1 = 3</b>. Resultado: <b>35</b>.', a => {
          por(a.nt[3], { y: 112, o: 0 }); a.conta.querySelector('.au-r1').textContent = '3';
        }]
      ]
    },
    troco: {
      montar(p) {
        const x = v => xReta(v, 60, 100);
        const a = { linha: ator(p, '', 50, 62, 'au-reta') };
        a.marcas = [63, 70, 80, 90, 100].map(v => ator(p, `<span class="au-tique"></span>${N(v, 'au-pequeno')}`, x(v), 70, 'au-marca-reta'));
        a.p1 = por(ator(p, '+7', x(66.5), 44, 'au-pulo'), { o: 0 }); a.p1.style.width = (x(70) - x(63)) + '%';
        a.p2 = por(ator(p, '+30', x(85), 44, 'au-pulo au-pulo2'), { o: 0 }); a.p2.style.width = (x(100) - x(70)) + '%';
        a.compra = ator(p, '<span class="au-balao">compra: 63</span>', x(63), 20);
        a.pagou = ator(p, '<span class="au-balao">pagou: 100</span>', x(100) - 6, 20);
        a.total = por(ator(p, N('7 + 30 = 37 de troco', 'au-medio au-certo-txt'), 50, 90), { o: 0 });
        return a;
      },
      passos: [
        [2600, 'A compra deu <b>63</b> e você pagou com <b>100</b>. Em vez de armar 100 − 63, ande na reta.'],
        [2600, 'De 63 até o próximo número redondo, 70: <b>+7</b>.', a => por(a.p1, { o: 1 })],
        [2600, 'De 70 até 100: <b>+30</b>.', a => por(a.p2, { o: 1 })],
        [3000, 'Junte os pulos: <b>7 + 30 = 37</b>. Sem "emprestar" nada.', a => por(a.total, { o: 1 })]
      ]
    },
    distancia: {
      montar(p) {
        const x = v => xReta(v, 150, 450);
        const a = { linha: ator(p, '', 50, 58, 'au-reta'), x };
        a.m1 = ator(p, `<span class="au-tique"></span>${N(198, 'au-pequeno')}`, x(198), 66, 'au-marca-reta');
        a.m2 = ator(p, `<span class="au-tique"></span>${N(402, 'au-pequeno')}`, x(402), 66, 'au-marca-reta');
        a.vao = ator(p, '?', (x(198) + x(402)) / 2, 42, 'au-pulo'); a.vao.style.width = (x(402) - x(198)) + '%';
        a.conta = ator(p, N('402 − 198', 'au-medio'), 50, 88);
        return a;
      },
      passos: [
        [2600, 'A subtração mede a <b>distância</b> entre dois números: de 198 até 402.'],
        [3200, 'Empurre os <b>dois</b> 2 casas para a direita: viram <b>200</b> e <b>404</b>. A barra só anda, não estica.', a => {
          por(a.m1, { x: a.x(200), html: `<span class="au-tique"></span>${N(200, 'au-pequeno au-certo-txt')}` });
          por(a.m2, { x: a.x(404), html: `<span class="au-tique"></span>${N(404, 'au-pequeno')}` });
          por(a.vao, { x: (a.x(200) + a.x(404)) / 2 });
        }],
        [3200, 'Mesma distância, conta fácil: <b>404 − 200 = 204</b>.', a => { por(a.vao, { html: '204' }); por(a.conta, { html: N('404 − 200 = 204', 'au-medio au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
