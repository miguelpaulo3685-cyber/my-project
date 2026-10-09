const crypto = require('crypto');
const dns = require('dns').promises;
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const DIAS_DE_SESSAO = 30;
const TAMANHO_MINIMO_SENHA = 8;
// Limite de cima: sem ele, alguém mandaria senhas enormes só para ocupar o
// servidor calculando hash.
const TAMANHO_MAXIMO_SENHA = 128;
const TAMANHO_MAXIMO_EMAIL = 254;

// ============ SENHAS ============
// A senha nunca é guardada. Guardamos "salt:hash", e o hash scrypt não pode
// ser revertido: dá para conferir se a senha bate, nunca para descobrir qual é.

async function criarHashDeSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(senha, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

// Quando o e-mail não existe, o login responderia mais rápido (não há hash
// para conferir), e pelo tempo daria para descobrir quem tem conta. Esta
// função gasta o mesmo tempo de uma conferência de verdade.
const SAL_FALSO = crypto.randomBytes(16).toString('hex');
async function gastarTempoDeConferencia(senha) {
  await scrypt(String(senha).slice(0, TAMANHO_MAXIMO_SENHA), SAL_FALSO, 64);
  return false;
}

async function senhaConfere(senha, guardado) {
  if (typeof senha !== 'string' || senha.length > TAMANHO_MAXIMO_SENHA) return false;
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
  if (senha.length > TAMANHO_MAXIMO_SENHA) {
    return `A senha pode ter no máximo ${TAMANHO_MAXIMO_SENHA} caracteres.`;
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

const PROVEDORES_CONHECIDOS = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br',
  'live.com', 'msn.com', 'yahoo.com', 'yahoo.com.br', 'icloud.com', 'me.com', 'uol.com.br',
  'bol.com.br', 'terra.com.br', 'ig.com.br', 'protonmail.com', 'proton.me'
]);

// Confere o formato e pergunta ao DNS se o domínio realmente recebe e-mails.
// Isso pega erro de digitação e domínio inventado. O que NÃO dá para saber por
// aqui é se a caixa existe: só o Google sabe, e não conta para ninguém. Para
// isso seria preciso enviar um e-mail de confirmação ou usar login do Google.
async function problemaNoEmail(email) {
  if (typeof email !== 'string' || email.length > TAMANHO_MAXIMO_EMAIL ||
      !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
    return 'Esse e-mail não parece válido.';
  }

  const dominio = email.split('@')[1].toLowerCase();
  if (DOMINIOS_COMUNS[dominio]) {
    return `Você quis dizer @${DOMINIOS_COMUNS[dominio]}?`;
  }

  // Provedores conhecidos recebem e-mail com certeza: consultar o DNS só
  // abriria a chance de recusar um aluno por uma falha passageira de rede.
  if (PROVEDORES_CONHECIDOS.has(dominio)) return null;

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

// ============ FREIOS ============
// Contam pedidos por chave (IP, IP+e-mail...) dentro de uma janela de tempo.
// Guardados em memória: reiniciam junto com o servidor, o que é aceitável
// para o tamanho deste projeto.

function criarFreio(limite, janelaMs) {
  const contagens = new Map();

  // Sem essa faxina o mapa cresceria para sempre com IPs que não voltam.
  setInterval(() => {
    const agora = Date.now();
    for (const [chave, reg] of contagens) {
      if (agora - reg.desde > janelaMs) contagens.delete(chave);
    }
  }, janelaMs).unref();

  return {
    bloqueado(chave) {
      const reg = contagens.get(chave);
      if (!reg) return false;
      if (Date.now() - reg.desde > janelaMs) { contagens.delete(chave); return false; }
      return reg.contagem >= limite;
    },
    registrar(chave) {
      const reg = contagens.get(chave);
      if (!reg || Date.now() - reg.desde > janelaMs) {
        contagens.set(chave, { contagem: 1, desde: Date.now() });
      } else {
        reg.contagem++;
      }
    },
    limpar(chave) {
      contagens.delete(chave);
    }
  };
}

// Sem isso, dá para testar milhares de senhas.
const freioDeSenha = criarFreio(5, 15 * 60 * 1000);

module.exports = {
  criarHashDeSenha,
  senhaConfere,
  gastarTempoDeConferencia,
  criarToken,
  hashDeToken,
  validadeDaSessao,
  problemaNaSenha,
  problemaNoEmail,
  criarFreio,
  freioDeSenha,
  DIAS_DE_SESSAO
};
