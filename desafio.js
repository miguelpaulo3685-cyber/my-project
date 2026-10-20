// Desafio da semana: as mesmas 10 questões para todo mundo, de segunda a
// domingo (horário de Brasília), uma tentativa por pessoa e ranking.
//
// Diferente do treino, o gabarito não vai para o navegador antes da entrega:
// a correção é no servidor, senão o ranking seria fácil de fraudar.

const tri = require('./tri');
const imagens = require('./imagens');
const { registrarAtividade } = require('./comunidade');

// Composição: 2 de Linguagens, 3 de Humanas, 2 de Natureza e 3 de Matemática,
// só questões com parâmetros do INEP (para sair nota TRI) e sem língua estrangeira.
const COMPOSICAO = [['linguagens', 2], ['ciencias-humanas', 3], ['ciencias-natureza', 2], ['matematica', 3]];
const BRASILIA = -3 * 3600 * 1000; // o Brasil não tem horário de verão desde 2019

// Semana ISO no horário de Brasília: "2026-W43".
function semanaDe(data = new Date()) {
  const d = new Date(data.getTime() + BRASILIA);
  const dia = (d.getUTCDay() + 6) % 7; // segunda = 0
  const quinta = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dia + 3));
  const ano = quinta.getUTCFullYear();
  // A semana 1 é a que tem a primeira quinta-feira do ano.
  const jan4 = new Date(Date.UTC(ano, 0, 4));
  const primeiraQuinta = Date.UTC(ano, 0, 4 - ((jan4.getUTCDay() + 6) % 7) + 3);
  const semana = 1 + Math.round((quinta - primeiraQuinta) / (7 * 86400000));
  return `${ano}-W${String(semana).padStart(2, '0')}`;
}

// Quando o desafio atual acaba: próxima segunda, 00:00 em Brasília.
function fimDaSemana(data = new Date()) {
  const d = new Date(data.getTime() + BRASILIA);
  const dia = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dia + 7) - BRASILIA);
}

function registrarDesafio(app, { pool, auth, limitar, exigirLogin }) {
  const freio = limitar(auth.criarFreio(10, 60 * 60 * 1000), 'Muitas tentativas. Espere um pouco.', req => `u${req.usuario.id}`);

  // Sorteia as questões na primeira visita da semana; quem chegar depois
  // recebe as mesmas (ON CONFLICT resolve dois sorteios ao mesmo tempo).
  async function desafioDa(semana) {
    const atual = await pool.query('SELECT questoes FROM desafios WHERE semana = $1', [semana]);
    if (atual.rows[0]) return atual.rows[0].questoes;
    const ids = [];
    for (const [disciplina, n] of COMPOSICAO) {
      const { rows } = await pool.query(
        `SELECT id FROM questoes WHERE disciplina = $1 AND lingua IS NULL AND tri_b IS NOT NULL
          ORDER BY RANDOM() LIMIT $2`, [disciplina, n]
      );
      ids.push(...rows.map(r => r.id));
    }
    const total = COMPOSICAO.reduce((t, [, n]) => t + n, 0);
    if (ids.length < total) {
      // Faltou questão com parâmetros do INEP: completa com outras.
      const { rows } = await pool.query(
        'SELECT id FROM questoes WHERE lingua IS NULL AND NOT (id = ANY($1::int[])) ORDER BY RANDOM() LIMIT $2', [ids, total - ids.length]
      );
      ids.push(...rows.map(r => r.id));
    }
    await pool.query('INSERT INTO desafios (semana, questoes) VALUES ($1, $2) ON CONFLICT DO NOTHING', [semana, ids]);
    return (await pool.query('SELECT questoes FROM desafios WHERE semana = $1', [semana])).rows[0].questoes;
  }

  async function questoesDoDesafio(ids, comGabarito) {
    const { rows } = await pool.query(
      `SELECT id, disciplina, ano, contexto, alternativas, correta, tri_a, tri_b, tri_c FROM questoes WHERE id = ANY($1::int[])`, [ids]
    );
    const porId = new Map(rows.map(q => [q.id, q]));
    return ids.map(id => porId.get(id)).filter(Boolean).map(q => ({
      id: q.id, disciplina: q.disciplina, ano: q.ano, contexto: q.contexto, alternativas: q.alternativas,
      ...(comGabarito ? { correta: q.correta } : {}), _tri: { a: q.tri_a, b: q.tri_b, c: q.tri_c, correta: q.correta }
    }));
  }
  const semTri = q => { const { _tri, ...resto } = q; return resto; };

  app.get('/api/desafio', async (req, res) => {
    const semana = semanaDe();
    try {
      const ids = await desafioDa(semana);
      const meu = req.usuario ? (await pool.query(
        'SELECT acertos, nota, segundos, respostas FROM desafio_resultados WHERE semana = $1 AND usuario_id = $2', [semana, req.usuario.id]
      )).rows[0] : null;
      const participantes = (await pool.query('SELECT COUNT(*)::int AS n FROM desafio_resultados WHERE semana = $1', [semana])).rows[0].n;
      // O gabarito só aparece para quem já entregou.
      const questoes = (await questoesDoDesafio(ids, Boolean(meu))).map(semTri);
      res.json({ semana, termina_em: fimDaSemana(), participantes, questoes, meu: meu || null });
    } catch (erro) {
      console.error('Erro ao abrir desafio:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir o desafio agora.' });
    }
  });

  app.post('/api/desafio', exigirLogin, freio, async (req, res) => {
    const semana = semanaDe();
    const enviadas = req.body?.respostas && typeof req.body.respostas === 'object' ? req.body.respostas : {};
    const segundos = Math.min(7200, Math.max(1, Math.round(Number(req.body?.segundos) || 0)));
    try {
      const ids = await desafioDa(semana);
      const questoes = await questoesDoDesafio(ids, true);
      const respostas = {};
      let acertos = 0;
      const itensTri = [];
      for (const q of questoes) {
        const escolha = Number(enviadas[q.id]);
        const respondeu = Number.isInteger(escolha) && escolha >= 0 && escolha <= 4;
        if (respondeu) respostas[q.id] = escolha;
        const acertou = respondeu && escolha === q._tri.correta;
        if (acertou) acertos++;
        if (q._tri.b !== null) itensTri.push({ a: q._tri.a, b: q._tri.b, c: q._tri.c, acertou });
      }
      const nota = itensTri.length >= tri.MINIMO_PARA_NOTA ? tri.estimarNota(itensTri).nota : null;
      const r = await pool.query(
        `INSERT INTO desafio_resultados (semana, usuario_id, acertos, nota, segundos, respostas)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [semana, req.usuario.id, acertos, nota, segundos, JSON.stringify(respostas)]
      );
      if (r.rowCount === 0) return res.status(409).json({ error: 'Você já fez o desafio desta semana. Volte na segunda para o próximo!' });
      await registrarAtividade(pool, { usuarioId: req.usuario.id, tipo: 'desafio', texto: `${acertos}/${questoes.length}`, alvoId: acertos });
      res.status(201).json({ acertos, total: questoes.length, nota, segundos, respostas, questoes: questoes.map(semTri) });
    } catch (erro) {
      console.error('Erro ao entregar desafio:', erro.message);
      res.status(500).json({ error: 'Não consegui registrar o desafio agora.' });
    }
  });

  // Ranking: geral, só de quem você segue ou de um grupo seu.
  app.get('/api/desafio/ranking', async (req, res) => {
    const semana = /^\d{4}-W\d{2}$/.test(req.query.semana || '') ? req.query.semana : semanaDe();
    const eu = req.usuario;
    const filtro = String(req.query.filtro || 'geral');
    const grupoId = /^grupo:\d+$/.test(filtro) ? Number(filtro.split(':')[1]) : null;
    if ((filtro === 'seguindo' || grupoId) && !eu) return res.status(401).json({ error: 'Entre na sua conta para ver esse ranking.' });
    try {
      if (grupoId) {
        const membro = await pool.query('SELECT 1 FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2', [grupoId, eu.id]);
        if (!membro.rowCount) return res.status(403).json({ error: 'Você não faz parte desse grupo.' });
      }
      const { rows } = await pool.query(
        `SELECT r.usuario_id, r.acertos, r.nota, r.segundos, u.username AS nome, u.foto_id,
                RANK() OVER (ORDER BY r.acertos DESC, r.nota DESC NULLS LAST, r.segundos ASC) AS posicao
           FROM desafio_resultados r JOIN usuarios u ON u.id = r.usuario_id
          WHERE r.semana = $1
            AND ($2 <> 'seguindo' OR r.usuario_id = $3 OR r.usuario_id IN (SELECT seguido_id FROM seguidores WHERE seguidor_id = $3))
            AND ($4::int IS NULL OR r.usuario_id IN (SELECT usuario_id FROM grupo_membros WHERE grupo_id = $4))
          ORDER BY posicao, r.created_at`,
        [semana, filtro === 'seguindo' ? 'seguindo' : 'geral', eu ? eu.id : null, grupoId]
      );
      const linha = r => ({
        posicao: Number(r.posicao), id: r.usuario_id, nome: r.nome, acertos: r.acertos, nota: r.nota, segundos: r.segundos,
        foto: eu ? imagens.urlAssinada(r.foto_id) : null, eu: Boolean(eu && eu.id === r.usuario_id)
      });
      const minha = eu ? rows.find(r => r.usuario_id === eu.id) : null;
      res.json({ semana, ranking: rows.slice(0, 50).map(linha), minha: minha ? linha(minha) : null, total: rows.length });
    } catch (erro) {
      console.error('Erro no ranking:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar o ranking agora.' });
    }
  });
}

module.exports = registrarDesafio;
module.exports.semanaDe = semanaDe;
module.exports.fimDaSemana = fimDaSemana;
