aulasMM.aulas['solidos'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const litros = v => v >= 1000 ? br(v / 1000, v % 1000 ? 1 : 0) + ' L' : br(v, 0) + ' mL';
  let forma = 'caixa';
  function desenhar() {
    const a = Number($('a').value), b = Number($('b').value), c = Number($('c').value);
    $('oa').textContent = a + ' cm'; $('ob').textContent = b + ' cm'; $('oc').textContent = c + ' cm';
    const k = 3.2, cx = 150, cy = 150, cor = '#62a8ea';
    let V, A, svg, conta;
    if (forma === 'caixa') {
      V = a * b * c; A = 2 * (a * b + a * c + b * c);
      const w = a * k, d = b * k * 0.5, h = c * k;
      svg = `<path d="M${cx - w / 2} ${cy} h${w} v${-h} h${-w} z" fill="${cor}" fill-opacity=".3" stroke="currentColor" stroke-width="2"/>
        <path d="M${cx - w / 2} ${cy - h} l${d} ${-d} h${w} l${-d} ${d} M${cx + w / 2} ${cy} l${d} ${-d} v${-h}" fill="${cor}" fill-opacity=".15" stroke="currentColor" stroke-width="2"/>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle">${a} cm</text><text x="${cx - w / 2 - 6}" y="${cy - h / 2}" text-anchor="end">${c} cm</text><text x="${cx + w / 2 + d / 2 + 6}" y="${cy - d / 2 + 4}">${b} cm</text>`;
      conta = `V = ${a} × ${b} × ${c} = ${br(V, 0)} cm³`;
    } else {
      const r = a / 2, h = c; // na lata, o 1º controle é o diâmetro
      V = Math.PI * r * r * h; A = 2 * Math.PI * r * r + 2 * Math.PI * r * h;
      const w = a * k, hh = h * k, ry = w * 0.18;
      svg = `<path d="M${cx - w / 2} ${cy - hh} v${hh} a${w / 2} ${ry} 0 0 0 ${w} 0 v${-hh}" fill="${cor}" fill-opacity=".3" stroke="currentColor" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy - hh}" rx="${w / 2}" ry="${ry}" fill="${cor}" fill-opacity=".4" stroke="currentColor" stroke-width="2"/>
        <text x="${cx}" y="${cy + ry + 14}" text-anchor="middle">diâmetro ${a} cm</text><text x="${cx - w / 2 - 6}" y="${cy - hh / 2}" text-anchor="end">${h} cm</text>`;
      conta = `V = π × ${br(r, 1)}² × ${h} ≈ ${br(V, 0)} cm³`;
    }
    $('graf').innerHTML = svg;
    $('graf').setAttribute('aria-label', `${forma === 'caixa' ? 'Caixa' : 'Lata'} com volume de ${litros(V)}`);
    $('leituras').innerHTML = leitura('Volume', br(V, 0) + ' cm³') + leitura('Cabe', litros(V)) + leitura('Área (material)', br(A, 0) + ' cm²');
    $('recado').textContent = `${conta}, ou ${litros(V)} (1 000 cm³ = 1 litro). ${forma === 'caixa' ? 'Experimente dobrar as três medidas: o volume fica 8 vezes maior.' : 'Dobre o diâmetro com a mesma altura: o volume fica 4 vezes maior, porque o raio entra ao quadrado.'}`;
  }
  function trocar(f) {
    forma = f;
    $('ra').textContent = f === 'caixa' ? 'Comprimento' : 'Diâmetro'; $('rb').textContent = 'Largura';
    raiz.querySelector('#au-b').closest('.au-controle').hidden = f === 'lata';
    raiz.querySelectorAll('[data-forma]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.forma === f)));
    desenhar();
  }
  raiz.querySelectorAll('[data-forma]').forEach(b => b.addEventListener('click', () => trocar(b.dataset.forma)));
  ['a', 'b', 'c'].forEach(id => $(id).addEventListener('input', desenhar));
  trocar('caixa');

  // ---------- filminho: planificar a lata ----------
  const { ator, por } = aulasMM;
  const circ = '<span style="display:block;width:46px;height:46px;border-radius:50%;background:#62a8ea;opacity:.8"></span>';
  const ROTEIROS = {
    planificar: {
      montar(p) {
        return {
          lata: ator(p, '<span style="font-size:64px">🥫</span>', 50, 50),
          t1: por(ator(p, circ, 50, 16), { o: 0 }), t2: por(ator(p, circ, 50, 84), { o: 0 }),
          lado: por(ator(p, '<span style="display:block;width:150px;height:60px;background:#e9b949;opacity:.85;border-radius:3px"></span>', 50, 50), { o: 0 }),
          t: por(ator(p, '<span class="au-numero au-pequeno">largura = 2πr</span>', 50, 50), { o: 0 })
        };
      },
      passos: [
        [2200, 'Uma lata fechada.'],
        [3000, 'Abra: saem dois <b>círculos</b> (tampa e fundo) e um <b>retângulo</b>, a parede lateral desenrolada.', a => { por(a.lata, { o: 0 }); [a.t1, a.t2, a.lado].forEach(x => por(x, { o: 1 })); }],
        [3000, 'O retângulo tem a altura da lata e largura igual à volta: <b>2πr</b>. Área total = 2πr² + 2πr · h.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
