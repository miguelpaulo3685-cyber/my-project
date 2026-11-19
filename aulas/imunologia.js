aulasMM.aulas['imunologia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Nível de anticorpos (0 a 110) por dia, no 1º e no 2º contato
  const prim = t => t < 4 ? 0 : t < 14 ? 40 * ((t - 4) / 10) ** 2 : 3 + 37 * Math.exp(-(t - 14) / 7);
  const sec = s => s < 1 ? 0 : s < 6 ? 100 * ((s - 1) / 5) ** 0.7 : 50 + 50 * Math.exp(-(s - 6) / 12);
  const X = d => 30 + d * 4.6, Y = v => 145 - v * 1.2;
  let contatos = 0;
  function desenhar() {
    let s = `<line x1="30" y1="145" x2="300" y2="145" stroke="currentColor" opacity=".4"/><line x1="30" y1="10" x2="30" y2="145" stroke="currentColor" opacity=".4"/>
      <text x="22" y="20" text-anchor="end" transform="rotate(-90 22 20)" style="text-anchor:end">anticorpos</text>`;
    [0, 15, 30, 45, 58].forEach(d => { s += `<text x="${X(d)}" y="160" text-anchor="middle">${d === 58 ? 'dias →' : 'dia ' + d}</text>`; });
    if (contatos >= 1) {
      const fim = contatos === 1 ? 29 : 58;
      const pts = []; for (let d = 0; d <= fim; d += .5) pts.push(`${X(d)},${Y(prim(d) + (d >= 30 ? sec(d - 30) : 0))}`);
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="#e9b949" stroke-width="3" stroke-linejoin="round"/>
        <text x="${X(0)}" y="138" style="font-size:16px">🦠</text><text x="${X(14)}" y="${Y(40) - 6}" text-anchor="middle">1ª resposta</text>`;
    }
    if (contatos >= 2) s += `<text x="${X(30) - 6}" y="138" style="font-size:16px">🦠</text><text x="${X(36)}" y="${Y(110)}" text-anchor="middle" style="fill:var(--certo);font-weight:800">2ª resposta</text>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', contatos === 0 ? 'Gráfico vazio' : contatos === 1 ? 'Primeira resposta: lenta e baixa' : 'Segunda resposta: rápida e muito mais alta');
    $('leituras').innerHTML = contatos === 0 ? leitura('Demora', '—') + leitura('Pico', '—') + leitura('Memória', 'nenhuma')
      : contatos === 1 ? leitura('Demora', 'cerca de 1 semana') + leitura('Pico', 'baixo') + leitura('Memória', 'criada ✓')
      : leitura('Demora', '1 a 2 dias') + leitura('Pico', 'alto (2,5×)') + leitura('Memória', 'em ação ✓');
    $('recado').textContent = contatos === 0 ? 'Aperte "1º contato": um vírus novo entra no corpo.'
      : contatos === 1 ? 'No primeiro contato, os linfócitos demoram uns dias para reconhecer o vírus e fabricar anticorpos: é quando você fica doente. No fim, sobram células de memória. Agora faça o 2º contato.'
      : 'No segundo contato, as células de memória reconhecem o vírus na hora: a resposta vem em 1 ou 2 dias e muito mais forte. Muitas vezes o vírus é eliminado antes de você sentir qualquer coisa. É isso que a vacina imita.';
    $('c1').disabled = contatos >= 1; $('c2').disabled = contatos !== 1;
  }
  $('c1').addEventListener('click', () => { contatos = 1; desenhar(); });
  $('c2').addEventListener('click', () => { contatos = 2; desenhar(); });
  $('volta').addEventListener('click', () => { contatos = 0; desenhar(); });
  desenhar();

  // ---------- filminho: fagocitose ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    fagocitose: {
      montar(p) {
        return {
          mac: ator(p, '<span style="display:block;width:76px;height:62px;border-radius:46% 54% 50% 50%;background:#7cb7e8"></span>', 24, 46), tm: ator(p, N('macrófago'), 24, 74),
          b: [[70, 36], [80, 52], [70, 64]].map(([x, y]) => ator(p, '<span style="font-size:20px">🦠</span>', x, y)),
          lin: por(ator(p, '<span style="display:block;width:40px;height:40px;border-radius:50%;background:#b06ab3"></span>', 80, 30), { o: 0 }),
          tl: por(ator(p, N('linfócito B'), 80, 50), { o: 0 }),
          ac: por(ator(p, '<span style="font:800 22px var(--fonte);color:#b06ab3">Y Y Y</span>', 80, 70), { o: 0 }), ta: por(ator(p, N('anticorpos'), 80, 86), { o: 0 })
        };
      },
      passos: [
        [2400, 'Bactérias entram por um corte. Os primeiros a chegar são os fagócitos, como o macrófago.'],
        [2800, 'Ele envolve e digere as bactérias: é a <b>fagocitose</b>. Defesa inespecífica.', a => { por(a.mac, { x: 66 }); por(a.tm, { x: 66 }); a.b.forEach(b => por(b, { o: 0, s: .4 })); }],
        [3200, 'Ele também mostra pedaços do invasor aos linfócitos. O <b>linfócito B</b> fabrica anticorpos sob medida para aquele inimigo.', a => { por(a.mac, { x: 24 }); por(a.tm, { x: 24 }); por(a.lin, { o: 1 }); por(a.tl, { o: 1 }); por(a.ac, { o: 1 }); por(a.ta, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
