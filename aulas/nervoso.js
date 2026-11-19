aulasMM.aulas['nervoso'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  let susto = false;
  function desenhar() {
    const item = (x, rot, val, desenho) => `${desenho}<text x="${x}" y="104" text-anchor="middle">${rot}</text>
      <text x="${x}" y="122" text-anchor="middle" style="fill:var(--texto);font-weight:800;font-size:13px">${val}</text>`;
    $('graf').innerHTML =
      item(40, 'pupila', susto ? 'dilatada' : 'menor', `<ellipse cx="40" cy="56" rx="30" ry="16" fill="#f4f1ea"/><circle cx="40" cy="56" r="13" fill="#6b8e5a"/>
        <circle cx="40" cy="56" r="${susto ? 10 : 4}" fill="#10130f" style="transition:r .4s"/>`) +
      item(120, 'coração', susto ? '120 bpm' : '65 bpm', `<text x="120" y="70" text-anchor="middle" style="font-size:${susto ? 40 : 32}px">🫀</text>`) +
      item(200, 'brônquios', susto ? 'bem abertos' : 'normais', `<text x="200" y="70" text-anchor="middle" style="font-size:${susto ? 40 : 32}px">🫁</text>`) +
      item(280, 'digestão', susto ? 'parada' : 'funcionando', `<text x="280" y="70" text-anchor="middle" style="font-size:32px;opacity:${susto ? .35 : 1}">🍽️</text>`);
    $('graf').setAttribute('aria-label', susto ? 'No susto: pupila dilatada, coração a 120 batimentos, brônquios abertos, digestão parada' : 'No descanso: pupila menor, coração a 65 batimentos, digestão funcionando');
    $('leituras').innerHTML = leitura('Quem manda', susto ? 'simpático' : 'parassimpático') + leitura('Mensageiro', susto ? 'noradrenalina e adrenalina' : 'acetilcolina') + leitura('Glicose', susto ? 'sobe (energia)' : 'normal');
    $('recado').textContent = susto
      ? 'O susto ativa o simpático e as glândulas suprarrenais soltam adrenalina: o corpo se prepara para lutar ou fugir. Mais sangue e oxigênio para os músculos, pupila aberta para ver melhor e a digestão fica para depois.'
      : 'Em repouso, o parassimpático assume: coração mais lento, pupila menor e a digestão funcionando. É o modo "descansar e digerir".';
    $('susto').setAttribute('aria-pressed', susto); $('calma').setAttribute('aria-pressed', !susto);
  }
  $('susto').addEventListener('click', () => { susto = true; desenhar(); });
  $('calma').addEventListener('click', () => { susto = false; desenhar(); });
  desenhar();

  // ---------- filminho: o arco reflexo ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    reflexo: {
      montar(p) {
        return {
          pan: ator(p, '<span style="font-size:34px">🍳</span>', 14, 34), fogo: ator(p, '<span style="font-size:20px">🔥</span>', 14, 52),
          mao: ator(p, '<span style="font-size:34px">✋</span>', 30, 30),
          med: ator(p, '<span style="display:block;width:16px;height:64px;border-radius:8px;background:#e9b949"></span>', 78, 56), tm: ator(p, N('medula'), 78, 86),
          sinal: por(ator(p, '<span style="display:block;width:14px;height:14px;border-radius:50%;background:var(--marca);box-shadow:0 0 10px var(--marca)"></span>', 30, 30), { o: 0 }),
          cer: por(ator(p, '<span style="font-size:30px">🧠</span>', 78, 12), { o: 0 }), dor: por(ator(p, N('ai!'), 92, 12), { o: 0 })
        };
      },
      passos: [
        [2400, 'A mão encosta na panela quente. Os receptores da pele sentem o calor.', a => por(a.sinal, { o: 1 })],
        [2600, 'O <b>neurônio sensitivo</b> leva o impulso até a medula espinal.', a => por(a.sinal, { x: 76, y: 50 })],
        [3000, 'A medula já passa o sinal ao <b>neurônio motor</b>, e o músculo puxa a mão. É o reflexo: o cérebro nem participou.', a => { por(a.sinal, { x: 40, y: 64 }); por(a.mao, { x: 44, y: 62 }); }],
        [2800, 'Só depois a mensagem sobe até o cérebro, e aí você <b>sente a dor</b>.', a => { por(a.sinal, { x: 78, y: 26 }); por(a.cer, { o: 1 }); por(a.dor, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
