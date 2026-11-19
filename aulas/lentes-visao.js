aulasMM.aulas['lentes-visao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // Onde os raios se encontram (x) para cada olho; a retina fica em x = 262
  const RETINA = 262;
  const OLHOS = {
    normal: { foco: 262, corrigido: 262, lente: null, texto: 'No olho normal, a imagem se forma exatamente na retina: tudo nítido.', comOculos: 'O olho normal não precisa de óculos.' },
    miopia: { foco: 228, corrigido: 262, lente: 'divergente', texto: 'Na miopia, os raios se cruzam ANTES da retina: de longe, tudo fica embaçado.', comOculos: 'A lente divergente (mais fina no meio) espalha um pouco os raios antes de entrarem no olho: o encontro recua até a retina.' },
    hiper: { foco: 300, corrigido: 262, lente: 'convergente', texto: 'Na hipermetropia, os raios se encontrariam DEPOIS da retina: de perto, fica embaçado.', comOculos: 'A lente convergente (mais grossa no meio) junta um pouco os raios antes: o encontro avança até a retina.' }
  };
  let olho = 'miopia', oculos = false;
  function desenhar() {
    const o = OLHOS[olho], usa = oculos && o.lente, foco = usa ? o.corrigido : o.foco;
    const ys = [70, 85, 100], cristalino = 175;
    let raios = '';
    for (const y of ys) {
      const yl = y; // raios paralelos chegam
      raios += `<line x1="10" y1="${yl}" x2="${cristalino}" y2="${yl}" stroke="#e9b949" stroke-width="2"/>`;
      // depois do cristalino, vão até o foco (no eixo y=85) e seguem
      const fim = Math.min(foco, RETINA), yf = 85 + (yl - 85) * (1 - (fim - cristalino) / (foco - cristalino));
      raios += `<line x1="${cristalino}" y1="${yl}" x2="${fim}" y2="${yf}" stroke="#e9b949" stroke-width="2"/>`;
      if (foco < RETINA) { const y2 = 85 + (yl - 85) * (1 - (RETINA - cristalino) / (foco - cristalino)); raios += `<line x1="${foco}" y1="85" x2="${RETINA}" y2="${y2}" stroke="#e9b949" stroke-width="2" opacity=".7"/>`; }
    }
    const lente = usa ? (o.lente === 'divergente'
      ? `<path d="M96 52 q10 33 0 66 h16 q-10 -33 0 -66 z" fill="#bfe3ff" opacity=".8"/>`
      : `<path d="M104 52 q14 33 0 66 q-14 -33 0 -66 z" fill="#bfe3ff" opacity=".8"/>`) : '';
    $('graf').innerHTML = `<ellipse cx="220" cy="85" rx="${olho === 'miopia' ? 58 : olho === 'hiper' ? 46 : 52}" ry="58" fill="color-mix(in srgb, currentColor 8%, transparent)" stroke="currentColor"/>
      <ellipse cx="${cristalino}" cy="85" rx="6" ry="26" fill="#bfe3ff" opacity=".9"/>${lente}${raios}
      <line x1="${RETINA}" y1="60" x2="${RETINA}" y2="110" stroke="var(--errado)" stroke-width="3"/><text x="${RETINA}" y="128" text-anchor="middle" style="fill:var(--errado)">retina</text>
      <circle cx="${foco}" cy="85" r="4" fill="${Math.abs(foco - RETINA) < 2 ? 'var(--certo)' : 'var(--errado)'}"/>
      <text x="${cristalino}" y="128" text-anchor="middle">cristalino</text>${usa ? `<text x="104" y="140" text-anchor="middle">lente ${o.lente}</text>` : ''}`;
    $('graf').setAttribute('aria-label', o.texto);
    raiz.querySelectorAll('[data-olho]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.olho === olho)));
    $('oculos').setAttribute('aria-pressed', String(oculos));
    $('oculos').textContent = oculos ? '👓 Tirar os óculos' : '👓 Colocar os óculos';
    $('recado').textContent = oculos ? o.comOculos : o.texto;
  }
  raiz.querySelectorAll('[data-olho]').forEach(b => b.addEventListener('click', () => { olho = b.dataset.olho; desenhar(); }));
  $('oculos').addEventListener('click', () => { oculos = !oculos; desenhar(); });
  desenhar();

  // ---------- filminho: o canudo quebrado ----------
  const { ator, por } = aulasMM;
  const ROTEIROS = {
    canudo: {
      montar(p) {
        return {
          copo: ator(p, '<span style="display:block;width:90px;height:120px;border:2px solid currentColor;border-top:0;border-radius:0 0 10px 10px;background:linear-gradient(transparent 40%, color-mix(in srgb, #2f7bd8 40%, transparent) 40%)"></span>', 40, 52),
          cima: ator(p, '<span style="display:block;width:6px;height:80px;background:var(--errado);transform:rotate(25deg)"></span>', 44, 26),
          baixo: ator(p, '<span style="display:block;width:6px;height:60px;background:var(--errado);transform:rotate(25deg)"></span>', 44, 62),
          t: por(ator(p, '<span class="au-balao">parece quebrado na superfície</span>', 74, 40), { o: 0 })
        };
      },
      passos: [
        [2400, 'Um canudo reto dentro de um copo com água.'],
        [3000, 'A luz que vem da parte molhada <b>muda de direção</b> ao sair da água para o ar…', a => { a.baixo.style.transition = 'left .8s'; por(a.baixo, { x: 39 }); }],
        [3000, '…e o olho vê essa parte num lugar diferente: o canudo parece <b>quebrado</b>. É a <b>refração</b>.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
