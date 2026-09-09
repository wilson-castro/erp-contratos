export type StatusPedido = 'RASCUNHO' | 'ABERTO' | 'EM_RISCO' | 'FATURADO'

export type AcaoPedido = 'editar' | 'remover_remessa' | 'excluir' | 'aprovar'

/** Fonte única da lista de ações. `PermissoesPedido` deriva dela. */
export const ACOES_PEDIDO = ['editar', 'remover_remessa', 'excluir', 'aprovar'] as const

/**
 * Record COMPLETO, nunca Partial. Ver 06-seguranca.md §9.3: um Partial permite
 * que uma ação ausente seja lida como `undefined`, e `undefined` é falsy — o que
 * esconde o botão em vez de falhar a compilação quando o contrato muda.
 */
export type PermissoesPedido = Record<AcaoPedido, boolean>

export type Fornecedor = { readonly id: string; readonly nome: string }

export type ItemDePedido = {
  readonly id: string
  readonly descricao: string
  readonly quantidade: number
}

export type Remessa = {
  readonly id: string
  readonly status: 'PREVISTA' | 'EM_TRANSITO' | 'ENTREGUE'
}

/** Bloco sensível. ACL própria no domínio Comercial. */
export type CondicaoComercial = {
  readonly precoNegociado: number
  readonly margem: number
  readonly contrato: string
}

/**
 * `condicaoComercial` é OPCIONAL e deve estar AUSENTE do objeto quando o ator
 * não tem o grupo — nunca `null`, nunca `{}`. Ver 06-seguranca.md §3.2:
 * ausência total, sem placeholder. Um `null` já informa que o bloco existe.
 */
export type PedidoDTO = {
  readonly id: string
  readonly status: StatusPedido
  readonly versao: number
  readonly fornecedor: Fornecedor
  readonly itens: readonly ItemDePedido[]
  readonly remessas: readonly Remessa[]
  readonly condicaoComercial?: CondicaoComercial
  readonly _permissoes: PermissoesPedido
}
