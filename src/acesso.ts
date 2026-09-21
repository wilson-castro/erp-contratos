/**
 * Contratos da gestão de acesso. São de plataforma, não de domínio: todo shell e toda
 * zona os usam, e nenhum deles fala de recurso de negócio. Ver ADR-0009.
 *
 * Nomes são sempre prefixados pela zona dona (`zona1.relatorios`, `zona1.analista`).
 * O prefixo é o que impede um perfil de uma zona de conceder módulo de outra (decisão D8).
 */

export type ModuloDeclarado = {
  readonly id: string
  readonly rotulo: string
  /** Prefixo de rota que o módulo ocupa, ex.: `/zona1/relatorios`. */
  readonly prefixo: string
  /** Restrito: só perfis com concessão explícita o veem. Livre: toda sessão válida o vê. */
  readonly restritoPorPadrao: boolean
}

export type PerfilDeclarado = { readonly id: string; readonly rotulo: string }

/** O que uma zona publica sobre si mesma. Versionado com o código da zona. */
export type ManifestoDeZona = {
  readonly zona: string
  readonly modulos: readonly ModuloDeclarado[]
  readonly perfis: readonly PerfilDeclarado[]
  /** Perfil → módulos que ele concede por padrão, só da própria zona. */
  readonly concessoes: Readonly<Record<string, readonly string[]>>
}

/** O que o domínio de gestão de acesso devolve para montar menu e decidir rota. */
export type ModuloPermitido = {
  readonly id: string
  readonly zona: string
  readonly rotulo: string
  readonly prefixo: string
}

export class ManifestoInvalido extends Error {
  constructor(motivo: string) {
    super(`manifesto invalido: ${motivo}`)
    this.name = 'ManifestoInvalido'
  }
}

const ID_ZONA = /^[a-z][a-z0-9-]{0,31}$/
/**
 * `plataforma` não é zona: perfis `plataforma.*` são globais e nascem no domínio de gestão
 * de acesso. Um manifesto que se dissesse `plataforma` criaria perfil que concede módulo de
 * qualquer zona.
 */
export const ZONAS_RESERVADAS: readonly string[] = ['plataforma']
const SEGMENTO = /^[a-z0-9][a-z0-9-]*$/

const ehTexto = (v: unknown): v is string => typeof v === 'string' && v.length > 0

function prefixoDaZona(zona: string, prefixo: string): boolean {
  // O shell é a única zona na raiz; qualquer outra vive sob `/<zona>`.
  if (zona === 'shell') return prefixo === '/'
  if (prefixo !== `/${zona}` && !prefixo.startsWith(`/${zona}/`)) return false
  return prefixo.split('/').slice(1).every((s) => SEGMENTO.test(s))
}

/**
 * Valida em tempo de execução, porque o manifesto atravessa rede até o domínio de gestão
 * de acesso, e o domínio não pode confiar no compilador de quem o enviou.
 */
export function validarManifesto(entrada: unknown): ManifestoDeZona {
  const m = entrada as Partial<ManifestoDeZona> | null
  if (!m || typeof m !== 'object') throw new ManifestoInvalido('não é objeto')
  if (!ehTexto(m.zona) || !ID_ZONA.test(m.zona)) throw new ManifestoInvalido('zona')
  if (ZONAS_RESERVADAS.includes(m.zona)) throw new ManifestoInvalido(`zona reservada: ${m.zona}`)
  const zona = m.zona
  const doPrefixo = (id: unknown) => ehTexto(id) && id.startsWith(`${zona}.`) && id.length > zona.length + 1

  if (!Array.isArray(m.modulos) || m.modulos.length === 0) throw new ManifestoInvalido('modulos')
  const modulos = new Set<string>()
  for (const mod of m.modulos) {
    if (!doPrefixo(mod?.id)) throw new ManifestoInvalido(`modulo fora da zona: ${String(mod?.id)}`)
    if (!ehTexto(mod.rotulo)) throw new ManifestoInvalido(`rotulo de ${mod.id}`)
    if (!ehTexto(mod.prefixo) || !prefixoDaZona(zona, mod.prefixo)) {
      throw new ManifestoInvalido(`prefixo de ${mod.id}`)
    }
    if (typeof mod.restritoPorPadrao !== 'boolean') throw new ManifestoInvalido(`restrito de ${mod.id}`)
    if (modulos.has(mod.id)) throw new ManifestoInvalido(`modulo duplicado: ${mod.id}`)
    modulos.add(mod.id)
  }

  if (!Array.isArray(m.perfis)) throw new ManifestoInvalido('perfis')
  const perfis = new Set<string>()
  for (const p of m.perfis) {
    if (!doPrefixo(p?.id)) throw new ManifestoInvalido(`perfil fora da zona: ${String(p?.id)}`)
    if (!ehTexto(p.rotulo)) throw new ManifestoInvalido(`rotulo de ${p.id}`)
    if (perfis.has(p.id)) throw new ManifestoInvalido(`perfil duplicado: ${p.id}`)
    perfis.add(p.id)
  }

  const concessoes = m.concessoes ?? {}
  if (typeof concessoes !== 'object') throw new ManifestoInvalido('concessoes')
  for (const [perfil, mods] of Object.entries(concessoes)) {
    if (!perfis.has(perfil)) throw new ManifestoInvalido(`concessao de perfil nao declarado: ${perfil}`)
    if (!Array.isArray(mods)) throw new ManifestoInvalido(`concessoes de ${perfil}`)
    for (const mod of mods) {
      if (!modulos.has(mod)) throw new ManifestoInvalido(`concessao para modulo de outra zona: ${String(mod)}`)
    }
  }

  return { zona, modulos: m.modulos, perfis: m.perfis, concessoes }
}

/** Açúcar para a zona: valida já no carregamento do módulo, não só no registro. */
export const definirManifesto = (m: ManifestoDeZona): ManifestoDeZona => validarManifesto(m)
