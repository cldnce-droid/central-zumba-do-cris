# Central Zumba do Cris

PWA premium em Next.js para alunos acessarem turmas, planos, avisos e links principais pelo celular.

## Rodar localmente

```bash
npm install
npm run dev
```

Depois abra:

```text
http://localhost:3000
```

## Onde editar as informações

As informações principais ficam em `lib/data.ts`.

- Horários e locais: edite `classes`
- Planos e valores: edite `plans`
- Mural da Comunidade: edite `notices`
- Área do Aluno e futura planilha mãe: edite `lib/student-data/mockData.ts`
- WhatsApp, Grupo, PIX e logo: edite `links`
- Imagens de apoio usadas nos cards e vitrines: edite `image` em `classes` e `referenceImages`

Os links estão como placeholders:

```ts
whatsapp: "#",
group: "#",
pix: "#"
```

Troque `#` pelos links reais quando estiver pronto.

## Referências visuais

As imagens usadas como referência ficam em `public/references`.

A logo é usada como imagem, sem redesenhar, recolorir ou recriar. Para trocar por uma versão mais limpa da logo oficial, coloque o arquivo em `public/references` e atualize `links.officialLogo` em `lib/data.ts`.

O visual premium do app usa as cores, energia, pinceladas e flyers da marca como referência, mantendo os arquivos originais preservados em `public/references`.

## Ícone do aplicativo

A arte usada somente como ícone da PWA fica em:

```text
public/icons/app-icon-source.png
```

Os arquivos derivados para Android, iPhone e navegadores ficam no mesmo
diretório: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` e
`favicon.ico`. Isso não altera nem substitui a logo oficial usada dentro do
aplicativo, que continua em `public/references`.

## Publicar na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Entre na Vercel e clique em `Add New Project`.
3. Selecione o repositório.
4. Mantenha as configurações padrão de Next.js.
5. Clique em `Deploy`.

A Vercel vai rodar `npm install` e `npm run build` automaticamente.

## Notificações push futuras

O Mural da Comunidade já solicita permissão com a Notification API e registra
`public/sw.js`. O service worker também já sabe receber eventos `push` e abrir
`/avisos` quando a aluna toca na notificação.

Para enviar notificações de verdade no futuro, ainda será necessário:

1. Criar um backend ou função serverless para salvar as inscrições.
2. Gerar uma chave VAPID.
3. Usar `registration.pushManager.subscribe(...)` no navegador.
4. Enviar os avisos pelo backend usando Web Push.

O ponto para conectar a inscrição futura é
`components/NotificationOptIn.tsx`. O recebimento fica em `public/sw.js`.

## Área do Aluno

A primeira versão fica em `/minha-area` e usa somente dados fictícios de
`lib/student-data/mockData.ts`. O seletor de Maria, Ana, Joana e Carla existe
para testar planos e status diferentes antes de implementar login, telefone,
planilha ou banco de dados.

Os tipos TypeScript das futuras abas ficam em
`lib/student-data/types.ts`. As regras ficam em
`lib/student-data/selectors.ts`, e a interface acessa os dados somente por
`lib/services/alunoService.ts`.

### Fase 1: presença e desafios

A confirmação da próxima aula é um estado local e representa somente a intenção
da aluna de participar. Ela não altera aulas no mês, sequência ou total de
presenças. A validação real ficará para uma integração futura com o Dashboard do
Professor.

Os desafios exibidos como `Em breve` ou `Bloqueado` podem ser editados no array
`desafios` em `lib/student-data/mockData.ts`. O botão `Adicionar à agenda`
também é apenas um placeholder visual nesta fase.

## Planilha mãe / Google Sheets

A Fase 2 organiza os dados em coleções equivalentes às abas `Alunos`, `Planos`,
`Turmas`, `Aulas`, `Confirmacoes`, `Presencas`, `Pagamentos` e `Desafios`.

Ainda não existe conexão com o Google Sheets. A Área do Aluno consome dados
simulados por meio de `lib/services/alunoService.ts`. A estrutura completa das
colunas e o caminho recomendado para a futura integração estão em
`docs/estrutura-planilha-mae.md`.

Importante: registros de `Confirmacoes` representam intenção de comparecimento.
Os números de frequência são calculados somente com registros validados de
`Presencas`.

## Fase 3: Área do Aluno conectada

O aluno padrão é `ALU001`, configurado em
`lib/services/alunoService.ts`. O seletor continua disponível somente para
testar os diferentes planos e status enquanto não existe login.

Perfil, plano, vencimento, pagamento, turmas, próxima aula, frequência,
conquistas e desafios agora vêm da camada de serviço. O botão de confirmação
continua sendo apenas um estado visual local e não grava em `Confirmacoes` ou
`Presencas`.
