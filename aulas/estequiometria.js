aulasMM.aulas['estequiometria'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const H = (x, y) => `<circle cx="${x - 5}" cy="${y}" r="5.5" fill="#f4f1ea"/><circle cx="${x + 5}" cy="${y}" r="5.5" fill="#f4f1ea"/>`;
  const O = (x, y) => `<circle cx="${x - 7}" cy="${y}" r="8" fill="#ff6b6b"/><circle cx="${x + 7}" cy="${y}" r="8" fill="#ff6b6b"/>`;
  const A = (x, y) => `<circle cx="${x - 9}" cy="${y + 5}" r="5" fill="#f4f1ea"/><circle cx="${x + 9}" cy="${y + 5}" r="5" fill="#f4f1ea"/><circle cx="${x}" cy="${y}" r="8.5" fill="#ff6b6b"/>`;
  const pos = (x0, y0, k, n = 5, dx = 26, dy = 22) => [x0 + (k % n) * dx, y0 + Math.floor(k / n) * dy];
  const pos4 = (x0, y0, k) => pos(x0, y0, k, 4, 36, 24);
  function desenhar() {
    const h = Number($('h').value), o = Number($('o').value);
    const agua = Math.min(h, 2 * o), sobraH = h - agua, sobraO = o - agua / 2;
    $('ho').textContent = h; $('oo').textContent = o;
    let s = `<text x="75" y="12" text-anchor="middle" style="font-weight:700">antes</text><text x="245" y="12" text-anchor="middle" style="font-weight:700">depois</text>
      <text x="160" y="80" text-anchor="middle" style="font-size:22px;fill:var(--texto)">→</text>`;
    for (let k = 0; k < h; k++) s += H(...pos(22, 30, k));
    for (let k = 0; k < o; k++) s += O(...pos4(26, 92, k));
    for (let k = 0; k < agua; k++) s += A(...pos4(196, 30, k));
    const sobras = [...Array(sobraH).fill(H), ...Array(sobraO).fill(O)];
    sobras.forEach((f, k) => { s += `<g opacity=".55">${f(...(sobraH ? pos(192, 104, k) : pos4(196, 104, k)))}</g>`; });
    if (sobras.length) s += `<text x="245" y="146" text-anchor="middle">sobra (excesso)</text>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `${h} H₂ e ${o} O₂ formam ${agua} H₂O; sobram ${sobraH} H₂ e ${sobraO} O₂`);
    $('eq').innerHTML = `<span>${agua} H₂</span> + <span>${agua / 2} O₂</span> → <span>${agua} H₂O</span><br><small class="au-legenda">massa: ${agua * 2} u + ${agua / 2 * 32} u = ${agua * 18} u (nada se perde)</small>`;
    const lim = !agua ? '—' : sobraH ? 'O₂' : sobraO ? 'H₂' : 'nenhum (proporção exata)';
    $('leituras').innerHTML = leitura('Água formada', `${agua} moléculas`) + leitura('Sobrou', sobraH ? `${sobraH} H₂` : sobraO ? `${sobraO} O₂` : 'nada') + leitura('Limitante', lim);
    $('recado').textContent = !h || !o ? 'Sem um dos reagentes, não há reação. Coloque H₂ e O₂.'
      : !sobraH && !sobraO ? `Proporção perfeita: ${h} H₂ para ${o} O₂ é exatamente 2 para 1. Tudo reagiu e formou ${agua} H₂O.`
      : sobraH ? `O O₂ acabou primeiro: cada O₂ só consegue reagir com 2 H₂. O O₂ é o reagente limitante, e ${sobraH === 1 ? 'sobra 1 H₂' : `sobram ${sobraH} H₂`} em excesso.`
      : `O H₂ acabou primeiro: ${h} H₂ só precisam de ${h / 2} O₂. O H₂ é o limitante, e ${sobraO === 1 ? 'sobra 1 O₂' : `sobram ${sobraO} O₂`} em excesso.`;
  }
  $('h').addEventListener('input', desenhar);
  $('o').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: Lavoisier ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero">${t}</span>`;
  const ROTEIROS = {
    lavoisier: {
      montar(p) {
        return {
          fr: ator(p, '<span style="font-size:52px">🫙</span>', 50, 36), bal: ator(p, '<span style="font-size:30px">⚖️</span>', 50, 66),
          m: ator(p, N('100,0 g'), 50, 86), fogo: por(ator(p, '<span style="font-size:24px">🔥</span>', 50, 38), { o: 0 })
        };
      },
      passos: [
        [2400, 'Num frasco <b>fechado</b>, colocamos palha de aço e ar, e pesamos tudo: 100 g.'],
        [2600, 'A palha de aço queima: o ferro reage com o oxigênio e vira óxido de ferro.', a => por(a.fogo, { o: 1 })],
        [3000, 'Pesamos de novo: os mesmos 100 g. As substâncias mudaram, os átomos não. É a <b>lei de Lavoisier</b>.', a => por(a.fogo, { o: 0 })],
        [3000, 'Com o frasco aberto, gases entram ou saem e a balança engana. Por isso a lei vale para sistemas fechados.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
