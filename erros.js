// Aviso automático de erros.
//
// Tudo que o servidor já manda para o log com console.error, e os erros que
// acontecem no navegador de quem usa o site, ficam numa tabela agrupados por
// tipo (com quantas vezes e quando foi a última). Quando aparece um erro novo,
// ou muitos de uma vez, os administradores recebem e-mail e aviso no celular,
// no máximo um a cada 3 horas.
//
// Nada de dado pessoal: e-mails, códigos longos (tokens) e o que vem depois
// do "?" nos endereços são apagados antes de guardar.

const crypto = require('crypto');

const TAMANHO = 300;
const INTERVALO_GRAVAR = 60 * 1000;
const HORAS_ENTRE_ALERTAS = 3;
const MUITOS_DE_UMA_VEZ = 30;
const MAX_NO_BUFFER = 200;

// Barulho que não é defeito do site: extensão do navegador, internet caindo,
// aviso inofensivo do próprio navegador.
const IGNORAR = [
  /^Script error\.?$/i, /ResizeObserver loop/i, /Failed to fetch/i, /Load failed/i, /NetworkError/i,
  /The (operation|request) was aborted/i, /AbortError/i, /network connection was lost/i, /cancelad[oa]/i
];

function limpar(texto) {
  return String(texto == null ? '' : texto)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[e-mail]')
    .replace(/\?[^\s'")]*/g, '?…')
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, '[código]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TAMANHO);
}

// Erros iguais com números diferentes (id 12, id 13) contam como o mesmo.
function chaveDo(origem, mensagem, onde) {
  const base = `${origem}|${mensagem.replace(/\d+/g, 'N')}|${(onde || '').replace(/:\d+(:\d+)?$/, '')}`;
  return crypto.createHash('sha1').update(base).digest('hex').slice(0, 32);
}

const deveIgnorar = (mensagem, onde) =>
  !mensagem || IGNORAR.some(r => r.test(mensagem)) || /^(chrome|moz|safari|safari-web)-extension:/.test(onde || '');

// Junta os argumentos de um console.error numa linha só.
function textoDoLog(args) {
  return args.map(a => (a instanceof Error ? a.message : typeof a === 'object' ? (a && a.message) || JSON.stringify(a) : String(a))).join(' ');
}

function criarVigia(pool, { avisarAdmins, logOriginal = console.error } = {}) {
  const buffer = new Map(); // chave -> { origem, mensagem, onde, vezes }
  let ultimoAlerta = 0;

  function registrar(origem, mensagem, onde) {
    const m = limpar(mensagem);
    const o = limpar(onde).slice(0, 200);
    if (deveIgnorar(m, o)) return false;
    const chave = chaveDo(origem, m, o);
    const item = buffer.get(chave);
    if (item) item.vezes++;
    else if (buffer.size < MAX_NO_BUFFER) buffer.set(chave, { origem, mensagem: m, onde: o, vezes: 1 });
    return true;
  }

  // Grava o que juntou no último minuto. Se o banco estiver fora, descarta:
  // erro do vigia não pode virar mais erro no log (nem um laço infinito).
  async function gravar() {
    if (!buffer.size) return { novos: [], total: 0 };
    const itens = [...buffer.entries()];
    buffer.clear();
    const novos = [];
    let total = 0;
    try {
      for (const [chave, e] of itens) {
        total += e.vezes;
        const r = await pool.query(
          `INSERT INTO erros_site (chave, origem, mensagem, onde, vezes) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (chave) DO UPDATE SET vezes = erros_site.vezes + EXCLUDED.vezes, ultima_vez = NOW()
           RETURNING (xmax = 0) AS novo`, [chave, e.origem, e.mensagem, e.onde, e.vezes]);
        if (r.rows[0] && r.rows[0].novo) novos.push(e);
      }
      if ((novos.length || total >= MUITOS_DE_UMA_VEZ) && avisarAdmins) await alertar(novos, total, itens.map(i => i[1]));
    } catch (erro) {
      logOriginal('Vigia de erros não conseguiu gravar:', erro.message);
    }
    return { novos, total };
  }

  async function alertar(novos, total, todos) {
    const agora = Date.now();
    if (agora - ultimoAlerta < HORAS_ENTRE_ALERTAS * 3600 * 1000) return;
    // Guardado no banco também: o servidor reiniciando não pode mandar um alerta a cada volta.
    const r = await pool.query(
      `INSERT INTO configuracoes (chave, valor) VALUES ('alerta_erros_em', $1)
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor
        WHERE configuracoes.valor::bigint < $1::bigint - $2::bigint RETURNING 1`,
      [String(agora), String(HORAS_ENTRE_ALERTAS * 3600 * 1000)]);
    if (!r.rowCount) return;
    ultimoAlerta = agora;
    const lista = (novos.length ? novos : todos).slice(0, 5);
    await avisarAdmins({
      titulo: novos.length ? `${novos.length} erro(s) novo(s) no site` : `${total} erros no último minuto`,
      linhas: lista.map(e => `[${e.origem}] ${e.mensagem}${e.onde ? ` (${e.onde})` : ''}`)
    });
  }

  // Passa a copiar para a tabela tudo que o servidor manda para o log de erro.
  function vigiarConsole() {
    console.error = (...args) => {
      logOriginal(...args);
      try { registrar('servidor', textoDoLog(args)); } catch (e) { /* nunca atrapalha o log */ }
    };
    process.on('unhandledRejection', motivo => console.error('Promessa sem tratamento:', motivo));
  }

  return { registrar, gravar, vigiarConsole, buffer };
}

function registrarRotasDeErros(app, { pool, vigia, limitar, auth, exigirModerador }) {
  // O site manda os erros do navegador. Sem login (erro também acontece antes
  // de entrar) e com freio por endereço.
  const freio = limitar(auth.criarFreio(20, 10 * 60 * 1000), 'Erros demais.');
  app.post('/api/erros', freio, (req, res) => {
    const { mensagem, onde, tela } = req.body || {};
    vigia.registrar('site', tela ? `${mensagem} [tela: ${String(tela).slice(0, 30)}]` : mensagem, onde);
    res.status(204).end();
  });

  app.get('/api/admin/erros', exigirModerador, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, origem, mensagem, onde, vezes, primeira_vez, ultima_vez FROM erros_site
          ORDER BY ultima_vez DESC LIMIT 30`);
      res.json({ erros: rows });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui carregar os erros agora.' });
    }
  });

  // Resolvido: some da lista. Se voltar a acontecer, aparece de novo como novo.
  app.delete('/api/admin/erros', exigirModerador, async (req, res) => {
    try {
      await pool.query('DELETE FROM erros_site');
      res.json({ message: 'Lista de erros limpa.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui limpar agora.' });
    }
  });
}

module.exports = { criarVigia, registrarRotasDeErros, limpar, chaveDo, deveIgnorar, textoDoLog, INTERVALO_GRAVAR, MUITOS_DE_UMA_VEZ };
