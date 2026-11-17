aulasMM.aulas['impactos-ambientais'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- lagoa ----------
  function lagoa() {
    const n = Number($('nutri').value);
    $('o-nutri').textContent = ['nenhum', 'pouco', 'pouco', 'médio', 'médio', 'muito', 'muito', 'muito', 'demais', 'demais', 'demais'][n];
    const algas = Math.min(100, 6 + n * 10), luz = Math.max(4, 96 - n * 10), o2 = Math.max(3, n <= 2 ? 92 : 92 - (n - 2) * 12), peixes = Math.round(Math.max(0, Math.min(6, (o2 - 20) / 12)));
    const mortos = 6 - peixes;
    $('lagoa').innerHTML = `<div class="au-agua-lagoa" style="--luz:${luz / 100}">
        <div class="au-tapete" style="height:${4 + algas * .38}%"></div>
        ${Array.from({ length: peixes }, (_, i) => `<span class="au-peixe" style="left:${12 + i * 14}%;top:${40 + (i % 3) * 12}%">🐟</span>`).join('')}
        ${Array.from({ length: mortos }, (_, i) => `<span class="au-peixe au-morto" style="left:${10 + i * 15}%">🐟</span>`).join('')}
        ${Array.from({ length: Math.round(o2 / 18) }, (_, i) => `<i class="au-bolha" style="left:${8 + i * 17}%;animation-delay:${i * .4}s"></i>`).join('')}
        <div class="au-plantas-fundo" style="opacity:${Math.max(.1, luz / 100)}">🌿🌱🌿🌱🌿</div></div>`;
    $('lagoa').setAttribute('aria-label', `Algas ${algas}%, luz no fundo ${luz}%, oxigênio ${o2}%, ${peixes} peixes vivos`);
    const med = (nome, v, cor) => `<div class="au-medidor"><small>${nome}</small><div><i style="width:${v}%;background:${cor}"></i></div><b>${v}%</b></div>`;
    $('medidores').innerHTML = med('Algas', algas, '#3fae4a') + med('Luz no fundo', luz, '#e9b949') + med('Oxigênio', o2, '#62a8ea') + med('Peixes vivos', Math.round(peixes / 6 * 100), '#c96b4b');
    $('recado').textContent = n <= 2 ? 'Com pouco nutriente, as algas ficam controladas: a luz chega ao fundo, as plantas de lá fazem fotossíntese e a água tem oxigênio.'
      : n <= 5 ? 'Mais nitrogênio e fósforo: as algas da superfície crescem e começam a fazer sombra. As plantas do fundo enfraquecem.'
      : n <= 7 ? 'O tapete de algas tampa a luz. Algas e plantas morrem em massa, e as bactérias que decompõem tudo isso gastam o oxigênio da água.'
      : 'Eutrofização: quase sem oxigênio, os peixes morrem asfixiados. A causa não é veneno, é a falta de oxigênio consumido na decomposição.';
  }
  $('nutri').addEventListener('input', lagoa);
  lagoa();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const E = (e, tam = 28) => `<span style="font-size:${tam}px">${e}</span>`;
  const ROTEIROS = {
    estufa: {
      montar(p) {
        const a = { sol: ator(p, E('☀️', 32), 12, 14), terra: ator(p, '', 50, 104, 'au-terra'), camada: ator(p, '', 50, 46, 'au-camada-gases') };
        a.luz = [30, 42, 54].map(x => por(ator(p, '<i class="au-raio"></i>', x, 18), { o: 0 }));
        a.calor = [36, 50, 64, 46].map(x => por(ator(p, '<i class="au-raio au-calor"></i>', x, 80), { o: 0 }));
        a.t = ator(p, N('🌡️ 15 °C', 'au-pequeno'), 78, 88);
        return a;
      },
      passos: [
        [2400, 'A luz do <b>Sol</b> atravessa a atmosfera e aquece a Terra.', a => a.luz.forEach((r, i) => por(r, { o: 1, y: 78, atraso: i * 200 }))],
        [3000, 'A Terra devolve calor. Os gases do efeito estufa <b>seguram parte</b> dele: é por isso que o planeta tem uns 15 °C, e não −18 °C.', a => {
          a.luz.forEach(r => por(r, { o: 0 })); a.calor.forEach((r, i) => { por(r, { o: 1, y: i < 2 ? 4 : 52, atraso: i * 200 }); });
        }],
        [3400, 'Com <b>mais CO₂ e metano</b>, a camada engrossa e mais calor fica preso. É a <b>intensificação</b> do efeito estufa.', a => {
          a.camada.classList.add('au-grossa'); a.calor.forEach((r, i) => por(r, { y: 52, atraso: i * 150 })); por(a.t, { html: N('🌡️ esquentando', 'au-pequeno au-errado-txt') });
        }]
      ]
    },
    bioacumula: {
      montar(p) {
        const nivel = (e, x, n) => ({ e: ator(p, E(e, 30), x, 34), m: ator(p, `<div class="au-mercurio">${'<i></i>'.repeat(n)}</div>`, x, 66) });
        const a = { n: [nivel('🦠', 14, 1), nivel('🐟', 38, 4), nivel('🐠', 62, 12), nivel('🦅', 86, 30)] };
        a.n.forEach((x, k) => { if (k) { por(x.e, { o: 0 }); por(x.m, { o: 0 }); } });
        a.r = ['plâncton', 'peixe pequeno', 'peixe grande', 'ave'].map((t, k) => por(ator(p, `<span class="au-rotulo-filme">${t}</span>`, 14 + k * 24, 92), { o: k ? 0 : 1 }));
        return a;
      },
      passos: [
        [2400, 'Cada <b>plâncton</b> tem um pouquinho de mercúrio (pontos vermelhos).'],
        [2600, 'O <b>peixe pequeno</b> come muito plâncton e guarda o mercúrio de todos.', a => { por(a.n[1].e, { o: 1 }); por(a.n[1].m, { o: 1 }); por(a.r[1], { o: 1 }); }],
        [2600, 'O <b>peixe grande</b> come muitos peixes pequenos: concentração ainda maior.', a => { por(a.n[2].e, { o: 1 }); por(a.n[2].m, { o: 1 }); por(a.r[2], { o: 1 }); }],
        [3000, 'No <b>topo</b> da cadeia, a concentração é a maior de todas. Isso é a <b>biomagnificação</b>.', a => { por(a.n[3].e, { o: 1 }); por(a.n[3].m, { o: 1 }); por(a.r[3], { o: 1 }); }]
      ]
    },
    chuva: {
      montar(p) {
        const a = { fab: ator(p, E('🏭', 40), 16, 74), fumaca: [0, 1, 2].map(i => por(ator(p, '<span class="au-molecula" style="background:#7d7d84">SO₂</span>', 18, 52), { o: 0 })) };
        a.nuvem = por(ator(p, E('☁️', 44), 70, 20), { o: 0 });
        a.gotas = [60, 66, 72, 78, 84].map(x => por(ator(p, '<i class="au-gota" style="background:#e05252"></i>', x, 32), { o: 0 }));
        a.estatua = ator(p, E('🗿', 36), 76, 78);
        return a;
      },
      passos: [
        [2600, 'Fábricas e carros soltam <b>óxidos de enxofre e de nitrogênio</b>.', a => a.fumaca.forEach((f, i) => por(f, { o: 1, x: 24 + i * 8, y: 40 - i * 8, atraso: i * 300 }))],
        [2800, 'O vento leva esses gases. Na nuvem, eles reagem com a água e viram <b>ácidos</b>.', a => { a.fumaca.forEach(f => por(f, { x: 70, y: 22, o: 0 })); por(a.nuvem, { o: 1 }); }],
        [3200, 'A <b>chuva ácida</b> cai longe da fábrica e corrói mármore, metais, plantas e acidifica lagos.', a => {
          a.gotas.forEach((g, i) => por(g, { o: 1, y: 66, atraso: i * 250 })); setTimeout(() => por(a.estatua, { o: .5 }), 1200);
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
