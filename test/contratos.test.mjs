import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACOES_PEDIDO, MENSAGENS } from '../dist/index.js'

test('ACOES_PEDIDO cobre exatamente as chaves de PermissoesPedido', () => {
  // `AcaoPedido` deriva de ACOES_PEDIDO, então o compilador já garante que o tipo
  // acompanha a constante. Este teste guarda o outro lado: que este literal de
  // exemplo, usado pelos testes de tipo, não fique para trás da constante.
  const permissoesDeExemplo = {
    editar: false, remover_remessa: false, excluir: false, aprovar: false,
  }
  assert.deepEqual([...ACOES_PEDIDO].sort(), Object.keys(permissoesDeExemplo).sort())
})

test('ACOES_PEDIDO nao tem duplicatas', () => {
  assert.equal(new Set(ACOES_PEDIDO).size, ACOES_PEDIDO.length)
})

test('MENSAGENS cobre todo codigo de erro e nenhuma mensagem vaza detalhe interno', () => {
  const esperados = ['REGISTRO_DESATUALIZADO', 'OPERACAO_NAO_PERMITIDA',
                     'SESSAO_EXPIRADA', 'DESTINO_INVALIDO', 'ERRO_INTERNO']
  assert.deepEqual(Object.keys(MENSAGENS).sort(), esperados.sort())
  for (const [codigo, texto] of Object.entries(MENSAGENS)) {
    assert.equal(typeof texto, 'string', codigo)
    assert.ok(texto.length > 0, codigo)
    for (const proibido of ['java', 'spring', 'SELECT', 'Exception', 'at ']) {
      assert.ok(!texto.includes(proibido), `${codigo} vaza "${proibido}"`)
    }
  }
})
