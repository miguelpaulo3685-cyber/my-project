aulasMM.aulas['corrosao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, tem água, tem ar, ferrugem (0 a 1), extra no desenho, explicação]
  const TUBOS = {
    seco: ['Ar seco', false, true, .03, 'seco', 'Com um secante no tubo, não há umidade. Sem água, o prego fica praticamente intacto.'],
    oleo: ['Água sem ar', true, false, .08, 'oleo', 'Água fervida (sem oxigênio dissolvido) e uma camada de óleo por cima, que não deixa o ar entrar. Sem oxigênio, quase nada de ferrugem.'],
    agua: ['Água e ar', true, true, .55, '', 'Ferro, água e oxigênio juntos: a ferrugem aparece em poucos dias.'],
    sal: ['Água salgada', true, true, .95, 'sal', 'Os íons do sal deixam a água boa condutora e aceleram a oxirredução: é o pior caso.'],
    zinco: ['Prego com zinco', true, true, .05, 'zinco', 'O zinco tem menor potencial de redução: ele oxida no lugar do ferro (metal de sacrifício). O prego fica protegido enquanto houver zinco.'],
    cobre: ['Prego com cobre', true, true, .85, 'cobre', 'O cobre é mais nobre que o ferro. Em contato, o ferro vira o ânodo da "pilha" e enferruja ainda mais rápido.']
  };
  let t = 'agua';
  function desenhar() {
    const [nome, agua, ar, fer, extra, txt] = TUBOS[t];
    let s = `<path d="M120 10 V128 a20 20 0 0 0 80 0 V10" fill="none" stroke="currentColor" stroke-width="3" opacity=".7"/>`;
    if (agua) s += `<path d="M123 50 V128 a17 17 0 0 0 74 0 V50 Z" fill="${extra === 'sal' ? '#9bd3c4' : '#2f7bd8'}" opacity=".3"/>`;
    if (extra === 'oleo') s += `<rect x="123" y="40" width="74" height="12" fill="#e9b949" opacity=".7"/><text x="210" y="50">óleo</text>`;
    if (extra === 'seco') s += `<rect x="128" y="120" width="64" height="18" rx="6" fill="#f4f1ea" opacity=".6"/><text x="210" y="134">secante</text>`;
    if (extra === 'sal') s += `<text x="210" y="90">sal dissolvido</text>`;
    // O prego: cabeça e haste, com manchas de ferrugem conforme o caso
    s += `<rect x="146" y="18" width="28" height="7" rx="2" fill="#9aa4ab"/><path d="M156 25 H164 V118 L160 128 L156 118 Z" fill="#9aa4ab"/>`;
    for (let k = 0; k < Math.round(fer * 14); k++) s += `<circle cx="${156 + ((k * 7) % 9)}" cy="${40 + ((k * 37) % 80)}" r="${3 + (k % 3)}" fill="#a0522d" opacity=".9"/>`;
    if (extra === 'zinco') s += `<rect x="150" y="70" width="20" height="16" rx="3" fill="#cfd6db"/><text x="210" y="82">zinco</text>`;
    if (extra === 'cobre') s += `<path d="M152 64 h16 M152 70 h16 M152 76 h16" stroke="#c8743c" stroke-width="3"/><text x="210" y="74">fio de cobre</text>`;
    s += `<text x="20" y="40" style="font-size:22px">${agua ? '💧' : '🚫💧'}</text><text x="20" y="80" style="font-size:22px">${ar ? '🌬️' : '🚫🌬️'}</text>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `${nome}: ferrugem ${Math.round(fer * 100)}%`);
    $('leituras').innerHTML = leitura('Água', agua ? 'sim' : 'não') + leitura('Oxigênio', ar ? 'sim' : 'não') + leitura('Ferrugem', fer < .1 ? 'quase nada' : fer < .7 ? 'média' : 'muita');
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
  }
  $('tubos').innerHTML = Object.entries(TUBOS).map(([id, x]) => `<button type="button" data-t="${id}">${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { t = b.dataset.t; desenhar(); }));
  desenhar();

  // ---------- filminho: o navio e o zinco ----------
  const { ator, por } = aulasMM;
  const N = t2 => `<span class="au-numero au-pequeno">${t2}</span>`;
  const bloco = o => `<span style="display:block;width:26px;height:16px;border-radius:3px;background:#cfd6db;opacity:${o}"></span>`;
  const ROTEIROS = {
    navio: {
      montar(p) {
        return {
          mar: ator(p, '<span style="display:block;width:300px;height:50px;background:#2f7bd8;opacity:.3"></span>', 50, 80),
          nav: ator(p, '<span style="font-size:64px">🚢</span>', 50, 46),
          z: ator(p, bloco(1), 50, 74), t: ator(p, N('bloco de zinco'), 50, 92)
        };
      },
      passos: [
        [2400, 'O casco de aço do navio fica o tempo todo em água salgada: corrosão garantida.'],
        [3000, 'Prendem-se blocos de <b>zinco</b> no casco. O zinco oxida mais fácil que o ferro e é ele que se desgasta.', a => por(a.z, { html: bloco(.45) })],
        [3000, 'O casco fica protegido. De tempos em tempos, os blocos gastos são trocados: são <b>metais de sacrifício</b>.', a => por(a.z, { html: bloco(1) })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
