aulasMM.aulas['atrito'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br, rad = g => g * Math.PI / 180;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const M = 10, G = 10, P = M * G; // caixa de 10 kg: peso de 100 N
  let mi = 0.4;
  const seta = (x, y, dx, dy, cor, txt) => {
    const L = Math.hypot(dx, dy); if (L < 2) return '';
    const ux = dx / L, uy = dy / L;
    return `<line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}" stroke="${cor}" stroke-width="3"/>
      <path d="M${x + dx} ${y + dy} l${-8 * ux + 5 * uy} ${-8 * uy - 5 * ux} l${-10 * uy} ${10 * ux} z" fill="${cor}"/>
      <text x="${x + dx + 10 * ux}" y="${y + dy + 10 * uy + 4}" text-anchor="middle" style="fill:${cor};font-weight:800">${txt}</text>`;
  };
  function desenhar() {
    const ang = Number($('ang').value), t = rad(ang);
    $('o').textContent = ang + '°';
    const empurra = P * Math.sin(t), normal = P * Math.cos(t), segura = mi * normal;
    const escorrega = empurra > segura + 1e-9;
    const a = escorrega ? G * (Math.sin(t) - mi * Math.cos(t)) : 0;
    // Rampa: base em (20,180), sobe para a direita com o ângulo
    const L = Math.min(270, 165 / Math.max(Math.sin(t), 0.01)), xb = 20, yb = 180, xt = xb + L * Math.cos(t), yt = yb - L * Math.sin(t);
    const d = L * 0.6, cx = xb + d * Math.cos(t), cy = yb - d * Math.sin(t); // centro da base da caixa
    const lado = 34, nx = -Math.sin(t), ny = -Math.cos(t); // normal para fora da rampa (no SVG)
    const ux = Math.cos(t), uy = -Math.sin(t); // ao longo da rampa, subindo
    const canto = (s, h) => `${cx + ux * s + nx * h},${cy + uy * s + ny * h}`;
    const centro = [cx + nx * lado / 2, cy + ny * lado / 2];
    const k = 0.55; // px por newton
    $('graf').innerHTML = `<polygon points="${xb},${yb} ${xt},${yb} ${xt},${yt}" fill="color-mix(in srgb, currentColor 12%, transparent)" stroke="currentColor" stroke-width="2"/>
      <text x="${xb + 34}" y="${yb - 6}">${ang}°</text>
      <polygon points="${canto(-lado / 2, 0)} ${canto(lado / 2, 0)} ${canto(lado / 2, lado)} ${canto(-lado / 2, lado)}" fill="${escorrega ? 'var(--errado)' : '#62a8ea'}"/>
      ${seta(centro[0], centro[1], -ux * empurra * k, -uy * empurra * k, '#e9b949', '')}
      ${seta(centro[0], centro[1], ux * Math.min(segura, empurra) * k, uy * Math.min(segura, empurra) * k, 'var(--certo)', '')}`;
    $('graf').setAttribute('aria-label', `Caixa numa rampa de ${ang} graus: ${escorrega ? 'escorrega' : 'fica parada'}`);
    $('leituras').innerHTML = leitura('Empurra rampa abaixo', br(empurra, 0) + ' N') + leitura('Atrito segura até', br(segura, 0) + ' N') +
      leitura(escorrega ? 'Escorrega com' : 'Situação', escorrega ? br(a, 1) + ' m/s²' : 'parada');
    const limite = Math.atan(mi) * 180 / Math.PI;
    $('recado').textContent = escorrega
      ? `A parte do peso que empurra (amarelo, ${br(empurra, 0)} N) passou do atrito máximo (${br(segura, 0)} N): a caixa escorrega. Nesta superfície, ela começa a escorregar a partir de ${br(limite, 0)}°.`
      : `O atrito (verde) segura a caixa: ele se ajusta à força que empurra, até o limite de ${br(segura, 0)} N. Incline mais: a partir de ${br(limite, 0)}° ela escorrega.`;
  }
  raiz.querySelectorAll('[data-mi]').forEach(b => b.addEventListener('click', () => {
    mi = Number(b.dataset.mi);
    raiz.querySelectorAll('[data-mi]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    desenhar();
  }));
  raiz.querySelector('[data-mi="0.4"]').setAttribute('aria-pressed', 'true');
  $('ang').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: atrito estático ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    estatico: {
      montar(p) {
        const a = {
          chao: ator(p, '<span style="display:block;width:min(300px,80vw);height:4px;background:currentColor;opacity:.5"></span>', 50, 72),
          armario: ator(p, '<span style="display:block;width:46px;height:70px;border-radius:4px;background:#b98a52"></span>', 50, 50),
          pessoa: ator(p, '<span style="font-size:30px">🧍</span>', 36, 56),
          forca: ator(p, N('empurra: 30 N'), 26, 22), atrito: ator(p, N('atrito: 30 N'), 74, 22)
        };
        a.armario.style.transition = a.pessoa.style.transition = 'left 1.4s ease-in';
        return a;
      },
      passos: [
        [2600, 'Empurrando com 30 N, o atrito faz 30 N para trás: o armário <b>não sai do lugar</b>.'],
        [2600, 'Com 60 N, o atrito também faz 60 N. O atrito estático <b>acompanha</b> a força…', a => { por(a.forca, { html: N('empurra: 60 N') }); por(a.atrito, { html: N('atrito: 60 N') }); }],
        [3000, '…até o limite (μ · N = 80 N). Passou disso, o armário <b>começa a andar</b>, e o atrito cai para o dinâmico.', a => {
          por(a.forca, { html: N('empurra: 90 N') }); por(a.atrito, { html: N('atrito: 70 N (dinâmico)') }); por(a.armario, { x: 66 }); por(a.pessoa, { x: 52 });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
