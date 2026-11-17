aulasMM.aulas['divisao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- repartir as balas ----------
  function repartir() {
    const n = Number($('balas').value), k = Number($('amigos').value), q = Math.floor(n / k), r = n % k;
    $('o-balas').textContent = n; $('o-amigos').textContent = k;
    const bala = (i, extra = '') => `<i class="au-bala${extra}" style="animation-delay:${i * 25}ms"></i>`;
    $('pratos').innerHTML = Array.from({ length: k }, (_, j) => `<div class="au-prato"><div>${Array.from({ length: q }, (_, i) => bala(i * k + j)).join('')}</div><small>amigo ${j + 1}<b>${q}</b></small></div>`).join('')
      + (r ? `<div class="au-prato au-sobra"><div>${Array.from({ length: r }, (_, i) => bala(q * k + i, ' au-bala-sobra')).join('')}</div><small>sobra<b>${r}</b></small></div>` : '');
    $('conta').innerHTML = `${n} ÷ ${k} = <b>${q}</b>${r ? `, sobra <b>${r}</b>` : ''}`;
    $('recado').textContent = r
      ? `Cada amigo ganha ${q} e sobram ${r} ${r === 1 ? 'bala' : 'balas'}, que não dão para mais uma rodada inteira. Confira: ${q} × ${k} + ${r} = ${n}.`
      : `Cada amigo ganha ${q} e não sobra nada: ${n} é divisível por ${k}. Confira: ${q} × ${k} = ${n}.`;
  }
  for (const id of ['balas', 'amigos']) $(id).addEventListener('input', repartir);
  repartir();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const bala = '<i class="au-bala"></i>';
  const ROTEIROS = {
    repartir: {
      montar(p) {
        const a = { pratos: [20, 50, 80].map(x => ator(p, '', x, 70, 'au-prato-filme')), b: [] };
        a.nomes = [20, 50, 80].map((x, k) => ator(p, N('amigo ' + (k + 1), 'au-pequeno'), x, 90));
        for (let k = 0; k < 12; k++) a.b.push(ator(p, bala, 32 + (k % 6) * 7, 14 + Math.floor(k / 6) * 10));
        a.conta = por(ator(p, N('12 ÷ 3 = 4', 'au-medio au-certo-txt'), 50, 38), { o: 0 });
        return a;
      },
      passos: (() => {
        const rodada = r => a => { for (let j = 0; j < 3; j++) { const k = r * 3 + j; por(a.b[k], { x: [20, 50, 80][j] + (r % 2 - .5) * 6, y: 70 - Math.floor(r / 2) * 9, atraso: j * 200 }); } };
        return [
          [2200, '<b>12 balas</b> para <b>3 amigos</b>, todo mundo igual.'],
          [2000, '1ª rodada: <b>uma bala para cada</b>.', rodada(0)],
          [2000, '2ª rodada: mais uma para cada.', rodada(1)],
          [2000, '3ª rodada…', rodada(2)],
          [2000, '4ª rodada. Acabaram as balas.', rodada(3)],
          [3000, 'Cada um ficou com <b>4</b>. Então <b>12 ÷ 3 = 4</b>.', a => por(a.conta, { o: 1 })]
        ];
      })()
    },
    caber: {
      montar(p) {
        const a = { b: [], sacos: [] };
        for (let k = 0; k < 12; k++) a.b.push(ator(p, bala, 13 + k * 6.7, 34));
        a.sacos = [17, 39, 61, 83].map((x, k) => por(ator(p, N(`${k + 1}º`, 'au-pequeno'), x, 78), { o: 0 }));
        a.contorno = [17, 39, 61, 83].map(x => por(ator(p, '', x, 52, 'au-saco'), { o: 0 }));
        a.conta = por(ator(p, N('cabem 4 grupos de 3', 'au-medio au-certo-txt'), 50, 14), { o: 0 });
        return a;
      },
      passos: [
        [2200, 'As mesmas <b>12 balas</b>. Agora a pergunta é outra: quantos <b>saquinhos de 3</b> dá para montar?'],
        [3600, 'Separe de 3 em 3…', a => a.b.forEach((b, k) => {
          const g = Math.floor(k / 3); por(b, { x: [17, 39, 61, 83][g] + (k % 3 - 1) * 5, y: 52, atraso: g * 500 });
          por(a.contorno[g], { o: 1, atraso: g * 500 }); por(a.sacos[g], { o: 1, atraso: g * 500 });
        })],
        [3000, 'Cabem <b>4 saquinhos</b>. A mesma conta: <b>12 ÷ 3 = 4</b>.', a => por(a.conta, { o: 1 })]
      ]
    },
    inversa: {
      montar(p) {
        const cel = Array.from({ length: 42 }, () => '<b class="au-on"></b>').join('');
        const a = { g: ator(p, `<div class="au-grade-filme" style="grid-template-columns:repeat(7, var(--au-cel));--au-cel:15px">${cel}</div>`, 50, 46) };
        a.topo = por(ator(p, N('7 colunas', 'au-pequeno'), 50, 8), { o: 0 });
        a.lado = por(ator(p, N('? fileiras', 'au-medio au-cor-u'), 18, 46), { o: 0 });
        a.conta = por(ator(p, N('42 ÷ 7 = 6, porque 6 × 7 = 42', 'au-medio au-certo-txt'), 50, 90), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Um retângulo com <b>42 quadradinhos</b>.'],
        [2600, 'Ele tem <b>7 colunas</b>. Quantas fileiras?', a => { por(a.topo, { o: 1 }); por(a.lado, { o: 1 }); }],
        [3000, 'Pense na tabuada do 7: <b>7 vezes quanto dá 42?</b> 6 × 7 = 42.', a => {
          a.g.querySelectorAll('b').forEach((c, k) => { if (Math.floor(k / 7) % 2) c.className = 'au-on2'; });
        }],
        [3000, 'São <b>6 fileiras</b>. Dividir é achar o lado que falta.', a => { por(a.lado, { html: N('6 fileiras', 'au-medio au-certo-txt') }); por(a.conta, { o: 1 }); }]
      ]
    },
    resto: {
      montar(p) {
        const van = `<div class="au-van"><div class="au-grade-filme" style="grid-template-columns:repeat(5, var(--au-cel));--au-cel:7px">${'<b></b>'.repeat(15)}</div></div>`;
        const a = { vans: [16, 39, 62, 85].map(x => ator(p, van, x, 30)) };
        a.vans[3].firstChild.classList.add('au-van-extra'); por(a.vans[3], { o: 0 });
        a.rot = [16, 39, 62, 85].map((x, k) => por(ator(p, N(k < 3 ? '15' : '5', 'au-pequeno'), x, 50), { o: 0 }));
        a.sobra = por(ator(p, '<span class="au-balao" style="background:var(--errado);color:#fff">sobram 5 alunos</span>', 50, 66), { o: 0 });
        a.conta = ator(p, N('50 alunos ÷ 15 lugares', 'au-medio'), 50, 86);
        return a;
      },
      passos: [
        [2400, '<b>50 alunos</b> vão de van. Cada van leva <b>15</b>.'],
        [3600, 'Encha as vans: 15, 15, 15. Já são 45 alunos em <b>3 vans</b>.', a => a.vans.slice(0, 3).forEach((v, k) => {
          setTimeout(() => v.querySelectorAll('b').forEach(c => c.classList.add('au-on')), k * 700); por(a.rot[k], { o: 1, atraso: k * 700 });
        })],
        [2800, '<b>Sobram 5 alunos</b>. Eles não cabem nas 3 vans cheias.', a => por(a.sobra, { o: 1 })],
        [3400, 'Ninguém fica para trás: precisa de uma <b>4ª van</b>. A conta dá 3 e pouco, mas a resposta é <b>4</b>.', a => {
          por(a.vans[3], { o: 1 }); por(a.rot[3], { o: 1 });
          a.vans[3].querySelectorAll('b').forEach((c, k) => { if (k < 5) c.classList.add('au-on2'); });
          por(a.conta, { html: N('precisa de 4 vans', 'au-medio au-certo-txt') });
        }]
      ]
    },
    cortar: {
      montar(p) {
        const a = { conta: ator(p, N('1 20<span class="au-z1">0</span> ÷ 4<span class="au-z2">0</span>'), 50, 34),
          nova: por(ator(p, N('120 ÷ 4 = 30', 'au-medio au-certo-txt'), 50, 66), { o: 0 }),
          nota: por(ator(p, '<span class="au-balao">÷ 10 nos dois</span>', 50, 12), { o: 0 }) };
        return a;
      },
      passos: [
        [2400, 'Conta: <b>1 200 ÷ 40</b>. Parece grande.'],
        [3000, 'Divida os <b>dois</b> por 10: tire um zero de cada um.', a => {
          por(a.nota, { o: 1 }); a.conta.querySelectorAll('.au-z1, .au-z2').forEach(z => z.classList.add('au-riscado-filme'));
        }],
        [3200, 'Sobra <b>120 ÷ 4</b>, de cabeça: <b>30</b>. Cortar o mesmo dos dois lados não muda a resposta.', a => por(a.nova, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
