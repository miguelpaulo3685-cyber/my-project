const crypto = require('crypto');
const dns = require('dns').promises;
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const DIAS_DE_SESSAO = 30;
const TAMANHO_MINIMO_SENHA = 8;

// ============ SENHAS ============
// A senha nunca é guardada. Guardamos "salt:hash", e o hash scrypt não pode
// ser revertido: dá para conferir se a senha bate, nunca para descobrir qual é.

async function criarHashDeSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(senha, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function senhaConfere(senha, guardado) {
  if (!guardado || !guardado.includes(':')) return false;
  const [salt, hashGuardado] = guardado.split(':');
  const hashDaTentativa = await scrypt(senha, salt, 64);
  const esperado = Buffer.from(hashGuardado, 'hex');
  // timingSafeEqual evita que o tempo de resposta entregue pistas da senha.
  if (esperado.length !== hashDaTentativa.length) return false;
  return crypto.timingSafeEqual(esperado, hashDaTentativa);
}

// ============ TOKENS DE SESSÃO ============
// O token vai para o navegador; no banco fica só o hash dele. Assim, quem
// conseguir ler a tabela de sessões não consegue entrar na conta de ninguém.

function criarToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashDeToken(token) };
}

function hashDeToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function validadeDaSessao() {
  const d = new Date();
  d.setDate(d.getDate() + DIAS_DE_SESSAO);
  return d;
}

// ============ VALIDAÇÕES ============

function problemaNaSenha(senha) {
  if (typeof senha !== 'string' || senha.length < TAMANHO_MINIMO_SENHA) {
    return `A senha precisa de pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return 'A senha precisa misturar letras e números.';
  }
  return null;
}

const DOMINIOS_COMUNS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'yaho.com': 'yahoo.com'
};

// Confere o formato e pergunta ao DNS se o domínio realmente recebe e-mails.
// Isso pega erro de digitação e domínio inventado. O que NÃO dá para saber por
// aqui é se a caixa existe: só o Google sabe, e não conta para ninguém. Para
// isso seria preciso enviar um e-mail de confirmação ou usar login do Google.
async function problemaNoEmail(email) {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
    return 'Esse e-mail não parece válido.';
  }

  const dominio = email.split('@')[1].toLowerCase();
  if (DOMINIOS_COMUNS[dominio]) {
    return `Você quis dizer @${DOMINIOS_COMUNS[dominio]}?`;
  }

  try {
    const mx = await dns.resolveMx(dominio);
    if (!mx || mx.length === 0) return `O domínio @${dominio} não recebe e-mails.`;
  } catch (erro) {
    if (erro.code === 'ENOTFOUND' || erro.code === 'ENODATA') {
      return `O domínio @${dominio} não existe ou não recebe e-mails.`;
    }
    // DNS fora do ar não é culpa de quem está se cadastrando: deixa passar.
    console.error('Falha ao consultar DNS de', dominio, erro.code);
  }
  return null;
}

// ============ FREIO CONTRA FORÇA BRUTA ============
// Sem isso, dá para testar milhares de senhas. Guardado em memória: reinicia
// junto com o servidor, o que é aceitável para o tamanho deste projeto.

const tentativas = new Map();
const LIMITE = 5;
const JANELA_MS = 15 * 60 * 1000;

function bloqueado(chave) {
  const reg = tentativas.get(chave);
  if (!reg) return false;
  if (Date.now() - reg.desde > JANELA_MS) { tentativas.delete(chave); return false; }
  return reg.contagem >= LIMITE;
}

function registrarFalha(chave) {
  const reg = tentativas.get(chave);
  if (!reg || Date.now() - reg.desde > JANELA_MS) {
    tentativas.set(chave, { contagem: 1, desde: Date.now() });
  } else {
    reg.contagem++;
  }
}

function limparFalhas(chave) {
  tentativas.delete(chave);
}

module.exports = {
  criarHashDeSenha,
  senhaConfere,
  criarToken,
  hashDeToken,
  validadeDaSessao,
  problemaNaSenha,
  problemaNoEmail,
  bloqueado,
  registrarFalha,
  limparFalhas,
  DIAS_DE_SESSAO
};
