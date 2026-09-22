import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MENSAGENS, validarManifesto, ManifestoInvalido } from '../dist/index.js'

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

const valido = () => ({
  zona: 'zona1',
  modulos: [
    { id: 'zona1.painel', rotulo: 'Painel', prefixo: '/zona1', restritoPorPadrao: false },
    { id: 'zona1.relatorios', rotulo: 'Relatórios', prefixo: '/zona1/relatorios', restritoPorPadrao: true },
  ],
  perfis: [{ id: 'zona1.analista', rotulo: 'Analista' }],
  concessoes: { 'zona1.analista': ['zona1.relatorios'] },
})

test('manifesto valido passa inteiro', () => {
  const m = validarManifesto(valido())
  assert.equal(m.zona, 'zona1')
  assert.equal(m.modulos.length, 2)
})

test('shell e a unica zona na raiz', () => {
  const shell = { zona: 'shell', modulos: [{ id: 'shell.inicio', rotulo: 'Início', prefixo: '/', restritoPorPadrao: false }], perfis: [], concessoes: {} }
  assert.equal(validarManifesto(shell).zona, 'shell')
  const m = valido(); m.modulos[0].prefixo = '/'
  assert.throws(() => validarManifesto(m), ManifestoInvalido)
})

for (const [caso, mutar] of [
  ['modulo com id de outra zona', (m) => { m.modulos[1].id = 'zona2.relatorios' }],
  ['modulo com prefixo de outra zona', (m) => { m.modulos[1].prefixo = '/zona2/relatorios' }],
  ['prefixo que so comeca com o nome da zona', (m) => { m.modulos[1].prefixo = '/zona10' }],
  ['prefixo com travessia', (m) => { m.modulos[1].prefixo = '/zona1/../acesso' }],
  ['perfil de outra zona', (m) => { m.perfis[0].id = 'plataforma.admin' }],
  ['concessao para modulo de outra zona (D8)', (m) => { m.concessoes['zona1.analista'] = ['acesso.admin'] }],
  ['concessao de perfil nao declarado', (m) => { m.concessoes['zona1.intruso'] = ['zona1.painel'] }],
  ['restrito nao booleano', (m) => { m.modulos[0].restritoPorPadrao = 'false' }],
  ['modulo duplicado', (m) => { m.modulos[1].id = 'zona1.painel' }],
  ['id so com o prefixo', (m) => { m.modulos[0].id = 'zona1.' }],
  ['perfil duplicado', (m) => { m.perfis.push({ id: 'zona1.analista', rotulo: 'De novo' }) }],
]) {
  test(`recusa ${caso}`, () => {
    const m = valido()
    mutar(m)
    assert.throws(() => validarManifesto(m), ManifestoInvalido)
  })
}

test('zona plataforma e reservada: perfil global nao nasce de manifesto (invariante 17)', () => {
  const m = { zona: 'plataforma', modulos: [{ id: 'plataforma.x', rotulo: 'X', prefixo: '/plataforma', restritoPorPadrao: false }],
              perfis: [{ id: 'plataforma.super', rotulo: 'Super' }], concessoes: {} }
  assert.throws(() => validarManifesto(m), ManifestoInvalido)
})

test('contratos v2: tipos de acesso efetivo e decisao sao exportados', async () => {
  const mod = await import('../dist/index.js')
  assert.ok(mod.ManifestoInvalido)
  assert.ok(mod.MENSAGENS)
})
