// Aulas interativas (aba Aprender). Cada aula é um par de arquivos:
// aulas/<id>.html (o texto e os controles) e aulas/<id>.js, que registra
// aulasMM.aulas[id] = raiz => parar. O site só baixa a aula quando o aluno abre.
window.aulasMM = {
  aulas: {},
  calmo: matchMedia('(prefers-reduced-motion: reduce)').matches,
  br: (n, casas = 0) => Number(n).toFixed(casas).replace('.', ','),
  // Teste rápido: marca a certa e explica o porquê.
  teste(raiz) {
    raiz.querySelectorAll('.au-pergunta').forEach(p => {
      const certa = Number(p.dataset.certa), alts = [...p.querySelectorAll('.au-alt')], retorno = p.querySelector('.au-retorno');
      alts.forEach((b, i) => b.addEventListener('click', () => {
        alts.forEach(x => x.classList.remove('au-certa', 'au-errada'));
        b.classList.add(i === certa ? 'au-certa' : 'au-errada');
        if (i !== certa) alts[certa].classList.add('au-certa');
        retorno.textContent = (i === certa ? 'Isso! ' : 'Quase. ') + p.dataset.porque;
      }));
    });
  },

  // Filminho: uma animação que toca sozinha, em passos, com a legenda de cada passo
  // embaixo. Não dá para mexer (só pausar e voltar ao começo). Só anda quando está
  // na tela. roteiro = { montar(palco) => atores, passos: [[ms, legenda, atores => {...}], ...] }.
  // Devolve a função que para tudo.
  filme(el, roteiro) {
    el.innerHTML = '<div class="au-palco" aria-hidden="true"></div><div class="au-filme-rodape">'
      + '<button type="button" class="au-filme-botao" aria-label="Pausar">❚❚</button>'
      + '<p class="au-filme-legenda" aria-live="polite"></p><span class="au-filme-pontos"></span></div>';
    const palco = el.querySelector('.au-palco'), legenda = el.querySelector('.au-filme-legenda');
    const botao = el.querySelector('.au-filme-botao'), pontos = el.querySelector('.au-filme-pontos');
    const passos = roteiro.passos;
    pontos.innerHTML = passos.map(() => '<i></i>').join('');
    let i = 0, relogio = null, atores = null, pausado = false, visivel = false;
    function montar() {
      palco.classList.add('au-sem-transicao');
      palco.innerHTML = '';
      atores = roteiro.montar(palco);
      void palco.offsetWidth; // aplica a posição inicial sem animar
      palco.classList.remove('au-sem-transicao');
      i = 0;
    }
    function tocar() {
      clearTimeout(relogio);
      if (pausado || !visivel) return;
      if (i >= passos.length) { montar(); }
      const [ms, texto, acao] = passos[i];
      legenda.innerHTML = texto;
      [...pontos.children].forEach((p, k) => p.classList.toggle('au-aceso', k <= i));
      if (acao) acao(atores);
      i++;
      relogio = setTimeout(tocar, (aulasMM.calmo ? 1.4 : 1) * ms);
    }
    botao.addEventListener('click', () => {
      pausado = !pausado;
      botao.textContent = pausado ? '▶' : '❚❚';
      botao.setAttribute('aria-label', pausado ? 'Continuar' : 'Pausar');
      if (!pausado) tocar(); else clearTimeout(relogio);
    });
    montar();
    legenda.innerHTML = passos[0][1];
    const olho = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel) tocar(); else clearTimeout(relogio);
    }, { threshold: .4 }) : null;
    if (olho) olho.observe(el); else { visivel = true; tocar(); }
    return () => { clearTimeout(relogio); if (olho) olho.disconnect(); };
  },
  // Um "ator" do filminho: um elemento posto no palco em x/y (% do palco), pelo centro.
  ator(palco, html, x, y, classe = '') {
    const el = document.createElement('div');
    el.className = 'au-ator ' + classe;
    el.innerHTML = html;
    aulasMM.por(el, { x, y });
    palco.appendChild(el);
    return el;
  },
  // Muda posição (x, y), opacidade (o), tamanho (s) e conteúdo (html) de um ator; a transição do CSS anima.
  por(el, { x, y, o, s, html, atraso }) {
    if (atraso !== undefined) el.style.transitionDelay = atraso + 'ms';
    if (x !== undefined) el.style.left = x + '%';
    if (y !== undefined) el.style.top = y + '%';
    if (o !== undefined) el.style.opacity = o;
    if (s !== undefined) el.style.setProperty('--au-s', s);
    if (html !== undefined) el.innerHTML = html;
    return el;
  }
};
