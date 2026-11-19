aulasMM.aulas['reacoes-organicas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const D = t => `<tspan style="fill:#e9b949">${t}</tspan>`;
  // [rótulo, reagentes, condição, produtos, o que acontece, onde se usa, explicação]
  const TIPOS = {
    subst: ['Substituição', `CH₄ + ${D('Cl₂')}`, 'luz', `CH₃${D('Cl')} + HCl`, 'um H sai, um Cl entra', 'solventes, PVC', 'Num alcano, a luz quebra o Cl₂ e um átomo de cloro toma o lugar de um hidrogênio. O H que saiu forma HCl.'],
    adicao: ['Adição', `CH₂=CH₂ + ${D('H₂')}`, 'catalisador', `CH₂${D('H')}–CH₂${D('H')}`, 'a dupla abre e recebe átomos', 'margarina, etanol industrial', 'A ligação dupla do eteno "abre" e cada carbono recebe um H. Com água no lugar de H₂, sai etanol.'],
    elim: ['Eliminação', 'CH₃–CH₂OH', 'ácido e calor', `CH₂=CH₂ + ${D('H₂O')}`, 'sai água, forma dupla', 'produção de eteno', 'O etanol perde um H e um OH (que formam água) e ganha uma ligação dupla: vira eteno. É o caminho inverso da adição de água.'],
    ester: ['Esterificação', 'ácido + álcool', 'ácido', `${D('éster')} + água`, 'ácido e álcool se juntam', 'aromas, perfumes', 'Ex.: ácido acético + etanol → acetato de etila + água. Ésteres dão cheiro de frutas a balas e sucos artificiais.'],
    sabao: ['Saponificação', 'gordura + NaOH', 'calor', `${D('sabão')} + glicerol`, 'a base quebra a gordura', 'fabricação de sabão', 'A gordura é um éster. A base forte quebra esse éster e forma sal de ácido graxo (o sabão) e glicerol (a glicerina).'],
    comb: ['Combustão', 'C₂H₅OH + 3 O₂', 'faísca', '2 CO₂ + 3 H₂O', 'o combustível reage com O₂', 'motores, fogões', 'Combustão completa: CO₂ e água. Com pouco oxigênio, vira incompleta e forma CO (tóxico) e fuligem.']
  };
  let t = 'adicao';
  function desenhar() {
    const [rot, reag, cond, prod, acontece, uso, txt] = TIPOS[t];
    $('graf').innerHTML = `<text x="160" y="28" text-anchor="middle" style="font-size:15px;font-weight:800;fill:var(--texto)">${reag}</text>
      <text x="160" y="58" text-anchor="middle" style="font-size:20px;fill:var(--texto)">↓</text><text x="174" y="56" style="font-size:11px">${cond}</text>
      <text x="160" y="90" text-anchor="middle" style="font-size:15px;font-weight:800;fill:var(--texto)">${prod}</text>`;
    $('graf').setAttribute('aria-label', `${rot}: ${reag.replace(/<[^>]+>/g, '')} forma ${prod.replace(/<[^>]+>/g, '')}`);
    $('leituras').innerHTML = leitura('Tipo', rot.toLowerCase()) + leitura('O que acontece', acontece) + leitura('Onde se usa', uso);
    $('recado').textContent = txt;
    raiz.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
  }
  $('tipos').innerHTML = Object.entries(TIPOS).map(([id, x]) => `<button type="button" data-t="${id}">${x[0]}</button>`).join('');
  raiz.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { t = b.dataset.t; desenhar(); }));
  desenhar();

  // ---------- filminho: o sabão ----------
  const { ator, por } = aulasMM;
  const N = x => `<span class="au-numero au-pequeno">${x}</span>`;
  const sab = r => `<span style="display:inline-flex;align-items:center;transform:rotate(${r}deg)"><span style="width:26px;height:3px;background:#e9b949"></span><span style="width:10px;height:10px;border-radius:50%;background:#6c8cff"></span></span>`;
  const ROTEIROS = {
    sabao: {
      montar(p) {
        const a = { g: ator(p, '<span style="display:block;width:44px;height:34px;border-radius:50%;background:#e9b949;opacity:.85"></span>', 50, 46), tg: ator(p, N('gordura'), 50, 76) };
        a.s = [0, 1, 2, 3, 4, 5].map(k => ator(p, sab(k * 60), 12 + (k % 3) * 8, 20 + Math.floor(k / 3) * 50));
        a.t = ator(p, N('cauda apolar (amarela) · cabeça polar (azul)'), 50, 92);
        return a;
      },
      passos: [
        [2600, 'O sabão tem uma <b>cauda apolar</b>, que gosta de gordura, e uma <b>cabeça polar</b>, que gosta de água.'],
        [3000, 'As caudas entram na gordura e as cabeças ficam para fora: forma-se uma bolinha, a <b>micela</b>.', a => a.s.forEach((s, k) => { const ang = k * 60 * Math.PI / 180; por(s, { x: 50 + 16 * Math.cos(ang), y: 46 + 26 * Math.sin(ang), html: sab(k * 60) }); })],
        [2800, 'Por fora, a micela é polar: a água leva a gordura embora no enxágue.', a => { por(a.g, { x: 80 }); a.s.forEach((x, k) => { const ang = k * 60 * Math.PI / 180; por(x, { x: 80 + 16 * Math.cos(ang) }); }); por(a.tg, { x: 80, html: N('gordura saindo com a água') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
