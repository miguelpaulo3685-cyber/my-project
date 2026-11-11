// "Por que errei?": explicação de uma questão do ENEM gerada por IA (Gemini, do
// Google, no plano gratuito).
//
// Vai para a IA só a questão (texto, figuras, alternativas e gabarito), que é
// pública. Nada do aluno vai junto. Cada questão é explicada uma vez só: a
// explicação fica guardada e serve para todo mundo que errar a mesma questão.
// Fica desligada sem GEMINI_API_KEY no servidor.

const axios = require('axios');

const MODELO = () => process.env.GEMINI_MODELO || 'gemini-2.5-flash';
const LIMITE_DO_DIA = () => Number(process.env.EXPLICACAO_LIMITE_DIARIO) || 400;
const ligada = () => Boolean(process.env.GEMINI_API_KEY);
const LETRAS = ['A', 'B', 'C', 'D', 'E'];
const MAX_FIGURAS = 4;
const MAX_BYTES_FIGURA = 4 * 1024 * 1024;

const INSTRUCOES = `Você é um professor de cursinho que explica questões do ENEM para estudantes, muitos adolescentes.
Explique a questão em português do Brasil, de forma clara, curta e didática:
1. O que a questão pede, em uma ou duas frases.
2. O raciocínio ou a conta até a resposta certa, passo a passo.
3. Por que cada alternativa errada está errada: uma linha para cada, sempre no formato "A) motivo", dizendo qual foi o engano de quem marcou essa letra.
Use o gabarito informado como a resposta certa. Use **negrito** só para o essencial. Não invente dados que não estão na questão.
Termine com a linha: **Resposta: X**.`;

const FIGURA = /!\[[^\]]*\]\(([^)\s]+)\)/g;
const urlsDasFiguras = texto => [...String(texto || '').matchAll(FIGURA)].map(m => m[1]);
const semFiguras = texto => String(texto || '').replace(FIGURA, '[figura]').trim();

// Baixa as figuras (gráficos, tabelas, charges) para a IA ver a questão inteira.
async function baixarFiguras(urls, http) {
  const partes = [];
  for (const url of urls.slice(0, MAX_FIGURAS)) {
    try {
      const r = await http.get(url, { responseType: 'arraybuffer', timeout: 15000, maxContentLength: MAX_BYTES_FIGURA });
      const tipo = String(r.headers?.['content-type'] || '').split(';')[0];
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(tipo)) continue;
      partes.push({ inline_data: { mime_type: tipo, data: Buffer.from(r.data).toString('base64') } });
    } catch (e) { /* sem a figura, a explicação segue só com o texto */ }
  }
  return partes;
}

function montarPergunta(q) {
  const alternativas = (q.alternativas || []).map((a, i) => `${LETRAS[i]}) ${semFiguras(a) || '[figura]'}`).join('\n');
  return `ENEM ${q.ano || ''}${q.numero ? `, questão ${q.numero}` : ''}\n\n${semFiguras(q.contexto)}\n\nAlternativas:\n${alternativas}\n\nGabarito: ${LETRAS[q.correta]}`;
}

async function explicarQuestao(q, http = axios) {
  const figuras = await baixarFiguras([q.contexto, ...(q.alternativas || [])].flatMap(urlsDasFiguras), http);
  const r = await http.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO()}:generateContent`,
    {
      systemInstruction: { parts: [{ text: INSTRUCOES }] },
      contents: [{ role: 'user', parts: [{ text: montarPergunta(q) }, ...figuras] }],
      generationConfig: { maxOutputTokens: 4096 }
    },
    { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' }, timeout: 60000 }
  );
  const candidato = r.data?.candidates?.[0];
  const texto = (candidato?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!texto) throw new Error(`a IA não devolveu explicação (${candidato?.finishReason || 'sem resposta'})`);
  return texto.slice(0, 6000);
}

// "Por que errei?": a linha da explicação que fala da alternativa que o aluno marcou
// (a IA escreve "C) motivo"; aceita também "**C)**", "- C)" e "C:").
function trechoDaAlternativa(texto, indice) {
  const letra = LETRAS[indice];
  if (!letra) return null;
  const padrao = new RegExp(`^[\\s>*•-]*\\**${letra}\\**\\s*[\\):.-]\\**\\s*(.+)$`);
  for (const linha of String(texto || '').split('\n')) {
    const m = linha.match(padrao);
    if (m && m[1].trim().length > 8) return m[1].replace(/\*\*/g, '').trim().slice(0, 500);
  }
  return null;
}

function registrarExplicacoes(app, { pool, auth }) {
  // Por aparelho: 30 explicações novas por hora. As já guardadas não contam.
  const freio = auth.criarFreio(30, 60 * 60 * 1000);
  const emAndamento = new Map(); // a mesma questão pedida por dois alunos ao mesmo tempo gera uma vez só

  app.post('/api/questoes/:id/explicacao', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Questão não encontrada.' });
    try {
      const guardada = (await pool.query('SELECT texto FROM explicacoes_ia WHERE questao_id = $1', [id])).rows[0];
      const marcada = Number.isInteger(req.body?.marcada) ? req.body.marcada : -1;
      if (guardada) return res.json({ explicacao: guardada.texto, sua: trechoDaAlternativa(guardada.texto, marcada) });
      if (!ligada()) return res.status(503).json({ error: 'A explicação por IA ainda não está disponível.' });
      if (freio.bloqueado(req.ip)) return res.status(429).json({ error: 'Muitas explicações seguidas. Espere um pouco.' });
      const hoje = (await pool.query(`SELECT COUNT(*)::int AS n FROM explicacoes_ia WHERE created_at > NOW() - INTERVAL '1 day'`)).rows[0].n;
      if (hoje >= LIMITE_DO_DIA()) return res.status(429).json({ error: 'As explicações novas de hoje acabaram. Amanhã tem mais!' });
      freio.registrar(req.ip);

      if (!emAndamento.has(id)) {
        emAndamento.set(id, (async () => {
          const q = (await pool.query('SELECT ano, numero, contexto, alternativas, correta FROM questoes WHERE id = $1', [id])).rows[0];
          if (!q) return null;
          const texto = await explicarQuestao(q);
          await pool.query(
            `INSERT INTO explicacoes_ia (questao_id, texto, modelo) VALUES ($1, $2, $3) ON CONFLICT (questao_id) DO NOTHING`,
            [id, texto, MODELO()]);
          return texto;
        })().finally(() => emAndamento.delete(id)));
      }
      const texto = await emAndamento.get(id);
      if (!texto) return res.status(404).json({ error: 'Questão não encontrada.' });
      res.json({ explicacao: texto, sua: trechoDaAlternativa(texto, marcada) });
    } catch (erro) {
      console.error(`Erro na explicação por IA da questão ${id}:`, erro.response?.status || '', erro.message);
      const ocupada = erro.response?.status === 429;
      res.status(ocupada ? 429 : 502).json({ error: ocupada ? 'A IA está ocupada agora. Tente de novo em alguns minutos.' : 'Não consegui explicar agora. Tente de novo.' });
    }
  });
}

module.exports = registrarExplicacoes;
Object.assign(module.exports, { ligada, explicarQuestao, trechoDaAlternativa, montarPergunta, urlsDasFiguras, semFiguras, MODELO });
