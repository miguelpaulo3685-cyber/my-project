// Progresso da trilha "O que cai no ENEM": aulas concluídas e melhor nota em
// cada teste de módulo. Um registro por conta (JSON pequeno). O servidor junta
// o que chega com o que já tem: aula feita continua feita e a nota só sobe,
// então dois aparelhos ao mesmo tempo não apagam o progresso um do outro.

const ID_VALIDO = /^[a-z0-9-]{1,40}$/;
const MAXIMO_DE_ITENS = 300;

function limpar(dados) {
  const aulas = {}, testes = {};
  const entrada = dados && typeof dados === 'object' ? dados : {};
  for (const [id, quando] of Object.entries(entrada.aulas || {}).slice(0, MAXIMO_DE_ITENS)) {
    if (ID_VALIDO.test(id) && Number.isFinite(Number(quando)) && Number(quando) > 0) aulas[id] = Math.round(Number(quando));
  }
  for (const [id, nota] of Object.entries(entrada.testes || {}).slice(0, MAXIMO_DE_ITENS)) {
    const n = Number(nota);
    if (ID_VALIDO.test(id) && Number.isInteger(n) && n >= 0 && n <= 100) testes[id] = n;
  }
  return { aulas, testes };
}

function juntar(a, b) {
  const aulas = { ...a.aulas };
  for (const [id, t] of Object.entries(b.aulas)) aulas[id] = aulas[id] ? Math.min(aulas[id], t) : t;
  const testes = { ...a.testes };
  for (const [id, n] of Object.entries(b.testes)) testes[id] = Math.max(testes[id] || 0, n);
  return { aulas, testes };
}

function registrarTrilha(app, { pool, auth, limitar, exigirLogin }) {
  const freio = limitar(auth.criarFreio(120, 60 * 60 * 1000), 'Muitas atualizações seguidas. Espere um pouco.', req => `u${req.usuario.id}`);

  app.get('/api/trilha', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT dados FROM trilha_progresso WHERE usuario_id = $1', [req.usuario.id]);
      res.json({ progresso: limpar(rows[0] && rows[0].dados) });
    } catch (erro) {
      console.error('Erro ao ler a trilha:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar o seu progresso agora.' });
    }
  });

  app.put('/api/trilha', exigirLogin, freio, async (req, res) => {
    const novo = limpar(req.body);
    try {
      const { rows } = await pool.query('SELECT dados FROM trilha_progresso WHERE usuario_id = $1', [req.usuario.id]);
      const tudo = juntar(limpar(rows[0] && rows[0].dados), novo);
      await pool.query(
        `INSERT INTO trilha_progresso (usuario_id, dados, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (usuario_id) DO UPDATE SET dados = EXCLUDED.dados, updated_at = NOW()`,
        [req.usuario.id, JSON.stringify(tudo)]
      );
      res.json({ progresso: tudo });
    } catch (erro) {
      console.error('Erro ao salvar a trilha:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar o seu progresso agora.' });
    }
  });
}

module.exports = registrarTrilha;
module.exports.limpar = limpar;
module.exports.juntar = juntar;
