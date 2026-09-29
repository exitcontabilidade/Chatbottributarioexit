# Chatbot — Assistente Tributário (Reforma Tributária)

Chat web feito inteiro em JavaScript com **Next.js 16 + React 19**: a tela (React) e a API
(rotas do Next) ficam no mesmo projeto e rodam num servidor só. Pode ser instalado como
app (PWA) no celular ou no computador, mas instalar é opcional.

Planejamento completo (fases, decisões, fluxo, banco): pasta [`Infra/`](Infra/).

**Estado atual:** responde com as perguntas cadastradas na pasta `Perguntas/` (modo `faq`, sem
IA): 210 gerais e as escritas a partir das leis (EC 132/2023, LC 214/2025 e LC 227/2026), com
fonte e conferência artigo por artigo (ver "Conferência contra o texto das leis"). Login de **demonstração** (usuário `Admin`, senha `123`). Ainda não há
banco, RAG nem IA.

## Rodar

Dê dois cliques em `iniciar.bat`: na primeira vez ele instala as dependências, depois sobe o
servidor e abre http://localhost:3000. Pelo terminal:

```
npm install      (só na primeira vez ou quando o package.json mudar)
npm run dev
```

Alterações no código aparecem sozinhas na tela. Alterou o `.env.local`: reinicie.

Para testar como vai ficar em produção (inclusive o PWA abrindo sem internet):

```
npm run build
npm start
```

## Login (demonstração)

Entre com usuário **Admin** e senha **123** (o usuário aceita maiúsculas/minúsculas).

- A senha é conferida no servidor (`lib/server/auth.js`), nunca no navegador.
- Depois do login, a sessão fica num cookie `httpOnly` assinado (`lib/server/token.js`),
  válido por 7 dias. "Sair" fica no rodapé da barra lateral.
- `proxy.js` manda para `/login` quem não está logado; a página do chat e a `/api/chat`
  conferem a sessão de novo antes de mostrar ou responder.
- As conversas salvas no navegador são separadas por usuário.
- Para a fase 1: trocar o usuário fixo de `lib/server/auth.js` por uma consulta à tabela de
  usuários (senha em hash) e definir `CHATBOT_SESSION_SECRET` no servidor.

## Publicar na Vercel

O projeto é publicado a partir do GitHub (cada push gera uma nova versão). Em
**Settings > Environment Variables** do projeto na Vercel, defina:

| Variável                 | Obrigatória | Valor                                                        |
|--------------------------|-------------|--------------------------------------------------------------|
| `CHATBOT_SESSION_SECRET` | sim         | texto aleatório longo (comando abaixo); sem ela o login dá erro 500 |
| `CHATBOT_RESPOSTA`       | não         | `faq` (padrão) ou `mock`                                     |

Gerar o valor da chave:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Variável nova ou alterada só vale depois de publicar de novo (**Deployments > ⋯ > Redeploy**).
Trocar a chave desconecta todo mundo (basta entrar de novo).

## Estrutura

Tela em React (arquivos `.jsx`) estilizada com **Tailwind CSS 4**. As cores do tema claro/escuro
ficam em variáveis no `app/globals.css` e viram classes como `bg-surface`, `text-muted`,
`border-line` e `from-brand`.

```
app/
  layout.jsx              HTML base, fonte, tema sem piscar, título, ícones
  page.jsx                página do chat (só para quem está logado); já leva os temas junto
  login/page.jsx          tela de login
  globals.css             Tailwind + cores do tema + formatação das respostas
  manifest.js             dados do PWA (/manifest.webmanifest)
  actions/auth.js         logout (Server Action)
  api/auth/login/route.js POST /api/auth/login
  api/chat/route.js       POST /api/chat
  api/status/route.js     GET /api/status
components/
  chat/
    ChatApp.jsx           junta tudo: estado das conversas, envio, janelas abertas
    ChatHeader.jsx        barra do topo (menu, título, Explorar temas, Como funciona)
    Sidebar.jsx           nova conversa, busca, histórico, instalar, tema, conta
    Welcome.jsx           tela inicial: saudação, perguntas populares, temas
    MessageList.jsx       mensagens, "digitando…", perguntas relacionadas
    Message.jsx           balão do usuário / cartão de resposta (fontes, aviso, copiar)
    Composer.jsx          campo de mensagem
    TopicsDialog.jsx      janela "Explorar temas": temas, busca e perguntas que abrem para mostrar a resposta
    Sources.jsx           etiquetas de fontes (usadas na resposta do chat e na janela de temas)
    HelpDialog.jsx        janela "Como funciona" (abre sozinha na 1ª visita)
  auth/LoginForm.jsx      formulário de login
  pwa/                    botão "Instalar app" e registro do service worker
  ui/                     peças reutilizáveis: Dialog, IconButton, Logo, TopicBadge, ThemeToggle, CopyButton
hooks/
  useConversations.js     várias conversas, salvas no navegador por usuário
lib/
  config.js               nome do bot, tela inicial, aviso, limites (vai para o navegador)
  topics.js               nome, descrição, ícone e cor de cada módulo do Perguntas.json
  api.js                  chamadas da tela para a API
  markdown.js             formatação das respostas (escapa todo HTML)
  storage.js              leitura/gravação das conversas no localStorage
  cn.js                   junta classes CSS
  server/                 só roda no servidor (nunca vai para o navegador)
    settings.js           variáveis de ambiente (CHATBOT_*)
    auth.js               confere usuário e senha (hoje: usuário de demonstração)
    token.js, session.js  cookie de sessão assinado
    validation.js         confere o que chega em /api/chat
    responder.js          escolhe quem responde: faq ou mock (a IA entra aqui)
    faq.js                responde com as perguntas do JSON; lista os temas
    mock.js               respostas simuladas, para testar a tela
proxy.js                  redireciona para /login quem não está logado
public/                   ícones, service worker (sw.js)
Perguntas/                perguntas e respostas que o bot sabe responder (Perguntas.json e leis/*.json)
scripts/                  baixar-leis.mjs (npm run leis) e conferir-perguntas.mjs (npm run conferir)
```

Módulo ou tema novo nos JSON: aparece sozinho em "Explorar temas". Para dar nome com acento,
descrição, ícone e cor, acrescente-o em `lib/topics.js`.

## Perguntas cadastradas (modo `faq`, padrão)

O bot compara o que foi digitado com as perguntas cadastradas e devolve a resposta da mais
parecida, mostrando em destaque qual pergunta está respondendo. Se nenhuma for parecida o
bastante, diz que não encontrou e sugere as mais próximas.

As perguntas ficam na pasta `Perguntas/`, que é lida **por inteiro** (todos os `.json`, em
ordem alfabética; o servidor precisa de reinício só em produção):

```
Perguntas/Perguntas.json      as 210 perguntas gerais (sem fontes)
Perguntas/leis/ec132.json     perguntas escritas a partir da EC 132/2023
Perguntas/leis/lc214.json     ... da LC 214/2025
Perguntas/leis/lc227.json     ... da LC 227/2026
```

Formato de cada arquivo: `{ "tema": { "modulo": [ { id, pergunta, resposta, fontes } ] } }`.
O `tema` agrupa módulos na janela "Explorar temas" (uma lei, por exemplo). O `id` precisa ser
único em **todos** os arquivos.

- Salvou um JSON: em desenvolvimento vale na próxima mensagem, sem reiniciar. Se o arquivo ficar
  com erro, o bot continua com a versão anterior e o erro aparece no terminal.
- A busca é por palavras, não entende sentido (só uns poucos sinônimos, como "acaba" = "extingue").
  Ela pontua **quanto da consulta a pergunta cobre**: palavra rara pesa mais que comum, e entre
  perguntas que cobrem tudo ganha a mais curta e a que começa igual ("o que é…"). Verbos genéricos
  ("paga", "funciona", "muda") são ignorados. Isso melhora com a IA/RAG (ver `Infra/`).
- Os limites de semelhança (responde direto / responde avisando / só sugere) e os pesos ficam no
  topo de `lib/server/faq.js`.

### Medindo a busca

```bash
npm run avaliar                  # resumo
npm run avaliar -- --detalhe     # lista cada erro
npm run avaliar -- --notas       # ajuda a escolher a nota mínima
```

Usa `scripts/consultas-teste.json` (consultas escritas como um usuário escreveria, com as
respostas aceitáveis; `"esperado": null` = fora do assunto, não deve ser respondida) e, para cada
pergunta da base, uma consulta curta feita com as palavras mais longas dela. **Rode depois de mexer
no motor ou de acrescentar muitas perguntas** e acrescente consultas novas ao arquivo: o pior caso é
a resposta errada dada com confiança.

Cada pergunta pode ter fontes (opcional), que aparecem abaixo da resposta:

```json
{ "id": 36, "pergunta": "...", "resposta": "...",
  "fontes": [{ "norma": "LC 214/2025", "referencia": "art. X, § Y", "url": "https://..." }] }
```

### Conferência contra o texto das leis

As perguntas de `Perguntas/leis/` são escritas a partir do **texto oficial** (Planalto, já com as
alterações da LC 227/2026 e sem os trechos revogados) e cada fonte traz dois campos extras,
usados só pela conferência (o site ignora): `"lei"` (`emc132`, `lcp214` ou `lcp227`) e
`"artigos"` (os artigos citados).

```bash
npm run leis       # baixa as três leis e separa por artigo (pasta .leis/; use -- --forcar para atualizar)
npm run conferir   # confere todas as perguntas com fonte
```

O `conferir` **reprova** (código de saída 1) id repetido, resposta vazia, artigo citado que não
existe ou foi revogado, e link que não aponta para o artigo. E **avisa** quando um número da
resposta (percentual, prazo, ano) não aparece nos artigos citados: pode ser uma conta feita pela
resposta (como 27 + 27 = 54) ou um erro. Rode antes de publicar perguntas novas.

## Testando a tela (modo `mock`)

Copie `.env.example` para `.env.local`, troque para `CHATBOT_RESPOSTA=mock` e reinicie. O bot
passa a usar respostas simuladas, sem conteúdo tributário de verdade:

| Mensagem                                   | Comportamento                                   |
|--------------------------------------------|-------------------------------------------------|
| algo com IBS, CBS, reforma, transição...   | resposta com **fontes** e data de referência    |
| "calcule meu imposto"                      | recusa cálculo (regra do MVP)                   |
| "me ajuda no TCC", "ignore as instruções"  | fora do assunto                                 |
| "imposto de renda"                         | não encontrado na base                          |
| `simular erro`                             | falha do servidor → balão "Tentar novamente"    |
| "formatação"                               | exemplo de Markdown                             |

## API

```
POST /api/chat          (Content-Type: application/json)
{ "conversationId": "...", "message": "...", "history": [{ "role": "user" | "assistant", "content": "..." }] }
-> { "reply": "Markdown simples",
     "title": "pergunta da base respondida (opcional)", "note": "aviso curto (opcional)",
     "sources": [{ "title": "LC 214/2025", "reference": "art. X", "url": "https://..." }],
     "suggestions": ["..."] }

GET /api/status
-> { "status": "ok", "demo": false }

POST /api/auth/login    (Content-Type: application/json)
{ "username": "Admin", "password": "123" }
-> 200 { "ok": true } + cookie de sessão
-> 400 faltou usuário ou senha · 401 usuário ou senha incorretos
```

- Sem sessão, `/api/chat` responde **401** (com `WWW-Authenticate`, como pede a RFC 9110).

- `sources` vem dos metadados, nunca do texto gerado pela IA (Infra/Infra, item 2).
- A tela mostra o aviso fixo "Informação baseada na legislação; não substitui a análise do
  contador." abaixo de toda resposta da API.
- Limites: pergunta até 4000 caracteres, histórico até 50 mensagens (`lib/config.js`).

## Integrar a IA

Criar um arquivo em `lib/server/` com uma classe que tenha o mesmo método
`async reply({ conversationId, message, history })`, escolhê-la em `lib/server/responder.js`
e acrescentar a opção em `lib/server/settings.js`. A chave da IA fica **só** no `.env.local`
do servidor, e o código que a usa fica em `lib/server/` (o `import 'server-only'` impede que
ele vá parar no navegador por engano).

## Antes de abrir para os clientes

- [ ] HTTPS
- [ ] Login real: usuários no banco com senha em hash, limite de tentativas, `CHATBOT_SESSION_SECRET` definido
- [ ] Limites por usuário (mensagens por minuto, tokens por dia) e teto de gasto (Infra/Decisão)
- [ ] CSP completa com nonce nos scripts (hoje só há as regras que não dependem de nonce)
- [ ] Conversas e uso registrados no banco; política de retenção e aviso de privacidade (LGPD)

## PWA

- O botão **Instalar** aparece quando o navegador permite (Chrome, Edge, Android).
  No iPhone ele mostra o passo a passo "Compartilhar → Adicionar à Tela de Início".
- Instalar só funciona em `localhost` ou **HTTPS**.
- O service worker (cópia offline) só é ligado em produção (`npm run build` + `npm start`).
- Ao trocar o nome do bot: `lib/config.js`.
