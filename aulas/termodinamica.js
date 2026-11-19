aulasMM.aulas['termodinamica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  function desenhar() {
    const tq = Number($('tq').value), tf = Number($('tf').value);
    $('oq').textContent = tq + ' °C'; $('of').textContent = tf + ' °C';
    const Kq = tq + 273, Kf = tf + 273, eta = 1 - Kf / Kq, Q = 1000, W = Q * eta;
    const larg = v => 20 + v / Q * 120;
    $('graf').innerHTML = `<rect x="20" y="10" width="280" height="30" rx="8" fill="var(--errado)" opacity=".8"/><text x="160" y="30" text-anchor="middle" style="fill:#fff;font-weight:800">fonte quente: ${tq} °C (${Kq} K)</text>
      <rect x="20" y="130" width="280" height="30" rx="8" fill="#62a8ea" opacity=".8"/><text x="160" y="150" text-anchor="middle" style="fill:#fff;font-weight:800">fonte fria: ${tf} °C (${Kf} K)</text>
      <circle cx="120" cy="85" r="26" fill="none" stroke="currentColor" stroke-width="3"/><text x="120" y="90" text-anchor="middle" style="font-weight:800;fill:var(--texto)">motor</text>
      <line x1="120" y1="40" x2="120" y2="57" stroke="var(--errado)" stroke-width="${larg(Q) / 8}"/>
      <line x1="120" y1="111" x2="120" y2="130" stroke="#62a8ea" stroke-width="${Math.max(1, larg(Q - W) / 8)}"/>
      <line x1="146" y1="85" x2="${150 + W / Q * 140}" y2="85" stroke="var(--certo)" stroke-width="${Math.max(2, larg(W) / 8)}"/>
      <text x="${154 + W / Q * 140}" y="80" style="fill:var(--certo);font-weight:800">trabalho</text>
      <text x="${154 + W / Q * 140}" y="96" style="fill:var(--certo);font-weight:800">${br(W, 0)} J</text>
      <text x="130" y="52">1 000 J</text><text x="130" y="124">${br(Q - W, 0)} J</text>`;
    $('graf').setAttribute('aria-label', `Rendimento máximo de ${br(eta * 100, 0)} por cento`);
    $('leituras').innerHTML = leitura('Rendimento máximo', br(eta * 100, 0) + '%') + leitura('Vira trabalho', br(W, 0) + ' J') + leitura('Vai para a fonte fria', br(Q - W, 0) + ' J');
    $('recado').textContent = `η = 1 − ${Kf} ÷ ${Kq} = ${br(eta * 100, 0)}% (em kelvin!). De cada 1 000 J tirados da fonte quente, no máximo ${br(W, 0)} J viram trabalho; o resto obrigatoriamente vai para a fonte fria. Motores reais ficam bem abaixo desse máximo.`;
  }
  ['tq', 'tf'].forEach(id => $(id).addEventListener('input', desenhar));
  desenhar();

  // ---------- filminho: a geladeira ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    geladeira: {
      montar(p) {
        return {
          gel: ator(p, '<span style="display:block;width:70px;height:120px;border-radius:8px;background:#e9eef3;border:2px solid #9aa3ad"></span>', 34, 50),
          dentro: ator(p, N('4 °C'), 34, 50), grade: ator(p, '<span style="display:block;width:8px;height:110px;background:repeating-linear-gradient(#9aa3ad 0 4px, transparent 4px 9px)"></span>', 52, 50),
          calor: por(ator(p, '<span class="au-balao">calor ➜</span>', 68, 40), { o: 0 }), luz: por(ator(p, '<span style="font-size:24px">🔌</span>', 34, 92), { o: 0 }),
          t: por(ator(p, N('a grade de trás esquenta'), 76, 70), { o: 0 })
        };
      },
      passos: [
        [2400, 'Dentro da geladeira está frio; a cozinha está quente. Sozinho, o calor iria <b>de fora para dentro</b>.'],
        [3000, 'O motor (compressor) gasta <b>energia elétrica</b> para levar o calor no sentido contrário: de dentro para fora.', a => { por(a.luz, { o: 1 }); por(a.calor, { o: 1 }); }],
        [3000, 'Esse calor sai pela grade de trás, que fica quente. A geladeira não produz frio: ela <b>bombeia calor</b>.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
