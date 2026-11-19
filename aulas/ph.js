aulasMM.aulas['ph'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pot = e => `10${String(e).split('').map(c => SUP[c]).join('')}`;
  const cient = x => { let e = Math.floor(Math.log10(x)), m = Math.round(x / 10 ** e * 10) / 10; if (m >= 10) { m /= 10; e++; } return m === 1 ? pot(e) : `${br(m, 1)} × ${pot(e)}`; };
  const SUBS = [['🍋', 'Limão', 2], ['🥤', 'Refrigerante', 3], ['🌧️', 'Chuva ácida', 4], ['☕', 'Café', 5], ['💧', 'Água pura', 7], ['🩸', 'Sangue', 7.4],
    ['🌊', 'Água do mar', 8], ['🥛', 'Leite de magnésia', 10], ['🧴', 'Água sanitária', 12], ['🧼', 'Soda cáustica', 13]];
  const COR = ['#d7263d', '#e8473b', '#f2683a', '#f6923c', '#f7b83e', '#e9d046', '#b9d548', '#6fd08c', '#3fb58f', '#2f9fa8', '#2f7bd8', '#4b5fc9', '#6d4dbb', '#8a3fae', '#9b2f9b'];
  const X = ph => 18 + ph / 14 * 284;
  let k = 0;
  function desenhar() {
    const [em, nome, ph] = SUBS[k], h = 10 ** -ph;
    let s = COR.map((c, i) => `<rect x="${X(i - .5 < 0 ? 0 : i - .5)}" y="50" width="${X(Math.min(14, i + .5)) - X(Math.max(0, i - .5))}" height="20" fill="${c}"/>`).join('');
    for (let i = 0; i <= 14; i++) s += `<text x="${X(i)}" y="84" text-anchor="middle" style="${i === 7 ? 'font-weight:800;fill:var(--texto)' : ''}">${i}</text>`;
    s += `<text x="${X(3)}" y="102" text-anchor="middle" style="fill:#e8473b;font-weight:700">ácido</text><text x="${X(7)}" y="102" text-anchor="middle">neutro</text><text x="${X(11)}" y="102" text-anchor="middle" style="fill:#4b5fc9;font-weight:700">básico</text>
      <text x="${X(ph)}" y="30" text-anchor="middle" style="font-size:24px">${em}</text><path d="M${X(ph) - 7} 38 L${X(ph)} 48 L${X(ph) + 7} 38 Z" fill="var(--texto)"/>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `${nome}: pH ${br(ph, 1)}`);
    const carater = ph < 7 ? 'ácido' : ph > 7 ? 'básico' : 'neutro';
    $('leituras').innerHTML = leitura('pH', br(ph, Number.isInteger(ph) ? 0 : 1)) + leitura('[H⁺]', `${cient(h)} mol/L`) + leitura('Caráter', carater);
    const vezes = 10 ** Math.abs(7 - ph);
    $('recado').textContent = ph === 7 ? 'Água pura: tanto H⁺ quanto OH⁻, na mesma quantidade (10⁻⁷ mol/L). É o ponto neutro.'
      : ph < 7 ? `${nome}: ${Math.round(vezes).toLocaleString('pt-BR')} vezes mais H⁺ que a água pura. Cada ponto a menos no pH multiplica a acidez por 10.`
      : `${nome}: ${vezes < 10 ? br(vezes, 1) : Math.round(vezes).toLocaleString('pt-BR')} vezes menos H⁺ que a água pura. É básico: tem mais OH⁻ que H⁺.${ph === 7.4 ? ' O sangue é levemente básico e precisa ficar entre 7,35 e 7,45.' : ''}`;
    raiz.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.k) === k));
  }
  $('subs').innerHTML = SUBS.map(([em, nome], i) => `<button type="button" data-k="${i}">${em} ${nome}</button>`).join('');
  raiz.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { k = Number(b.dataset.k); desenhar(); }));
  desenhar();

  // ---------- filminho: chuva ácida ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = (e, t = 34) => `<span style="font-size:${t}px">${e}</span>`;
  const ROTEIROS = {
    chuva: {
      montar(p) {
        return {
          f: ator(p, E('🏭'), 14, 70), c: ator(p, E('🚗', 28), 32, 76),
          gas: por(ator(p, N('SO₂ e NO₂'), 26, 44), { o: 0 }),
          nuv: ator(p, E('☁️', 40), 62, 18), acid: por(ator(p, N('H₂SO₄ e HNO₃'), 62, 38), { o: 0 }),
          ch: por(ator(p, E('🌧️', 30), 80, 46), { o: 0 }), est: ator(p, E('🗿'), 86, 72)
        };
      },
      passos: [
        [2400, 'Fábricas e carros soltam óxidos de enxofre e de nitrogênio.', a => por(a.gas, { o: 1 })],
        [2800, 'Nas nuvens, esses gases reagem com a água e formam <b>ácidos</b>.', a => { por(a.gas, { x: 52, y: 30, o: 0 }); por(a.acid, { o: 1 }); }],
        [3200, 'A chuva ácida corrói mármore e metais e acidifica lagos e solos. A solução é reduzir as emissões.', a => { por(a.ch, { o: 1 }); por(a.est, { o: .55 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
