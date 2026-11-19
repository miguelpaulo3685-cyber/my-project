aulasMM.aulas['funcoes-organicas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, emoji, antes do grupo, grupo, depois, função, nome do grupo, onde aparece, explicação]
  const COMPS = {
    etanol: ['Etanol', '🍺', 'CH₃–CH₂–', 'OH', '', 'álcool', 'hidroxila (–OH)', 'combustível, bebidas', 'O –OH ligado a um carbono de cadeia faz do etanol um álcool. Ele mistura bem com água por causa desse grupo.'],
    vinagre: ['Ácido acético', '🫙', 'CH₃–', 'COOH', '', 'ácido carboxílico', 'carboxila (–COOH)', 'vinagre', 'O –COOH libera H⁺ na água: é por isso que o vinagre é azedo. Nome oficial: ácido etanoico.'],
    acetona: ['Acetona', '💅', 'CH₃–', 'CO', '–CH₃', 'cetona', 'carbonila no meio (C=O)', 'removedor de esmalte', 'O C=O fica entre dois carbonos: cetona. Nome oficial: propanona.'],
    formol: ['Formol', '🧪', 'H–', 'CHO', '', 'aldeído', 'carbonila na ponta (–CHO)', 'conservante (tóxico)', 'O C=O fica na ponta da cadeia: aldeído. O metanal (formol) é tóxico e proibido em alisantes de cabelo.'],
    eter: ['Éter etílico', '💤', 'CH₃–CH₂–', 'O', '–CH₂–CH₃', 'éter', 'oxigênio entre carbonos (–O–)', 'solvente, antigo anestésico', 'Um oxigênio "no meio" de dois carbonos: éter. Evapora muito fácil.'],
    ester: ['Acetato de etila', '🍌', 'CH₃–', 'COO', '–CH₂–CH₃', 'éster', 'carboxilato (–COO–)', 'aromas de fruta, esmalte', 'Vem de um ácido com um álcool (esterificação). Ésteres têm cheiro de frutas e são aromas artificiais.'],
    amina: ['Metilamina', '🐟', 'CH₃–', 'NH₂', '', 'amina', 'amino (–NH₂)', 'cheiro de peixe', 'O –NH₂ vem da amônia (NH₃). Aminas têm cheiro forte, como o de peixe estragado, e são básicas.']
  };
  let c = 'etanol';
  function desenhar() {
    const [nome, em, a, g, d, func, grupo, onde, txt] = COMPS[c];
    $('graf').innerHTML = `<text x="160" y="52" text-anchor="middle" style="font-size:24px;font-weight:800;fill:var(--texto)">${a}<tspan style="fill:#e9b949">${g}</tspan>${d}</text>
      <text x="160" y="84" text-anchor="middle">${em} ${nome}</text>`;
    $('graf').setAttribute('aria-label', `${nome}: ${a}${g}${d}, função ${func}`);
    $('leituras').innerHTML = leitura('Função', func) + leitura('Grupo', grupo) + leitura('Onde aparece', onde);
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === c));
  }
  $('comps').innerHTML = Object.entries(COMPS).map(([id, x]) => `<button type="button" data-c="${id}">${x[1]} ${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { c = b.dataset.c; desenhar(); }));
  desenhar();

  // ---------- filminho: do vinho ao vinagre ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero">${t}</span>`;
  const F = (a, g) => `<span style="font:800 22px var(--fonte)">${a}<span style="color:#e9b949">${g}</span></span>`;
  const ROTEIROS = {
    vinagre: {
      montar(p) {
        return { e: ator(p, '<span style="font-size:44px">🍷</span>', 50, 26), f: ator(p, F('CH₃–CH₂–', 'OH'), 50, 58), t: ator(p, N('etanol (álcool)'), 50, 82) };
      },
      passos: [
        [2400, 'O vinho tem etanol, um <b>álcool</b>.'],
        [3000, 'Aberto por muito tempo, bactérias usam o oxigênio do ar para <b>oxidar</b> o etanol…', a => por(a.e, { html: '<span style="font-size:44px">🍷🦠</span>' })],
        [3200, '…que vira <b>ácido acético</b>: o vinho virou vinagre. O –OH virou –COOH.', a => { por(a.e, { html: '<span style="font-size:44px">🫙</span>' }); por(a.f, { html: F('CH₃–', 'COOH') }); por(a.t, { html: N('ácido acético') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
