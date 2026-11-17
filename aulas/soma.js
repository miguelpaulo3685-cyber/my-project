aulasMM.aulas['soma'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // ---------- caixa da lanchonete: notas, moedas e o "vai um" ----------
  // Colunas da direita para a esquerda: moedas de 1, notas de 10, notas de 100, notas de 1000.
  const TIPOS = [
    { nome: 'moedas de R$ 1', um: 'moeda de R$ 1', valor: 1, classe: 'au-moeda' },
    { nome: 'notas de R$ 10', um: 'nota de R$ 10', valor: 10, classe: 'au-nota10' },
    { nome: 'notas de R$ 100', um: 'nota de R$ 100', valor: 100, classe: 'au-nota100' },
    { nome: 'notas de R$ 1000', um: 'nota de R$ 1000', valor: 1000, classe: 'au-nota1000' }
  ];
  const partes = n => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10, Math.floor(n / 1000) % 10];
  let a = 47, b = 38;
  let mesa = null;        // depois de juntar: quantidade em cada coluna
  let sobe = [0, 0, 0, 0]; // "vai um" que chegou em cada coluna (vindo da anterior)

  const pilha = (qtd, t, novo = 0) => Array.from({ length: qtd }, (_, i) =>
    `<i class="${t.classe}${i >= qtd - novo ? ' au-nova' : ''}">${t.valor}</i>`).join('');

  function colunas() {
    const usadas = Math.max(String(a + b).length, String(a).length, String(b).length);
    return TIPOS.slice(0, usadas).map((t, i) => i).reverse();
  }

  function desenharCaixa() {
    const cols = colunas(), pa = partes(a), pb = partes(b);
    const cabeca = cols.map(i => `<b>${['Unidades', 'Dezenas', 'Centenas', 'Milhar'][i]}</b>`).join('');
    let linhas;
    if (!mesa) {
      linhas = [[a, pa, 'Venda 1'], [b, pb, 'Venda 2']].map(([n, p, nome]) =>
        `<div class="au-linha-mesa"><span class="au-rotulo-mesa">${nome}<b>R$ ${fmt(n)}</b></span>${cols.map(i => `<div class="au-pilha">${pilha(p[i], TIPOS[i])}</div>`).join('')}</div>`).join('');
    } else {
      linhas = `<div class="au-linha-mesa au-junto"><span class="au-rotulo-mesa">Tudo junto<b>${mesa.every(q => q < 10) ? 'R$ ' + fmt(a + b) : '?'}</b></span>${cols.map(i =>
        `<div class="au-pilha${mesa[i] >= 10 ? ' au-cheia' : ''}">${pilha(mesa[i], TIPOS[i], sobe[i])}${mesa[i] >= 10 ? `<em>${mesa[i]}!</em>` : ''}</div>`).join('')}</div>`;
    }
    $('mesa').innerHTML = `<div class="au-linha-mesa au-cabeca-mesa"><span></span>${cabeca}</div>${linhas}`;
    $('mesa').style.setProperty('--au-cols', cols.length);

    // Conta armada: o "1" de cada troca aparece em cima da coluna; o resultado de uma coluna
    // só aparece quando ela e as da direita já estão resolvidas (menos de 10).
    const largura = cols.length;
    const casa = (n, i) => { const d = partes(n)[i]; return n >= TIPOS[i].valor || i === 0 ? d : ''; };
    const resolvida = i => mesa && mesa.slice(0, i + 1).every(q => q < 10);
    const vaiUm = cols.map(i => `<span class="au-vai">${sobe[i] ? '1' : ''}</span>`).join('');
    const linhaNum = n => cols.map(i => `<span>${casa(n, i)}</span>`).join('');
    const resultado = cols.map(i => `<span>${resolvida(i) ? (i === largura - 1 && mesa[i] === 0 ? '' : mesa[i]) : ''}</span>`).join('');
    $('armada').innerHTML = `<div class="au-armada-grade" style="--au-cols:${largura}">
      <span></span>${vaiUm}<span>&nbsp;</span>${linhaNum(a)}<span>+</span>${linhaNum(b)}<span class="au-traco"></span><span></span>${resultado.replace(/<span>/g, '<span class="au-res">')}</div>`;

    const cheia = mesa ? mesa.findIndex(q => q >= 10) : -1;
    $('juntar').disabled = Boolean(mesa);
    $('trocar').disabled = cheia < 0;
    $('trocar').setAttribute('aria-pressed', String(cheia >= 0)); // aceso quando é a hora de trocar
    $('juntar').setAttribute('aria-pressed', String(!mesa));
    $('trocar').textContent = cheia < 0 ? '2. Trocar 10 por 1' : `2. Trocar 10 ${TIPOS[cheia].nome} por 1 ${TIPOS[cheia + 1].um}`;
    $('recado').textContent = !mesa
      ? `Duas vendas: R$ ${fmt(a)} e R$ ${fmt(b)}. Toque em "Juntar na mesa".`
      : cheia >= 0
        ? `Ficaram ${mesa[cheia]} ${TIPOS[cheia].nome}. Ninguém guarda tanta coisa solta: troque 10 delas por 1 ${TIPOS[cheia + 1].um}. Esse é o "vai um".`
        : sobe.some(Boolean)
          ? `Pronto: R$ ${fmt(a + b)}. Cada "1" pequeno em cima da conta é uma troca que você fez.`
          : `Pronto: R$ ${fmt(a + b)}. Aqui nenhuma coluna passou de 9, então não teve "vai um".`;
  }

  function novaConta(x, y) { a = x; b = y; mesa = null; sobe = [0, 0, 0, 0]; desenharCaixa(); }
  $('juntar').addEventListener('click', () => {
    const pa = partes(a), pb = partes(b);
    mesa = [0, 1, 2, 3].map(i => pa[i] + pb[i]);
    desenharCaixa();
  });
  $('trocar').addEventListener('click', () => {
    const i = mesa.findIndex(q => q >= 10);
    if (i < 0) return;
    mesa[i] -= 10; mesa[i + 1] += 1; sobe[i + 1] = 1;
    desenharCaixa();
  });
  $('recomecar').addEventListener('click', () => novaConta(a, b));
  raiz.querySelectorAll('[data-conta]').forEach(bt => bt.addEventListener('click', () => {
    const [x, y] = bt.dataset.conta.split(',').map(Number); novaConta(x, y);
  }));
  $('sortear').addEventListener('click', () => {
    const x = 20 + Math.floor(Math.random() * 480), y = 10 + Math.floor(Math.random() * 480);
    novaConta(x, y);
  });

  // ---------- duplas que fecham redondo ----------
  const CONJUNTOS = [[37, 48, 63, 52, 25, 75], [16, 91, 84, 9, 47, 53], [128, 36, 72, 64, 150, 50]];
  let conjunto = 0, fichas = [], escolhida = null;
  function prepararFichas() {
    fichas = CONJUNTOS[conjunto].map(v => ({ v, par: null }));
    escolhida = null;
    desenharFichas();
  }
  function desenharFichas() {
    const pares = [];
    fichas.forEach((f, i) => { if (f.par !== null && f.par > i) pares.push(f.v + fichas[f.par].v); });
    $('fichas').innerHTML = fichas.map((f, i) => `<button type="button" class="au-ficha${f.par !== null ? ' au-feita' : ''}${escolhida === i ? ' au-escolhida' : ''}"
      data-i="${i}" ${f.par !== null ? 'disabled' : ''} aria-pressed="${escolhida === i}">${f.v}</button>`).join('');
    const todos = fichas.every(f => f.par !== null);
    const total = fichas.reduce((s, f) => s + f.v, 0);
    $('recado2').innerHTML = todos
      ? `Fechou! ${pares.join(' + ')} = <b>${total}</b>. Na ordem da lista seria bem mais trabalhoso.`
      : pares.length ? `Duplas prontas: ${pares.join(' + ')}. Continue.` : `Soma de todos: ${fichas.map(f => f.v).join(' + ')} = ? Em vez de ir na ordem, ache as duplas.`;
  }
  $('fichas').addEventListener('click', e => {
    const bt = e.target.closest('.au-ficha');
    if (!bt) return;
    const i = Number(bt.dataset.i);
    if (escolhida === null || escolhida === i) { escolhida = escolhida === i ? null : i; return desenharFichas(); }
    const soma = fichas[escolhida].v + fichas[i].v;
    if (soma % 10 === 0) { fichas[escolhida].par = i; fichas[i].par = escolhida; escolhida = null; desenharFichas(); }
    else {
      const j = escolhida; escolhida = null; desenharFichas();
      $('recado2').textContent = `${fichas[j].v} + ${fichas[i].v} = ${soma}: não fecha redondo. Olhe só o último algarismo: qual junta com ${fichas[j].v % 10} para dar 10?`;
    }
  });
  $('outras-fichas').addEventListener('click', () => { conjunto = (conjunto + 1) % CONJUNTOS.length; prepararFichas(); });

  // ---------- compensação: passar 1 de um para o outro ----------
  let esq = 198, dir = 47;
  const redondo = n => n % 10 === 0;
  function desenharBalanca() {
    const total = esq + dir;
    $('balanca').innerHTML = `<div class="au-conta-grande"><span class="${redondo(esq) ? 'au-redondo' : ''}">${fmt(esq)}</span> + <span class="${redondo(dir) ? 'au-redondo' : ''}">${fmt(dir)}</span> = <b>${fmt(total)}</b></div>
      <div class="au-barras-soma"><i style="flex:${esq / total}">${esq >= total * .18 ? fmt(esq) : ''}</i><i style="flex:${dir / total}">${dir >= total * .18 ? fmt(dir) : ''}</i></div>
      <p class="au-legenda">A barra inteira é sempre ${fmt(total)}: só muda onde fica o corte.</p>`;
    $('passa-esq').disabled = dir <= 0; $('passa-dir').disabled = esq <= 0;
    $('recado3').textContent = redondo(esq) || redondo(dir)
      ? `Agora ficou fácil: ${fmt(esq)} + ${fmt(dir)} = ${fmt(total)}. Mesmo total, conta muito mais leve.`
      : `Passe de um em um até um dos números ficar redondo (terminar em 0). Repare que o total não muda.`;
  }
  $('passa-esq').addEventListener('click', () => { if (dir > 0) { esq++; dir--; desenharBalanca(); } });
  $('passa-dir').addEventListener('click', () => { if (esq > 0) { esq--; dir++; desenharBalanca(); } });
  raiz.querySelectorAll('[data-par]').forEach(bt => bt.addEventListener('click', () => {
    [esq, dir] = bt.dataset.par.split(',').map(Number); desenharBalanca();
  }));

  // ---------- horas: a troca é de 60 ----------
  const hm = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);
  function desenharRelogio() {
    const x = Number($('onibus').value), y = Number($('metro').value);
    $('o-onibus').textContent = hm(x); $('o-metro').textContent = hm(y);
    const hx = Math.floor(x / 60), mx = x % 60, hy = Math.floor(y / 60), my = y % 60;
    const h = hx + hy, m = mx + my;
    $('relogio').innerHTML = `<div class="au-formula" style="margin:0">${hx}h ${mx}min + ${hy}h ${my}min = ${h}h <span class="${m >= 60 ? 'au-passou' : ''}">${m}min</span></div>
      <p class="au-legenda" style="text-align:left;margin:8px 0 0">${m >= 60
        ? `${m} minutos passam de 60: troque 60 minutos por 1 hora. Sobram ${m - 60} min. Viagem: <b>${hm(x + y)}</b>.`
        : `Os minutos não passaram de 60, então não tem troca. Viagem: <b>${hm(x + y)}</b>.`}</p>`;
  }
  for (const k of ['onibus', 'metro']) $(k).addEventListener('input', desenharRelogio);

  desenharCaixa(); prepararFichas(); desenharBalanca(); desenharRelogio();
  return () => {};
};
