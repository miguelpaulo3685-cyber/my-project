// Estatísticas da redação: um ranking dos eixos temáticos com mais chance de
// cair no próximo ENEM, feito só com a história dos temas (1998 em diante).
//
// Cada tema foi classificado em um eixo principal (peso 1) e, às vezes, um
// secundário (peso 0,5). Três contas simples disputam:
//   - frequencia: quantas vezes o eixo já caiu;
//   - recente:    o mesmo, mas cada ano vale metade do que valia 8 anos depois;
//   - sem_repetir: "recente" com desconto para o eixo principal do ano anterior
//                  (em 28 trocas de ano, o eixo principal só se repetiu 1 vez).
// Vale a que mais acertou quando testada nos últimos 10 anos, sempre usando só
// os anos anteriores ao ano testado. É um guia de treino, não uma garantia.

const EIXOS = {
  direitos: 'Direitos humanos e grupos vulneráveis',
  tecnologia: 'Tecnologia e comunicação',
  educacao: 'Educação e cultura',
  cidadania: 'Cidadania, política e ética',
  saude: 'Saúde',
  seguranca: 'Violência e segurança',
  trabalho: 'Trabalho e economia',
  ambiente: 'Meio ambiente'
};

// [ano, tema, eixo principal, eixo secundário]
const TEMAS = [
  [1998, 'Viver e aprender', 'educacao'],
  [1999, 'Cidadania e participação social', 'cidadania'],
  [2000, 'Direitos da criança e do adolescente: como enfrentar esse desafio nacional', 'direitos'],
  [2001, 'Desenvolvimento e preservação ambiental: como conciliar os interesses em conflito?', 'ambiente'],
  [2002, 'O direito de votar: como fazer dessa conquista um meio para promover as transformações sociais de que o Brasil necessita?', 'cidadania'],
  [2003, 'A violência na sociedade brasileira: como mudar as regras desse jogo?', 'seguranca'],
  [2004, 'Como garantir a liberdade de informação e evitar abusos nos meios de comunicação?', 'tecnologia'],
  [2005, 'O trabalho infantil na sociedade brasileira', 'direitos', 'trabalho'],
  [2006, 'O poder de transformação da leitura', 'educacao'],
  [2007, 'O desafio de se conviver com as diferenças', 'direitos'],
  [2008, 'Como preservar a floresta Amazônica', 'ambiente'],
  [2009, 'O indivíduo frente à ética nacional', 'cidadania'],
  [2010, 'O trabalho na construção da dignidade humana', 'trabalho'],
  [2011, 'Viver em rede no século XXI: os limites entre o público e o privado', 'tecnologia'],
  [2012, 'Movimento imigratório para o Brasil no século XXI', 'direitos'],
  [2013, 'Efeitos da implantação da Lei Seca no Brasil', 'seguranca', 'saude'],
  [2014, 'Publicidade infantil em questão no Brasil', 'tecnologia', 'direitos'],
  [2015, 'A persistência da violência contra a mulher na sociedade brasileira', 'seguranca', 'direitos'],
  [2016, 'Caminhos para combater a intolerância religiosa no Brasil', 'direitos'],
  [2017, 'Desafios para a formação educacional de surdos no Brasil', 'educacao', 'direitos'],
  [2018, 'Manipulação do comportamento do usuário pelo controle de dados na internet', 'tecnologia'],
  [2019, 'Democratização do acesso ao cinema no Brasil', 'educacao'],
  [2020, 'O estigma associado às doenças mentais na sociedade brasileira', 'saude'],
  [2021, 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil', 'cidadania', 'direitos'],
  [2022, 'Desafios para a valorização de comunidades e povos tradicionais no Brasil', 'direitos'],
  [2023, 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil', 'trabalho', 'direitos'],
  [2024, 'Desafios para a valorização da herança africana no Brasil', 'direitos', 'educacao'],
  [2025, 'Perspectivas acerca do envelhecimento na sociedade brasileira', 'direitos'],
  [2026, 'A valorização do Sistema Único de Saúde (SUS) como direito universal', 'saude']
].map(([ano, tema, principal, secundario = null]) => ({ ano, tema, principal, secundario }));

// Assuntos para treinar em cada eixo: escolha da equipe (ainda não caíram), não é estatística.
const ASSUNTOS = {
  direitos: ['Inclusão de pessoas com deficiência', 'População em situação de rua', 'Combate ao racismo'],
  tecnologia: ['Inteligência artificial no dia a dia', 'Desinformação e notícias falsas', 'Excesso de telas na infância e adolescência'],
  educacao: ['Evasão escolar', 'Valorização do professor', 'Hábito de leitura no Brasil'],
  cidadania: ['Participação dos jovens na política', 'Combate à corrupção', 'Acesso à justiça'],
  saude: ['Obesidade e alimentação', 'Vacinação', 'Doação de órgãos'],
  seguranca: ['Violência nas escolas e bullying', 'Violência no trânsito', 'Sistema prisional'],
  trabalho: ['Trabalho por aplicativo', 'Endividamento e apostas on-line', 'Desemprego entre os jovens'],
  ambiente: ['Crise climática e eventos extremos', 'Lixo e reciclagem', 'Acesso à água e ao saneamento']
};

const MEIA_VIDA = 8;        // anos para um tema antigo valer a metade
const DESCONTO_REPETIR = 0.25;
const SUAVIZACAO = 0.5;     // nenhum eixo fica com chance zero
const ANOS_DE_TESTE = 10;

const MODELOS = {
  frequencia: () => 1,
  recente: (alvo, ano) => Math.pow(0.5, (alvo - ano) / MEIA_VIDA),
  sem_repetir: (alvo, ano) => Math.pow(0.5, (alvo - ano) / MEIA_VIDA)
};
const NOME_DO_MODELO = {
  frequencia: 'quantas vezes cada eixo já caiu',
  recente: 'quantas vezes cada eixo caiu, com mais peso para os anos recentes',
  sem_repetir: 'os anos recentes pesam mais, e o eixo do ano passado perde força (quase nunca se repete)'
};

// Chance de cada eixo para o ano alvo, usando só os temas anteriores a ele.
function chances(alvo, modelo = 'sem_repetir', temas = TEMAS) {
  const antes = temas.filter(t => t.ano < alvo);
  const pontos = Object.fromEntries(Object.keys(EIXOS).map(e => [e, SUAVIZACAO]));
  for (const t of antes) {
    const peso = MODELOS[modelo](alvo, t.ano);
    pontos[t.principal] += peso;
    if (t.secundario) pontos[t.secundario] += peso / 2;
  }
  if (modelo === 'sem_repetir') {
    const anterior = antes.find(t => t.ano === alvo - 1);
    if (anterior) pontos[anterior.principal] *= DESCONTO_REPETIR;
  }
  const total = Object.values(pontos).reduce((a, b) => a + b, 0);
  return Object.keys(EIXOS).map(eixo => ({ eixo, chance: pontos[eixo] / total })).sort((a, b) => b.chance - a.chance);
}

// Teste no passado: para cada um dos últimos anos, em que posição ficou o eixo que caiu de verdade.
function testar(modelo, temas = TEMAS) {
  const anos = temas.slice(-ANOS_DE_TESTE).map(t => {
    const ranking = chances(t.ano, modelo, temas).map(r => r.eixo);
    return { ano: t.ano, eixo: t.principal, posicao: ranking.indexOf(t.principal) + 1 };
  });
  return {
    modelo, anos,
    top3: anos.filter(a => a.posicao <= 3).length,
    top1: anos.filter(a => a.posicao === 1).length,
    posicao_media: anos.reduce((s, a) => s + a.posicao, 0) / anos.length
  };
}

// O modelo que mais acertou entre os 3 primeiros (desempate: melhor posição média).
function melhorModelo(temas = TEMAS) {
  return Object.keys(MODELOS).map(m => testar(m, temas))
    .sort((a, b) => (b.top3 - a.top3) || (a.posicao_media - b.posicao_media))[0];
}

function estatisticas(temas = TEMAS) {
  const alvo = temas[temas.length - 1].ano + 1;
  const teste = melhorModelo(temas);
  const ranking = chances(alvo, teste.modelo, temas).map(r => {
    const vezes = temas.filter(t => t.principal === r.eixo || t.secundario === r.eixo);
    return {
      eixo: r.eixo, nome: EIXOS[r.eixo], chance: Math.round(r.chance * 100),
      vezes: vezes.length, ultima: vezes.length ? vezes[vezes.length - 1].ano : null, assuntos: ASSUNTOS[r.eixo]
    };
  });
  return {
    alvo, desde: temas[0].ano, ate: temas[temas.length - 1].ano, ranking,
    // Sorteando 3 dos eixos ao acaso, o certo ficaria entre eles em 3/8 das vezes.
    teste: { como: NOME_DO_MODELO[teste.modelo], anos: teste.anos.map(a => ({ ...a, nome: EIXOS[a.eixo] })), top3: teste.top3, total: teste.anos.length,
      ao_acaso: Math.round(teste.anos.length * 3 / Object.keys(EIXOS).length) },
    historico: temas.slice().reverse().map(t => ({ ano: t.ano, tema: t.tema, eixo: EIXOS[t.principal] }))
  };
}

function registrarEstatisticasDaRedacao(app) {
  const pronto = estatisticas(); // os dados só mudam quando sai um tema novo
  app.get('/api/redacoes/estatisticas', (req, res) => res.json(pronto));
}

module.exports = registrarEstatisticasDaRedacao;
Object.assign(module.exports, { EIXOS, TEMAS, ASSUNTOS, chances, testar, melhorModelo, estatisticas });
