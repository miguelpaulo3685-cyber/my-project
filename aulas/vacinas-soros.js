aulasMM.aulas['vacinas-soros'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Anticorpos (0 a 110) por dia
  const vac = t => t < 5 ? 0 : t < 14 ? 40 * ((t - 5) / 9) ** 1.5 : 30 + 10 * Math.exp(-(t - 14) / 10);
  const mem = s => s < 1 ? 0 : s < 6 ? 75 * ((s - 1) / 5) ** 0.7 : 40 + 35 * Math.exp(-(s - 6) / 12);
  const soro = t => 95 * Math.exp(-t / 8);
  const X = d => 30 + d * 4.5, Y = v => 145 - v * 1.15;
  let cena = 'cobra', trat = null;
  function desenhar() {
    let s = `<line x1="30" y1="145" x2="300" y2="145" stroke="currentColor" opacity=".4"/><line x1="30" y1="10" x2="30" y2="145" stroke="currentColor" opacity=".4"/>
      <text x="22" y="20" transform="rotate(-90 22 20)" style="text-anchor:end">anticorpos</text>`;
    [0, 20, 40].forEach(d => { s += `<text x="${X(d)}" y="160" text-anchor="middle">dia ${d}</text>`; });
    s += `<text x="300" y="160" text-anchor="end">dias →</text>`;
    s += cena === 'cobra'
      ? `<rect x="${X(0)}" y="10" width="${X(2) - X(0)}" height="135" fill="var(--errado)" opacity=".2"/><text x="${X(2) + 4}" y="22" style="fill:var(--errado);font-weight:700">🐍 precisa de defesa já</text>`
      : `<line x1="${X(50)}" y1="10" x2="${X(50)}" y2="145" stroke="var(--errado)" stroke-dasharray="4 3"/><text x="${X(50) - 4}" y="22" text-anchor="end" style="fill:var(--errado);font-weight:700">🦠 contato com o sarampo</text>`;
    if (trat) {
      const f = trat === 'soro' ? soro : (cena === 'sarampo' ? t => vac(t) + (t >= 50 ? mem(t - 50) : 0) : vac);
      const pts = []; for (let d = 0; d <= 60; d += .5) pts.push(`${X(d)},${Y(f(d))}`);
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${trat === 'soro' ? '#7cb7e8' : '#e9b949'}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', trat ? `Anticorpos com ${trat} ao longo de 60 dias` : 'Escolha vacina ou soro');
    $('leituras').innerHTML = !trat ? leitura('Imunidade', '—') + leitura('Começa a agir', '—') + leitura('Memória', '—')
      : trat === 'vacina' ? leitura('Imunidade', 'ativa (o corpo produz)') + leitura('Começa a agir', 'em 1 a 2 semanas') + leitura('Memória', 'sim, por anos')
      : leitura('Imunidade', 'passiva (vem pronta)') + leitura('Começa a agir', 'na hora') + leitura('Memória', 'não');
    const certo = (cena === 'cobra') === (trat === 'soro');
    $('recado').textContent = !trat ? (cena === 'cobra' ? 'O veneno age em poucas horas. O que salva: vacina ou soro?' : 'Uma pessoa quer ficar protegida do sarampo nos próximos anos. Vacina ou soro?')
      : (certo ? '✅ Certo! ' : '❌ Não funciona. ') + {
        'cobra-soro': 'O soro traz anticorpos prontos que neutralizam o veneno na hora.',
        'cobra-vacina': 'A vacina leva 1 a 2 semanas para o corpo produzir anticorpos. O veneno age em horas: é tarde demais. Aqui o certo é o soro.',
        'sarampo-vacina': 'A vacina cria memória. Quando o vírus aparece no dia 50, a resposta é rápida e forte, e a pessoa nem adoece.',
        'sarampo-soro': 'Os anticorpos do soro somem em poucas semanas e não deixam memória. Quando o vírus chega no dia 50, não há defesa pronta. Para prevenir, o certo é a vacina.'
      }[cena + '-' + trat];
    raiz.querySelectorAll('[data-cena]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cena === cena));
    raiz.querySelectorAll('[data-trat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.trat === trat));
  }
  raiz.querySelectorAll('[data-cena]').forEach(b => b.addEventListener('click', () => { cena = b.dataset.cena; trat = null; desenhar(); }));
  raiz.querySelectorAll('[data-trat]').forEach(b => b.addEventListener('click', () => { trat = b.dataset.trat; desenhar(); }));
  desenhar();

  // ---------- filminho: como se faz o soro ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const E = (e, t = 34) => `<span style="font-size:${t}px">${e}</span>`;
  const ROTEIROS = {
    soro: {
      montar(p) {
        return {
          c: ator(p, E('🐍'), 14, 40), t1: ator(p, N('veneno<br>(dose pequena)'), 14, 66),
          h: por(ator(p, E('🐴', 40), 38, 40), { o: 0 }), t2: por(ator(p, N('produz<br>anticorpos'), 38, 66), { o: 0 }),
          tb: por(ator(p, E('🧪'), 62, 40), { o: 0 }), t3: por(ator(p, N('anticorpos<br>purificados'), 62, 66), { o: 0 }),
          s: por(ator(p, E('🧴'), 86, 40), { o: 0 }), t4: por(ator(p, N('soro'), 86, 66), { o: 0 })
        };
      },
      passos: [
        [2400, 'Primeiro, extrai-se o veneno da cobra.'],
        [2800, 'Um cavalo recebe doses pequenas e seguras do veneno. O sistema imune dele produz <b>anticorpos</b>.', a => { por(a.h, { o: 1 }); por(a.t2, { o: 1 }); }],
        [2800, 'Coleta-se um pouco do sangue do cavalo e os anticorpos são separados e purificados.', a => { por(a.tb, { o: 1 }); por(a.t3, { o: 1 }); }],
        [3000, 'Pronto: o <b>soro</b> leva anticorpos prontos a quem foi picado.', a => { por(a.s, { o: 1 }); por(a.t4, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
