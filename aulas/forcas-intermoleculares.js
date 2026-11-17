aulasMM.aulas['forcas-intermoleculares'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // [nome, fórmula, ponto de ebulição (°C), força principal, cor]
  const SUBS = [
    ['Gás de cozinha (propano)', 'C₃H₈', -42, 'dipolo induzido (fraca)', '#9aa6b2'],
    ['Metano', 'CH₄', -162, 'dipolo induzido (fraca)', '#b8c2cc'],
    ['Acetona', 'C₃H₆O', 56, 'dipolo-dipolo (média)', '#e9b949'],
    ['Álcool (etanol)', 'C₂H₆O', 78, 'ligação de hidrogênio', '#7fae3a'],
    ['Água', 'H₂O', 100, 'ligação de hidrogênio (forte)', '#4a94d8']
  ];
  function fogao() {
    const t = Number($('temp').value);
    $('o-temp').textContent = t + ' °C';
    $('frascos').innerHTML = SUBS.map(([nome, f, pe, , cor]) => {
      const gas = t >= pe;
      return `<div class="au-frasco${gas ? ' au-gas' : ''}"><div class="au-vidro"><i style="background:${cor}"></i>${gas ? '<span>〰️</span>' : ''}</div>
        <b>${f}</b><small>${nome}</small><em>ferve a ${pe} °C</em></div>`;
    }).join('');
    const ferveu = SUBS.filter(s => t >= s[2]).map(s => s[0].split(' (')[0].toLowerCase());
    $('recado').textContent = !ferveu.length ? 'Tudo líquido. Aumente a temperatura.'
      : ferveu.length === SUBS.length ? 'Tudo virou gás. A água foi a última: as ligações de hidrogênio seguram as moléculas de água grudadas até 100 °C.'
      : `Já virou gás: ${ferveu.join(', ')}. Quem tem a cola mais fraca entre as moléculas (dipolo induzido) ferve primeiro; quem faz ligação de hidrogênio aguenta mais.`;
  }
  $('temp').addEventListener('input', fogao);
  fogao();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const agua = (carga = false) => `<span class="au-agua-mol"><b>O${carga ? '<sup>δ−</sup>' : ''}</b><i>H${carga ? '<sup>δ+</sup>' : ''}</i><i>H${carga ? '<sup>δ+</sup>' : ''}</i></span>`;
  const ROTEIROS = {
    polar: {
      montar(p) {
        const a = { h2o: ator(p, agua(), 28, 40), co2: ator(p, '<span class="au-co2"><b>O</b><i>C</i><b>O</b></span>', 74, 40) };
        a.t1 = ator(p, N('H₂O', 'au-pequeno'), 28, 76); a.t2 = ator(p, N('CO₂', 'au-pequeno'), 74, 76);
        return a;
      },
      passos: [
        [2400, 'A água é "dobrada"; o CO₂ é reto.'],
        [3000, 'Na água, o O puxa os elétrons: fica <b>negativo</b> (δ−) e os H ficam <b>positivos</b> (δ+). As cargas ficam de lados opostos: é <b>polar</b>.', a => { por(a.h2o, { html: agua(true) }); por(a.t1, { html: N('H₂O: polar', 'au-pequeno au-cor-d') }); }],
        [3000, 'No CO₂, os dois O puxam com a mesma força, em sentidos opostos: as cargas se <b>cancelam</b>. É <b>apolar</b>.', a => por(a.t2, { html: N('CO₂: apolar', 'au-pequeno au-cor-u') })]
      ]
    },
    pontes: {
      montar(p) {
        const a = { m: [[20, 30], [50, 56], [80, 30], [35, 82], [70, 84]].map(([x, y]) => ator(p, agua(true), x, y)) };
        a.l = [[35, 43, 30], [65, 43, -30], [42, 70, 60], [61, 70, -60]].map(([x, y, r]) => { const el = por(ator(p, '', x, y, 'au-ponte-h'), { o: 0 }); el.style.setProperty('--au-r', r + 'deg'); return el; });
        return a;
      },
      passos: [
        [2400, 'Várias moléculas de água, cada uma com um lado + (H) e um lado − (O).'],
        [3000, 'O H de uma molécula gruda no O da vizinha: são as <b>ligações de hidrogênio</b> (tracejado).', a => a.l.forEach((l, k) => por(l, { o: 1, atraso: k * 250 }))],
        [3000, 'Essa rede de "colas" é forte: para ferver, é preciso calor suficiente para soltar as moléculas. Por isso a água ferve a 100 °C.']
      ]
    },
    sabao: {
      montar(p) {
        const a = { gordura: ator(p, '<span class="au-gordura">gordura</span>', 50, 46), s: [] };
        for (let k = 0; k < 8; k++) { const ang = k / 8 * Math.PI * 2; a.s.push(ator(p, '<span class="au-sabao"><b></b><i></i></span>', 50 + Math.cos(ang) * 40, 46 + Math.sin(ang) * 36)); a.s[k].style.setProperty('--au-r', (ang * 180 / Math.PI + 180) + 'deg'); }
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2600, 'Uma gota de <b>gordura</b> (apolar) na água. O sabão tem uma <b>cabeça polar</b> (azul) e uma <b>cauda apolar</b> (amarela).'],
        [3000, 'As caudas apolares entram na gordura; as cabeças polares ficam para fora, na água.', a => a.s.forEach((s, k) => { const ang = k / 8 * Math.PI * 2; por(s, { x: 50 + Math.cos(ang) * 20, y: 46 + Math.sin(ang) * 20, atraso: k * 80 }); })],
        [3000, 'A gordura fica presa numa bolinha com o lado de fora "amigo da água": a água leva tudo embora.', a => por(a.t, { html: N('semelhante dissolve semelhante', 'au-pequeno au-certo-txt') })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
