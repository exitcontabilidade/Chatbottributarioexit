# Chatbot — Assistente Tributário (Reforma Tributária)

Chat web feito inteiro em JavaScript com **Next.js 16 + React 19**: a tela (React) e a API
(rotas do Next) ficam no mesmo projeto e rodam num servidor só. Pode ser instalado como
app (PWA) no celular ou no computador, mas instalar é opcional.

Planejamento completo (fases, decisões, fluxo, banco): pasta [`Infra/`](Infra/).

**Estado atual:** responde com as 210 perguntas cadastradas em `Perguntas/Perguntas.json`
(modo `faq`, sem IA). Login de **demonstração** (usuário `Admin`, senha `123`). Ainda não há
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

## Estrutura

```
app/
  layout.js               HTML base, título, ícones, cores do tema
  page.js                 página do chat (só para quem está logado)
  login/page.js           tela de login
  actions/auth.js         logout (Server Action)
  globals.css             visual (tema claro/escuro automático)
  manifest.js             dados do PWA (/manifest.webmanifest)
  api/auth/login/route.js POST /api/auth/login
  api/chat/route.js       POST /api/chat
  api/status/route.js     GET /api/status
components/               tela em React (cada um com seu .module.css)
  ChatApp.js              estrutura: barra lateral + chat, envio das mensagens
  LoginForm.js            formulário de login
  Sidebar.js              histórico de conversas (vira gaveta abaixo de 1024px), tema, instalar
  Welcome.js              tela inicial com cartões de perguntas
  MessageList.js          mensagens, "digitando…", perguntas relacionadas, botão "ir para o fim"
  Message.js              mensagem do usuário / do bot (fontes, aviso, copiar, erro)
  Composer.js             campo de mensagem
  ThemeToggle.js          tema Sistema / Claro / Escuro
  InstallButton.js        botão "Instalar app" (PWA)
hooks/useConversations.js várias conversas, salvas no navegador
lib/
  config.js               nome do bot, tela inicial, aviso, limites (vai para o navegador)
  api.js                  chamadas da tela para a API
  markdown.js             formatação das respostas (escapa todo HTML)
  storage.js              leitura/gravação das conversas no localStorage
  server/                 só roda no servidor (nunca vai para o navegador)
    settings.js           variáveis de ambiente (CHATBOT_*)
    auth.js               confere usuário e senha (hoje: usuário de demonstração)
    token.js, session.js  cookie de sessão assinado
    validation.js         confere o que chega em /api/chat
    responder.js          escolhe quem responde: faq ou mock (a IA entra aqui)
    faq.js                responde com as perguntas do JSON
    mock.js               respostas simuladas, para testar a tela
proxy.js                  redireciona para /login quem não está logado
public/                   ícones, service worker (sw.js)
Perguntas/Perguntas.json  perguntas e respostas que o bot sabe responder
```

## Perguntas cadastradas (modo `faq`, padrão)

O bot compara o que foi digitado com as perguntas do `Perguntas/Perguntas.json` e devolve a
resposta da mais parecida, mostrando em negrito qual pergunta está respondendo. Se nenhuma
for parecida o bastante, diz que não encontrou e sugere as mais próximas.

- Salvou o JSON: vale na próxima mensagem, sem reiniciar. Se o arquivo ficar com erro,
  o bot continua com a versão anterior e o erro aparece no terminal.
- A busca é por palavras, não entende sinônimos ("o que é IBS" pode cair em outra pergunta
  sobre IBS). Isso melhora com a IA; por enquanto as sugestões ajudam a achar a certa.
- Os limites de semelhança ficam no topo de `lib/server/faq.js`.

Cada pergunta pode ter fontes (opcional), que aparecem abaixo da resposta:

```json
{ "id": 36, "pergunta": "...", "resposta": "...",
  "fontes": [{ "norma": "LC 214/2025", "referencia": "art. X, § Y", "url": "https://..." }] }
```

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
