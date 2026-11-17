aulasMM.aulas['razao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  // Cor do suco: mistura do caju com a água, conforme a parte de concentrado.
  const corSuco = t => { const a = [214, 236, 255], b = [226, 104, 48]; return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * Math.min(1, t * 2.6))).join(',')})`; };
  const copo = (c, w, nome) => {
    const t = c / (c + w), alt = Math.min(100, (c + w) / 16 * 100);
    return `<figure class="au-copo-fig"><div class="au-copo"><i style="height:${alt}%;background:${corSuco(t)}"></i></div>
      <figcaption>${nome}<b>${c} : ${w}</b><small>${br(t * 100, Number.isInteger(t * 100) ? 0 : 1)}% concentrado</small></figcaption></figure>`;
  };

  // ---------- suco ----------
  function suco() {
    const c = Number($('conc').value), w = Number($('agua').value);
    $('o-conc').textContent = c + (c === 1 ? ' copo' : ' copos'); $('o-agua').textContent = w + (w === 1 ? ' copo' : ' copos');
    $('copos').innerHTML = copo(c, w, 'Seu suco') + copo(1, 3, 'Receita da casa');
    const t = c / (c + w), casa = 1 / 4;
    $('recado').textContent = w === 0 ? 'Sem água: é concentrado puro, 100%.'
      : `Razão concentrado para água: ${c} : ${w}. No copo inteiro, ${c} de ${c + w} partes são concentrado (${c}/${c + w}). `
        + (Math.abs(t - casa) < 1e-9 ? 'Mesmo sabor da receita da casa, mesmo com outra quantidade: razões iguais.' : t > casa ? 'Mais forte que a receita da casa.' : 'Mais fraco que a receita da casa.');
  }
  for (const id of ['conc', 'agua']) $(id).addEventListener('input', suco);
  suco();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    turma: {
      montar(p) {
        const a = { gente: [] };
        for (let g = 0; g < 3; g++) for (let k = 0; k < 3; k++) {
          const menina = k > 0;
          a.gente.push(ator(p, `<i class="au-pessoa ${menina ? 'au-menina' : 'au-menino'}"></i>`, 14 + g * 30 + k * 8, 36));
        }
        a.grupo = [0, 1, 2].map(g => por(ator(p, '', 22 + g * 30, 36, 'au-saco'), { o: 0 }));
        a.t = ator(p, N('', 'au-medio'), 50, 76);
        return a;
      },
      passos: [
        [2400, 'Na turma, para cada <b>1 menino</b> (azul) há <b>2 meninas</b> (amarelo).'],
        [3000, 'Agrupe: cada grupo tem 2 meninas e 1 menino. Meninas para meninos: <b>2 : 1</b>, o dobro.', a => {
          a.grupo.forEach((g, k) => por(g, { o: 1, atraso: k * 300 })); por(a.t, { html: N('meninas : meninos = 2 : 1', 'au-medio') });
        }],
        [3200, 'Agora meninas para o <b>total</b>: 2 de cada 3. Ou seja, <b>2/3</b> da turma.', a => por(a.t, { html: N('meninas / total = 2/3', 'au-medio au-certo-txt') })]
      ]
    },
    forte: {
      montar(p) {
        const pilha = (c, w) => `<div class="au-pilha-copo">${'<i class="au-agua"></i>'.repeat(w)}${'<i class="au-conc"></i>'.repeat(c)}</div>`;
        const a = { A: ator(p, pilha(2, 5), 28, 44), B: ator(p, pilha(3, 8), 72, 44) };
        a.tA = ator(p, N('A: 2 para 5', 'au-pequeno'), 28, 88); a.tB = ator(p, N('B: 3 para 8', 'au-pequeno'), 72, 88);
        return a;
      },
      passos: [
        [2600, 'Suco <b>A</b>: 2 de concentrado e 5 de água. Suco <b>B</b>: 3 e 8. Qual é mais forte?'],
        [3200, 'Olhe a parte de concentrado no <b>copo inteiro</b>: A tem 2 de 7; B tem 3 de 11.', a => {
          por(a.tA, { html: N('A: 2/7', 'au-medio') }); por(a.tB, { html: N('B: 3/11', 'au-medio') });
        }],
        [3400, 'Dividindo: 2/7 ≈ <b>0,29</b> e 3/11 ≈ <b>0,27</b>. O <b>A</b> é mais forte, mesmo tendo menos concentrado.', a => {
          por(a.tA, { html: N('A ≈ 0,29', 'au-medio au-certo-txt') }); por(a.tB, { html: N('B ≈ 0,27', 'au-medio') });
        }]
      ]
    },
    escala: {
      montar(p) {
        const a = { mapa: ator(p, '', 50, 40, 'au-mapa') };
        a.c1 = ator(p, '<i class="au-ponto"></i>', 18, 40); a.c2 = ator(p, '<i class="au-ponto"></i>', 82, 40);
        a.n1 = ator(p, N('Vila', 'au-pequeno'), 18, 26); a.n2 = ator(p, N('Centro', 'au-pequeno'), 82, 26);
        a.regua = por(ator(p, `<div class="au-regua">${'<i></i>'.repeat(5)}</div>`, 50, 54), { o: 0 });
        a.esc = ator(p, '<span class="au-balao">escala 1 : 100 000</span>', 50, 12);
        a.t = ator(p, N('', 'au-medio'), 50, 84);
        return a;
      },
      passos: [
        [2400, 'No mapa, a escala é <b>1 : 100 000</b>.'],
        [2800, 'Com a régua: da Vila ao Centro dá <b>5 cm</b> no mapa.', a => { por(a.regua, { o: 1 }); por(a.t, { html: N('5 cm no mapa', 'au-medio') }); }],
        [3000, '1 cm no mapa = 100 000 cm reais = 1 000 m = <b>1 km</b>.', a => por(a.t, { html: N('1 cm → 1 km', 'au-medio au-cor-d') })],
        [3000, 'Então 5 cm no mapa são <b>5 km</b> de verdade.', a => por(a.t, { html: N('5 cm → 5 km', 'au-medio au-certo-txt') })]
      ]
    },
    velocidade: {
      montar(p) {
        const a = { estrada: ator(p, '', 50, 50, 'au-estrada'), bus: ator(p, '<span style="font-size:28px">🚌</span>', 10, 38) };
        a.m = ator(p, N('0 km', 'au-pequeno'), 10, 64); a.f = ator(p, N('120 km', 'au-pequeno'), 90, 64);
        a.meio = por(ator(p, N('60 km', 'au-pequeno au-cor-u'), 50, 64), { o: 0 });
        a.h = ator(p, N('0 h', 'au-medio'), 50, 18);
        a.t = por(ator(p, N('120 km ÷ 2 h = 60 km/h', 'au-medio au-certo-txt'), 50, 86), { o: 0 });
        return a;
      },
      passos: [
        [2200, 'O ônibus vai rodar <b>120 km</b>.'],
        [2600, 'Depois de <b>1 hora</b>, está no km 60.', a => { por(a.bus, { x: 50 }); por(a.meio, { o: 1 }); por(a.h, { html: N('1 h', 'au-medio') }); }],
        [2600, 'Depois de <b>2 horas</b>, chegou: 120 km.', a => { por(a.bus, { x: 90 }); por(a.h, { html: N('2 h', 'au-medio') }); }],
        [3000, 'A razão distância ÷ tempo é a <b>velocidade</b>: 60 km a cada hora, <b>60 km/h</b>.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
