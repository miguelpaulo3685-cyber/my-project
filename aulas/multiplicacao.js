aulasMM.aulas['multiplicacao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // ---------- plateia: linhas × colunas ----------
  let quebrado = false;
  function plateia() {
    const l = Number($('linhas').value), c = Number($('colunas').value), total = l * c;
    $('o-linhas').textContent = l; $('o-colunas').textContent = c;
    const pode = c > 10;
    if (!pode) quebrado = false;
    $('quebrar').setAttribute('aria-pressed', String(quebrado));
    $('plateia').style.setProperty('--au-cols', c);
    $('plateia').innerHTML = Array.from({ length: total }, (_, k) => `<i class="${quebrado && k % c >= 10 ? 'au-b' : ''}"></i>`).join('');
    $('plateia').setAttribute('aria-label', `${l} fileiras de ${c} cadeiras`);
    $('conta').innerHTML = quebrado
      ? `${l} × ${c} = <span style="color:#62a8ea">${l} × 10</span> + <span style="color:#e9b949">${l} × ${c - 10}</span> = ${l * 10} + ${l * (c - 10)} = <b>${fmt(total)}</b>`
      : `${l} × ${c} = <b>${fmt(total)}</b> cadeiras`;
    $('recado').textContent = quebrado
      ? `O retângulo foi cortado depois da 10ª cadeira. A parte azul é ${l} × 10 = ${l * 10}, conta de cabeça. A amarela é ${l} × ${c - 10} = ${l * (c - 10)}. Juntando, ${fmt(total)}.`
      : pode ? `Contar cadeira por cadeira daria ${fmt(total)} toques. Fileiras × cadeiras resolve de uma vez. Experimente quebrar a conta em 10 + o resto.`
        : `Com até 10 cadeiras por fileira a conta já é de tabuada. Ponha mais de 10 para usar o corte.`;
  }
  for (const k of ['linhas', 'colunas']) $(k).addEventListener('input', plateia);
  $('quebrar').addEventListener('click', () => {
    if (Number($('colunas').value) <= 10) $('colunas').value = 12;
    quebrado = !quebrado; plateia();
  });
  plateia();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const grade = (linhas, colunas, cel, cor = c => 'au-on') => `<div class="au-grade-filme" style="grid-template-columns:repeat(${colunas}, var(--au-cel));--au-cel:${cel}px">${
    Array.from({ length: linhas * colunas }, (_, k) => `<b class="${cor(k % colunas)}"></b>`).join('')}</div>`;
  const ROTEIROS = {
    grupos: {
      montar(p) {
        const caixa = `<div class="au-caixa-ovos">${'<i class="au-ovo"></i>'.repeat(6)}</div>`;
        const a = { cx: [14, 38, 62, 86].map(x => ator(p, caixa, x, 36)) };
        a.seis = [14, 38, 62, 86].map((x, k) => por(ator(p, N('6' + (k < 3 ? ' +' : ''), 'au-medio'), x + (k < 3 ? 4 : 0), 66), { o: 0 }));
        a.res = por(ator(p, N('4 × 6 = 24', 'au-medio au-certo-txt'), 50, 88), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'São <b>4 caixas</b>, cada uma com <b>6 ovos</b>. Quantos ovos ao todo?'],
        [3200, 'Somando caixa por caixa: <b>6 + 6 + 6 + 6 = 24</b>.', a => a.seis.forEach((s, k) => por(s, { o: 1, atraso: k * 450 }))],
        [3200, 'Como todas as parcelas são iguais, dá para dizer de uma vez: <b>4 grupos de 6</b>, ou seja, <b>4 × 6 = 24</b>.', a => por(a.res, { o: 1 })]
      ]
    },
    girar: {
      montar(p) {
        const a = { g: ator(p, grade(3, 5, 22), 50, 44) };
        a.tit = ator(p, N('3 fileiras de 5', 'au-medio'), 50, 88);
        return a;
      },
      passos: [
        [2600, 'Arrume 15 quadradinhos em <b>3 fileiras de 5</b>: um retângulo 3 × 5.'],
        [3200, 'Agora gire o retângulo. Viram <b>5 fileiras de 3</b>, e nenhum quadradinho entrou ou saiu.', a => {
          a.g.style.setProperty('--au-r', '90deg'); por(a.tit, { html: N('5 fileiras de 3', 'au-medio') });
        }],
        [3000, 'Por isso <b>3 × 5 = 5 × 3 = 15</b>. Na multiplicação, a ordem não muda o resultado.', a => por(a.tit, { html: N('3 × 5 = 5 × 3 = 15', 'au-medio au-certo-txt') })]
      ]
    },
    quebrar: {
      montar(p) {
        const a = { g: ator(p, grade(4, 23, 9), 50, 38) };
        a.l1 = por(ator(p, N('20 × 4 = 80', 'au-medio au-cor-d'), 30, 66), { o: 0 });
        a.l2 = por(ator(p, N('3 × 4 = 12', 'au-medio au-cor-u'), 76, 66), { o: 0 });
        a.tot = por(ator(p, N('80 + 12 = 92', 'au-medio au-certo-txt'), 50, 88), { o: 0 });
        a.tit = ator(p, N('23 × 4 = ?', 'au-medio'), 50, 72);
        return a;
      },
      passos: [
        [2400, 'Um retângulo de <b>4 fileiras de 23</b>: é a conta 23 × 4.'],
        [3000, 'Corte depois da 20ª coluna. Ficam um pedaço de <b>20 × 4</b> e outro de <b>3 × 4</b>.', a => {
          por(a.tit, { o: 0 }); a.g.querySelectorAll('b').forEach((c, k) => { if (k % 23 >= 20) c.className = 'au-on2'; });
          a.g.firstChild.style.columnGap = '2px';
        }],
        [3000, 'Cada pedaço é fácil: <b>20 × 4 = 80</b> e <b>3 × 4 = 12</b>.', a => { por(a.l1, { o: 1 }); por(a.l2, { o: 1, atraso: 500 }); }],
        [3000, 'Junte os pedaços: <b>80 + 12 = 92</b>.', a => por(a.tot, { o: 1 })]
      ]
    },
    dobro: {
      montar(p) {
        const a = { r: ator(p, '25 × 16', 50, 40, 'au-barra-filme') };
        a.r.style.cssText += ';width:22%;height:96px;line-height:96px;background:#3f87c9;transition:width .8s, height .8s, line-height .8s, opacity .45s !important';
        a.tit = ator(p, N('25 × 16', 'au-medio'), 50, 86);
        return a;
      },
      passos: [
        [2600, 'Um retângulo de <b>25 por 16</b>. Fazer 25 × 16 assim parece chato.'],
        [3200, 'Corte ao meio na altura e cole do lado: fica <b>50 por 8</b>. Mesma área.', a => {
          por(a.r, { html: '50 × 8' }); a.r.style.width = '44%'; a.r.style.height = '48px'; a.r.style.lineHeight = '48px';
          por(a.tit, { html: N('25 × 16 = 50 × 8', 'au-medio') });
        }],
        [3200, 'Mais uma vez: <b>100 por 4</b>. E 100 × 4 a gente faz de cabeça.', a => {
          por(a.r, { html: '100 × 4' }); a.r.style.width = '88%'; a.r.style.height = '24px'; a.r.style.lineHeight = '24px';
          por(a.tit, { html: N('= 100 × 4', 'au-medio') });
        }],
        [3000, 'Resultado: <b>400</b>. Dobra um, divide o outro por 2, e a área fica igual.', a => por(a.tit, { html: N('25 × 16 = 100 × 4 = 400', 'au-medio au-certo-txt') })]
      ]
    },
    zeros: {
      montar(p) {
        const a = {
          tres: ator(p, N('3'), 30, 36), z1: ator(p, N('0'), 37, 36), vezes: ator(p, N('×'), 46, 36),
          quatro: ator(p, N('4'), 56, 36), z2: ator(p, N('00'), 66, 36),
          caixa: por(ator(p, N('zeros guardados', 'au-pequeno'), 78, 16), { o: 0 }),
          res: por(ator(p, N('= 12'), 50, 66), { o: 0 })
        };
        return a;
      },
      passos: [
        [2400, 'Conta: <b>30 × 400</b>.'],
        [3000, 'Guarde os zeros de lado: <b>um</b> do 30 e <b>dois</b> do 400. Sobra <b>3 × 4</b>.', a => {
          por(a.caixa, { o: 1 }); por(a.z1, { x: 72, y: 32 }); por(a.z2, { x: 81, y: 32 });
          por(a.tres, { x: 36 }); por(a.quatro, { x: 54 }); por(a.vezes, { x: 45 });
        }],
        [2600, 'Tabuada: <b>3 × 4 = 12</b>.', a => por(a.res, { o: 1 })],
        [3200, 'Devolva os <b>três zeros</b>: 12 vira <b>12 000</b>.', a => {
          por(a.z1, { x: 60, y: 66 }); por(a.z2, { x: 68, y: 66 });
          setTimeout(() => { por(a.res, { html: N('= 12 000', 'au-certo-txt') }); por(a.z1, { o: 0 }); por(a.z2, { o: 0 }); por(a.caixa, { o: 0 }); }, 800);
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
