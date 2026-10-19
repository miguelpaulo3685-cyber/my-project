const test = require('node:test');
const assert = require('node:assert');
const { lerImagem, TAMANHO_MAXIMO } = require('../imagens');

// Monta um JPEG mínimo: SOI, APP0 (JFIF), APP1 (EXIF com "GPS"), COM, SOS e EOI.
function bloco(tipo, conteudo) {
  const b = Buffer.alloc(4 + conteudo.length);
  b[0] = 0xFF; b[1] = tipo; b.writeUInt16BE(conteudo.length + 2, 2);
  conteudo.copy(b, 4);
  return b;
}
const jpeg = Buffer.concat([
  Buffer.from([0xFF, 0xD8]),
  bloco(0xE0, Buffer.from('JFIF\0')),
  bloco(0xE1, Buffer.from('Exif\0\0GPS -22.9,-43.2')),
  bloco(0xFE, Buffer.from('comentario')),
  bloco(0xDA, Buffer.from([1, 2, 3])),
  Buffer.from([9, 9, 9, 0xFF, 0xD9])
]);
const dataUrl = b => 'data:image/jpeg;base64,' + b.toString('base64');

test('imagem: tira EXIF/GPS e comentários e mantém o resto', () => {
  const { dados, erro } = lerImagem(dataUrl(jpeg));
  assert.strictEqual(erro, undefined);
  assert.ok(!dados.includes('GPS'), 'a localização não pode sobrar');
  assert.ok(!dados.includes('comentario'));
  assert.ok(dados.includes('JFIF'));
  assert.deepStrictEqual([...dados.subarray(-5)], [9, 9, 9, 0xFF, 0xD9], 'os dados da foto ficam intactos');
});

test('imagem: recusa o que não é JPEG, base64 quebrado e arquivo grande', () => {
  assert.ok(lerImagem('data:image/png;base64,iVBORw0KGgo=').erro);
  assert.ok(lerImagem(dataUrl(Buffer.from('<svg onload=alert(1)>'))).erro);
  assert.ok(lerImagem('data:image/jpeg;base64,@@@').erro);
  assert.ok(lerImagem(null).erro);
  const grande = Buffer.concat([jpeg.subarray(0, 2), Buffer.alloc(TAMANHO_MAXIMO + 10)]);
  assert.match(lerImagem(dataUrl(grande)).erro, /grande/);
  // bloco com tamanho que passa do fim do arquivo
  assert.ok(lerImagem(dataUrl(Buffer.from([0xFF, 0xD8, 0xFF, 0xE1, 0x10, 0x00, 1]))).erro);
});
