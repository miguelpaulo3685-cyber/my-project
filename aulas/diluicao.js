aulasMM.aulas['diluicao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const C1 = 120, V1 = 100, GRAOS = 12;
  // Copo: volume em mL (até 600) vira altura; os grãos se espalham pelo líquido
  function copo(x, vol, conc, rot) {
    const alto = 12 + vol / 600 * 112, topo = 136 - alto;
    let s = `<path d="M${x} 10 L${x + 6} 136 H${x + 76} L${x + 82} 10" fill="none" stroke="currentColor" stroke-width="3" opacity=".6"/>
      <rect x="${x + 5}" y="${topo}" width="72" height="${alto}" fill="#ff8a3d" opacity="${0.1 + Math.min(1, conc / 120) * 0.7}"/>`;
    for (let k = 0; k < GRAOS; k++) s += `<circle cx="${x + 14 + ((k * 37) % 11) / 11 * 54}" cy="${topo + 6 + ((k * 53) % 13) / 13 * (alto - 12)}" r="2.6" fill="#f4f1ea"/>`;
    return s + `<text x="${x + 41}" y="148" text-anchor="middle">${rot}: ${vol} mL</text>`;
  }
  function desenhar() {
    const a = Number($('a').value), V2 = V1 + a, C2 = C1 * V1 / V2;
    $('ao').textContent = `${a} mL`;
    $('graf').innerHTML = copo(20, V1, C1, 'antes') + `<text x="160" y="80" text-anchor="middle" style="font-size:20px;fill:var(--texto)">→</text>` + copo(218, V2, C2, 'depois');
    $('graf').setAttribute('aria-label', `Suco de ${C1} g/L em ${V1} mL; depois de ${a} mL de água, ${br(C2, 0)} g/L em ${V2} mL`);
    $('eq').innerHTML = `<span>${C1}</span> · <span>${V1}</span> = C₂ · <span>${V2}</span> → C₂ = <span>${br(C2, 1)} g/L</span>`;
    $('leituras').innerHTML = leitura('Soluto', `${br(C1 * V1 / 1000, 0)} g (não muda)`) + leitura('Volume final', `${V2} mL`) + leitura('Concentração', `${br(C2, 1)} g/L`);
    $('recado').textContent = a === 0 ? 'Sem água, o suco continua concentrado: 12 g de soluto em 100 mL.'
      : `Os mesmos 12 g de soluto (os 12 pontinhos) agora estão em ${V2} mL. O volume ficou ${br(V2 / V1, Number.isInteger(V2 / V1) ? 0 : 1)} vezes maior, e a concentração ficou o mesmo tanto de vezes menor: ${br(C2, 1)} g/L.`;
  }
  $('a').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: o soluto se espalha ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const PONTO = '<span style="display:block;width:10px;height:10px;border-radius:50%;background:#ff8a3d"></span>';
  const ROTEIROS = {
    espalha: {
      montar(p) {
        const a = { t: ator(p, N('6 partículas de soluto'), 50, 90) };
        a.p = [0, 1, 2, 3, 4, 5].map(k => ator(p, PONTO, 44 + (k % 3) * 6, 40 + Math.floor(k / 3) * 8));
        a.agua = por(ator(p, '<span style="display:block;width:260px;height:76px;border-radius:12px;background:#2f7bd8;opacity:.25"></span>', 50, 46), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Pouco solvente: as partículas de soluto ficam juntas. Solução <b>concentrada</b>.'],
        [3000, 'Adicionamos água: as <b>mesmas</b> partículas se espalham por um volume maior.', a => { por(a.agua, { o: 1 }); a.p.forEach((x, k) => por(x, { x: [14, 40, 66, 26, 54, 86][k], y: [22, 34, 20, 60, 70, 52][k] })); }],
        [2800, 'Nenhuma partícula sumiu: a concentração caiu porque o volume aumentou.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
