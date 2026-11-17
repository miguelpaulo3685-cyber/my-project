aulasMM.aulas['membrana'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const MEIOS = {
    hipo: [1.35, 3, '→ entra', 'Água pura tem menos sal que o interior da hemácia (meio hipotônico). A água entra por osmose, a célula incha e pode até estourar (hemólise).'],
    iso: [1, 12, '⇄ equilíbrio', 'O soro fisiológico (0,9% de sal) tem a mesma concentração que o interior da hemácia (isotônico). Entra e sai a mesma quantidade de água: a célula fica normal.'],
    hiper: [.68, 30, '← sai', 'Água muito salgada tem mais sal que a célula (hipertônico). A água sai da hemácia por osmose, e ela murcha e fica enrugada (crenada).']
  };
  let meio = 'iso';
  function osmose() {
    const [esc, sal, seta, txt] = MEIOS[meio];
    const pontos = Array.from({ length: sal }, (_, k) => `<i style="left:${(k * 37) % 96}%;top:${(k * 53) % 90}%"></i>`).join('');
    $('osmose').innerHTML = `<div class="au-meio-sal">${pontos}</div><div class="au-hemacia${meio === 'hiper' ? ' au-murcha' : ''}" style="transform:translate(-50%,-50%) scale(${esc})"></div>
      <span class="au-seta-agua">💧 água ${seta}</span>`;
    $('osmose').setAttribute('aria-label', txt);
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-meio]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.meio === meio)));
  }
  raiz.querySelectorAll('[data-meio]').forEach(b => b.addEventListener('click', () => { meio = b.dataset.meio; osmose(); }));
  osmose();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    difusao: {
      montar(p) {
        const a = { mem: ator(p, '', 50, 50, 'au-membrana-v'), part: [] };
        for (let k = 0; k < 14; k++) a.part.push(ator(p, '<i class="au-particula" style="background:#e9b949;width:10px;height:10px"></i>', 8 + (k % 4) * 9, 18 + Math.floor(k / 4) * 18));
        a.t1 = ator(p, N('mais concentrado', 'au-pequeno'), 22, 92); a.t2 = ator(p, N('menos concentrado', 'au-pequeno'), 78, 92);
        return a;
      },
      passos: [
        [2400, 'Muitas partículas de um lado da membrana, poucas do outro.'],
        [3200, 'Elas se espalham <b>sozinhas</b> para o lado com menos, atravessando a membrana: é a <b>difusão</b>.', a => a.part.forEach((pt, k) => { if (k % 2) por(pt, { x: 58 + (k % 4) * 9, atraso: k * 90 }); })],
        [2800, 'Até ficar igual dos dois lados. Não gasta energia: é transporte <b>passivo</b>.']
      ]
    },
    bomba: {
      montar(p) {
        const a = { mem: ator(p, '', 50, 50, 'au-membrana-v'), bomba: ator(p, '<span class="au-bomba">bomba</span>', 50, 50) };
        a.na = [0, 1, 2].map(k => ator(p, '<span class="au-ion" style="background:#62a8ea">Na⁺</span>', 30, 30 + k * 18));
        a.k = [0, 1].map(k => ator(p, '<span class="au-ion" style="background:#e9b949">K⁺</span>', 72, 38 + k * 18));
        a.atp = por(ator(p, '<span class="au-balao">⚡ ATP</span>', 50, 14), { o: 0 });
        a.t1 = ator(p, N('dentro da célula', 'au-pequeno'), 24, 92); a.t2 = ator(p, N('fora', 'au-pequeno'), 78, 92);
        return a;
      },
      passos: [
        [2400, 'Fora da célula já há muito <b>sódio</b>; dentro, muito <b>potássio</b>. Mesmo assim a célula precisa mandar mais Na⁺ para fora.'],
        [3000, 'A bomba gasta energia (<b>ATP</b>) e leva <b>3 Na⁺ para fora</b> e <b>2 K⁺ para dentro</b>, contra a corrente.', a => {
          por(a.atp, { o: 1 }); a.na.forEach((n, k) => por(n, { x: 74 + (k % 2) * 8, y: 26 + k * 16, atraso: k * 200 })); a.k.forEach((n, k) => por(n, { x: 26, y: 40 + k * 18, atraso: 600 + k * 200 }));
        }],
        [2800, 'Isso é <b>transporte ativo</b>: vai contra a concentração e gasta energia. Os neurônios dependem dele.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
