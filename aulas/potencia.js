aulasMM.aulas['potencia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const SOBRE = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const elev = n => String(n).split('').map(d => SOBRE[d]).join('');

  // ---------- corrente de mensagem ----------
  function corrente() {
    const b = Number($('base').value), r = Number($('rodadas').value);
    $('o-base').textContent = b + ' amigos'; $('o-rodadas').textContent = r;
    const MAX = 216;
    $('corrente').innerHTML = Array.from({ length: r + 1 }, (_, k) => {
      const n = b ** k, mostra = Math.min(n, MAX);
      return `<div class="au-nivel"><small>${k === 0 ? 'você' : k + 'ª rodada'}<b>${fmt(n)}</b></small><div>${'<i></i>'.repeat(mostra)}${n > MAX ? `<em>+ ${fmt(n - MAX)}</em>` : ''}</div></div>`;
    }).join('');
    const n = b ** r;
    $('conta').innerHTML = r === 0 ? `${b}⁰ = <b>1</b> (só você)`
      : `${b}${elev(r)} = ${Array(r).fill(b).join(' × ')} = <b>${fmt(n)}</b>`;
    const total = Array.from({ length: r + 1 }, (_, k) => b ** k).reduce((s, x) => s + x, 0);
    $('recado').textContent = r === 0 ? 'Rodada zero: só você tem a mensagem. Por isso qualquer número elevado a 0 dá 1.'
      : `Na ${r}ª rodada, ${fmt(n)} pessoas recebem a mensagem (${b} multiplicado por ele mesmo ${r} vezes). Somando todas as rodadas, ${fmt(total)} pessoas já leram.`
        + (r >= 4 ? ' Cada rodada a mais multiplica, não soma: por isso uma fake news corre tão rápido.' : '');
  }
  for (const id of ['base', 'rodadas']) $(id).addEventListener('input', corrente);
  corrente();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const quadrado = cel => `<div class="au-grade-filme" style="grid-template-columns:repeat(3, var(--au-cel));--au-cel:${cel}px">${'<b class="au-on"></b>'.repeat(9)}</div>`;
  const ROTEIROS = {
    quadrado: {
      montar(p) {
        const a = { q: ator(p, quadrado(26), 30, 44) };
        a.q.querySelectorAll('b').forEach(c => { c.style.opacity = 0; });
        a.camadas = [0, 1, 2].map(k => por(ator(p, `<div class="au-camada">${quadrado(14)}</div>`, 68 + k * 5, 56 - k * 13), { o: 0 }));
        a.t1 = por(ator(p, N('3² = 3 × 3 = 9', 'au-medio'), 30, 86), { o: 0 });
        a.t2 = por(ator(p, N('3³ = 27', 'au-medio au-cor-u'), 74, 86), { o: 0 });
        return a;
      },
      passos: [
        [2000, 'Comece com uma fileira de <b>3</b> quadradinhos.', a => a.q.querySelectorAll('b').forEach((c, k) => { if (k < 3) c.style.opacity = 1; })],
        [2800, 'Faça <b>3 fileiras</b> de 3: um quadrado. <b>3² = 3 × 3 = 9</b>. Por isso se diz "três ao quadrado".', a => {
          a.q.querySelectorAll('b').forEach(c => { c.style.opacity = 1; }); por(a.t1, { o: 1 });
        }],
        [3200, 'Empilhe <b>3 camadas</b> desse quadrado: um cubo. <b>3³ = 3 × 3 × 3 = 27</b>, "três ao cubo".', a => {
          a.camadas.forEach((c, k) => por(c, { o: 1, atraso: k * 400 })); por(a.t2, { o: 1, atraso: 1200 });
        }]
      ]
    },
    erro: {
      montar(p) {
        const a = {
          b1: ator(p, '', 8, 34, 'au-barra-filme'), b2: ator(p, '', 8, 66, 'au-barra-filme'),
          t1: ator(p, N('2 × 5', 'au-pequeno'), 50, 18), t2: ator(p, N('2⁵', 'au-pequeno'), 50, 50)
        };
        a.b1.style.cssText += ';width:0;background:#e05252;transform:translate(0,-50%)';
        a.b2.style.cssText += ';width:0;background:#2f9e6a;transform:translate(0,-50%)';
        return a;
      },
      passos: [
        [2200, 'Muita gente lê <b>2⁵</b> como 2 × 5. Vamos comparar os dois.'],
        [2800, '<b>2 × 5</b> é somar o 2 cinco vezes: <b>10</b>.', a => { a.b1.style.width = '25%'; por(a.b1, { html: '10' }); por(a.t1, { html: N('2 × 5 = 2 + 2 + 2 + 2 + 2 = 10', 'au-pequeno') }); }],
        [3400, '<b>2⁵</b> é multiplicar o 2 por ele mesmo cinco vezes: <b>32</b>, mais que o triplo.', a => {
          a.b2.style.width = '80%'; por(a.b2, { html: '32' }); por(a.t2, { html: N('2⁵ = 2 × 2 × 2 × 2 × 2 = 32', 'au-pequeno au-certo-txt') });
        }]
      ]
    },
    dobras: {
      montar(p) {
        const a = { pilha: ator(p, '', 34, 50, 'au-papel'), n: ator(p, N('1 camada'), 72, 40), c: ator(p, N('', 'au-medio au-cor-d'), 72, 62) };
        a.pilha.style.setProperty('--au-camadas', 1);
        return a;
      },
      passos: (() => {
        const dobra = (k, txt) => [1900, txt, a => {
          a.pilha.style.setProperty('--au-camadas', 2 ** k);
          por(a.n, { html: N(`${2 ** k} camadas`) }); por(a.c, { html: N(`2${'⁰¹²³⁴⁵'[k]}`, 'au-medio au-cor-d') });
        }];
        return [
          [1900, 'Uma folha de papel: <b>1 camada</b>.'],
          dobra(1, 'Dobre ao meio: <b>2 camadas</b>.'),
          dobra(2, 'De novo: <b>4</b>. Cada dobra multiplica por 2.'),
          dobra(3, '<b>8</b>…'),
          dobra(4, '<b>16</b>…'),
          dobra(5, '<b>32</b> com só 5 dobras. É <b>2⁵</b>: a cada passo, × 2.')
        ];
      })()
    },
    dez: {
      montar(p) {
        const linhas = [['10¹', '10'], ['10²', '100'], ['10³', '1 000'], ['10⁶', '1 000 000']];
        const a = { l: linhas.map(([e, v], k) => por(ator(p, N(`${e} = ${v.replace(/0/g, '<span class="au-cor-u">0</span>')}`, 'au-medio'), 50, 14 + k * 18), { o: 0 })) };
        a.ex = por(ator(p, N('1,5 × 10⁸ = 150 000 000', 'au-medio au-certo-txt'), 50, 88), { o: 0 });
        return a;
      },
      passos: [
        [2200, '<b>10¹ = 10</b>: um zero.', a => por(a.l[0], { o: 1 })],
        [2200, '<b>10² = 100</b>: dois zeros.', a => por(a.l[1], { o: 1 })],
        [2200, '<b>10³ = 1 000</b>: três zeros. O expoente conta os zeros.', a => por(a.l[2], { o: 1 })],
        [2400, '<b>10⁶</b> é um milhão: seis zeros.', a => por(a.l[3], { o: 1 })],
        [3400, 'Assim se escrevem números enormes: 1,5 × 10⁸ é 1,5 com a vírgula andando 8 casas: <b>150 milhões</b>.', a => por(a.ex, { o: 1 })]
      ]
    },
    ordem: {
      montar(p) {
        const a = { e: ator(p, N('2 + <span class="au-foco">3²</span> × 2'), 50, 30), seta: por(ator(p, '', 50, 62, 'au-balao'), { o: 0 }) };
        a.errado = por(ator(p, '<span class="au-balao" style="background:var(--errado);color:#fff">da esquerda p/ direita: (2 + 3)² × 2 = 50 ✗</span>', 50, 86), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Expressão: <b>2 + 3² × 2</b>. Por onde começar?'],
        [2800, 'Primeiro a <b>potência</b>: 3² = 9.', a => { a.e.querySelector('.au-foco').classList.add('au-aceso-filme'); por(a.seta, { o: 1, html: '3² = 9' }); }],
        [2800, 'Fica <b>2 + 9 × 2</b>. Agora a <b>multiplicação</b>: 9 × 2 = 18.', a => { por(a.e, { html: N('2 + <span class="au-foco au-aceso-filme">9 × 2</span>') }); por(a.seta, { html: '9 × 2 = 18' }); }],
        [2800, 'Por último a <b>soma</b>: 2 + 18 = <b>20</b>.', a => { por(a.e, { html: N('2 + 18 = <span class="au-certo-txt">20</span>') }); por(a.seta, { o: 0 }); }],
        [3200, 'Quem vai só da esquerda para a direita erra. A ordem é: parênteses, potência, × e ÷, + e −.', a => por(a.errado, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
