# @erp/contratos

Os **contratos** que todos compartilham: códigos de erro e mensagens, e o formato do manifesto de acesso de cada zona.

## Responsabilidades

O que esta parte faz, o que nunca faz e o vocabulário usado aqui (BFF, zona, Server Action…), explicados
do zero: [`docs/RESPONSABILIDADES.md`](https://github.com/ArtroxGabriel/nextjs-mfe/blob/bff-multizone/docs/RESPONSABILIDADES.md)
no repositório principal, seção 7.

## O que tem

- `erros.ts`: `CodigoErro` e `MENSAGENS`.
- `acesso.ts`: `ManifestoDeZona`, `ModuloPermitido`, `definirManifesto`, `validarManifesto` (prefixo da zona, concessão só dentro da zona, duplicatas).

## Comandos

```bash
pnpm install
pnpm test         # testes do manifesto
pnpm publicar     # build + publica no Verdaccio local (:4873)
```

**Nunca republique o mesmo número de versão**, nem em outra máquina: mudou, sobe a versão
(ADR-0010 no repositório principal). Ordem de publicação: `erp-contratos` → `erp-nucleo` →
`erp-moldura` → aplicações.

Depende de: nada.

A base inteira (subir, verificar ponta a ponta) é operada pelo repositório principal `nextjs-mfe`: veja o README de lá.
