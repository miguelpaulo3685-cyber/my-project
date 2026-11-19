// Índice das trilhas "O que cai no ENEM" (lista de conteúdos do Miguel, 17/11/2026).
// Fica fora do index.html e só é baixado quando o aluno vê o cartão da trilha: o site
// abre leve. Cada aula é um par de arquivos em aulas/ (baixado só quando o aluno abre)
// e só aparece como pronta se o id estiver em "prontas". O teste de cada módulo fica
// em trilhas/teste-<id>.js e só é baixado quando o aluno começa o teste.
// Aula: [id, nome, ícone]. Módulo com teste: teste: true.
window.TRILHAS_MM = {
  prontas: ['soma', 'subtracao', 'multiplicacao', 'divisao', 'fracoes', 'contas-fracoes', 'decimais', 'potencia',
    'razao', 'proporcao', 'regra-de-tres', 'porcentagem', 'juros', 'graficos', 'medias', 'fotossintese',
    'cadeias-alimentares', 'relacoes-ecologicas', 'ciclos-biogeoquimicos', 'impactos-ambientais',
    'radiciacao', 'divisores', 'unidades', 'combinatoria', 'probabilidade',
    'atomo', 'tabela-periodica', 'ligacoes', 'forcas-intermoleculares',
    'quimica-ambiental', 'tratamento-agua', 'combustiveis', 'radioatividade',
    'bioquimica', 'membrana', 'organelas', 'metabolismo-energetico',
    'equacoes', 'sistemas', 'funcoes', 'funcao-afim', 'funcao-quadratica', 'exponencial-log',
    'sintese-proteica', 'mendel', 'sangue-heranca', 'biotecnologia'],
  materias: {
    matematica: { nome: 'Matemática', icone: '🧮', modulos: [
      { id: 'mat1', nome: 'Matemática básica e aritmética', sobre: 'A base de tudo: destrava o resto da matéria e garante as questões fáceis, que mais pesam na TRI.', teste: true, aulas: [
        ['soma', 'Soma', '➕'], ['subtracao', 'Subtração', '➖'], ['multiplicacao', 'Multiplicação', '✖️'], ['divisao', 'Divisão', '➗'],
        ['fracoes', 'Frações', '🍕'], ['contas-fracoes', 'Contas com frações', '🧩'], ['decimais', 'Decimais e dízimas', '🔢'],
        ['potencia', 'Potência e expressões numéricas', '²'], ['radiciacao', 'Raiz, notação científica e racionalização', '√'],
        ['divisores', 'Múltiplos, divisores, MMC e MDC', '🔗'], ['unidades', 'Conversão de unidades', '📏']] },
      { id: 'mat2', nome: 'Proporcionalidade e matemática financeira', sobre: 'O carro-chefe: cerca de 25% a 30% da prova. Muita leitura e interpretação.', teste: true, aulas: [
        ['razao', 'Razão e escala', '🗺️'], ['proporcao', 'Proporção e divisão proporcional', '⚖️'], ['regra-de-tres', 'Regra de três simples e composta', '🔁'],
        ['porcentagem', 'Porcentagem, lucro e variação', '🧮'], ['juros', 'Juros simples e compostos', '💳']] },
      { id: 'mat3', nome: 'Álgebra e funções', sobre: 'Problemas do dia a dia virando equações e gráficos.', teste: true, aulas: [
        ['equacoes', 'Equações do 1º e 2º grau', '🟰'], ['sistemas', 'Sistemas de equações', '🔀'], ['funcoes', 'Funções e leitura de gráficos', '📉'],
        ['funcao-afim', 'Função afim (1º grau)', '📐'], ['funcao-quadratica', 'Função quadrática (2º grau)', '⛰️'], ['exponencial-log', 'Exponencial e logaritmo', '🦠']] },
      { id: 'mat4', nome: 'Estatística, contagem e probabilidade', sobre: 'Assuntos que sempre caem e pedem atenção aos detalhes do enunciado.', teste: true, aulas: [
        ['graficos', 'Gráficos e tabelas', '📊'], ['medias', 'Média, moda, mediana e dispersão', '📈'],
        ['combinatoria', 'Análise combinatória', '🎲'], ['probabilidade', 'Probabilidade', '🎯']] },
      { id: 'mat5', nome: 'Geometria plana', sobre: 'Visualizar e calcular medidas em superfícies.', aulas: [
        ['angulos-tales', 'Ângulos, paralelas e Tales', '📐'], ['triangulos', 'Semelhança e Pitágoras', '🔺'],
        ['poligonos', 'Polígonos e circunferência', '⭕'], ['areas', 'Áreas de figuras planas', '🟩']] },
      { id: 'mat6', nome: 'Geometria espacial e projeções', sobre: 'Embalagens, reservatórios e visão espacial.', aulas: [
        ['projecoes', 'Posição e projeções (sombras)', '🔦'], ['solidos', 'Áreas e volumes dos sólidos', '📦'], ['capacidade', 'Troncos, inscrição e capacidade', '🥤']] },
      { id: 'mat7', nome: 'Sequências e trigonometria', sobre: 'Tópicos de nível médio a difícil.', aulas: [
        ['pa-pg', 'Sequências, PA e PG', '🔢'], ['trigonometria', 'Seno, cosseno e tangente', '📐'], ['ciclo-trigonometrico', 'Leis dos senos e cossenos e ondas', '〰️']] }
    ] },
    biologia: { nome: 'Biologia', icone: '🌱', modulos: [
      { id: 'bio1', nome: 'Ecologia e impactos ambientais', sobre: 'O tópico mais cobrado: cerca de 30% das questões de Biologia.', teste: true, aulas: [
        ['cadeias-alimentares', 'Cadeias, teias e pirâmides', '🦗'], ['relacoes-ecologicas', 'Relações ecológicas', '🤝'],
        ['ciclos-biogeoquimicos', 'Ciclos da água, carbono e nitrogênio', '♻️'], ['impactos-ambientais', 'Impactos ambientais', '🌡️']] },
      { id: 'bio2', nome: 'Citologia e bioquímica celular', sobre: 'A base estrutural e energética dos seres vivos.', teste: true, aulas: [
        ['bioquimica', 'Água, sais e moléculas da vida', '🧪'], ['membrana', 'Membrana e transportes', '🫧'], ['organelas', 'Organelas', '🏭'],
        ['metabolismo-energetico', 'Respiração e fermentação', '⚡'], ['fotossintese', 'Fotossíntese', '🌿']] },
      { id: 'bio3', nome: 'Genética e biologia molecular', sobre: 'Raciocínio lógico, heredogramas e código genético.', teste: true, aulas: [
        ['sintese-proteica', 'DNA, RNA e síntese de proteínas', '🧬'], ['mendel', 'Leis de Mendel', '🫛'],
        ['sangue-heranca', 'Sangue (ABO e Rh) e herança ligada ao sexo', '🩸'], ['biotecnologia', 'Biotecnologia', '🔬']] },
      { id: 'bio4', nome: 'Evolução e filogenia', sobre: 'Como as espécies mudam e como ler árvores evolutivas.', aulas: [
        ['teorias-evolutivas', 'Lamarck e Darwin', '🦒'], ['neodarwinismo', 'Teoria sintética da evolução', '🧩'],
        ['especiacao', 'Especiação e órgãos homólogos', '🐦'], ['filogenia', 'Cladogramas', '🌳']] },
      { id: 'bio5', nome: 'Fisiologia humana', sobre: 'Como o corpo mantém o equilíbrio interno.', aulas: [
        ['digestorio', 'Digestão e nutrição', '🍎'], ['respiratorio-circulatorio', 'Respiração e circulação', '🫀'],
        ['excretor-endocrino', 'Rins e hormônios', '🧫'], ['nervoso', 'Sistema nervoso e sentidos', '🧠']] },
      { id: 'bio6', nome: 'Saúde, imunologia e microbiologia', sobre: 'Doenças, prevenção e defesa do organismo.', aulas: [
        ['microbiologia', 'Vírus, bactérias, protozoários e fungos', '🦠'], ['imunologia', 'Sistema imune', '🛡️'],
        ['vacinas-soros', 'Vacina ou soro?', '💉'], ['ists', 'ISTs', '🩺']] },
      { id: 'bio7', nome: 'Botânica, zoologia e biodiversidade', sobre: 'Os grandes grupos de seres vivos e suas adaptações.', aulas: [
        ['botanica', 'Botânica', '🌳'], ['zoologia', 'Zoologia', '🐸'], ['parasitologia', 'Verminoses e parasitas', '🪱']] }
    ] },
    quimica: { nome: 'Química', icone: '⚗️', modulos: [
      { id: 'qui1', nome: 'Química geral e estrutura da matéria', sobre: 'A base para entender propriedades e interações das substâncias.', teste: true, aulas: [
        ['atomo', 'Átomo, íons e isótopos', '⚛️'], ['tabela-periodica', 'Tabela periódica', '🗂️'],
        ['ligacoes', 'Ligações químicas', '🔗'], ['forcas-intermoleculares', 'Polaridade e forças intermoleculares', '💧']] },
      { id: 'qui2', nome: 'Estequiometria e soluções', sobre: 'Os cálculos que aparecem em toda a Química do ENEM.', aulas: [
        ['mol', 'Mol e massa molar', '⚖️'], ['estequiometria', 'Cálculo estequiométrico', '🧮'],
        ['concentracao', 'Concentração das soluções', '🥤'], ['diluicao', 'Diluição e mistura', '🫗']] },
      { id: 'qui3', nome: 'Físico-química', sobre: 'Calor, velocidade das reações e equilíbrio.', aulas: [
        ['termoquimica', 'Termoquímica', '🔥'], ['cinetica', 'Cinética química', '⏱️'],
        ['equilibrio', 'Equilíbrio químico', '⚖️'], ['ph', 'pH e equilíbrio iônico', '🍋']] },
      { id: 'qui4', nome: 'Eletroquímica', sobre: 'Baterias, corrosão e indústria.', aulas: [
        ['oxirreducao', 'Oxirredução', '🔄'], ['pilhas', 'Pilhas e baterias', '🔋'],
        ['eletrolise', 'Eletrólise', '⚡'], ['corrosao', 'Corrosão e proteção', '🛠️']] },
      { id: 'qui5', nome: 'Química orgânica I', sobre: 'Cadeias de carbono, funções e propriedades.', aulas: [
        ['carbono', 'O carbono e as cadeias', '⬡'], ['funcoes-organicas', 'Funções orgânicas', '🏷️'], ['propriedades-organicas', 'Propriedades dos compostos orgânicos', '🌡️']] },
      { id: 'qui6', nome: 'Química orgânica II', sobre: 'Isomeria, reações e polímeros.', aulas: [
        ['isomeria-plana', 'Isomeria plana', '🔀'], ['isomeria-espacial', 'Isomeria espacial', '🪞'],
        ['reacoes-organicas', 'Reações orgânicas', '🧪'], ['polimeros', 'Polímeros', '🧴']] },
      { id: 'qui7', nome: 'Química ambiental e tópicos especiais', sobre: 'A Química do cotidiano e das notícias.', teste: true, aulas: [
        ['quimica-ambiental', 'Química ambiental', '🌍'], ['tratamento-agua', 'Tratamento de água e esgoto', '🚰'],
        ['combustiveis', 'Combustíveis e energia', '⛽'], ['radioatividade', 'Radioatividade', '☢️']] }
    ] }
  }
};
