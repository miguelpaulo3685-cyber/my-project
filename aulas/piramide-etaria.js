aulasMM.aulas['piramide-etaria'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const FAIXAS = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80+'];

  // de cima (80+) para baixo (0–9)
  const piramide = $('piramide');
  const linhas = FAIXAS.map((nome, i) => {
    const d = document.createElement('div');
    d.className = 'au-faixa';
    d.innerHTML = `<div><i></i></div><span>${nome}</span><div><i></i></div>`;
    return { i, homens: d.children[0].firstChild, mulheres: d.children[2].firstChild, el: d };
  });
  [...linhas].reverse().forEach(l => piramide.appendChild(l.el));

  // Modelo simplificado: cada geração é maior ou menor que a anterior conforme
  // os filhos por mulher (2,1 repõe), e parte dela sobrevive até cada idade.
  function populacao(filhos, vida) {
    const porDecada = Math.pow(filhos / 2.1, 10 / 32);
    return FAIXAS.map((_, i) => {
      const idade = 10 * i + 5;
      const vivos = Math.exp(-Math.pow(idade / (1.25 * vida), 3));
      const geracao = Math.pow(porDecada, -i) * vivos;
      const extra = Math.max(0, i - 5) * 0.06; // mulheres vivem mais, em média
      return { h: geracao * (1 - extra), m: geracao * (1 + extra) };
    });
  }

  function desenhar() {
    const filhos = Number($('filhos').value), vida = Number($('vida').value);
    $('o-filhos').textContent = br(filhos, 1); $('o-vida').textContent = vida + ' anos';
    const pop = populacao(filhos, vida);
    const maior = Math.max(...pop.map(p => Math.max(p.h, p.m)));
    linhas.forEach(l => { l.homens.style.width = pop[l.i].h / maior * 100 + '%'; l.mulheres.style.width = pop[l.i].m / maior * 100 + '%'; });
    const soma = (de, ate) => pop.slice(de, ate).reduce((s, p) => s + p.h + p.m, 0);
    const total = soma(0, 9), jovens = soma(0, 2) / total, adultos = soma(2, 6) / total, idosos = soma(6, 9) / total;
    $('l-jovens').textContent = Math.round(jovens * 100) + '%';
    $('l-adultos').textContent = Math.round(adultos * 100) + '%';
    $('l-idosos').textContent = Math.round(idosos * 100) + '%';
    const adultosPor10 = Math.round(adultos / (jovens + idosos) * 10);
    $('recado').textContent = jovens > 0.4 ? `🔺 População jovem: base larga. O país precisa de escolas e de empregos para quem está chegando.`
      : idosos > 0.22 ? `🔻 População envelhecida: base estreita e topo largo. Há ${adultosPor10} adultos para cada 10 dependentes, e a pressão é sobre a previdência e a saúde.`
      : `🛢️ População adulta: forma de barril. Há ${adultosPor10} adultos para cada 10 dependentes (crianças, jovens e idosos). É a fase do bônus demográfico.`;
  }

  for (const k of ['filhos', 'vida']) $(k).addEventListener('input', desenhar);
  raiz.querySelectorAll('[data-cena]').forEach(b => b.addEventListener('click', () => {
    const [f, v] = b.dataset.cena.split(','); $('filhos').value = f; $('vida').value = v; desenhar();
  }));
  desenhar();
  return () => {};
};
