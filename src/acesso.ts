/**
 * Contratos da gestão de acesso. São de plataforma, não de domínio: todo shell e toda
 * zona os usam, e nenhum deles fala de recurso de negócio. Ver ADR-0009.
 *
 * Nomes são sempre prefixados pela zona dona (`zona1.relatorios`, `zona1.analista`).
 * O prefixo é o que impede um perfil de uma zona de conceder módulo de outra (decisão D8).
 */

/** @deprecated v1; a v2 usa `ManifestoDeModulo` (ADR-0014, adendo 1). */
export type ModuloDeclarado = {
  readonly id: string
  readonly rotulo: string
  /** Prefixo de rota que o módulo ocupa, ex.: `/zona1/relatorios`. */
  readonly prefixo: string
  /** Restrito: só perfis com concessão explícita o veem. Livre: toda sessão válida o vê. */
  readonly restritoPorPadrao: boolean
}

export type PerfilDeclarado = { readonly id: string; readonly rotulo: string }

/** @deprecated v1. O que uma zona publica sobre si mesma. Versionado com o código da zona. */
export type ManifestoDeZona = {
  readonly zona: string
  readonly modulos: readonly ModuloDeclarado[]
  readonly perfis: readonly PerfilDeclarado[]
  /** Perfil → módulos que ele concede por padrão, só da própria zona. */
  readonly concessoes: Readonly<Record<string, readonly string[]>>
}

/** @deprecated v1. O que o domínio de gestão de acesso devolvia para montar menu e decidir rota. */
export type ModuloPermitido = {
  readonly id: string
  readonly zona: string
  readonly rotulo: string
  readonly prefixo: string
}

// --- gestão de acesso v2 (ADR-0014, adendo 1) -----------------------------------------------

/**
 * Módulo com acesso efetivo. O id do módulo é o id da zona dona e o nome do serviço dela
 * (`svc.<zona>`); as funcionalidades são relativas ao módulo (`painel.ver`).
 */
export type ModuloEfetivo = {
  readonly id: string
  readonly nome: string
  readonly funcionalidades: readonly string[]
}

/**
 * O que o BFF guarda do acesso de quem está logado, e a única coisa que ele expõe às páginas.
 * Sem CPF, sem e-mail e sem a lista de papéis: `administra` diz só se a pessoa tem algum papel
 * administrativo (mostra a entrada da gestão de acesso). Quem decide cada ação é o domínio.
 */
export type AcessoEfetivo = {
  readonly modulos: readonly ModuloEfetivo[]
  readonly administra: boolean
}

/** Papel administrativo com escopo (unidade, módulo ou `*`). Não concede módulo. */
export type PapelComEscopo = { readonly papel: string; readonly escopo: string }

/**
 * Resposta crua de `GET /v2/eu`. Fica no servidor: o adaptador do núcleo a reduz a
 * `AcessoEfetivo` antes de qualquer página ver o resultado.
 */
export type Eu = {
  readonly pessoa: {
    readonly id: string
    readonly nome: string
    readonly cpf: string
    readonly unidade: string
    readonly emailFuncional: string
    readonly status: string
  }
  readonly papeis: readonly PapelComEscopo[]
  readonly modulos: readonly ModuloEfetivo[]
}

/** Resposta de `POST /v2/decisoes`. */
export type DecisaoDeAcesso = {
  readonly permitido: boolean
  readonly motivo: string | null
  readonly funcionalidades: readonly string[]
}

/** Evento de `GET /v2/eventos` (consumo no G5). `alvo` é o id da pessoa na gestão de acesso. */
export type EventoDeAcesso = {
  readonly seq: number
  readonly em: string
  readonly tipo: 'PESSOA_DESLIGADA' | 'ACESSO_REVOGADO' | 'PESSOA_SUSPENSA'
  readonly autor: string | null
  readonly alvo: string | null
  readonly modulo?: string
}

/**
 * Manifesto v2: a zona declara o próprio módulo e o catálogo de funcionalidades. Perfis e
 * concessões moram na gestão de acesso, não no código da zona (invariante 17).
 */
export type ManifestoDeModulo = {
  readonly id: string
  readonly nome: string
  readonly funcionalidades: readonly string[]
}

const FUNCIONALIDADE = /^[a-z0-9-]+\.[a-z0-9-]+$/

/** Funcionalidade relativa ao módulo: dois segmentos, `recurso.acao`. */
export const ehFuncionalidade = (f: unknown): f is string => typeof f === 'string' && FUNCIONALIDADE.test(f)

// --- gestão de acesso v1 (sai depois do G4) ---------------------------------------------------

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

/**
 * Valida o manifesto v2 em tempo de execução, pelo mesmo motivo do v1: ele atravessa rede.
 * O id é o da zona (e o do serviço que o envia); `plataforma` e `shell` não são módulos.
 */
export function validarManifestoDeModulo(entrada: unknown): ManifestoDeModulo {
  const m = entrada as Partial<ManifestoDeModulo> | null
  if (!m || typeof m !== 'object') throw new ManifestoInvalido('não é objeto')
  if (!ehTexto(m.id) || !ID_ZONA.test(m.id)) throw new ManifestoInvalido('id')
  if ([...ZONAS_RESERVADAS, 'shell'].includes(m.id)) throw new ManifestoInvalido(`id reservado: ${m.id}`)
  if (!ehTexto(m.nome)) throw new ManifestoInvalido('nome')
  if (!Array.isArray(m.funcionalidades) || m.funcionalidades.length === 0) throw new ManifestoInvalido('funcionalidades')
  const vistas = new Set<string>()
  for (const f of m.funcionalidades) {
    if (!ehFuncionalidade(f)) throw new ManifestoInvalido(`funcionalidade: ${String(f)}`)
    if (vistas.has(f)) throw new ManifestoInvalido(`funcionalidade duplicada: ${f}`)
    vistas.add(f)
  }
  return { id: m.id, nome: m.nome, funcionalidades: m.funcionalidades }
}

/** Açúcar para a zona: valida já no carregamento do módulo. */
export const definirManifestoDeModulo = (m: ManifestoDeModulo): ManifestoDeModulo => validarManifestoDeModulo(m)
