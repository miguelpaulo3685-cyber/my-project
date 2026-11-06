// Feedback: qualquer pessoa (com ou sem conta) manda uma mensagem curta para
// a equipe pelo menu do site. Os administradores leem em Configurações →
// Administração e marcam como lido.

const TAMANHO = 1000;
const TIPOS = ['ideia', 'problema', 'elogio', 'outro'];

function limparFeedback({ texto, tipo, tela } = {}) {
  const t = String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim().slice(0, TAMANHO);
  return {
    texto: t,
    tipo: TIPOS.includes(tipo) ? tipo : 'outro',
    tela: String(tela || '').replace(/[^\w-]/g, '').slice(0, 30) || null
  };
}

function registrarRotasDeFeedback(app, { pool, limitar, auth, exigirModerador }) {
  const freio = limitar(auth.criarFreio(5, 60 * 60 * 1000), 'Muitas mensagens seguidas. Tente de novo mais tarde.');
  app.post('/api/feedback', freio, async (req, res) => {
    const f = limparFeedback(req.body);
    if (f.texto.length < 3) return res.status(400).json({ error: 'Escreva um pouquinho mais.' });
    try {
      await pool.query('INSERT INTO feedback (usuario_id, tipo, texto, tela) VALUES ($1, $2, $3, $4)',
        [req.usuario ? req.usuario.id : null, f.tipo, f.texto, f.tela]);
      res.json({ message: 'Recebido! Obrigado por ajudar a melhorar o site 💛' });
    } catch (erro) {
      console.error('Erro ao salvar feedback:', erro.message);
      res.status(500).json({ error: 'Não consegui enviar agora. Tente de novo daqui a pouco.' });
    }
  });

  app.get('/api/admin/feedback', exigirModerador, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT f.id, f.tipo, f.texto, f.tela, f.created_at, u.username FROM feedback f
           LEFT JOIN usuarios u ON u.id = f.usuario_id
          WHERE NOT f.lido ORDER BY f.created_at DESC LIMIT 50`);
      res.json({ feedback: rows });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });

  app.post('/api/admin/feedback/:id/lido', exigirModerador, async (req, res) => {
    try {
      await pool.query('UPDATE feedback SET lido = TRUE WHERE id = $1', [Number(req.params.id) || 0]);
      res.json({ message: 'Marcado como lido.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui marcar agora.' });
    }
  });
}

module.exports = { registrarRotasDeFeedback, limparFeedback, TAMANHO };
