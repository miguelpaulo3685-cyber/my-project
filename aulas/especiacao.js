aulasMM.aulas['especiacao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const LIMITE = 6; // a partir daqui, não geram mais filhos férteis
  let tentou = false;
  // Pássaro desenhado com cor e tamanho de bico que mudam com o tempo
  const passaro = (x, y, cor, bico) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="14" ry="10" fill="${cor}"/><circle cx="10" cy="-8" r="7" fill="${cor}"/>
    <path d="M16 -8 l${6 + bico} 2 l${-6 - bico} 3 z" fill="#e9b949"/><circle cx="12" cy="-10" r="1.5" fill="#10130f"/></g>`;
  function desenhar() {
    const t = Number($('t').value);
    $('o').textContent = t === 0 ? 'nada' : `${t * 10} mil anos`;
    const f = t / 10;
    const corA = `rgb(${Math.round(98 + 120 * f)},${Math.round(168 - 60 * f)},${Math.round(234 - 150 * f)})`; // azul → avermelhado
    const corB = `rgb(${Math.round(98 - 40 * f)},${Math.round(168 + 30 * f)},${Math.round(234 - 160 * f)})`;  // azul → verde
    const bicoA = f * 10, bicoB = -f * 3;
    let aves = '';
    for (let k = 0; k < 4; k++) aves += passaro(36 + (k % 2) * 46, 40 + Math.floor(k / 2) * 50, corA, bicoA) + passaro(204 + (k % 2) * 46, 40 + Math.floor(k / 2) * 50, corB, bicoB);
    $('graf').innerHTML = `<rect x="148" y="0" width="24" height="150" fill="#2f7bd8" opacity="${t ? .7 : 0}"/>
      <text x="80" y="146" text-anchor="middle">lado seco</text><text x="240" y="146" text-anchor="middle">lado úmido</text>${aves}`;
    $('graf').setAttribute('aria-label', `Duas populações separadas por um rio há ${t * 10} mil anos`);
    const especies = t >= LIMITE;
    $('recado').textContent = !tentou
      ? (t === 0 ? 'Uma só população de pássaros. Avance o tempo: um rio vai separar os dois grupos.'
        : `O rio impede o encontro. Em cada lado, mutações diferentes e ambientes diferentes vão mudando a cor e o bico. Depois de ${t * 10} mil anos, as diferenças já são ${especies ? 'grandes' : 'visíveis, mas ainda pequenas'}.`)
      : (especies ? `Mesmo juntas de novo, as duas populações não geram filhos férteis: há isolamento reprodutivo. Agora são duas espécies diferentes.`
        : `Juntas de novo, elas ainda cruzam e têm filhos férteis: continuam sendo a mesma espécie, só com variedades diferentes.`);
  }
  $('t').addEventListener('input', () => { tentou = false; desenhar(); });
  $('juntar').addEventListener('click', () => { tentou = true; desenhar(); });
  desenhar();

  // ---------- filminho: órgãos homólogos ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    homologos: {
      montar(p) {
        return {
          a: ator(p, '<span style="font-size:40px">💪</span>', 20, 40), b: ator(p, '<span style="font-size:40px">🦇</span>', 50, 40), c: ator(p, '<span style="font-size:40px">🐋</span>', 80, 40),
          t1: ator(p, N('braço'), 20, 64), t2: ator(p, N('asa'), 50, 64), t3: ator(p, N('nadadeira'), 80, 64),
          o: por(ator(p, N('os mesmos ossos: úmero, rádio, ulna, dedos'), 50, 86), { o: 0 })
        };
      },
      passos: [
        [2400, 'Um braço que pega, uma asa que voa e uma nadadeira que nada. Funções bem diferentes…'],
        [3000, '…mas por dentro têm <b>os mesmos ossos</b>, na mesma ordem.', a => por(a.o, { o: 1 })],
        [3000, 'São <b>órgãos homólogos</b>: vieram de um ancestral comum e foram modificados pela seleção em cada ambiente.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
