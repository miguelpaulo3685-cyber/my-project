aulasMM.aulas['ists'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, causador, cura, vacina?, teste rápido?, texto]
  const ISTS = {
    hiv: ['HIV', 'vírus', 'não; o tratamento controla', false, true, 'Passa por relação sem camisinha, sangue (seringas) e da mãe para o bebê. O tratamento é gratuito; com carga viral indetectável, a pessoa não transmite o HIV por via sexual. O SUS também oferece a PrEP e a PEP, remédios que previnem a infecção.'],
    hpv: ['HPV', 'vírus', 'em geral o corpo elimina', true, false, 'Muito comum. Pode causar verrugas e é a principal causa do câncer do colo do útero. A vacina é gratuita para meninas e meninos de 9 a 14 anos, e o exame preventivo descobre lesões cedo.'],
    sifilis: ['Sífilis', 'bactéria', 'sim, com penicilina', false, true, 'Começa com uma ferida que não dói e some sozinha, mas a infecção continua. Tem cura com penicilina. Na gravidez pode passar ao bebê: por isso o teste é feito no pré-natal.'],
    gono: ['Gonorreia e clamídia', 'bactérias', 'sim, com antibiótico', false, false, 'Muitas vezes não dão sintoma, principalmente em mulheres. Sem tratamento, podem causar infertilidade. Têm cura com antibiótico receitado pelo médico.'],
    hepb: ['Hepatite B', 'vírus', 'na maioria passa; há tratamento', true, true, 'Ataca o fígado. Passa por relação sem camisinha, sangue e da mãe para o bebê. A vacina é gratuita para todas as idades.'],
    herpes: ['Herpes genital', 'vírus', 'não; remédios controlam as crises', false, false, 'O vírus fica "adormecido" no corpo e pode voltar em crises com pequenas bolhas. Remédios diminuem as crises. Camisinha reduz o risco.']
  };
  let ist = 'hiv';
  function desenhar() {
    const [nome, causa, cura, vacina, teste, txt] = ISTS[ist];
    const temCura = cura.startsWith('sim');
    const tile = (x, em, rot, ok, val = ok ? 'sim' : 'não') => `<rect x="${x}" y="6" width="72" height="84" rx="12" fill="${ok ? 'var(--certo)' : 'currentColor'}" opacity="${ok ? .22 : .07}"/>
      <text x="${x + 36}" y="42" text-anchor="middle" style="font-size:26px;opacity:${ok ? 1 : .35}">${em}</text>
      <text x="${x + 36}" y="64" text-anchor="middle" style="${ok ? 'fill:var(--texto);font-weight:700' : ''}">${rot}</text>
      <text x="${x + 36}" y="80" text-anchor="middle" style="font-weight:800;fill:${ok ? 'var(--certo)' : 'var(--texto-fraco)'}">${val}</text>`;
    $('graf').innerHTML = tile(4, '🛡️', 'camisinha', true, 'reduz o risco') + tile(83, '💉', 'vacina', vacina) + tile(162, '🧪', 'teste rápido', teste) + tile(241, '💊', 'cura', temCura);
    $('graf').setAttribute('aria-label', `${nome}: camisinha protege; vacina ${vacina ? 'existe' : 'não existe'}; teste rápido ${teste ? 'existe' : 'não'}; cura ${temCura ? 'sim' : 'não'}`);
    $('leituras').innerHTML = leitura('Causador', causa) + leitura('Tem cura?', cura) + leitura('Vacina', vacina ? 'sim, no SUS' : 'não existe');
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-ist]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ist === ist));
  }
  $('ists').innerHTML = Object.entries(ISTS).map(([id, i]) => `<button type="button" data-ist="${id}">${i[0]}</button>`).join('');
  raiz.querySelectorAll('[data-ist]').forEach(b => b.addEventListener('click', () => { ist = b.dataset.ist; desenhar(); }));
  desenhar();

  // ---------- filminho: o HIV e o tratamento ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const CEL = '<span style="display:block;width:30px;height:30px;border-radius:50%;background:#b06ab3"></span>';
  const ROTEIROS = {
    hiv: {
      montar(p) {
        const a = { t: ator(p, N('linfócitos T CD4: os coordenadores da defesa'), 50, 88) };
        a.c = [0, 1, 2, 3, 4, 5].map(k => ator(p, CEL, 18 + k * 13, 40));
        a.v = [0, 1, 2].map(k => por(ator(p, '<span style="font-size:18px">🦠</span>', 26 + k * 24, 18), { o: 0 }));
        return a;
      },
      passos: [
        [2400, 'O HIV infecta os <b>linfócitos T CD4</b>, que comandam a defesa do corpo.', a => a.v.forEach(v => por(v, { o: 1 }))],
        [3000, 'Sem tratamento, ao longo dos anos os CD4 vão sumindo. Com a defesa baixa, aparecem outras doenças: essa fase é a <b>aids</b>.', a => a.c.forEach((c, k) => { if (k % 3) por(c, { o: .12 }); })],
        [3400, 'Com o tratamento, gratuito no SUS, o vírus fica controlado e os CD4 voltam. A pessoa vive bem e, com o vírus indetectável, não transmite por via sexual.', a => { a.c.forEach(c => por(c, { o: 1 })); a.v.forEach(v => por(v, { o: .15 })); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
