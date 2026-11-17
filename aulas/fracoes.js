aulasMM.aulas['fracoes'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const mdc = (a, b) => (b ? mdc(b, a % b) : a);
  // Pizza de n fatias com k pintadas: fundo em cone e as linhas de corte por cima.
  const pizza = (n, k) => `repeating-conic-gradient(from 0deg, transparent 0 calc(${360 / n}deg - 1.6deg), rgba(40,26,12,.9) calc(${360 / n}deg - 1.6deg) ${360 / n}deg),
    conic-gradient(#e9b949 0 ${360 * k / n}deg, #7a5a36 ${360 * k / n}deg 360deg)`;

  // ---------- pizzaria ----------
  function pizzaria() {
    const n = Number($('partes').value);
    $('pegar').max = n;
    const k = Math.min(Number($('pegar').value), n);
    $('o-partes').textContent = n + ' fatias'; $('o-pegar').textContent = k;
    $('pizza').style.background = pizza(n, k);
    $('pizza').setAttribute('aria-label', `Pizza em ${n} fatias, ${k} escolhidas`);
    $('barra').style.setProperty('--au-n', n);
    $('barra').innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < k ? 'au-on' : ''}"></i>`).join('');
    const d = mdc(k, n), dec = k / n;
    $('fracao').innerHTML = `<span class="au-fr"><b>${k}</b><i></i><b>${n}</b></span>
      <small>= ${br(dec, Number.isInteger(dec * 100) ? (dec * 100 % 10 ? 2 : 1) : 3).replace(/,?0+$/, '') || '0'}<br>= ${br(dec * 100, Number.isInteger(dec * 100) ? 0 : 1)}%</small>`;
    $('recado').textContent = k === 0 ? 'Nenhuma fatia: 0/' + n + ' = 0.'
      : k === n ? `Todas as fatias: ${n}/${n} é a pizza inteira, igual a 1.`
      : d > 1 ? `${k}/${n} é o mesmo que ${k / d}/${n / d}: divida em cima e embaixo por ${d}. Mesma quantidade de pizza, menos fatias para contar.`
      : `${k} de ${n} fatias. O ${n} diz em quantas partes iguais cortou; o ${k}, quantas pegou.`;
  }
  for (const id of ['partes', 'pegar']) $(id).addEventListener('input', pizzaria);
  pizzaria();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const fr = (a, b, cls = '') => `<span class="au-fr au-fr-filme ${cls}"><b>${a}</b><i></i><b>${b}</b></span>`;
  const pizzaAtor = (p, n, k, x, y, tam = 34) => { const el = ator(p, '', x, y, 'au-pizza-filme'); el.style.width = tam + '%'; el.style.background = pizza(n, k); return el; };
  const ROTEIROS = {
    barra: {
      montar(p) {
        const a = { q: [] };
        for (let k = 0; k < 8; k++) a.q.push(ator(p, '<i class="au-choco"></i>', 12 + (k % 4) * 9.5, 30 + Math.floor(k / 4) * 22));
        a.d = por(ator(p, N('8 partes', 'au-medio au-cor-d'), 74, 30), { o: 0 });
        a.n = por(ator(p, N('comeu 3', 'au-medio au-cor-u'), 74, 54), { o: 0 });
        a.f = por(ator(p, fr(3, 8), 50, 84), { o: 0 });
        return a;
      },
      passos: [
        [2600, 'Uma barra de chocolate cortada em <b>8 pedaços iguais</b>. Esse 8 vai para baixo: é o <b>denominador</b>.', a => por(a.d, { o: 1 })],
        [2800, 'Você comeu <b>3 pedaços</b>. Esse 3 vai para cima: é o <b>numerador</b>.', a => {
          a.q.slice(0, 3).forEach((q, k) => por(q, { y: -20, o: 0, atraso: k * 250 })); por(a.n, { o: 1 });
        }],
        [3000, 'Você comeu <b>3/8</b> da barra: 3 de 8 partes. Sobraram 5/8.', a => por(a.f, { o: 1 })]
      ]
    },
    menores: {
      montar(p) {
        const a = { p1: pizzaAtor(p, 3, 1, 27, 36, 30), p2: pizzaAtor(p, 8, 1, 73, 36, 30) };
        a.f1 = ator(p, fr(1, 3), 27, 80); a.f2 = ator(p, fr(1, 8), 73, 80);
        a.maior = por(ator(p, N('>', 'au-medio au-certo-txt'), 50, 80), { o: 0 });
        return a;
      },
      passos: [
        [2600, 'Duas pizzas do <b>mesmo tamanho</b>. Uma cortada em 3, a outra em 8.'],
        [3000, 'Pegue <b>uma fatia</b> de cada. A de 1/3 é muito maior.', a => { a.p1.style.setProperty('--au-s', 1.06); a.p2.style.setProperty('--au-s', .94); }],
        [3000, 'Então <b>1/3 &gt; 1/8</b>. Quanto mais pedaços, menor cada pedaço.', a => por(a.maior, { o: 1 })]
      ]
    },
    equivalentes: {
      montar(p) {
        const a = { pz: pizzaAtor(p, 2, 1, 32, 48, 40), f: ator(p, fr(1, 2), 76, 40) };
        a.igual = por(ator(p, N('1/2 = 2/4 = 4/8', 'au-medio au-certo-txt'), 70, 80), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Metade da pizza: <b>1 de 2 fatias</b>.'],
        [2600, 'Corte cada fatia ao meio: agora são <b>2 de 4</b>. A parte pintada não mudou.', a => { a.pz.style.background = pizza(4, 2); por(a.f, { html: fr(2, 4) }); }],
        [2600, 'Corte de novo: <b>4 de 8</b>. Ainda é metade.', a => { a.pz.style.background = pizza(8, 4); por(a.f, { html: fr(4, 8) }); }],
        [3000, 'Frações <b>equivalentes</b>: números diferentes, mesma quantidade.', a => por(a.igual, { o: 1 })]
      ]
    },
    de: {
      montar(p) {
        const a = { al: [] };
        for (let k = 0; k < 30; k++) a.al.push(ator(p, '<i class="au-aluno"></i>', 14 + (k % 10) * 8, 22 + Math.floor(k / 10) * 14));
        a.grupos = [0, 1, 2, 3, 4].map(g => por(ator(p, N(`${g + 1}ª parte`, 'au-pequeno'), 12, 14 + g * 14), { o: 0 }));
        a.conta = por(ator(p, N('30 ÷ 5 = 6 · 2 × 6 = 12', 'au-medio au-certo-txt'), 50, 90), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Uma turma de <b>30 alunos</b>. Quanto é <b>2/5</b> da turma?'],
        [3200, 'O 5 manda dividir a turma em <b>5 partes iguais</b>: 30 ÷ 5 = <b>6 alunos</b> em cada.', a => {
          a.al.forEach((x, k) => { const g = Math.floor(k / 6), j = k % 6; por(x, { x: 30 + j * 9, y: 14 + g * 14, atraso: g * 150 }); });
          a.grupos.forEach((g, k) => por(g, { o: 1, atraso: k * 150 }));
        }],
        [3000, 'O 2 manda pegar <b>2 partes</b>: 2 × 6 = <b>12 alunos</b>.', a => {
          a.al.slice(0, 12).forEach(x => x.firstChild.classList.add('au-on')); por(a.conta, { o: 1 });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
