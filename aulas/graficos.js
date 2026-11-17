aulasMM.aulas['graficos'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- vendas da cantina ----------
  const MESES = ['fev', 'mar', 'abr', 'mai', 'jun'], VENDAS = [96, 99, 101, 98, 104];
  let tipo = 'barras', eixo = 0;
  function grafico() {
    const topo = 110, X = k => 56 + k * 56, Y = v => 172 - (v - eixo) / (topo - eixo) * 150;
    const marcas = eixo === 0 ? [0, 20, 40, 60, 80, 100] : [90, 95, 100, 105, 110];
    let html = `<line x1="36" y1="172" x2="310" y2="172" stroke="currentColor" opacity=".5"/><line x1="36" y1="172" x2="36" y2="14" stroke="currentColor" opacity=".5"/>
      ${marcas.map(m => `<line x1="36" y1="${Y(m)}" x2="310" y2="${Y(m)}" stroke="currentColor" opacity=".1"/><text x="31" y="${Y(m) + 4}" text-anchor="end">${m}</text>`).join('')}
      ${MESES.map((m, k) => `<text x="${X(k)}" y="188" text-anchor="middle">${m}</text>`).join('')}`;
    if (tipo === 'barras') html += VENDAS.map((v, k) => `<rect x="${X(k) - 16}" y="${Y(v)}" width="32" height="${172 - Y(v)}" rx="3" fill="#62a8ea"/><text x="${X(k)}" y="${Y(v) - 5}" text-anchor="middle" style="fill:var(--texto);font-weight:700">${v}</text>`).join('');
    else html += `<polyline points="${VENDAS.map((v, k) => `${X(k)},${Y(v)}`).join(' ')}" fill="none" stroke="#e9b949" stroke-width="3"/>`
      + VENDAS.map((v, k) => `<circle cx="${X(k)}" cy="${Y(v)}" r="4.5" fill="#e9b949"/><text x="${X(k)}" y="${Y(v) - 9}" text-anchor="middle" style="fill:var(--texto);font-weight:700">${v}</text>`).join('');
    if (eixo) html += `<path d="M30 166 l12 -4 M30 170 l12 -4" stroke="var(--errado)" stroke-width="2"/>`;
    $('grafico').innerHTML = html;
    raiz.querySelectorAll('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo)));
    raiz.querySelectorAll('[data-eixo]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.eixo) === eixo)));
    $('recado').textContent = eixo
      ? 'Com o eixo começando em 90, junho parece ter vendido mais que o dobro de fevereiro. Mas foram 96 contra 104: só 8 lanches a mais. O desenho exagera a diferença.'
      : tipo === 'barras'
        ? 'Com o eixo no zero, a altura das barras é proporcional às vendas: dá para ver que os meses foram parecidos. Barras são boas para comparar.'
        : 'A linha mostra o caminho no tempo: subiu até abril, caiu em maio e voltou a subir em junho. Linhas são boas para ver tendência.';
  }
  raiz.querySelectorAll('[data-tipo]').forEach(b => b.addEventListener('click', () => { tipo = b.dataset.tipo; grafico(); }));
  raiz.querySelectorAll('[data-eixo]').forEach(b => b.addEventListener('click', () => { eixo = Number(b.dataset.eixo); grafico(); }));
  grafico();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const svg = html => `<svg viewBox="0 0 300 170" style="width:min(300px,82vw);margin:0">${html}</svg>`;
  const ROTEIROS = {
    eixos: {
      montar(p) {
        const barras = [['SP', 46], ['RJ', 17], ['MG', 21], ['BA', 15]];
        const g = svg(`<line x1="40" y1="140" x2="290" y2="140" stroke="currentColor" opacity=".5"/><line x1="40" y1="140" x2="40" y2="10" stroke="currentColor" opacity=".5" class="au-eixo-y"/>
          ${[0, 10, 20, 30, 40, 50].map(m => `<text x="34" y="${140 - m * 2.5 + 4}" text-anchor="end" class="au-tick-y">${m}</text>`).join('')}
          ${barras.map(([n, v], k) => `<rect x="${62 + k * 58}" y="${140 - v * 2.5}" width="34" height="${v * 2.5}" rx="3" fill="#62a8ea" class="au-b${k}"/><text x="${79 + k * 58}" y="156" text-anchor="middle">${n}</text>`).join('')}`);
        const a = { g: ator(p, g, 50, 46) };
        a.b1 = por(ator(p, '<span class="au-balao">população (em milhões)</span>', 30, 6), { o: 0 });
        a.b2 = por(ator(p, '<span class="au-balao">de 10 em 10</span>', 16, 50), { o: 0 });
        a.t = ator(p, N('', 'au-medio'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'Um gráfico de barras. Antes de comparar, leia os <b>eixos</b>.'],
        [2800, 'O título diz a <b>unidade</b>: população em <b>milhões</b>.', a => por(a.b1, { o: 1 })],
        [2800, 'A escala sobe de <b>10 em 10</b>. A barra de SP passa de 40: uns 46 milhões.', a => por(a.b2, { o: 1 })],
        [3200, 'Agora sim dá para comparar: SP tem mais que o dobro de MG (46 contra 21).', a => {
          a.g.querySelector('.au-b0').setAttribute('fill', '#e9b949'); a.g.querySelector('.au-b2').setAttribute('fill', '#e9b949');
          por(a.t, { html: N('46 ÷ 21 ≈ 2,2 vezes', 'au-medio au-certo-txt') });
        }]
      ]
    },
    pizza: {
      montar(p) {
        const a = { pz: ator(p, '', 32, 48, 'au-pizza-filme') };
        a.pz.style.width = '34%'; a.pz.style.border = '3px solid var(--texto)'; a.pz.style.background = 'var(--superficie)';
        a.leg = [['Ônibus 50%', '#62a8ea', 18], ['A pé 25%', '#e9b949', 40], ['Carro 15%', '#c94b4b', 62], ['Bike 10%', '#2f9e6a', 84]].map(([t, c, y]) => por(ator(p, `<span class="au-leg"><i style="background:${c}"></i>${t}</span>`, 74, y), { o: 0 }));
        return a;
      },
      passos: (() => {
        const fatias = [[50, '#62a8ea'], [25, '#e9b949'], [15, '#c94b4b'], [10, '#2f9e6a']];
        const bg = n => { let acc = 0; const partes = fatias.slice(0, n).map(([v, c]) => { const s = `${c} ${acc * 3.6}deg ${(acc + v) * 3.6}deg`; acc += v; return s; }); return `conic-gradient(${partes.join(', ')}${acc < 100 ? `, var(--superficie) ${acc * 3.6}deg 360deg` : ''})`; };
        const passo = (n, txt) => [2600, txt, a => { a.pz.style.background = bg(n); por(a.leg[n - 1], { o: 1 }); }];
        return [
          [2000, 'Como os alunos vão para a escola? O círculo inteiro é <b>100%</b> (360°).'],
          passo(1, '<b>Ônibus: 50%</b> = metade do círculo, 180°.'),
          passo(2, '<b>A pé: 25%</b> = um quarto, 90°.'),
          passo(3, '<b>Carro: 15%</b> = 15 × 3,6 = 54°.'),
          passo(4, '<b>Bike: 10%</b> = 36°. Somando tudo: 100%, o círculo fechado.')
        ];
      })()
    },
    enganoso: {
      montar(p) {
        const a = {
          b1: ator(p, '', 30, 70, 'au-barra-vert'), b2: ator(p, '', 54, 70, 'au-barra-vert'),
          t1: ator(p, N('96', 'au-pequeno'), 30, 92), t2: ator(p, N('104', 'au-pequeno'), 54, 92),
          lab: ator(p, '<span class="au-balao" style="background:var(--errado);color:#fff">eixo começa no 90</span>', 70, 20)
        };
        for (const b of [a.b1, a.b2]) { b.style.transform = 'translate(-50%, -100%)'; b.style.top = '84%'; }
        a.b1.style.height = '18%'; a.b2.style.height = '42%';
        return a;
      },
      passos: [
        [2800, 'Eixo começando no <b>90</b>: parece que as vendas mais que <b>dobraram</b>.'],
        [3200, 'Agora com o eixo no <b>zero</b>: as barras ficam quase iguais. Foram 96 e 104, só <b>8%</b> a mais.', a => {
          a.b1.style.height = '58%'; a.b2.style.height = '63%'; por(a.lab, { html: '<span class="au-balao" style="background:var(--certo);color:#fff">eixo começa no 0</span>' });
        }],
        [2800, 'Mesmos números, impressões diferentes. <b>Sempre confira onde o eixo começa.</b>']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
