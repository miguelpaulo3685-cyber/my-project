aulasMM.aulas['sangue-heranca'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const pct = n => `${aulasMM.br(n * 100)}%`;
  const barra = (rotulo, n, total) => `<div class="au-gen-barra"><b>${rotulo}</b><span><i style="width:${n / total * 100}%"></i></span><em>${pct(n / total)}</em></div>`;
  // Cada genótipo: [rótulo do botão, alelo 1, alelo 2]
  const MODOS = {
    abo: {
      mae: [['A (IᴬIᴬ)', 'Iᴬ', 'Iᴬ'], ['A (Iᴬi)', 'Iᴬ', 'i'], ['B (IᴮIᴮ)', 'Iᴮ', 'Iᴮ'], ['B (Iᴮi)', 'Iᴮ', 'i'], ['AB (IᴬIᴮ)', 'Iᴬ', 'Iᴮ'], ['O (ii)', 'i', 'i']],
      tipo(x, y) {
        const s = x + y;
        if (s.includes('Iᴬ') && s.includes('Iᴮ')) return 'AB';
        if (s.includes('Iᴬ')) return 'A';
        if (s.includes('Iᴮ')) return 'B';
        return 'O';
      },
      junta: (x, y) => (x === 'i' ? y + x : x + y),
      ordem: ['A', 'B', 'AB', 'O']
    },
    x: {
      mae: [['Normal (XᴰXᴰ)', 'Xᴰ', 'Xᴰ'], ['Portadora (XᴰXᵈ)', 'Xᴰ', 'Xᵈ'], ['Daltônica (XᵈXᵈ)', 'Xᵈ', 'Xᵈ']],
      pai: [['Normal (XᴰY)', 'Xᴰ', 'Y'], ['Daltônico (XᵈY)', 'Xᵈ', 'Y']],
      tipo(x, y) {
        if (y === 'Y') return x === 'Xᵈ' ? 'menino daltônico' : 'menino normal';
        if (x === 'Xᵈ' && y === 'Xᵈ') return 'menina daltônica';
        return x === 'Xᵈ' || y === 'Xᵈ' ? 'menina portadora' : 'menina normal';
      },
      junta: (x, y) => (y === 'Y' ? x + 'Y' : (x === 'Xᵈ' ? y + x : x + y)),
      ordem: ['menina normal', 'menina portadora', 'menina daltônica', 'menino normal', 'menino daltônico']
    }
  };
  let modo = 'abo', mae = 1, pai = 3; // A (Iᴬi) × B (Iᴮi)
  function desenhar() {
    const M = MODOS[modo], listaPai = M.pai || M.mae;
    raiz.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
    $('mae').innerHTML = M.mae.map((g, k) => `<button type="button" data-k="${k}" aria-pressed="${k === mae}">${g[0]}</button>`).join('');
    $('pai').innerHTML = listaPai.map((g, k) => `<button type="button" data-k="${k}" aria-pressed="${k === pai}">${g[0]}</button>`).join('');
    const gm = M.mae[mae].slice(1), gp = listaPai[pai].slice(1);
    const filhos = [];
    $('quadro').innerHTML = `<b></b><b>${gp[0]}</b><b>${gp[1]}</b>` + [0, 1].map(i => `<b>${gm[i]}</b>` + [0, 1].map(j => {
      const t = M.tipo(gm[i], gp[j]); filhos.push(t);
      return `<span>${M.junta(gm[i], gp[j])}<small>${t}</small></span>`;
    }).join('')).join('');
    $('quadro').setAttribute('aria-label', 'Filhos possíveis: ' + filhos.join(', '));
    $('barras').innerHTML = M.ordem.filter(t => filhos.includes(t)).map(t => barra(t, filhos.filter(x => x === t).length, 4)).join('');
    let txt;
    if (modo === 'abo') {
      const tipos = M.ordem.filter(t => filhos.includes(t));
      txt = `Filhos possíveis: ${tipos.join(', ')}. ` + (tipos.length === 4 ? 'Os quatro tipos! Os dois pais carregam o i escondido, e Iᴬ com Iᴮ dá AB (codominância).'
        : gm.includes('Iᴬ') && gm.includes('Iᴮ') || gp.includes('Iᴬ') && gp.includes('Iᴮ') ? 'Quem é AB sempre passa Iᴬ ou Iᴮ: nenhum filho sai O.'
        : tipos.includes('O') ? 'Sai O quando os dois passam o i.' : 'Nenhum filho O: pelo menos um dos pais não tem o alelo i.');
    } else {
      const meninos = filhos.filter(t => t.startsWith('menino')), dalt = meninos.filter(t => t.includes('daltônico')).length;
      const meninas = filhos.filter(t => t.startsWith('menina')), daltF = meninas.filter(t => t.includes('daltônica')).length;
      txt = `Entre os meninos, ${pct(dalt / meninos.length)} são daltônicos; entre as meninas, ${pct(daltF / meninas.length)}. O menino recebe o X da mãe e o Y do pai.`;
      if (listaPai[pai][1] === 'Xᵈ' && daltF === 0) txt += ' O pai daltônico passa o Xᵈ para todas as filhas: elas ficam portadoras.';
    }
    $('recado').textContent = txt;
  }
  raiz.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => {
    modo = b.dataset.modo;
    [mae, pai] = modo === 'abo' ? [1, 3] : [1, 0];
    desenhar();
  }));
  $('mae').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { mae = Number(b.dataset.k); desenhar(); } });
  $('pai').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { pai = Number(b.dataset.k); desenhar(); } });
  desenhar();
  return () => {};
};
