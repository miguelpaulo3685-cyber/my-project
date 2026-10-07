const nodemailer = require('nodemailer');
const axios = require('axios');

// Endereço onde o site está publicado. Os links dos e-mails apontam para cá,
// e nunca para um endereço vindo do navegador: senão alguém poderia pedir a
// redefinição da senha de outra pessoa com um link para um site falso.
const SITE_URL = (process.env.SITE_URL || 'https://miguelpaulo3685-cyber.github.io/my-project/').replace(/\/?$/, '/');

// O Render define RENDER=true; NODE_ENV pode não ter sido configurado lá.
const emProducao = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

// No Gmail o usuário SMTP já é o endereço. No Resend o usuário é "resend",
// então o remetente precisa vir de EMAIL_REMETENTE.
const remetente = process.env.EMAIL_REMETENTE ||
  (String(process.env.SMTP_USER || '').includes('@') ? `M&M Estudos <${process.env.SMTP_USER}>` : '');

// Dois jeitos de enviar:
// - Brevo, pela API HTTPS. O plano grátis do Render bloqueia as portas de
//   SMTP, mas não HTTPS. Tem prioridade quando BREVO_API_KEY existe.
// - SMTP genérico (Gmail com senha de app, Resend etc.).
const usaBrevo = Boolean(process.env.BREVO_API_KEY);
const usaSmtp = !usaBrevo && Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const configurado = Boolean((usaBrevo || usaSmtp) && remetente);
if ((process.env.BREVO_API_KEY || process.env.SMTP_HOST) && !configurado) {
  console.error('❌ E-mail mal configurado: falta o remetente (EMAIL_REMETENTE).');
}

// "M&M Estudos <x@gmail.com>" -> { name, email }
function separarRemetente(texto) {
  const m = texto.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || 'M&M Estudos', email: m[2] } : { name: 'M&M Estudos', email: texto.trim() };
}

const transporte = usaSmtp && configurado && nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function montar({ nome, titulo, texto, botao, link, rodape }) {
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#141828">
  <p style="font-size:18px;font-weight:bold;color:#6d5efc;margin:0 0 24px">M&amp;M Estudos</p>
  <p style="font-size:16px">Oi, ${escaparHtml(nome)}!</p>
  <p style="font-size:15px;line-height:1.6">${texto}</p>
  <p style="margin:28px 0">
    <a href="${link}" style="background:#6d5efc;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:bold;display:inline-block">${botao}</a>
  </p>
  <p style="font-size:13px;color:#697189;line-height:1.6">Se o botão não funcionar, copie este endereço no navegador:<br>
  <span style="word-break:break-all">${link}</span></p>
  <p style="font-size:13px;color:#697189;line-height:1.6">${rodape}</p>
</div>`;
  const textoPuro = `Oi, ${nome}!\n\n${texto.replace(/<[^>]+>/g, '')}\n\n${link}\n\n${rodape}`;
  return { subject: titulo, html, text: textoPuro };
}

async function enviar(para, mensagem) {
  if (!configurado) {
    // Sem SMTP o e-mail não sai. Em produção isso é erro; rodando local,
    // mostrar o link no terminal basta para testar.
    if (emProducao) throw new Error('Envio de e-mail não configurado (BREVO_API_KEY ou SMTP_*).');
    console.log(`📧 [e-mail não enviado: envio não configurado] Para ${para}: ${mensagem.subject}\n${mensagem.text}`);
    return;
  }

  if (usaBrevo) {
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: separarRemetente(remetente),
        to: [{ email: para }],
        subject: mensagem.subject,
        htmlContent: mensagem.html,
        textContent: mensagem.text
      }, { headers: { 'api-key': process.env.BREVO_API_KEY }, timeout: 15000 });
    } catch (erro) {
      // A mensagem do Brevo diz o motivo (chave errada, remetente não
      // verificado...); sem ela o log mostraria só "status 400".
      const motivo = erro.response?.data?.message || erro.message;
      throw new Error(`Brevo recusou o envio: ${motivo}`);
    }
    return;
  }

  await transporte.sendMail({ from: remetente, to: para, ...mensagem });
}

function enviarRedefinicao(para, nome, token) {
  return enviar(para, montar({
    nome,
    titulo: 'Redefinir sua senha',
    texto: 'Recebemos um pedido para trocar a senha da sua conta. Clique no botão abaixo para escolher uma nova. O link vale por <b>1 hora</b> e só pode ser usado uma vez.',
    botao: 'Escolher nova senha',
    link: `${SITE_URL}?redefinir=${token}`,
    rodape: 'Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.'
  }));
}

function enviarConfirmacao(para, nome, token) {
  return enviar(para, montar({
    nome,
    titulo: 'Confirme seu e-mail',
    texto: 'Sua conta no M&amp;M Estudos foi criada. Confirme que este e-mail é seu: é por ele que você recupera a conta se esquecer a senha.',
    botao: 'Confirmar meu e-mail',
    link: `${SITE_URL}?confirmar=${token}`,
    rodape: 'Se você não criou uma conta, ignore este e-mail.'
  }));
}

module.exports = { configurado, emProducao, enviarRedefinicao, enviarConfirmacao };
