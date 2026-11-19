aulasMM.aulas['empuxo'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // densidades em g/cm³
  const OBJETOS = { isopor: ['⬜ Isopor', 0.03, '#f2f2f2'], madeira: ['🪵 Madeira', 0.6, '#b98a52'], gelo: ['🧊 Gelo', 0.92, '#bfe3ff'], ovo: ['🥚 Ovo', 1.03, '#f3e3c3'], aco: ['🔩 Aço', 7.8, '#9aa3ad'] };
  const LIQUIDOS = { alcool: ['Álcool', 0.79, '#d8e8ff'], agua: ['Água', 1.0, '#2f7bd8'], mar: ['Água salgada', 1.2, '#1f6aa8'] };
  let obj = 'madeira', liq = 'agua';
  $('objs').innerHTML = Object.entries(OBJETOS).map(([k, [n]]) => `<button type="button" data-obj="${k}">${n}</button>`).join('');
  $('liqs').innerHTML = Object.entries(LIQUIDOS).map(([k, [n]]) => `<button type="button" data-liq="${k}">💧 ${n}</button>`).join('');
  function desenhar() {
    const [no, d, cor] = OBJETOS[obj], [nl, dl, corl] = LIQUIDOS[liq];
    const boia = d < dl, frac = boia ? d / dl : 1, nome = no.split(' ').slice(1).join(' ');
    const nivel = 70, L = 50, x = 135;
    const topo = boia ? nivel - L * (1 - frac) : 170 - 6 - L; // boiando: parte acima do nível; afundado: no fundo
    $('graf').innerHTML = `<rect x="20" y="${nivel}" width="280" height="${170 - nivel}" fill="${corl}" opacity=".45"/>
      <line x1="20" y1="${nivel}" x2="300" y2="${nivel}" stroke="${corl}" stroke-width="2"/>
      <rect x="${x}" y="${topo}" width="${L}" height="${L}" rx="4" fill="${cor}" stroke="currentColor" stroke-opacity=".4"/>
      ${boia ? `<text x="${x + L + 8}" y="${nivel + 4}" style="font-weight:800;fill:var(--texto)">${br(frac * 100, 0)}% embaixo</text>` : `<text x="${x + L + 8}" y="${topo + L / 2 + 4}" style="font-weight:800;fill:var(--errado)">afundou</text>`}`;
    $('graf').setAttribute('aria-label', `${no} em ${nl}: ${boia ? 'boia' : 'afunda'}`);
    $('leituras').innerHTML = leitura('Densidade do objeto', br(d, 2) + ' g/cm³') + leitura('Densidade do líquido', br(dl, 2) + ' g/cm³') + leitura('Resultado', boia ? 'boia' : 'afunda');
    raiz.querySelectorAll('[data-obj]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.obj === obj)));
    raiz.querySelectorAll('[data-liq]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.liq === liq)));
    $('recado').textContent = boia
      ? `A densidade de ${nome.toLowerCase()} (${br(d, 2)}) é menor que a de ${nl.toLowerCase()} (${br(dl, 2)}): boia, com ${br(frac * 100, 0)}% do volume submerso. Afunda só até o líquido deslocado pesar o mesmo que ele.`
      : `A densidade de ${nome.toLowerCase()} (${br(d, 2)}) é maior que a de ${nl.toLowerCase()} (${br(dl, 2)}): mesmo todo submerso, o empuxo não vence o peso, e afunda.${obj === 'ovo' ? ' Tente na água salgada!' : ''}`;
  }
  raiz.addEventListener('click', e => {
    const b = e.target.closest('[data-obj], [data-liq]');
    if (!b) return;
    if (b.dataset.obj) obj = b.dataset.obj; else liq = b.dataset.liq;
    desenhar();
  });
  desenhar();

  // ---------- filminho: o aço que boia ----------
  const { ator, por } = aulasMM;
  const ROTEIROS = {
    navio: {
      montar(p) {
        return {
          agua: ator(p, '<span style="display:block;width:min(310px,82vw);height:70px;background:#2f7bd8;opacity:.45"></span>', 50, 74),
          bloco: ator(p, '<span style="display:block;width:30px;height:30px;background:#9aa3ad;border-radius:3px"></span>', 28, 30),
          casco: por(ator(p, '<svg viewBox="0 0 100 40" style="width:100px;margin:0"><path d="M0 0 h100 l-14 38 h-72 z" fill="#9aa3ad"/></svg>', 70, 30), { o: 0 }),
          t: por(ator(p, '<span class="au-numero au-pequeno">mesmo aço, outra forma</span>', 70, 12), { o: 0 })
        };
      },
      passos: [
        [2400, 'Um bloco maciço de aço na água…', a => { a.bloco.style.transition = 'top 1.2s ease-in'; por(a.bloco, { y: 90 }); }],
        [3000, '…afunda: ele desloca pouca água, e o empuxo é menor que o peso. Agora, o mesmo aço em forma de casco:', a => { por(a.casco, { o: 1 }); por(a.t, { o: 1 }); }],
        [3200, 'Oco, ele desloca muita água: o empuxo iguala o peso e ele <b>boia</b>. A densidade média (aço + ar) ficou menor que a da água.', a => { a.casco.style.transition = 'top 1s ease-out'; por(a.casco, { y: 57 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
