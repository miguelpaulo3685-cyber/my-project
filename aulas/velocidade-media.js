aulasMM.aulas['velocidade-media'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(Math.round(v * 10) / 10) ? 0 : 1);
  const horas = h => { const t = Math.round(h * 60); return `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')} min`; };
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  function desenhar() {
    const v1 = Number($('v1').value), v2 = Number($('v2').value);
    $('o1').textContent = v1 + ' km/h'; $('o2').textContent = v2 + ' km/h';
    const t1 = 60 / v1, t2 = 60 / v2, t = t1 + t2, vm = 120 / t, simples = (v1 + v2) / 2;
    // Barra do caminho (igual para os dois trechos) e barra do tempo (cada trecho do seu tamanho)
    const L = 280, x0 = 20, tmax = 6;
    $('graf').innerHTML = `<text x="${x0}" y="16">caminho</text>
      <rect x="${x0}" y="22" width="${L / 2}" height="18" rx="4" fill="#62a8ea"/><rect x="${x0 + L / 2}" y="22" width="${L / 2}" height="18" rx="4" fill="#e9b949"/>
      <text x="${x0 + L / 4}" y="35" text-anchor="middle" style="fill:#10130f;font-weight:700">60 km</text><text x="${x0 + 3 * L / 4}" y="35" text-anchor="middle" style="fill:#10130f;font-weight:700">60 km</text>
      <text x="${x0}" y="66">tempo</text>
      <rect x="${x0}" y="72" width="${L * t1 / tmax}" height="18" rx="4" fill="#62a8ea"/><rect x="${x0 + L * t1 / tmax}" y="72" width="${L * t2 / tmax}" height="18" rx="4" fill="#e9b949"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(h => `<text x="${x0 + L * h / tmax}" y="108" text-anchor="middle">${h} h</text>`).join('')}`;
    $('graf').setAttribute('aria-label', `Os dois trechos têm 60 km, mas o primeiro leva ${horas(t1)} e o segundo ${horas(t2)}`);
    $('leituras').innerHTML = leitura('Tempo total', horas(t)) + leitura('Velocidade média', num(vm) + ' km/h') + leitura('Média das velocidades', num(simples) + ' km/h');
    $('recado').textContent = v1 === v2
      ? `Com a mesma velocidade nos dois trechos, a média é ${v1} km/h, sem mistério.`
      : `Os trechos têm o mesmo tamanho, mas o de ${Math.min(v1, v2)} km/h demora mais (veja a barra do tempo) e puxa a média para baixo: ${num(vm)} km/h, e não ${num(simples)} km/h. Distância total ÷ tempo total = 120 ÷ ${br(t, 2)}.`;
  }
  $('v1').addEventListener('input', desenhar); $('v2').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: km/h para m/s ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    unidades: {
      montar(p) {
        return {
          kmh: ator(p, N('72 km/h'), 50, 24),
          passo1: por(ator(p, N('72 000 m em 3 600 s', 'au-medio'), 50, 50), { o: 0 }),
          ms: por(ator(p, N('20 m/s'), 50, 78), { o: 0 }),
          dica: por(ator(p, N('÷ 3,6', 'au-pequeno au-certo-txt'), 82, 50), { o: 0 })
        };
      },
      passos: [
        [2400, 'O carro anda a <b>72 km/h</b>: 72 km em 1 hora.'],
        [3000, '72 km são <b>72 000 m</b>; 1 hora são <b>3 600 s</b>.', a => por(a.passo1, { o: 1 })],
        [3000, '72 000 ÷ 3 600 = <b>20 m/s</b>. Atalho: dividir por <b>3,6</b>.', a => { por(a.ms, { o: 1 }); por(a.dica, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
