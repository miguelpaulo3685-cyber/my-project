aulasMM.aulas['divisores'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const mdc = (a, b) => (b ? mdc(b, a % b) : a);
  const SOBRE = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function fatorar(n) {
    const f = {};
    for (let p = 2; n > 1; p++) while (n % p === 0) { f[p] = (f[p] || 0) + 1; n /= p; }
    return Object.entries(f).map(([p, e]) => p + (e > 1 ? SOBRE[e] : '')).join(' × ') || '1';
  }

  // ---------- terminal ----------
  function terminal() {
    const a = Number($('a').value), b = Number($('b').value), m = a * b / mdc(a, b), d = mdc(a, b);
    $('o-a').textContent = `a cada ${a} min`; $('o-b').textContent = `a cada ${b} min`;
    const fim = Math.max(m, 60), X = t => 24 + t / fim * 284;
    const marcas = (passo, y, cor) => Array.from({ length: Math.floor(fim / passo) + 1 }, (_, k) => k * passo)
      .map(t => `<circle cx="${X(t)}" cy="${y}" r="${t === m || t === 0 ? 6 : 4}" fill="${t === m || t === 0 ? 'var(--certo)' : cor}"/>`).join('');
    $('linhas').innerHTML = `<text x="2" y="34">A</text><text x="2" y="74">B</text>
      <line x1="24" y1="30" x2="310" y2="30" stroke="currentColor" opacity=".25"/><line x1="24" y1="70" x2="310" y2="70" stroke="currentColor" opacity=".25"/>
      ${marcas(a, 30, '#62a8ea')}${marcas(b, 70, '#e9b949')}
      <line x1="${X(m)}" y1="16" x2="${X(m)}" y2="86" stroke="var(--certo)" stroke-dasharray="3 3"/>
      <text x="${X(m)}" y="104" text-anchor="middle" style="fill:var(--certo);font-weight:800">${m} min</text>
      <text x="24" y="104" text-anchor="middle">0</text>`;
    $('fatores').innerHTML = `${a} = ${fatorar(a)} · ${b} = ${fatorar(b)}<br>MMC = <b>${m}</b> · MDC = <b>${d}</b>`;
    $('recado').textContent = `As duas linhas saem juntas no minuto 0 e só voltam a sair juntas no minuto ${m}: é o primeiro número que está na "tabuada" do ${a} e na do ${b}. Isso é o MMC.`
      + (d === 1 ? ` Como ${a} e ${b} não têm divisor comum além do 1, o MMC é a própria multiplicação (${a} × ${b}).` : '');
  }
  for (const id of ['a', 'b']) $(id).addEventListener('input', terminal);
  terminal();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    criterios: {
      montar(p) {
        const L = [['÷ 2', 'termina em número par', '4 278'], ['÷ 3', 'a soma dos algarismos é múltiplo de 3', '4 + 2 + 7 + 8 = 21'], ['÷ 5', 'termina em 0 ou 5', '1 235'], ['÷ 10', 'termina em 0', '3 470']];
        return { l: L.map(([d, r, ex], k) => por(ator(p, `<div class="au-linha-relacao" style="--c:${['#62a8ea', '#e9b949', '#2f9e6a', '#c96b4b'][k]};grid-template-columns:44px minmax(0,1fr) 92px"><b>${d}</b><em>${r}</em><span style="font:700 12px var(--fonte)">${ex}</span></div>`, 50, 14 + k * 23), { o: 0 })) };
      },
      passos: [
        [2400, 'Divide por <b>2</b> quando o número é <b>par</b> (termina em 0, 2, 4, 6 ou 8).', a => por(a.l[0], { o: 1 })],
        [2800, 'Divide por <b>3</b> quando a <b>soma dos algarismos</b> divide por 3. 4 278: 4 + 2 + 7 + 8 = 21, então divide.', a => por(a.l[1], { o: 1 })],
        [2400, 'Divide por <b>5</b> quando termina em <b>0 ou 5</b>.', a => por(a.l[2], { o: 1 })],
        [2600, 'Divide por <b>10</b> quando termina em <b>0</b>. (Por 6: tem de dividir por 2 e por 3 ao mesmo tempo.)', a => por(a.l[3], { o: 1 })]
      ]
    },
    arvore: {
      montar(p) {
        const no = (t, x, y, primo) => por(ator(p, `<span class="au-chip${primo ? ' au-ok' : ''}">${t}</span>`, x, y), { o: 0 });
        const a = { n: [no('60', 44, 9), no('2', 26, 29, 1), no('30', 62, 29), no('2', 46, 49, 1), no('15', 78, 49), no('3', 64, 69, 1), no('5', 90, 69, 1)] };
        por(a.n[0], { o: 1 });
        a.t = ator(p, N('', 'au-medio'), 50, 90);
        return a;
      },
      passos: [
        [2200, 'Vamos quebrar o <b>60</b> em primos.'],
        [2400, '60 é par: <b>60 = 2 × 30</b>. O 2 é primo (verde): para aí.', a => { por(a.n[1], { o: 1 }); por(a.n[2], { o: 1 }); }],
        [2400, '30 também é par: <b>30 = 2 × 15</b>.', a => { por(a.n[3], { o: 1 }); por(a.n[4], { o: 1 }); }],
        [2400, '15 = <b>3 × 5</b>. Os dois são primos: acabou.', a => { por(a.n[5], { o: 1 }); por(a.n[6], { o: 1 }); }],
        [3000, 'Juntando as folhas verdes: <b>60 = 2 × 2 × 3 × 5 = 2² × 3 × 5</b>.', a => por(a.t, { html: N('60 = 2² × 3 × 5', 'au-medio au-certo-txt') })]
      ]
    },
    fitas: {
      montar(p) {
        const fita = (n, y, cor) => { const el = ator(p, `<div class="au-fita" style="--n:${n};background:${cor}">${'<i></i>'.repeat(n)}</div>`, 50, y); el.style.width = n * 4.6 + '%'; return el; };
        const a = { f1: fita(12, 26, '#62a8ea'), f2: fita(18, 52, '#e9b949'), t: ator(p, N('12 m e 18 m', 'au-medio'), 50, 84) };
        return a;
      },
      passos: [
        [2400, 'Duas fitas: <b>12 m</b> e <b>18 m</b>. Queremos pedaços iguais, os maiores possíveis.'],
        [2800, 'Pedaços de <b>3 m</b> servem (3 divide 12 e 18), mas dá para ser maior.', a => { a.f1.firstChild.dataset.corte = '3'; a.f2.firstChild.dataset.corte = '3'; por(a.t, { html: N('3 m: serve', 'au-medio') }); }],
        [3200, 'Pedaços de <b>6 m</b>: 2 na fita de 12 e 3 na de 18, sem sobrar. 6 é o <b>maior divisor comum</b>: MDC(12, 18) = 6.', a => {
          a.f1.firstChild.dataset.corte = '6'; a.f2.firstChild.dataset.corte = '6'; por(a.t, { html: N('MDC(12, 18) = 6', 'au-medio au-certo-txt') });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
