aulasMM.aulas['isomeria-plana'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const D = t => `<tspan style="fill:#e9b949">${t}</tspan>`; // destaca a diferença
  // [rótulo, fórmula molecular, [estrutura A, nome A, extra A], [B...], o que muda, explicação]
  const TIPOS = {
    funcao: ['Função', 'C₂H₆O', [`CH₃–CH₂–${D('OH')}`, 'etanol (álcool)', 'ferve a 78 °C'], [`CH₃–${D('O')}–CH₃`, 'metoximetano (éter)', 'ferve a −24 °C'], 'a função', 'Um é álcool, o outro é éter. O álcool faz ligação de hidrogênio e é líquido; o éter, com a mesma fórmula, é gás.'],
    cadeia: ['Cadeia', 'C₄H₁₀', [`CH₃–CH₂–CH₂–CH₃`, 'butano (normal)', 'ferve a −0,5 °C'], [`CH₃–${D('CH(CH₃)')}–CH₃`, 'metilpropano (ramificada)', 'ferve a −12 °C'], 'o tipo de cadeia', 'Mesma função (hidrocarboneto), mas uma cadeia é normal e a outra ramificada. A ramificada é mais "redonda" e ferve mais baixo.'],
    posicao: ['Posição', 'C₃H₈O', [`CH₃–CH₂–CH₂–${D('OH')}`, 'propan-1-ol', 'OH no carbono 1'], [`CH₃–${D('CH(OH)')}–CH₃`, 'propan-2-ol', 'OH no carbono 2'], 'a posição do grupo', 'Mesma cadeia, mesma função (álcool). Só o –OH mudou de carbono.'],
    compensacao: ['Compensação', 'C₄H₁₀O', [`CH₃–CH₂–${D('O')}–CH₂–CH₃`, 'etoxietano', 'O no meio'], [`CH₃–${D('O')}–CH₂–CH₂–CH₃`, 'metoxipropano', 'O deslocado'], 'a posição do heteroátomo', 'Os dois são éteres. O oxigênio, que fica dentro da cadeia, mudou de lugar: isso é compensação (metameria).'],
    tautomeria: ['Tautomeria', 'C₂H₄O', [`CH₂=CH–${D('OH')}`, 'etenol (enol)', 'instável'], [`CH₃–${D('CHO')}`, 'etanal (aldeído)', 'predomina'], 'um H muda de lugar', 'Os dois vivem em equilíbrio: um H "pula" e a dupla muda de lugar. O enol é instável e quase tudo fica na forma de aldeído.']
  };
  let t = 'funcao';
  function desenhar() {
    const [rot, form, A, B, muda, txt] = TIPOS[t];
    const lado = (x, [est, nome, extra]) => `<rect x="${x - 76}" y="34" width="152" height="80" rx="12" fill="currentColor" opacity=".06"/>
      <text x="${x}" y="64" text-anchor="middle" style="font-size:13px;font-weight:800;fill:var(--texto)">${est}</text>
      <text x="${x}" y="86" text-anchor="middle">${nome}</text><text x="${x}" y="104" text-anchor="middle" style="font-size:10px">${extra}</text>`;
    $('graf').innerHTML = `<text x="160" y="20" text-anchor="middle" style="font-size:15px;font-weight:800;fill:var(--texto)">${form}</text>` + lado(80, A) + lado(240, B)
      + `<text x="160" y="80" text-anchor="middle" style="font-size:16px;fill:var(--texto)">${t === 'tautomeria' ? '⇌' : '≠'}</text>`;
    $('graf').setAttribute('aria-label', `Isomeria de ${rot.toLowerCase()}: ${A[1]} e ${B[1]}, ambos ${form}`);
    $('leituras').innerHTML = leitura('Fórmula', form) + leitura('Isomeria', rot.toLowerCase()) + leitura('O que muda', muda);
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
  }
  $('tipos').innerHTML = Object.entries(TIPOS).map(([id, x]) => `<button type="button" data-t="${id}">${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { t = b.dataset.t; desenhar(); }));
  desenhar();

  // ---------- filminho: mesmas peças ----------
  const { ator, por } = aulasMM;
  const N = x => `<span class="au-numero">${x}</span>`;
  const F = x => `<span style="font:800 22px var(--fonte)">${x}</span>`;
  const ROTEIROS = {
    pecas: {
      montar(p) {
        return { pe: ator(p, N('2 C · 6 H · 1 O'), 50, 20), a: por(ator(p, F('CH₃–CH₂–OH'), 50, 50), { o: 0 }), b: por(ator(p, F('CH₃–O–CH₃'), 50, 76), { o: 0 }) };
      },
      passos: [
        [2400, 'Temos as mesmas peças: 2 carbonos, 6 hidrogênios e 1 oxigênio (C₂H₆O).'],
        [2800, 'Montando de um jeito, sai o <b>etanol</b>: líquido, mistura com água, está na bebida e no combustível.', a => por(a.a, { o: 1 })],
        [3000, 'De outro jeito, sai o <b>metoximetano</b>: um gás. Mesma fórmula, substâncias diferentes: são <b>isômeros</b>.', a => por(a.b, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
