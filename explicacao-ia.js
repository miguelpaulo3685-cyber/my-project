// "Por que errei?": explicação de uma questão do ENEM gerada por IA (Gemini, do
// Google, no plano gratuito).
//
// Vai para a IA só a questão (texto, figuras, alternativas e gabarito), que é
// pública. Nada do aluno vai junto. Cada questão é explicada uma vez só: a
// explicação fica guardada e serve para todo mundo que errar a mesma questão.
// Fica desligada sem GEMINI_API_KEY no servidor.

const axios = require('axios');

// O Google aposenta modelos de tempos em tempos (o gemini-2.5-flash saiu em
// novembro de 2026). Por isso o servidor pergunta à própria API quais modelos
// a chave pode usar e escolhe o "flash" mais novo, com o "flash-lite" mais
// novo de reserva. GEMINI_MODELO, se existir, é tentado primeiro.
const API = 'https://generativelanguage.googleapis.com/v1beta';
const MODELOS_RESERVA = ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'];
const VALIDADE_DA_LISTA = 12 * 60 * 60 * 1000;
let listaGuardada = { em: 0, modelos: null };
// Para a Administração: o que aconteceu na última tentativa.
const estado = { ok: null, modelo: null, erro: null, em: null, antes: [], recusadas: [] }; // recusadas: últimas barradas pela trava // antes: modelos que falharam nesta tentativa

function escolherModelos(lista) {
  const estaveis = (Array.isArray(lista) ? lista : [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => String(m.name || '').replace(/^models\//, ''))
    .map(nome => ({ nome, m: nome.match(/^gemini-(\d+(?:\.\d+)?)-flash(-lite)?$/) })) // sem "preview", "exp", "tts", "image"
    .filter(x => x.m)
    .map(x => ({ nome: x.nome, versao: Number(x.m[1]), lite: Boolean(x.m[2]) }));
  const melhor = lite => estaveis.filter(e => e.lite === lite).sort((a, b) => b.versao - a.versao)[0];
  return [melhor(false), melhor(true)].filter(Boolean).map(e => e.nome);
}

async function modelosParaTentar(http) {
  if (!listaGuardada.modelos || Date.now() - listaGuardada.em > VALIDADE_DA_LISTA) {
    let achados = [];
    try {
      const r = await http.get(`${API}/models?pageSize=200`, { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY }, timeout: 15000 });
      achados = escolherModelos(r.data && r.data.models);
    } catch (e) { /* sem a lista, vale a reserva */ }
    listaGuardada = { em: achados.length ? Date.now() : 0, modelos: achados.length ? achados : MODELOS_RESERVA };
  }
  const escolhido = process.env.GEMINI_MODELO;
  return [...new Set([...(escolhido ? [escolhido] : []), ...listaGuardada.modelos])];
}

// O motivo do erro, do jeito que o Google respondeu (nunca traz a chave).
const motivoDoErro = erro => [erro.response?.status, erro.response?.data?.error?.message || erro.message].filter(Boolean).join(' ').slice(0, 300);
const MODELO = () => estado.modelo || process.env.GEMINI_MODELO || MODELOS_RESERVA[0];
const LIMITE_DO_DIA = () => Number(process.env.EXPLICACAO_LIMITE_DIARIO) || 400;
const ligada = () => Boolean(process.env.GEMINI_API_KEY);
const LETRAS = ['A', 'B', 'C', 'D', 'E'];
const MAX_FIGURAS = 4;
const MAX_BYTES_FIGURA = 4 * 1024 * 1024;

const INSTRUCOES = `Você é um professor de cursinho que explica questões do ENEM para estudantes, muitos adolescentes.
Explique a questão em português do Brasil, de forma clara, curta e didática:
1. O que a questão pede, em uma ou duas frases.
2. O raciocínio ou a conta até a resposta certa, passo a passo.
3. Por que cada alternativa errada está errada: uma linha para cada, sempre no formato "A) motivo", dizendo qual foi o engano de quem marcou essa letra. Não escreva linha para a alternativa certa. Se você não sabe de que conta errada sai aquele valor, não invente um engano: mostre com os números da questão por que o valor não serve.
Use o gabarito informado como a resposta certa. Use **negrito** só para o essencial. Não invente dados que não estão na questão.
Antes de responder, refaça a conta: cada passo tem de fechar e o resultado final tem de ser exatamente o do gabarito. Nunca escreva uma conta cujo resultado não bate com o que você afirma.
Se a questão depende de uma figura e você não consegue ver com certeza o que ela mostra (quantas regiões, valores do gráfico, medidas), não chute: diga em uma frase o que não deu para ler e explique só o caminho do raciocínio.
Não cumprimente nem se apresente: comece direto pelo item 1. Escreva só a versão final: nada de "espere", "opa" ou contas refeitas no meio do texto.
Não use LaTeX nem cifrões: escreva as contas em texto simples, com × e ÷ (exemplo: 4 × 3 = 12).
Se a sua conta não chegar ao gabarito (o enunciado pode estar com erro), não force o resultado: responda apenas uma linha começando com NAO_BATE: e o motivo.
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

// ---------- trava de qualidade ----------
// Uma explicação errada com cara de certa é pior do que nenhuma. Antes de
// guardar (e de mostrar uma já guardada), o servidor recusa o texto se a IA
// avisou que a conta não bate, se ela se corrigiu no meio do texto, se a
// resposta final não é a do gabarito ou se alguma conta simples escrita no
// texto está errada (ex.: "4 × 3 × 2 = 972").
const HESITACAO = /(^|[^a-zà-ú])(opa|ops|espere|vamos refazer|refazendo a conta|me enganei|o gabarito oficial (da questão )?é|aceita pela banca)([^a-zà-ú]|$)/i;
const NUMERO = '\\d{1,3}(?:[ .]\\d{3})+(?:,\\d+)?|\\d+(?:[.,]\\d+)?';
const CONTA = new RegExp(`(?<![×÷*/+\\-=^(]\\s*)(?<![\\d.,])(?<!\\d[ .])((?:${NUMERO})(?:\\s*[×÷*/+\\-]\\s*(?:${NUMERO}))+)\\s*=\\s*(-?(?:${NUMERO}))(?![ .,]?\\d)(?!\\s*[×÷*/+\\-^%⁰¹²³⁴-⁹])`, 'g');
const valor = t => Number(t.replace(/[ .](?=\d{3}(?:\D|$))/g, '').replace(',', '.'));

function calcular(expressao) {
  const partes = expressao.split(/\s*([×÷*/+\-])\s*/).filter(Boolean);
  const pilha = [valor(partes[0])];
  for (let i = 1; i < partes.length; i += 2) {
    const n = valor(partes[i + 1]);
    if (partes[i] === '×' || partes[i] === '*') pilha.push(pilha.pop() * n);
    else if (partes[i] === '÷' || partes[i] === '/') pilha.push(pilha.pop() / n);
    else pilha.push(partes[i] === '-' ? -n : n);
  }
  return pilha.reduce((a, b) => a + b, 0);
}

// As contas simples do texto (só números, × ÷ + −) cujo resultado escrito não confere.
function contasErradas(texto) {
  const limpo = String(texto || '').replace(/\$|\*\*/g, '').replace(/\\times|\\cdot|·/g, '×').replace(/\\div/g, '÷').replace(/−|–/g, '-');
  const erradas = [];
  for (const m of limpo.matchAll(CONTA)) {
    const certo = calcular(m[1]);
    const escrito = valor(m[2]);
    if (!Number.isFinite(certo) || !Number.isFinite(escrito)) continue;
    // Só inteiros com × + −: tem de dar exato. Com divisão ou decimais, aceita arredondamento de até 1%.
    const exata = !/[÷/,]/.test(m[1]) && !/\d\.\d{1,2}(\D|$)/.test(m[1]);
    const folga = exata ? 1e-9 : Math.max(0.01 * Math.abs(certo), 0.051);
    if (Math.abs(certo - escrito) > folga) erradas.push(m[0].trim());
  }
  return erradas;
}

function problemaNaExplicacao(texto, q) {
  const t = String(texto || '');
  if (/NAO_BATE/.test(t)) return `a conta da IA não chegou ao gabarito (${t.replace(/\s+/g, ' ').slice(0, 160)})`;
  const final = t.match(/Resposta:\s*\**\s*([A-E])\b/g);
  if (!final || !final[final.length - 1].endsWith(LETRAS[q.correta])) return 'a resposta final não é a do gabarito';
  if (HESITACAO.test(t)) return 'a IA se corrigiu no meio do texto';
  const erradas = contasErradas(t);
  if (erradas.length) return `conta que não fecha: ${erradas[0].slice(0, 80)}`;
  return null;
}

// Tenta os modelos em ordem: se um foi aposentado, está sem cota ou fora do ar, vai o próximo.
async function explicarComModelo(q, http = axios) {
  const figuras = await baixarFiguras([q.contexto, ...(q.alternativas || [])].flatMap(urlsDasFiguras), http);
  const modelos = await modelosParaTentar(http);
  let ultimoErro = null;
  const antes = [];
  for (const modelo of modelos) {
    try {
      const r = await http.post(
        `${API}/models/${modelo}:generateContent`,
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
      const problema = problemaNaExplicacao(texto, q);
      if (problema) throw Object.assign(new Error(`explicação recusada: ${problema}`), { recusada: problema });
      Object.assign(estado, { ok: true, modelo, erro: null, em: new Date().toISOString(), antes });
      return { texto: texto.slice(0, 6000), modelo };
    } catch (erro) {
      ultimoErro = erro;
      antes.push({ modelo, erro: motivoDoErro(erro) });
      Object.assign(estado, { ok: false, modelo, erro: motivoDoErro(erro), em: new Date().toISOString(), antes: antes.slice(0, -1) });
      // Chave recusada: trocar de modelo não resolve.
      if (erro.response?.status === 401) break;
    }
  }
  if (ultimoErro && ultimoErro.recusada) {
    estado.recusadas = [{ questao: `${q.ano || '?'}-${q.numero || '?'}`, motivo: ultimoErro.recusada }, ...estado.recusadas].slice(0, 10);
  } else {
    listaGuardada.em = 0; // na próxima, pergunta de novo quais modelos existem
  }
  throw ultimoErro;
}
const explicarQuestao = async (q, http) => (await explicarComModelo(q, http)).texto;

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

// O aluno espera no máximo isto. Se a IA demorar mais (modelo principal
// sobrecarregado), a rota responde "demorando" e a explicação continua sendo
// feita no servidor: o site pergunta de novo sozinho e pega a mesma geração.
const ESPERA_DO_ALUNO = 20000;

function registrarExplicacoes(app, { pool, auth, exigirModerador, espera = ESPERA_DO_ALUNO, explicar = explicarComModelo }) {
  // Por aparelho: 30 explicações novas por hora. As já guardadas não contam.
  const freio = auth.criarFreio(30, 60 * 60 * 1000);
  const emAndamento = new Map(); // a mesma questão pedida por dois alunos ao mesmo tempo gera uma vez só
  const recusadas = new Map();   // questão barrada pela trava: só tenta de novo no dia seguinte (ou se a equipe apagar)
  const SEM_EXPLICACAO = 'A IA não conseguiu explicar esta questão com segurança. Veja a resolução em vídeo logo abaixo.';

  app.post('/api/questoes/:id/explicacao', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Questão não encontrada.' });
    try {
      const guardada = (await pool.query(
        'SELECT e.texto, q.correta FROM explicacoes_ia e JOIN questoes q ON q.id = e.questao_id WHERE e.questao_id = $1', [id])).rows[0];
      const marcada = Number.isInteger(req.body?.marcada) ? req.body.marcada : -1;
      if (guardada) {
        // Guardada antes da trava (ou antes de uma correção do gabarito): se não passa, sai e é refeita.
        const problema = problemaNaExplicacao(guardada.texto, guardada);
        if (!problema) return res.json({ explicacao: guardada.texto, sua: trechoDaAlternativa(guardada.texto, marcada) });
        console.log(`🧹 Explicação da questão ${id} apagada pela trava: ${problema}`);
        await pool.query('DELETE FROM explicacoes_ia WHERE questao_id = $1', [id]);
      }
      if (recusadas.has(id) && Date.now() - recusadas.get(id) < 24 * 60 * 60 * 1000) return res.status(422).json({ error: SEM_EXPLICACAO });
      if (!ligada()) return res.status(503).json({ error: 'A explicação por IA ainda não está disponível.' });
      // Quem pergunta de novo por uma geração já em andamento não gasta o freio nem o limite do dia.
      if (!emAndamento.has(id)) {
        if (freio.bloqueado(req.ip)) return res.status(429).json({ error: 'Muitas explicações seguidas. Espere um pouco.' });
        const hoje = (await pool.query(`SELECT COUNT(*)::int AS n FROM explicacoes_ia WHERE created_at > NOW() - INTERVAL '1 day'`)).rows[0].n;
        if (hoje >= LIMITE_DO_DIA()) return res.status(429).json({ error: 'As explicações novas de hoje acabaram. Amanhã tem mais!' });
        freio.registrar(req.ip);
      }

      if (!emAndamento.has(id)) {
        // Nunca rejeita: devolve { texto } ou { erro }, porque pode terminar depois de o aluno já ter recebido "demorando".
        emAndamento.set(id, (async () => {
          try {
            const q = (await pool.query('SELECT ano, numero, contexto, alternativas, correta FROM questoes WHERE id = $1', [id])).rows[0];
            if (!q) return { texto: null };
            const { texto, modelo } = await explicar(q);
            await pool.query(
              `INSERT INTO explicacoes_ia (questao_id, texto, modelo) VALUES ($1, $2, $3) ON CONFLICT (questao_id) DO NOTHING`,
              [id, texto, modelo]);
            return { texto };
          } catch (erro) {
            console.error(`Erro na explicação por IA da questão ${id}:`, motivoDoErro(erro));
            if (erro.recusada) recusadas.set(id, Date.now());
            return { erro };
          } finally { emAndamento.delete(id); }
        })());
      }
      let relogio;
      const resultado = await Promise.race([
        emAndamento.get(id),
        new Promise(pronto => { relogio = setTimeout(() => pronto({ demorando: true }), espera); })
      ]);
      clearTimeout(relogio);
      if (resultado.demorando) return res.status(202).json({ demorando: true });
      if (resultado.erro) throw resultado.erro;
      const texto = resultado.texto;
      if (!texto) return res.status(404).json({ error: 'Questão não encontrada.' });
      res.json({ explicacao: texto, sua: trechoDaAlternativa(texto, marcada) });
    } catch (erro) {
      if (erro.recusada) return res.status(422).json({ error: SEM_EXPLICACAO });
      if (!erro.response && !erro.recusada) console.error(`Erro na explicação por IA da questão ${id}:`, motivoDoErro(erro));
      const ocupada = erro.response?.status === 429;
      res.status(ocupada ? 429 : 502).json({ error: ocupada ? 'A IA está ocupada agora. Tente de novo em alguns minutos.' : 'Não consegui explicar agora. Tente de novo.' });
    }
  });

  // Administração: a IA está respondendo? Com qual modelo, ou por que não.
  if (exigirModerador) {
    // Explicação errada: a equipe apaga e a próxima pessoa que pedir gera outra.
    app.delete('/api/admin/questoes/:id/explicacao', exigirModerador, async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Questão não encontrada.' });
      try {
        const r = await pool.query('DELETE FROM explicacoes_ia WHERE questao_id = $1', [id]);
        recusadas.delete(id);
        res.json({ apagada: r.rowCount > 0 });
      } catch (erro) {
        res.status(500).json({ error: 'Não deu certo agora.' });
      }
    });
    app.get('/api/admin/ia', exigirModerador, async (req, res) => {
      const guardadas = (await pool.query('SELECT COUNT(*)::int AS n FROM explicacoes_ia').catch(() => ({ rows: [{ n: null }] }))).rows[0].n;
      res.json({ explicacao: { ligada: ligada(), ...estado, guardadas } });
    });
  }
}

module.exports = registrarExplicacoes;
Object.assign(module.exports, { ligada, explicarQuestao, explicarComModelo, escolherModelos, problemaNaExplicacao, contasErradas, estado, trechoDaAlternativa, montarPergunta, urlsDasFiguras, semFiguras, MODELO });
