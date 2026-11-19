aulasMM.aulas['magnetismo'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  let quadro = null, fase = 0, antes = 0;
  const NOMES = ['parado', 'bem devagar', 'devagar', 'médio', 'rápido', 'muito rápido'];
  function desenhar() {
    const vel = Number($('vel').value);
    const pos = Math.sin(fase), veloc = Math.cos(fase) * vel; // posição e velocidade do ímã
    const tensao = veloc; // proporcional à rapidez da variação
    const brilho = Math.min(1, Math.abs(tensao) / 4);
    const xi = 150 + pos * 55;
    const espiras = Array.from({ length: 8 }, (_, k) => `<ellipse cx="${120 + k * 9}" cy="70" rx="5" ry="26" fill="none" stroke="#c87533" stroke-width="2.5"/>`).join('');
    $('graf').innerHTML = `${espiras}
      <path d="M120 44 V20 H270 V48 M183 96 V130 H270 V92" fill="none" stroke="#c87533" stroke-width="2"/>
      <circle cx="270" cy="70" r="${14 + brilho * 14}" fill="#ffd54a" opacity="${brilho * 0.5}"/><circle cx="270" cy="70" r="12" fill="${brilho > 0.05 ? '#ffd54a' : 'color-mix(in srgb, currentColor 20%, transparent)'}" stroke="currentColor"/>
      <g transform="translate(${xi} 70)"><rect x="-34" y="-11" width="34" height="22" fill="var(--errado)"/><rect x="0" y="-11" width="34" height="22" fill="#62a8ea"/>
        <text x="-17" y="5" text-anchor="middle" style="fill:#fff;font-weight:800">N</text><text x="17" y="5" text-anchor="middle" style="fill:#fff;font-weight:800">S</text></g>
      <text x="160" y="152" text-anchor="middle">tensão induzida: ${tensao > 0.2 ? '→' : tensao < -0.2 ? '←' : '0'}</text>`;
    $('graf').setAttribute('aria-label', `Ímã ${NOMES[vel]} dentro da bobina`);
  }
  function resumo() {
    const vel = Number($('vel').value);
    $('o').textContent = NOMES[vel];
    $('recado').textContent = vel === 0
      ? 'Ímã parado: o campo dentro da bobina não muda, e não há corrente. A lâmpada fica apagada, por mais forte que seja o ímã.'
      : `Com o ímã ${NOMES[vel]}, o campo na bobina varia e induz corrente: a lâmpada acende ${vel >= 4 ? 'forte' : 'fraco'}. Repare: ela apaga nas pontas, onde o ímã para para voltar, e a corrente muda de sentido na volta (corrente alternada).`;
  }
  function animar(agora) {
    const vel = Number($('vel').value);
    if (antes) fase += (agora - antes) / 1000 * vel * 1.4;
    antes = agora;
    desenhar();
    quadro = requestAnimationFrame(animar);
  }
  $('vel').addEventListener('input', () => { resumo(); desenhar(); });
  resumo(); desenhar();
  const olho = !aulasMM.calmo && 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !quadro) { antes = 0; quadro = requestAnimationFrame(animar); }
    else if (!e.isIntersecting && quadro) { cancelAnimationFrame(quadro); quadro = null; }
  }, { threshold: .3 }) : null;
  if (olho) olho.observe(raiz.querySelector('.au-cena'));

  // ---------- filminho: o transformador ----------
  const { ator, por } = aulasMM;
  const bob = (n, cor) => `<span style="display:flex;flex-direction:column;gap:2px">${('<i style="width:30px;height:4px;border-radius:2px;background:' + cor + '"></i>').repeat(n)}</span>`;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    transformador: {
      montar(p) {
        return {
          nucleo: ator(p, '<span style="display:block;width:150px;height:110px;border:12px solid #9aa3ad;border-radius:6px"></span>', 50, 46),
          b1: ator(p, bob(10, '#c87533'), 31, 46), b2: ator(p, bob(5, '#c87533'), 69, 46),
          t1: ator(p, N('220 V · 1 000 voltas'), 24, 88), t2: por(ator(p, N('110 V · 500 voltas'), 76, 88), { o: 0 })
        };
      },
      passos: [
        [2600, 'O transformador tem duas bobinas no mesmo núcleo de ferro. A corrente alternada na primeira cria um campo que varia…'],
        [3000, '…e esse campo variando <b>induz</b> tensão na segunda bobina.', a => por(a.t2, { o: 1 })],
        [3000, 'A tensão muda na proporção das voltas: metade das voltas, metade da tensão. É assim que a tensão das linhas de transmissão desce até a sua tomada.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => { cancelAnimationFrame(quadro); if (olho) olho.disconnect(); paradas.forEach(p => p()); };
};
