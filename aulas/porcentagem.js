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
  return () => {};
};
