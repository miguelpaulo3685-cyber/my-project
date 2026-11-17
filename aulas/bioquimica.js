aulasMM.aulas['bioquimica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // [emoji, nome, carboidratos g, proteínas g, lipídios g, destaque] por porção (valores aproximados)
  const AL = [
    ['🍚', 'Arroz', 28, 3, 0, 'amido'], ['🫘', 'Feijão', 14, 5, 0, 'proteína vegetal e ferro'], ['🍗', 'Frango', 0, 27, 4, 'proteína animal'],
    ['🥚', 'Ovo', 1, 6, 5, 'proteína completa'], ['🥑', 'Abacate', 9, 2, 15, 'gordura boa'], ['🍞', 'Pão', 25, 4, 2, 'amido'],
    ['🧈', 'Manteiga', 0, 0, 16, 'gordura'], ['🍌', 'Banana', 23, 1, 0, 'açúcares e potássio']
  ];
  const prato = new Set([0, 1, 2]);
  $('alimentos').innerHTML = AL.map(([e, n], k) => `<button type="button" data-k="${k}"><span>${e}</span>${n}</button>`).join('');
  function desenhar() {
    $('alimentos').querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(prato.has(Number(b.dataset.k)))));
    let c = 0, p = 0, l = 0;
    prato.forEach(k => { c += AL[k][2]; p += AL[k][3]; l += AL[k][4]; });
    const kc = c * 4, kp = p * 4, kl = l * 9, tot = kc + kp + kl || 1;
    $('barra').innerHTML = `<i style="width:${kc / tot * 100}%;background:#e9b949">${kc / tot > .12 ? Math.round(kc / tot * 100) + '%' : ''}</i><i style="width:${kp / tot * 100}%;background:#c96b4b">${kp / tot > .12 ? Math.round(kp / tot * 100) + '%' : ''}</i><i style="width:${kl / tot * 100}%;background:#8a55c9">${kl / tot > .12 ? Math.round(kl / tot * 100) + '%' : ''}</i>`;
    $('barra').setAttribute('aria-label', `Energia do prato: ${Math.round(kc / tot * 100)}% carboidratos, ${Math.round(kp / tot * 100)}% proteínas, ${Math.round(kl / tot * 100)}% lipídios`);
    const itens = [...prato].map(k => `${AL[k][1].toLowerCase()} (${AL[k][5]})`);
    $('recado').textContent = !prato.size ? 'Prato vazio. Toque nos alimentos.'
      : `Seu prato: ${itens.join(', ')}. Cerca de ${Math.round(kc + kp + kl)} kcal. Cada grama de carboidrato ou proteína dá ~4 kcal; cada grama de gordura dá ~9 kcal, mais que o dobro.`
        + (prato.has(0) && prato.has(1) ? ' Arroz com feijão juntos completam os aminoácidos essenciais.' : '');
  }
  $('alimentos').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = Number(b.dataset.k); prato.has(k) ? prato.delete(k) : prato.add(k); desenhar(); });
  desenhar();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const CORES = ['#e05252', '#62a8ea', '#e9b949', '#2f9e6a', '#8a55c9', '#c96b4b', '#4fb3bf', '#e080b0'];
  const ROTEIROS = {
    proteina: {
      montar(p) {
        const a = { aa: CORES.map((c, k) => ator(p, `<i class="au-aa" style="background:${c}"></i>`, 10 + (k * 37) % 80, 20 + (k * 23) % 50)) };
        a.t = ator(p, N('aminoácidos soltos', 'au-pequeno'), 50, 90);
        return a;
      },
      passos: [
        [2400, 'Existem 20 tipos de <b>aminoácidos</b>, como peças de montar de cores diferentes.'],
        [2800, 'A célula liga os aminoácidos <b>em fila</b>, numa ordem certa ditada pelo DNA.', a => { a.aa.forEach((x, k) => por(x, { x: 15 + k * 10, y: 48, atraso: k * 120 })); por(a.t, { html: N('uma corrente de aminoácidos', 'au-pequeno') }); }],
        [3200, 'A corrente <b>se dobra</b> num formato próprio: é a <b>proteína</b>. O formato decide a função.', a => {
          const xy = [[38, 30], [50, 24], [62, 30], [66, 46], [60, 62], [48, 66], [38, 58], [46, 44]];
          a.aa.forEach((x, k) => por(x, { x: xy[k][0], y: xy[k][1], atraso: k * 80 })); por(a.t, { html: N('proteína = aminoácidos dobrados', 'au-pequeno au-certo-txt') });
        }]
      ]
    },
    enzima: {
      montar(p) {
        const a = { enz: ator(p, '<span class="au-enzima"></span>', 40, 50), sub: ator(p, '<span class="au-substrato"></span>', 84, 30) };
        a.term = ator(p, N('🌡️ 37 °C', 'au-pequeno'), 14, 12);
        a.t = ator(p, N('', 'au-pequeno'), 50, 90);
        return a;
      },
      passos: [
        [2400, 'A <b>enzima</b> (azul) tem um encaixe com o formato exato do seu alvo, o <b>substrato</b> (amarelo).'],
        [2800, 'O substrato encaixa, a reação acontece rápido, e a enzima fica livre para o próximo.', a => { por(a.sub, { x: 40, y: 40 }); por(a.t, { html: N('chave e fechadura', 'au-pequeno au-certo-txt') }); }],
        [3200, 'Com calor demais, a enzima <b>perde o formato</b> (desnatura): o substrato não encaixa mais.', a => {
          por(a.sub, { x: 84, y: 30 }); a.enz.firstChild.classList.add('au-desnaturada'); por(a.term, { html: N('🌡️ 60 °C', 'au-pequeno au-errado-txt') }); por(a.t, { html: N('desnaturação: a reação para', 'au-pequeno au-errado-txt') });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
