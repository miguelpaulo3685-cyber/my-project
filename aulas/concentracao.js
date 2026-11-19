aulasMM.aulas['concentracao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Posições fixas (de 0 a 1) para os grãos de açúcar dentro do líquido
  const GRAOS = Array.from({ length: 20 }, (_, k) => [((k * 37) % 19) / 19, ((k * 53) % 17) / 17]);
  function desenhar() {
    const m = Number($('m').value), v = Number($('v').value), C = m / (v / 1000);
    $('mo').textContent = `${m} g`; $('vo').textContent = `${v} mL`;
    const alto = 20 + v / 1000 * 110, topo = 140 - alto, cor = Math.min(1, C / 400);
    let s = `<path d="M110 10 L118 140 H202 L210 10" fill="none" stroke="currentColor" stroke-width="3" opacity=".6"/>
      <path d="M${110 + 8 * (topo - 10) / 130} ${topo} L118 140 H202 L${210 - 8 * (topo - 10) / 130} ${topo} Z" fill="#e9b949" opacity="${0.12 + 0.6 * cor}"/>`;
    const n = Math.round(m / 5);
    for (let k = 0; k < n; k++) { const [a, b] = GRAOS[k]; s += `<rect x="${124 + a * 70}" y="${topo + 6 + b * (alto - 14)}" width="4" height="4" fill="#f4f1ea"/>`; }
    s += `<text x="220" y="${topo + 4}" style="fill:var(--texto)">${v} mL</text><text x="40" y="80" text-anchor="middle" style="font-size:26px">🍬</text><text x="40" y="104" text-anchor="middle">${m} g</text>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `${m} gramas de açúcar em ${v} mililitros: ${br(C, 0)} gramas por litro`);
    $('eq').innerHTML = `C = <span>${m} g</span> ÷ <span>${br(v / 1000, 2)} L</span> = <span>${br(C, 0)} g/L</span>`;
    const comp = C === 0 ? 'água pura' : C < 60 ? 'menos doce que refrigerante' : C <= 130 ? 'parecido com refrigerante' : 'mais doce que refrigerante';
    $('leituras').innerHTML = leitura('Em g/L', `${br(C, 0)} g/L`) + leitura('Em mol/L', `${br(C / 342, 2)} mol/L`) + leitura('Comparação', comp);
    $('recado').textContent = C === 0 ? 'Sem soluto, é só água. Coloque açúcar.'
      : `Cada litro dessa solução tem ${br(C, 0)} g de açúcar. Refrigerante comum tem uns 100 g/L. Mais açúcar no mesmo volume: mais concentrado. Mesmo açúcar em mais água: menos concentrado.`;
  }
  $('m').addEventListener('input', desenhar);
  $('v').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: qual é mais doce? ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const copo = (h, a) => `<span style="display:block;width:64px;height:90px;border:3px solid currentColor;border-top:none;border-radius:0 0 10px 10px;position:relative;opacity:.9">
    <span style="position:absolute;left:0;right:0;bottom:0;height:${h}%;background:#e9b949;opacity:${a};border-radius:0 0 7px 7px"></span></span>`;
  const ROTEIROS = {
    doce: {
      montar(p) {
        return {
          a: ator(p, copo(30, .7), 30, 44), b: ator(p, copo(90, .25), 70, 44),
          ta: ator(p, N('20 g em 100 mL'), 30, 82), tb: ator(p, N('20 g em 300 mL'), 70, 82),
          ca: por(ator(p, N('200 g/L'), 30, 94), { o: 0 }), cb: por(ator(p, N('≈ 67 g/L'), 70, 94), { o: 0 })
        };
      },
      passos: [
        [2600, 'Dois copos com a <b>mesma</b> quantidade de açúcar: 20 g. Qual é mais doce?'],
        [3000, 'O da esquerda tem menos água: o açúcar fica mais "apertado". É <b>mais concentrado</b>.', a => { por(a.ca, { o: 1 }); por(a.cb, { o: 1 }); }],
        [2800, 'Concentração não é só quanto soluto tem: é quanto tem <b>em cada litro</b>.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
