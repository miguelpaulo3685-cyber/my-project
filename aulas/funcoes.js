aulasMM.aulas['funcoes'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  // Temperatura: mínimo de 18 °C às 5 h, máximo de 32 °C às 15 h (curva suave, emendada em três trechos).
  const temp = h => { if (h <= 5) return 25 - 7 * Math.cos(Math.PI * (h + 9) / 14 + Math.PI); if (h <= 15) return 25 - 7 * Math.cos(Math.PI * (h - 5) / 10); return 25 + 7 * Math.cos(Math.PI * (h - 15) / 14); };
  function grafico() {
    const h = Number($('hora').value), t = temp(h);
    $('o-hora').textContent = h + ' h';
    const X = v => 30 + v / 24 * 280, Y = v => 190 - (v - 15) / 20 * 175;
    const pts = Array.from({ length: 97 }, (_, k) => k / 4).map(v => `${X(v)},${Y(temp(v))}`).join(' ');
    const sobe = h > 5 && h < 15;
    $('graf').innerHTML = `<line x1="30" y1="190" x2="312" y2="190" stroke="currentColor" opacity=".5"/><line x1="30" y1="190" x2="30" y2="10" stroke="currentColor" opacity=".5"/>
      ${[0, 6, 12, 18, 24].map(v => `<text x="${X(v)}" y="204" text-anchor="middle">${v}h</text>`).join('')}
      ${[15, 20, 25, 30, 35].map(v => `<text x="26" y="${Y(v) + 4}" text-anchor="end">${v}°</text><line x1="30" y1="${Y(v)}" x2="312" y2="${Y(v)}" stroke="currentColor" opacity=".08"/>`).join('')}
      <polyline points="${pts}" fill="none" stroke="#e9b949" stroke-width="3"/>
      <circle cx="${X(5)}" cy="${Y(18)}" r="4" fill="#62a8ea"/><text x="${X(5)}" y="${Y(18) + 16}" text-anchor="middle" style="fill:#62a8ea">mínimo</text>
      <circle cx="${X(15)}" cy="${Y(32)}" r="4" fill="#e05252"/><text x="${X(15)}" y="${Y(32) - 8}" text-anchor="middle" style="fill:#e05252">máximo</text>
      <line x1="${X(h)}" y1="190" x2="${X(h)}" y2="${Y(t)}" stroke="var(--texto)" stroke-dasharray="3 3"/>
      <line x1="30" y1="${Y(t)}" x2="${X(h)}" y2="${Y(t)}" stroke="var(--texto)" stroke-dasharray="3 3"/>
      <circle cx="${X(h)}" cy="${Y(t)}" r="7" fill="var(--texto)"/>`;
    $('recado').innerHTML = `Entrada x = <b>${h} h</b> → saída y = <b>${br(t, 1)} °C</b>. `
      + (h === 5 ? 'É o <b>mínimo</b> do dia.' : h === 15 ? 'É o <b>máximo</b> do dia.' : sobe ? 'Neste trecho a função é <b>crescente</b>: o dia está esquentando.' : 'Neste trecho a função é <b>decrescente</b>: está esfriando.')
      + ' Domínio: de 0 h a 24 h. Imagem: de 18 °C a 32 °C.';
  }
  $('hora').addEventListener('input', grafico);
  grafico();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    maquina: {
      montar(p) {
        const a = { maq: ator(p, '<span class="au-maquina">f(x) = 2x + 1</span>', 50, 46), ent: ator(p, '<span class="au-chip">3</span>', 10, 46), sai: por(ator(p, '<span class="au-chip au-ok">7</span>', 74, 46), { o: 0 }) };
        a.t = ator(p, N('', 'au-pequeno'), 50, 86);
        return a;
      },
      passos: [
        [2400, 'Uma função é como uma <b>máquina</b>: entra um número, sai outro, seguindo uma regra.'],
        [2800, 'Entra <b>x = 3</b>. A regra manda dobrar e somar 1.', a => por(a.ent, { x: 40, o: 0 })],
        [3000, 'Sai <b>f(3) = 7</b>. Cada entrada tem uma única saída.', a => { por(a.sai, { o: 1, x: 90 }); por(a.t, { html: N('f(3) = 2 · 3 + 1 = 7', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
