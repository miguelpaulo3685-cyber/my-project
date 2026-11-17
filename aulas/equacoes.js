aulasMM.aulas['equacoes'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // Equações a·x + b = c, com a, b e x inteiros pequenos.
  const EQS = [[2, 3, 4], [3, 2, 5], [2, 5, 3], [4, 1, 2], [3, 4, 3]];
  let qual = 0, a, b, c, xs, uns, outro, x;
  function nova() { [a, b, x] = EQS[qual]; c = a * x + b; xs = a; uns = b; outro = c; desenhar(); }
  function desenhar() {
    const caixa = '<i class="au-caixa-x">x</i>', peso = '<i class="au-peso">1</i>';
    const prato = (n1, n2) => `<div class="au-prato-eq">${caixa.repeat(n1)}${peso.repeat(n2)}</div>`;
    const esq = xs === 1 ? 'x' : `${xs}x`, ladoE = uns ? `${esq} + ${uns}` : esq;
    $('balanca').innerHTML = `${prato(xs, uns)}<span class="au-fiel">=</span><div class="au-prato-eq">${outro > 14 ? `<b class="au-peso-grande">${outro}</b>` : peso.repeat(outro)}</div>`;
    $('eq').innerHTML = `${ladoE} = ${outro}`;
    $('tira').disabled = uns === 0; $('divide').disabled = uns > 0 || xs === 1;
    $('divide').textContent = `Dividir os dois lados por ${xs}`;
    $('recado').textContent = xs === 1 && uns === 0 ? `Pronto: x = ${outro}. Confira: ${a} × ${outro} + ${b} = ${a * outro + b}. ✓`
      : uns > 0 ? `Primeiro tire os pesos soltos do lado do x. Tire 1 dos dois lados (faltam ${uns}): a balança continua equilibrada.`
      : `Agora há ${xs} caixas x valendo ${outro}. Divida os dois lados por ${xs}: cada caixa vale ${outro / xs}.`;
  }
  $('tira').addEventListener('click', () => { if (uns > 0) { uns--; outro--; desenhar(); } });
  $('divide').addEventListener('click', () => { if (!uns && xs > 1) { outro /= xs; xs = 1; desenhar(); } });
  $('nova').addEventListener('click', () => { qual = (qual + 1) % EQS.length; nova(); });
  nova();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    texto: {
      montar(p) {
        const L = [['3 cadernos + caneta de R$ 8 = R$ 50', ''], ['caderno = x', 'au-cor-d'], ['3x + 8 = 50', 'au-cor-u'], ['3x = 42 → x = 14', 'au-certo-txt']];
        return { l: L.map(([t, c], k) => por(ator(p, `<span class="au-linha-texto ${c}">${t}</span>`, 50, 14 + k * 22), { o: k ? 0 : 1 })) };
      },
      passos: [
        [2600, 'Um problema em palavras. Primeiro, <b>leia</b> e veja o que não se sabe: o preço do caderno.'],
        [2400, 'Dê um nome a ele: <b>x</b>.', a => por(a.l[1], { o: 1 })],
        [2800, 'Traduza: 3 cadernos (3x) mais a caneta (8) deram 50. <b>3x + 8 = 50</b>.', a => por(a.l[2], { o: 1 })],
        [3000, 'Resolva: tire 8, divida por 3. Cada caderno custou <b>R$ 14</b>.', a => por(a.l[3], { o: 1 })]
      ]
    },
    bhaskara: {
      montar(p) {
        const a = { eq: ator(p, N('x² − 5x + 6 = 0', 'au-medio'), 50, 14) };
        a.sp = por(ator(p, '<span class="au-balao">soma = 5 · produto = 6</span>', 50, 36), { o: 0 });
        a.pares = [['1 e 6', '✗'], ['2 e 3', '✓']].map(([t, s], k) => por(ator(p, N(`${t} ${s}`, 'au-medio ' + (s === '✓' ? 'au-certo-txt' : 'au-errado-txt')), 30 + k * 40, 58), { o: 0 }));
        a.res = por(ator(p, N('x = 2 ou x = 3', 'au-medio au-certo-txt'), 50, 84), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Equação do 2º grau: <b>x² − 5x + 6 = 0</b>.'],
        [2600, 'Procure dois números que <b>somam 5</b> e <b>multiplicam 6</b>.', a => por(a.sp, { o: 1 })],
        [2800, '1 e 6 multiplicam 6, mas somam 7: não serve. <b>2 e 3</b> somam 5 e multiplicam 6.', a => a.pares.forEach((x, k) => por(x, { o: 1, atraso: k * 600 }))],
        [3000, 'As soluções: <b>x = 2 ou x = 3</b>. Confira: 2² − 5·2 + 6 = 0. ✓', a => por(a.res, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
