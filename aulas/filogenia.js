aulasMM.aulas['filogenia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // Pontas (animais de hoje) e nós (ancestrais), com a posição no desenho
  const BICHOS = {
    tubarao: { nome: 'tubarão', em: '🦈', x: 30 }, sapo: { nome: 'sapo', em: '🐸', x: 82 },
    lagarto: { nome: 'lagarto', em: '🦎', x: 134 }, passaro: { nome: 'pássaro', em: '🐦', x: 186 },
    rato: { nome: 'rato', em: '🐭', x: 238 }, humano: { nome: 'humano', em: '🧍', x: 290 }
  };
  const NOS = {
    R: { x: 88, y: 186, nome: 'o primeiro vertebrado', novo: 'coluna vertebral' },
    A: { x: 147, y: 152, nome: 'o primeiro tetrápode', novo: '4 membros' },
    B: { x: 212, y: 120, nome: 'o primeiro amniota', novo: 'ovo amniótico' },
    C: { x: 160, y: 84, nome: 'o ancestral de répteis e aves', novo: 'escamas' },
    D: { x: 264, y: 84, nome: 'o ancestral dos mamíferos', novo: 'pelos e leite' }
  };
  const PAI = { tubarao: 'R', sapo: 'A', lagarto: 'C', passaro: 'C', rato: 'D', humano: 'D', C: 'B', D: 'B', B: 'A', A: 'R', R: null };
  const pos = id => NOS[id] || { x: BICHOS[id].x, y: 40 };
  const subir = id => { const c = []; for (let n = id; n; n = PAI[n]) c.push(n); return c; };
  // Onde fica a etiqueta de cada novidade (no ramo que chega ao nó)
  const ETIQUETA = { R: [88, 202, 'middle'], A: [122, 180, 'start'], B: [186, 148, 'start'], C: [178, 112, 'end'], D: [246, 112, 'start'] };
  let sel = ['lagarto', 'passaro'];

  function desenhar() {
    const [a, b] = sel, ca = subir(a), cb = subir(b), lca = ca.find(n => cb.includes(n));
    const caminho = new Set([...ca.slice(0, ca.indexOf(lca)), ...cb.slice(0, cb.indexOf(lca))]); // ramos acesos: filho → pai
    let s = '';
    Object.keys(PAI).forEach(f => {
      const p = PAI[f]; if (!p) return;
      const P = pos(p), F = pos(f), aceso = caminho.has(f);
      s += `<line x1="${P.x}" y1="${P.y}" x2="${F.x}" y2="${F.y + (BICHOS[f] ? 10 : 0)}" stroke="${aceso ? 'var(--certo)' : 'currentColor'}" stroke-width="${aceso ? 4 : 2}" opacity="${aceso ? 1 : .45}" stroke-linecap="round"/>`;
    });
    s += `<line x1="88" y1="186" x2="88" y2="194" stroke="currentColor" stroke-width="2" opacity=".45"/>`;
    Object.entries(NOS).forEach(([id, n]) => {
      const [x, y, al] = ETIQUETA[id];
      s += `<circle cx="${n.x}" cy="${n.y}" r="${id === lca ? 8 : 4}" fill="${id === lca ? 'var(--certo)' : 'currentColor'}" opacity="${id === lca ? 1 : .6}"/>
        <text x="${x}" y="${y}" text-anchor="${al}" style="font-size:11px">${n.novo}</text>`;
    });
    Object.entries(BICHOS).forEach(([id, bi]) => {
      const on = sel.includes(id);
      s += `<text x="${bi.x}" y="32" text-anchor="middle" style="font-size:24px;opacity:${on ? 1 : .55}">${bi.em}</text>`;
    });
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `Cladograma: o ancestral comum mais recente de ${BICHOS[a].nome} e ${BICHOS[b].nome} é ${NOS[lca].nome}`);
    raiz.querySelectorAll('[data-bicho]').forEach(bt => bt.setAttribute('aria-pressed', sel.includes(bt.dataset.bicho)));
    const herdado = subir(lca).reverse().map(n => NOS[n].novo);
    const perto = { C: 'bem recente: são parentes próximos', D: 'bem recente: são parentes próximos', B: 'de altura média: parentesco médio', A: 'antigo: parentesco distante', R: 'o mais antigo da árvore: parentesco bem distante' }[lca];
    $('recado').textContent = `O ancestral comum mais recente de ${BICHOS[a].nome} e ${BICHOS[b].nome} é ${NOS[lca].nome} (o nó verde). Esse nó é ${perto}. Os dois herdaram dele: ${herdado.join(', ')}.`
      + (lca === 'C' ? ' Repare: o lagarto é mais parente do pássaro do que do sapo, mesmo sendo mais "parecido" com o sapo.' : '');
  }
  $('bichos').innerHTML = Object.entries(BICHOS).map(([id, b]) => `<button type="button" data-bicho="${id}" aria-pressed="false">${b.em} ${b.nome}</button>`).join('');
  raiz.querySelectorAll('[data-bicho]').forEach(bt => bt.addEventListener('click', () => {
    const id = bt.dataset.bicho;
    if (sel.includes(id)) return;
    sel = [sel[1], id];
    desenhar();
  }));
  desenhar();

  // ---------- filminho: primos, não avô e neto ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    primos: {
      montar(p) {
        return {
          h: ator(p, '<span style="font-size:40px">🧍</span>', 30, 24), c: ator(p, '<span style="font-size:40px">🐒</span>', 70, 24),
          s1: por(ator(p, '<span style="font-size:30px">↖</span>', 40, 52), { o: 0 }), s2: por(ator(p, '<span style="font-size:30px">↗</span>', 60, 52), { o: 0 }),
          anc: por(ator(p, N('ancestral comum<br>(há uns 6 milhões de anos)'), 50, 78), { o: 0 }),
          x: por(ator(p, '<span style="font-size:26px">✗</span>', 50, 24), { o: 0 })
        };
      },
      passos: [
        [2600, 'É comum ouvir que "o homem veio do macaco". Seria o chimpanzé o nosso avô?', a => por(a.x, { o: 1 })],
        [3000, 'Não: os dois descendem de um <b>ancestral comum</b>, que não era nenhum dos dois.', a => { por(a.x, { o: 0 }); por(a.anc, { o: 1 }); por(a.s1, { o: 1 }); por(a.s2, { o: 1 }); }],
        [3000, 'Humano e chimpanzé são <b>primos</b> evolutivos: cada um seguiu seu caminho a partir desse ancestral.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
