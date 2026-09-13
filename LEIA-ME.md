# Meu Planner — PWA instalável

Este pacote contém o **Meu Planner** pronto para funcionar como um
aplicativo instalável (PWA) no Android e no iPhone, mantendo 100% do
design e das funcionalidades originais (tarefas, hábitos,
autocuidado, diário, desejos, projetos, metas, dinheiro e escala).

## Arquivos incluídos

```
meu-planner-pwa/
├── index.html            → página principal do app
├── app.jsx                → todo o código React do planner (com persistência local)
├── manifest.json           → metadados do PWA (nome, ícones, cores)
├── service-worker.js       → cache offline e app shell
└── icons/                  → ícones em vários tamanhos (normal e maskable)
```

## ⚠️ Importante: onde hospedar

Navegadores só registram Service Workers (necessários para
instalação e uso offline) em endereços **HTTPS** ou **localhost** —
nunca abrindo o `index.html` direto do disco (`file://`).

Opções simples e gratuitas para publicar:

1. **GitHub Pages** — crie um repositório, suba esta pasta e ative o
   Pages nas configurações do repositório.
2. **Netlify / Vercel** — arraste a pasta no painel de deploy manual
   ("drag and drop").
3. **Teste local rápido**, na sua própria máquina (com Node instalado):
   ```bash
   cd meu-planner-pwa
   npx serve .
   ```
   e acesse o endereço `http://localhost:...` mostrado no terminal.

Depois de publicado, acesse a URL pelo navegador do celular.

## 📲 Como instalar na tela inicial

**Android (Chrome):**
1. Abra a URL do app no Chrome.
2. Toque no menu (⋮) → **"Adicionar à tela inicial"** ou aguarde o
   banner automático de instalação aparecer.

**iPhone (Safari):**
1. Abra a URL do app no Safari (precisa ser o Safari, não outro navegador).
2. Toque no ícone de compartilhar (□ com seta para cima).
3. Escolha **"Adicionar à Tela de Início"**.

O app abrirá em tela cheia, sem a barra de endereço do navegador,
como um aplicativo nativo.

## 💾 Salvamento dos dados

Todos os dados (tarefas, hábitos, diário, finanças etc.) são salvos
automaticamente no **armazenamento local do próprio celular**
(`localStorage`), a cada alteração — não é necessário internet nem
login. Os dados continuam salvos mesmo fechando o app, e só são
apagados se o usuário limpar os dados do navegador/app manualmente.

## 🌐 Funcionamento offline

Depois do primeiro carregamento (que precisa de internet para baixar
o React e as demais bibliotecas), o Service Worker guarda em cache
tanto os arquivos do app quanto essas bibliotecas externas. Nas
próximas vezes, o app abre e funciona normalmente mesmo sem conexão.
Se alguma biblioteca externa ainda não tiver sido cacheada (ex.:
primeiro uso foi interrompido), o app tentará buscá-la novamente
quando a internet voltar.

## 🔧 Sem necessidade de build

Este projeto **não precisa** de `npm install`, Webpack, Vite ou
qualquer bundler. O `index.html` carrega React, ReactDOM, Recharts e
lucide-react diretamente via *import map* (ESM), e o Babel Standalone
traduz o JSX do `app.jsx` no próprio navegador. Isso mantém o projeto
simples de hospedar em qualquer servidor de arquivos estáticos.
