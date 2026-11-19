aulasMM.aulas['mol'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const cient = x => { let e = Math.floor(Math.log10(x)), m = Math.round(x / 10 ** e * 10) / 10; if (m >= 10) { m /= 10; e++; } return `${br(m, 1)} × 10${String(e).split('').map(c => SUP[c]).join('')}`; };
  // [nome, fórmula, massa molar, conta, emoji, partícula]
  const SUBS = {
    agua: ['Água', 'H₂O', 18, '2 × 1 + 16', '💧', 'moléculas'],
    sal: ['Sal', 'NaCl', 58.5, '23 + 35,5', '🧂', 'pares Na⁺Cl⁻'],
    co2: ['Gás carbônico', 'CO₂', 44, '12 + 2 × 16', '💨', 'moléculas'],
    ferro: ['Ferro', 'Fe', 56, 'só um átomo: 56', '🔩', 'átomos'],
    acucar: ['Açúcar', 'C₁₂H₂₂O₁₁', 342, '12 × 12 + 22 × 1 + 11 × 16', '🍬', 'moléculas']
  };
  let s = 'agua';
  function desenhar() {
    const [nome, form, M, conta, em, part] = SUBS[s], m = Number($('m').value), n = m / M;
    $('mo').textContent = `${m} g`;
    let g = `<text x="160" y="18" text-anchor="middle" style="fill:var(--texto);font-weight:800;font-size:13px">${em} ${form}: ${conta} = ${br(M, 1)} g/mol</text>
      <rect x="20" y="44" width="280" height="24" rx="6" fill="currentColor" opacity=".1"/>
      <rect x="20" y="44" width="${m / 360 * 280}" height="24" rx="6" fill="#e9b949"/>`;
    const passo = M / 360 * 280;
    for (let k = 1; k * M <= 360; k++) {
      const x = 20 + k * passo;
      g += `<line x1="${x}" y1="40" x2="${x}" y2="72" stroke="var(--texto)" stroke-width="1.5" opacity=".7"/>`;
      if (passo >= 34 || k === 1 || (passo >= 14 && k % 5 === 0)) g += `<text x="${x}" y="86" text-anchor="middle">${k} mol</text>`;
    }
    g += `<text x="20" y="104">0 g</text><text x="300" y="104" text-anchor="end">360 g</text><text x="20" y="36">cada risco = 1 mol = ${br(M, 1)} g</text>`;
    $('graf').innerHTML = g;
    $('graf').setAttribute('aria-label', `${m} gramas de ${nome.toLowerCase()} são ${br(n, 2)} mol`);
    $('eq').innerHTML = `n = <span>${m} g</span> ÷ <span>${br(M, 1)} g/mol</span> = <span>${br(n, 2)} mol</span>`;
    $('leituras').innerHTML = leitura('Massa molar', `${br(M, 1)} g/mol`) + leitura('Quantidade', `${br(n, 2)} mol`) + leitura('Partículas', cient(n * 6.0e23));
    $('recado').textContent = `${m} g de ${nome.toLowerCase()} (${form}) têm ${br(n, 2)} mol, ou cerca de ${cient(n * 6.0e23)} ${part}. Cada mol pesa ${br(M, 1)} g.`;
    raiz.querySelectorAll('[data-s]').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === s));
  }
  $('subs').innerHTML = Object.entries(SUBS).map(([id, x]) => `<button type="button" data-s="${id}">${x[4]} ${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { s = b.dataset.s; desenhar(); }));
  $('m').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: a dúzia do químico ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero">${t}</span>`;
  const ROTEIROS = {
    duzia: {
      montar(p) {
        return {
          a: ator(p, '<span style="font-size:30px">🥚🥚🥚🥚🥚🥚<br>🥚🥚🥚🥚🥚🥚</span>', 50, 36), t: ator(p, N('1 dúzia = 12'), 50, 80)
        };
      },
      passos: [
        [2400, 'Uma <b>dúzia</b> é um pacote de 12, seja de ovos ou de laranjas.'],
        [2600, 'Uma <b>resma</b> é um pacote de 500 folhas de papel.', a => { por(a.a, { html: '<span style="font-size:44px">📄📄📄</span>' }); por(a.t, { html: N('1 resma = 500') }); }],
        [3400, 'Um <b>mol</b> é um pacote de 602 sextilhões de partículas. Átomos são tão pequenos que só um pacote gigante dá uma massa que se pesa.', a => { por(a.a, { html: '<span style="font-size:44px">⚛️⚛️⚛️</span>' }); por(a.t, { html: N('1 mol = 6,0 × 10²³') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
