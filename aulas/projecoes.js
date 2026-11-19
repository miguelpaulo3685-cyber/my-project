aulasMM.aulas['projecoes'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const C = '#62a8ea', T = 'stroke="currentColor" stroke-width="2"';
  // Cada sólido: desenho em perspectiva e as três vistas (centro em 0,0; tamanho ~ 40)
  const SOLIDOS = {
    cubo: ['🧊 Cubo', `<path d="M-25 -5 h40 v40 h-40 z M-25 -5 l15 -15 h40 l-15 15 M15 35 l15 -15 v-40" fill="${C}" fill-opacity=".25" ${T}/>`,
      '<rect x="-20" y="-20" width="40" height="40"/>', '<rect x="-20" y="-20" width="40" height="40"/>', '<rect x="-20" y="-20" width="40" height="40"/>',
      'O cubo é igual em todas as vistas: três quadrados.'],
    cilindro: ['🥫 Cilindro', `<path d="M-22 -22 v44 a22 8 0 0 0 44 0 v-44" fill="${C}" fill-opacity=".25" ${T}/><ellipse cx="0" cy="-22" rx="22" ry="8" fill="${C}" fill-opacity=".35" ${T}/>`,
      '<rect x="-20" y="-25" width="40" height="50"/>', '<circle r="20"/>', '<rect x="-20" y="-25" width="40" height="50"/>',
      'Cilindro em pé: de frente e de lado, retângulos; de cima, um círculo.'],
    cone: ['🍦 Cone', `<path d="M-22 22 L0 -28 L22 22 a22 8 0 0 1 -44 0" fill="${C}" fill-opacity=".25" ${T}/>`,
      '<path d="M-20 22 L0 -26 L20 22 z"/>', '<circle r="20"/><circle r="2.5" fill="currentColor"/>', '<path d="M-20 22 L0 -26 L20 22 z"/>',
      'Cone: de frente e de lado, triângulos; de cima, um círculo com o vértice no centro.'],
    piramide: ['🔺 Pirâmide', `<path d="M-26 20 h34 l16 -12 M-26 20 L2 -30 L8 20 M2 -30 L24 8 M-26 20 l16 -12 h34" fill="${C}" fill-opacity=".2" ${T}/>`,
      '<path d="M-20 20 L0 -24 L20 20 z"/>', '<rect x="-20" y="-20" width="40" height="40"/><path d="M-20 -20 L20 20 M20 -20 L-20 20"/>', '<path d="M-20 20 L0 -24 L20 20 z"/>',
      'Pirâmide de base quadrada: de frente e de lado, triângulos; de cima, o quadrado da base com as quatro arestas indo ao centro (as diagonais).'],
    prisma: ['📐 Prisma triangular', `<path d="M-28 20 h36 l18 -14 h-36 z M-28 20 L-10 -24 L26 -24 L8 20 M-10 -24 L-10 6" fill="${C}" fill-opacity=".2" ${T}/>`,
      '<rect x="-24" y="-20" width="48" height="40"/>', '<rect x="-24" y="-16" width="48" height="32"/><line x1="-24" y1="0" x2="24" y2="0"/>', '<path d="M-20 20 L0 -20 L20 20 z"/>',
      'Prisma deitado (como um telhado): de frente, um retângulo; de cima, um retângulo dividido pela cumeeira; de lado, o triângulo da base.']
  };
  let sol = 'cone';
  $('solidos').innerHTML = Object.entries(SOLIDOS).map(([k, [n]]) => `<button type="button" data-sol="${k}">${n}</button>`).join('');
  function desenhar() {
    const [nome, perspectiva, frente, cima, lado, txt] = SOLIDOS[sol];
    const vista = (x, desenho, rot) => `<g transform="translate(${x} 112)" fill="none" ${T}>${desenho}</g><text x="${x}" y="164" text-anchor="middle">${rot}</text>`;
    $('graf').innerHTML = `<g transform="translate(160 40) scale(.8)">${perspectiva}</g>` + vista(60, frente, 'de frente') + vista(160, cima, 'de cima') + vista(260, lado, 'de lado');
    $('graf').setAttribute('aria-label', `${nome.split(' ').slice(1).join(' ')}: ${txt}`);
    raiz.querySelectorAll('[data-sol]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sol === sol)));
    $('recado').textContent = txt;
  }
  raiz.addEventListener('click', e => { const b = e.target.closest('[data-sol]'); if (b) { sol = b.dataset.sol; desenhar(); } });
  desenhar();

  // ---------- filminho: a sombra ao meio-dia ----------
  const { ator, por } = aulasMM;
  const ROTEIROS = {
    sombra: {
      montar(p) {
        return {
          sol: ator(p, '<span style="font-size:30px">☀️</span>', 12, 16),
          cone: ator(p, '<svg viewBox="-30 -35 60 70" style="width:70px;margin:0"><path d="M-22 22 L0 -28 L22 22 a22 8 0 0 1 -44 0" fill="#e9b949"/></svg>', 50, 50),
          sombra: ator(p, '<span style="display:block;width:110px;height:14px;border-radius:50%;background:rgba(0,0,0,.45)"></span>', 66, 76),
          t: por(ator(p, '<span class="au-numero au-pequeno">sol a pino: a sombra é a vista de cima</span>', 50, 92), { o: 0 })
        };
      },
      passos: [
        [2400, 'De manhã, o Sol baixo faz uma sombra comprida e torta.'],
        [3200, 'Ao meio-dia, com o Sol bem em cima, os raios chegam retos ao chão…', a => { a.sol.style.transition = 'left 1.5s, top 1.5s'; por(a.sol, { x: 50, y: 8 }); a.sombra.style.transition = 'all 1.5s'; por(a.sombra, { x: 50, html: '<span style="display:block;width:48px;height:14px;border-radius:50%;background:rgba(0,0,0,.45)"></span>' }); }],
        [3000, '…e a sombra do cone vira o <b>círculo</b> da base: é a projeção ortogonal, a mesma da vista de cima.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
