// Resolução comentada: o passo a passo de uma questão, escrito pela equipe.
//
// O aluno vê depois de responder. Administradores escrevem pelo próprio site
// (na questão respondida ou na lista "Mais erradas" da Administração). O
// arquivo resolucoes.json ("2024-150": "texto") também é gravado a cada início,
// sem passar por cima do que já foi escrito pelo site.

const TAMANHO_MAXIMO = 6000;
const idValido = v => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

// "2024-150" ou "2023-3-ingles" -> { ano, numero, lingua }
function lerChave(chave) {
  const m = String(chave).match(/^(\d{4})-(\d{1,3})(?:-(ingles|espanhol))?$/);
  return m ? { ano: Number(m[1]), numero: Number(m[2]), lingua: m[3] || null } : null;
}

async function gravarResolucoesDoArquivo(pool, arquivo = require('./resolucoes.json')) {
  let n = 0;
  for (const [chave, texto] of Object.entries(arquivo)) {
    const c = lerChave(chave);
    if (!c || !texto) continue;
    const r = await pool.query(
      `INSERT INTO resolucoes (questao_id, texto)
       SELECT id, $4 FROM questoes WHERE ano = $1 AND numero = $2 AND lingua IS NOT DISTINCT FROM $3
       ON CONFLICT (questao_id) DO NOTHING`, [c.ano, c.numero, c.lingua, String(texto).slice(0, TAMANHO_MAXIMO)]);
    n += r.rowCount;
  }
  return n;
}

function registrarResolucoes(app, { pool, exigirModerador }) {
  app.get('/api/questoes/:id/resolucao', async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT r.texto, r.updated_at, u.username AS autor FROM resolucoes r LEFT JOIN usuarios u ON u.id = r.autor_id
          WHERE r.questao_id = $1`, [idValido(req.params.id)]);
      res.json({ resolucao: rows[0] || null });
    } catch (erro) {
      console.error('Erro ao ler resolução:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar a resolução agora.' });
    }
  });

  app.put('/api/admin/resolucoes/:id', exigirModerador, async (req, res) => {
    const id = idValido(req.params.id);
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!id) return res.status(404).json({ error: 'Questão não encontrada.' });
    if (texto.length > TAMANHO_MAXIMO) return res.status(400).json({ error: `A resolução pode ter até ${TAMANHO_MAXIMO} caracteres.` });
    try {
      if (!texto) {
        await pool.query('DELETE FROM resolucoes WHERE questao_id = $1', [id]);
        return res.json({ message: 'Resolução apagada.' });
      }
      await pool.query(
        `INSERT INTO resolucoes (questao_id, texto, autor_id) VALUES ($1, $2, $3)
         ON CONFLICT (questao_id) DO UPDATE SET texto = EXCLUDED.texto, autor_id = EXCLUDED.autor_id, updated_at = NOW()`,
        [id, texto, req.usuario.id]);
      res.json({ message: 'Resolução salva: os alunos já veem depois de responder.' });
    } catch (erro) {
      console.error('Erro ao salvar resolução:', erro.message);
      res.status(500).json({ error: erro.code === '23503' ? 'Questão não encontrada.' : 'Não consegui salvar agora.' });
    }
  });

  // As que mais erram (com ao menos 10 respostas): é por elas que vale começar.
  app.get('/api/admin/mais-erradas', exigirModerador, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT q.id, q.ano, q.numero, q.lingua, q.disciplina, q.contexto, q.alternativas, q.correta,
                COUNT(r.id)::int AS respostas, ROUND(100 * AVG(CASE WHEN r.acertou THEN 1 ELSE 0 END))::int AS acerto,
                s.texto AS resolucao
           FROM questoes q JOIN respostas r ON r.questao_id = q.id
           LEFT JOIN resolucoes s ON s.questao_id = q.id
          GROUP BY q.id, s.texto
         HAVING COUNT(r.id) >= 10
          ORDER BY AVG(CASE WHEN r.acertou THEN 1 ELSE 0 END), COUNT(r.id) DESC
          LIMIT 40`);
      const total = (await pool.query('SELECT COUNT(*)::int AS n FROM resolucoes')).rows[0].n;
      res.json({ questoes: rows, com_resolucao: total });
    } catch (erro) {
      console.error('Erro ao listar mais erradas:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });
}

module.exports = registrarResolucoes;
module.exports.gravarResolucoesDoArquivo = gravarResolucoesDoArquivo;
module.exports.lerChave = lerChave;
