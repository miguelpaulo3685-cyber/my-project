aulasMM.aulas['combustiveis'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // [ícone, nome, origem, renovável?, emissões (0-10 de CO₂ fóssil), enxofre?, produtos]
  const C = [
    ['⛽', 'Gasolina', 'refino do petróleo', false, 8, 'pouco', 'CO₂ + H₂O (e CO, se a queima for incompleta)'],
    ['🚛', 'Diesel', 'refino do petróleo', false, 9, 'sim (menos no S10)', 'CO₂ + H₂O + SO₂ + fuligem'],
    ['🌾', 'Etanol', 'fermentação da cana', true, 2, 'não', 'CO₂ + H₂O, reabsorvido pela cana'],
    ['🌻', 'Biodiesel', 'óleos vegetais e gordura', true, 3, 'quase nada', 'CO₂ + H₂O, reabsorvido pelas plantas'],
    ['🔥', 'Gás natural', 'jazidas no subsolo', false, 6, 'pouco', 'CO₂ + H₂O (queima mais limpa que a gasolina)'],
    ['💧', 'Hidrogênio', 'gás natural ou eletrólise da água', null, 0, 'não', 'só água (H₂O)']
  ];
  let i = 0;
  $('comb').innerHTML = C.map((c, k) => `<button type="button" data-i="${k}">${c[0]} ${c[1]}</button>`).join('');
  function ficha() {
    const [ic, nome, origem, renov, em, s, prod] = C[i];
    $('ficha').innerHTML = `<div class="au-comb-ic">${ic}</div><dl>
      <dt>De onde vem</dt><dd>${origem}</dd>
      <dt>Renovável?</dt><dd>${renov === null ? 'depende de como é produzido' : renov ? '✅ sim' : '❌ não'}</dd>
      <dt>Enxofre</dt><dd>${s}</dd>
      <dt>O que sai na queima</dt><dd>${prod}</dd>
      <dt>CO₂ de origem fóssil</dt><dd><span class="au-medidor-co2"><i style="width:${em * 10}%"></i></span></dd></dl>`;
    $('recado').textContent = renov === null ? 'O hidrogênio só solta água, mas produzi-lo pode emitir CO₂. Feito por eletrólise com energia solar ou eólica, é o hidrogênio verde.'
      : renov ? `${nome} também solta CO₂, mas a próxima plantação absorve esse CO₂ na fotossíntese: o ciclo do carbono fecha.`
      : `${nome} vem de carbono guardado no subsolo há milhões de anos. Queimar devolve esse carbono ao ar e intensifica o efeito estufa.`;
    raiz.querySelectorAll('[data-i]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)));
  }
  $('comb').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { i = Number(b.dataset.i); ficha(); } });
  ficha();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    torre: {
      montar(p) {
        const a = { torre: ator(p, '', 30, 50, 'au-torre'), fogo: ator(p, '<span style="font-size:22px">🔥</span>', 30, 94) };
        a.f = [['gás de cozinha', 14], ['gasolina', 32], ['querosene', 50], ['diesel', 68], ['óleo e asfalto', 86]].map(([n, y]) => por(ator(p, `<span class="au-balao">${n}</span>`, 72, y), { o: 0 }));
        a.bolhas = [0, 1, 2, 3, 4].map(k => por(ator(p, '<i class="au-particula" style="background:#e9b949;width:10px;height:10px"></i>', 30, 88), { o: 0 }));
        return a;
      },
      passos: [
        [2400, 'O petróleo aquecido entra pela base da torre, já quase todo vapor.', a => a.bolhas.forEach(b => por(b, { o: 1 }))],
        [3200, 'Subindo, a torre vai esfriando: cada fração <b>condensa</b> na altura da sua temperatura de ebulição.', a => a.bolhas.forEach((b, k) => por(b, { y: [86, 68, 50, 32, 14][k], atraso: k * 300 }))],
        [3200, 'No topo, as moléculas <b>pequenas</b> (gás de cozinha, gasolina). Embaixo, as <b>grandes</b> (diesel, asfalto).', a => a.f.forEach((f, k) => por(f, { o: 1, atraso: k * 200 }))]
      ]
    },
    ciclo: {
      montar(p) {
        const a = { cana: ator(p, '<span style="font-size:40px">🌾</span>', 18, 62), carro: ator(p, '<span style="font-size:36px">🚗</span>', 80, 66), co2: [] };
        for (let k = 0; k < 4; k++) a.co2.push(por(ator(p, '<span class="au-molecula" style="background:#7d7d84">CO₂</span>', 80, 54), { o: 0 }));
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'O carro queima <b>etanol</b> e solta CO₂.', a => a.co2.forEach((c, k) => por(c, { o: 1, x: 70 - k * 4, y: 40 - k * 6, atraso: k * 200 }))],
        [3000, 'O CO₂ vai para o ar… e a próxima plantação de cana o <b>absorve</b> na fotossíntese.', a => a.co2.forEach((c, k) => por(c, { x: 14 + k * 10, y: 30 + (k % 2) * 10, atraso: k * 200 }))],
        [3000, 'O carbono volta para a planta, que vira etanol de novo. O ciclo fecha: por isso é <b>renovável</b>.', a => { a.co2.forEach(c => por(c, { o: 0 })); por(a.cana, { s: 1.25 }); por(a.t, { html: N('carbono que circula, não carbono novo', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
