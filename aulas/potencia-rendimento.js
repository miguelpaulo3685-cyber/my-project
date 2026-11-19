aulasMM.aulas['potencia-rendimento'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [potência (W), rendimento, o que é útil, texto]
  const APARELHOS = {
    incandescente: [60, 0.05, 'luz', 'Só uns 5% viram luz: o resto esquenta o ambiente. Por isso ela é quente ao toque e foi saindo do mercado.'],
    led: [9, 0.4, 'luz', 'A LED de 9 W dá a mesma luz que a incandescente de 60 W: transforma uma parte muito maior em luz e quase não esquenta.'],
    motor: [100000, 0.28, 'movimento', 'O motor a gasolina aproveita uns 28%: o resto vira calor, que sai pelo radiador e pelo escapamento.'],
    eletrico: [100000, 0.9, 'movimento', 'O motor elétrico aproveita uns 90%: por isso o carro elétrico gasta muito menos energia para andar a mesma distância.']
  };
  let ap = 'incandescente';
  const watts = w => w >= 1000 ? br(w / 1000, 0) + ' kW' : br(w, 0) + ' W';
  function desenhar() {
    const [P, r, util, txt] = APARELHOS[ap];
    const L = 270, u = L * r;
    $('graf').innerHTML = `<text x="20" y="22">entra: ${watts(P)} (energia elétrica${ap === 'motor' ? ' / combustível' : ''})</text>
      <rect x="20" y="30" width="${L}" height="24" rx="5" fill="#62a8ea"/>
      <rect x="20" y="70" width="${Math.max(3, u)}" height="24" rx="5" fill="var(--certo)"/><rect x="${20 + u}" y="70" width="${L - u}" height="24" rx="5" fill="var(--errado)" opacity=".8"/>
      <text x="20" y="112" style="fill:var(--certo);font-weight:800">${util}: ${br(r * 100, 0)}%</text>
      <text x="${20 + L}" y="112" text-anchor="end" style="fill:var(--errado);font-weight:800">calor: ${br((1 - r) * 100, 0)}%</text>`;
    $('graf').setAttribute('aria-label', `${ap}: ${br(r * 100, 0)}% vira ${util}`);
    $('leituras').innerHTML = leitura('Potência', watts(P)) + leitura('Útil (' + util + ')', watts(P * r)) + leitura('Rendimento', br(r * 100, 0) + '%');
    raiz.querySelectorAll('[data-ap]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ap === ap)));
    $('recado').textContent = txt;
  }
  raiz.querySelectorAll('[data-ap]').forEach(b => b.addEventListener('click', () => { ap = b.dataset.ap; desenhar(); }));
  desenhar();

  // ---------- filminho: subir a escada andando ou correndo ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    escada: {
      montar(p) {
        const degraus = '<svg viewBox="0 0 120 90" style="width:min(120px,30vw);margin:0"><path d="M0 90 h20 v-15 h20 v-15 h20 v-15 h20 v-15 h20 v-15 h20" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
        const a = { e1: ator(p, degraus, 28, 52), e2: ator(p, degraus, 72, 52),
          p1: ator(p, '<span style="font-size:22px">🚶</span>', 18, 74), p2: ator(p, '<span style="font-size:22px">🏃</span>', 62, 74),
          t1: ator(p, N('andando: 12 s'), 28, 94), t2: ator(p, N('correndo: 4 s'), 72, 94) };
        a.p1.style.transition = 'left 3s linear, top 3s linear'; a.p2.style.transition = 'left 1s linear, top 1s linear';
        return a;
      },
      passos: [
        [2200, 'Duas pessoas iguais sobem a mesma escada: uma andando, outra correndo.'],
        [3400, 'As duas chegam à mesma altura: gastam a <b>mesma energia</b> (m · g · h).', a => { por(a.p1, { x: 38, y: 30 }); por(a.p2, { x: 82, y: 30 }); }],
        [3000, 'Mas quem correu fez isso em 1/3 do tempo: usou <b>3 vezes mais potência</b>. Potência = energia ÷ tempo.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
