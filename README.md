# Verificador de Similaridade (Bun + TypeScript)

Aplicação simples para comparar dois textos, destacar trechos similares e exibir métricas de similaridade que fazem sentido para o que é destacado.

## Como executar

Pré‑requisito: Bun instalado.

1. Instale dependências e gere os assets do cliente
2. Inicie o servidor

### Passos

```
# Windows PowerShell
bun install
bun run build
bun run start
```

Abra http://localhost:3000 no navegador.

## O que é exibido

- Destaque de trechos similares diretamente sobre o texto a comparar, classificados como: exato, alto, médio, baixo.
- Métricas:
  - Cobertura (texto similar): porcentagem de caracteres do texto similar cobertos pelos trechos destacados.
  - Cobertura (texto original): porcentagem aproximada de caracteres do original que aparecem como correspondências.
  - LCS (tokens): tamanho da subsequência comum mais longa (LCS) em tokens, normalizado.
  - Jaccard 3-gram: similaridade de conjuntos de 3-gramas de tokens.
  - Cosseno (TF): similaridade de cosseno baseada em frequências de tokens.
  - Coeficiente de Overlap: interseção sobre o menor conjunto de tokens.

## Como funciona o destaque

- Tokenização preservando offsets de caracteres e normalização (minúsculas/sem diacríticos) para casar palavras de forma robusta.
- LCS em tokens para obter alinhamentos; agrupamos correspondências contíguas no texto similar e atribuímos uma força por densidade local.
- As porcentagens de cobertura são calculadas diretamente a partir dos trechos destacados, garantindo consistência entre destaque e métricas.

## Limitações e melhorias

- Segmentação por tokens simples; pode ser estendida com stemming/lemmatização para PT‑BR.
- Ajustar janelas e limiares de classificação conforme o domínio.
- Adicionar exportação de relatório e comparação sentença a sentença.

Licença: MIT
