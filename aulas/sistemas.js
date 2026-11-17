aulasMM.aulas['sistemas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(v) ? 0 : 2);

  // ---------- duas retas ----------
  // x + y = A e 2x + y = B → x = B − A, y = 2A − B.
  function grafico() {
    const A = Number($('p1').value), B = Number($('p2').value);
    $('o-p1').textContent = 'R$ ' + A; $('o-p2').textContent = 'R$ ' + B;
    const x = B - A, y = 2 * A - B, M = 25;
    const X = v => 30 + v / M * 280, Y = v => 200 - v / M * 185;
    const reta = (f, cor) => { const pts = []; for (let v = 0; v <= M; v += .5) { const w = f(v); if (w >= 0 && w <= M) pts.push(`${X(v)},${Y(w)}`); } return `<polyline points="${pts.join(' ')}" fill="none" stroke="${cor}" stroke-width="3"/>`; };
    const ok = x > 0 && y > 0;
    $('graf').innerHTML = `<line x1="30" y1="200" x2="312" y2="200" stroke="currentColor" opacity=".5"/><line x1="30" y1="200" x2="30" y2="10" stroke="currentColor" opacity=".5"/>
      ${[5, 10, 15, 20, 25].map(v => `<text x="${X(v)}" y="214" text-anchor="middle">${v}</text><text x="24" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      <text x="312" y="196" text-anchor="end">lanche (x)</text><text x="34" y="14">suco (y)</text>
      ${reta(v => A - v, '#62a8ea')}${reta(v => B - 2 * v, '#e9b949')}
      ${ok ? `<circle cx="${X(x)}" cy="${Y(y)}" r="7" fill="var(--certo)" stroke="#fff" stroke-width="2"/><text x="${X(x) + 10}" y="${Y(y) - 10}" style="fill:var(--texto);font-weight:800">(${num(x)}, ${num(y)})</text>` : ''}`;
    $('recado').innerHTML = ok
      ? `<span style="color:#62a8ea">Reta azul</span>: x + y = ${A}. <span style="color:#e9b949">Reta amarela</span>: 2x + y = ${B}. Elas se cruzam em <b>lanche = R$ ${num(x)}</b> e <b>suco = R$ ${num(y)}</b>. Pela diferença dos pedidos: 1 lanche = ${B} − ${A} = ${x}.`
      : `Com esses preços, o suco teria de custar R$ ${num(y)}: as retas se cruzam fora da região que faz sentido (preço não pode ser zero ou negativo). Ajuste os pedidos.`;
  }
  for (const id of ['p1', 'p2']) $(id).addEventListener('input', grafico);
  grafico();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    comparar: {
      montar(p) {
        const a = { p1: ator(p, '<span class="au-pedido">🍔 + 🥤 = R$ 15</span>', 50, 20), p2: ator(p, '<span class="au-pedido">🍔🍔 + 🥤 = R$ 25</span>', 50, 42) };
        a.dif = por(ator(p, '<span class="au-pedido au-dif">diferença: 🍔 = R$ 10</span>', 50, 66), { o: 0 });
        a.t = ator(p, N('', 'au-medio'), 50, 88);
        return a;
      },
      passos: [
        [2600, 'Dois pedidos na mesma lanchonete. Quanto custa cada coisa?'],
        [3000, 'Compare: o 2º pedido tem <b>um lanche a mais</b> e custou <b>R$ 10 a mais</b>. Então 1 lanche = R$ 10.', a => por(a.dif, { o: 1 })],
        [3000, 'Volte ao 1º pedido: 10 + suco = 15, então o <b>suco custa R$ 5</b>.', a => por(a.t, { html: N('lanche R$ 10 · suco R$ 5', 'au-medio au-certo-txt') })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
