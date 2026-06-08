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
- Avisos: edite `notices`
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

## Publicar na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Entre na Vercel e clique em `Add New Project`.
3. Selecione o repositório.
4. Mantenha as configurações padrão de Next.js.
5. Clique em `Deploy`.

A Vercel vai rodar `npm install` e `npm run build` automaticamente.
