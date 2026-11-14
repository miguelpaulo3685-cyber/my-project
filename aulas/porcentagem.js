aulasMM.aulas['porcentagem'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const reais = v => 'R$ ' + br(v, Number.isInteger(v) ? 0 : 2);
  const sinal = p => (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + '%';

  // ---------- quadro de 100 ----------
  const grade = $('grade');
  grade.innerHTML = '<i></i>'.repeat(100);
  const quadrados = [...grade.children];
  function pintar() {
    const p = Number($('p').value), total = Number($('total').value), parte = p / 100 * total;
    quadrados.forEach((q, i) => q.classList.toggle('au-cheio', i < p));
    $('o-p').textContent = p + '%'; $('o-total').textContent = total;
    $('l-fracao').textContent = p + '/100';
    $('l-decimal').textContent = br(p / 100, 2);
    $('l-de').textContent = `${p}% de ${total}`;
    $('l-parte').textContent = br(parte, Number.isInteger(parte) ? 0 : 1);
    $('recado').textContent = p === 0 ? 'Nenhum quadradinho pintado: 0% é nada.'
      : p === 100 ? 'Todos pintados: 100% é o valor inteiro.'
      : `${p} de cada 100 quadradinhos estão pintados. De ${total}, isso dá ${br(p / 100, 2)} × ${total} = ${br(parte, Number.isInteger(parte) ? 0 : 1)}.`;
  }
  for (const k of ['p', 'total']) $(k).addEventListener('input', pintar);
  raiz.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { $('p').value = b.dataset.p; pintar(); }));

  // ---------- aumentos e descontos seguidos ----------
  const INICIAL = 100;
  function precos() {
    const a = Number($('m-a').value), b = Number($('m-b').value);
    const f1 = 1 + a / 100, f2 = 1 + b / 100;
    const v = [INICIAL, INICIAL * f1, INICIAL * f1 * f2], maior = Math.max(...v);
    $('o-a').textContent = sinal(a); $('o-b').textContent = sinal(b);
    $('n1').textContent = `Depois de ${sinal(a)}`; $('n2').textContent = `Depois de ${sinal(b)}`;
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

  pintar(); precos();
  return () => {};
};
