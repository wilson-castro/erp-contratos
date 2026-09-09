import { ACOES_PEDIDO } from '../src/index.js'
import type { PedidoDTO, PermissoesPedido, AcaoPedido } from '../src/index.js'

const base = {
  id: '8821', status: 'ABERTO', versao: 42,
  fornecedor: { id: 'f1', nome: 'Fornecedor Um' },
  itens: [], remessas: [],
  _permissoes: { editar: false, remover_remessa: false, excluir: false, aprovar: false },
} satisfies Omit<PedidoDTO, 'condicaoComercial'>

/** Omitir é a única forma válida de não ter o bloco. */
export const semBloco: PedidoDTO = base

// @ts-expect-error `undefined` explícito quebra a ausência total (exactOptionalPropertyTypes)
export const comUndefined: PedidoDTO = { ...base, condicaoComercial: undefined }

// @ts-expect-error `null` é placeholder, e placeholder já informa que o bloco existe
export const comNull: PedidoDTO = { ...base, condicaoComercial: null }

// @ts-expect-error Record completo: faltar uma chave não compila
export const permissoesIncompletas: PermissoesPedido = { editar: true }

// @ts-expect-error string arbitrária não é ação
export const acaoInventada: AcaoPedido = 'cancelar'

/** A derivação é real: se AcaoPedido deixar de derivar da constante, isto para de compilar. */
export const derivacaoEhReal: readonly AcaoPedido[] = ACOES_PEDIDO
export const cobreTodaAcao: Record<(typeof ACOES_PEDIDO)[number], boolean> =
  {} as PermissoesPedido
