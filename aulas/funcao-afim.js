aulasMM.aulas['funcao-afim'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(v) ? 0 : 2);
  function grafico() {
    const a = Number($('a').value), b = Number($('b').value);
    $('o-a').textContent = 'R$ ' + num(a); $('o-b').textContent = 'R$ ' + b;
    const X = v => 30 + v / 10 * 280, Y = v => 190 - v / 50 * 180;
    $('graf').innerHTML = `<line x1="30" y1="190" x2="312" y2="190" stroke="currentColor" opacity=".5"/><line x1="30" y1="190" x2="30" y2="6" stroke="currentColor" opacity=".5"/>
      ${[2, 4, 6, 8, 10].map(v => `<text x="${X(v)}" y="204" text-anchor="middle">${v} km</text>`).join('')}
      ${[10, 20, 30, 40, 50].map(v => `<text x="26" y="${Y(v) + 4}" text-anchor="end">${v}</text><line x1="30" y1="${Y(v)}" x2="312" y2="${Y(v)}" stroke="currentColor" opacity=".08"/>`).join('')}
      <line x1="${X(0)}" y1="${Y(b)}" x2="${X(10)}" y2="${Y(b + 10 * a)}" stroke="#62a8ea" stroke-width="3"/>
      <circle cx="${X(0)}" cy="${Y(b)}" r="6" fill="#e9b949"/><text x="${X(0) + 10}" y="${Y(b) - 8}" style="fill:#e9b949;font-weight:800">b = ${b}</text>
      <path d="M${X(4)} ${Y(b + 4 * a)} H${X(5)} V${Y(b + 5 * a)}" fill="none" stroke="var(--certo)" stroke-width="2.5"/>
      <text x="${X(5) + 6}" y="${(Y(b + 4 * a) + Y(b + 5 * a)) / 2 + 4}" style="fill:var(--certo);font-weight:800">+${num(a)}</text>`;
    $('lei').innerHTML = `f(x) = <span style="color:var(--certo)">${num(a)}</span>x + <span style="color:#e9b949">${b}</span>`;
    $('recado').textContent = `Uma corrida de 10 km custa ${num(a)} × 10 + ${b} = R$ ${num(a * 10 + b)}. O ${b} é a taxa fixa: onde a reta corta o eixo do preço. O ${num(a)} é o quanto o preço sobe a cada km: o degrau verde.`
      + (a === 0 ? ' Com a = 0, o preço não depende dos km: a reta fica deitada.' : '');
  }
  for (const id of ['a', 'b']) $(id).addEventListener('input', grafico);
  grafico();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    degrau: {
      montar(p) {
        const a = { g: ator(p, `<svg viewBox="0 0 300 170" style="width:min(300px,82vw);margin:0"><line x1="10" y1="160" x2="290" y2="160" stroke="currentColor" opacity=".4"/>
          <line x1="20" y1="140" x2="280" y2="20" stroke="#62a8ea" stroke-width="3"/>${[0, 1, 2, 3].map(k => `<path class="au-degrau-a" d="M${20 + k * 60} ${140 - k * 27.7} h60 v-27.7" fill="none" stroke="var(--certo)" stroke-width="3" opacity="0" style="transition:opacity .5s ${k * .4}s"/>`).join('')}</svg>`, 50, 46) };
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'A reta de f(x) = 2x + 5.'],
        [3200, 'Ande <b>1 para a direita</b>: a reta sobe sempre <b>2</b>. Esses degraus iguais são a marca da função afim.', a => { a.g.querySelectorAll('.au-degrau-a').forEach(d => { d.style.opacity = 1; }); por(a.t, { html: N('a = 2: sobe 2 a cada 1', 'au-pequeno au-certo-txt') }); }],
        [2600, 'Por isso o gráfico é uma <b>reta</b>: a taxa de subida nunca muda.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
