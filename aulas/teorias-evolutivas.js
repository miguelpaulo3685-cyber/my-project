aulasMM.aulas['teorias-evolutivas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Cada girafa tem um pescoço (em "palmos", de 1 a 12). Na seca, quem tem pescoço curto come menos.
  let pop, geracao, sorteio = 7;
  const aleatorio = () => { sorteio = (sorteio * 9301 + 49297) % 233280; return sorteio / 233280; };
  const normal = () => { let s = 0; for (let k = 0; k < 6; k++) s += aleatorio(); return s - 3; };
  function reiniciar() { sorteio = 7; geracao = 0; pop = Array.from({ length: 60 }, () => Math.min(12, Math.max(1, Math.round(5 + normal() * 1.6)))); desenhar(); }
  function proxima() {
    // Sobrevivência: quanto maior o pescoço, maior a chance (a seca deixa só folhas altas)
    const vivos = pop.filter(p => aleatorio() < Math.min(0.95, 0.15 + (p - 2) * 0.1));
    const pais = vivos.length ? vivos : pop;
    // Os filhos parecem com os pais, com um pouco de variação
    pop = Array.from({ length: 60 }, () => Math.min(12, Math.max(1, Math.round(pais[Math.floor(aleatorio() * pais.length)] + normal() * 0.7))));
    geracao++;
    desenhar();
  }
  function desenhar() {
    const cont = Array(13).fill(0); pop.forEach(p => cont[p]++);
    const media = pop.reduce((s, p) => s + p, 0) / pop.length, max = Math.max(...cont);
    $('graf').innerHTML = cont.slice(1).map((n, k) => {
      const h = n / Math.max(10, max) * 110, x = 20 + k * 24;
      return `<rect x="${x}" y="${130 - h}" width="18" height="${h}" rx="3" fill="#e9b949"/><text x="${x + 9}" y="144" text-anchor="middle">${k + 1}</text>`;
    }).join('') + `<line x1="${20 + (media - 1) * 24 + 9}" y1="10" x2="${20 + (media - 1) * 24 + 9}" y2="132" stroke="var(--certo)" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="300" y="158" text-anchor="end">tamanho do pescoço →</text><text x="${20 + (media - 1) * 24 + 13}" y="20" style="fill:var(--certo);font-weight:800">média</text>`;
    $('graf').setAttribute('aria-label', `Geração ${geracao}: pescoço médio ${br(media, 1)}`);
    $('leituras').innerHTML = leitura('Geração', geracao) + leitura('Pescoço médio', br(media, 1)) + leitura('Girafas', pop.length);
    $('recado').textContent = geracao === 0
      ? 'A população começa com variação: há girafas de pescoço curto, médio e comprido. Nenhuma vai esticar o pescoço. Aperte "Próxima geração".'
      : `Na seca, as de pescoço curto comem menos e morrem mais. As que sobram têm os filhos, parecidos com elas. Depois de ${geracao} ${geracao === 1 ? 'geração' : 'gerações'}, o pescoço médio foi para ${br(media, 1)}: a população mudou, sem nenhuma girafa mudar durante a vida.`;
  }
  $('prox').addEventListener('click', proxima);
  $('reiniciar').addEventListener('click', reiniciar);
  reiniciar();

  // ---------- filminho: as mariposas da Inglaterra ----------
  const { ator, por } = aulasMM;
  const mar = c => `<span style="font-size:22px;filter:${c === 'escura' ? 'brightness(.35)' : 'none'}">🦋</span>`;
  const ROTEIROS = {
    mariposas: {
      montar(p) {
        const a = { tronco: ator(p, '<span style="display:block;width:120px;height:150px;border-radius:10px;background:#d8d2c4;transition:background 1.2s"></span>', 50, 48) };
        a.m = [['clara', 40, 24], ['clara', 58, 40], ['clara', 44, 58], ['escura', 60, 70], ['clara', 50, 82]].map(([c, x, y]) => ator(p, mar(c), x, y));
        a.t = por(ator(p, '<span class="au-numero au-pequeno">as escuras viram maioria</span>', 50, 96), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Antes das fábricas, os troncos eram claros: as mariposas <b>claras</b> se escondiam e as escuras eram comidas pelos pássaros.'],
        [3000, 'A fuligem escureceu os troncos. Agora as <b>escuras</b> ficam camufladas e as claras é que são vistas.', a => { a.tronco.firstChild.style.background = '#3b3631'; }],
        [3200, 'Geração após geração, as escuras sobrevivem e se reproduzem mais: a população fica escura. O ambiente <b>selecionou</b> quem já era escuro.', a => { a.m.forEach((m, k) => por(m, { html: mar(k === 4 ? 'clara' : 'escura') })); por(a.t, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
