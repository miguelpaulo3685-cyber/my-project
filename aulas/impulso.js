aulasMM.aulas['impulso'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(Math.round(v * 10) / 10) ? 0 : 1);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  let tipo = 'gruda', quadro = null;
  function depois() {
    const m1 = Number($('m1').value), m2 = Number($('m2').value), v = Number($('v').value);
    if (tipo === 'gruda') { const u = m1 * v / (m1 + m2); return { m1, m2, v, u1: u, u2: u }; }
    return { m1, m2, v, u1: (m1 - m2) / (m1 + m2) * v, u2: 2 * m1 / (m1 + m2) * v };
  }
  function cena(t) { // t em segundos de simulação; batida em t = 1
    const { m1, m2, v, u1, u2 } = depois();
    const l1 = 18 + m1 * 4, l2 = 18 + m2 * 4, ESC = 12;
    const xBatida = 150;
    const x1 = t < 1 ? xBatida - l1 - (1 - t) * v * ESC : xBatida - l1 + (t - 1) * u1 * ESC;
    const x2 = t < 1 ? xBatida : xBatida + (t - 1) * u2 * ESC;
    const carro = (x, l, cor, txt) => `<rect x="${x}" y="${80 - l * 0.7}" width="${l}" height="${l * 0.7}" rx="5" fill="${cor}"/><circle cx="${x + l * 0.25}" cy="82" r="5" fill="currentColor"/><circle cx="${x + l * 0.75}" cy="82" r="5" fill="currentColor"/>
      <text x="${x + l / 2}" y="${80 - l * 0.35 + 4}" text-anchor="middle" style="fill:#10130f;font-weight:800">${txt}</text>`;
    $('graf').innerHTML = `<line x1="0" y1="88" x2="320" y2="88" stroke="currentColor" opacity=".5"/>${carro(x1, l1, '#62a8ea', m1 + ' kg')}${carro(x2, l2, '#e9b949', m2 + ' kg')}`;
    return x1 > 330 || x2 > 330 || t > 4;
  }
  function resumo() {
    const { m1, m2, v, u1, u2 } = depois();
    $('o1').textContent = m1 + ' kg'; $('o2').textContent = m2 + ' kg'; $('o3').textContent = v + ' m/s';
    raiz.querySelectorAll('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo)));
    const Qantes = m1 * v, Qdepois = m1 * u1 + m2 * u2;
    const Eantes = m1 * v * v / 2, Edepois = m1 * u1 * u1 / 2 + m2 * u2 * u2 / 2;
    $('leituras').innerHTML = leitura('Q antes', num(Qantes) + ' kg·m/s') + leitura('Q depois', num(Qdepois) + ' kg·m/s') + leitura('Energia que sobra', br(Edepois / Eantes * 100, 0) + '%');
    $('graf').setAttribute('aria-label', `Carrinho azul de ${m1} kg a ${v} m/s bate no amarelo de ${m2} kg`);
    $('recado').textContent = tipo === 'gruda'
      ? `Grudados, os dois seguem a ${num(u1)} m/s: ${m1} × ${v} = (${m1} + ${m2}) × ${num(u1)}. A quantidade de movimento se conservou, mas ${br(100 - Edepois / Eantes * 100, 0)}% da energia cinética virou calor e amassado.`
      : `Na batida elástica, o amarelo sai a ${num(u2)} m/s e o azul ${u1 > 0.05 ? `segue a ${num(u1)} m/s` : u1 < -0.05 ? `volta a ${num(-u1)} m/s` : 'para'}. A quantidade de movimento e a energia se conservam.${m1 === m2 ? ' Com massas iguais, eles trocam de velocidade, como na sinuca.' : ''}`;
  }
  function bater() {
    cancelAnimationFrame(quadro);
    if (aulasMM.calmo) { cena(2.5); return; }
    const t0 = performance.now();
    const passo = agora => { if (!cena((agora - t0) / 1000)) quadro = requestAnimationFrame(passo); };
    quadro = requestAnimationFrame(passo);
  }
  raiz.querySelectorAll('[data-tipo]').forEach(b => b.addEventListener('click', () => { tipo = b.dataset.tipo; resumo(); bater(); }));
  ['m1', 'm2', 'v'].forEach(id => $(id).addEventListener('input', () => { cancelAnimationFrame(quadro); resumo(); cena(0); }));
  $('bater').addEventListener('click', bater);
  resumo(); cena(0);

  // ---------- filminho: o airbag ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    airbag: {
      montar(p) {
        return {
          t1: ator(p, N('sem airbag'), 25, 12), t2: ator(p, N('com airbag'), 75, 12),
          a: ator(p, '<span style="font-size:30px">🧍</span>', 14, 46), b: ator(p, '<span style="font-size:30px">🧍</span>', 64, 46),
          painel: ator(p, '<span style="display:block;width:10px;height:60px;background:#8a7a68"></span>', 38, 48),
          bolsa: ator(p, '<span style="display:block;width:34px;height:52px;border-radius:50%;background:#f2f2f2"></span>', 86, 48),
          f1: por(ator(p, N('parada em 0,01 s: força enorme'), 25, 84), { o: 0 }), f2: por(ator(p, N('parada em 0,1 s: força 10× menor'), 75, 84), { o: 0 })
        };
      },
      passos: [
        [2200, 'Duas pessoas iguais, na mesma velocidade, precisam parar. O impulso necessário é o <b>mesmo</b>.'],
        [2800, 'Contra o painel, a parada dura uns centésimos de segundo: a força é enorme.', a => { a.a.style.transition = 'left .25s ease-in'; por(a.a, { x: 33 }); por(a.f1, { o: 1 }); }],
        [3200, 'No airbag, a parada dura mais: como I = F · Δt, mais tempo significa <b>menos força</b>.', a => { a.b.style.transition = 'left 1.4s ease-out'; por(a.b, { x: 79 }); por(a.f2, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => { cancelAnimationFrame(quadro); paradas.forEach(p => p()); };
};
