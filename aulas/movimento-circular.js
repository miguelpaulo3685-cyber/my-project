aulasMM.aulas['movimento-circular'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const RODA = 0.35; // raio da roda em metros (aro 26, mais ou menos)
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  let quadro = null, giro = 0, antes = 0;
  // Engrenagem com z dentes e raio r (px), girada de "ang" graus
  function dentes(cx, cy, r, z, ang, cor) {
    let d = '';
    for (let k = 0; k < z; k++) {
      const a = (ang + k * 360 / z) * Math.PI / 180, w = Math.PI / z * .45;
      const p = [[r, a - w], [r + 5, a - w * .6], [r + 5, a + w * .6], [r, a + w]].map(([rr, t]) => `${cx + rr * Math.cos(t)},${cy + rr * Math.sin(t)}`);
      d += `<polygon points="${p.join(' ')}" fill="${cor}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cor}" stroke-width="4"/>${d}<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(ang * Math.PI / 180)}" y2="${cy + r * Math.sin(ang * Math.PI / 180)}" stroke="${cor}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="4" fill="${cor}"/>`;
  }
  function valores() {
    const z1 = Number($('z1').value), z2 = Number($('z2').value), rpm = Number($('f').value);
    const roda = rpm * z1 / z2; // voltas da roda por minuto
    const v = 2 * Math.PI * RODA * roda / 60; // m/s
    return { z1, z2, rpm, roda, v };
  }
  function desenhar() {
    const { z1, z2, rpm, roda, v } = valores();
    const r1 = z1 * 1.25, r2 = z2 * 1.25, c1 = [100, 85], c2 = [250, 85];
    const corrente = `<line x1="${c1[0]}" y1="${c1[1] - r1}" x2="${c2[0]}" y2="${c2[1] - r2}" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" opacity=".7"/>
      <line x1="${c1[0]}" y1="${c1[1] + r1}" x2="${c2[0]}" y2="${c2[1] + r2}" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" opacity=".7"/>`;
    $('graf').innerHTML = corrente + dentes(c1[0], c1[1], r1, z1, giro, '#62a8ea') + dentes(c2[0], c2[1], r2, z2, giro * z1 / z2, '#e9b949') +
      `<text x="${c1[0]}" y="165" text-anchor="middle">coroa (pedal)</text><text x="${c2[0]}" y="165" text-anchor="middle">catraca (roda)</text>`;
    $('graf').setAttribute('aria-label', `Coroa de ${z1} dentes e catraca de ${z2} dentes ligadas pela corrente`);
    return { z1, z2, rpm, roda, v };
  }
  function resumo() {
    const { z1, z2, rpm, roda, v } = desenhar();
    $('o1').textContent = z1; $('o2').textContent = z2; $('o3').textContent = rpm + '/min';
    $('leituras').innerHTML = leitura('Roda: voltas por pedalada', br(z1 / z2, 2)) + leitura('Roda: voltas por minuto', br(roda, 0)) + leitura('Velocidade', br(v * 3.6, 1) + ' km/h');
    $('recado').textContent = `A corrente anda igual na coroa e na catraca. A cada pedalada passam ${z1} dentes, e a catraca, que tem ${z2}, dá ${br(z1 / z2, 2)} volta${z1 / z2 >= 2 ? 's' : ''} (a roda gira junto, no mesmo eixo). `
      + (z1 / z2 >= 2.5 ? 'Marcha "pesada": cada pedalada leva longe, ótima no plano.' : z1 / z2 <= 1.2 ? 'Marcha "leve": pedala fácil, boa para subida, mas anda pouco por pedalada.' : 'Marcha média.');
  }
  function animar(agora) {
    const { rpm } = valores();
    if (antes) giro = (giro + rpm / 60 * 360 * Math.min(.05, (agora - antes) / 1000)) % 360000;
    antes = agora;
    desenhar();
    quadro = requestAnimationFrame(animar);
  }
  ['z1', 'z2', 'f'].forEach(id => $(id).addEventListener('input', resumo));
  resumo();
  // Só gira quando a cena está na tela (e nunca para quem pediu menos movimento).
  const cenaEl = raiz.querySelector('.au-cena');
  const olho = !aulasMM.calmo && 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !quadro) { antes = 0; quadro = requestAnimationFrame(animar); }
    else if (!e.isIntersecting && quadro) { cancelAnimationFrame(quadro); quadro = null; }
  }, { threshold: .3 }) : null;
  if (olho) olho.observe(cenaEl);

  // ---------- filminho: engrenagens ----------
  const { ator, por } = aulasMM;
  const eng = (r, z, cor) => `<svg viewBox="${-r - 8} ${-r - 8} ${2 * r + 16} ${2 * r + 16}" style="width:${2 * r + 16}px;margin:0;transition:transform 2.6s linear">${dentes(0, 0, r, z, -90, cor)}</svg>`;
  const ROTEIROS = {
    engrenagens: {
      montar(p) {
        const a = { g: ator(p, eng(48, 24, '#62a8ea'), 40, 46), pq: ator(p, eng(24, 12, '#e9b949'), 63, 46) };
        a.t1 = ator(p, '<span class="au-numero au-pequeno">24 dentes</span>', 38, 90); a.t2 = ator(p, '<span class="au-numero au-pequeno">12 dentes</span>', 66, 90);
        a.r = por(ator(p, '<span class="au-balao">1 volta da grande = 2 voltas da pequena</span>', 50, 10), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Uma engrenagem de <b>24 dentes</b> encostada numa de <b>12</b>.'],
        [3200, 'A grande dá <b>1 volta</b>: passam 24 dentes. A pequena, que só tem 12, precisa dar <b>2 voltas</b>.', a => {
          a.g.querySelector('svg').style.transform = 'rotate(360deg)'; a.pq.querySelector('svg').style.transform = 'rotate(-720deg)'; por(a.r, { o: 1 });
        }],
        [2800, 'Na borda, as duas andam igual (mesma velocidade linear). A menor compensa girando mais vezes.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => { cancelAnimationFrame(quadro); if (olho) olho.disconnect(); paradas.forEach(p => p()); };
};
