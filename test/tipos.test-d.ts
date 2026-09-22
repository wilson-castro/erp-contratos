import type { ManifestoDeZona, ModuloPermitido } from '../src/index.js'

export const modulo: ModuloPermitido = { id: 'zona1.painel', zona: 'zona1', rotulo: 'Painel', prefixo: '/zona1' }

// @ts-expect-error restritoPorPadrao é obrigatório: omitir não pode virar "livre" por acidente
export const semRestricao: ManifestoDeZona = { zona: 'z', perfis: [], concessoes: {}, modulos: [{ id: 'z.a', rotulo: 'A', prefixo: '/z' }] }

import type { AcessoEfetivo, ManifestoDeModulo } from '../src/index.js'

// O que as páginas recebem não tem onde guardar CPF nem papéis (invariante 1)
export const acesso: AcessoEfetivo = { modulos: [{ id: 'zona1', nome: 'Zona 1', funcionalidades: ['painel.ver'] }], administra: false }
// @ts-expect-error AcessoEfetivo não aceita papéis
export const comPapeis: AcessoEfetivo = { modulos: [], administra: true, papeis: [] }
// @ts-expect-error manifesto v2 não declara perfis: eles moram na gestão de acesso
export const comPerfis: ManifestoDeModulo = { id: 'zona1', nome: 'Z', funcionalidades: ['a.b'], perfis: [] }
