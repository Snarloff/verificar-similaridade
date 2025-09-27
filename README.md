# Verificador de Similaridade

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge\&logo=bun\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge\&logo=typescript\&logoColor=white)

<img width="1650" height="1050" alt="screenshot" src="https://github.com/user-attachments/assets/a2277633-8f52-425b-8c16-7c2f6f4c5320" style="border-radius:12px" />

---

## Sobre o projeto

O **Verificador de Similaridade** é uma aplicação web desenvolvida em **Bun + TypeScript** para analisar e comparar dois textos.
Ele destaca visualmente os trechos semelhantes e apresenta métricas detalhadas de similaridade, tornando a experiência intuitiva tanto para quem só quer “ver onde os textos batem”, quanto para quem precisa de números confiáveis para análise mais profunda.

O projeto pode ser útil em cenários como:

* **Jurimetria**: comparação de petições, decisões e acórdãos.
* **Educação**: detecção de plágio ou trabalhos muito parecidos.
* **Revisão de documentos**: identificar redundâncias ou reaproveitamento de conteúdo.
* **Pesquisa linguística**: estudar padrões de escrita e proximidade lexical.

---

## Recursos principais

### 🎯 Destaque de similaridade

* Trechos semelhantes são **marcados em cores** no texto comparado.
* Classificação de intensidade: **exato, alto, médio, baixo**.
* O usuário enxerga claramente o “mapa” das semelhanças dentro do texto.

### 📊 Métricas de Similaridade

Cada comparação gera indicadores calculados diretamente a partir dos trechos destacados:

* **Cobertura (texto similar)** → porcentagem de caracteres do texto comparado que foram cobertos pelas correspondências.
* **Cobertura (texto original)** → porcentagem aproximada do texto original que aparece no comparado.
* **LCS (Longest Common Subsequence)** → tamanho da subsequência comum mais longa em tokens, normalizado. Ajuda a entender sequências contínuas de similaridade.
* **Jaccard 3-gram** → mede o quanto os conjuntos de 3-gramas (sequências de 3 tokens) se sobrepõem. Bom para capturar variações locais.
* **Cosseno (TF)** → similaridade baseada na frequência de tokens (quantas vezes cada palavra aparece). Útil para medir proximidade geral.
* **Coeficiente de Overlap** → interseção sobre o menor conjunto de tokens, mostrando a proporção de coincidências.

### ⚙️ Como funciona internamente

* O texto é **tokenizado** preservando a posição dos caracteres.
* Há normalização (minúsculas + remoção de acentos) para garantir comparações robustas.
* O algoritmo de **LCS em tokens** encontra alinhamentos; correspondências próximas são agrupadas.
* Cada grupo recebe uma classificação de força pela **densidade local**.
* As métricas são sempre consistentes com os trechos destacados na tela.

---

## Instalação e uso

Pré-requisito: [Bun](https://bun.sh) instalado.

```powershell
bun install
bun run build
bun run start
```

Depois, acesse:
👉 [http://localhost:3000](http://localhost:3000)

---

## Licença

Este projeto está sob a licença **MIT**.
Você pode usar, modificar e distribuir livremente, desde que mantenha a atribuição original.
