aulasMM.aulas['probabilidade'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;

  // ---------- mesa de dados ----------
  const EVENTOS = {
    sete: ['soma 7', (a, b) => a + b === 7],
    doze: ['soma 12', (a, b) => a + b === 12],
    dupla: ['dois números iguais', (a, b) => a === b],
    maior: ['soma maior que 9', (a, b) => a + b > 9]
  };
  let ev = 'sete', jogadas = 0, sucessos = 0, ultima = null;
  function mesa() {
    const [nome, f] = EVENTOS[ev];
    let fav = 0, html = '<i></i>' + [1, 2, 3, 4, 5, 6].map(b => `<i class="au-cab">${b}</i>`).join('');
    for (let a = 1; a <= 6; a++) {
      html += `<i class="au-cab">${a}</i>`;
      for (let b = 1; b <= 6; b++) {
        const ok = f(a, b); if (ok) fav++;
        const u = ultima && ultima[0] === a && ultima[1] === b;
        html += `<b class="${ok ? 'au-fav' : ''}${u ? ' au-ultima' : ''}">${a + b}</b>`;
      }
    }
    $('grade').innerHTML = html;
    $('grade').setAttribute('aria-label', `${fav} de 36 resultados dão ${nome}`);
    const teor = fav / 36;
    $('recado').innerHTML = `<b>Pela conta:</b> ${fav} dos 36 quadradinhos dão ${nome}: P = ${fav}/36 ≈ ${br(teor * 100, 1)}%.<br>`
      + (jogadas ? `<b>Na prática:</b> ${jogadas.toLocaleString('pt-BR')} jogada${jogadas > 1 ? 's' : ''}, ${sucessos.toLocaleString('pt-BR')} com ${nome}: ${br(100 * sucessos / jogadas, 1)}%. ${jogadas < 100 ? 'Com poucas jogadas, a sorte manda.' : 'Com muitas jogadas, a frequência chega perto da conta.'}` : 'Jogue os dados para comparar com a prática.')
      + (ultima ? ` <span class="au-ultimo-lance">Último lance: ${ultima[0]} e ${ultima[1]}.</span>` : '');
    raiz.querySelectorAll('[data-ev]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ev === ev)));
  }
  raiz.querySelectorAll('[data-ev]').forEach(b => b.addEventListener('click', () => { ev = b.dataset.ev; jogadas = sucessos = 0; ultima = null; mesa(); }));
  raiz.querySelectorAll('[data-jogar]').forEach(b => b.addEventListener('click', () => {
    const n = Number(b.dataset.jogar), f = EVENTOS[ev][1];
    for (let i = 0; i < n; i++) { const a = 1 + Math.floor(Math.random() * 6), c = 1 + Math.floor(Math.random() * 6); ultima = [a, c]; jogadas++; if (f(a, c)) sucessos++; }
    mesa();
  }));
  mesa();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    urna: {
      montar(p) {
        const a = { urna: ator(p, '', 30, 56, 'au-urna'), b: [] };
        for (let k = 0; k < 10; k++) a.b.push(ator(p, `<i class="au-bola" style="background:${k < 3 ? '#e05252' : '#62a8ea'}"></i>`, 18 + (k % 5) * 6, 50 + Math.floor(k / 5) * 12));
        a.t = ator(p, N('', 'au-medio'), 74, 50);
        return a;
      },
      passos: [
        [2400, 'Na urna: <b>3 vermelhas</b> e <b>7 azuis</b>. São 10 bolas, todas com a mesma chance.'],
        [2800, 'Casos que interessam (vermelhas): <b>3</b>. Casos possíveis: <b>10</b>.', a => { a.b.slice(0, 3).forEach(b => b.firstChild.classList.add('au-brilho')); por(a.t, { html: N('3 em 10', 'au-medio') }); }],
        [3000, 'P(vermelha) = <b>3/10 = 30%</b>.', a => por(a.t, { html: N('P = 3/10 = 30%', 'au-medio au-certo-txt') })]
      ]
    },
    moedas: {
      montar(p) {
        const no = (t, x, y) => por(ator(p, `<span class="au-chip">${t}</span>`, x, y), { o: 0 });
        const a = { m1: [no('Cara', 30, 26), no('Coroa', 30, 70)], m2: [no('Cara', 66, 14), no('Coroa', 66, 36), no('Cara', 66, 60), no('Coroa', 66, 82)] };
        a.ini = ator(p, N('🪙', 'au-medio'), 8, 48);
        a.t = ator(p, N('', 'au-pequeno'), 88, 14);
        return a;
      },
      passos: [
        [2400, '1ª moeda: <b>cara ou coroa</b>, metade de chance cada.', a => a.m1.forEach(n => por(n, { o: 1 }))],
        [2800, '2ª moeda: de novo cara ou coroa, para cada caso da 1ª. São <b>4 caminhos</b>.', a => a.m2.forEach((n, k) => por(n, { o: 1, atraso: k * 150 }))],
        [3000, 'Só <b>1</b> dos 4 caminhos é cara e cara: 1/2 × 1/2 = <b>1/4</b>.', a => { a.m1[0].firstChild.classList.add('au-ok'); a.m2[0].firstChild.classList.add('au-ok'); por(a.t, { html: N('1/4', 'au-medio au-certo-txt') }); }]
      ]
    },
    condicional: {
      montar(p) {
        const a = { f: [1, 2, 3, 4, 5, 6].map((v, k) => ator(p, `<span class="au-face">${'⚀⚁⚂⚃⚄⚅'[v - 1]}</span>`, 12 + k * 15, 38)) };
        a.t = ator(p, N('P(4) = 1/6', 'au-medio'), 50, 80);
        return a;
      },
      passos: [
        [2400, 'Um dado tem 6 faces. Sem saber nada, a chance de dar 4 é <b>1/6</b>.'],
        [3000, 'Alguém conta: <b>deu número par</b>. As faces ímpares saem do jogo.', a => [0, 2, 4].forEach(k => por(a.f[k], { o: .15 }))],
        [3200, 'Agora só sobram <b>3 casos</b>: 2, 4 e 6. A chance de ser 4 passou a ser <b>1/3</b>.', a => { a.f[3].firstChild.classList.add('au-ok'); por(a.t, { html: N('P(4 | par) = 1/3', 'au-medio au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
