aulasMM.aulas['isomeria-espacial'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const g = (x, y, t, cor = 'var(--texto)') => `<rect x="${x - 19}" y="${y - 11}" width="38" height="22" rx="7" fill="var(--superficie)"/><text x="${x}" y="${y + 5}" text-anchor="middle" style="font-size:14px;font-weight:800;fill:${cor}">${t}</text>`;
  const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="2.5" opacity=".7"/>`;
  let m = 'cis';
  function desenhar() {
    let s = '';
    if (m !== 'optica') {
      const cis = m === 'cis', CL = '#6fd08c';
      s += `<line x1="40" y1="70" x2="280" y2="70" stroke="currentColor" stroke-dasharray="4 4" opacity=".3"/>
        <line x1="134" y1="66" x2="186" y2="66" stroke="#e9b949" stroke-width="3"/><line x1="134" y1="74" x2="186" y2="74" stroke="#e9b949" stroke-width="3"/>
        ${L(130, 70, 96, 36)}${L(130, 70, 96, 104)}${L(190, 70, 224, 36)}${L(190, 70, 224, 104)}
        ${g(130, 70, 'C')}${g(190, 70, 'C')}${g(92, 32, 'Cl', CL)}${g(92, 108, 'H')}${g(228, cis ? 32 : 108, 'Cl', CL)}${g(228, cis ? 108 : 32, 'H')}
        <text x="160" y="134" text-anchor="middle">${cis ? 'os dois Cl do mesmo lado' : 'os Cl em lados opostos'}</text>`;
    } else {
      const mol = (x, dir) => `${L(x, 70, x, 30)}${L(x, 70, x - 40 * dir, 70)}${L(x, 70, x + 40 * dir, 70)}${L(x, 70, x, 110)}
        ${g(x, 70, 'C', '#e9b949')}${g(x, 26, 'H')}${g(x - 44 * dir, 70, 'OH')}${g(x + 48 * dir, 70, 'COOH')}${g(x, 114, 'CH₃')}`;
      s += mol(84, 1) + `<line x1="160" y1="10" x2="160" y2="130" stroke="#6c8cff" stroke-width="2" stroke-dasharray="5 4"/><text x="160" y="138" text-anchor="middle" style="fill:#6c8cff">espelho</text>` + mol(236, -1);
    }
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', m === 'optica' ? 'Ácido lático e sua imagem no espelho' : `1,2-dicloroeteno ${m}`);
    $('leituras').innerHTML = m === 'cis' ? leitura('Isômero', 'cis') + leitura('Polaridade', 'polar') + leitura('Ferve a', '60 °C')
      : m === 'trans' ? leitura('Isômero', 'trans') + leitura('Polaridade', 'apolar') + leitura('Ferve a', '48 °C')
      : leitura('Carbono quiral', 'sim, 4 ligantes diferentes') + leitura('Isômeros', '2 (dextro e levo)') + leitura('Exemplo', 'ácido lático');
    $('recado').textContent = m === 'cis' ? '1,2-dicloroeteno cis: os dois cloros do mesmo lado da dupla. A molécula fica polar e ferve a 60 °C. A dupla não gira, por isso cis e trans não viram um no outro.'
      : m === 'trans' ? '1,2-dicloroeteno trans: os cloros em lados opostos. Os efeitos se cancelam, a molécula fica apolar e ferve mais baixo, a 48 °C. Mesma fórmula, propriedades diferentes.'
      : 'O carbono do meio do ácido lático (do músculo e do iogurte) tem 4 ligantes diferentes: H, OH, CH₃ e COOH. A molécula e sua imagem no espelho são isômeros ópticos: não se sobrepõem, por mais que se gire.';
    raiz.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
  }
  raiz.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { m = b.dataset.m; desenhar(); }));
  desenhar();

  // ---------- filminho: as mãos ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const mao = (inv) => `<span style="display:inline-block;font-size:52px;transform:scaleX(${inv ? -1 : 1})">🤚</span>`;
  const ROTEIROS = {
    maos: {
      montar(p) {
        return { e: ator(p, mao(false), 30, 44), d: ator(p, mao(true), 70, 44), t: ator(p, N('esquerda · direita'), 50, 84) };
      },
      passos: [
        [2600, 'Suas mãos são imagens uma da outra no espelho.'],
        [3000, 'Tente colocar uma exatamente sobre a outra, com as palmas para baixo: o polegar sempre fica do lado errado.', a => { por(a.e, { x: 46 }); por(a.d, { x: 54 }); }],
        [3000, 'Moléculas com carbono quiral são assim: "esquerda" e "direita". O corpo, como uma luva, aceita só uma delas.', a => { por(a.e, { x: 30 }); por(a.d, { x: 70 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
