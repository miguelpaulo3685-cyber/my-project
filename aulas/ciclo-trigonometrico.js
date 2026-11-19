aulasMM.aulas['ciclo-trigonometrico'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br, rad = g => g * Math.PI / 180;
  const A = 20, B = 18; // centro a 20 m, raio 18 m
  function desenhar() {
    const g = Number($('a').value), x = rad(g), h = A + B * Math.sin(x);
    $('o').textContent = g + '°';
    // Roda (esquerda)
    const cx = 62, cy = 85, R = 54, px = cx + R * Math.cos(x), py = cy - R * Math.sin(x);
    // Gráfico (direita): altura × giro, 0 a 720°
    const gx = 135, gw = 178, Y = hh => 150 - hh / 40 * 130, X = gg => gx + gg / 720 * gw;
    let onda = '';
    for (let k = 0; k <= g; k += 5) onda += `${k ? 'L' : 'M'}${X(k)} ${Y(A + B * Math.sin(rad(k)))}`;
    $('graf').innerHTML = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" opacity=".5"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="${cx}" y1="${cy}" x2="${cx + R * Math.cos(rad(a))}" y2="${cy - R * Math.sin(rad(a))}" stroke="currentColor" opacity=".15"/>`).join('')}
      <line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#e9b949" stroke-width="2"/><line x1="${px}" y1="${py}" x2="${px}" y2="${cy}" stroke="var(--certo)" stroke-width="2" stroke-dasharray="3 3"/>
      <circle cx="${px}" cy="${py}" r="7" fill="#e9b949"/>
      <line x1="${px}" y1="${py}" x2="${X(g)}" y2="${Y(h)}" stroke="#e9b949" stroke-dasharray="2 4" opacity=".6"/>
      <line x1="${gx}" y1="150" x2="${gx + gw}" y2="150" stroke="currentColor" opacity=".5"/><line x1="${gx}" y1="150" x2="${gx}" y2="16" stroke="currentColor" opacity=".5"/>
      ${[2, 20, 38].map(v => `<text x="${gx - 3}" y="${Y(v) + 4}" text-anchor="end" style="font-size:9px">${v}</text><line x1="${gx}" y1="${Y(v)}" x2="${gx + gw}" y2="${Y(v)}" stroke="currentColor" opacity=".08"/>`).join('')}
      <path d="${onda}" fill="none" stroke="var(--certo)" stroke-width="2.5"/><circle cx="${X(g)}" cy="${Y(h)}" r="4" fill="var(--certo)"/>
      <text x="${gx + gw}" y="164" text-anchor="end">giro (2 voltas)</text>`;
    $('graf').setAttribute('aria-label', `Cadeira a ${br(h, 1)} metros depois de girar ${g} graus`);
    $('conta').textContent = `h = 20 + 18 · sen(${g}°) = ${br(h, 1)} m`;
    const s = Math.sin(x);
    $('recado').textContent = Math.abs(s - 1) < 0.01 ? 'No topo da roda: o seno vale 1 e a altura é a máxima, 20 + 18 = 38 m.'
      : Math.abs(s + 1) < 0.01 ? 'Embaixo: o seno vale −1 e a altura é a mínima, 20 − 18 = 2 m.'
      : `A altura da cadeira é o seno do giro, esticado (×18) e levantado (+20). A cada volta (360°) a onda se repete: esse é o período.`;
  }
  $('a').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: a maré ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  let onda = '';
  for (let k = 0; k <= 100; k++) onda += `${k ? 'L' : 'M'}${k * 2.4} ${60 - 40 * Math.sin(k / 100 * 4 * Math.PI)}`;
  const ROTEIROS = {
    mare: {
      montar(p) {
        return {
          g: ator(p, `<svg viewBox="0 -4 240 128" style="width:min(250px,66vw);margin:0"><line x1="0" y1="60" x2="240" y2="60" stroke="currentColor" opacity=".3"/><path d="${onda}" fill="none" stroke="#62a8ea" stroke-width="3"/></svg>`, 50, 46),
          max: por(ator(p, N('maré alta: A + B'), 26, 10), { o: 0 }), min: por(ator(p, N('maré baixa: A − B'), 46, 86), { o: 0 }), per: por(ator(p, N('período: de um pico ao outro'), 62, 26), { o: 0 })
        };
      },
      passos: [
        [2400, 'A altura da maré ao longo do dia sobe e desce como uma onda de seno.'],
        [2800, 'O pico é a maré alta (A + B); o vale, a maré baixa (A − B). A linha do meio é A.', a => { por(a.max, { o: 1 }); por(a.min, { o: 1 }); }],
        [3000, 'O tempo entre dois picos é o <b>período</b>: na maré, cerca de 12 horas.', a => por(a.per, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
