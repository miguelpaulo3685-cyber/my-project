aulasMM.aulas['ligacoes'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // [rótulo, átomo 1, cor, átomo 2, cor, tipo, fórmula, nome, explicação]
  const PARES = [
    ['Na + Cl', 'Na', '#c9a0e8', 'Cl', '#7fd17f', 'iônica', 'NaCl', 'sal de cozinha', 'Sódio é metal (1 elétron na última camada) e cloro é ametal (7). O sódio entrega o elétron: Na⁺ e Cl⁻ se atraem.'],
    ['Mg + O', 'Mg', '#e9b949', 'O', '#e05252', 'iônica', 'MgO', 'óxido de magnésio', 'O magnésio (metal) entrega 2 elétrons ao oxigênio (ametal): Mg²⁺ e O²⁻.'],
    ['H + H', 'H', '#dfe6ee', 'H', '#dfe6ee', 'covalente apolar', 'H₂', 'gás hidrogênio', 'Dois átomos iguais dividem um par de elétrons e puxam com a mesma força: ligação covalente apolar.'],
    ['H + Cl', 'H', '#dfe6ee', 'Cl', '#7fd17f', 'covalente polar', 'HCl', 'ácido clorídrico (no estômago)', 'Dois ametais dividem um par. O cloro é mais eletronegativo e puxa o par para perto dele: covalente polar.'],
    ['Cu + Cu', 'Cu', '#d58a4a', 'Cu', '#d58a4a', 'metálica', 'Cu', 'cobre do fio elétrico', 'Metal com metal: os átomos soltam elétrons que ficam livres entre os cátions. Por isso o cobre conduz eletricidade.']
  ];
  let i = 0;
  $('pares').innerHTML = PARES.map((p, k) => `<button type="button" data-i="${k}">${p[0]}</button>`).join('');
  function desenhar() {
    const [, a, ca, b, cb, tipo, form, nome, txt] = PARES[i];
    const at = (s, c, extra = '') => `<span class="au-esfera au-esfera-p" style="background:${c}">${s}${extra}</span>`;
    let cena;
    if (tipo === 'iônica') cena = `${at(a, ca, '<sup>+</sup>')}<span class="au-seta-lig">e⁻ →</span>${at(b, cb, '<sup>−</sup>')}`;
    else if (tipo === 'metálica') cena = `<div class="au-mar-e">${Array.from({ length: 8 }, () => `<span class="au-esfera au-esfera-p" style="background:${ca}">Cu<sup>+</sup></span>`).join('')}${Array.from({ length: 10 }, (_, k) => `<i style="left:${8 + k * 9}%;top:${k % 2 ? 30 : 64}%;animation-delay:${k * .2}s"></i>`).join('')}</div>`;
    else cena = `<div class="au-cov ${tipo.includes('polar') && !tipo.includes('apolar') ? 'au-polar' : ''}">${at(a, ca)}<span class="au-par-e"><i></i><i></i></span>${at(b, cb)}</div>`;
    $('ligacao').innerHTML = cena;
    $('ficha').innerHTML = `<b>${form}</b><span>${nome}</span><em class="au-tipo-${tipo.split(' ')[0]}">ligação ${tipo}</em>`;
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-i]').forEach(x => x.setAttribute('aria-pressed', String(Number(x.dataset.i) === i)));
  }
  $('pares').addEventListener('click', e => { const x = e.target.closest('[data-i]'); if (x) { i = Number(x.dataset.i); desenhar(); } });
  desenhar();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    ionica: {
      montar(p) {
        const a = { na: ator(p, '<span class="au-esfera" style="background:#c9a0e8">Na</span>', 24, 36), cl: ator(p, '<span class="au-esfera" style="background:#7fd17f">Cl</span>', 76, 36) };
        a.e = ator(p, '<i class="au-eletron"></i>', 34, 22);
        a.cristal = por(ator(p, `<div class="au-cristal">${Array.from({ length: 16 }, (_, k) => `<i class="${(k + Math.floor(k / 4)) % 2 ? 'au-cl' : 'au-na'}"></i>`).join('')}</div>`, 50, 50), { o: 0 });
        a.t = ator(p, N('', 'au-pequeno'), 50, 88);
        return a;
      },
      passos: [
        [2400, 'O sódio tem <b>1</b> elétron sobrando na última camada; o cloro precisa de <b>1</b> para completar 8.'],
        [2600, 'O sódio <b>entrega</b> o elétron ao cloro.', a => por(a.e, { x: 66, y: 22 })],
        [2800, 'Viram <b>Na⁺</b> e <b>Cl⁻</b>: cargas opostas se atraem.', a => {
          por(a.e, { o: 0 }); por(a.na, { x: 40, html: '<span class="au-esfera" style="background:#c9a0e8">Na⁺</span>' }); por(a.cl, { x: 60, html: '<span class="au-esfera" style="background:#7fd17f">Cl⁻</span>' });
        }],
        [3200, 'Bilhões deles se empilham alternados: o <b>cristal</b> de sal. Isso é a ligação <b>iônica</b>.', a => { por(a.na, { o: 0 }); por(a.cl, { o: 0 }); por(a.cristal, { o: 1 }); por(a.t, { html: N('metal + ametal → iônica', 'au-pequeno au-certo-txt') }); }]
      ]
    },
    covalente: {
      montar(p) {
        const a = { o: ator(p, '<span class="au-esfera" style="background:#e05252;width:70px;height:70px">O</span>', 50, 40),
          h1: ator(p, '<span class="au-esfera au-esfera-p" style="background:#dfe6ee">H</span>', 14, 70), h2: ator(p, '<span class="au-esfera au-esfera-p" style="background:#dfe6ee">H</span>', 86, 70) };
        a.p1 = por(ator(p, '<span class="au-par-e"><i></i><i></i></span>', 36, 56), { o: 0 }); a.p2 = por(ator(p, '<span class="au-par-e"><i></i><i></i></span>', 64, 56), { o: 0 });
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'O oxigênio tem 6 elétrons na última camada e precisa de mais 2. Cada hidrogênio tem 1 e precisa de mais 1.'],
        [2800, 'Ninguém entrega: cada H divide <b>um par de elétrons</b> com o O.', a => { por(a.h1, { x: 30, y: 62 }); por(a.h2, { x: 70, y: 62 }); por(a.p1, { o: 1 }); por(a.p2, { o: 1 }); }],
        [3200, 'Agora o O tem 8 e cada H tem 2, contando os pares divididos. É a <b>H₂O</b>, ligação <b>covalente</b>.', a => por(a.t, { html: N('ametal + ametal → covalente', 'au-pequeno au-certo-txt') })]
      ]
    },
    metalica: {
      montar(p) {
        const a = { c: [], e: [] };
        for (let k = 0; k < 12; k++) a.c.push(ator(p, '<span class="au-esfera au-esfera-p" style="background:#d58a4a;width:40px;height:40px">+</span>', 14 + (k % 6) * 14.5, 28 + Math.floor(k / 6) * 38));
        for (let k = 0; k < 10; k++) a.e.push(ator(p, '<i class="au-eletron"></i>', 10 + (k % 5) * 20, 47 + (k > 4 ? 0 : -2)));
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'No metal, os átomos soltam os elétrons da última camada: sobram <b>cátions</b> (+) organizados.'],
        [2800, 'Os elétrons ficam <b>livres</b>, passeando entre os cátions: o "mar de elétrons".', a => a.e.forEach((e, k) => por(e, { x: 12 + ((k * 37) % 76), y: 47 + (k % 3 - 1) * 4, atraso: k * 80 }))],
        [3000, 'Ligue uma pilha e esses elétrons andam todos para um lado: é a <b>corrente elétrica</b>. Por isso metal conduz.', a => { a.e.forEach((e, k) => por(e, { x: 80 + (k % 5) * 3, atraso: k * 60 })); por(a.t, { html: N('metal + metal → metálica', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
