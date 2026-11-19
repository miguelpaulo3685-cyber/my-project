aulasMM.aulas['zoologia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const VEN = '#6c8cff', ART = '#ff6b6b', MIS = '#b47cd6';
  // [nome, emoji, respiração, temperatura, coração, tipo de coração, explicação]
  const GRUPOS = {
    peixes: ['Peixes', '🐟', 'brânquias', 'varia com o ambiente', '2 cavidades', 2, 'Coração com 1 átrio e 1 ventrículo, só com sangue venoso: ele vai para as brânquias, pega oxigênio e segue direto para o corpo. A maioria tem fecundação externa, com ovos na água.'],
    anfibios: ['Anfíbios', '🐸', 'pulmões e pele', 'varia com o ambiente', '3 cavidades', 3, 'Dois átrios e um ventrículo, onde o sangue arterial e o venoso se misturam. O girino vive na água, com brânquias; o adulto tem pulmões e respira também pela pele úmida.'],
    repteis: ['Répteis', '🦎', 'pulmões', 'varia com o ambiente', '3 cavidades (4 no jacaré)', 3.5, 'O ventrículo tem uma parede incompleta (septo): a mistura de sangue é menor. Pele seca com escamas e ovo com casca: não dependem da água para reproduzir.'],
    aves: ['Aves', '🐦', 'pulmões e sacos aéreos', 'constante', '4 cavidades', 4, 'Dois átrios e dois ventrículos, sem mistura: o sangue que vai ao corpo é todo arterial. Isso ajuda a manter a temperatura constante e a energia para voar.'],
    mamiferos: ['Mamíferos', '🐭', 'pulmões (com diafragma)', 'constante', '4 cavidades', 4, 'Como nas aves, 4 cavidades e nenhuma mistura. Pelos isolam o calor e as glândulas mamárias alimentam os filhotes. A maioria tem placenta.']
  };
  let g = 'peixes';
  function desenhar() {
    const [nome, em, resp, temp, cor, tipo, txt] = GRUPOS[g];
    const cx = (x, y, w, h, fill, rot) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" style="fill:#10130f;font-weight:800">${rot}</text>`;
    let h = `<text x="56" y="86" text-anchor="middle" style="font-size:56px">${em}</text>`;
    if (tipo === 2) h += cx(140, 14, 150, 48, VEN, 'átrio') + cx(140, 66, 150, 58, VEN, 'ventrículo');
    else if (tipo === 3) h += cx(140, 14, 72, 48, VEN, 'AD') + cx(218, 14, 72, 48, ART, 'AE') + cx(140, 66, 150, 58, MIS, 'ventrículo (mistura)');
    else if (tipo === 3.5) h += cx(140, 14, 72, 48, VEN, 'AD') + cx(218, 14, 72, 48, ART, 'AE') +
      `<rect x="140" y="66" width="150" height="58" rx="10" fill="url(#au-gr)"/><line x1="215" y1="66" x2="215" y2="100" stroke="#10130f" stroke-width="4"/>
       <defs><linearGradient id="au-gr"><stop offset="0" stop-color="${VEN}"/><stop offset=".5" stop-color="${MIS}"/><stop offset="1" stop-color="${ART}"/></linearGradient></defs>
       <text x="215" y="116" text-anchor="middle" style="fill:#10130f;font-weight:800">septo incompleto</text>`;
    else h += cx(140, 14, 72, 48, VEN, 'AD') + cx(218, 14, 72, 48, ART, 'AE') + cx(140, 66, 72, 58, VEN, 'VD') + cx(218, 66, 72, 58, ART, 'VE');
    $('graf').innerHTML = h;
    $('graf').setAttribute('aria-label', `Coração dos ${nome.toLowerCase()}: ${cor}`);
    $('leituras').innerHTML = leitura('Respiração', resp) + leitura('Temperatura', temp) + leitura('Coração', cor);
    $('recado').textContent = txt + ' (Azul: sangue venoso; vermelho: arterial; roxo: mistura.)';
    raiz.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === g));
  }
  $('grupos').innerHTML = Object.entries(GRUPOS).map(([id, x]) => `<button type="button" data-g="${id}">${x[1]} ${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => { g = b.dataset.g; desenhar(); }));
  desenhar();

  // ---------- filminho: invertebrados ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = e => `<span style="font-size:36px">${e}</span>`;
  const ROTEIROS = {
    invertebrados: {
      montar(p) {
        const L = [['🪼', 'cnidários', 16, 30], ['🐌', 'moluscos', 50, 30], ['🪱', 'anelídeos', 84, 30], ['🦋', 'artrópodes', 30, 72], ['⭐', 'equinodermos', 70, 72]];
        return { b: L.map(([e, t, x, y]) => [por(ator(p, E(e), x, y), { o: 0 }), por(ator(p, N(t), x, y + 18), { o: 0 })]) };
      },
      passos: [
        [2600, '<b>Cnidários</b> (água-viva, coral), <b>moluscos</b> (caracol, polvo) e <b>anelídeos</b> (minhoca): corpos moles, sem esqueleto interno.', a => a.b.slice(0, 3).forEach(([e, t]) => { por(e, { o: 1 }); por(t, { o: 1 }); })],
        [3000, '<b>Artrópodes</b>: o maior grupo. Exoesqueleto de quitina e patas articuladas. Para crescer, trocam o exoesqueleto (muda).', a => a.b[3].forEach(x => por(x, { o: 1 }))],
        [2800, '<b>Equinodermos</b> (estrela-do-mar, ouriço): só vivem no mar e são parentes mais próximos dos vertebrados do que parece.', a => a.b[4].forEach(x => por(x, { o: 1 }))]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
