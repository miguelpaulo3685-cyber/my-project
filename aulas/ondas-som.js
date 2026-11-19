aulasMM.aulas['ondas-som'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  let v = 340;
  const METROS = 4; // a tela mostra 4 metros
  function desenhar() {
    const f = Number($('f').value), a = Number($('a').value), lambda = v / f;
    $('of').textContent = f + ' Hz'; $('oa').textContent = ['', 'fraco', 'baixo', 'médio', 'alto', 'muito alto'][a];
    let d = '';
    for (let px = 0; px <= 300; px += 1.5) { const x = px / 300 * METROS; d += `${px ? 'L' : 'M'}${10 + px} ${70 - a * 10 * Math.sin(2 * Math.PI * x / lambda)}`; }
    const lpx = Math.min(300, lambda / METROS * 300);
    $('graf').innerHTML = `<line x1="10" y1="70" x2="310" y2="70" stroke="currentColor" opacity=".25"/>
      <path d="${d}" fill="none" stroke="#62a8ea" stroke-width="2.5"/>
      ${lpx < 300 ? `<line x1="${10 + lpx / 4}" y1="122" x2="${10 + lpx * 1.25}" y2="122" stroke="#e9b949" stroke-width="2"/><text x="${10 + lpx * 0.75}" y="135" text-anchor="middle" style="fill:#e9b949;font-weight:800">λ = ${br(lambda, 2)} m</text>` : ''}
      <text x="310" y="16" text-anchor="end">4 m de ${v === 340 ? 'ar' : 'água'}</text>`;
    $('graf').setAttribute('aria-label', `Onda de ${f} hertz no ${v === 340 ? 'ar' : 'água'}: comprimento de ${br(lambda, 2)} metros`);
    raiz.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === v)));
    $('leituras').innerHTML = leitura('Velocidade', v + ' m/s') + leitura('Comprimento (λ)', br(lambda, 2) + ' m') + leitura('Som', f < 300 ? 'grave' : f > 700 ? 'agudo' : 'médio');
    $('recado').textContent = `λ = v ÷ f = ${v} ÷ ${f} = ${br(lambda, 2)} m. ${f >= 700 ? 'Frequência alta: som agudo, ondas curtas e apertadas.' : f <= 250 ? 'Frequência baixa: som grave, ondas longas.' : 'Aumente a frequência e veja as ondas ficarem mais curtas.'} A amplitude não muda o tom: só deixa o som mais forte ou mais fraco.${v === 1500 ? ' Na água o som corre 4 vezes mais rápido, e a mesma nota tem ondas 4 vezes mais longas.' : ''}`;
  }
  raiz.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { v = Number(b.dataset.v); desenhar(); }));
  ['f', 'a'].forEach(id => $(id).addEventListener('input', desenhar));
  desenhar();

  // ---------- filminho: o eco do morcego ----------
  const { ator, por } = aulasMM;
  const ROTEIROS = {
    eco: {
      montar(p) {
        const a = { morcego: ator(p, '<span style="font-size:30px">🦇</span>', 14, 46), parede: ator(p, '<span style="display:block;width:14px;height:120px;background:#8a7a68"></span>', 88, 50),
          onda: ator(p, '<span style="font-size:22px;color:#62a8ea">)))</span>', 22, 46), t: por(ator(p, '<span class="au-numero au-pequeno">distância = v × t ÷ 2</span>', 50, 88), { o: 0 }) };
        a.onda.style.transition = 'left 1.2s linear';
        return a;
      },
      passos: [
        [2400, 'O morcego solta um som agudo e conta o tempo.', a => por(a.onda, { x: 80 })],
        [2600, 'O som bate na parede e <b>volta</b> (eco).', a => por(a.onda, { x: 22, html: '<span style="font-size:22px;color:#e9b949">(((</span>' })],
        [3000, 'Pelo tempo de ida e volta ele calcula a distância: <b>v × t ÷ 2</b>. Sonar e ultrassom usam a mesma ideia.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
