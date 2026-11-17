aulasMM.aulas['radiciacao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;

  // ---------- piso quadrado ----------
  function piso() {
    const A = Number($('area').value), lado = Math.sqrt(A), inteiro = Number.isInteger(lado);
    $('o-area').textContent = A + ' m²';
    const baixo = Math.floor(lado), cima = Math.ceil(lado), max = 12;
    // O quadrado cresce na proporção do lado; com lado inteiro mostra os quadradinhos de 1 m².
    $('quadrado').innerHTML = `<div class="au-piso" style="width:${Math.max(14, lado / max * 160)}px;--n:${Math.max(1, Math.round(lado))}" data-inteiro="${inteiro}"><span>${inteiro ? lado : br(lado, 2)} m</span></div>`;
    $('quadrado').setAttribute('aria-label', `Quadrado de ${A} metros quadrados, lado ${br(lado, 2)} metros`);
    $('conta').innerHTML = inteiro ? `√${A} = <b>${lado}</b>, porque ${lado} × ${lado} = ${A}` : `√${A} ≈ <b>${br(lado, 2)}</b> (entre ${baixo} e ${cima})`;
    $('recado').textContent = inteiro
      ? `${A} é um quadrado perfeito: dá para montar um quadrado de ${lado} por ${lado} quadradinhos de 1 m².`
      : `${A} não é quadrado perfeito. ${baixo}² = ${baixo * baixo} e ${cima}² = ${cima * cima}: a raiz fica entre ${baixo} e ${cima}, mais perto de ${A - baixo * baixo < cima * cima - A ? baixo : cima}.`;
  }
  $('area').addEventListener('input', piso);
  piso();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const xReta = (v, de, ate) => 8 + (v - de) / (ate - de) * 84;
  const ROTEIROS = {
    estimar: {
      montar(p) {
        const x = v => xReta(v, 6.5, 8.5);
        const a = { reta: ator(p, '', 50, 52, 'au-reta'), x };
        a.m = [7, 8].map(v => ator(p, `<span class="au-tique"></span>${N(v, 'au-pequeno')}`, x(v), 60, 'au-marca-reta'));
        a.q = [[7, '7² = 49'], [8, '8² = 64']].map(([v, t]) => por(ator(p, `<span class="au-balao">${t}</span>`, x(v), 24), { o: 0 }));
        a.p = por(ator(p, '<i class="au-ponto"></i>', x(7.07), 52), { o: 0 });
        a.t = ator(p, N('√50 = ?', 'au-medio'), 50, 88);
        return a;
      },
      passos: [
        [2400, 'Quanto é <b>√50</b>? Procure os quadrados perfeitos em volta de 50.'],
        [2800, '<b>7² = 49</b> e <b>8² = 64</b>. Então √50 está entre 7 e 8.', a => a.q.forEach(b => por(b, { o: 1 }))],
        [3000, '50 está colado no 49 (só 1 a mais) e longe do 64. Então √50 é <b>pouco mais que 7</b>: uns 7,07.', a => { por(a.p, { o: 1 }); por(a.t, { html: N('√50 ≈ 7,07', 'au-medio au-certo-txt') }); }]
      ]
    },
    fatores: {
      montar(p) {
        const dois = (x, y, cor) => ator(p, `<span class="au-chip" style="border-color:${cor}">2</span>`, x, y);
        const a = { g1: [0, 1, 2].map(k => dois(14 + k * 11, 34, '#62a8ea')), g2: [0, 1].map(k => dois(64 + k * 11, 34, '#e9b949')) };
        a.t1 = ator(p, N('2³', 'au-medio au-cor-d'), 25, 12); a.t2 = ator(p, N('2²', 'au-medio au-cor-u'), 70, 12);
        a.x = ator(p, N('×'), 50, 34);
        a.r = ator(p, N('2³ × 2² = ?', 'au-medio'), 50, 82);
        return a;
      },
      passos: [
        [2400, '<b>2³</b> são três 2 multiplicados. <b>2²</b> são dois.'],
        [3000, 'Junte tudo numa fila só: são <b>cinco</b> 2 multiplicados.', a => {
          por(a.x, { o: 0 }); [...a.g1, ...a.g2].forEach((c, k) => por(c, { x: 22 + k * 12, y: 44, atraso: k * 120 }));
        }],
        [3000, 'Então <b>2³ × 2² = 2⁵ = 32</b>. Mesma base multiplicando: soma os expoentes (3 + 2 = 5).', a => por(a.r, { html: N('2³ × 2² = 2³⁺² = 2⁵', 'au-medio au-certo-txt') })]
      ]
    },
    cientifica: {
      montar(p) {
        const dig = ['0', ',', '0', '0', '0', '2', '5'];
        const xs = k => 22 + k * 8;
        const a = { d: dig.map((t, k) => ator(p, N(t === ',' ? '' : t), xs(k), 36)), v: ator(p, N(','), xs(1), 38), xs };
        a.cont = ator(p, N('', 'au-pequeno au-cor-u'), 50, 14);
        a.t = ator(p, N('0,00025', 'au-medio'), 50, 82);
        return a;
      },
      passos: [
        [2400, 'O número <b>0,00025</b>, bem pequeno.'],
        [3200, 'Ande com a vírgula para a <b>direita</b> até sobrar um algarismo antes dela (o 2). Foram <b>4 casas</b>.', a => {
          por(a.v, { x: a.xs(5) + 4 }); por(a.cont, { html: N('→ 4 casas', 'au-pequeno au-cor-u') });
          [0, 2, 3, 4].forEach(k => por(a.d[k], { o: .25 }));
        }],
        [3200, 'Andou para a direita, então o expoente é <b>negativo</b>: <b>2,5 × 10⁻⁴</b>. (Número grande daria expoente positivo.)', a => por(a.t, { html: N('0,00025 = 2,5 × 10⁻⁴', 'au-medio au-certo-txt') })]
      ]
    },
    racionalizar: {
      montar(p) {
        const fr = (c, b) => `<span class="au-fr au-fr-filme"><b style="color:var(--texto)">${c}</b><i></i><b style="color:var(--texto)">${b}</b></span>`;
        const a = { f: ator(p, fr('1', '√2'), 30, 44), vezes: por(ator(p, N('×'), 48, 44), { o: 0 }), um: por(ator(p, fr('√2', '√2'), 64, 44), { o: 0 }), fr };
        a.t = ator(p, N('', 'au-medio'), 50, 86);
        return a;
      },
      passos: [
        [2400, 'A fração <b>1/√2</b> tem raiz embaixo. Difícil de dividir de cabeça.'],
        [2800, 'Multiplique por <b>√2/√2</b>, que vale 1: o valor não muda.', a => { por(a.vezes, { o: 1 }); por(a.um, { o: 1 }); }],
        [3200, 'Embaixo, √2 × √2 = 2. Fica <b>√2/2</b> ≈ 1,41 ÷ 2 ≈ <b>0,71</b>. A raiz saiu do denominador.', a => {
          por(a.vezes, { o: 0 }); por(a.um, { o: 0 }); por(a.f, { x: 50, html: a.fr('√2', '2') }); por(a.t, { html: N('1/√2 = √2/2 ≈ 0,71', 'au-medio au-certo-txt') });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
