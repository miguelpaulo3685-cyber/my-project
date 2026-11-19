aulasMM.aulas['digestorio'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const ORGAOS = [
    { nome: 'Boca', x: 168, y: 22 }, { nome: 'Esôfago', x: 168, y: 56 }, { nome: 'Estômago', x: 176, y: 94 },
    { nome: 'Intestino delgado', x: 168, y: 142 }, { nome: 'Intestino grosso', x: 168, y: 190 }
  ];
  const ESOFAGO = ['ondas do músculo', 'bolo alimentar', 'O esôfago não digere nada: ele empurra o bolo alimentar com ondas de contração (peristaltismo).'];
  const GROSSO = 'O que não foi digerido, como as fibras, chega ao intestino grosso, que absorve a água e forma as fezes.';
  // Para cada alimento: [quem age, como está, explicação] em cada órgão
  const COMIDAS = {
    pao: { nome: 'Pão', em: '🍞', o: 'amido', etapas: [
      ['amilase da saliva', 'amido em pedaços', 'Os dentes trituram e a amilase da saliva começa a quebrar o amido. Mastigue um pão por bastante tempo: ele fica docinho!'],
      ESOFAGO,
      ['nada (ácido demais)', 'amido parado', 'O suco do estômago é muito ácido (pH perto de 2): a amilase para de funcionar. O amido espera.'],
      ['amilase do pâncreas', 'glicose', 'A amilase do pâncreas termina o serviço: o amido vira glicose, que atravessa as vilosidades e vai para o sangue.'],
      ['bactérias e absorção de água', 'fibras → fezes', GROSSO]] },
    carne: { nome: 'Carne', em: '🍖', o: 'proteína', etapas: [
      ['só os dentes', 'proteína em pedaços', 'A saliva não digere proteína: na boca a carne é só triturada.'],
      ESOFAGO,
      ['pepsina + ácido', 'pedaços de proteína', 'No estômago, o ácido clorídrico e a pepsina começam a quebrar a proteína.'],
      ['tripsina do pâncreas', 'aminoácidos', 'A tripsina do pâncreas e as enzimas do intestino terminam a digestão: sobram aminoácidos, que vão para o sangue.'],
      ['bactérias e absorção de água', 'restos → fezes', GROSSO]] },
    manteiga: { nome: 'Manteiga', em: '🧈', o: 'gordura', etapas: [
      ['só os dentes', 'gordura', 'A gordura passa pela boca praticamente sem mudar.'],
      ESOFAGO,
      ['quase nada', 'gotas grandes', 'O estômago mistura tudo, mas quase não digere gordura.'],
      ['bile + lipase', 'ácidos graxos e glicerol', 'A bile (feita no fígado, guardada na vesícula) quebra a gordura em gotinhas, como um detergente. Ela não é enzima! Aí a lipase do pâncreas digere.'],
      ['bactérias e absorção de água', 'restos → fezes', GROSSO]] }
  };
  let comida = 'pao', etapa = 0;
  function desenhar() {
    const c = COMIDAS[comida], [age, como, txt] = c.etapas[etapa], O = ORGAOS[etapa];
    const cor = k => k === etapa ? 'var(--marca)' : 'currentColor';
    const op = k => k === etapa ? .9 : .25;
    const usaFigado = etapa === 3 && comida === 'manteiga', usaPancreas = etapa === 3;
    $('graf').innerHTML = `
      <ellipse cx="168" cy="22" rx="30" ry="12" fill="${cor(0)}" opacity="${op(0)}"/>
      <rect x="162" y="36" width="12" height="40" rx="5" fill="${cor(1)}" opacity="${op(1)}"/>
      <ellipse cx="176" cy="94" rx="40" ry="18" fill="${cor(2)}" opacity="${op(2)}"/>
      <path d="M118 126 h100 v10 h-100 v10 h100 v10 h-100" fill="none" stroke="${cor(3)}" stroke-width="8" stroke-linejoin="round" opacity="${op(3)}"/>
      <rect x="103" y="180" width="130" height="20" rx="10" fill="${cor(4)}" opacity="${op(4)}"/>
      <rect x="236" y="74" width="74" height="24" rx="8" fill="${usaFigado ? '#e9b949' : 'currentColor'}" opacity="${usaFigado ? .9 : .2}"/>
      <text x="273" y="90" text-anchor="middle" style="font-weight:700">fígado</text>
      <rect x="236" y="120" width="74" height="24" rx="8" fill="${usaPancreas ? '#e9b949' : 'currentColor'}" opacity="${usaPancreas ? .9 : .2}"/>
      <text x="273" y="136" text-anchor="middle" style="font-weight:700">pâncreas</text>
      <path d="M236 86 C228 86 228 126 222 132 M236 132 h-14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity=".5"/>
      ${ORGAOS.map((o, k) => `<text x="8" y="${o.y + 4}" style="${k === etapa ? 'fill:var(--texto);font-weight:800' : ''}">${o.nome}</text>`).join('')}
      <text x="${O.x}" y="${O.y + 8}" text-anchor="middle" style="font-size:22px">${c.em}</text>`;
    $('graf').setAttribute('aria-label', `${c.nome} passando por: ${O.nome}`);
    $('leituras').innerHTML = leitura('Onde', O.nome) + leitura('Quem age', age) + leitura('Como está', como);
    $('recado').textContent = txt + (etapa === 4 ? ' Fim da viagem: escolha outro alimento.' : '');
    $('prox').disabled = etapa === 4;
    raiz.querySelectorAll('[data-comida]').forEach(b => b.setAttribute('aria-pressed', b.dataset.comida === comida));
  }
  $('comidas').innerHTML = Object.entries(COMIDAS).map(([id, c]) => `<button type="button" data-comida="${id}">${c.em} ${c.nome} (${c.o})</button>`).join('');
  raiz.querySelectorAll('[data-comida]').forEach(b => b.addEventListener('click', () => { comida = b.dataset.comida; etapa = 0; desenhar(); }));
  $('prox').addEventListener('click', () => { if (etapa < 4) etapa++; desenhar(); });
  $('volta').addEventListener('click', () => { etapa = 0; desenhar(); });
  desenhar();

  // ---------- filminho: enzima e substrato ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    enzima: {
      montar(p) {
        return {
          enz: ator(p, '<span style="font-size:44px">✂️</span>', 18, 45), m1: ator(p, '<span style="font-size:30px">🟫</span>', 58, 45), m2: ator(p, '<span style="font-size:30px">🟫</span>', 70, 45),
          t1: ator(p, N('enzima'), 18, 72), t2: ator(p, N('molécula grande'), 64, 72),
          t3: por(ator(p, N('pedaços pequenos: passam para o sangue'), 50, 90), { o: 0 })
        };
      },
      passos: [
        [2400, 'A enzima é como uma tesoura específica: cada uma corta um tipo de molécula.'],
        [2600, 'Ela se encaixa na molécula (como chave e fechadura)…', a => por(a.enz, { x: 46 })],
        [3200, '…e corta. A enzima sai inteira e pode cortar de novo. A molécula vira pedaços pequenos.', a => { por(a.enz, { x: 18 }); por(a.m1, { x: 52, y: 38 }); por(a.m2, { x: 80, y: 52 }); por(a.t3, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
