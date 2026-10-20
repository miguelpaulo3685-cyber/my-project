// Correção de redação pela comunidade, do jeito do ENEM.
//
// O aluno envia a redação; colegas corrigem às cegas (não veem quem escreveu)
// nas 5 competências, de 0 a 200 cada, de 40 em 40. Como no ENEM, cada
// redação tem 2 correções; se as duas forem muito diferentes (mais de 100
// pontos no total ou mais de 80 numa competência), vai para uma terceira, e
// a nota final é a média da terceira com a mais próxima dela.
//
// Para a fila andar: cada correção feita libera o envio de mais uma redação
// (a primeira é livre, e se não houver nada para corrigir, também pode).

const imagens = require('./imagens');
const { notificar } = require('./social');
const { registrarAtividade } = require('./comunidade');

const NIVEIS = [0, 40, 80, 120, 160, 200];
// Motivos de nota zero no ENEM. (Desrespeitar os direitos humanos zera só a competência 5.)
const ANULACOES = ['fuga_ao_tema', 'nao_dissertativo', 'ate_7_linhas', 'copia', 'improprios'];
const POR_SEMANA = 3;
const DENUNCIAS_PARA_ESCONDER = 3;
const MARCOS_DE_CORRECOES = [1, 5, 10, 25, 50, 100];

const soma = notas => notas.reduce((t, n) => t + n, 0);
const discrepantes = (a, b) => Math.abs(soma(a) - soma(b)) > 100 || a.some((n, i) => Math.abs(n - b[i]) > 80);
const media = (a, b) => ({ nota: Math.round((soma(a) + soma(b)) / 2), competencias: a.map((n, i) => (n + b[i]) / 2) });

// Situação da redação a partir das notas das correções, na ordem em que chegaram.
function resultadoDaRedacao(lista) {
  if (!lista.length) return { situacao: 'aguardando', faltam: 2, nota: null, competencias: null };
  if (lista.length === 1) return { situacao: 'parcial', faltam: 1, nota: soma(lista[0]), competencias: lista[0] };
  const [a, b, c] = lista;
  if (!discrepantes(a, b)) return { situacao: 'corrigida', faltam: 0, usadas: [0, 1], ...media(a, b) };
  if (!c) return { situacao: 'discrepante', faltam: 1, usadas: [0, 1], ...media(a, b) };
  const pertoDeA = Math.abs(soma(c) - soma(a)) <= Math.abs(soma(c) - soma(b));
  return { situacao: 'corrigida', faltam: 0, usadas: [pertoDeA ? 0 : 1, 2], ...media(c, pertoDeA ? a : b) };
}

function registrarRedacoes(app, { pool, auth, limitar, exigirLogin }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioEnviar = limitar(auth.criarFreio(10, 60 * 60 * 1000), 'Muitos envios agora. Espere um pouco.', porConta);
  const freioCorrigir = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Muitas correções seguidas. Respira e volta daqui a pouco 🙂', porConta);
  const freioDenunciar = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.', porConta);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

  async function notasDe(redacaoIds) {
    if (!redacaoIds.length) return new Map();
    const { rows } = await pool.query(
      'SELECT redacao_id, usuario_id, notas FROM redacoes_correcoes WHERE redacao_id = ANY($1::int[]) AND NOT oculto ORDER BY id', [redacaoIds]);
    const mapa = new Map(redacaoIds.map(id => [id, []]));
    for (const r of rows) mapa.get(r.redacao_id).push(r);
    return mapa;
  }

  // A próxima redação que esta pessoa pode corrigir (a mais antiga esperando).
  async function proximaDaFila(eu, pular = []) {
    const { rows } = await pool.query(
      `SELECT r.id, r.tema, r.texto, r.created_at FROM redacoes r
        WHERE r.usuario_id <> $1 AND NOT r.oculto AND NOT (r.id = ANY($2::int[]))
          AND NOT EXISTS (SELECT 1 FROM redacoes_correcoes c WHERE c.redacao_id = r.id AND c.usuario_id = $1)
          AND (SELECT COUNT(*) FROM redacoes_correcoes c WHERE c.redacao_id = r.id AND NOT c.oculto) < 3
        ORDER BY r.id LIMIT 60`, [eu, pular]);
    const notas = await notasDe(rows.map(r => r.id));
    const abertas = rows.filter(r => resultadoDaRedacao(notas.get(r.id).map(c => c.notas)).faltam > 0);
    return { proxima: abertas[0] || null, na_fila: abertas.length };
  }

  async function situacaoDoEnvio(eu) {
    const c = (await pool.query(
      `SELECT (SELECT COUNT(*)::int FROM redacoes WHERE usuario_id = $1) AS enviadas,
              (SELECT COUNT(*)::int FROM redacoes WHERE usuario_id = $1 AND created_at > NOW() - INTERVAL '7 days') AS semana,
              (SELECT COUNT(*)::int FROM redacoes_correcoes WHERE usuario_id = $1 AND NOT oculto) AS correcoes,
              (SELECT COUNT(*)::int FROM redacoes_correcoes WHERE usuario_id = $1 AND util AND NOT oculto) AS uteis`, [eu])).rows[0];
    const { na_fila } = await proximaDaFila(eu);
    const creditos = Math.max(0, 1 + c.correcoes - c.enviadas);
    let motivo = null;
    if (c.semana >= POR_SEMANA) motivo = `Você já enviou ${POR_SEMANA} redações esta semana. Aproveite para reescrever com as dicas que recebeu!`;
    else if (!creditos && na_fila) motivo = 'Corrija uma redação da comunidade para liberar o seu próximo envio. É assim que a fila anda para todo mundo.';
    return { ...c, creditos, na_fila, pode_enviar: !motivo, motivo };
  }

  app.get('/api/redacoes/painel', exigirLogin, async (req, res) => {
    try {
      const situacao = await situacaoDoEnvio(req.usuario.id);
      const { rows } = await pool.query(
        `SELECT r.id, r.tema, r.created_at, r.oculto FROM redacoes r WHERE r.usuario_id = $1 ORDER BY r.id DESC LIMIT 30`, [req.usuario.id]);
      const notas = await notasDe(rows.map(r => r.id));
      res.json({
        ...situacao,
        minhas: rows.map(r => {
          const res = resultadoDaRedacao(notas.get(r.id).map(c => c.notas));
          return { id: r.id, tema: r.tema, created_at: r.created_at, oculto: r.oculto, correcoes: notas.get(r.id).length, ...res };
        })
      });
    } catch (erro) {
      console.error('Erro no painel de redações:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar suas redações agora.' });
    }
  });

  app.post('/api/redacoes', exigirLogin, freioEnviar, async (req, res) => {
    const tema = typeof req.body?.tema === 'string' ? req.body.tema.trim().replace(/\s+/g, ' ') : '';
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.replace(/\r\n/g, '\n').trim() : '';
    const origem = req.body?.origem === 'simulado' ? 'simulado' : 'livre';
    if (tema.length < 5 || tema.length > 200) return res.status(400).json({ error: 'Escolha ou escreva o tema da redação.' });
    if (texto.length < 300) return res.status(400).json({ error: 'A redação está curta demais para ser corrigida (no ENEM, até 7 linhas é nota zero).' });
    if (texto.length > 5000) return res.status(400).json({ error: 'A redação passou do tamanho da folha (30 linhas).' });
    try {
      const s = await situacaoDoEnvio(req.usuario.id);
      if (!s.pode_enviar) return res.status(403).json({ error: s.motivo });
      const r = await pool.query('INSERT INTO redacoes (usuario_id, tema, texto, origem) VALUES ($1, $2, $3, $4) RETURNING id',
        [req.usuario.id, tema, texto, origem]);
      res.status(201).json({ id: r.rows[0].id });
    } catch (erro) {
      console.error('Erro ao enviar redação:', erro.message);
      res.status(500).json({ error: 'Não consegui enviar a redação agora.' });
    }
  });

  // A redação com as correções: só para quem escreveu (e administradores).
  app.get('/api/redacoes/:id(\\d+)', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    const eu = req.usuario;
    try {
      const r = (await pool.query('SELECT * FROM redacoes WHERE id = $1', [id])).rows[0];
      if (!r || (r.usuario_id !== eu.id && !eu.admin)) return res.status(404).json({ error: 'Redação não encontrada.' });
      const { rows } = await pool.query(
        `SELECT c.id, c.notas, c.comentarios, c.geral, c.anulada, c.util, c.oculto, c.created_at,
                u.id AS autor_id, u.username AS autor, u.foto_id, COALESCE(u.admin, FALSE) AS autor_admin,
                (SELECT COUNT(*)::int FROM redacoes_correcoes x WHERE x.usuario_id = u.id AND NOT x.oculto) AS corrigidas
           FROM redacoes_correcoes c JOIN usuarios u ON u.id = c.usuario_id
          WHERE c.redacao_id = $1 ORDER BY c.id`, [id]);
      const valendo = rows.filter(c => !c.oculto);
      res.json({
        redacao: { id: r.id, tema: r.tema, texto: r.texto, origem: r.origem, created_at: r.created_at, oculto: r.oculto, minha: r.usuario_id === eu.id },
        resultado: resultadoDaRedacao(valendo.map(c => c.notas)),
        correcoes: rows.filter(c => !c.oculto || eu.admin).map(c => ({
          id: c.id, notas: c.notas, total: soma(c.notas), comentarios: c.comentarios, geral: c.geral, anulada: c.anulada,
          util: c.util, oculto: c.oculto, created_at: c.created_at,
          corretor: { id: c.autor_id, nome: c.autor, foto: imagens.urlAssinada(c.foto_id), equipe: c.autor_admin, corrigidas: c.corrigidas }
        }))
      });
    } catch (erro) {
      console.error('Erro ao abrir redação:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir a redação agora.' });
    }
  });

  // Fila de correção: às cegas, sem o nome de quem escreveu.
  app.get('/api/redacoes/fila', exigirLogin, async (req, res) => {
    const pular = String(req.query.pular || '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 50);
    try {
      const { proxima, na_fila } = await proximaDaFila(req.usuario.id, pular);
      res.json({ redacao: proxima && { id: proxima.id, tema: proxima.tema, texto: proxima.texto, created_at: proxima.created_at }, na_fila });
    } catch (erro) {
      console.error('Erro na fila de redações:', erro.message);
      res.status(500).json({ error: 'Não consegui buscar uma redação agora.' });
    }
  });

  app.post('/api/redacoes/:id(\\d+)/correcoes', exigirLogin, freioCorrigir, async (req, res) => {
    const id = idValido(req.params.id);
    const eu = req.usuario.id;
    const anulada = ANULACOES.includes(req.body?.anulada) ? req.body.anulada : null;
    const notas = anulada ? [0, 0, 0, 0, 0] : (Array.isArray(req.body?.notas) ? req.body.notas.map(Number) : []);
    const comentarios = (Array.isArray(req.body?.comentarios) ? req.body.comentarios : []).slice(0, 5)
      .map(c => (typeof c === 'string' ? c.trim().slice(0, 600) : ''));
    const geral = typeof req.body?.geral === 'string' ? req.body.geral.trim() : '';
    if (notas.length !== 5 || !notas.every(n => NIVEIS.includes(n))) return res.status(400).json({ error: 'Dê uma nota de 0 a 200 (de 40 em 40) em cada competência.' });
    if (geral.length < 40) return res.status(400).json({ error: 'Escreva um comentário geral com pelo menos 40 caracteres: é ele que ajuda quem escreveu a melhorar.' });
    if (geral.length > 2000) return res.status(400).json({ error: 'O comentário geral pode ter até 2000 caracteres.' });
    try {
      const r = (await pool.query('SELECT usuario_id, tema FROM redacoes WHERE id = $1 AND NOT oculto', [id])).rows[0];
      if (!r) return res.status(404).json({ error: 'Essa redação não está mais na fila.' });
      if (r.usuario_id === eu) return res.status(400).json({ error: 'Você não pode corrigir a sua própria redação.' });
      const antes = resultadoDaRedacao((await notasDe([id])).get(id).map(c => c.notas));
      if (antes.faltam === 0) return res.status(409).json({ error: 'Essa redação já recebeu todas as correções. Pegue a próxima!' });
      const ins = await pool.query(
        `INSERT INTO redacoes_correcoes (redacao_id, usuario_id, notas, comentarios, geral, anulada)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING id`,
        [id, eu, notas, JSON.stringify(comentarios), geral, anulada]);
      if (!ins.rowCount) return res.status(409).json({ error: 'Você já corrigiu essa redação.' });

      const depois = resultadoDaRedacao((await notasDe([id])).get(id).map(c => c.notas));
      await notificar(pool, {
        usuarioId: r.usuario_id, atorId: eu, tipo: depois.situacao === 'corrigida' ? 'redacao_corrigida' : 'correcao',
        alvoTipo: 'redacao', alvoId: id, texto: depois.situacao === 'corrigida' ? String(depois.nota) : String(soma(notas))
      });
      const feitas = (await pool.query('SELECT COUNT(*)::int AS n FROM redacoes_correcoes WHERE usuario_id = $1 AND NOT oculto', [eu])).rows[0].n;
      if (MARCOS_DE_CORRECOES.includes(feitas)) await registrarAtividade(pool, { usuarioId: eu, tipo: 'correcoes', alvoId: feitas });
      res.status(201).json({ id: ins.rows[0].id, xp: 15, correcoes_feitas: feitas });
    } catch (erro) {
      console.error('Erro ao corrigir redação:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar a correção agora.' });
    }
  });

  // Quem escreveu marca a correção que ajudou: o corretor ganha XP e fica sabendo.
  app.post('/api/redacoes/correcoes/:id(\\d+)/util', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    try {
      const c = (await pool.query(
        `SELECT c.usuario_id, c.util, c.redacao_id, r.usuario_id AS dono FROM redacoes_correcoes c JOIN redacoes r ON r.id = c.redacao_id WHERE c.id = $1`, [id])).rows[0];
      if (!c || c.dono !== req.usuario.id) return res.status(404).json({ error: 'Correção não encontrada.' });
      await pool.query('UPDATE redacoes_correcoes SET util = NOT util WHERE id = $1', [id]);
      if (!c.util) await notificar(pool, { usuarioId: c.usuario_id, atorId: req.usuario.id, tipo: 'correcao_util', alvoTipo: 'redacao', alvoId: c.redacao_id });
      res.json({ util: !c.util });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.delete('/api/redacoes/:id(\\d+)', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    try {
      const r = await pool.query('DELETE FROM redacoes WHERE id = $1 AND (usuario_id = $2 OR $3)', [id, req.usuario.id, Boolean(req.usuario.admin)]);
      if (!r.rowCount) return res.status(404).json({ error: 'Redação não encontrada.' });
      res.json({ message: 'Redação apagada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // Redação ofensiva (denunciada por quem corrige) ou correção desrespeitosa
  // (denunciada por quem escreveu: aí sai na hora, porque só ela vê).
  app.post('/api/redacoes/:tipo(redacao|correcao)/:id(\\d+)/denunciar', exigirLogin, freioDenunciar, async (req, res) => {
    const { tipo } = req.params;
    const id = idValido(req.params.id);
    const eu = req.usuario.id;
    try {
      if (tipo === 'correcao') {
        const c = (await pool.query(
          'SELECT c.id FROM redacoes_correcoes c JOIN redacoes r ON r.id = c.redacao_id WHERE c.id = $1 AND r.usuario_id = $2', [id, eu])).rows[0];
        if (!c) return res.status(404).json({ error: 'Correção não encontrada.' });
        await pool.query(`INSERT INTO redacoes_denuncias (alvo_tipo, alvo_id, usuario_id) VALUES ('correcao', $1, $2) ON CONFLICT DO NOTHING`, [id, eu]);
        await pool.query('UPDATE redacoes_correcoes SET oculto = TRUE WHERE id = $1', [id]);
        return res.json({ message: 'Correção removida e enviada para a equipe revisar. A sua redação volta para a fila.' });
      }
      const r = (await pool.query('SELECT usuario_id FROM redacoes WHERE id = $1', [id])).rows[0];
      if (!r) return res.status(404).json({ error: 'Redação não encontrada.' });
      if (r.usuario_id === eu) return res.status(400).json({ error: 'Essa redação é sua.' });
      await pool.query(`INSERT INTO redacoes_denuncias (alvo_tipo, alvo_id, usuario_id) VALUES ('redacao', $1, $2) ON CONFLICT DO NOTHING`, [id, eu]);
      await pool.query(
        `UPDATE redacoes SET oculto = TRUE WHERE id = $1 AND (SELECT COUNT(*) FROM redacoes_denuncias WHERE alvo_tipo = 'redacao' AND alvo_id = $1) >= $2`,
        [id, DENUNCIAS_PARA_ESCONDER]);
      res.json({ message: 'Obrigado! A denúncia foi registrada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });
}

module.exports = registrarRedacoes;
Object.assign(module.exports, { resultadoDaRedacao, discrepantes, NIVEIS });
