aulasMM.aulas['sintese-proteica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // Código genético padrão: códons na ordem U, C, A, G (1ª, 2ª e 3ª letra).
  const B = 'UCAG', LETRAS = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
  const NOMES = { F: 'Fenilalanina', L: 'Leucina', S: 'Serina', Y: 'Tirosina', C: 'Cisteína', W: 'Triptofano', P: 'Prolina',
    H: 'Histidina', Q: 'Glutamina', R: 'Arginina', I: 'Isoleucina', M: 'Metionina', T: 'Treonina', N: 'Asparagina', K: 'Lisina',
    V: 'Valina', A: 'Alanina', D: 'Ácido aspártico', E: 'Ácido glutâmico', G: 'Glicina', '*': 'PARE' };
  const aminoacido = c => LETRAS[B.indexOf(c[0]) * 16 + B.indexOf(c[1]) * 4 + B.indexOf(c[2])];
  const PAR = { A: 'U', T: 'A', C: 'G', G: 'C' };
  const CICLO = { A: 'T', T: 'C', C: 'G', G: 'A' };
  // Fita molde: TAC AAA CCG CTT ACT → RNA AUG UUU GGC GAA UGA → Met Phe Gly Glu PARE
  const ORIGINAL = 'TACAAACCGCTTACT';
  const EXEMPLOS = {
    original: ORIGINAL,
    silenciosa: 'TACAAGCCGCTTACT', // UUU → UUC: continua fenilalanina
    troca: 'TACAAACCGCATACT',      // GAA → GUA: ácido glutâmico vira valina (como na anemia falciforme)
    parada: 'TACAAACCGATTACT'      // GAA → UAA: parada antes da hora
  };
  let dna = ORIGINAL.split('');
  const proteina = fita => {
    const rna = fita.map(b => PAR[b]).join(''), aas = [];
    let parou = false;
    for (let i = 0; i < rna.length; i += 3) { const a = aminoacido(rna.slice(i, i + 3)); aas.push({ a, depois: parou }); if (a === '*') parou = true; }
    return { rna, aas };
  };
  const base0 = proteina(ORIGINAL.split(''));
  const caixa = (b, i, clicavel) => clicavel
    ? `<button type="button" class="au-gen-base au-gen-${b}${b !== ORIGINAL[i] ? ' au-gen-novo' : ''}" data-i="${i}" aria-label="Base ${b}, posição ${i + 1}: toque para trocar">${b}</button>`
    : `<span class="au-gen-base au-gen-${b}${dna[i] !== ORIGINAL[i] ? ' au-gen-novo' : ''}">${b}</span>`;
  const trincas = (letras, clicavel) => [0, 3, 6, 9, 12].map(i => `<span class="au-gen-codon">${letras.slice(i, i + 3).map((b, k) => caixa(b, i + k, clicavel)).join('')}</span>`).join('');
  function desenhar() {
    const { rna, aas } = proteina(dna);
    $('dna').innerHTML = `<div class="au-gen-rot">DNA (fita molde)</div>${trincas(dna, true)}`;
    $('rna').innerHTML = `<div class="au-gen-rot">RNA mensageiro (códons)</div>${trincas(rna.split(''), false)}`;
    $('prot').innerHTML = '<div class="au-gen-rot">Proteína (aminoácidos)</div>' + aas.map(({ a, depois }, k) =>
      `<span class="au-gen-aa${a === '*' ? ' au-gen-pare' : ''}${a !== base0.aas[k].a && !depois ? ' au-gen-mudou' : ''}${depois ? ' au-gen-apagado' : ''}">${depois ? '—' : NOMES[a]}</span>`).join('');
    // O que aconteceu com a proteína
    const iguais = aas.every((x, k) => x.a === base0.aas[k].a);
    const mudouDna = dna.join('') !== ORIGINAL;
    const primeiraParada = aas.findIndex(x => x.a === '*');
    const troca = aas.findIndex((x, k) => x.a !== base0.aas[k].a && !x.depois && base0.aas[k].a !== '*');
    let txt;
    if (!mudouDna) txt = 'Toque numa letra do DNA para trocar. O RNA é a "cópia complementar" (A vira U, T vira A, C vira G, G vira C) e o ribossomo lê de 3 em 3.';
    else if (iguais) txt = 'Mutação silenciosa: o DNA e o códon mudaram, mas o aminoácido é o mesmo. Vários códons pedem o mesmo aminoácido (o código é degenerado).';
    else if (aas[0].a !== 'M') txt = 'O primeiro códon deixou de ser AUG, o sinal de começo. Sem ele, o ribossomo não começa a proteína aqui.';
    else if (primeiraParada >= 0 && primeiraParada < base0.aas.length - 1) txt = 'Apareceu um códon de parada antes da hora: a proteína sai cortada e quase sempre não funciona.';
    else if (troca >= 0) txt = `Troca de um aminoácido: ${NOMES[base0.aas[troca].a]} virou ${NOMES[aas[troca].a]}. ${aas[troca].a === 'V' && base0.aas[troca].a === 'E' ? 'É exatamente a troca da anemia falciforme!' : 'Dependendo do lugar, a proteína pode mudar de forma e de função.'}`;
    else txt = 'A proteína mudou no final: o códon de parada sumiu e o ribossomo seguiria lendo.';
    $('recado').textContent = txt;
  }
  $('dna').addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const i = Number(b.dataset.i);
    dna[i] = CICLO[dna[i]];
    desenhar();
    $('dna').querySelector(`[data-i="${i}"]`).focus();
  });
  raiz.querySelectorAll('[data-exemplo]').forEach(b => b.addEventListener('click', () => { dna = EXEMPLOS[b.dataset.exemplo].split(''); desenhar(); }));
  desenhar();

  // ---------- filminho: tradução ----------
  const { ator, por } = aulasMM;
  const cod = t => `<span class="au-gen-codon">${t.split('').map(b => `<span class="au-gen-base au-gen-${b}">${b}</span>`).join('')}</span>`;
  const ROTEIROS = {
    traducao: {
      montar(p) {
        const a = { cods: ['AUG', 'UUU', 'GGC', 'UGA'].map((c, k) => por(ator(p, cod(c), 14 + k * 24, 62), { s: .72 })) };
        a.rib = ator(p, '<span class="au-balao">ribossomo</span>', 14, 42);
        a.aas = ['Met', 'Phe', 'Gly'].map((n, k) => por(ator(p, `<span class="au-gen-aa">${n}</span>`, 14 + k * 24, 22), { o: 0 }));
        a.fim = por(ator(p, '<span class="au-gen-aa au-gen-pare">PARE</span>', 86, 22), { o: 0 });
        a.leg = ator(p, '<span class="au-numero au-pequeno">RNA mensageiro</span>', 50, 84);
        return a;
      },
      passos: [
        [2600, 'O RNA mensageiro chega ao ribossomo. Ele começa a ler no <b>AUG</b>, o códon de início.', a => por(a.aas[0], { o: 1 })],
        [2200, 'Cada códon pede um aminoácido: <b>AUG = metionina</b>. O RNA transportador traz o aminoácido certo.'],
        [2400, 'O ribossomo anda 3 letras: <b>UUU = fenilalanina</b>.', a => { por(a.rib, { x: 38 }); por(a.aas[1], { o: 1 }); }],
        [2400, '<b>GGC = glicina</b>. Os aminoácidos vão se ligando numa corrente.', a => { por(a.rib, { x: 62 }); por(a.aas[2], { o: 1 }); }],
        [2800, '<b>UGA</b> é um códon de parada: a corrente se solta. É a proteína pronta.', a => { por(a.rib, { x: 86 }); por(a.fim, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
