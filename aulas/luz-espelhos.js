aulasMM.aulas['luz-espelhos'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const rad = g => g * Math.PI / 180;
  function desenhar() {
    const ang = Number($('ang').value), t = rad(ang);
    $('o').textContent = ang + '°';
    const cx = 160, cy = 160, L = 140; // ponto onde o raio bate no espelho (embaixo)
    const ix = cx - L * Math.sin(t), iy = cy - L * Math.cos(t); // de onde vem o laser
    const rx = cx + L * Math.sin(t), ry = cy - L * Math.cos(t); // para onde vai o refletido
    const arco = (a1, a2, r) => `M${cx + r * Math.sin(a1)} ${cy - r * Math.cos(a1)} A${r} ${r} 0 0 ${a2 > a1 ? 1 : 0} ${cx + r * Math.sin(a2)} ${cy - r * Math.cos(a2)}`;
    $('graf').innerHTML = `<rect x="20" y="160" width="280" height="10" fill="#bfe3ff" stroke="currentColor"/>
      <line x1="${cx}" y1="160" x2="${cx}" y2="14" stroke="currentColor" stroke-dasharray="4 4" opacity=".6"/><text x="${cx + 4}" y="22">normal</text>
      <line x1="${ix}" y1="${iy}" x2="${cx}" y2="${cy}" stroke="var(--errado)" stroke-width="3"/>
      <line x1="${cx}" y1="${cy}" x2="${rx}" y2="${ry}" stroke="var(--errado)" stroke-width="3" stroke-dasharray="7 3"/>
      <path d="${arco(-t, 0, 40)}" fill="none" stroke="#e9b949" stroke-width="2"/><path d="${arco(0, t, 46)}" fill="none" stroke="var(--certo)" stroke-width="2"/>
      <text x="${cx - 52 * Math.sin(t / 2) - 6}" y="${cy - 52 * Math.cos(t / 2)}" text-anchor="end" style="fill:#e9b949;font-weight:800">${ang}°</text>
      <text x="${cx + 58 * Math.sin(t / 2) + 6}" y="${cy - 58 * Math.cos(t / 2)}" style="fill:var(--certo);font-weight:800">${ang}°</text>
      <text x="${ix}" y="${iy - 6}" text-anchor="middle" style="font-size:18px">🔦</text>`;
    $('graf').setAttribute('aria-label', `Raio chega com ${ang} graus da normal e sai com ${ang} graus`);
    $('recado').textContent = `O raio chega fazendo ${ang}° com a normal (amarelo) e sai fazendo os mesmos ${ang}° (verde), do outro lado. É a lei da reflexão: ângulo de incidência = ângulo de reflexão. ${ang > 70 ? 'Quase raspando no espelho, ele também sai quase raspando.' : ''}`;
  }
  $('ang').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: AMBULÂNCIA no retrovisor ----------
  const { ator, por } = aulasMM;
  const palavra = inv => `<span style="display:inline-block;font:900 20px var(--fonte);color:var(--errado);${inv ? 'transform:scaleX(-1)' : ''}">AMBULÂNCIA</span>`;
  const ROTEIROS = {
    ambulancia: {
      montar(p) {
        return {
          capo: ator(p, palavra(true), 30, 40), t1: ator(p, '<span class="au-numero au-pequeno">no capô</span>', 30, 58),
          espelho: por(ator(p, '<span style="display:block;width:150px;height:60px;border-radius:30px;background:#bfe3ff;opacity:.5"></span>', 72, 40), { o: 0 }),
          visto: por(ator(p, palavra(false), 72, 40), { o: 0 }), t2: por(ator(p, '<span class="au-numero au-pequeno">no retrovisor</span>', 72, 58), { o: 0 })
        };
      },
      passos: [
        [2400, 'No capô da ambulância, a palavra vem escrita <b>invertida</b>.'],
        [3000, 'O espelho plano inverte esquerda e direita. Visto pelo retrovisor do carro da frente…', a => { por(a.espelho, { o: 1 }); por(a.t2, { o: 1 }); }],
        [3000, '…a palavra aparece <b>certinha</b>: o motorista lê na hora e abre caminho.', a => por(a.visto, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
