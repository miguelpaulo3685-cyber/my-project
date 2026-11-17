aulasMM.aulas['radioatividade'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const ISO = { iodo: ['Iodo-131', 8, 'dias'], cesio: ['Césio-137', 30, 'anos'], carbono: ['Carbono-14', 5730, 'anos'] };
  let iso = 'carbono';
  // Ordem fixa de "sorteio" para cada núcleo: decai na meia-vida em que a vez dele chegar.
  const ORDEM = Array.from({ length: 64 }, (_, k) => (k * 37) % 64);
  function amostra() {
    const m = Number($('meias').value), restam = Math.round(64 / 2 ** m), [nome, t, un] = ISO[iso];
    $('o-meias').textContent = m;
    $('amostra').innerHTML = ORDEM.map(k => `<i class="${k < restam ? 'au-vivo' : ''}"></i>`).join('');
    const tempo = m * t;
    $('amostra').setAttribute('aria-label', `${restam} de 64 núcleos sem decair`);
    $('recado').innerHTML = `<b>${nome}</b>, meia-vida de ${t.toLocaleString('pt-BR')} ${un}. Depois de ${m} meia${m === 1 ? '' : 's'}-vida${m === 1 ? '' : 's'} (${tempo.toLocaleString('pt-BR')} ${un}): restam <b>${restam} de 64</b> núcleos, ou ${br(100 / 2 ** m, m > 2 ? 1 : 0)}% da amostra.`
      + (m ? ' A cada meia-vida, cai pela metade do que havia.' : '');
    raiz.querySelectorAll('[data-iso]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.iso === iso)));
  }
  $('meias').addEventListener('input', amostra);
  raiz.querySelectorAll('[data-iso]').forEach(b => b.addEventListener('click', () => { iso = b.dataset.iso; amostra(); }));
  amostra();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    emissoes: {
      montar(p) {
        const a = { fonte: ator(p, '<span style="font-size:26px">☢️</span>', 5, 46),
          bar: [['papel', 34, '#f3ead6'], ['alumínio', 58, '#b8c2cc'], ['chumbo', 82, '#4a4a55']].map(([n, x, c]) => { const el = ator(p, '', x, 46, 'au-barreira'); el.style.background = c; ator(p, N(n, 'au-pequeno'), x, 88); return el; }),
          r: [['α', '#e05252', 24], ['β', '#62a8ea', 46], ['γ', '#e9b949', 68]].map(([s, c, y]) => ator(p, `<span class="au-raio-r" style="background:${c}">${s}</span>`, 17, y)) };
        return a;
      },
      passos: [
        [2400, 'Uma fonte radioativa solta três tipos de emissão: <b>alfa</b>, <b>beta</b> e <b>gama</b>.'],
        [2800, 'A <b>alfa</b> é pesada: para numa simples <b>folha de papel</b>.', a => por(a.r[0], { x: 30 })],
        [2800, 'A <b>beta</b> atravessa o papel e para no <b>alumínio</b>.', a => por(a.r[1], { x: 54 })],
        [3000, 'A <b>gama</b> atravessa papel e alumínio: só o <b>chumbo</b> grosso segura.', a => por(a.r[2], { x: 78 })]
      ]
    },
    metade: {
      montar(p) {
        const a = { g: ator(p, `<div class="au-amostra au-amostra-p">${'<i class="au-vivo"></i>'.repeat(16)}</div>`, 50, 42) };
        a.t = ator(p, N('16 núcleos · 100%', 'au-medio'), 50, 82);
        return a;
      },
      passos: (() => {
        const passo = (n, txt, rot) => [2400, txt, a => { a.g.querySelectorAll('i').forEach((c, k) => { c.className = ((k * 7) % 16) < n ? 'au-vivo' : ''; }); por(a.t, { html: N(rot, 'au-medio' + (n < 16 ? ' au-cor-u' : '')) }); }];
        return [
          [2200, 'Uma amostra com <b>16</b> núcleos radioativos.'],
          passo(8, 'Depois de <b>uma meia-vida</b>: sobram <b>8</b> (metade).', '8 · 50%'),
          passo(4, 'Mais uma: metade de 8, <b>4</b>.', '4 · 25%'),
          passo(2, 'Mais uma: <b>2</b>. A cada meia-vida, cai pela metade do que havia.', '2 · 12,5%')
        ];
      })()
    },
    fissao: {
      montar(p) {
        const a = { n0: ator(p, '<i class="au-neutron"></i>', 6, 50), u: ator(p, '<span class="au-urano">U</span>', 34, 50) };
        a.f = [[50, 30], [50, 70]].map(([x, y]) => por(ator(p, '<span class="au-frag"></span>', 34, 50), { o: 0 }));
        a.ns = [0, 1, 2].map(k => por(ator(p, '<i class="au-neutron"></i>', 34, 50), { o: 0 }));
        a.us = [[78, 20], [82, 50], [78, 80]].map(([x, y]) => ator(p, '<span class="au-urano">U</span>', x, y));
        a.t = ator(p, N('', 'au-pequeno'), 50, 94);
        return a;
      },
      passos: [
        [2400, 'Um <b>nêutron</b> atinge um núcleo de <b>urânio-235</b>.', a => por(a.n0, { x: 30 })],
        [2800, 'O núcleo se <b>parte em dois</b>, solta muita energia e mais <b>nêutrons</b>.', a => {
          por(a.u, { o: 0 }); por(a.n0, { o: 0 }); a.f.forEach((f, k) => por(f, { o: 1, x: 44, y: k ? 72 : 28 })); a.ns.forEach((n, k) => por(n, { o: 1, x: 52, y: 22 + k * 28 }));
        }],
        [3000, 'Esses nêutrons partem outros núcleos, que soltam mais nêutrons: <b>reação em cadeia</b>. Na usina, ela é controlada.', a => {
          a.ns.forEach((n, k) => por(n, { x: 74, y: [20, 50, 80][k] })); setTimeout(() => a.us.forEach(u => u.firstChild.classList.add('au-quebrando')), 600); por(a.t, { html: N('fissão: núcleo grande → dois menores + energia', 'au-pequeno au-certo-txt') });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
