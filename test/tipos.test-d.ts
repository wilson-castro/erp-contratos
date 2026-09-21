import type { ManifestoDeZona, ModuloPermitido } from '../src/index.js'

export const modulo: ModuloPermitido = { id: 'zona1.painel', zona: 'zona1', rotulo: 'Painel', prefixo: '/zona1' }

// @ts-expect-error restritoPorPadrao é obrigatório: omitir não pode virar "livre" por acidente
export const semRestricao: ManifestoDeZona = { zona: 'z', perfis: [], concessoes: {}, modulos: [{ id: 'z.a', rotulo: 'A', prefixo: '/z' }] }
