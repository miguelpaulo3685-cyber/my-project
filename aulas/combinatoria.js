aulasMM.aulas['combinatoria'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- escolher da turma ----------
  const GENTE = [['A', 'Ana', '#62a8ea'], ['B', 'Bia', '#e9b949'], ['C', 'Caio', '#2f9e6a'], ['D', 'Davi', '#c96b4b'], ['E', 'Eva', '#8a55c9']];
  let ordem = true;
  const arranjos = (k, usados = []) => k === 0 ? [usados] : GENTE.map(g => g[0]).filter(l => !usados.includes(l)).flatMap(l => arranjos(k - 1, [...usados, l]));
  function turma() {
    const k = Number($('k').value), n = 5;
    $('o-k').textContent = k + (k === 1 ? ' pessoa' : ' pessoas');
    $('turma').innerHTML = GENTE.map(([l, nome, c]) => `<span class="au-pessoa-chip" style="--c:${c}"><b>${l}</b>${nome}</span>`).join('');
    let lista = arranjos(k);
    if (!ordem) { const vistos = new Set(); lista = lista.filter(x => { const ch = [...x].sort().join(''); if (vistos.has(ch)) return false; vistos.add(ch); return true; }); }
    const fatores = Array.from({ length: k }, (_, i) => n - i), arr = fatores.reduce((a, b) => a * b, 1), fat = Array.from({ length: k }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
    $('conta').innerHTML = ordem ? `${fatores.join(' × ')} = <b>${arr}</b>` : `${fatores.join(' × ')} ÷ ${k > 2 ? '(' + Array.from({ length: k }, (_, i) => k - i).join(' × ') + ')' : k} = <b>${arr / fat}</b>`;
    $('lista').innerHTML = lista.map(x => `<span>${x.map(l => `<i style="background:${GENTE.find(g => g[0] === l)[2]}">${l}</i>`).join('')}</span>`).join('');
    raiz.querySelectorAll('[data-ordem]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.ordem === '1') === ordem)));
    $('recado').textContent = k === 1 ? 'Escolhendo uma pessoa só, a ordem nem existe: são 5 jeitos.'
      : ordem ? `Pódio: para o 1º lugar há 5 opções, para o 2º sobram 4${k === 3 ? ', para o 3º sobram 3' : ''}. AB e BA são resultados diferentes (Ana em 1º ou Bia em 1º).`
      : `Comissão: AB e BA são o mesmo grupo. Cada grupo de ${k} aparecia ${fat} vezes na lista com ordem, por isso divide por ${fat}.`;
  }
  raiz.querySelectorAll('[data-ordem]').forEach(b => b.addEventListener('click', () => { ordem = b.dataset.ordem === '1'; turma(); }));
  $('k').addEventListener('input', turma);
  turma();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    pfc: {
      montar(p) {
        const cores = ['#62a8ea', '#e9b949', '#c96b4b'];
        const a = { c: cores.map((c, i) => ator(p, `<span class="au-roupa" style="background:${c}">👕</span>`, 12, 18 + i * 30)) };
        a.ramos = []; a.folhas = [];
        cores.forEach((c, i) => ['#2f6f4a', '#555'].forEach((b, j) => {
          const y = 10 + i * 30 + j * 15;
          a.folhas.push(por(ator(p, `<span class="au-look"><span class="au-roupa" style="background:${c}">👕</span><span class="au-roupa" style="background:${b}">🩳</span></span>`, 50, y), { o: 0 }));
        }));
        a.t = ator(p, N('', 'au-medio'), 80, 50);
        return a;
      },
      passos: [
        [2200, '<b>3 camisetas</b> para escolher.'],
        [3000, 'Para <b>cada</b> camiseta, 2 bermudas: cada uma vira 2 roupas.', a => a.folhas.forEach((f, k) => por(f, { o: 1, atraso: k * 220 }))],
        [3000, 'Ao todo, <b>3 × 2 = 6</b> roupas diferentes. "Camiseta e bermuda" vira multiplicação.', a => por(a.t, { html: N('3 × 2 = 6', 'au-medio au-certo-txt') })]
      ]
    },
    anagramas: {
      montar(p) {
        const a = { s: [0, 1, 2, 3].map(k => ator(p, '<span class="au-slot"></span>', 20 + k * 20, 30)), n: [4, 3, 2, 1].map((v, k) => por(ator(p, N(v, 'au-medio au-cor-u'), 20 + k * 20, 56), { o: 0 })) };
        a.x = [0, 1, 2].map(k => por(ator(p, N('×', 'au-pequeno'), 30 + k * 20, 56), { o: 0 }));
        a.t = ator(p, N('AMOR', 'au-medio'), 50, 86);
        return a;
      },
      passos: [
        [2200, 'Quantos anagramas tem <b>AMOR</b>? São 4 lugares para preencher.'],
        [2400, '1º lugar: qualquer uma das <b>4</b> letras.', a => { por(a.n[0], { o: 1 }); por(a.s[0], { html: '<span class="au-slot">A</span>' }); }],
        [2400, '2º lugar: sobram <b>3</b>. Depois <b>2</b>. Depois só <b>1</b>.', a => { a.n.slice(1).forEach((n, k) => por(n, { o: 1, atraso: k * 400 })); a.x.forEach(x => por(x, { o: 1 }));
          ['M', 'O', 'R'].forEach((l, k) => setTimeout(() => por(a.s[k + 1], { html: `<span class="au-slot">${l}</span>` }), k * 400)); }],
        [3000, '<b>4 × 3 × 2 × 1 = 24</b> anagramas. Essa conta se escreve <b>4!</b> (fatorial).', a => por(a.t, { html: N('4! = 24', 'au-medio au-certo-txt') })]
      ]
    },
    ordem: {
      montar(p) {
        const L = ['A', 'B', 'C', 'D'], pares = [];
        L.forEach(x => L.forEach(y => { if (x !== y) pares.push(x + y); }));
        const a = { p: pares.map((par, k) => ator(p, `<span class="au-par">${par}</span>`, 12 + (k % 6) * 15, 20 + Math.floor(k / 6) * 20)), pares };
        a.t = ator(p, N('presidente e vice: 4 × 3 = 12', 'au-pequeno'), 50, 86);
        return a;
      },
      passos: [
        [2800, '<b>Presidente e vice</b> entre 4 pessoas: AB (Ana presidente) é diferente de BA. São <b>12</b>.'],
        [3200, 'Agora é uma <b>comissão</b>: AB e BA são a mesma dupla. Cada dupla aparecia <b>2 vezes</b>.', a => a.p.forEach((el, k) => { const par = a.pares[k]; if (par[0] > par[1]) el.firstChild.classList.add('au-repetido'); })],
        [3200, 'Tirando as repetidas: 12 ÷ 2 = <b>6</b> comissões. Sem ordem, divida pelas trocas.', a => {
          let j = 0; a.p.forEach((el, k) => { const par = a.pares[k]; if (par[0] > par[1]) por(el, { o: 0 }); else { por(el, { x: 12 + (j % 6) * 15, y: 40 }); j++; } });
          por(a.t, { html: N('comissão: 12 ÷ 2 = 6', 'au-pequeno au-certo-txt') });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
