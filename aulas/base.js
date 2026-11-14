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
  }
};
