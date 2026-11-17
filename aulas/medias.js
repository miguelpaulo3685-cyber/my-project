aulasMM.aulas['medias'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(v) ? 0 : 1);

  // ---------- notas do simulado ----------
  const NOMES = ['Ana', 'Bia', 'Caio', 'Davi', 'Eva'];
  const notas = [4, 6, 6, 7, 9];
  $('sliders').innerHTML = NOMES.map((n, k) => `<div class="au-controle"><label for="au-n${k}">${n}</label>
    <input id="au-n${k}" type="range" min="0" max="10" value="${notas[k]}"><output id="au-o-n${k}"></output></div>`).join('');
  function medidas() {
    NOMES.forEach((_, k) => { notas[k] = Number($('n' + k).value); $('o-n' + k).textContent = notas[k]; });
    const ord = [...notas].sort((a, b) => a - b), media = notas.reduce((s, x) => s + x, 0) / notas.length, mediana = ord[2];
    const cont = {}; notas.forEach(x => { cont[x] = (cont[x] || 0) + 1; });
    const max = Math.max(...Object.values(cont)), modas = max > 1 ? Object.keys(cont).filter(k => cont[k] === max).map(Number) : [];
    $('media').textContent = num(media); $('mediana').textContent = mediana; $('moda').textContent = modas.length ? modas.join(' e ') : 'não há';
    const X = v => 20 + v * 28, vistos = {};
    $('reta-notas').innerHTML = `<line x1="20" y1="90" x2="300" y2="90" stroke="currentColor" opacity=".5"/>
      ${Array.from({ length: 11 }, (_, v) => `<line x1="${X(v)}" y1="86" x2="${X(v)}" y2="94" stroke="currentColor" opacity=".5"/><text x="${X(v)}" y="110" text-anchor="middle">${v}</text>`).join('')}
      ${notas.map((v, k) => { vistos[v] = (vistos[v] || 0) + 1; return `<circle cx="${X(v)}" cy="${90 - vistos[v] * 15}" r="6.5" fill="${modas.includes(v) ? '#2f9e6a' : 'var(--texto-fraco)'}"><title>${NOMES[k]}: ${v}</title></circle>`; }).join('')}
      <line x1="${X(media)}" y1="8" x2="${X(media)}" y2="94" stroke="#62a8ea" stroke-width="3"/><text x="${X(media)}" y="8" text-anchor="middle" style="fill:#62a8ea;font-weight:700">média</text>
      <line x1="${X(mediana)}" y1="20" x2="${X(mediana)}" y2="94" stroke="#e9b949" stroke-width="3" stroke-dasharray="5 4"/><text x="${X(mediana)}" y="${Math.abs(mediana - media) < .9 ? 30 : 20}" text-anchor="${mediana >= media ? 'start' : 'end'}" dx="${mediana >= media ? 4 : -4}" style="fill:#e9b949;font-weight:700">mediana</text>`;
    const longe = notas.some(x => Math.abs(x - mediana) >= 5);
    $('recado').textContent = `Em ordem: ${ord.join(', ')}. Média = soma ÷ 5 = ${notas.reduce((s, x) => s + x, 0)} ÷ 5 = ${num(media)}. Mediana = o 3º da fila = ${mediana}.`
      + (longe ? ' Repare: uma nota muito diferente das outras puxa a média, mas quase não mexe na mediana.' : ' Ponha uma nota bem diferente das outras (0 ou 10) e veja qual medida se mexe mais.');
  }
  NOMES.forEach((_, k) => $('n' + k).addEventListener('input', medidas));
  medidas();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const barra = (p, x, h, cor = '#62a8ea') => { const el = ator(p, '', x, 82, 'au-barra-vert'); el.style.transform = 'translate(-50%, -100%)'; el.style.height = h + '%'; el.style.background = cor; return el; };
  const ROTEIROS = {
    nivelar: {
      montar(p) {
        const a = { b: [[4, 30], [6, 50], [8, 70]].map(([v, x]) => barra(p, x, v * 8)) };
        a.t = [[4, 30], [6, 50], [8, 70]].map(([v, x]) => ator(p, N(v, 'au-pequeno'), x, 90));
        a.linha = por(ator(p, '', 50, 82 - 48, 'au-linha-media'), { o: 0 });
        a.bloco = por(ator(p, '', 70, 82 - 56, 'au-bloquinho-media'), { o: 0 });
        a.c = ator(p, N('', 'au-medio'), 50, 12);
        return a;
      },
      passos: [
        [2400, 'Três notas: <b>4, 6 e 8</b>.'],
        [2800, 'Tire <b>2</b> de quem tem 8…', a => { a.b[2].style.height = '48%'; por(a.bloco, { o: 1 }); por(a.t[2], { html: N('6', 'au-pequeno') }); }],
        [2800, '…e dê para quem tem 4. Agora todos têm <b>6</b>.', a => { por(a.bloco, { x: 30, y: 82 - 40 }); setTimeout(() => { a.b[0].style.height = '48%'; por(a.bloco, { o: 0 }); por(a.t[0], { html: N('6', 'au-pequeno') }); }, 700); }],
        [3200, 'A média é esse nível: <b>(4 + 6 + 8) ÷ 3 = 6</b>.', a => { por(a.linha, { o: 1 }); por(a.c, { html: N('média = 18 ÷ 3 = 6', 'au-medio au-certo-txt') }); }]
      ]
    },
    fila: {
      montar(p) {
        const vals = [7, 20, 3, 8, 5];
        const a = { c: vals.map((v, k) => ator(p, `<span class="au-chip">${v}</span>`, 14 + k * 18, 40)), vals };
        a.t = ator(p, N('', 'au-medio'), 50, 82);
        return a;
      },
      passos: [
        [2400, 'Cinco valores, fora de ordem: 7, 20, 3, 8, 5.'],
        [3000, 'Ponha <b>em ordem</b>: 3, 5, 7, 8, 20.', a => {
          const ord = [...a.vals].sort((x, y) => x - y);
          a.c.forEach((c, k) => por(c, { x: 14 + ord.indexOf(a.vals[k]) * 18 }));
        }],
        [3000, 'O do <b>meio</b> é o 3º: <b>7</b>. Essa é a mediana. O 20 lá na ponta nem importa.', a => {
          a.c[0].firstChild.classList.add('au-ok'); por(a.t, { html: N('mediana = 7', 'au-medio au-certo-txt') });
        }]
      ]
    },
    salario: {
      montar(p) {
        const a = { b: [2, 2, 2, 2, 30].map((v, k) => barra(p, 14 + k * 18, v * 2.3, k === 4 ? '#c94b4b' : '#62a8ea')) };
        a.mediana = por(ator(p, '', 50, 82 - 4.6, 'au-linha-media au-linha-mediana'), { o: 0 });
        a.media = por(ator(p, '', 50, 82 - 17.5, 'au-linha-media'), { o: 0 });
        a.tm = por(ator(p, N('média R$ 7,6 mil', 'au-pequeno au-cor-d'), 36, 82 - 23), { o: 0 });
        a.td = por(ator(p, N('mediana R$ 2 mil', 'au-pequeno au-cor-u'), 36, 92), { o: 0 });
        return a;
      },
      passos: [
        [2600, 'Quatro funcionários ganham <b>R$ 2 mil</b>. O dono ganha <b>R$ 30 mil</b>.'],
        [3000, 'A <b>média</b> é (8 + 30) ÷ 5 = <b>R$ 7,6 mil</b>. Ninguém ganha isso de verdade.', a => { por(a.media, { o: 1 }); por(a.tm, { o: 1 }); }],
        [3200, 'A <b>mediana</b> (o do meio da fila) é <b>R$ 2 mil</b>: representa bem a maioria.', a => { por(a.mediana, { o: 1 }); por(a.td, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
