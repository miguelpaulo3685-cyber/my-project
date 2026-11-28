// Rumo ao curso: a pessoa escolhe o curso (e, se quiser, a faculdade) e a
// nota de corte dele. O "nível" é a distância entre a nota dela e esse corte,
// no lugar de XP: é um número real, que diz se ela passaria hoje.
//
// Nota do rumo: média das melhores notas TRI de cada área (tri_recordes) e da
// melhor redação corrigida. Só vale com pelo menos 3 das 5 notas, senão uma
// área boa sozinha já "passaria" em qualquer curso.
//
// Competição: rankings do mesmo curso (quem está mais perto do corte), geral
// (% do caminho), da escola e da semana (quem mais subiu de segunda a domingo).
// Quem mais subiu na semana passada ganha emblema. Recompensas só visuais.
//
// As notas de corte da lista são APROXIMADAS (média das federais no SISU,
// ampla concorrência). A pessoa pode ajustar para a faculdade dela.

const imagens = require('./imagens');
const { podeVerNotasSql } = require('./privacidade-notas');
const { registrarAtividade } = require('./comunidade');

const CURSOS = [
  ['medicina', 'Medicina', 790], ['odontologia', 'Odontologia', 740], ['veterinaria', 'Medicina Veterinária', 730],
  ['direito', 'Direito', 730], ['relacoes-internacionais', 'Relações Internacionais', 730], ['psicologia', 'Psicologia', 720],
  ['eng-computacao', 'Engenharia de Computação', 730], ['computacao', 'Ciência da Computação', 720],
  ['eng-civil', 'Engenharia Civil', 700], ['eng-mecanica', 'Engenharia Mecânica', 710], ['eng-eletrica', 'Engenharia Elétrica', 710],
  ['eng-producao', 'Engenharia de Produção', 700], ['arquitetura', 'Arquitetura e Urbanismo', 710], ['fisioterapia', 'Fisioterapia', 700],
  ['enfermagem', 'Enfermagem', 690], ['nutricao', 'Nutrição', 690], ['farmacia', 'Farmácia', 690], ['economia', 'Economia', 690],
  ['jornalismo', 'Jornalismo', 690], ['publicidade', 'Publicidade e Propaganda', 690], ['administracao', 'Administração', 680],
  ['sistemas', 'Sistemas de Informação', 680], ['contabeis', 'Ciências Contábeis', 670], ['biologia', 'Ciências Biológicas', 660],
  ['agronomia', 'Agronomia', 650], ['educacao-fisica', 'Educação Física', 650], ['historia', 'História', 650],
  ['quimica', 'Química', 640], ['letras', 'Letras', 640], ['fisica', 'Física', 630], ['matematica', 'Matemática', 630],
  ['geografia', 'Geografia', 630], ['pedagogia', 'Pedagogia', 620]
].map(([id, nome, corte]) => ({ id, nome, corte }));
const CURSO_POR_ID = new Map(CURSOS.map(c => [c.id, c]));

const AREAS = ['linguagens', 'ciencias-humanas', 'ciencias-natureza', 'matematica'];
const MINIMO_DE_NOTAS = 3; // de 5 (4 áreas + redação)
const CORTE_MIN = 300, CORTE_MAX = 1000;

// Marcos do caminho (faltam X pontos ou menos). Cada um vira um emblema.
// O primeiro vem ao liberar a nota (3 das 5 notas), para ninguém começar sem nada.
const MARCOS = [
  { id: 'rumo_inicio', falta: Infinity, emoji: '👣', nome: 'Primeiro passo' },
  { id: 'rumo_200', falta: 200, emoji: '🗺️', nome: 'Na estrada' },
  { id: 'rumo_100', falta: 100, emoji: '🧭', nome: 'Na rota' },
  { id: 'rumo_50', falta: 50, emoji: '🔥', nome: 'Reta final' },
  { id: 'rumo_20', falta: 20, emoji: '🏁', nome: 'Quase lá' },
  { id: 'rumo_passou', falta: 0, emoji: '🎓', nome: 'Hoje eu passaria' }
];
const EMBLEMAS_DA_SEMANA = { campeao: 'rumo_campeao', podio: 'rumo_podio' };

// Segunda-feira desta semana (e da anterior) no horário de Brasília, como data do banco.
const SEGUNDA = "date_trunc('week', NOW() - INTERVAL '3 hours')::date";
const HOJE = "(NOW() - INTERVAL '3 hours')::date";

// Nota do rumo de cada pessoa: média das melhores notas por área e da melhor redação.
// Redação: a nota da IA, ou a média das correções da comunidade (sem as anuladas).
const NOTAS_SQL = `
  SELECT usuario_id, ROUND(AVG(nota))::int AS nota, COUNT(*)::int AS partes FROM (
    SELECT usuario_id, nota::numeric AS nota FROM tri_recordes WHERE area = ANY('{${AREAS.join(',')}}'::text[])
    UNION ALL
    SELECT r.usuario_id, MAX(COALESCE(
      CASE WHEN r.ia_status = 'pronta' AND r.ia_anulada IS NULL THEN (SELECT SUM(x) FROM unnest(r.ia_notas) x) END,
      (SELECT AVG((SELECT SUM(y) FROM unnest(c.notas) y)) FROM redacoes_correcoes c
        WHERE c.redacao_id = r.id AND c.anulada IS NULL AND NOT c.oculto))) AS nota
      FROM redacoes r WHERE NOT r.oculto GROUP BY r.usuario_id
  ) p WHERE nota IS NOT NULL GROUP BY usuario_id`;

// Quanto cada um subiu numa semana: última nota da semana menos a última de antes dela
// (ou, para quem começou nessa semana, a primeira da semana).
const SUBIDA_SQL = inicio => `
  SELECT f.usuario_id, f.nota - COALESCE(a.nota, p.nota) AS subida FROM
    (SELECT DISTINCT ON (usuario_id) usuario_id, nota FROM rumo_historico
      WHERE dia >= ${inicio} AND dia < ${inicio} + 7 ORDER BY usuario_id, dia DESC) f
    LEFT JOIN (SELECT DISTINCT ON (usuario_id) usuario_id, nota FROM rumo_historico
      WHERE dia < ${inicio} ORDER BY usuario_id, dia DESC) a USING (usuario_id)
    LEFT JOIN (SELECT DISTINCT ON (usuario_id) usuario_id, nota FROM rumo_historico
      WHERE dia >= ${inicio} AND dia < ${inicio} + 7 ORDER BY usuario_id, dia ASC) p USING (usuario_id)`;

// ---------- contas puras (testadas em test/rumo.test.js) ----------

// Situação de quem tem nota N e quer um curso de corte C.
function situacao(nota, partes, corte) {
  if (nota === null || nota === undefined || partes < MINIMO_DE_NOTAS) {
    return { valida: false, faltam_notas: MINIMO_DE_NOTAS - (partes || 0) };
  }
  const falta = corte - nota;
  const pct = Math.max(0, Math.min(100, Math.round(100 * nota / corte)));
  return { valida: true, falta, pct, passou: falta <= 0 };
}

// Marcos já alcançados para quem está a "falta" pontos do corte.
function marcosAlcancados(falta) {
  if (falta === null || falta === undefined) return [];
  return MARCOS.filter(m => falta <= m.falta).map(m => m.id);
}

// Limpa o que a pessoa mandou ao escolher a meta. Devolve { erro } ou a meta pronta.
function validarMeta(corpo = {}) {
  const curso = CURSO_POR_ID.get(String(corpo.curso || ''));
  if (!curso) return { erro: 'Escolha um curso da lista.' };
  const faculdade = String(corpo.faculdade || '').normalize('NFC')
    .replace(/[^\p{L}\p{N} .,'()&/-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const corte = corpo.nota_corte === undefined || corpo.nota_corte === null || corpo.nota_corte === ''
    ? curso.corte : Math.round(Number(corpo.nota_corte));
  if (!Number.isFinite(corte) || corte < CORTE_MIN || corte > CORTE_MAX) {
    return { erro: `A nota de corte precisa ficar entre ${CORTE_MIN} e ${CORTE_MAX}.` };
  }
  return { curso: curso.id, faculdade: faculdade || null, nota_corte: corte };
}

// Posições com empate (1, 2, 2, 4...) numa lista já ordenada.
function comPosicoes(lista, chave) {
  let anterior, pos = 0;
  return lista.map((l, i) => {
    if (i === 0 || chave(l) !== anterior) pos = i + 1;
    anterior = chave(l);
    return { ...l, posicao: pos };
  });
}

// ---------- banco ----------

async function notaDe(pool, usuarioId) {
  const { rows } = await pool.query(`SELECT nota, partes FROM (${NOTAS_SQL}) n WHERE usuario_id = $1`, [usuarioId]);
  return rows[0] || { nota: null, partes: 0 };
}

// Quais das 5 notas a pessoa já tem (para mostrar o que falta fazer).
async function partesDe(pool, usuarioId) {
  const { rows } = await pool.query(`SELECT area, nota FROM tri_recordes WHERE usuario_id = $1 AND area = ANY($2::text[])`, [usuarioId, AREAS]);
  const porArea = new Map(rows.map(r => [r.area, r.nota]));
  const red = (await pool.query(`SELECT nota FROM (${NOTAS_SQL.replace('tri_recordes WHERE', 'tri_recordes WHERE FALSE AND')}) n WHERE usuario_id = $1`, [usuarioId])).rows[0];
  return [...AREAS.map(a => ({ parte: a, nota: porArea.has(a) ? porArea.get(a) : null })), { parte: 'redacao', nota: red ? red.nota : null }];
}

// Guarda a nota de hoje de quem tem meta (base da subida da semana) e entrega os emblemas
// dos marcos. Chamado depois de cada nota TRI nova e quando a pessoa abre o Rumo.
async function anotar(pool, usuarioId) {
  const meta = (await pool.query('SELECT curso, nota_corte FROM rumo_metas WHERE usuario_id = $1', [usuarioId])).rows[0];
  if (!meta) return null;
  const { nota, partes } = await notaDe(pool, usuarioId);
  const s = situacao(nota, partes, meta.nota_corte);
  if (!s.valida) return { meta, nota, partes, situacao: s, novos: [] };
  await pool.query(
    `INSERT INTO rumo_historico (usuario_id, dia, nota) VALUES ($1, ${HOJE}, $2)
     ON CONFLICT (usuario_id, dia) DO UPDATE SET nota = EXCLUDED.nota`, [usuarioId, nota]);
  const novos = [];
  for (const id of marcosAlcancados(s.falta)) {
    const r = await pool.query('INSERT INTO arena_itens (usuario_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING', [usuarioId, id]);
    if (r.rowCount) novos.push(id);
  }
  // Só o marco mais alto conquistado agora vai para a comunidade comemorar.
  if (novos.length) {
    const curso = (CURSO_POR_ID.get(meta.curso) || {}).nome || 'o curso';
    await registrarAtividade(pool, { usuarioId, tipo: 'rumo', texto: `${novos[novos.length - 1]}|${curso}` });
  }
  return { meta, nota, partes, situacao: s, novos };
}

// Campeões da semana passada: calculados uma vez, na primeira visita da semana nova.
async function garantirCampeoes(pool) {
  const ja = await pool.query(`SELECT 1 FROM rumo_campeoes WHERE semana = ${SEGUNDA} - 7 LIMIT 1`);
  if (ja.rowCount) return;
  const { rows } = await pool.query(
    `SELECT s.usuario_id, s.subida FROM (${SUBIDA_SQL(`(${SEGUNDA} - 7)`)}) s
      JOIN rumo_metas m ON m.usuario_id = s.usuario_id
     WHERE s.subida > 0 ORDER BY s.subida DESC, s.usuario_id LIMIT 3`);
  // Linha com posição 0 marca "semana já calculada", mesmo sem ninguém no pódio.
  await pool.query(`INSERT INTO rumo_campeoes (semana, posicao, usuario_id, subida) VALUES (${SEGUNDA} - 7, 0, NULL, 0)
                    ON CONFLICT DO NOTHING`);
  for (const [i, r] of rows.entries()) {
    const ok = await pool.query(
      `INSERT INTO rumo_campeoes (semana, posicao, usuario_id, subida) VALUES (${SEGUNDA} - 7, $1, $2, $3) ON CONFLICT DO NOTHING`,
      [i + 1, r.usuario_id, r.subida]);
    if (!ok.rowCount) continue;
    const item = i === 0 ? EMBLEMAS_DA_SEMANA.campeao : EMBLEMAS_DA_SEMANA.podio;
    await pool.query('INSERT INTO arena_itens (usuario_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING', [r.usuario_id, item]);
    await registrarAtividade(pool, { usuarioId: r.usuario_id, tipo: 'rumo', texto: `${i === 0 ? 'campeao' : 'podio'}|${r.subida}` });
  }
}

const TIPOS_DE_RANKING = ['curso', 'geral', 'semana', 'escola'];

function registrarRumo(app, { pool, auth, limitar, exigirLogin }) {
  const freio = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Muitas trocas de meta. Espere um pouco.', req => `u${req.usuario.id}`);

  const marcoParaJson = m => ({ ...m, falta: Number.isFinite(m.falta) ? m.falta : null });
  app.get('/api/rumo/cursos', (req, res) => res.json({ cursos: CURSOS, minimo_de_notas: MINIMO_DE_NOTAS, marcos: MARCOS.map(marcoParaJson) }));

  // Minha meta, minha nota e os marcos.
  app.get('/api/rumo', exigirLogin, async (req, res) => {
    try {
      garantirCampeoes(pool).catch(e => console.error('Erro nos campeões do rumo:', e.message));
      const r = await anotar(pool, req.usuario.id);
      if (!r) return res.json({ meta: null });
      const curso = CURSO_POR_ID.get(r.meta.curso);
      const meta = (await pool.query('SELECT curso, faculdade, nota_corte FROM rumo_metas WHERE usuario_id = $1', [req.usuario.id])).rows[0];
      const tem = new Set((await pool.query(`SELECT item FROM arena_itens WHERE usuario_id = $1 AND item LIKE 'rumo_%'`, [req.usuario.id])).rows.map(x => x.item));
      const subida = r.situacao.valida ? (await pool.query(
        `SELECT subida FROM (${SUBIDA_SQL(SEGUNDA)}) s WHERE usuario_id = $1`, [req.usuario.id])).rows[0] : null;
      res.json({
        meta: { ...meta, curso_nome: curso ? curso.nome : meta.curso, corte_sugerido: curso ? curso.corte : null },
        nota: r.nota, partes: r.partes, ...r.situacao,
        subida_semana: subida ? subida.subida : 0,
        marcos: MARCOS.map(m => ({ ...marcoParaJson(m), tem: tem.has(m.id) })),
        partes_detalhe: await partesDe(pool, req.usuario.id),
        novos: r.novos,
        semana: { campeao: tem.has(EMBLEMAS_DA_SEMANA.campeao), podio: tem.has(EMBLEMAS_DA_SEMANA.podio) }
      });
    } catch (erro) {
      console.error('Erro ao abrir o rumo:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar o seu rumo agora.' });
    }
  });

  app.put('/api/rumo', exigirLogin, freio, async (req, res) => {
    const m = validarMeta(req.body);
    if (m.erro) return res.status(400).json({ error: m.erro });
    try {
      await pool.query(
        `INSERT INTO rumo_metas (usuario_id, curso, faculdade, nota_corte) VALUES ($1, $2, $3, $4)
         ON CONFLICT (usuario_id) DO UPDATE SET curso = EXCLUDED.curso, faculdade = EXCLUDED.faculdade,
           nota_corte = EXCLUDED.nota_corte, updated_at = NOW()`,
        [req.usuario.id, m.curso, m.faculdade, m.nota_corte]);
      res.json({ ok: true });
    } catch (erro) {
      console.error('Erro ao salvar o rumo:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar a sua meta agora.' });
    }
  });

  app.delete('/api/rumo', exigirLogin, async (req, res) => {
    try {
      await pool.query('DELETE FROM rumo_metas WHERE usuario_id = $1', [req.usuario.id]);
      res.json({ ok: true });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui tirar a meta agora.' });
    }
  });

  // Rankings. Quem escolheu esconder as notas conta na posição, mas aparece sem nome nem foto.
  app.get('/api/rumo/ranking', exigirLogin, async (req, res) => {
    const tipo = TIPOS_DE_RANKING.includes(req.query.tipo) ? req.query.tipo : 'curso';
    const eu = req.usuario.id;
    try {
      await anotar(pool, eu);
      const minha = (await pool.query(
        'SELECT m.curso, u.escola_chave FROM rumo_metas m JOIN usuarios u ON u.id = m.usuario_id WHERE m.usuario_id = $1', [eu])).rows[0];
      if (!minha) return res.json({ tipo, ranking: [], minha: null, total: 0, sem_meta: true });
      if (tipo === 'escola' && !minha.escola_chave) return res.json({ tipo, ranking: [], minha: null, total: 0, sem_escola: true });
      const { rows } = await pool.query(
        `SELECT m.usuario_id, m.curso, m.faculdade, m.nota_corte, n.nota, n.partes, COALESCE(s.subida, 0) AS subida,
                u.username AS nome, u.foto_id, u.emblema, ${podeVerNotasSql('$1::int', 'u')} AS visivel
           FROM rumo_metas m
           JOIN usuarios u ON u.id = m.usuario_id
           JOIN (${NOTAS_SQL}) n ON n.usuario_id = m.usuario_id
           LEFT JOIN (${SUBIDA_SQL(SEGUNDA)}) s ON s.usuario_id = m.usuario_id
          WHERE n.partes >= ${MINIMO_DE_NOTAS}
            AND ($2 <> 'curso' OR m.curso = $3)
            AND ($2 <> 'escola' OR u.escola_chave = $4)
            AND ($2 <> 'semana' OR COALESCE(s.subida, 0) > 0 OR m.usuario_id = $1)`,
        [eu, tipo, minha.curso, minha.escola_chave]);
      const linhas = rows.map(r => ({ ...r, ...situacao(r.nota, r.partes, r.nota_corte) }));
      const ordem = {
        curso: (a, b) => a.falta - b.falta,
        semana: (a, b) => b.subida - a.subida || b.pct - a.pct,
        geral: (a, b) => b.pct - a.pct || a.falta - b.falta,
        escola: (a, b) => b.pct - a.pct || a.falta - b.falta
      }[tipo];
      const chave = { curso: l => l.falta, semana: l => l.subida, geral: l => l.pct, escola: l => l.pct }[tipo];
      const ordenadas = comPosicoes(linhas.sort((a, b) => ordem(a, b) || a.usuario_id - b.usuario_id), chave);
      const campeoes = new Map((await pool.query(
        `SELECT usuario_id, posicao FROM rumo_campeoes WHERE semana = ${SEGUNDA} - 7 AND posicao > 0`)).rows.map(r => [r.usuario_id, r.posicao]));
      const linha = l => {
        const base = { posicao: l.posicao, falta: l.falta, pct: l.pct, passou: l.passou, subida: l.subida,
          curso: (CURSO_POR_ID.get(l.curso) || {}).nome || l.curso, campeao: campeoes.get(l.usuario_id) || null };
        return l.visivel || l.usuario_id === eu
          ? { ...base, id: l.usuario_id, nome: l.nome, faculdade: l.faculdade, foto: imagens.urlAssinada(l.foto_id),
              emblema: (require('./arena').ITEM_POR_ID.get(l.emblema) || {}).emoji || null, eu: l.usuario_id === eu }
          : { ...base, id: null, nome: 'Estudante', anonimo: true, faculdade: null, foto: null, eu: false };
      };
      const minhaLinha = ordenadas.find(l => l.usuario_id === eu);
      res.json({ tipo, ranking: ordenadas.slice(0, 50).map(linha), minha: minhaLinha ? linha(minhaLinha) : null, total: ordenadas.length });
    } catch (erro) {
      console.error('Erro no ranking do rumo:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar o ranking agora.' });
    }
  });
}

module.exports = registrarRumo;
Object.assign(module.exports, {
  CURSOS, MARCOS, MINIMO_DE_NOTAS, EMBLEMAS_DA_SEMANA, NOTAS_SQL, situacao, marcosAlcancados, validarMeta, comPosicoes, anotar
});
