aulasMM.aulas['contas-fracoes'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const mdc = (a, b) => (b ? mdc(b, a % b) : a);
  const mmc = (a, b) => a * b / mdc(a, b);
  const NOMES = { 2: 'meios', 3: 'terços', 4: 'quartos', 5: 'quintos', 6: 'sextos', 8: 'oitavos', 12: 'doze avos' };
  const fr = (a, b) => `<span class="au-fr au-fr-p"><b>${a}</b><i></i><b>${b}</b></span>`;

  // ---------- bancada ----------
  let conta = [1, 3, '+', 1, 2], cortado = false;
  // Uma barra inteira (ou mais) cortada em n partes, com as partes pintadas em cada cor.
  const barra = (n, pintas) => {
    const total = pintas.reduce((s, [q]) => s + q, 0), inteiros = Math.max(1, Math.ceil(total / n));
    let k = 0;
    return Array.from({ length: inteiros }, () => `<div class="au-barra-fr" style="--au-n:${n}">${Array.from({ length: n }, () => {
      let cls = '', soma = 0;
      for (const [q, c] of pintas) { if (k < soma + q) { cls = c; break; } soma += q; }
      k++;
      return `<i class="${cls}"></i>`;
    }).join('')}</div>`).join('');
  };
  function bancada() {
    const [a, b, op, c, d] = conta, m = mmc(b, d), a2 = a * m / b, c2 = c * m / d;
    const r = op === '+' ? a2 + c2 : a2 - c2, g = mdc(r, m);
    const linha = (rot, html, f) => `<div class="au-linha-fr"><span>${rot}</span><div>${html}</div><span>${f}</span></div>`;
    let html;
    if (!cortado) {
      html = linha('1ª', barra(b, [[a, 'au-on']]), fr(a, b)) + linha('2ª', barra(d, [[c, 'au-on2']]), fr(c, d));
    } else if (op === '+') {
      html = linha('1ª', barra(m, [[a2, 'au-on']]), fr(a2, m)) + linha('2ª', barra(m, [[c2, 'au-on2']]), fr(c2, m))
        + linha('=', barra(m, [[a2, 'au-on'], [c2, 'au-on2']]), fr(r, m));
    } else {
      html = linha('1ª', barra(m, [[a2, 'au-on']]), fr(a2, m)) + linha('tira', barra(m, [[c2, 'au-on2']]), fr(c2, m))
        + linha('=', barra(m, [[r, 'au-on'], [c2, 'au-fora']]), fr(r, m));
    }
    $('bancada').innerHTML = html;
    $('cortar').setAttribute('aria-pressed', String(cortado));
    $('cortar').textContent = cortado ? '↺ Voltar aos pedaços originais' : '✂️ Cortar tudo do mesmo tamanho';
    const simples = g > 1 ? ` (simplificando, ${r / g}/${m / g})` : '';
    const inteiro = r > m ? ` Passou de um inteiro: ${r}/${m} = 1 inteiro e ${r - m}/${m}.` : '';
    $('recado').textContent = !cortado
      ? `Uma barra está em ${NOMES[b]} e a outra em ${NOMES[d]}: pedaços de tamanhos diferentes. Do jeito que está, não dá para juntar. Corte tudo em ${m} partes (${NOMES[m]}).`
      : `Em ${m} partes: ${a}/${b} = ${a2}/${m} e ${c}/${d} = ${c2}/${m}. Agora é só ${op === '+' ? 'somar' : 'tirar'} os de cima: ${a2} ${op === '+' ? '+' : '−'} ${c2} = ${r}. Resultado ${r}/${m}${simples}.${inteiro}`;
  }
  raiz.querySelectorAll('[data-conta]').forEach(bt => bt.addEventListener('click', () => {
    conta = bt.dataset.conta.split(',').map(x => (/^\d+$/.test(x) ? Number(x) : x)); cortado = false; bancada();
  }));
  $('cortar').addEventListener('click', () => { cortado = !cortado; bancada(); });
  bancada();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const barraAtor = (p, n, y, larg = 76) => { const el = ator(p, `<div class="au-barra-fr au-barra-filme-fr" style="--au-n:${n}">${'<i></i>'.repeat(n)}</div>`, 50, y); el.style.width = larg + '%'; return el; };
  const pinta = (el, de, ate, cls) => el.querySelectorAll('i').forEach((c, k) => { if (k >= de && k < ate) c.className = cls; });
  const recorta = (el, n) => { const b = el.firstChild; b.style.setProperty('--au-n', n); b.innerHTML = '<i></i>'.repeat(n); };
  const ROTEIROS = {
    mesmo: {
      montar(p) {
        const a = { b: barraAtor(p, 5, 40), t: ator(p, N('1/5 + 2/5', 'au-medio'), 50, 76) };
        return a;
      },
      passos: [
        [2200, 'Uma barra cortada em <b>5 quintos</b>.'],
        [2400, 'Pinte <b>1 quinto</b>…', a => pinta(a.b, 0, 1, 'au-on')],
        [2400, '…e mais <b>2 quintos</b>.', a => pinta(a.b, 1, 3, 'au-on2')],
        [3000, 'São <b>3 quintos</b>: 1/5 + 2/5 = <b>3/5</b>. O 5 só diz o tamanho do pedaço.', a => por(a.t, { html: N('1/5 + 2/5 = 3/5', 'au-medio au-certo-txt') })]
      ]
    },
    diferentes: {
      montar(p) {
        const a = { b1: barraAtor(p, 2, 22), b2: barraAtor(p, 3, 44), t: ator(p, N('1/2 + 1/3 = ?', 'au-medio'), 50, 84) };
        pinta(a.b1, 0, 1, 'au-on'); pinta(a.b2, 0, 1, 'au-on2');
        a.r = por(barraAtor(p, 6, 64), { o: 0 });
        return a;
      },
      passos: [
        [2600, '<b>1/2</b> e <b>1/3</b>: pedaços de tamanhos diferentes. Não dá para somar assim.'],
        [3200, 'Corte as duas barras em <b>6 partes</b>. A metade vira <b>3/6</b> e o terço vira <b>2/6</b>.', a => {
          recorta(a.b1, 6); pinta(a.b1, 0, 3, 'au-on'); recorta(a.b2, 6); pinta(a.b2, 0, 2, 'au-on2');
        }],
        [3200, 'Pedaços iguais, agora junta: 3/6 + 2/6 = <b>5/6</b>.', a => {
          por(a.r, { o: 1 }); pinta(a.r, 0, 3, 'au-on'); pinta(a.r, 3, 5, 'au-on2'); por(a.t, { html: N('1/2 + 1/3 = 3/6 + 2/6 = 5/6', 'au-medio au-certo-txt') });
        }]
      ]
    },
    vezes: {
      montar(p) {
        const cel = Array.from({ length: 8 }, (_, k) => `<b data-c="${k % 4}" data-l="${Math.floor(k / 4)}"></b>`).join('');
        const a = { g: ator(p, `<div class="au-grade-filme" style="grid-template-columns:repeat(4, var(--au-cel));--au-cel:38px;gap:3px">${cel}</div>`, 38, 42) };
        a.g.querySelectorAll('b').forEach(c => { c.style.height = '30px'; });
        a.t = ator(p, N('', 'au-medio'), 80, 42);
        return a;
      },
      passos: [
        [2400, 'Um terreno em forma de retângulo.'],
        [2800, 'Pinte <b>3/4</b> dele (3 de 4 colunas).', a => { a.g.querySelectorAll('b').forEach(c => { if (c.dataset.c < 3) c.className = 'au-on'; }); por(a.t, { html: N('3/4', 'au-medio au-cor-d') }); }],
        [3000, 'Agora pegue <b>metade</b> disso: corte na altura e fique com a fileira de cima.', a => {
          a.g.querySelectorAll('b').forEach(c => { if (c.dataset.c < 3 && c.dataset.l === '0') c.className = 'au-on2'; });
          por(a.t, { html: N('1/2 de 3/4', 'au-medio') });
        }],
        [3200, 'O retângulo agora tem <b>8 pedaços</b> e você pegou <b>3</b>: 1/2 × 3/4 = <b>3/8</b>.', a => por(a.t, { html: N('3/8', 'au-medio au-certo-txt') })]
      ]
    },
    dividir: {
      montar(p) {
        const a = { pz: [20, 50, 80].map(x => { const el = ator(p, '', x, 42, 'au-pizza-filme'); el.style.width = '24%'; el.style.background = '#e9b949'; return el; }) };
        a.n = []; [20, 50, 80].forEach(x => [-1, 1].forEach(s => a.n.push(por(ator(p, N(String(a.n.length + 1), 'au-pequeno au-preto'), x + s * 5, 42), { o: 0 }))));
        a.t = ator(p, N('3 ÷ 1/2 = ?', 'au-medio'), 50, 86);
        return a;
      },
      passos: [
        [2400, '<b>3 pizzas</b>. Quantas <b>metades</b> cabem nelas?'],
        [2800, 'Corte cada pizza ao meio.', a => a.pz.forEach(el => { el.style.background = 'linear-gradient(90deg, #e9b949 0 49%, #3a2a16 49% 51%, #e9b949 51%)'; })],
        [3000, 'Conte as metades: <b>6</b>. Então 3 ÷ 1/2 = 6, o mesmo que 3 × 2.', a => {
          a.n.forEach((n, k) => por(n, { o: 1, atraso: k * 250 })); por(a.t, { html: N('3 ÷ 1/2 = 3 × 2 = 6', 'au-medio au-certo-txt') });
        }]
      ]
    },
    sobrou: {
      montar(p) {
        const a = { b: barraAtor(p, 12, 34, 84) };
        a.l1 = por(ator(p, N('aluguel 1/3 = 4/12', 'au-pequeno au-cor-d'), 28, 14), { o: 0 });
        a.l2 = por(ator(p, N('mercado 1/4 = 3/12', 'au-pequeno au-cor-u'), 72, 14), { o: 0 });
        a.t = ator(p, N('salário inteiro = 12/12', 'au-medio'), 50, 62);
        return a;
      },
      passos: [
        [2600, 'O salário cortado em <b>12 partes</b> (12 serve para terço e para quarto).'],
        [2800, 'Aluguel: <b>1/3</b> = 4 partes de 12.', a => { pinta(a.b, 0, 4, 'au-on'); por(a.l1, { o: 1 }); }],
        [2800, 'Mercado: <b>1/4</b> = 3 partes de 12.', a => { pinta(a.b, 4, 7, 'au-on2'); por(a.l2, { o: 1 }); }],
        [3200, 'Sobram <b>5 partes</b>: <b>5/12</b> do salário.', a => { pinta(a.b, 7, 12, 'au-sobra-fr'); por(a.t, { html: N('sobrou 5/12', 'au-medio au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
