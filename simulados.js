// Histórico de simulados na conta: o aluno vê os que fez em qualquer
// aparelho. Sem conta, o site guarda o histórico só no navegador.

const AREAS = ['linguagens', 'humanas', 'natureza', 'matematica'];
const MAXIMO_NO_HISTORICO = 100;
const TAMANHO_DA_REDACAO = 6000; // 30 linhas cabem com folga

module.exports = function registrarSimulados(app, { pool, auth, limitar, exigirLogin }) {
  const freio = limitar(auth.criarFreio(30, 60 * 60 * 1000), 'Muitos simulados enviados agora. Espere um pouco.', req => `u${req.usuario.id}`);

  app.get('/api/simulados', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, dia, ano, acertos, total, areas, tempo_ms, redacao, created_at
           FROM simulados WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [req.usuario.id, MAXIMO_NO_HISTORICO]
      );
      res.json({ simulados: rows.map(r => ({ ...r, ano: r.ano === 'misto' ? 'misto' : Number(r.ano), data: r.created_at })) });
    } catch (erro) {
      console.error('Erro ao listar simulados:', erro.message);
      res.status(500).json({ error: 'Não consegui buscar seus simulados agora.' });
    }
  });

  app.post('/api/simulados', exigirLogin, freio, async (req, res) => {
    const c = req.body || {};
    const dia = Number(c.dia);
    const ano = c.ano === 'misto' ? 'misto' : Number(c.ano);
    const inteiro = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
    if (![1, 2].includes(dia) || (ano !== 'misto' && !(ano >= 2009 && ano <= 2100))) {
      return res.status(400).json({ error: 'Simulado inválido.' });
    }
    if (!inteiro(c.total, 90) || !inteiro(c.acertos, c.total) || !Array.isArray(c.areas) || c.areas.length > 2) {
      return res.status(400).json({ error: 'Resultado inválido.' });
    }
    // Só os campos esperados de cada área, com tipos conferidos.
    const areas = [];
    for (const a of c.areas) {
      if (!AREAS.includes(a?.area) || !inteiro(a.total, 45) || !inteiro(a.acertos, a.total) || !inteiro(a.brancas ?? 0, a.total)) {
        return res.status(400).json({ error: 'Resultado inválido.' });
      }
      const nota = Number.isFinite(a.nota) && a.nota > 0 && a.nota < 1200 ? Math.round(a.nota) : null;
      areas.push({ area: a.area, acertos: a.acertos, total: a.total, brancas: a.brancas ?? 0, nota });
    }
    const redacao = typeof c.redacao === 'string' && c.redacao.trim() ? c.redacao.slice(0, TAMANHO_DA_REDACAO) : null;
    const tempo = inteiro(c.tempo_ms, 24 * 3600 * 1000) ? c.tempo_ms : null;
    try {
      const { rows } = await pool.query(
        `INSERT INTO simulados (usuario_id, dia, ano, acertos, total, areas, tempo_ms, redacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [req.usuario.id, dia, String(ano), c.acertos, c.total, JSON.stringify(areas), tempo, redacao]
      );
      res.status(201).json({ id: rows[0].id });
    } catch (erro) {
      console.error('Erro ao salvar simulado:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar o simulado na sua conta agora.' });
    }
  });
};
