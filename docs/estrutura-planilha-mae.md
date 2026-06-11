# Estrutura da Planilha Mãe

Esta estrutura prepara a Central Zumba do Cris para uma futura integração com
Google Sheets. Nesta fase, os dados continuam locais e simulados.

## Abas e colunas

### Alunos

`id`, `nome`, `whatsapp`, `email`, `plano`, `status`, `dataEntrada`,
`diaVencimento`, `turmaPrincipal`, `observacoes`

Status aceitos: `ativo`, `pendente`, `atrasado`, `inativo`.

### Planos

`id`, `nome`, `valor`, `aulasPorSemana`, `descricao`, `destaque`

### Turmas

`id`, `nome`, `local`, `dias`, `horario`, `endereco`, `capacidade`, `ativa`

Na futura leitura do Google Sheets, a coluna `dias` deverá ser convertida de um
texto como `terça,quinta` para um array.

### Aulas

`id`, `turmaId`, `data`, `diaSemana`, `horario`, `local`, `endereco`, `status`

Status aceitos: `agendada`, `realizada`, `cancelada`.

### Confirmacoes

`id`, `alunoId`, `aulaId`, `dataConfirmacao`, `status`

Status aceitos: `confirmado`, `cancelado`.

Uma confirmação representa somente a intenção da aluna. Ela nunca deve ser
somada diretamente à frequência.

### Presencas

`id`, `alunoId`, `aulaId`, `data`, `compareceu`, `validadoPor`, `observacao`

Somente registros desta aba, validados futuramente pelo professor, alimentam a
frequência da Área do Aluno.

### Pagamentos

`id`, `alunoId`, `plano`, `valor`, `vencimento`, `dataPagamento`, `status`,
`metodo`

Status aceitos: `pago`, `pendente`, `atrasado`.

Métodos aceitos: `pix`, `dinheiro`, `outro`.

### Desafios

`id`, `titulo`, `descricao`, `tipo`, `meta`, `ativo`, `statusVisual`

## Arquivos preparados

- `lib/student-data/types.ts`: contratos TypeScript das abas.
- `lib/student-data/mockData.ts`: dados locais que simulam a planilha.
- `lib/student-data/selectors.ts`: consultas e regras sobre os dados.
- `lib/student-data/index.ts`: ponto único de importação.
- `lib/services/alunoService.ts`: camada consumida pela Área do Aluno.

## Integração futura

Quando a API for implementada, a camada de leitura do Google Sheets deverá
transformar cada linha nos tipos de `types.ts`. A interface deve continuar
consumindo `lib/services/alunoService.ts`, evitando reescrever a Área do Aluno.

Uma evolução recomendada é criar um adaptador com a mesma estrutura exportada
por `mockData.ts`, alternando entre dados locais e dados remotos por configuração
de ambiente.
