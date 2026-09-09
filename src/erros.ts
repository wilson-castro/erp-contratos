export type CodigoErro =
  | 'REGISTRO_DESATUALIZADO'
  | 'OPERACAO_NAO_PERMITIDA'
  | 'SESSAO_EXPIRADA'
  | 'DESTINO_INVALIDO'
  | 'ERRO_INTERNO'

/** Texto público. Nunca nome de classe, SQL, stacktrace ou nome de framework. */
export const MENSAGENS: Record<CodigoErro, string> = {
  REGISTRO_DESATUALIZADO: 'Este registro mudou enquanto você trabalhava nele. Recarregue e tente de novo.',
  OPERACAO_NAO_PERMITIDA: 'Você não pode executar esta operação.',
  SESSAO_EXPIRADA: 'Sua sessão expirou. Entre novamente.',
  DESTINO_INVALIDO: 'Não foi possível concluir a operação.',
  ERRO_INTERNO: 'Não foi possível concluir a operação. Tente de novo em instantes.',
}
