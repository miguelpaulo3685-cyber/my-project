aulasMM.aulas['termoquimica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, emoji, reagentes, produtos, ΔH em kJ/mol, explicação]
  const REACOES = {
    metano: ['Gás de cozinha', '🔥', 'CH₄ + 2 O₂', 'CO₂ + 2 H₂O', -890, 'A queima do gás libera muito calor: é ele que cozinha a comida. Toda combustão é exotérmica.'],
    etanol: ['Etanol', '🚗', 'C₂H₅OH + 3 O₂', '2 CO₂ + 3 H₂O', -1368, 'A queima do etanol no motor libera energia que move o carro.'],
    cal: ['Cal virgem + água', '🧱', 'CaO + H₂O', 'Ca(OH)₂', -65, 'Ao jogar água na cal virgem, a mistura esquenta muito. Por isso ela é perigosa de manusear.'],
    compressa: ['Compressa fria', '🧊', 'NH₄NO₃(s)', 'NH₄⁺ + NO₃⁻', 26, 'Ao dissolver, o sal absorve calor da água e da pele: a compressa gela. Processo endotérmico.'],
    foto: ['Fotossíntese', '🌱', '6 CO₂ + 6 H₂O', 'C₆H₁₂O₆ + 6 O₂', 2800, 'A planta absorve energia da luz e a guarda nas ligações da glicose. É endotérmica: o contrário da respiração.']
  };
  let r = 'metano';
  function desenhar() {
    const [nome, em, reag, prod, dH, txt] = REACOES[r], exo = dH < 0;
    const d = 22 + 64 * Math.sqrt(Math.min(1, Math.abs(dH) / 2800));
    const yR = exo ? 50 : 50 + d, yP = exo ? 50 + d : 50, topo = Math.min(yR, yP) - 34;
    const s = `<line x1="20" y1="10" x2="20" y2="148" stroke="currentColor" opacity=".4"/><text x="14" y="14" transform="rotate(-90 14 14)" style="text-anchor:end">energia</text>
      <path d="M34 ${yR} H86 C116 ${yR} 120 ${topo} 150 ${topo} S186 ${yP} 214 ${yP} H296" fill="none" stroke="#e9b949" stroke-width="3"/>
      <text x="66" y="${yR - 6}" text-anchor="middle" style="fill:var(--texto);font-weight:700">${reag}</text>
      <text x="257" y="${yP - 6}" text-anchor="middle" style="fill:var(--texto);font-weight:700">${prod}</text>
      <line x1="308" y1="${yR}" x2="308" y2="${yP + (exo ? -6 : 6)}" stroke="${exo ? 'var(--errado)' : '#6c8cff'}" stroke-width="3"/>
      <path d="M302 ${yP + (exo ? -8 : 8)} L308 ${yP} L314 ${yP + (exo ? -8 : 8)}" fill="none" stroke="${exo ? 'var(--errado)' : '#6c8cff'}" stroke-width="3"/>
      <line x1="214" y1="${yR}" x2="314" y2="${yR}" stroke="currentColor" stroke-dasharray="3 3" opacity=".4"/>
      <text x="300" y="${(yR + yP) / 2 + 4}" text-anchor="end" style="font-weight:800;fill:${exo ? 'var(--errado)' : '#6c8cff'}">ΔH = ${dH > 0 ? '+' : '−'}${br(Math.abs(dH), 0)}</text>
      <text x="150" y="${topo - 6}" text-anchor="middle">energia de ativação</text>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `${nome}: ΔH ${dH} quilojoules por mol, ${exo ? 'exotérmica' : 'endotérmica'}`);
    $('leituras').innerHTML = leitura('ΔH', `${dH > 0 ? '+' : '−'}${br(Math.abs(dH), 0)} kJ/mol`) + leitura('Tipo', exo ? 'exotérmica' : 'endotérmica') + leitura('O ambiente', exo ? 'esquenta 🔥' : 'esfria 🧊');
    $('recado').textContent = `${txt} ${exo ? 'Os produtos ficam mais embaixo no diagrama: a energia que sobrou saiu como calor (ΔH negativo).' : 'Os produtos ficam mais em cima: a reação precisou receber energia (ΔH positivo).'}`;
    raiz.querySelectorAll('[data-r]').forEach(b => b.setAttribute('aria-pressed', b.dataset.r === r));
  }
  $('reacoes').innerHTML = Object.entries(REACOES).map(([id, x]) => `<button type="button" data-r="${id}">${x[1]} ${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { r = b.dataset.r; desenhar(); }));
  desenhar();

  // ---------- filminho: quebrar e formar ligações ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const bola = (c, t = 26) => `<span style="display:block;width:${t}px;height:${t}px;border-radius:50%;background:${c}"></span>`;
  const ROTEIROS = {
    ligacoes: {
      montar(p) {
        return {
          a1: ator(p, bola('#f4f1ea', 20), 26, 40), a2: ator(p, bola('#f4f1ea', 20), 32, 40),
          b1: ator(p, bola('#ff6b6b'), 64, 40), b2: ator(p, bola('#ff6b6b'), 72, 40),
          e1: por(ator(p, N('absorve energia ⬇'), 50, 78), { o: 0 }), e2: por(ator(p, N('libera energia ⬆ 🔥'), 50, 78), { o: 0 })
        };
      },
      passos: [
        [2600, 'Para reagir, as ligações dos reagentes precisam se <b>quebrar</b>. Isso <b>absorve</b> energia.', a => { por(a.a1, { x: 14 }); por(a.a2, { x: 42 }); por(a.b1, { x: 58 }); por(a.b2, { x: 86 }); por(a.e1, { o: 1 }); }],
        [3000, 'Os átomos se juntam de outro jeito. <b>Formar</b> ligações <b>libera</b> energia.', a => { por(a.e1, { o: 0 }); por(a.e2, { o: 1 }); por(a.a1, { x: 40, y: 34 }); por(a.b1, { x: 50, y: 40 }); por(a.a2, { x: 60, y: 34 }); por(a.b2, { x: 74, y: 52 }); }],
        [3000, 'Se libera mais do que absorveu, a reação é <b>exotérmica</b>. Se absorve mais, é <b>endotérmica</b>.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
