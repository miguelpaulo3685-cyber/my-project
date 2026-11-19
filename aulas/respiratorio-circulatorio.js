aulasMM.aulas['respiratorio-circulatorio'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const VEN = '#6c8cff', ART = '#ff6b6b';
  // Cada etapa: [id da peça, nome, sangue (v/a), x e y da gota, explicação]
  const ETAPAS = [
    ['corpo', 'Células do corpo', 'v', 192, 199, 'Nas células do corpo, o sangue entrega oxigênio e recolhe CO₂. Fica pobre em oxigênio: é o sangue venoso.'],
    ['cava', 'Veias cavas', 'v', 60, 150, 'As veias cavas trazem o sangue venoso do corpo de volta ao coração.'],
    ['AD', 'Átrio direito', 'v', 122, 95, 'O sangue chega ao átrio direito e desce para o ventrículo direito.'],
    ['VD', 'Ventrículo direito', 'v', 122, 136, 'O ventrículo direito bombeia o sangue para os pulmões. Começa a pequena circulação.'],
    ['artp', 'Artéria pulmonar', 'v', 160, 80, 'Pegadinha: a artéria pulmonar leva sangue VENOSO. É artéria porque sai do coração.'],
    ['pulm', 'Pulmões', 'a', 192, 21, 'Nos alvéolos, o sangue solta o CO₂ e pega oxigênio (hematose). Agora é sangue arterial.'],
    ['veiap', 'Veias pulmonares', 'a', 250, 58, 'Outra pegadinha: as veias pulmonares levam sangue ARTERIAL. São veias porque chegam ao coração.'],
    ['AE', 'Átrio esquerdo', 'a', 198, 95, 'O sangue rico em oxigênio entra no átrio esquerdo. Fim da pequena circulação.'],
    ['VE', 'Ventrículo esquerdo', 'a', 198, 136, 'O ventrículo esquerdo tem a parede mais grossa do coração: ele bombeia para o corpo inteiro.'],
    ['aorta', 'Artéria aorta', 'a', 270, 170, 'A aorta, a maior artéria, distribui o sangue arterial para todo o corpo. Começa de novo a volta.']
  ];
  let etapa = 0;
  function desenhar() {
    const [atual, nome, s, gx, gy, txt] = ETAPAS[etapa];
    const op = id => id === atual ? 1 : .35, lw = id => id === atual ? 6 : 3;
    const caixa = (id, x, y, w, h, cor, rot) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${cor}" opacity="${op(id)}"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" style="fill:#10130f;font-weight:800;font-size:12px">${rot}</text>`;
    const vaso = (id, d, cor) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${lw(id)}" stroke-linejoin="round" opacity="${op(id)}"/>`;
    $('graf').innerHTML =
      vaso('cava', 'M110 199 H60 V95 H92', VEN) + vaso('artp', 'M152 136 H160 V36', VEN) +
      vaso('veiap', 'M210 21 H250 V95 H228', ART) + vaso('aorta', 'M228 136 H270 V199 H210', ART) +
      caixa('pulm', 110, 6, 100, 30, etapa === 5 ? ART : '#b9a7d9', 'pulmões') + caixa('corpo', 110, 184, 100, 30, etapa === 0 ? VEN : '#b9a7d9', 'corpo') +
      caixa('AD', 92, 78, 60, 34, VEN, 'AD') + caixa('VD', 92, 116, 60, 40, VEN, 'VD') +
      caixa('AE', 168, 78, 60, 34, ART, 'AE') + caixa('VE', 168, 116, 60, 40, ART, 'VE') +
      `<text x="54" y="140" text-anchor="end">veias</text><text x="54" y="152" text-anchor="end">cavas</text>
      <text x="164" y="56" style="font-size:10px">artéria pulmonar</text>
      <text x="256" y="50">veias</text><text x="256" y="62">pulmonares</text><text x="276" y="166">aorta</text>
      <text x="122" y="170" text-anchor="middle" style="font-size:10px">lado direito</text><text x="198" y="170" text-anchor="middle" style="font-size:10px">lado esquerdo</text>
      <circle cx="${gx}" cy="${gy}" r="8" fill="${s === 'v' ? VEN : ART}" stroke="var(--texto)" stroke-width="2.5"/>`;
    $('graf').setAttribute('aria-label', `O sangue está em: ${nome}`);
    const pequena = etapa >= 3 && etapa <= 7;
    $('leituras').innerHTML = leitura('Onde', nome) + leitura('Sangue', s === 'v' ? '🔵 venoso (pouco O₂)' : '🔴 arterial (rico em O₂)') + leitura('Volta', pequena ? 'pequena (pulmonar)' : 'grande (corpo)');
    $('recado').textContent = `${etapa + 1}/10 · ${txt}`;
  }
  $('prox').addEventListener('click', () => { etapa = (etapa + 1) % ETAPAS.length; desenhar(); });
  $('volta').addEventListener('click', () => { etapa = 0; desenhar(); });
  desenhar();

  // ---------- filminho: o diafragma ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    respirar: {
      montar(p) {
        return {
          ar: por(ator(p, N('ar entra ↓'), 50, 8), { o: 0 }),
          pul: ator(p, '<span style="font-size:58px">🫁</span>', 50, 40),
          dia: ator(p, '<span style="display:block;width:150px;height:7px;border-radius:4px;background:#e9b949"></span>', 50, 66),
          t: ator(p, N('diafragma'), 50, 76)
        };
      },
      passos: [
        [3000, '<b>Inspiração</b>: o diafragma se contrai e desce. O tórax aumenta, a pressão dentro cai e o ar entra.', a => { por(a.pul, { s: 1.25 }); por(a.dia, { y: 76 }); por(a.t, { y: 86 }); por(a.ar, { o: 1, html: N('ar entra ↓') }); }],
        [3000, '<b>Expiração</b>: o diafragma relaxa e sobe. O tórax diminui, a pressão aumenta e o ar sai.', a => { por(a.pul, { s: 1 }); por(a.dia, { y: 66 }); por(a.t, { y: 76 }); por(a.ar, { html: N('ar sai ↑') }); }],
        [3200, 'Quem marca o ritmo é o <b>bulbo</b>, no encéfalo. Ele sente o CO₂ no sangue: com mais CO₂ (exercício), a respiração acelera.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
