aulasMM.aulas['porcentagem'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const reais = v => 'R$ ' + br(v, Number.isInteger(v) ? 0 : 2);
  const sinal = p => (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + '%';

  // ---------- mercadinho ----------
  const PRODUTOS = [
    { nome: 'Chocolate', emoji: '🍫', preco: 8 }, { nome: 'Suco', emoji: '🧃', preco: 6 }, { nome: 'Biscoito', emoji: '🍪', preco: 4 },
    { nome: 'Queijo', emoji: '🧀', preco: 20 }, { nome: 'Arroz 5 kg', emoji: '🍚', preco: 25 }, { nome: 'Café', emoji: '☕', preco: 16 }
  ];
  const carrinho = [2, 0, 0, 1, 0, 0]; // começa com uma compra de exemplo
  const prateleira = $('prateleira');
  const dinheiro = v => 'R$ ' + br(v, 2);

  let modo = 'desconto'; // ou 'acrescimo'

  function loja() {
    const taxa = Number($('cupom').value), sobe = modo === 'acrescimo';
    const fator = sobe ? 1 + taxa / 100 : 1 - taxa / 100;
    const nome = sobe ? 'Acréscimo' : 'Desconto', marca = (sobe ? '+' : '−') + taxa + '%';
    $('n-cupom').textContent = nome; $('o-cupom').textContent = taxa + '%';
    raiz.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.modo === modo));
    prateleira.innerHTML = PRODUTOS.map((p, i) => `<button type="button" class="au-produto" data-i="${i}" aria-label="Pôr ${p.nome} no carrinho, ${dinheiro(p.preco * fator)}">
      ${taxa ? `<span class="au-etiqueta${sobe ? ' au-sobe' : ''}">${marca}</span>` : ''}${carrinho[i] ? `<span class="au-qtd">${carrinho[i]}</span>` : ''}
      <span class="au-emoji" aria-hidden="true">${p.emoji}</span><b>${p.nome}</b>
      <s>${taxa ? dinheiro(p.preco) : ''}</s><strong>${dinheiro(p.preco * fator)}</strong></button>`).join('');

    const subtotal = PRODUTOS.reduce((s, p, i) => s + p.preco * carrinho[i], 0);
    const diferenca = subtotal * taxa / 100, total = subtotal * fator;
    const itens = PRODUTOS.map((p, i) => carrinho[i] ? `<div class="au-linha"><span>${carrinho[i]} × ${p.nome}</span><span>${dinheiro(p.preco * carrinho[i])}</span></div>` : '').join('');
    $('nota-fiscal').innerHTML = '<b>🧾 Sua compra</b>' + (subtotal === 0 ? '<div class="au-vazio">O carrinho está vazio. Toque num produto da prateleira.</div>'
      : `${itens}
        <div class="au-linha au-sub"><span>Subtotal</span><span>${dinheiro(subtotal)}</span></div>
        <div class="au-linha ${sobe ? 'au-acres' : 'au-desc'}"><span>${nome} de ${taxa}% <small>${br(taxa / 100, 2)} × ${br(subtotal)}</small></span><span>${sobe ? '+' : '−'} ${dinheiro(diferenca)}</span></div>
        <div class="au-linha au-total"><span>Total <small>${br(fator, 2)} × ${br(subtotal)}</small></span><span>${dinheiro(total)}</span></div>`);

    // Barra: no desconto, as duas partes somam o preço (100%); no acréscimo, o preço inteiro e o que entra a mais.
    const inteiro = sobe ? 100 + taxa : 100;
    $('partes').classList.toggle('au-sobe', sobe);
    $('paga').style.width = (sobe ? 100 : 100 - taxa) / inteiro * 100 + '%'; $('poupa').style.width = taxa / inteiro * 100 + '%';
    $('paga').textContent = sobe ? 'preço: 100%' : `você paga ${100 - taxa}%`;
    $('poupa').textContent = taxa >= 35 ? `${sobe ? 'a mais' : 'economiza'} ${taxa}%` : taxa >= 10 ? marca : '';
    $('partes').setAttribute('aria-label', sobe ? `Você paga 100% mais ${taxa}%` : `Você paga ${100 - taxa}% e economiza ${taxa}%`);
    $('recado').textContent = subtotal === 0 ? 'Monte uma compra para ver a conta aparecer.'
      : taxa === 0 ? `Sem ${sobe ? 'acréscimo' : 'desconto'}, você paga 100% do preço. Arraste a barra para ver a mudança.`
      : `${taxa}% de ${dinheiro(subtotal)} é ${br(taxa / 100, 2)} × ${br(subtotal)} = ${dinheiro(diferenca)}. `
        + (sobe ? `Você paga 100% + ${taxa}% = ${100 + taxa}%: ${br(fator, 2)} × ${br(subtotal)} = ${dinheiro(total)}.`
                : `Você paga os outros ${100 - taxa}%: ${br(fator, 2)} × ${br(subtotal)} = ${dinheiro(total)}.`);
  }
  prateleira.addEventListener('click', e => { const b = e.target.closest('.au-produto'); if (b) { carrinho[Number(b.dataset.i)]++; loja(); } });
  $('cupom').addEventListener('input', loja);
  raiz.querySelectorAll('[data-cupom]').forEach(b => b.addEventListener('click', () => { $('cupom').value = b.dataset.cupom; loja(); }));
  raiz.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => { modo = b.dataset.modo; loja(); }));
  $('esvaziar').addEventListener('click', () => { carrinho.fill(0); loja(); });

  // ---------- aumentos e descontos seguidos ----------
  const INICIAL = 100;
  function precos() {
    const a = Number($('m-a').value), b = Number($('m-b').value);
    const f1 = 1 + a / 100, f2 = 1 + b / 100;
    const v = [INICIAL, INICIAL * f1, INICIAL * f1 * f2], maior = Math.max(...v);
    $('o-a').textContent = sinal(a); $('o-b').textContent = sinal(b);
    $('n1').textContent = `Remarcado ${sinal(a)}`; $('n2').textContent = `"Promoção" ${sinal(b)}`;
    v.forEach((x, i) => { $('b' + i).style.width = x / maior * 100 + '%'; $('v' + i).textContent = reais(Math.round(x * 100) / 100); });
    for (const m of ['m1', 'm2']) $(m).style.left = INICIAL / maior * 100 + '%';
    const total = Math.round((f1 * f2 - 1) * 10000) / 100;
    $('conta').textContent = `${br(f1, 2)} × ${br(f2, 2)} = ${br(f1 * f2, 4).replace(/0{1,2}$/, '')}`;
    $('recado2').textContent = total === 0 ? 'No total, o preço não mudou.'
      : `No total, o preço ${total > 0 ? 'subiu' : 'caiu'} ${br(Math.abs(total), Number.isInteger(total) ? 0 : 2)}%`
        + (a + b !== total ? `, e não ${a + b === 0 ? 'ficou igual' : br(Math.abs(a + b)) + '%'} como parece somando.` : '.');
  }
  for (const k of ['m-a', 'm-b']) $(k).addEventListener('input', precos);
  raiz.querySelectorAll('[data-par]').forEach(b => b.addEventListener('click', () => {
    const [x, y] = b.dataset.par.split(','); $('m-a').value = x; $('m-b').value = y; precos();
  }));

  loja(); precos();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    cem: {
      montar(p) {
        const a = { g: ator(p, `<div class="au-grade-filme" style="grid-template-columns:repeat(10, var(--au-cel));--au-cel:10px;gap:2px">${'<b></b>'.repeat(100)}</div>`, 30, 46) };
        a.t = ator(p, N('100 = o inteiro', 'au-medio'), 74, 46);
        return a;
      },
      passos: [
        [2400, 'Um quadrado com <b>100 quadradinhos</b>: é o inteiro, 100%.'],
        [3000, 'Pinte <b>25</b>. "25 por cento" quer dizer <b>25 de cada 100</b>.', a => {
          a.g.querySelectorAll('b').forEach((c, k) => { if (k < 25) setTimeout(() => { c.className = 'au-on'; }, k * 40); });
          por(a.t, { html: N('25%', 'au-medio au-cor-d') });
        }],
        [3200, 'Por isso <b>25% = 25/100 = 0,25</b>. Três jeitos de escrever o mesmo pedaço.', a => por(a.t, { html: N('25% = 25/100 = 0,25', 'au-pequeno au-certo-txt') })]
      ]
    },
    atalhos: {
      montar(p) {
        const linha = (rot, y, cor) => {
          const b = ator(p, '', 22, y, 'au-barra-filme'); b.style.cssText += `;width:0;height:20px;background:${cor};transform:translate(0,-50%)`;
          return { b, t: por(ator(p, N(rot, 'au-pequeno'), 11, y), { o: 0 }), valor: por(ator(p, N('', 'au-pequeno'), 92, y), { o: 0 }) };
        };
        const a = { base: linha('100%', 14, '#7d7d84'), l: [linha('10%', 34, '#3f87c9'), linha('50%', 52, '#2f9e6a'), linha('25%', 70, '#c9971d'), linha('5%', 88, '#8a55c9')] };
        a.base.b.style.width = '62%'; por(a.base.t, { o: 1 }); por(a.base.valor, { o: 1, html: N('R$ 80', 'au-pequeno') });
        return a;
      },
      passos: (() => {
        const mostra = (k, larg, v) => a => { const l = a.l[k]; l.b.style.width = larg; por(l.t, { o: 1 }); por(l.valor, { o: 1, html: N(v, 'au-pequeno') }); };
        return [
          [2200, 'Uma compra de <b>R$ 80</b>. Ache as porcentagens sem calculadora.'],
          [2400, '<b>10%</b>: divida por 10. R$ 8.', mostra(0, '6.2%', 'R$ 8')],
          [2400, '<b>50%</b>: a metade. R$ 40.', mostra(1, '31%', 'R$ 40')],
          [2400, '<b>25%</b>: a metade da metade. R$ 20.', mostra(2, '15.5%', 'R$ 20')],
          [3000, '<b>5%</b>: a metade dos 10%. R$ 4. Combinando: 15% = 10% + 5% = R$ 12.', mostra(3, '3.1%', 'R$ 4')]
        ];
      })()
    },
    fator: {
      montar(p) {
        const a = { b: ator(p, 'R$ 100', 10, 40, 'au-barra-filme') };
        a.b.style.cssText += ';width:50%;background:#3f87c9;transform:translate(0,-50%)';
        a.marca = ator(p, '', 60, 40, 'au-marca-cem'); a.t = ator(p, N('100%', 'au-medio'), 50, 76);
        return a;
      },
      passos: [
        [2200, 'Um preço de <b>R$ 100</b>: é o 100%. A linha tracejada marca esse valor.'],
        [3000, 'Aumentar <b>20%</b> é ficar com 100% + 20% = <b>120%</b>. Multiplica por <b>1,2</b>: R$ 120.', a => {
          a.b.style.width = '60%'; por(a.b, { html: 'R$ 120' }); a.b.style.background = '#c94b4b'; por(a.t, { html: N('× 1,2 = R$ 120', 'au-medio') });
        }],
        [3200, 'Dar 20% de desconto sobre os R$ 120 é ficar com <b>80%</b> deles: × 0,8 = <b>R$ 96</b>. Não volta para 100!', a => {
          a.b.style.width = '48%'; por(a.b, { html: 'R$ 96' }); a.b.style.background = '#2f9e6a'; por(a.t, { html: N('1,2 × 0,8 = 0,96 → R$ 96', 'au-medio au-certo-txt') });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
