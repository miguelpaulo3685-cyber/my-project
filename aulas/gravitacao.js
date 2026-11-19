aulasMM.aulas['gravitacao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const GM = 3.986e14, R = 6371e3; // Terra
  let altura = 400, quadro = null, fase = 0, antes = 0;
  const tempo = s => s < 3600 * 2 ? `${br(s / 60, 0)} min` : s < 86400 * 2 ? `${br(s / 3600, 1)} h` : `${br(s / 86400, 1)} dias`;
  function dados() {
    const r = R + altura * 1000, v = Math.sqrt(GM / r), T = 2 * Math.PI * r / v, g = 9.8 * (R / r) ** 2;
    return { r, v, T, g };
  }
  function desenhar() {
    const { r } = dados(); // eslint: r só para quem chama
    // Escala logarítmica para caber da Estação até a Lua
    const raioTerra = 34, raioOrb = raioTerra + 14 + 52 * Math.log10(1 + altura / 400) / Math.log10(1 + 384400 / 400);
    const cx = 160, cy = 110, a = fase;
    const sx = cx + raioOrb * Math.cos(a), sy = cy - raioOrb * Math.sin(a);
    $('graf').innerHTML = `<circle cx="${cx}" cy="${cy}" r="${raioOrb}" fill="none" stroke="currentColor" stroke-dasharray="3 4" opacity=".45"/>
      <circle cx="${cx}" cy="${cy}" r="${raioTerra}" fill="#2f7bd8"/><path d="M${cx - 20} ${cy - 10} q12 -14 26 -4 q8 10 -6 18 q-16 4 -20 -14z" fill="#6fae3f"/>
      <circle cx="${sx}" cy="${sy}" r="${altura > 300000 ? 9 : 6}" fill="${altura > 300000 ? '#d8d2c4' : '#e9b949'}"/>
      <text x="${cx}" y="214" text-anchor="middle">fora de escala: a distância cresce rápido demais para caber</text>`;
    $('graf').setAttribute('aria-label', `Satélite a ${altura} km de altura em volta da Terra`);
    return r;
  }
  function resumo() {
    const { v, T, g } = dados();
    raiz.querySelectorAll('[data-h]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.h) === altura)));
    $('leituras').innerHTML = leitura('Velocidade', br(v * 3.6 / 1000, 1) + ' mil km/h') + leitura('Uma volta', tempo(T)) + leitura('Gravidade lá', br(g, 1) + ' m/s²');
    const textos = {
      400: `A Estação Espacial voa a uns ${br(v * 3.6 / 1000, 0)} mil km/h e dá a volta na Terra em cerca de ${tempo(T)}: os astronautas veem 16 nasceres do sol por dia. A gravidade lá ainda é ${br(g, 1)} m/s², quase a daqui. Eles flutuam porque estão caindo junto com a estação.`,
      20200: `Os satélites de GPS ficam a 20 mil km e dão uma volta em cerca de ${tempo(T)}. Mais alto, mais devagar: a velocidade cai para ${br(v * 3.6 / 1000, 1)} mil km/h.`,
      35786: `A esta altura, uma volta leva ${tempo(T)}, o mesmo tempo que a Terra leva para girar. Por isso o satélite de TV parece parado no céu, e a antena parabólica fica sempre apontada para ele.`,
      384400: `A Lua, a 384 mil km, leva cerca de ${tempo(T)} por volta, e lá a gravidade da Terra já caiu para ${br(g, 4)} m/s². Fraca, mas suficiente para segurar a Lua, que também está "caindo" em volta da Terra.`
    };
    $('recado').textContent = textos[altura];
  }
  function animar(agora) {
    const { T } = dados();
    // Tempo comprimido: a Estação dá uma volta em ~4 s; as outras proporcionalmente (com limite)
    if (antes) fase += (agora - antes) / 1000 * 2 * Math.PI / Math.min(40, 4 * T / 5550);
    antes = agora;
    desenhar();
    quadro = requestAnimationFrame(animar);
  }
  raiz.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { altura = Number(b.dataset.h); resumo(); desenhar(); }));
  resumo(); desenhar();
  const olho = !aulasMM.calmo && 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !quadro) { antes = 0; quadro = requestAnimationFrame(animar); }
    else if (!e.isIntersecting && quadro) { cancelAnimationFrame(quadro); quadro = null; }
  }, { threshold: .3 }) : null;
  if (olho) olho.observe(raiz.querySelector('.au-cena'));

  // ---------- filminho: o canhão de Newton ----------
  const { ator, por } = aulasMM;
  const terra = '<svg viewBox="0 0 200 200" style="width:min(170px,44vw);margin:0"><circle cx="100" cy="100" r="62" fill="#2f7bd8"/><path d="M100 30 l-10 10 h20 z" fill="#8a7a68"/></svg>';
  const trajeto = (d, cor) => `<svg viewBox="0 0 200 200" style="width:min(170px,44vw);margin:0"><path d="${d}" fill="none" stroke="${cor}" stroke-width="3" stroke-dasharray="5 4"/></svg>`;
  const ROTEIROS = {
    canhao: {
      montar(p) {
        return {
          terra: ator(p, terra, 50, 50),
          t1: por(ator(p, trajeto('M100 32 q22 2 30 26', '#e9b949'), 50, 50), { o: 0 }),
          t2: por(ator(p, trajeto('M100 32 q60 6 62 80', '#f2a65a'), 50, 50), { o: 0 }),
          t3: por(ator(p, trajeto('M100 32 a68 68 0 1 1 -0.1 0', 'var(--certo)'), 50, 50), { o: 0 })
        };
      },
      passos: [
        [2400, 'Do alto de uma montanha altíssima, uma bola é lançada para o lado: cai perto.', a => por(a.t1, { o: 1 })],
        [2600, 'Mais rápido, ela cai mais longe: a Terra é curva e o chão vai "fugindo" embaixo dela.', a => por(a.t2, { o: 1 })],
        [3200, 'Rápido o suficiente (uns 28 mil km/h), ela cai em volta da Terra para sempre: está em <b>órbita</b>.', a => por(a.t3, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => { cancelAnimationFrame(quadro); if (olho) olho.disconnect(); paradas.forEach(p => p()); };
};
