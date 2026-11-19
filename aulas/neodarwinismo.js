aulasMM.aulas['neodarwinismo'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Contagens "por mil" para desenhar: sensíveis e resistentes
  let sens, res, doses, historia;
  function reiniciar() { sens = 990; res = 10; doses = 0; historia = 'Uma infecção começa com 1 000 bactérias. Por mutação, umas poucas (vermelhas) já nasceram resistentes ao antibiótico.'; desenhar(); }
  function dose() { sens = Math.round(sens * 0.15); res = Math.round(res * 0.8); doses++;
    historia = `Dose ${doses}: o antibiótico matou 85% das sensíveis, mas as resistentes quase não sentem. ${sens + res < 20 ? 'Tratamento completo: sobraram tão poucas que o sistema de defesa do corpo dá conta.' : 'Continue o tratamento até o fim.'}`; desenhar(); }
  function esperar() { const total = sens + res; if (!total) return reiniciar();
    const fator = Math.min(1000 / total, 6); sens = Math.round(sens * fator); res = Math.round(res * fator);
    const p = res / (sens + res);
    historia = `As bactérias que sobraram se multiplicaram. Agora ${br(p * 100, 0)}% delas são resistentes (no começo, só 1%)${p > 0.5 ? ': a nova infecção é muito mais difícil de tratar com o mesmo remédio. Foi isso que parar no meio fez.' : '.'}`; desenhar(); }
  function desenhar() {
    const total = sens + res, n = total ? Math.max(1, Math.min(120, Math.round(total / 1000 * 120))) : 0, nr = total ? Math.round(n * res / total) : 0;
    let pontos = '';
    for (let k = 0; k < n; k++) { const x = 18 + (k % 20) * 14.5, y = 18 + Math.floor(k / 20) * 20; pontos += `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="${k < nr ? 'var(--errado)' : '#6fd08c'}"/>`; }
    $('graf').innerHTML = pontos + (n ? '' : '<text x="160" y="70" text-anchor="middle">nenhuma bactéria</text>') + '<text x="310" y="146" text-anchor="end">verde = sensível · vermelha = resistente</text>';
    $('graf').setAttribute('aria-label', `${sens} bactérias sensíveis e ${res} resistentes`);
    $('leituras').innerHTML = leitura('Sensíveis', br(sens, 0)) + leitura('Resistentes', br(res, 0)) + leitura('% resistentes', total ? br(res / total * 100, 0) + '%' : '—');
    $('recado').textContent = historia;
  }
  $('dose').addEventListener('click', dose);
  $('esperar').addEventListener('click', esperar);
  $('reiniciar').addEventListener('click', reiniciar);
  reiniciar();

  // ---------- filminho: o inseticida ----------
  const { ator, por } = aulasMM;
  const inseto = r => `<span style="font-size:20px;filter:${r ? 'hue-rotate(140deg) saturate(3)' : 'none'}">🦗</span>`;
  const ROTEIROS = {
    inseticida: {
      montar(p) {
        const a = { ins: [] };
        for (let k = 0; k < 10; k++) a.ins.push(ator(p, inseto(k === 3), 14 + (k % 5) * 18, 30 + Math.floor(k / 5) * 26));
        a.spray = por(ator(p, '<span style="font-size:30px">🧴</span>', 92, 20), { o: 0 });
        a.t = por(ator(p, '<span class="au-numero au-pequeno">nova geração: quase toda resistente</span>', 50, 92), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Uma plantação com pragas. Uma delas (diferente) tem, por mutação, resistência ao inseticida.'],
        [2800, 'O inseticida mata as sensíveis. A resistente <b>sobrevive</b>.', a => { por(a.spray, { o: 1 }); a.ins.forEach((x, k) => { if (k !== 3) por(x, { o: .1 }); }); }],
        [3200, 'Ela se reproduz e a próxima geração é quase toda resistente. O inseticida <b>selecionou</b>, não criou, a resistência.', a => { a.ins.forEach((x, k) => por(x, { o: 1, html: inseto(k !== 7) })); por(a.t, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
