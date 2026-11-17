aulasMM.aulas['atomo'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const ELEM = ['', ['H', 'Hidrogênio'], ['He', 'Hélio'], ['Li', 'Lítio'], ['Be', 'Berílio'], ['B', 'Boro'], ['C', 'Carbono'], ['N', 'Nitrogênio'], ['O', 'Oxigênio'], ['F', 'Flúor'], ['Ne', 'Neônio'],
    ['Na', 'Sódio'], ['Mg', 'Magnésio'], ['Al', 'Alumínio'], ['Si', 'Silício'], ['P', 'Fósforo'], ['S', 'Enxofre'], ['Cl', 'Cloro'], ['Ar', 'Argônio'], ['K', 'Potássio'], ['Ca', 'Cálcio']];
  const SOBRE = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sobre = n => String(n).split('').map(d => SOBRE[d]).join('');
  let p = 6, n = 6, e = 6;

  // ---------- monte o átomo ----------
  function desenhar() {
    $('np').textContent = p; $('nn').textContent = n; $('ne').textContent = e;
    // Núcleo: prótons e nêutrons misturados num aglomerado.
    const part = []; for (let i = 0; i < Math.max(p, n); i++) { if (i < p) part.push('#e05252'); if (i < n) part.push('#9aa6b2'); }
    const nucleo = part.map((c, i) => { const ang = i * 2.4, r = 3.2 * Math.sqrt(i); return `<circle cx="${110 + r * Math.cos(ang)}" cy="${110 + r * Math.sin(ang)}" r="5" fill="${c}" stroke="rgba(0,0,0,.3)"/>`; }).join('');
    // Elétrons em camadas de 2, 8, 8, 2.
    const caps = [2, 8, 8, 8], raios = [36, 58, 80, 100];
    let resto = e, camadas = '';
    caps.forEach((cap, k) => {
      const q = Math.min(cap, resto); resto -= q;
      if (q > 0 || k === 0) camadas += `<circle cx="110" cy="110" r="${raios[k]}" fill="none" stroke="currentColor" opacity=".25"/>`;
      for (let i = 0; i < q; i++) { const ang = i / q * Math.PI * 2 - Math.PI / 2; camadas += `<circle cx="${110 + raios[k] * Math.cos(ang)}" cy="${110 + raios[k] * Math.sin(ang)}" r="5" fill="#62a8ea"/>`; }
    });
    $('atomo').innerHTML = camadas + nucleo;
    const [sim, nome] = ELEM[p] || ['?', '?'], A = p + n, carga = p - e;
    const cargaTxt = carga === 0 ? '' : (Math.abs(carga) > 1 ? Math.abs(carga) : '') + (carga > 0 ? '⁺' : '⁻');
    $('ficha').innerHTML = `<div class="au-simbolo"><small>${sobre(A)}</small><b>${sim}</b><i>${cargaTxt}</i></div><strong>${nome}</strong>
      <span>Z = ${p} · A = ${A}</span><span>${carga === 0 ? 'neutro' : carga > 0 ? `cátion (${cargaTxt})` : `ânion (${cargaTxt})`}</span>`;
    const isot = { 1: { 0: 'hidrogênio comum', 1: 'deutério', 2: 'trítio' }, 6: { 6: 'carbono-12, o mais comum', 7: 'carbono-13', 8: 'carbono-14, radioativo, usado para datar fósseis' } };
    $('recado').textContent = (carga === 0 ? `${nome} neutro: ${p} prótons e ${e} elétrons, as cargas se anulam.`
      : carga > 0 ? `Tem ${carga} próton${carga > 1 ? 's' : ''} a mais que elétrons: perdeu elétron${carga > 1 ? 's' : ''} e virou cátion. Continua sendo ${nome.toLowerCase()}.`
      : `Tem ${-carga} elétron${-carga > 1 ? 's' : ''} a mais: ganhou elétron${-carga > 1 ? 's' : ''} e virou ânion. Continua sendo ${nome.toLowerCase()}.`)
      + (isot[p] && isot[p][n] ? ` Com ${n} nêutrons, é o ${isot[p][n]}.` : ` Mude os prótons e o elemento muda; mude os nêutrons e só a massa muda.`);
  }
  raiz.querySelector('.au-contadores').addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.p) p = Math.max(1, Math.min(20, p + Number(b.dataset.p)));
    if (b.dataset.n) n = Math.max(0, Math.min(24, n + Number(b.dataset.n)));
    if (b.dataset.e) e = Math.max(0, Math.min(26, e + Number(b.dataset.e)));
    desenhar();
  });
  desenhar();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    modelos: {
      montar(p) {
        const M = [['<i class="au-m-dalton"></i>', 'Dalton (1808)', 'bolinha maciça'], ['<i class="au-m-thomson"><b></b><b></b><b></b><b></b></i>', 'Thomson (1897)', 'massa + com elétrons'],
          ['<i class="au-m-ruth"><b></b><em></em><em></em></i>', 'Rutherford (1911)', 'núcleo e vazio'], ['<i class="au-m-bohr"><b></b><em></em></i>', 'Bohr (1913)', 'camadas']];
        return { m: M.map(([h, n, d], k) => por(ator(p, `<div class="au-modelo">${h}<b>${n}</b><small>${d}</small></div>`, 13 + k * 25, 48), { o: 0 })) };
      },
      passos: [
        [2400, '<b>Dalton</b>: o átomo é uma bolinha maciça e indivisível.', a => por(a.m[0], { o: 1 })],
        [2600, '<b>Thomson</b> descobre o elétron: uma massa positiva com elétrons espalhados ("pudim de passas").', a => por(a.m[1], { o: 1 })],
        [2800, '<b>Rutherford</b>: quase tudo é vazio, com um núcleo pequeno e positivo no centro.', a => por(a.m[2], { o: 1 })],
        [2800, '<b>Bohr</b>: os elétrons ficam em <b>camadas</b> com energia definida. É o modelo usado nas aulas.', a => por(a.m[3], { o: 1 })]
      ]
    },
    ions: {
      montar(p) {
        const a = { na: ator(p, '<span class="au-esfera" style="background:#c9a0e8">Na</span>', 26, 44), cl: ator(p, '<span class="au-esfera" style="background:#7fd17f">Cl</span>', 74, 44) };
        a.el = ator(p, '<i class="au-eletron"></i>', 36, 30);
        a.t1 = ator(p, N('11 p · 11 e⁻', 'au-pequeno'), 26, 74); a.t2 = ator(p, N('17 p · 17 e⁻', 'au-pequeno'), 74, 74);
        return a;
      },
      passos: [
        [2400, 'Sódio e cloro neutros: prótons e elétrons em igual número.'],
        [2800, 'O sódio <b>perde</b> 1 elétron, e o cloro <b>ganha</b>.', a => por(a.el, { x: 64, y: 30 })],
        [3200, 'Sódio: 11 prótons e 10 elétrons, vira <b>Na⁺</b> (cátion). Cloro: 17 e 18, vira <b>Cl⁻</b> (ânion). E se atraem.', a => {
          por(a.na, { html: '<span class="au-esfera" style="background:#c9a0e8">Na⁺</span>', x: 38 }); por(a.cl, { html: '<span class="au-esfera" style="background:#7fd17f">Cl⁻</span>', x: 62 }); por(a.el, { o: 0 });
          por(a.t1, { html: N('11 p · 10 e⁻', 'au-pequeno au-cor-d'), x: 30 }); por(a.t2, { html: N('17 p · 18 e⁻', 'au-pequeno au-cor-u'), x: 70 });
        }]
      ]
    },
    isotopos: {
      montar(p) {
        const nucleo = (pr, ne) => `<span class="au-nucleo">${'<i class="au-pr"></i>'.repeat(pr)}${'<i class="au-ne"></i>'.repeat(ne)}</span>`;
        const a = { c12: ator(p, nucleo(6, 6), 28, 44), c14: por(ator(p, nucleo(6, 8), 72, 44), { o: 0 }) };
        a.t1 = ator(p, N('C-12: 6 p + 6 n', 'au-pequeno'), 28, 80); a.t2 = por(ator(p, N('C-14: 6 p + 8 n', 'au-pequeno'), 72, 80), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'O <b>carbono-12</b>: 6 prótons (vermelhos) e 6 nêutrons (cinza).'],
        [2800, 'O <b>carbono-14</b>: os mesmos <b>6 prótons</b>, mas 8 nêutrons.', a => { por(a.c14, { o: 1 }); por(a.t2, { o: 1 }); }],
        [3000, 'Mesmo número de prótons = mesmo elemento. São <b>isótopos</b> do carbono, com massas diferentes.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
