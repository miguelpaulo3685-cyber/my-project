aulasMM.aulas['consumo-energia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const TARIFA = 0.8; // R$ por kWh (exemplo)
  // [nome, potência W, horas por dia, máximo de horas, passo]
  const APARELHOS = [
    ['🚿 Chuveiro', 5500, 0.5, 3, 0.25], ['🧊 Geladeira (média)', 150, 24, 24, 1], ['❄️ Ar-condicionado', 1500, 2, 12, 1],
    ['📺 TV', 100, 5, 12, 1], ['💡 6 lâmpadas LED', 54, 6, 12, 1], ['👕 Ferro de passar', 1000, 0.25, 2, 0.25]
  ];
  $('lista').innerHTML = APARELHOS.map(([n, p, h, max, passo], k) => `<div class="au-controle"><label for="au-h${k}">${n}<br><small>${p} W</small></label>
    <input id="au-h${k}" type="range" min="0" max="${max}" step="${passo}" value="${h}"><output id="au-o${k}"></output></div>`).join('');
  function desenhar() {
    let total = 0, maior = null;
    const mes = APARELHOS.map(([n, p], k) => {
      const h = Number($('h' + k).value), kwh = p / 1000 * h * 30;
      $('o' + k).textContent = (h < 1 && h > 0 ? br(h * 60, 0) + ' min' : br(h, 0) + ' h') + '/dia';
      total += kwh; if (!maior || kwh > maior[1]) maior = [n, kwh];
      return kwh;
    });
    $('leituras').innerHTML = leitura('Consumo no mês', br(total, 0) + ' kWh') + leitura('Conta (R$ 0,80/kWh)', 'R$ ' + br(total * TARIFA, 2)) + leitura('Por dia', 'R$ ' + br(total * TARIFA / 30, 2));
    $('recado').textContent = `${maior[0].split(' ').slice(1).join(' ')} é o que mais pesa: ${br(maior[1], 0)} kWh por mês (R$ ${br(maior[1] * TARIFA, 2)}). Conta: potência em kW × horas por dia × 30 dias. ${mes[0] > 50 ? 'Diminuir 10 minutos do banho por dia economiza uns ' + br(5.5 / 6 * 30, 0) + ' kWh no mês.' : ''}`;
  }
  APARELHOS.forEach((_, k) => $('h' + k).addEventListener('input', desenhar));
  desenhar();

  // ---------- filminho: a conta ----------
  const { ator, por } = aulasMM;
  const N = (t, c = '') => `<span class="au-numero ${c}">${t}</span>`;
  const ROTEIROS = {
    conta: {
      montar(p) {
        return {
          p: ator(p, N('5,5 kW', 'au-medio'), 20, 40), x1: ator(p, N('×', 'au-medio'), 34, 40), h: ator(p, N('10 h', 'au-medio'), 46, 40),
          r: por(ator(p, N('= 55 kWh', 'au-medio'), 72, 40), { o: 0 }), d: por(ator(p, N('× R$ 0,80 = R$ 44,00', 'au-medio'), 60, 72), { o: 0 }),
          t1: ator(p, N('chuveiro', 'au-pequeno'), 20, 58), t2: ator(p, N('20 min × 30 dias', 'au-pequeno'), 46, 58)
        };
      },
      passos: [
        [2600, 'Chuveiro de 5 500 W = <b>5,5 kW</b>, ligado 20 min por dia: em 30 dias, <b>10 horas</b>.'],
        [2600, 'Potência × tempo: 5,5 × 10 = <b>55 kWh</b> no mês.', a => por(a.r, { o: 1 })],
        [3000, 'Vezes a tarifa: <b>R$ 44,00</b> só de banho. Na conta, o que se paga é a <b>energia</b> (kWh).', a => por(a.d, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
