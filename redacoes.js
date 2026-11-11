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
// Prova de corretor: perto da nota fechada pela comunidade é a mesma regra que
// chama a 3ª correção (até 100 no total e até 80 em cada competência).
const pertoDaNota = (minhas, oficiais) => !discrepantes(minhas, oficiais.map(n => Math.round(n)));
const PROVAS_PARA_APROVAR = 2;   // seguidas, dentro da regra
const MINIMO_PARA_TER_PROVA = 3; // redações com nota fechada; antes disso, todo mundo corrige
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

// Com as correções do banco ({ notas, professor }): a de um professor da escola
// fecha a nota sozinha (vale a mais recente); sem professor, vale a regra do ENEM.
function resultadoDasCorrecoes(correcoes) {
  const i = correcoes.map(c => Boolean(c.professor)).lastIndexOf(true);
  if (i < 0) return resultadoDaRedacao(correcoes.map(c => c.notas));
  const notas = correcoes[i].notas;
  return { situacao: 'corrigida', faltam: 0, usadas: [i], nota: soma(notas), competencias: notas, professor: true };
}

// Notas que já aparecem marcadas para o professor: as da comunidade (arredondadas
// para o nível mais próximo) ou, se ninguém corrigiu ainda, as da IA.
const nivelMaisProximo = n => NIVEIS.reduce((melhor, nivel) => (Math.abs(nivel - n) < Math.abs(melhor - n) ? nivel : melhor), 0);
function sugestaoDeNotas(resultado, notasDaIa) {
  if (resultado && resultado.competencias) return { origem: 'comunidade', notas: resultado.competencias.map(nivelMaisProximo) };
  if (Array.isArray(notasDaIa) && notasDaIa.length === 5) return { origem: 'ia', notas: notasDaIa.map(nivelMaisProximo) };
  return { origem: null, notas: [null, null, null, null, null] };
}

// Urgente na fila do professor: a comunidade discordou, ou a redação espera há mais de 3 dias.
const DIAS_PARA_URGENTE = 3;
function urgenteParaProfessor(situacao, criadaEm, agora = Date.now()) {
  if (situacao === 'discrepante') return true;
  return agora - new Date(criadaEm).getTime() > DIAS_PARA_URGENTE * 24 * 60 * 60 * 1000;
}

const ia = require('./correcao-ia');

function registrarRedacoes(app, { pool, auth, limitar, exigirLogin, exigirModerador }) {
  // ---------- correção por IA ----------
  // Começa a correção (sem esperar): o site mostra "corrigindo…" e pergunta de novo.
  async function pedirCorrecaoIa(redacaoId, usuarioId) {
    if (!ia.ligada()) return null;
    const { rows: [c] } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE usuario_id = $1)::int AS minhas, COUNT(*)::int AS site
         FROM redacoes WHERE ia_em > NOW() - INTERVAL '1 day'`, [usuarioId]);
    if (c.minhas >= ia.POR_PESSOA_POR_DIA || c.site >= ia.LIMITE_DO_SITE) return 'limite';
    await pool.query(`UPDATE redacoes SET ia_status = 'corrigindo', ia_em = NOW() WHERE id = $1`, [redacaoId]);
    corrigirAgora(redacaoId);
    return 'corrigindo';
  }
  async function corrigirAgora(redacaoId) {
    try {
      const r = (await pool.query('SELECT tema, texto FROM redacoes WHERE id = $1', [redacaoId])).rows[0];
      if (!r) return;
      const c = await ia.corrigirComIa(r);
      await pool.query(
        `UPDATE redacoes SET ia_status = 'pronta', ia_notas = $2, ia_comentarios = $3, ia_geral = $4, ia_anulada = $5 WHERE id = $1`,
        [redacaoId, c.notas, JSON.stringify(c.comentarios), c.geral, c.anulada]);
    } catch (erro) {
      console.error(`Erro na correção por IA da redação ${redacaoId}:`, erro.message);
      await pool.query(`UPDATE redacoes SET ia_status = 'erro' WHERE id = $1`, [redacaoId]).catch(() => {});
    }
  }
  // Correção que travou (o servidor reiniciou no meio) conta como erro depois de 10 minutos.
  const situacaoIa = r => (r.ia_status === 'corrigindo' && r.ia_em && Date.now() - new Date(r.ia_em) > 10 * 60000) ? 'erro' : r.ia_status;
  const correcaoIaDe = r => {
    const status = situacaoIa(r);
    if (!status) return null;
    if (status !== 'pronta') return { status };
    return { status, notas: r.ia_notas, total: soma(r.ia_notas), comentarios: r.ia_comentarios || [], geral: r.ia_geral, anulada: r.ia_anulada };
  };

  const porConta = req => `u${req.usuario.id}`;
  const freioEnviar = limitar(auth.criarFreio(10, 60 * 60 * 1000), 'Muitos envios agora. Espere um pouco.', porConta);
  const freioCorrigir = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Muitas correções seguidas. Respira e volta daqui a pouco 🙂', porConta);
  const freioProfessor = limitar(auth.criarFreio(120, 60 * 60 * 1000), 'Muitas correções seguidas. Espere um pouco.', porConta);
  const freioDenunciar = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.', porConta);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

  async function notasDe(redacaoIds) {
    if (!redacaoIds.length) return new Map();
    const { rows } = await pool.query(
      'SELECT redacao_id, usuario_id, notas, professor FROM redacoes_correcoes WHERE redacao_id = ANY($1::int[]) AND NOT oculto ORDER BY id', [redacaoIds]);
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
    const abertas = rows.filter(r => resultadoDasCorrecoes(notas.get(r.id)).faltam > 0);
    return { proxima: abertas[0] || null, na_fila: abertas.length };
  }

  // ---------- prova de corretor ----------
  // Redações com nota fechada que servem de prova para esta pessoa (as que ela
  // escreveu ou já corrigiu ficam de fora; as que já usou na prova, só se pedir).
  async function redacoesDeProva(eu, incluirUsadas = false) {
    const { rows } = await pool.query(
      `SELECT r.id, r.tema, r.texto FROM redacoes r
        WHERE r.usuario_id <> $1 AND NOT r.oculto
          AND NOT EXISTS (SELECT 1 FROM redacoes_correcoes c WHERE c.redacao_id = r.id AND c.usuario_id = $1)
          AND ($2 OR NOT EXISTS (SELECT 1 FROM redacoes_provas p WHERE p.redacao_id = r.id AND p.usuario_id = $1))
          AND (SELECT COUNT(*) FROM redacoes_correcoes c WHERE c.redacao_id = r.id AND NOT c.oculto) >= 2
        ORDER BY RANDOM() LIMIT 40`, [eu, incluirUsadas]);
    const notas = await notasDe(rows.map(r => r.id));
    return rows.map(r => ({ ...r, oficial: resultadoDasCorrecoes(notas.get(r.id)) }))
      .filter(r => r.oficial.situacao === 'corrigida');
  }
  // Precisa fazer a prova? Não, se já foi aprovado, se é da equipe ou se ainda
  // não há redações com nota fechada suficientes no site.
  async function situacaoDaProva(usuario) {
    const u = (await pool.query('SELECT corretor_aprovado, COALESCE(admin, FALSE) AS admin FROM usuarios WHERE id = $1', [usuario.id])).rows[0];
    if (!u || u.corretor_aprovado || u.admin) return { precisa: false };
    // Poucas redações com nota fechada no site: ainda não há prova, todos corrigem.
    if ((await redacoesDeProva(usuario.id, true)).length < MINIMO_PARA_TER_PROVA) return { precisa: false };
    // Já usou todas as que existem: segue sem prova até aparecerem outras.
    const disponiveis = await redacoesDeProva(usuario.id);
    if (!disponiveis.length) return { precisa: false };
    const ultimas = (await pool.query('SELECT ok FROM redacoes_provas WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2',
      [usuario.id, PROVAS_PARA_APROVAR])).rows;
    let seguidas = 0;
    for (const p of ultimas) { if (!p.ok) break; seguidas++; }
    return { precisa: true, seguidas, faltam: PROVAS_PARA_APROVAR - seguidas, proxima: disponiveis[0] };
  }

  async function situacaoDoEnvio(eu) {
    const c = (await pool.query(
      `SELECT (SELECT COUNT(*)::int FROM redacoes WHERE usuario_id = $1) AS enviadas,
              (SELECT COUNT(*)::int FROM redacoes WHERE usuario_id = $1 AND created_at > NOW() - INTERVAL '7 days') AS semana,
              (SELECT COUNT(*)::int FROM redacoes_correcoes WHERE usuario_id = $1 AND NOT oculto)
                + (SELECT COUNT(*)::int FROM redacoes_provas WHERE usuario_id = $1) AS correcoes,
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
          const res = resultadoDasCorrecoes(notas.get(r.id));
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
      const iaSituacao = await pedirCorrecaoIa(r.rows[0].id, req.usuario.id).catch(erro => {
        console.error('Erro ao pedir correção por IA:', erro.message);
        return null;
      });
      res.status(201).json({ id: r.rows[0].id, ia: iaSituacao });
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
        `SELECT c.id, c.notas, c.comentarios, c.geral, c.anulada, c.util, c.oculto, c.created_at, c.professor,
                u.id AS autor_id, u.username AS autor, u.foto_id, COALESCE(u.admin, FALSE) AS autor_admin,
                (SELECT COUNT(*)::int FROM redacoes_correcoes x WHERE x.usuario_id = u.id AND NOT x.oculto) AS corrigidas
           FROM redacoes_correcoes c JOIN usuarios u ON u.id = c.usuario_id
          WHERE c.redacao_id = $1 ORDER BY c.id`, [id]);
      const valendo = rows.filter(c => !c.oculto);
      res.json({
        redacao: { id: r.id, tema: r.tema, texto: r.texto, origem: r.origem, created_at: r.created_at, oculto: r.oculto, minha: r.usuario_id === eu.id },
        resultado: resultadoDasCorrecoes(valendo),
        ia: r.usuario_id === eu.id || eu.admin ? correcaoIaDe(r) : null,
        ia_ligada: ia.ligada(),
        correcoes: rows.filter(c => !c.oculto || eu.admin).map(c => ({
          id: c.id, notas: c.notas, total: soma(c.notas), comentarios: c.comentarios, geral: c.geral, anulada: c.anulada,
          util: c.util, oculto: c.oculto, created_at: c.created_at, professor: c.professor,
          corretor: { id: c.autor_id, nome: c.autor, foto: imagens.urlAssinada(c.foto_id), equipe: c.autor_admin, corrigidas: c.corrigidas }
        }))
      });
    } catch (erro) {
      console.error('Erro ao abrir redação:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir a redação agora.' });
    }
  });

  // Resposta da prova de corretor: compara com a nota fechada pela comunidade.
  app.post('/api/redacoes/:id(\\d+)/prova', exigirLogin, freioCorrigir, async (req, res) => {
    const id = idValido(req.params.id);
    const eu = req.usuario.id;
    const anulada = ANULACOES.includes(req.body?.anulada);
    const notas = anulada ? [0, 0, 0, 0, 0] : (Array.isArray(req.body?.notas) ? req.body.notas.map(Number) : []);
    if (notas.length !== 5 || !notas.every(n => NIVEIS.includes(n))) return res.status(400).json({ error: 'Dê uma nota de 0 a 200 (de 40 em 40) em cada competência.' });
    try {
      const r = (await pool.query('SELECT usuario_id FROM redacoes WHERE id = $1 AND NOT oculto', [id])).rows[0];
      if (!r || r.usuario_id === eu) return res.status(404).json({ error: 'Redação não encontrada.' });
      const ja = await pool.query('SELECT 1 FROM redacoes_provas WHERE usuario_id = $1 AND redacao_id = $2', [eu, id]);
      if (ja.rowCount) return res.status(409).json({ error: 'Você já corrigiu esta redação na prova.' });
      const oficial = resultadoDasCorrecoes((await notasDe([id])).get(id));
      if (oficial.situacao !== 'corrigida') return res.status(409).json({ error: 'Esta redação não serve mais para a prova. Busque outra.' });
      const ok = pertoDaNota(notas, oficial.competencias);
      await pool.query('INSERT INTO redacoes_provas (usuario_id, redacao_id, notas, ok) VALUES ($1, $2, $3, $4)', [eu, id, notas, ok]);
      const ultimas = (await pool.query('SELECT ok FROM redacoes_provas WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2', [eu, PROVAS_PARA_APROVAR])).rows;
      const aprovado = ultimas.length === PROVAS_PARA_APROVAR && ultimas.every(p => p.ok);
      if (aprovado) await pool.query('UPDATE usuarios SET corretor_aprovado = TRUE WHERE id = $1', [eu]);
      res.json({ ok, aprovado, minhas: notas, oficial: { nota: oficial.nota, competencias: oficial.competencias.map(n => Math.round(n)) } });
    } catch (erro) {
      console.error('Erro na prova de corretor:', erro.message);
      res.status(500).json({ error: 'Não consegui conferir agora.' });
    }
  });

  // Tentar de novo a correção por IA (deu erro ou ainda não tinha sido pedida).
  app.post('/api/redacoes/:id(\\d+)/ia', exigirLogin, freioEnviar, async (req, res) => {
    const id = idValido(req.params.id);
    try {
      const r = (await pool.query('SELECT usuario_id, ia_status, ia_em FROM redacoes WHERE id = $1', [id])).rows[0];
      if (!r || r.usuario_id !== req.usuario.id) return res.status(404).json({ error: 'Redação não encontrada.' });
      if (!ia.ligada()) return res.status(503).json({ error: 'A correção por IA não está disponível agora.' });
      const s = situacaoIa(r);
      if (s === 'pronta' || s === 'corrigindo') return res.json({ ia: s });
      const pedido = await pedirCorrecaoIa(id, req.usuario.id);
      if (pedido === 'limite') return res.status(429).json({ error: `Você já usou as ${ia.POR_PESSOA_POR_DIA} correções por IA de hoje. Amanhã tem mais!` });
      res.json({ ia: pedido });
    } catch (erro) {
      console.error('Erro ao pedir correção por IA:', erro.message);
      res.status(500).json({ error: 'Não consegui pedir a correção agora.' });
    }
  });

  // Fila de correção: às cegas, sem o nome de quem escreveu.
  app.get('/api/redacoes/fila', exigirLogin, async (req, res) => {
    const pular = String(req.query.pular || '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 50);
    try {
      const prova = await situacaoDaProva(req.usuario);
      if (prova.precisa) {
        const p = prova.proxima;
        return res.json({ prova: { etapa: prova.seguidas + 1, de: PROVAS_PARA_APROVAR }, redacao: { id: p.id, tema: p.tema, texto: p.texto }, na_fila: 0 });
      }
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
      if ((await situacaoDaProva(req.usuario)).precisa) return res.status(403).json({ error: 'Faça a prova de corretor antes de corrigir.' });
      const r = (await pool.query('SELECT usuario_id, tema FROM redacoes WHERE id = $1 AND NOT oculto', [id])).rows[0];
      if (!r) return res.status(404).json({ error: 'Essa redação não está mais na fila.' });
      if (r.usuario_id === eu) return res.status(400).json({ error: 'Você não pode corrigir a sua própria redação.' });
      const antes = resultadoDasCorrecoes((await notasDe([id])).get(id));
      if (antes.faltam === 0) return res.status(409).json({ error: 'Essa redação já recebeu todas as correções. Pegue a próxima!' });
      const ins = await pool.query(
        `INSERT INTO redacoes_correcoes (redacao_id, usuario_id, notas, comentarios, geral, anulada)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING id`,
        [id, eu, notas, JSON.stringify(comentarios), geral, anulada]);
      if (!ins.rowCount) return res.status(409).json({ error: 'Você já corrigiu essa redação.' });

      const depois = resultadoDasCorrecoes((await notasDe([id])).get(id));
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

  // ---------- ferramenta do professor ----------
  // Professor (marcado pela equipe) vê só as redações de quem pôs a mesma escola
  // no perfil. Só ele vê o nome de quem escreveu (os colegas corrigem às cegas).
  // A correção dele fecha a nota.
  async function exigirProfessor(req, res, next) {
    if (!req.usuario) return res.status(401).json({ error: 'Faça login para continuar.' });
    try {
      const u = (await pool.query('SELECT COALESCE(professor, FALSE) AS professor, escola, escola_chave FROM usuarios WHERE id = $1', [req.usuario.id])).rows[0];
      if (!u || !u.professor) return res.status(403).json({ error: 'Esta parte é só para professores.' });
      req.professor = u;
      next();
    } catch (erro) {
      console.error('Erro ao conferir professor:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  }

  // A redação tem de ser de um aluno da escola do professor e não ser dele.
  async function redacaoDaEscola(id, req) {
    if (!id || !req.professor.escola_chave) return null;
    return (await pool.query(
      `SELECT r.id, r.usuario_id, r.tema, r.texto, r.created_at, r.ia_status, r.ia_notas, u.username AS aluno
         FROM redacoes r JOIN usuarios u ON u.id = r.usuario_id
        WHERE r.id = $1 AND NOT r.oculto AND r.usuario_id <> $2 AND u.escola_chave = $3`,
      [id, req.usuario.id, req.professor.escola_chave])).rows[0] || null;
  }

  // Fila da escola: o que nenhum professor corrigiu ainda, com as urgentes primeiro.
  app.get('/api/professor/fila', exigirProfessor, async (req, res) => {
    const p = req.professor;
    if (!p.escola_chave) return res.json({ escola: null, redacoes: [] });
    try {
      const { rows } = await pool.query(
        `SELECT r.id, r.tema, r.created_at, u.username AS aluno FROM redacoes r JOIN usuarios u ON u.id = r.usuario_id
          WHERE u.escola_chave = $1 AND r.usuario_id <> $2 AND NOT r.oculto
            AND NOT EXISTS (SELECT 1 FROM redacoes_correcoes c WHERE c.redacao_id = r.id AND NOT c.oculto AND (c.professor OR c.usuario_id = $2))
          ORDER BY r.id LIMIT 100`, [p.escola_chave, req.usuario.id]);
      const notas = await notasDe(rows.map(r => r.id));
      const redacoes = rows.map(r => {
        const resultado = resultadoDasCorrecoes(notas.get(r.id));
        return { id: r.id, tema: r.tema, aluno: r.aluno, created_at: r.created_at, situacao: resultado.situacao, nota: resultado.nota,
          correcoes: notas.get(r.id).length, urgente: urgenteParaProfessor(resultado.situacao, r.created_at) };
      }).sort((a, b) => (b.urgente - a.urgente) || (a.id - b.id));
      res.json({ escola: p.escola, redacoes });
    } catch (erro) {
      console.error('Erro na fila do professor:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar a fila agora.' });
    }
  });

  // Uma redação para revisar: o texto, as notas sugeridas e o que a comunidade escreveu.
  app.get('/api/professor/redacoes/:id(\\d+)', exigirProfessor, async (req, res) => {
    try {
      const r = await redacaoDaEscola(idValido(req.params.id), req);
      if (!r) return res.status(404).json({ error: 'Essa redação não está na fila da sua escola.' });
      const { rows } = await pool.query(
        `SELECT notas, comentarios, geral, anulada, professor FROM redacoes_correcoes WHERE redacao_id = $1 AND NOT oculto ORDER BY id`, [r.id]);
      const resultado = resultadoDasCorrecoes(rows);
      res.json({
        redacao: { id: r.id, tema: r.tema, texto: r.texto, created_at: r.created_at, aluno: r.aluno },
        sugestao: sugestaoDeNotas(resultado, r.ia_status === 'pronta' ? r.ia_notas : null),
        comunidade: rows.filter(c => !c.professor).map(c => ({ notas: c.notas, total: soma(c.notas), comentarios: c.comentarios, geral: c.geral, anulada: c.anulada }))
      });
    } catch (erro) {
      console.error('Erro ao abrir redação para o professor:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir a redação agora.' });
    }
  });

  // Correção do professor. O comentário geral é opcional (os comentários prontos já ajudam).
  app.post('/api/professor/redacoes/:id(\\d+)/correcao', exigirProfessor, freioProfessor, async (req, res) => {
    const eu = req.usuario.id;
    const anulada = ANULACOES.includes(req.body?.anulada) ? req.body.anulada : null;
    const notas = anulada ? [0, 0, 0, 0, 0] : (Array.isArray(req.body?.notas) ? req.body.notas.map(Number) : []);
    const comentarios = (Array.isArray(req.body?.comentarios) ? req.body.comentarios : []).slice(0, 5)
      .map(c => (typeof c === 'string' ? c.trim().slice(0, 600) : ''));
    const geral = typeof req.body?.geral === 'string' ? req.body.geral.trim() : '';
    if (notas.length !== 5 || !notas.every(n => NIVEIS.includes(n))) return res.status(400).json({ error: 'Dê uma nota de 0 a 200 (de 40 em 40) em cada competência.' });
    if (geral.length > 2000) return res.status(400).json({ error: 'O comentário geral pode ter até 2000 caracteres.' });
    try {
      const r = await redacaoDaEscola(idValido(req.params.id), req);
      if (!r) return res.status(404).json({ error: 'Essa redação não está na fila da sua escola.' });
      const ins = await pool.query(
        `INSERT INTO redacoes_correcoes (redacao_id, usuario_id, notas, comentarios, geral, anulada, professor)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) ON CONFLICT DO NOTHING RETURNING id`,
        [r.id, eu, notas, JSON.stringify(comentarios), geral, anulada]);
      if (!ins.rowCount) return res.status(409).json({ error: 'Você já corrigiu essa redação.' });
      await notificar(pool, { usuarioId: r.usuario_id, atorId: eu, tipo: 'redacao_corrigida', alvoTipo: 'redacao', alvoId: r.id, texto: String(soma(notas)) });
      res.status(201).json({ id: ins.rows[0].id });
    } catch (erro) {
      console.error('Erro na correção do professor:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar a correção agora.' });
    }
  });

  // A equipe marca (ou desmarca) quem é professor, pelo e-mail da conta.
  app.get('/api/admin/professores', exigirModerador, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.username AS nome, u.escola,
                (SELECT COUNT(*)::int FROM redacoes_correcoes c WHERE c.usuario_id = u.id AND c.professor AND NOT c.oculto) AS corrigidas
           FROM usuarios u WHERE u.professor ORDER BY u.username`);
      res.json({ professores: rows });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui carregar os professores agora.' });
    }
  });
  app.post('/api/admin/professores', exigirModerador, async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const professor = req.body?.professor !== false;
    if (!email) return res.status(400).json({ error: 'Escreva o e-mail da conta do professor.' });
    try {
      const r = await pool.query('UPDATE usuarios SET professor = $2 WHERE email = $1 RETURNING id, username AS nome, escola', [email, professor]);
      if (!r.rowCount) return res.status(404).json({ error: 'Não achei uma conta com esse e-mail. A pessoa precisa criar a conta primeiro.' });
      console.log(`🎓 Conta ${r.rows[0].id} ${professor ? 'virou professor' : 'deixou de ser professor'} (por ${req.usuario.id})`);
      res.json({ ...r.rows[0], professor });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });
}

module.exports = registrarRedacoes;
Object.assign(module.exports, { resultadoDaRedacao, resultadoDasCorrecoes, sugestaoDeNotas, urgenteParaProfessor, discrepantes, pertoDaNota, NIVEIS });
