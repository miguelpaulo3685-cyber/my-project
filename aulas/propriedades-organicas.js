aulasMM.aulas['propriedades-organicas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // [nome, fórmula, ponto de ebulição (°C), força entre moléculas, mistura com água, explicação]
  const COMPS = [
    ['Metano', 'CH₄', -162, 'fraca (London)', 'não', 'Molécula pequena e apolar: as moléculas mal se atraem. É gás mesmo muito frio.'],
    ['Propano', 'C₃H₈', -42, 'fraca (London)', 'não', 'Maior que o metano, mas ainda apolar e pequeno: gás em temperatura ambiente. Está no gás de cozinha.'],
    ['Butano', 'C₄H₁₀', -0.5, 'fraca (London)', 'não', 'Um carbono a mais que o propano: ferve perto de 0 °C. Sob pressão, vira líquido dentro do botijão.'],
    ['Éter etílico', 'C₄H₁₀O', 35, 'dipolo (fraca)', 'pouco', 'Tem oxigênio, mas não tem H ligado a ele: não faz ligação de hidrogênio. Evapora na mão.'],
    ['Hexano', 'C₆H₁₄', 69, 'fraca (London)', 'não', 'Cadeia maior, mais contato entre as moléculas: já é líquido. Solvente de óleos.'],
    ['Etanol', 'C₂H₅OH', 78, 'ligação de hidrogênio', 'sim', 'Só 2 carbonos, mas o –OH faz ligações de hidrogênio: ferve a 78 °C e mistura com água em qualquer proporção.'],
    ['Água', 'H₂O', 100, 'ligação de hidrogênio', '—', 'Para comparar: molécula minúscula, mas cheia de ligações de hidrogênio. Por isso ferve tão alto.'],
    ['Ácido acético', 'CH₃COOH', 118, 'ligação de hidrogênio', 'sim', 'O –COOH faz ligações de hidrogênio ainda mais fortes (as moléculas se juntam aos pares).'],
    ['Octano', 'C₈H₁₈', 126, 'fraca (London)', 'não', 'Apolar, mas com 8 carbonos: tanto contato que ferve acima da água. É a referência da gasolina.']
  ];
  const X = t => 112 + (t + 170) / 300 * 196;
  let k = 5;
  function desenhar() {
    let s = `<line x1="${X(0)}" y1="4" x2="${X(0)}" y2="150" stroke="currentColor" stroke-dasharray="3 3" opacity=".5"/><text x="${X(0)}" y="164" text-anchor="middle">0 °C</text>
      <line x1="${X(25)}" y1="4" x2="${X(25)}" y2="150" stroke="var(--certo)" stroke-dasharray="3 3" opacity=".6"/><text x="${X(25) + 4}" y="164" style="fill:var(--certo)">25 °C</text>`;
    COMPS.forEach(([nome, , pe, forca], i) => {
      const y = 6 + i * 16, on = i === k, ligH = forca.startsWith('ligação');
      s += `<text x="4" y="${y + 10}" style="${on ? 'fill:var(--texto);font-weight:800' : ''}">${nome}</text>
        <rect x="${X(-170)}" y="${y}" width="${X(pe) - X(-170)}" height="12" rx="4" fill="${ligH ? '#6c8cff' : '#e9b949'}" opacity="${on ? 1 : .45}"/>
        ${on ? `<text x="${X(pe) + 4}" y="${y + 10}" style="fill:var(--texto);font-weight:800">${br(pe, pe % 1 ? 1 : 0)} °C</text>` : ''}`;
    });
    $('graf').innerHTML = s;
    const [nome, form, pe, forca, agua, txt] = COMPS[k];
    $('graf').setAttribute('aria-label', `${nome} ferve a ${pe} graus`);
    $('leituras').innerHTML = leitura('Ferve a', `${br(pe, pe % 1 ? 1 : 0)} °C`) + leitura('Atração', forca) + leitura('Mistura com água?', agua);
    $('recado').textContent = `${nome} (${form}): ${txt} ${pe < 25 ? 'Ferve abaixo de 25 °C: é gás no dia a dia.' : 'Ferve acima de 25 °C: é líquido no dia a dia.'} (Azul: faz ligação de hidrogênio; amarelo: não faz.)`;
    raiz.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.k) === k));
  }
  $('comps').innerHTML = COMPS.map(([nome], i) => `<button type="button" data-k="${i}">${nome}</button>`).join('');
  raiz.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { k = Number(b.dataset.k); desenhar(); }));
  desenhar();

  // ---------- filminho: o que mistura com água ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const copo = (camadas) => `<span style="display:flex;flex-direction:column;justify-content:flex-end;width:60px;height:86px;border:3px solid currentColor;border-top:none;border-radius:0 0 10px 10px;overflow:hidden">${camadas}</span>`;
  const cam = (h, c) => `<span style="display:block;height:${h}px;background:${c}"></span>`;
  const ROTEIROS = {
    mistura: {
      montar(p) {
        return {
          a: ator(p, copo(cam(30, '#2f7bd8')), 30, 44), b: ator(p, copo(cam(30, '#2f7bd8')), 70, 44),
          ta: ator(p, N('água + álcool'), 30, 84), tb: ator(p, N('água + gasolina'), 70, 84)
        };
      },
      passos: [
        [2400, 'Dois copos com água. Num vamos pôr álcool; no outro, gasolina.'],
        [3000, 'O álcool (polar, com –OH) se mistura: uma fase só. A gasolina (apolar) fica por cima: duas fases.', a => { por(a.a, { html: copo(cam(60, '#5d93d8')) }); por(a.b, { html: copo(cam(30, '#e9b949') + cam(30, '#2f7bd8')) }); }],
        [2800, '<b>Semelhante dissolve semelhante</b>: polar com polar, apolar com apolar.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
