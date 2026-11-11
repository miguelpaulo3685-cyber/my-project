// "Nas notícias": o que a agência de notícias do governo federal (Agência
// Brasil, da EBC) anda publicando, contado por eixo temático da redação.
//
// De hora em hora o servidor lê o feed público das últimas notícias (sem
// chave), classifica cada título por palavras-chave e guarda só o título, o
// link e o eixo. Aparece ao lado do ranking das Estatísticas como um sinal a
// mais: não entra na conta das chances, porque não dá para testar no passado.
// (Instagram e gov.br não deixam um robô ler; a Agência Brasil publica os
// mesmos assuntos e tem feed aberto.)

const axios = require('axios');

const FEED = 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml';
const DIAS_GUARDADOS = 120;
const DIAS_DO_RESUMO = 30;
const MINIMO_PARA_MOSTRAR = 40; // notícias classificadas; antes disso é cedo para dizer algo

// Palavras sem acento e em minúsculas; valem como palavra inteira (ou começo de expressão).
const PALAVRAS = {
  direitos: ['indigena', 'indigenas', 'quilombola', 'quilombolas', 'racismo', 'racial', 'lgbt', 'lgbtqia', 'pessoas com deficiencia', 'pessoa com deficiencia',
    'idoso', 'idosos', 'idosas', 'refugiado', 'refugiados', 'imigrantes', 'migrantes', 'direitos humanos', 'igualdade', 'inclusao', 'situacao de rua',
    'discriminacao', 'criancas', 'adolescentes', 'mulheres', 'trabalho escravo', 'acessibilidade'],
  tecnologia: ['inteligencia artificial', 'internet', 'redes sociais', 'rede social', 'digital', 'digitais', 'big techs', 'dados pessoais', 'fake news',
    'desinformacao', 'plataformas', 'celular', 'celulares', 'tecnologia', 'ciberseguranca', 'aplicativo', 'aplicativos', 'telas'],
  educacao: ['escola', 'escolas', 'enem', 'educacao', 'professor', 'professores', 'universidade', 'universidades', 'estudante', 'estudantes', 'alfabetizacao',
    'ensino', 'cultura', 'cultural', 'cinema', 'livro', 'livros', 'leitura', 'museu', 'mec', 'vestibular', 'creche', 'creches'],
  cidadania: ['eleicao', 'eleicoes', 'eleitoral', 'voto', 'democracia', 'corrupcao', 'cidadania', 'constituicao', 'tse', 'transparencia', 'impeachment',
    'plebiscito', 'titulo de eleitor', 'reforma politica'],
  saude: ['sus', 'saude', 'vacina', 'vacinas', 'vacinacao', 'hospital', 'hospitais', 'doenca', 'doencas', 'dengue', 'medicamento', 'medicamentos', 'anvisa',
    'obesidade', 'cancer', 'virus', 'epidemia', 'fiocruz', 'transplante', 'transplantes'],
  seguranca: ['violencia', 'feminicidio', 'feminicidios', 'homicidio', 'homicidios', 'policia', 'policial', 'seguranca publica', 'trafico', 'armas', 'presidio',
    'presidios', 'faccao', 'faccoes', 'assalto', 'crime organizado', 'estupro', 'bullying', 'transito'],
  trabalho: ['emprego', 'empregos', 'desemprego', 'salario', 'salario minimo', 'trabalhador', 'trabalhadores', 'renda', 'inflacao', 'endividamento', 'inss',
    'aposentadoria', 'bets', 'apostas', 'pobreza', 'fome', 'bolsa familia', 'informalidade', 'jornada'],
  ambiente: ['clima', 'climatica', 'climaticas', 'climatico', 'desmatamento', 'amazonia', 'queimadas', 'incendios florestais', 'enchente', 'enchentes', 'seca',
    'meio ambiente', 'ambiental', 'sustentabilidade', 'energia limpa', 'lixo', 'reciclagem', 'saneamento', 'poluicao', 'biodiversidade', 'cop']
};

const normalizar = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const PADROES = Object.fromEntries(Object.entries(PALAVRAS).map(([eixo, lista]) =>
  [eixo, lista.map(p => new RegExp(`(^| )${normalizar(p)}( |$)`))]));

// O eixo com mais palavras-chave no texto; sem nenhuma (ou empatado), não classifica.
function classificar(texto) {
  const limpo = normalizar(texto);
  const pontos = Object.entries(PADROES).map(([eixo, padroes]) => [eixo, padroes.filter(p => p.test(limpo)).length]).sort((a, b) => b[1] - a[1]);
  if (!pontos[0][1] || pontos[0][1] === pontos[1][1]) return null;
  return pontos[0][0];
}

const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const semEntidades = t => String(t || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(amp|lt|gt|quot|apos|#39);/g, m => ENTIDADES[m]).trim();
const campo = (item, nome) => semEntidades((item.match(new RegExp(`<${nome}>([\\s\\S]*?)</${nome}>`)) || [])[1]);

// Lê um feed RSS: título, link e data de cada notícia.
function lerFeed(xml) {
  return [...String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const data = new Date(campo(m[1], 'pubDate'));
    return { titulo: campo(m[1], 'title').slice(0, 300), link: campo(m[1], 'link').slice(0, 500), data: isNaN(data) ? null : data };
  }).filter(n => n.titulo && /^https:\/\/agenciabrasil\.ebc\.com\.br\//.test(n.link));
}

async function atualizarNoticias(pool, http = axios) {
  const { data } = await http.get(FEED, { timeout: 20000, responseType: 'text', headers: { 'User-Agent': 'mmestudos.com.br (leitor do feed de noticias)' } });
  let novas = 0;
  for (const n of lerFeed(data)) {
    const r = await pool.query(
      `INSERT INTO noticias_redacao (link, titulo, eixo, publicada_em) VALUES ($1, $2, $3, COALESCE($4, NOW())) ON CONFLICT (link) DO NOTHING`,
      [n.link, n.titulo, classificar(n.titulo), n.data]);
    novas += r.rowCount;
  }
  await pool.query(`DELETE FROM noticias_redacao WHERE publicada_em < NOW() - INTERVAL '${DIAS_GUARDADOS} days'`);
  return novas;
}

// Parte de cada eixo nas notícias classificadas dos últimos 30 dias, com a manchete mais recente.
function resumir(linhas, eixos) {
  const total = linhas.reduce((s, l) => s + l.n, 0);
  if (total < MINIMO_PARA_MOSTRAR) return null;
  const porEixo = Object.fromEntries(linhas.map(l => [l.eixo, l]));
  return {
    dias: DIAS_DO_RESUMO, total,
    eixos: Object.keys(eixos).map(eixo => {
      const l = porEixo[eixo];
      return { eixo, parte: l ? Math.round(l.n / total * 100) : 0, exemplo: l ? { titulo: l.titulo, link: l.link } : null };
    })
  };
}

async function resumoDasNoticias(pool, eixos) {
  const { rows } = await pool.query(
    `SELECT eixo, COUNT(*)::int AS n,
            (ARRAY_AGG(titulo ORDER BY publicada_em DESC))[1] AS titulo, (ARRAY_AGG(link ORDER BY publicada_em DESC))[1] AS link
       FROM noticias_redacao WHERE eixo IS NOT NULL AND publicada_em > NOW() - INTERVAL '${DIAS_DO_RESUMO} days' GROUP BY eixo`);
  return resumir(rows, eixos);
}

module.exports = { classificar, lerFeed, resumir, atualizarNoticias, resumoDasNoticias, normalizar };
