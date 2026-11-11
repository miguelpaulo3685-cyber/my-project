// Quem vê as notas de cada pessoa (nota TRI na comunidade e resultado no ranking
// do Desafio): 'todos', 'amigos' (quem eu sigo e me segue) ou 'eu' (só eu).
// O padrão é 'amigos': muita gente aqui é menor de idade e nem todo mundo quer
// a nota à vista de qualquer perfil.

const OPCOES_NOTAS = ['todos', 'amigos', 'eu'];
const PADRAO_NOTAS = 'amigos';

// Condição SQL: "quem" (id de quem olha, pode ser NULL sem conta) pode ver as
// notas da pessoa da tabela "u"?
const podeVerNotasSql = (quem, u) => `(COALESCE(${u}.quem_ve_notas, '${PADRAO_NOTAS}') = 'todos' OR ${u}.id = ${quem}
  OR (COALESCE(${u}.quem_ve_notas, '${PADRAO_NOTAS}') = 'amigos'
      AND EXISTS (SELECT 1 FROM seguidores sv1 WHERE sv1.seguidor_id = ${quem} AND sv1.seguido_id = ${u}.id)
      AND EXISTS (SELECT 1 FROM seguidores sv2 WHERE sv2.seguidor_id = ${u}.id AND sv2.seguido_id = ${quem})))`;

// Atividades que mostram nota: a primeira nota TRI ou recorde, e o Desafio.
const TIPOS_COM_NOTA = ['tri', 'desafio'];
const atividadeVisivelSql = (quem, a, u) =>
  `(${a}.tipo NOT IN (${TIPOS_COM_NOTA.map(t => `'${t}'`).join(', ')}) OR ${podeVerNotasSql(quem, u)})`;

module.exports = { OPCOES_NOTAS, PADRAO_NOTAS, podeVerNotasSql, atividadeVisivelSql, TIPOS_COM_NOTA };
