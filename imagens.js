// Fotos enviadas pelos alunos (capa das publicações e foto de perfil).
//
// O navegador já reduz a foto e a converte para JPEG antes de enviar, mas o
// servidor não confia nisso: confere que é um JPEG de verdade, limita o
// tamanho e tira os metadados. Foto de celular costuma levar a localização
// GPS de onde foi tirada, e muita gente aqui é menor de idade.

const crypto = require('crypto');

const TAMANHO_MAXIMO = 450 * 1024; // depois de decodificar o base64

// ---------- links assinados ----------
// Perfis e fotos são só para quem tem conta, mas o navegador carrega uma
// <img> sem mandar o login. Então o servidor só entrega a foto se o link
// tiver uma assinatura dele, que vence em algumas horas: quem está logado
// recebe links válidos, e um link copiado para fora para de funcionar.
// Sem SEGREDO_IMAGENS, o segredo muda a cada reinício e os links antigos
// vencem junto; o site pede links novos ao abrir o perfil.
const SEGREDO = process.env.SEGREDO_IMAGENS || crypto.randomBytes(32).toString('hex');
const HORA = 3600;
const VALIDADE_HORAS = 6;

function assinatura(id, ate) {
  return crypto.createHmac('sha256', SEGREDO).update(`${id}.${ate}`).digest('hex').slice(0, 32);
}

// O vencimento é arredondado para a hora cheia: o mesmo link vale por um
// tempo e o navegador aproveita o cache em vez de baixar a foto de novo.
function urlAssinada(id, agora = Date.now()) {
  if (!id) return null;
  const ate = (Math.floor(agora / 1000 / HORA) + VALIDADE_HORAS) * HORA;
  return `/api/imagens/${id}?ate=${ate}&ass=${assinatura(id, ate)}`;
}

function assinaturaValida(id, ate, ass, agora = Date.now()) {
  const vence = Number(ate);
  if (!Number.isInteger(vence) || vence * 1000 < agora || typeof ass !== 'string' || ass.length !== 32) return false;
  return crypto.timingSafeEqual(Buffer.from(ass), Buffer.from(assinatura(id, vence)));
}

// Recebe "data:image/jpeg;base64,..." e devolve { dados: Buffer } ou { erro }.
function lerImagem(dataUrl) {
  if (typeof dataUrl !== 'string') return { erro: 'Imagem inválida.' };
  const m = dataUrl.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return { erro: 'Envie a imagem em JPEG.' };
  // 4 caracteres de base64 viram 3 bytes: dá para recusar sem decodificar.
  if (m[1].length * 3 / 4 > TAMANHO_MAXIMO + 3) return { erro: 'Imagem grande demais.' };
  const dados = Buffer.from(m[1], 'base64');
  if (dados.length > TAMANHO_MAXIMO) return { erro: 'Imagem grande demais.' };
  if (dados.length < 4 || dados[0] !== 0xFF || dados[1] !== 0xD8 || dados[2] !== 0xFF) {
    return { erro: 'O arquivo não é uma imagem JPEG.' };
  }
  const limpo = tirarMetadados(dados);
  if (!limpo) return { erro: 'Não consegui ler essa imagem.' };
  return { dados: limpo };
}

// Um JPEG é uma sequência de blocos (marcador 0xFF + tipo + tamanho). Os
// blocos APP1 a APP15 guardam metadados (EXIF com GPS, XMP, miniaturas) e
// COM guarda comentários: nada disso é necessário para mostrar a foto.
// APP0 (JFIF) fica, porque alguns leitores esperam por ele.
function tirarMetadados(dados) {
  const partes = [dados.subarray(0, 2)]; // SOI
  let i = 2;
  while (i < dados.length) {
    if (dados[i] !== 0xFF) return null;
    const tipo = dados[i + 1];
    if (tipo === 0xFF) { i++; continue; } // preenchimento entre blocos
    if (tipo === 0xDA) { partes.push(dados.subarray(i)); break; } // SOS: daqui para frente é a imagem
    if (tipo === 0xD9) { partes.push(dados.subarray(i, i + 2)); break; } // EOI
    if (i + 4 > dados.length) return null;
    const tamanho = dados.readUInt16BE(i + 2);
    if (tamanho < 2 || i + 2 + tamanho > dados.length) return null;
    const metadado = (tipo >= 0xE1 && tipo <= 0xEF) || tipo === 0xFE;
    if (!metadado) partes.push(dados.subarray(i, i + 2 + tamanho));
    i += 2 + tamanho;
  }
  return Buffer.concat(partes);
}

module.exports = { lerImagem, tirarMetadados, urlAssinada, assinaturaValida, TAMANHO_MAXIMO };
