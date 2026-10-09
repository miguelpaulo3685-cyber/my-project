const test = require('node:test');
const assert = require('node:assert');
const auth = require('../auth');

test('senha: confere a certa e recusa a errada', async () => {
  const guardado = await auth.criarHashDeSenha('segredo123');
  assert.ok(!guardado.includes('segredo123'), 'a senha não pode aparecer no que fica guardado');
  assert.strictEqual(await auth.senhaConfere('segredo123', guardado), true);
  assert.strictEqual(await auth.senhaConfere('segredo124', guardado), false);
});

test('senha: mesmo texto gera hashes diferentes (sal aleatório)', async () => {
  const a = await auth.criarHashDeSenha('segredo123');
  const b = await auth.criarHashDeSenha('segredo123');
  assert.notStrictEqual(a, b);
});

test('senha: recusa senha gigante sem calcular hash', async () => {
  const guardado = await auth.criarHashDeSenha('segredo123');
  assert.strictEqual(await auth.senhaConfere('a'.repeat(5000), guardado), false);
  assert.match(auth.problemaNaSenha('a1'.repeat(100)), /no máximo/);
});

test('regras de senha', () => {
  assert.match(auth.problemaNaSenha('abc12'), /pelo menos/);
  assert.match(auth.problemaNaSenha('somenteletras'), /letras e números/);
  assert.match(auth.problemaNaSenha('12345678'), /letras e números/);
  assert.strictEqual(auth.problemaNaSenha('boa12345'), null);
  assert.ok(auth.problemaNaSenha(undefined));
});

test('e-mail: recusa formato inválido, longo demais e domínio com erro de digitação', async () => {
  assert.match(await auth.problemaNoEmail('sem-arroba'), /não parece válido/);
  assert.match(await auth.problemaNoEmail('a'.repeat(250) + '@gmail.com'), /não parece válido/);
  assert.match(await auth.problemaNoEmail('aluno@gmial.com'), /gmail\.com/);
});

test('token de sessão: só o hash fica guardado e ele é estável', () => {
  const { token, hash } = auth.criarToken();
  assert.strictEqual(token.length, 64);
  assert.notStrictEqual(token, hash);
  assert.strictEqual(auth.hashDeToken(token), hash);
});

test('freio: bloqueia depois do limite e libera ao limpar', () => {
  const freio = auth.criarFreio(3, 60 * 1000);
  for (let i = 0; i < 3; i++) {
    assert.strictEqual(freio.bloqueado('ip'), false);
    freio.registrar('ip');
  }
  assert.strictEqual(freio.bloqueado('ip'), true);
  assert.strictEqual(freio.bloqueado('outro-ip'), false, 'cada chave tem seu próprio limite');
  freio.limpar('ip');
  assert.strictEqual(freio.bloqueado('ip'), false);
});

test('e-mail: provedores conhecidos passam sem depender do DNS', async () => {
  assert.strictEqual(await auth.problemaNoEmail('aluno@gmail.com'), null);
  assert.strictEqual(await auth.problemaNoEmail('aluno@hotmail.com'), null);
});
