aulasMM.aulas['unidades'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const SOBRE = { 1: '', 2: '²', 3: '³' };
  const TIPOS = {
    comprimento: { u: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], pot: 1, de: 0, para: 3 },
    area: { u: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], pot: 2, de: 3, para: 5 },
    volume: { u: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], pot: 3, de: 3, para: 4 },
    massa: { u: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'], pot: 1, de: 0, para: 3 }
  };
  let tipo = 'comprimento', escolhendo = 'de';
  const fmt = v => {
    if (v >= 1e10 || (v > 0 && v < 1e-6)) { const e = Math.floor(Math.log10(v)); return `${String(+(v / 10 ** e).toFixed(3)).replace('.', ',')} × 10${String(e).split('').map(c => c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')}`; }
    return v.toLocaleString('pt-BR', { maximumFractionDigits: 8 });
  };
  function escada() {
    const t = TIPOS[tipo], s = SOBRE[t.pot], fator = 10 ** t.pot, v = Number($('valor').value);
    const passos = t.para - t.de, res = v * fator ** passos;
    $('o-valor').textContent = `${v} ${t.u[t.de]}${s}`;
    $('escada').innerHTML = t.u.map((u, k) => {
      const noCaminho = (k > Math.min(t.de, t.para) && k <= Math.max(t.de, t.para));
      return `<button type="button" class="au-degrau${k === t.de ? ' au-de' : ''}${k === t.para ? ' au-para' : ''}${noCaminho ? ' au-caminho' : ''}" data-k="${k}" style="--k:${k}">
        ${noCaminho ? `<em>${passos > 0 ? '×' : '÷'} ${fator.toLocaleString('pt-BR')}</em>` : ''}<b>${u}${s}</b></button>`;
    }).join('');
    const litros = tipo === 'volume' ? (() => { const dm3 = v * 1000 ** (4 - t.de); return ` = ${fmt(dm3)} litros`; })() : '';
    $('conta').innerHTML = `${v} ${t.u[t.de]}${s} = <b>${fmt(res)} ${t.u[t.para]}${s}</b>${litros}`;
    $('recado').innerHTML = (passos === 0 ? 'Mesma unidade: nada muda.'
      : `${Math.abs(passos)} ${Math.abs(passos) === 1 ? 'degrau' : 'degraus'} para ${passos > 0 ? 'baixo: multiplique' : 'cima: divida'} por ${fator.toLocaleString('pt-BR')} em cada um${t.pot > 1 ? ` (em ${tipo === 'area' ? 'área' : 'volume'}, cada degrau vale ${fator.toLocaleString('pt-BR')}, não 10)` : ''}.`)
      + ` <small>Toque num degrau para escolher a unidade de ${escolhendo === 'de' ? 'saída (azul)' : 'chegada (amarelo)'}.</small>`;
    raiz.querySelectorAll('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo)));
  }
  $('escada').addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    TIPOS[tipo][escolhendo] = Number(b.dataset.k); escolhendo = escolhendo === 'de' ? 'para' : 'de'; escada();
  });
  raiz.querySelectorAll('[data-tipo]').forEach(b => b.addEventListener('click', () => { tipo = b.dataset.tipo; escolhendo = 'de'; escada(); }));
  $('valor').addEventListener('input', escada);
  escada();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    escada: {
      montar(p) {
        const us = ['km', 'hm', 'dam', 'm', 'dm', 'cm'];
        const a = { d: us.map((u, k) => ator(p, `<span class="au-degrau-filme">${u}</span>`, 10 + k * 16, 18 + k * 12)) };
        a.bola = ator(p, '<i class="au-ponto"></i>', 10, 8);
        a.v = ator(p, N('1 km', 'au-medio'), 72, 18);
        return a;
      },
      passos: (() => {
        const vals = ['1 km', '10 hm', '100 dam', '1 000 m', '10 000 dm', '100 000 cm'];
        return vals.slice(1).map((v, i) => [i === 2 ? 2600 : 1900, i === 2 ? 'Três degraus para baixo: <b>1 km = 1 000 m</b>.' : i === 4 ? 'Cinco degraus: <b>1 km = 100 000 cm</b>. Cada degrau para baixo é × 10.' : `Desce um degrau: × 10. <b>${v}</b>.`,
          a => { por(a.bola, { x: 10 + (i + 1) * 16, y: 8 + (i + 1) * 12 }); por(a.v, { html: N(v, 'au-medio' + (i >= 2 ? ' au-certo-txt' : '')) }); }]);
      })()
    },
    area: {
      montar(p) {
        const a = { q: ator(p, `<div class="au-grade-filme" style="grid-template-columns:repeat(10, var(--au-cel));--au-cel:12px;gap:1px">${'<b></b>'.repeat(100)}</div>`, 30, 50) };
        a.lado1 = ator(p, N('1 m = 10 dm', 'au-pequeno'), 32, 8);
        a.t = ator(p, N('1 m²', 'au-medio'), 76, 48);
        return a;
      },
      passos: [
        [2400, 'Um quadrado de <b>1 m por 1 m</b>: 1 m². Cada lado tem <b>10 dm</b>.'],
        [3000, 'Preenchendo com quadradinhos de 1 dm²: são <b>10 fileiras de 10</b>.', a => a.q.querySelectorAll('b').forEach((c, k) => setTimeout(() => { c.className = 'au-on'; }, Math.floor(k / 10) * 180))],
        [3000, '<b>1 m² = 100 dm²</b>. Em área, cada degrau vale <b>100</b>, não 10.', a => por(a.t, { html: N('= 100 dm²', 'au-medio au-certo-txt') })]
      ]
    },
    litro: {
      montar(p) {
        const a = { cubo: ator(p, '<span style="font-size:64px">📦</span>', 26, 48), t: ator(p, N('10 cm × 10 cm × 10 cm', 'au-pequeno'), 26, 88) };
        a.l = por(ator(p, N('= 1 dm³ = 1 litro', 'au-medio au-cor-d'), 70, 40), { o: 0 });
        a.m = por(ator(p, N('1 m³ = 1 000 L', 'au-medio au-certo-txt'), 70, 66), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Uma caixinha de <b>10 cm</b> de cada lado: 1 dm³.'],
        [2800, 'Cabe exatamente <b>1 litro</b> nela. <b>1 dm³ = 1 L</b>.', a => por(a.l, { o: 1 })],
        [3200, 'Um cubo de 1 m tem 10 × 10 × 10 = 1 000 dessas caixinhas: <b>1 m³ = 1 000 litros</b>.', a => por(a.m, { o: 1 })]
      ]
    },
    tempo: {
      montar(p) {
        const a = { h: ator(p, N('2,4 h', 'au-medio'), 50, 24), p1: por(ator(p, N('2 h', 'au-medio au-cor-d'), 30, 52), { o: 0 }), p2: por(ator(p, N('0,4 h', 'au-medio au-cor-u'), 70, 52), { o: 0 }) };
        a.t = ator(p, N('', 'au-medio'), 50, 84);
        return a;
      },
      passos: [
        [2400, 'Quanto é <b>2,4 horas</b>? Cuidado: não é 2 h 40 min.'],
        [2800, 'Separe: <b>2 horas</b> inteiras e <b>0,4 de hora</b>.', a => { por(a.p1, { o: 1 }); por(a.p2, { o: 1 }); }],
        [3000, 'A hora tem 60 minutos: 0,4 × 60 = <b>24 min</b>.', a => por(a.p2, { html: N('0,4 × 60 = 24 min', 'au-medio au-cor-u') })],
        [3000, 'Resultado: <b>2 h 24 min</b>.', a => por(a.t, { html: N('2,4 h = 2 h 24 min', 'au-medio au-certo-txt') })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
