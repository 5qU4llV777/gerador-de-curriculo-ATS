# Gerador de Currículos ATS-friendly

Gera um currículo em PDF a partir de um arquivo JSON, seguindo boas práticas
para ser corretamente lido por sistemas de rastreamento de candidatos (ATS).

## Instalação

```bash
npm install
```

## Uso

```bash
node gerar-curriculo.js data/exemplo.json
# ou especificando o nome do arquivo de saída:
node gerar-curriculo.js data/meus-dados.json MeuCurriculo.pdf
```

Se nenhum arquivo for informado, usa `data/exemplo.json` como demonstração.

## Como preencher seus dados

Copie `data/exemplo.json` para outro arquivo (ex: `data/meu-curriculo.json`)
e edite os campos:

- `nome`, `titulo`, `contato` (telefone, email, localizacao, linkedin, portfolio)
- `resumo`: um parágrafo curto de resumo profissional
- `experiencias`: lista de empregos, do mais recente para o mais antigo
- `educacao`, `habilidades`, `certificacoes`, `idiomas`

Todos os campos são opcionais exceto `nome` e `contato.email`.

## Por que este gerador é ATS-friendly?

- **Coluna única**: nada de layout em colunas, caixas de texto ou tabelas,
  que costumam bagunçar a ordem de leitura do parser do ATS.
- **Texto real, não imagem**: o PDF gerado tem texto selecionável (testado
  com extração via `pdftotext`), diferente de currículos "bonitos" feitos em
  design gráfico que às vezes viram imagem.
- **Fontes padrão** (Helvetica/Arial): evita fontes exóticas que podem falhar
  no parsing.
- **Sem ícones/gráficos**: símbolos usados para telefone, e-mail etc. às
  vezes não são lidos corretamente; aqui tudo é texto simples.
- **Seções com nomes convencionais**: "Experiência Profissional",
  "Educação", "Habilidades" — os termos que a maioria dos ATS procura.
- **Ordem cronológica reversa**: mantém a experiência mais recente primeiro,
  como os recrutadores esperam.
- **Sem cabeçalho/rodapé com dados de contato**: alguns ATS não leem texto
  em headers/footers; aqui o contato fica no corpo do documento.

## Personalizando o layout

As cores, fontes e tamanhos ficam centralizados no objeto `CONFIG` no topo
de `gerar-curriculo.js`. Você pode ajustar `pageSize` (ex: `"Letter"` para
vagas nos EUA), margens e tamanhos de fonte sem tocar no resto da lógica.

## Estrutura do projeto

```
curriculo-ats-gerador/
├── gerar-curriculo.js   # script principal
├── data/
│   └── exemplo.json     # dados de exemplo (edite uma cópia com seus dados)
├── package.json
└── README.md
```
